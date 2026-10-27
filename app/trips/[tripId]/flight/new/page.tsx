import NewFlightClient from "@/components/new-flight";

export default async function NewFlight({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  return <NewFlightClient tripId={tripId} />;
}
