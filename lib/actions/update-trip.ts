"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ======================================
// UPDATE TRIP
// ======================================

export async function updateTrip(tripId: string, formData: FormData) {
  // ======================================
  // 1. AUTHENTICATION
  // ======================================

  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("You must be signed in to edit a trip.");
  }

  // ======================================
  // 2. VALIDATE TRIP ID
  // ======================================

  if (typeof tripId !== "string" || !tripId.trim()) {
    throw new Error("Invalid trip.");
  }

  // ======================================
  // 3. READ FORM VALUES
  // ======================================

  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");
  const rawStartDate = formData.get("startDate");
  const rawEndDate = formData.get("endDate");
  const rawImageUrl = formData.get("imageUrl");

  if (
    typeof rawTitle !== "string" ||
    typeof rawDescription !== "string" ||
    typeof rawStartDate !== "string" ||
    typeof rawEndDate !== "string"
  ) {
    throw new Error("Please complete all required fields.");
  }

  const title = rawTitle.trim();
  const description = rawDescription.trim();

  // ======================================
  // 4. VALIDATE REQUIRED FIELDS
  // ======================================

  if (!title || !description) {
    throw new Error("Trip title and description are required.");
  }

  if (title.length > 150) {
    throw new Error("Trip title is too long.");
  }

  // ======================================
  // 5. VALIDATE TRAVEL DATES
  // ======================================

  function parseDate(value: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error("Please enter valid travel dates.");
    }

    const [year, month, day] = value.split("-").map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new Error("Please enter valid travel dates.");
    }

    return date;
  }

  const startDate = parseDate(rawStartDate);
  const endDate = parseDate(rawEndDate);

  if (endDate < startDate) {
    throw new Error("End date cannot be before start date.");
  }

  // ======================================
  // 6. VALIDATE IMAGE URL
  // ======================================

  if (rawImageUrl !== null && typeof rawImageUrl !== "string") {
    throw new Error("Invalid trip cover image.");
  }

  const imageUrl =
    typeof rawImageUrl === "string" && rawImageUrl.trim()
      ? rawImageUrl.trim()
      : null;

  if (imageUrl) {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      throw new Error("Invalid trip cover image URL.");
    }

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      throw new Error("Invalid trip cover image URL.");
    }
  }

  // ======================================
  // 7. VERIFY OWNERSHIP
  // ======================================

  const existingTrip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!existingTrip) {
    throw new Error("Trip not found or access denied.");
  }

  // ======================================
  // 8. UPDATE TRIP
  // ======================================

  const result = await prisma.trip.updateMany({
    where: {
      id: tripId,
      userId: session.user.id,
    },
    data: {
      title,
      description,
      startDate,
      endDate,
      imageUrl,
    },
  });

  if (result.count !== 1) {
    throw new Error("Trip not found or access denied.");
  }

  // ======================================
  // 9. REVALIDATE PAGES
  // ======================================

  revalidatePath("/trips");
  revalidatePath(`/trips/${tripId}`);

  // ======================================
  // 10. RETURN SUCCESS
  // ======================================

  return {
    success: true,
  };
}
