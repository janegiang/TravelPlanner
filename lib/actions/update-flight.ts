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
// UPDATE FLIGHT
// ======================================

export async function updateFlight(
  flightId: string,
  tripId: string,
  formData: FormData,
) {
  // ======================================
  // 1. AUTHENTICATION
  // ======================================

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated.");
  }

  if (!session?.user?.id) {
    throw new Error("You must be signed in to edit a flight.");
  }

  // ======================================
  // 2. VALIDATE IDS
  // ======================================

  if (
    typeof flightId !== "string" ||
    !flightId.trim() ||
    typeof tripId !== "string" ||
    !tripId.trim()
  ) {
    throw new Error("Invalid flight or trip.");
  }

  // ======================================
  // 3. VERIFY OWNERSHIP
  // ======================================

  const existingFlight = await prisma.flight.findFirst({
    where: {
      id: flightId,
      tripId,
      trip: {
        userId: session.user.id,
      },
    },
    select: {
      id: true,
      flightNumber: true,
      departureDate: true,
      tripId: true,
    },
  });

  if (!existingFlight) {
    throw new Error("Flight not found or access denied.");
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
  // 6. CHECK FOR DUPLICATES
  // ======================================

  const duplicateFlight = await prisma.flight.findFirst({
    where: {
      tripId,
      id: {
        not: flightId,
      },
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

  if (duplicateFlight) {
    throw new Error("This flight has already been added to your trip.");
  }

  // ======================================
  // 7. AUTOMATIC AIRLABS LOOKUP
  // ======================================

  // Strict lookup:
  // Do not overwrite existing flight information
  // with fallback data when no matching flight exists.
  const flightDetails = await lookupFlight(flightNumber, departureDate, {
    allowFallback: false,
  });

  // ======================================
  // 8. UPDATE FLIGHT IN TRANSACTION
  // ======================================

  await prisma.$transaction(async (tx) => {
    // Verify ownership again before saving.
    const ownedFlight = await tx.flight.findFirst({
      where: {
        id: flightId,
        tripId,
        trip: {
          userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!ownedFlight) {
      throw new Error("Flight not found or access denied.");
    }

    // Check duplicates again before updating.
    const duplicate = await tx.flight.findFirst({
      where: {
        tripId,
        id: {
          not: flightId,
        },
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

    // Save updated flight information.
    await tx.flight.update({
      where: {
        id: flightId,
        tripId,
      },
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

        status: flightDetails.status,
      },
    });
  });

  // ======================================
  // 9. REFRESH TRIP DATA
  // ======================================

  revalidatePath(`/trips/${tripId}`);

  return {
    success: true,
  };
}
