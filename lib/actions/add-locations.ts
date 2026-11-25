"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { getTripDuration } from "@/lib/trip-dates";
import { normalizeItineraryOrder } from "@/lib/itinerary-sort";

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
    throw new Error("Could not connect to the geocoding service.");
  }

  const data = await response.json();

  if (data.status !== "OK" || !data.results?.[0]?.geometry?.location) {
    throw new Error("Could not find the specified address.");
  }

  const { lat, lng } = data.results[0].geometry.location;

  return { lat, lng };
}

// ======================================
// ADD LOCATION
// ======================================

export async function addLocation(formData: FormData, tripId: string) {
  // 1. Authenticate user.
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated.");
  }

  // 2. Verify trip ownership.
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
    select: {
      id: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!trip) {
    throw new Error("Trip not found or access denied.");
  }

  // 3. Read form values.
  const address = formData.get("address")?.toString().trim();

  if (!address) {
    throw new Error("Missing address.");
  }

  if (address.length > 500) {
    throw new Error("Location name must be 500 characters or fewer.");
  }

  const selectedDay = formData.get("dayNumber")?.toString() ?? "";

  const rawDay = selectedDay === "unscheduled" ? "" : selectedDay;

  const rawTime = formData.get("startTime")?.toString() ?? "";

  const rawNotes = formData.get("notes")?.toString().trim() ?? "";

  // 4. Validate trip day.
  const duration = getTripDuration(trip.startDate, trip.endDate);

  let dayNumber: number | null = null;

  if (rawDay !== "") {
    const parsedDay = Number(rawDay);

    if (!Number.isInteger(parsedDay) || parsedDay < 1 || parsedDay > duration) {
      throw new Error("Invalid trip day.");
    }

    dayNumber = parsedDay;
  }

  // 5. Validate activity time.
  if (rawTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(rawTime)) {
    throw new Error("Invalid activity time.");
  }

  // 6. Validate notes.
  if (rawNotes.length > 2000) {
    throw new Error("Notes must be 2000 characters or fewer.");
  }

  // 7. Geocode location.
  const { lat, lng } = await geocodeAddress(address);

  // ======================================
  // 8. CREATE AND SORT IN A TRANSACTION
  // ======================================

  const newLocation = await prisma.$transaction(async (tx) => {
    // Find the highest existing order.
    const lastLocation = await tx.location.findFirst({
      where: {
        tripId,
      },
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    });

    // Create the new location.
    const created = await tx.location.create({
      data: {
        locationTitle: address,
        lat,
        lng,
        tripId,
        order: (lastLocation?.order ?? -1) + 1,
        dayNumber,
        startTime: rawTime || null,
        notes: rawNotes || null,
      },
    });

    // Fetch every location in this trip.
    const allLocations = await tx.location.findMany({
      where: {
        tripId,
      },
    });

    // Sort all locations by day and activity time.
    const sortedLocations = normalizeItineraryOrder(allLocations, duration);

    // Persist the chronological order.
    for (const location of sortedLocations) {
      await tx.location.update({
        where: {
          id: location.id,
        },
        data: {
          order: location.order,
          dayNumber: location.dayNumber,
        },
      });
    }

    return created;
  });

  // ======================================
  // 9. REFRESH TRIP DATA
  // ======================================

  revalidatePath(`/trips/${tripId}`);

  // Return the new location ID so the client can
  // navigate and scroll to the created location.
  return {
    locationId: newLocation.id,
  };
}
