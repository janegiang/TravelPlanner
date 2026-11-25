"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { getTripDuration } from "@/lib/trip-dates";

import {
  preserveManualOrder,
  isChronologicalOrderValid,
  timeInMinutes,
  type SortableLocation,
} from "@/lib/itinerary-sort";

// ======================================
// TYPES
// ======================================

export interface PendingLocationMove {
  targetDay: number | null;

  // Exact desired position within the destination day.
  // Zero-based index.
  targetIndex: number;
}

// ======================================
// GOOGLE MAPS GEOCODING
// ======================================

async function geocodeAddress(address: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Maps API key is missing.");
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address,
    )}&key=${apiKey}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Could not connect to Google Maps.");
  }

  const data = await response.json();

  if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) {
    throw new Error("Could not find the specified address.");
  }

  const { lat, lng } = data.results[0].geometry.location;

  return { lat, lng };
}

// ======================================
// POSITION AN EDITED ACTIVITY
// ======================================

/**
 * For normal editing, reposition only the edited
 * activity when its day or time changes.
 *
 * Other activities keep their relative positions.
 * Untimed activities are not automatically moved
 * to the bottom.
 */
function positionEditedLocation<T extends SortableLocation>(
  locations: T[],
  editedLocationId: string,
  targetDay: number | null,
): T[] {
  const editedLocation = locations.find(
    (location) => location.id === editedLocationId,
  );

  if (!editedLocation) {
    return locations;
  }

  const remaining = locations.filter(
    (location) => location.id !== editedLocationId,
  );

  const movedLocation = {
    ...editedLocation,
    dayNumber: targetDay,
  };

  const editedTime = timeInMinutes(movedLocation.startTime);

  const targetLocations = remaining.filter(
    (location) => location.dayNumber === targetDay,
  );

  // Keep the edited location in its original position
  // when its day and time have not changed.
  if (editedTime === null) {
    const lastTarget = remaining.findLastIndex(
      (location) => location.dayNumber === targetDay,
    );

    const insertIndex = lastTarget >= 0 ? lastTarget + 1 : remaining.length;

    const result = [...remaining];

    result.splice(insertIndex, 0, movedLocation);

    return result;
  }

  // Find the first timed activity occurring later.
  const nextTimedLocation = targetLocations.find((location) => {
    const time = timeInMinutes(location.startTime);

    return time !== null && time > editedTime;
  });

  let insertIndex: number;

  if (nextTimedLocation) {
    insertIndex = remaining.findIndex(
      (location) => location.id === nextTimedLocation.id,
    );
  } else {
    const lastTarget = remaining.findLastIndex(
      (location) => location.dayNumber === targetDay,
    );

    insertIndex = lastTarget >= 0 ? lastTarget + 1 : remaining.length;
  }

  const result = [...remaining];

  result.splice(insertIndex, 0, movedLocation);

  return result;
}

// ======================================
// APPLY ORIGINAL DRAG POSITION
// ======================================

/**
 * Restore the position originally requested by
 * the user before the Activity Time Conflict.
 *
 * Example:
 *
 * Before:
 * A (9:00 AM)
 * B (2:00 PM)
 * C (No time)
 *
 * User drags A below B, then changes A to 3:00 PM.
 *
 * Result:
 * B (2:00 PM)
 * A (3:00 PM)
 * C (No time)
 */
function applyPendingMove<T extends SortableLocation>(
  locations: T[],
  editedLocationId: string,
  pendingMove: PendingLocationMove,
): T[] {
  const editedLocation = locations.find(
    (location) => location.id === editedLocationId,
  );

  if (!editedLocation) {
    throw new Error("Location not found.");
  }

  const remaining = locations.filter(
    (location) => location.id !== editedLocationId,
  );

  const targetLocations = remaining.filter(
    (location) => location.dayNumber === pendingMove.targetDay,
  );

  if (
    !Number.isInteger(pendingMove.targetIndex) ||
    pendingMove.targetIndex < 0 ||
    pendingMove.targetIndex > targetLocations.length
  ) {
    throw new Error("Invalid destination position.");
  }

  const movedLocation = {
    ...editedLocation,
    dayNumber: pendingMove.targetDay,
  };

  const targetLocation = targetLocations[pendingMove.targetIndex];

  let insertIndex: number;

  if (targetLocation) {
    // Insert before the location currently occupying
    // the requested destination position.
    insertIndex = remaining.findIndex(
      (location) => location.id === targetLocation.id,
    );
  } else {
    // Insert at the end of the destination day.
    const lastTarget = remaining.findLastIndex(
      (location) => location.dayNumber === pendingMove.targetDay,
    );

    insertIndex = lastTarget >= 0 ? lastTarget + 1 : remaining.length;
  }

  const result = [...remaining];

  result.splice(insertIndex, 0, movedLocation);

  return result;
}

// ======================================
// UPDATE LOCATION
// ======================================

export async function updateLocation(
  locationId: string,
  tripId: string,
  formData: FormData,

  // Optional: provided when editing after a
  // drag-and-drop Activity Time Conflict.
  pendingMove?: PendingLocationMove,
) {
  // ======================================
  // 1. AUTHENTICATION
  // ======================================

  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated.");
  }

  // ======================================
  // 2. VERIFY TRIP OWNERSHIP
  // ======================================

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      locations: {
        where: {
          id: locationId,
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!trip || trip.locations.length !== 1) {
    throw new Error("Location not found or access denied.");
  }

  // ======================================
  // 3. READ FORM VALUES
  // ======================================

  const address = formData.get("address")?.toString().trim();

  const selectedDay = formData.get("dayNumber")?.toString() ?? "";

  const rawDay = selectedDay === "unscheduled" ? "" : selectedDay;

  const rawTime = formData.get("startTime")?.toString() ?? "";

  const notes = formData.get("notes")?.toString().trim() ?? "";

  // ======================================
  // 4. VALIDATE LOCATION NAME
  // ======================================

  if (!address || address.length > 500) {
    throw new Error("Please enter a valid location name.");
  }

  // ======================================
  // 5. VALIDATE TRIP DAY
  // ======================================

  const duration = getTripDuration(trip.startDate, trip.endDate);

  let dayNumber: number | null = null;

  if (rawDay !== "") {
    const parsedDay = Number(rawDay);

    if (!Number.isInteger(parsedDay) || parsedDay < 1 || parsedDay > duration) {
      throw new Error("Invalid trip day.");
    }

    dayNumber = parsedDay;
  }

  // ======================================
  // 6. VALIDATE ACTIVITY TIME
  // ======================================

  if (rawTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(rawTime)) {
    throw new Error("Invalid activity time.");
  }

  // ======================================
  // 7. VALIDATE NOTES
  // ======================================

  if (notes.length > 2000) {
    throw new Error("Notes must be 2000 characters or fewer.");
  }

  // ======================================
  // 8. VALIDATE PENDING MOVE
  // ======================================

  if (pendingMove) {
    if (
      pendingMove.targetDay !== null &&
      (!Number.isInteger(pendingMove.targetDay) ||
        pendingMove.targetDay < 1 ||
        pendingMove.targetDay > duration)
    ) {
      throw new Error("Invalid destination day.");
    }

    if (
      !Number.isInteger(pendingMove.targetIndex) ||
      pendingMove.targetIndex < 0
    ) {
      throw new Error("Invalid destination position.");
    }

    // The edit dialog must use the destination day
    // associated with the original drag.
    if (dayNumber !== pendingMove.targetDay) {
      throw new Error(
        "The selected trip day does not match the requested move.",
      );
    }
  }

  // ======================================
  // 9. GEOCODE LOCATION
  // ======================================

  const { lat, lng } = await geocodeAddress(address);

  // ======================================
  // 10. UPDATE AND REPOSITION ATOMICALLY
  // ======================================

  await prisma.$transaction(async (tx) => {
    const previousLocation = await tx.location.findFirst({
      where: {
        id: locationId,
        tripId,
      },
    });

    if (!previousLocation) {
      throw new Error("Location not found.");
    }

    // Retrieve the existing order before updating.
    const existingLocations = await tx.location.findMany({
      where: {
        tripId,
      },
      orderBy: {
        order: "asc",
      },
    });

    // Update the edited location.
    const updatedLocation = await tx.location.update({
      where: {
        id: locationId,
        tripId,
      },
      data: {
        locationTitle: address,
        lat,
        lng,
        dayNumber,
        startTime: rawTime || null,
        notes: notes || null,
      },
    });

    // Replace the old location with the updated one,
    // retaining the existing order of all other cards.
    const currentLocations = existingLocations.map((location) =>
      location.id === locationId ? updatedLocation : location,
    );

    let nextLocations = currentLocations;

    // ======================================
    // CASE A: EDIT AFTER DRAG CONFLICT
    // ======================================

    if (pendingMove) {
      // Restore the exact requested drag position.
      nextLocations = applyPendingMove(
        currentLocations,
        locationId,
        pendingMove,
      );
    }

    // ======================================
    // CASE B: NORMAL LOCATION EDIT
    // ======================================
    else {
      const dayChanged = previousLocation.dayNumber !== dayNumber;

      const timeChanged = previousLocation.startTime !== (rawTime || null);

      if (dayChanged || timeChanged) {
        nextLocations = positionEditedLocation(
          currentLocations,
          locationId,
          dayNumber,
        );
      }
    }

    // ======================================
    // NORMALIZE SAVED ORDER
    // ======================================

    const normalizedLocations = preserveManualOrder(
      nextLocations.map((location, index) => ({
        ...location,
        order: index,
      })),
      duration,
    );

    // ======================================
    // VALIDATE CHRONOLOGICAL ORDER
    // ======================================

    if (!isChronologicalOrderValid(normalizedLocations, duration)) {
      throw new Error(
        "Activity time conflict. Please choose a time that matches the requested position.",
      );
    }

    // ======================================
    // SAVE NEW ORDER
    // ======================================

    for (const location of normalizedLocations) {
      await tx.location.update({
        where: {
          id: location.id,
          tripId,
        },
        data: {
          dayNumber: location.dayNumber,
          order: location.order,
        },
      });
    }
  });

  // ======================================
  // 11. REFRESH TRIP DATA
  // ======================================

  revalidatePath(`/trips/${tripId}`);

  return {
    success: true,
  };
}
