"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { redirect } from "next/navigation";

export async function createTrip(formData: FormData) {
  const session = await auth();
  if (!session || !session.user?.id) {
    throw new Error("Not authenticated.");
  }

  const title = formData.get("title")?.toString();
  const description = formData.get("description")?.toString();
  const imageUrl = formData.get("imageUrl")?.toString();
  const startDateStr = formData.get("startDate")?.toString();
  const endDateStr = formData.get("endDate")?.toString();

  if (!title || !description || !startDateStr || !endDateStr) {
    throw new Error("All fields are required.");
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // Check if dates are valid
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Invalid trip dates.");
  }

  // End date must not be earlier than start date
  if (endDate < startDate) {
    throw new Error("End date cannot be before start date.");
  }

  await prisma.trip.create({
    data: {
      title,
      description,
      imageUrl,
      startDate,
      endDate,
      userId: session.user.id,
    },
  });

  redirect("/trips");
}
