import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import NewLocationClient from "@/components/new-location";

export default async function NewLocation({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!trip) {
    notFound();
  }

  return (
    <NewLocationClient
      tripId={trip.id}
      tripTitle={trip.title}
      startDate={trip.startDate.toISOString()}
      endDate={trip.endDate.toISOString()}
    />
  );
}
