import { auth } from "@/auth";
import { login } from "@/lib/auth-actions";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex flex-col items-center">
      <section className="w-full py-30 text-center">
        <h1 className="text-5xl font-bold">Plan your next adventure</h1>

        <div className="space-y-6 container mx-auto px-4 py-8">
          {session ? (
            <Link href="/trips/new">
              <button className="rounded-lg bg-black px-6 py-3 text-white">
                Plan My Trip
              </button>
            </Link>
          ) : (
            <button
              className="rounded-lg bg-black px-6 py-3 text-white"
              //className="flex items-center justify-center bg-gray-800 hover:bg-gray-900 text-white p-2 rounded-sm cursor-pointer"
              onClick={login}
            >
              Plan My Trip
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
