export type TripStatus = "upcoming" | "ongoing" | "completed";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Normalize a date to midnight UTC.
 * Trip dates represent calendar days, not exact timestamps.
 */
export function normalizeUTCDate(date: Date | string): Date {
  const value = new Date(date);

  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}

/**
 * Get today's date at midnight UTC.
 */
export function getTodayUTC(): Date {
  const now = new Date();

  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/**
 * Get tomorrow's date at midnight UTC.
 */
export function getTomorrowUTC(): Date {
  return new Date(getTodayUTC().getTime() + DAY_MS);
}

/**
 * Determine whether a trip is upcoming,
 * ongoing, or completed.
 *
 * The start and end dates are inclusive.
 */
export function getTripStatus(
  startDate: Date | string,
  endDate: Date | string,
  today = getTodayUTC(),
): TripStatus {
  const start = normalizeUTCDate(startDate);
  const end = normalizeUTCDate(endDate);
  const currentDay = normalizeUTCDate(today);

  if (start > currentDay) {
    return "upcoming";
  }

  if (end < currentDay) {
    return "completed";
  }

  return "ongoing";
}

/**
 * Format a trip date without timezone shifts.
 */
export function formatTripDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
    timeZone: "UTC",
  }).format(normalizeUTCDate(date));
}

/**
 * Calculate trip duration in calendar days.
 * Both departure and return days are included.
 */
export function getTripDuration(
  startDate: Date | string,
  endDate: Date | string,
): number {
  const start = normalizeUTCDate(startDate).getTime();
  const end = normalizeUTCDate(endDate).getTime();

  return Math.max(1, Math.round((end - start) / DAY_MS) + 1);
}

/**
 * Calculate the number of days until a trip begins.
 */
export function getDaysUntil(
  date: Date | string,
  today = getTodayUTC(),
): number {
  const target = normalizeUTCDate(date).getTime();
  const current = normalizeUTCDate(today).getTime();

  return Math.max(0, Math.round((target - current) / DAY_MS));
}

/**
 * Generate a friendly countdown label.
 */
export function getCountdownLabel(
  date: Date | string,
  today = getTodayUTC(),
): string {
  const days = getDaysUntil(date, today);

  if (days === 0) {
    return "Starting today";
  }

  if (days === 1) {
    return "Tomorrow";
  }

  return `In ${days} days`;
}

/**
 * Calculate the current day of an ongoing trip.
 * For example: Day 2 of 5.
 */
export function getCurrentTripDay(
  startDate: Date | string,
  endDate: Date | string,
  today = getTodayUTC(),
): number {
  const start = normalizeUTCDate(startDate).getTime();
  const current = normalizeUTCDate(today).getTime();

  const duration = getTripDuration(startDate, endDate);

  const day = Math.floor((current - start) / DAY_MS) + 1;

  return Math.max(1, Math.min(day, duration));
}
