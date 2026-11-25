"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ======================================
// DELETE FLIGHT
// ======================================

export async function deleteFlight(flightId: string, tripId: string) {
  // ======================================
  // 1. AUTHENTICATION
  // ======================================

  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be signed in to delete a flight.");
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
  // 3. VERIFY FLIGHT AND TRIP OWNERSHIP
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
    },
  });

  if (!existingFlight) {
    throw new Error("Flight not found or access denied.");
  }

  // ======================================
  // 4. DELETE FLIGHT
  // ======================================

  // Delete only when the flight belongs to
  // the authenticated user's trip.
  const result = await prisma.flight.deleteMany({
    where: {
      id: flightId,
      tripId,
      trip: {
        userId: session.user.id,
      },
    },
  });

  if (result.count !== 1) {
    throw new Error(
      "Could not delete the flight. It may have already been removed.",
    );
  }

  // ======================================
  // 5. REFRESH TRIP DATA
  // ======================================

  revalidatePath(`/trips/${tripId}`);

  // ======================================
  // 6. RETURN SUCCESS
  // ======================================

  return {
    success: true,
  };
}
