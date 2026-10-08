import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function TripPage() {
  const session = await auth();

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-700 text-xl">
        Please sign in to continue.
      </div>
    );
  }

  const trips = await prisma.trip.findMany({
    where: { userId: session?.user?.id },
  });

  const sortedTrips = [...trips].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTrips = sortedTrips
    .filter((trip) => new Date(trip.startDate) >= today)
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

  const pastTrips = sortedTrips.filter(
    (trip) => new Date(trip.startDate) < today,
  );

  const renderTripCards = (tripList: typeof trips) => {
    if (tripList.length === 0) {
      return (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <h3 className="text-xl font-medium mb-2">No trips found here.</h3>
            <p className="text-center mb-4 max-w-md">
              Plan a new trip to fill this section.
            </p>
            <Link href="/trips/new">
              <Button>Create Trip</Button>
            </Link>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tripList.map((trip, key) => (
          <Link key={key} href={`/trips/${trip.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-1 leading-normal">
                  {trip.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-2 mb-2">{trip.description}</p>
                <div className="text-sm text-gray-500">
                  {new Date(trip.startDate).toLocaleDateString()} -{" "}
                  {new Date(trip.endDate).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/trips/new">
          <Button>New Trip</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {session.user?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            {trips.length === 0
              ? "Start planning your first trip"
              : `You have ${trips.length} ${trips.length === 1 ? "trip" : "trips"} total planned.`}
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">All Trips</h2>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming Trips ({upcomingTrips.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Trips ({pastTrips.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {renderTripCards(upcomingTrips)}
          </TabsContent>

          <TabsContent value="past">{renderTripCards(pastTrips)}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
