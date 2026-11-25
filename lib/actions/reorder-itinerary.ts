"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { getTripDuration } from "@/lib/trip-dates";

import {
  preserveManualOrder,
  isChronologicalOrderValid,
} from "@/lib/itinerary-sort";

// ======================================
// LOCATION UPDATE TYPE
// ======================================

interface LocationOrderUpdate {
  id: string;
  dayNumber: number | null;
  order: number;
}

// ======================================
// REORDER ITINERARY
// ======================================

export async function reorderItinerary(
  tripId: string,
  updates: LocationOrderUpdate[],
) {
  // ======================================
  // 1. AUTHENTICATION
  // ======================================

  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated.");
  }

  // ======================================
  // 2. VALIDATE REQUEST
  // ======================================

  if (typeof tripId !== "string" || !tripId.trim() || !Array.isArray(updates)) {
    throw new Error("Invalid reorder request.");
  }

  // Validate each location update.
  for (const update of updates) {
    if (
      !update ||
      typeof update.id !== "string" ||
      !update.id.trim() ||
      !Number.isInteger(update.order) ||
      update.order < 0 ||
      (update.dayNumber !== null && !Number.isInteger(update.dayNumber))
    ) {
      throw new Error("Invalid location update.");
    }
  }

  // ======================================
  // 3. CHECK DUPLICATE IDS
  // ======================================

  const submittedIds = updates.map((update) => update.id);

  if (new Set(submittedIds).size !== submittedIds.length) {
    throw new Error("Duplicate locations are not allowed.");
  }

  // ======================================
  // 4. VALIDATE SEQUENTIAL ORDER
  // ======================================

  const submittedOrders = updates
    .map((update) => update.order)
    .sort((a, b) => a - b);

  for (let index = 0; index < submittedOrders.length; index++) {
    if (submittedOrders[index] !== index) {
      throw new Error("Location order must be sequential.");
    }
  }

  // ======================================
  // 5. VERIFY TRIP OWNERSHIP
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
        select: {
          id: true,
          dayNumber: true,
          startTime: true,
          order: true,
        },
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found or access denied.");
  }

  // ======================================
  // 6. VERIFY LOCATION OWNERSHIP
  // ======================================

  const existingIds = new Set(trip.locations.map((location) => location.id));

  if (
    updates.length !== existingIds.size ||
    updates.some((update) => !existingIds.has(update.id))
  ) {
    throw new Error("Invalid locations for this trip.");
  }

  // ======================================
  // 7. VALIDATE TRIP DAYS
  // ======================================

  const duration = getTripDuration(trip.startDate, trip.endDate);

  for (const update of updates) {
    if (
      update.dayNumber !== null &&
      (update.dayNumber < 1 || update.dayNumber > duration)
    ) {
      throw new Error("A location was assigned to an invalid trip day.");
    }
  }

  // ======================================
  // 8. APPLY REQUESTED DAY AND ORDER
  // ======================================

  const updatesById = new Map(updates.map((update) => [update.id, update]));

  const updatedLocations = trip.locations.map((location) => {
    const update = updatesById.get(location.id)!;

    return {
      ...location,
      dayNumber: update.dayNumber,
      order: update.order,
    };
  });

  // ======================================
  // 9. PRESERVE MANUAL ORDER
  // ======================================

  const orderedLocations = preserveManualOrder(updatedLocations, duration);

  // ======================================
  // 10. VALIDATE ACTIVITY TIMES
  // ======================================

  // Timed activities must remain chronological.
  // Untimed activities may appear anywhere.
  const isValid = isChronologicalOrderValid(orderedLocations, duration);

  if (!isValid) {
    throw new Error(
      "Activity time conflict. Please adjust the activity time before changing its position.",
    );
  }

  // ======================================
  // 11. SAVE CHANGES IN A TRANSACTION
  // ======================================

  await prisma.$transaction(
    orderedLocations.map((location) =>
      prisma.location.update({
        where: {
          id: location.id,
          tripId,
        },
        data: {
          dayNumber: location.dayNumber,
          order: location.order,
        },
      }),
    ),
  );

  // ======================================
  // 12. REFRESH TRIP DATA
  // ======================================

  revalidatePath(`/trips/${tripId}`);

  return {
    success: true,
  };
}
