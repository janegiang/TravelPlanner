export default function Home() {
  return (
    <main className="flex flex-col items-center">
      <section className="w-full py-30 text-center">
        <h1 className="text-5xl font-bold">Plan your next adventure</h1>

        <p className="mt-4 text-lg text-gray-600">
          Choose your destination and dates to start planning your trip.
        </p>

        <div className="mt-8 flex gap-4 justify-center">
          <input
            type="text"
            placeholder="Where do you want to go?"
            className="border rounded-lg px-4 py-3"
          />

          <input type="date" className="border rounded-lg px-4 py-3" />

          <button className="rounded-lg bg-black px-6 py-3 text-white">
            Plan My Trip
          </button>
        </div>
      </section>
    </main>
  );
}
