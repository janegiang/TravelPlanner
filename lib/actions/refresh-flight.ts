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
// TYPES
// ======================================

type FlightLookupData = Awaited<ReturnType<typeof lookupFlight>>;

// ======================================
// AIRPORT TIMEZONES
// ======================================

// Airport-local arrival times must be
// interpreted using the arrival airport's
// timezone, not the server's timezone.
//
// Expand this mapping as your application
// supports additional airports.

const AIRPORT_TIMEZONES: Record<string, string> = {
  // United States
  LAX: "America/Los_Angeles",
  SFO: "America/Los_Angeles",
  SNA: "America/Los_Angeles",
  SEA: "America/Los_Angeles",
  LAS: "America/Los_Angeles",
  PHX: "America/Phoenix",
  DEN: "America/Denver",
  DFW: "America/Chicago",
  ORD: "America/Chicago",
  IAH: "America/Chicago",
  ATL: "America/New_York",
  JFK: "America/New_York",
  EWR: "America/New_York",
  LGA: "America/New_York",
  BOS: "America/New_York",
  MIA: "America/New_York",
  MCO: "America/New_York",

  // Canada
  YYZ: "America/Toronto",
  YUL: "America/Toronto",
  YVR: "America/Vancouver",
  YYC: "America/Edmonton",

  // Asia
  ICN: "Asia/Seoul",
  GMP: "Asia/Seoul",
  NRT: "Asia/Tokyo",
  HND: "Asia/Tokyo",
  KIX: "Asia/Tokyo",
  TPE: "Asia/Taipei",
  HKG: "Asia/Hong_Kong",
  SIN: "Asia/Singapore",
  BKK: "Asia/Bangkok",
  MNL: "Asia/Manila",

  // Europe
  LHR: "Europe/London",
  LGW: "Europe/London",
  CDG: "Europe/Paris",
  AMS: "Europe/Amsterdam",
  FRA: "Europe/Berlin",
  FCO: "Europe/Rome",

  // Oceania
  SYD: "Australia/Sydney",
  MEL: "Australia/Melbourne",
  AKL: "Pacific/Auckland",
};

// ======================================
// DATE HELPERS
// ======================================

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  const values: Record<string, number> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  }

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

// ======================================
// CONVERT AIRPORT LOCAL TIME TO UTC
// ======================================

function airportLocalTimeToUTC(
  dateValue: string,
  timeValue: string,
  timeZone: string,
): number | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);

  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeValue);

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);

  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  const localAsUTC = Date.UTC(year, month - 1, day, hour, minute, 0);

  // Reject invalid calendar dates.
  const checkDate = new Date(localAsUTC);

  if (
    checkDate.getUTCFullYear() !== year ||
    checkDate.getUTCMonth() !== month - 1 ||
    checkDate.getUTCDate() !== day
  ) {
    return null;
  }

  try {
    // Start with a UTC approximation.
    let candidate = localAsUTC;

    // Resolve the timezone offset.
    for (let attempt = 0; attempt < 3; attempt++) {
      const zoned = getTimeZoneParts(new Date(candidate), timeZone);

      const zonedAsUTC = Date.UTC(
        zoned.year,
        zoned.month - 1,
        zoned.day,
        zoned.hour,
        zoned.minute,
        zoned.second,
      );

      const difference = localAsUTC - zonedAsUTC;

      candidate += difference;

      if (difference === 0) {
        break;
      }
    }

    // Verify the resolved local time.
    const verified = getTimeZoneParts(new Date(candidate), timeZone);

    if (
      verified.year !== year ||
      verified.month !== month ||
      verified.day !== day ||
      verified.hour !== hour ||
      verified.minute !== minute
    ) {
      return null;
    }

    return candidate;
  } catch {
    return null;
  }
}

// ======================================
// CHECK COMPLETED FLIGHT
// ======================================

function hasFlightPassedArrival(
  arrivalDate: string | null,
  arrivalTime: string | null,
  arrivalAirport: string,
): boolean {
  if (!arrivalDate || !arrivalTime) {
    return false;
  }

  const airportCode = arrivalAirport.trim().toUpperCase();

  const timeZone = AIRPORT_TIMEZONES[airportCode];

  if (!timeZone) {
    return false;
  }

  const arrivalTimestamp = airportLocalTimeToUTC(
    arrivalDate,
    arrivalTime,
    timeZone,
  );

  if (arrivalTimestamp === null) {
    return false;
  }

  return Date.now() >= arrivalTimestamp;
}

// ======================================
// CHECK PROTECTED FLIGHT STATUS
// ======================================

function isProtectedStatus(status: string): boolean {
  const normalized = status.trim().toLowerCase();

  // Preserve confirmed final statuses.
  //
  // Landed, En Route, and Active are
  // intentionally not protected because
  // your requested behavior allows them
  // to transition to Completed after the
  // expected arrival time has passed.
  //
  // Cancelled, Diverted, and Completed
  // remain protected.

  return (
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "diverted" ||
    normalized === "completed"
  );
}

// ======================================
// CHECK MISSING FLIGHT ERROR
// ======================================

function isMissingFlightError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message ===
      "No matching flight was found for this flight number and departure date."
  );
}

// ======================================
// REFRESH FLIGHT
// ======================================

export async function refreshFlight(flightId: string, tripId: string) {
  // ======================================
  // 1. AUTHENTICATION
  // ======================================

  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be signed in to refresh a flight.");
  }

  // ======================================
  // 2. VALIDATE REQUEST
  // ======================================

  if (
    typeof flightId !== "string" ||
    !flightId.trim() ||
    typeof tripId !== "string" ||
    !tripId.trim()
  ) {
    throw new Error("Invalid flight refresh request.");
  }

  // ======================================
  // 3. VERIFY TRIP AND FLIGHT OWNERSHIP
  // ======================================

  const flight = await prisma.flight.findFirst({
    where: {
      id: flightId,
      tripId,
      trip: {
        userId: session.user.id,
      },
    },
    select: {
      id: true,
      tripId: true,
      flightNumber: true,
      departureDate: true,
      arrivalDate: true,
      arrivalTime: true,
      arrivalAirport: true,
      status: true,
    },
  });

  if (!flight) {
    throw new Error("Flight not found or access denied.");
  }

  // ======================================
  // 4. VALIDATE SAVED FLIGHT INFORMATION
  // ======================================

  const flightNumber = normalizeFlightNumber(flight.flightNumber);

  const departureDate = validateFlightDate(flight.departureDate);

  // ======================================
  // 5. LOOK UP LATEST FLIGHT INFORMATION
  // ======================================

  let flightDetails: FlightLookupData | null = null;

  try {
    flightDetails = await lookupFlight(flightNumber, departureDate, {
      allowFallback: false,
    });
  } catch (error) {
    // ======================================
    // HANDLE MISSING AIRLABS FLIGHT
    // ======================================

    // Only use the completion fallback when
    // AirLabs returns no matching flight.
    //
    // Do not silently convert API errors,
    // authentication failures, or network
    // failures into Completed.

    if (!isMissingFlightError(error)) {
      console.error("Flight refresh lookup failed:", error);

      throw new Error(
        error instanceof Error
          ? error.message
          : "Could not retrieve updated flight information.",
      );
    }

    // ======================================
    // CHECK SAVED ARRIVAL TIME
    // ======================================

    const arrivalPassed = hasFlightPassedArrival(
      flight.arrivalDate,
      flight.arrivalTime,
      flight.arrivalAirport,
    );

    // Preserve cancelled, diverted,
    // and already completed flights.
    const protectedStatus = isProtectedStatus(flight.status);

    if (!arrivalPassed || protectedStatus) {
      throw new Error(
        "AirLabs has no matching flight update available. Your saved flight information has not been changed.",
      );
    }

    // ======================================
    // MARK FLIGHT AS COMPLETED
    // ======================================

    // Under your requested time-based rule,
    // a saved Landed or En Route flight may
    // become Completed after its expected
    // arrival time has passed.
    //
    // This does not confirm actual landing.

    const result = await prisma.flight.updateMany({
      where: {
        id: flightId,
        tripId,
        trip: {
          userId: session.user.id,
        },
        flightNumber: flight.flightNumber,
        departureDate: flight.departureDate,
        status: flight.status,
      },
      data: {
        status: "completed",
      },
    });

    if (result.count !== 1) {
      throw new Error(
        "The flight was changed or deleted while refreshing. Please reload and try again.",
      );
    }

    revalidatePath(`/trips/${tripId}`);

    return {
      success: true,
      flightId,
      message: "Flight marked as completed based on its saved arrival time.",
    };
  }

  // ======================================
  // 6. VERIFY MATCHED FLIGHT
  // ======================================

  if (flightDetails.departureDate !== departureDate) {
    throw new Error(
      "The returned flight does not match the saved departure date.",
    );
  }

  // ======================================
  // 7. UPDATE FLIGHT IN DATABASE
  // ======================================

  // Recheck ownership in the update query.
  // Only update fields supported by the
  // current Prisma Flight model.

  const result = await prisma.flight.updateMany({
    where: {
      id: flightId,
      tripId,
      trip: {
        userId: session.user.id,
      },
      flightNumber: flight.flightNumber,
      departureDate: flight.departureDate,
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

  if (result.count !== 1) {
    throw new Error(
      "The flight was changed or deleted while refreshing. Please reload and try again.",
    );
  }

  // ======================================
  // 8. REVALIDATE TRIP PAGE
  // ======================================

  revalidatePath(`/trips/${tripId}`);

  // ======================================
  // 9. RETURN SUCCESS
  // ======================================

  return {
    success: true,
    flightId,
    message: "Flight information updated successfully.",
  };
}
