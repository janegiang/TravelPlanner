import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center">
      <section className="w-full py-30 text-center">
        <h1 className="text-5xl font-bold">Plan your next adventure</h1>

        <div className="space-y-6 container mx-auto px-4 py-8">
          <Link href="/trips/new">
            <button className="rounded-lg bg-black px-6 py-3 text-white">
              Plan My Trip
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}
