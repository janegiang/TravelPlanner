import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function MyTripsPage() {
  const session = await auth();
  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-700 text-xl">
        Please Sign In.
      </div>
    );
  }

  return;
  <div className="space-y-6 container mx-auto px-4 py-8">
    {" "}
    <div>
      <h1>Dashboard</h1>
      <Button>New Trips</Button>
    </div>
  </div>;
}
