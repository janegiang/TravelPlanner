export interface SortableLocation {
  id: string;
  dayNumber: number | null;
  startTime: string | null;
  order: number;
}

export interface ActivityTimeConflict<T extends SortableLocation> {
  draggedLocation: T;
  conflictingLocation: T;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Convert HH:mm to minutes after midnight.
 *
 * Returns null for activities without a valid time.
 */
export function timeInMinutes(value: string | null): number | null {
  if (!value || !TIME_PATTERN.test(value)) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
}

/**
 * Sort activities by their scheduled times.
 *
 * Timed activities appear first.
 * Untimed activities appear afterward.
 * Equal-time activities preserve their saved order.
 *
 * Useful for initial chronological ordering.
 */
export function sortByActivityTime<T extends SortableLocation>(
  locations: T[],
): T[] {
  return [...locations].sort((a, b) => {
    const timeA = timeInMinutes(a.startTime);
    const timeB = timeInMinutes(b.startTime);

    if (timeA === null && timeB === null) {
      return a.order - b.order || a.id.localeCompare(b.id);
    }

    if (timeA === null) return 1;
    if (timeB === null) return -1;

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    return a.order - b.order || a.id.localeCompare(b.id);
  });
}

/**
 * Normalize locations into scheduled day groups,
 * followed by Unscheduled.
 *
 * Preserves manual order within each day.
 *
 * Does NOT automatically sort by Activity Time.
 */
export function preserveManualOrder<T extends SortableLocation>(
  locations: T[],
  duration: number,
): T[] {
  const sorted = [...locations].sort(
    (a, b) => a.order - b.order || a.id.localeCompare(b.id),
  );

  const result: T[] = [];

  // Scheduled days.
  for (let day = 1; day <= duration; day++) {
    result.push(...sorted.filter((location) => location.dayNumber === day));
  }

  // Unscheduled and invalid-day locations.
  const unscheduled = sorted
    .filter(
      (location) =>
        location.dayNumber === null ||
        location.dayNumber < 1 ||
        location.dayNumber > duration,
    )
    .map((location) => ({
      ...location,
      dayNumber: null,
    }));

  result.push(...unscheduled);

  return result.map((location, index) => ({
    ...location,
    order: index,
  }));
}

/**
 * Automatically sort activities chronologically
 * within each day.
 *
 * This function retains the previous behavior of
 * normalizeItineraryOrder().
 *
 * Use it when a fully chronological itinerary is desired.
 */
export function normalizeItineraryOrder<T extends SortableLocation>(
  locations: T[],
  duration: number,
): T[] {
  const result: T[] = [];

  for (let day = 1; day <= duration; day++) {
    result.push(
      ...sortByActivityTime(
        locations.filter((location) => location.dayNumber === day),
      ),
    );
  }

  const unscheduled = locations
    .filter(
      (location) =>
        location.dayNumber === null ||
        location.dayNumber < 1 ||
        location.dayNumber > duration,
    )
    .map((location) => ({
      ...location,
      dayNumber: null,
    }));

  result.push(...sortByActivityTime(unscheduled));

  return result.map((location, index) => ({
    ...location,
    order: index,
  }));
}

/**
 * Detect whether a dragged activity would violate
 * chronological order within its destination day.
 *
 * Untimed activities are ignored when checking
 * chronological conflicts.
 *
 * The requestedLocations array must already reflect
 * the user's proposed drag position.
 */
export function findActivityTimeConflict<T extends SortableLocation>(
  requestedLocations: T[],
  draggedId: string,
  targetDay: number | null,
): ActivityTimeConflict<T> | null {
  const dayLocations = requestedLocations.filter(
    (location) => location.dayNumber === targetDay,
  );

  const draggedIndex = dayLocations.findIndex(
    (location) => location.id === draggedId,
  );

  if (draggedIndex === -1) {
    return null;
  }

  const draggedLocation = dayLocations[draggedIndex];

  const draggedTime = timeInMinutes(draggedLocation.startTime);

  // An activity without a time can be placed anywhere.
  if (draggedTime === null) {
    return null;
  }

  // Find the nearest timed activity before the dragged one.
  for (let index = draggedIndex - 1; index >= 0; index--) {
    const previousLocation = dayLocations[index];

    const previousTime = timeInMinutes(previousLocation.startTime);

    if (previousTime === null) {
      continue;
    }

    if (draggedTime < previousTime) {
      return {
        draggedLocation,
        conflictingLocation: previousLocation,
      };
    }

    break;
  }

  // Find the nearest timed activity after the dragged one.
  for (let index = draggedIndex + 1; index < dayLocations.length; index++) {
    const nextLocation = dayLocations[index];

    const nextTime = timeInMinutes(nextLocation.startTime);

    if (nextTime === null) {
      continue;
    }

    if (draggedTime > nextTime) {
      return {
        draggedLocation,
        conflictingLocation: nextLocation,
      };
    }

    break;
  }

  return null;
}

/**
 * Check whether all timed activities within each day
 * remain in chronological order.
 *
 * Untimed activities can appear anywhere.
 */
export function isChronologicalOrderValid<T extends SortableLocation>(
  locations: T[],
  duration: number,
): boolean {
  const normalized = preserveManualOrder(locations, duration);

  const days: (number | null)[] = [
    ...Array.from({ length: duration }, (_, index) => index + 1),
    null,
  ];

  for (const day of days) {
    const dayLocations = normalized.filter(
      (location) => location.dayNumber === day,
    );

    let previousTime: number | null = null;

    for (const location of dayLocations) {
      const currentTime = timeInMinutes(location.startTime);

      if (currentTime === null) {
        continue;
      }

      if (previousTime !== null && currentTime < previousTime) {
        return false;
      }

      previousTime = currentTime;
    }
  }

  return true;
}
