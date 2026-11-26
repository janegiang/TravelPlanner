"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { revalidatePath } from "next/cache";

import {
  lookupFlight,
  normalizeFlightNumber,
  validateFlightDate,
} from "@/lib/flight-lookup";

// ======================================
// ADD FLIGHT
// ======================================

export async function addFlight(formData: FormData, tripId: string) {
  // ======================================
  // 1. AUTHENTICATION
  // ======================================

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("You must be signed in to add a flight.");
  }

  // ======================================
  // 2. VALIDATE TRIP ID
  // ======================================

  if (typeof tripId !== "string" || !tripId.trim()) {
    throw new Error("Invalid trip.");
  }

  // ======================================
  // 3. VERIFY TRIP OWNERSHIP
  // ======================================

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!trip) {
    throw new Error("Trip not found or access denied.");
  }

  // ======================================
  // 4. READ FORM VALUES
  // ======================================

  const rawFlightNumber = formData.get("flightNumber");

  const rawFlightDate = formData.get("userFlightDate");

  if (
    typeof rawFlightNumber !== "string" ||
    typeof rawFlightDate !== "string"
  ) {
    throw new Error("Please enter a flight number and departure date.");
  }

  // ======================================
  // 5. VALIDATE INPUT
  // ======================================

  const flightNumber = normalizeFlightNumber(rawFlightNumber);

  const departureDate = validateFlightDate(rawFlightDate);

  // ======================================
  // 6. PREVENT DUPLICATE FLIGHTS
  // ======================================

  const existingFlight = await prisma.flight.findFirst({
    where: {
      tripId,
      flightNumber: {
        equals: flightNumber,
        mode: "insensitive",
      },
      departureDate,
    },
    select: {
      id: true,
    },
  });

  if (existingFlight) {
    throw new Error("This flight has already been added to your trip.");
  }

  // ======================================
  // 7. LOOK UP FLIGHT DETAILS
  // ======================================

  // Preserve existing Add Flight behavior:
  // If AirLabs returns no matching flight,
  // save a placeholder record.
  //
  // API/network errors still throw an error.
  //
  // lookupFlight calculates the flight status
  // using AirLabs timestamps, including
  // whether the expected arrival has passed.

  const flightDetails = await lookupFlight(flightNumber, departureDate, {
    allowFallback: true,
  });

  // ======================================
  // 7A. DETERMINE STATUS WHEN ADDING
  // ======================================

  // A matching flight whose arrival time
  // has passed is returned as Completed
  // by lookupFlight().
  //
  // Preserve all other calculated statuses.
  //
  // Do not mark unmatched placeholder flights
  // as Completed because their arrival time
  // is unknown.

  const flightStatus =
    flightDetails.status === "completed" ? "completed" : flightDetails.status;

  // ======================================
  // 8. RECHECK DUPLICATES AND OWNERSHIP
  // ======================================

  // Recheck inside a transaction to reduce
  // the chance of duplicate records from
  // rapid submissions.

  await prisma.$transaction(async (tx) => {
    const ownedTrip = await tx.trip.findFirst({
      where: {
        id: tripId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!ownedTrip) {
      throw new Error("Trip not found or access denied.");
    }

    const duplicate = await tx.flight.findFirst({
      where: {
        tripId,
        flightNumber: {
          equals: flightNumber,
          mode: "insensitive",
        },
        departureDate,
      },
      select: {
        id: true,
      },
    });

    if (duplicate) {
      throw new Error("This flight has already been added to your trip.");
    }

    // ======================================
    // 9. SAVE FLIGHT
    // ======================================

    await tx.flight.create({
      data: {
        flightNumber: flightDetails.flightNumber,

        airline: flightDetails.airline,

        // ======================================
        // DEPARTURE INFORMATION
        // ======================================

        departureAirport: flightDetails.departureAirport,

        departureDate: flightDetails.departureDate,

        departureTime: flightDetails.departureTime,

        // Departure terminal and gate
        departureTerminal: flightDetails.departureTerminal,

        departureGate: flightDetails.departureGate,

        // ======================================
        // ARRIVAL INFORMATION
        // ======================================

        arrivalAirport: flightDetails.arrivalAirport,

        arrivalDate: flightDetails.arrivalDate,

        arrivalTime: flightDetails.arrivalTime,

        // Arrival terminal and gate
        arrivalTerminal: flightDetails.arrivalTerminal,

        arrivalGate: flightDetails.arrivalGate,

        // ======================================
        // FLIGHT STATUS
        // ======================================

        // Save Completed immediately when
        // lookupFlight confirms that the
        // matching flight's arrival time
        // has already passed.

        status: flightStatus,

        tripId,
      },
    });
  });

  // ======================================
  // 10. REFRESH TRIP DATA
  // ======================================

  revalidatePath(`/trips/${tripId}`);

  // ======================================
  // 11. RETURN SUCCESS
  // ======================================

  // Do not call redirect() here.
  // The client component will navigate after
  // the server action completes successfully.

  return {
    success: true,
  };
}
