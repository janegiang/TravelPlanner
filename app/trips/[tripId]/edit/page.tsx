import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import EditTripForm from "@/components/edit-trip-form";

// ======================================
// TYPES
// ======================================

interface EditTripPageProps {
  params: Promise<{
    tripId: string;
  }>;
}

// ======================================
// EDIT TRIP PAGE
// ======================================

export default async function EditTripPage({ params }: EditTripPageProps) {
  const { tripId } = await params;

  // ======================================
  // AUTHENTICATION
  // ======================================

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // ======================================
  // VERIFY OWNERSHIP AND LOAD TRIP
  // ======================================

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
  });

  if (!trip) {
    notFound();
  }

  return <EditTripForm trip={trip} />;
}
