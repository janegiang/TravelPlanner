import { auth } from "@/auth";
import TripDetailClient from "@/components/trip-detail";
import { prisma } from "@/lib/prisma";

import { redirect, notFound } from "next/navigation";

// ======================================
// TYPES
// ======================================

interface TripDetailPageProps {
  params: Promise<{
    tripId: string;
  }>;
}

// ======================================
// TRIP DETAIL PAGE
// ======================================

export default async function TripDetail({ params }: TripDetailPageProps) {
  // ======================================
  // 1. GET TRIP ID
  // ======================================

  const { tripId } = await params;

  // ======================================
  // 2. AUTHENTICATION
  // ======================================

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // ======================================
  // 3. FETCH TRIP
  // ======================================

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },

    include: {
      // ======================================
      // ITINERARY LOCATIONS
      // ======================================

      locations: {
        orderBy: {
          order: "asc",
        },
      },

      // ======================================
      // FLIGHTS
      // ======================================

      flights: {
        orderBy: [
          {
            departureDate: "asc",
          },
          {
            departureTime: "asc",
          },
          {
            flightNumber: "asc",
          },
        ],
      },
    },
  });

  // ======================================
  // 4. HANDLE MISSING TRIP
  // ======================================

  if (!trip) {
    notFound();
  }

  // ======================================
  // 5. RENDER TRIP DETAIL
  // ======================================

  return <TripDetailClient trip={trip} />;
}
