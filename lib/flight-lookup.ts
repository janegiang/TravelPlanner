import "server-only";

// ======================================
// TYPES
// ======================================

export interface FlightLookupResult {
  flightNumber: string;
  airline: string;
  departureAirport: string;
  departureDate: string;
  departureTime: string | null;

  // Departure terminal and gate
  departureTerminal: string | null;
  departureGate: string | null;

  arrivalAirport: string;
  arrivalDate: string | null;
  arrivalTime: string | null;

  // Arrival terminal and gate
  arrivalTerminal: string | null;
  arrivalGate: string | null;

  status: string;
}

export interface FlightLookupOptions {
  /**
   * true:
   * Return placeholder information when AirLabs
   * cannot find the requested flight.
   *
   * false:
   * Throw an error when no matching flight exists.
   * Use false for Edit Flight and Refresh Flight.
   */
  allowFallback?: boolean;
}

interface AirLabsFlight {
  flight_iata?: string | null;
  airline_name?: string | null;
  airline_iata?: string | null;

  dep_iata?: string | null;
  arr_iata?: string | null;

  // Departure terminal and gate
  dep_terminal?: string | null;
  dep_gate?: string | null;

  // Arrival terminal and gate
  arr_terminal?: string | null;
  arr_gate?: string | null;

  dep_time?: string | null;
  arr_time?: string | null;

  dep_time_ts?: number | null;
  dep_estimated_ts?: number | null;

  dep_estimated?: string | null;
  arr_estimated?: string | null;

  // Actual departure and arrival information.
  dep_actual?: string | null;
  arr_actual?: string | null;

  // Arrival timestamps in Unix seconds.
  arr_time_ts?: number | null;
  arr_estimated_ts?: number | null;

  // Actual arrival timestamp.
  arr_actual_ts?: number | null;

  dep_delayed?: number | null;
  arr_delayed?: number | null;

  status?: string | null;
}

interface AirLabsResponse {
  response?: AirLabsFlight | AirLabsFlight[] | null;

  error?:
    | {
        message?: string;
        code?: string | number;
      }
    | string;
}

// ======================================
// CONSTANTS
// ======================================

const AIRLABS_API_URL = "https://airlabs.co/api/v9/flight";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const REQUEST_TIMEOUT_MS = 15000;

// ======================================
// VALIDATION
// ======================================

export function normalizeFlightNumber(flightNumber: string): string {
  const normalized = flightNumber.trim().toUpperCase().replace(/\s+/g, "");

  if (
    !normalized ||
    normalized.length > 20 ||
    !/^[A-Z0-9]+$/.test(normalized)
  ) {
    throw new Error("Please enter a valid flight number.");
  }

  return normalized;
}

export function validateFlightDate(date: string): string {
  const normalized = date.trim();

  if (!DATE_PATTERN.test(normalized)) {
    throw new Error("Please enter a valid departure date.");
  }

  const [year, month, day] = normalized.split("-").map(Number);

  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error("Please enter a valid departure date.");
  }

  return normalized;
}

// ======================================
// DATE AND TIME HELPERS
// ======================================

/**
 * AirLabs returns local airport times:
 *
 * "2026-11-25 10:30"
 *
 * Preserve these values without converting
 * them into the user's timezone.
 */
function parseAirLabsDateTime(value: string | null | undefined): {
  date: string | null;
  time: string | null;
} {
  if (!value) {
    return {
      date: null,
      time: null,
    };
  }

  const trimmed = value.trim();

  const [datePart, timePart] = trimmed.split(/[T ]/);

  const date = datePart && DATE_PATTERN.test(datePart) ? datePart : null;

  const candidateTime = timePart?.slice(0, 5) ?? "";

  const time = TIME_PATTERN.test(candidateTime) ? candidateTime : null;

  return {
    date,
    time,
  };
}

// ======================================
// FALLBACK FLIGHT
// ======================================

function createFallbackFlight(
  flightNumber: string,
  departureDate: string,
): FlightLookupResult {
  return {
    flightNumber,
    airline: "Scheduled Flight",
    departureAirport: "TBD",
    departureDate,
    departureTime: null,

    departureTerminal: null,
    departureGate: null,

    arrivalAirport: "TBD",
    arrivalDate: null,
    arrivalTime: null,

    arrivalTerminal: null,
    arrivalGate: null,

    // No matching AirLabs flight was found.
    // Its arrival time cannot be verified.
    status: "unknown",
  };
}

// ======================================
// FLIGHT STATUS
// ======================================

function calculateFlightStatus(flight: AirLabsFlight): string {
  const apiStatus = flight.status?.trim().toLowerCase() ?? "";

  // ======================================
  // 1. PRESERVE CANCELLED AND DIVERTED
  // ======================================

  if (apiStatus === "cancelled" || apiStatus === "canceled") {
    return "cancelled";
  }

  if (apiStatus === "diverted") {
    return "diverted";
  }

  // ======================================
  // 2. CHECK ARRIVAL TIMESTAMPS
  // ======================================

  const nowUnixSeconds = Math.floor(Date.now() / 1000);

  const actualArrivalTimestamp = flight.arr_actual_ts ?? null;

  const scheduledArrivalTimestamp = flight.arr_time_ts ?? null;

  const estimatedArrivalTimestamp = flight.arr_estimated_ts ?? null;

  const expectedArrivalTimestamp =
    estimatedArrivalTimestamp !== null &&
    Number.isFinite(estimatedArrivalTimestamp)
      ? estimatedArrivalTimestamp
      : scheduledArrivalTimestamp;

  // ======================================
  // 3. CHECK COMPLETED FLIGHT
  // ======================================

  // If AirLabs confirms actual arrival,
  // mark the flight Completed.
  //
  // Otherwise, compare the expected arrival
  // timestamp with the current server time.
  //
  // This runs during Add Flight, so the
  // flight is saved as Completed immediately
  // when its arrival time has passed.

  if (
    flight.arr_actual ||
    (actualArrivalTimestamp !== null &&
      Number.isFinite(actualArrivalTimestamp) &&
      nowUnixSeconds >= actualArrivalTimestamp)
  ) {
    return "completed";
  }

  if (
    expectedArrivalTimestamp !== null &&
    Number.isFinite(expectedArrivalTimestamp) &&
    nowUnixSeconds >= expectedArrivalTimestamp
  ) {
    return "completed";
  }

  // ======================================
  // 4. PRESERVE LANDED STATUS
  // ======================================

  if (apiStatus === "landed") {
    return "landed";
  }

  // ======================================
  // 5. CHECK CONFIRMED DEPARTURE
  // ======================================

  if (flight.dep_actual || apiStatus === "en-route" || apiStatus === "active") {
    return "en-route";
  }

  // ======================================
  // 6. CHECK SCHEDULED DEPARTURE
  // ======================================

  const departureTimestamp = flight.dep_time_ts ?? null;

  const estimatedTimestamp = flight.dep_estimated_ts ?? null;

  if (departureTimestamp === null || !Number.isFinite(departureTimestamp)) {
    return "scheduled";
  }

  const hoursUntilDeparture = (departureTimestamp - nowUnixSeconds) / 3600;

  // ======================================
  // 7. FLIGHTS MORE THAN 10 HOURS AWAY
  // ======================================

  if (hoursUntilDeparture > 10) {
    return "scheduled";
  }

  // ======================================
  // 8. CHECK DELAY INFORMATION
  // ======================================

  if (
    typeof flight.dep_delayed === "number" &&
    Number.isFinite(flight.dep_delayed) &&
    flight.dep_delayed > 0
  ) {
    return "delay";
  }

  // ======================================
  // 9. COMPARE ESTIMATED DEPARTURE
  // ======================================

  if (estimatedTimestamp !== null && Number.isFinite(estimatedTimestamp)) {
    if (estimatedTimestamp > departureTimestamp) {
      return "delay";
    }

    if (estimatedTimestamp < departureTimestamp) {
      return "early";
    }

    return "on-time";
  }

  // ======================================
  // 10. COMPARE LOCAL ESTIMATED TIME
  // ======================================

  const scheduled = parseAirLabsDateTime(flight.dep_time);

  const estimated = parseAirLabsDateTime(flight.dep_estimated);

  if (scheduled.date && scheduled.time && estimated.date && estimated.time) {
    const scheduledValue = `${scheduled.date}T${scheduled.time}`;

    const estimatedValue = `${estimated.date}T${estimated.time}`;

    if (estimatedValue > scheduledValue) {
      return "delay";
    }

    if (estimatedValue < scheduledValue) {
      return "early";
    }
  }

  // ======================================
  // 11. DEFAULT STATUS WITHIN 10 HOURS
  // ======================================

  return "on-time";
}

// ======================================
// MATCH FLIGHT
// ======================================

/**
 * Match both:
 *
 * 1. Flight number
 * 2. Local departure date
 *
 * Never use information from a different
 * departure date.
 */
function findMatchingFlight(
  flights: AirLabsFlight[],
  requestedFlightNumber: string,
  requestedDate: string,
): AirLabsFlight | null {
  const normalizedRequested = normalizeFlightNumber(requestedFlightNumber);

  for (const flight of flights) {
    const returnedNumber = flight.flight_iata
      ?.trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    if (returnedNumber !== normalizedRequested) {
      continue;
    }

    const departure = parseAirLabsDateTime(flight.dep_time);

    if (departure.date !== requestedDate) {
      continue;
    }

    return flight;
  }

  return null;
}

// ======================================
// SHARED AIRLABS LOOKUP
// ======================================

export async function lookupFlight(
  flightNumber: string,
  departureDate: string,
  options: FlightLookupOptions = {},
): Promise<FlightLookupResult> {
  // ======================================
  // 1. NORMALIZE INPUT
  // ======================================

  const normalizedFlightNumber = normalizeFlightNumber(flightNumber);

  const normalizedDate = validateFlightDate(departureDate);

  const allowFallback = options.allowFallback ?? false;

  // ======================================
  // 2. VERIFY API KEY
  // ======================================

  const apiKey = process.env.AIRLABS_API_KEY;

  if (!apiKey) {
    throw new Error("AirLabs API key is missing.");
  }

  // ======================================
  // 3. BUILD REQUEST
  // ======================================

  const params = new URLSearchParams({
    flight_iata: normalizedFlightNumber,
    api_key: apiKey,
  });

  const url = `${AIRLABS_API_URL}?${params.toString()}`;

  // ======================================
  // 4. FETCH FLIGHT DATA
  // ======================================

  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Error("Could not connect to AirLabs. Please try again.");
  }

  if (!response.ok) {
    throw new Error(
      "Flight lookup is temporarily unavailable. Please try again.",
    );
  }

  // ======================================
  // 5. PARSE RESPONSE
  // ======================================

  let data: AirLabsResponse;

  try {
    data = (await response.json()) as AirLabsResponse;
  } catch {
    throw new Error("AirLabs returned an invalid response.");
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("AirLabs returned an invalid response.");
  }

  // ======================================
  // 6. HANDLE AIRLABS ERRORS
  // ======================================

  if (data.error) {
    const message =
      typeof data.error === "string" ? data.error : data.error.message;

    throw new Error(
      message
        ? `Flight lookup failed: ${message}`
        : "Flight lookup failed. Please try again.",
    );
  }

  // ======================================
  // 7. EXTRACT FLIGHTS
  // ======================================

  const flights = Array.isArray(data.response)
    ? data.response
    : data.response
      ? [data.response]
      : [];

  // ======================================
  // 8. FIND MATCHING FLIGHT
  // ======================================

  const matchingFlight = findMatchingFlight(
    flights,
    normalizedFlightNumber,
    normalizedDate,
  );

  // ======================================
  // 9. HANDLE MISSING FLIGHT
  // ======================================

  if (!matchingFlight) {
    if (allowFallback) {
      return createFallbackFlight(normalizedFlightNumber, normalizedDate);
    }

    throw new Error(
      "No matching flight was found for this flight number and departure date.",
    );
  }

  // ======================================
  // 10. FORMAT MATCHED FLIGHT
  // ======================================

  const departure = parseAirLabsDateTime(matchingFlight.dep_time);

  const arrival = parseAirLabsDateTime(matchingFlight.arr_time);

  return {
    flightNumber: normalizedFlightNumber,

    airline:
      matchingFlight.airline_name?.trim() ||
      matchingFlight.airline_iata?.trim() ||
      "Scheduled Flight",

    departureAirport: matchingFlight.dep_iata?.trim() || "TBD",

    departureDate: normalizedDate,

    departureTime: departure.time,

    departureTerminal: matchingFlight.dep_terminal?.trim() || null,

    departureGate: matchingFlight.dep_gate?.trim() || null,

    arrivalAirport: matchingFlight.arr_iata?.trim() || "TBD",

    arrivalDate: arrival.date,

    arrivalTime: arrival.time,

    arrivalTerminal: matchingFlight.arr_terminal?.trim() || null,

    arrivalGate: matchingFlight.arr_gate?.trim() || null,

    status: calculateFlightStatus(matchingFlight),
  };
}
