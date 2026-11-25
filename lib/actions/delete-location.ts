"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteLocation(locationId: string, tripId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated.");
  }

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
    select: {
      locations: {
        where: { id: locationId },
        select: { id: true },
      },
    },
  });

  if (!trip || trip.locations.length !== 1) {
    throw new Error("Location not found or access denied.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.location.delete({
      where: {
        id: locationId,
        tripId,
      },
    });

    const remaining = await tx.location.findMany({
      where: { tripId },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: { id: true },
    });

    for (let index = 0; index < remaining.length; index++) {
      await tx.location.update({
        where: {
          id: remaining[index].id,
          tripId,
        },
        data: { order: index },
      });
    }
  });

  revalidatePath(`/trips/${tripId}`);
}
