import { auth } from "@/auth";
import { login } from "@/lib/auth-actions";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  // If user is authenticated, redirect straight to their dashboard
  if (session) {
    redirect("/trips");
  }

  return (
    <main className="flex flex-col items-center bg-brand-cream">
      {/* Hero Section */}
      <section className="w-full border-border py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
            Your Next Journey Starts Here
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Organize trips, track flights, explore interactive maps, and create
            daily itineraries all in one place.
          </p>

          <div className="pt-2">
            <form action={login}>
              <button
                type="submit"
                className="rounded-lg bg-brand-olive hover:bg-[#595824] text-white px-8 py-3.5 font-semibold transition-colors cursor-pointer shadow-md"
              >
                Begin Your Journey
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section
        id="features"
        className="w-full max-w-5xl px-4 py-12 border-t border-border mb-16"
      >
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Everything You Need for Your Trip
          </h2>
          <p className="text-muted-foreground">
            Keep all your travel plans organized in one place.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-xl bg-card border-2 border-border hover:border-brand-gold hover:shadow-md transition-all">
            <h3 className="font-bold text-lg mb-2 text-card-foreground">
              🗺️ Interactive Maps
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pin destinations, visualize routes, and organize locations for
              every stop on your trip.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-xl bg-card border-2 border-border hover:border-brand-gold hover:shadow-md transition-all">
            <h3 className="font-bold text-lg mb-2 text-card-foreground">
              ✈️ Flight Tracking
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Keep track of flight numbers, airlines, departure times, and
              flight information in one place.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-xl bg-card border-2 border-border hover:border-brand-gold hover:shadow-md transition-all">
            <h3 className="font-bold text-lg mb-2 text-card-foreground">
              📅 Custom Itineraries
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Create daily schedules and organize activities for every day of
              your adventure.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section - Soft Cream (#fef2d0) Background */}
      <section
        id="how-it-works"
        className="w-full bg-brand-cream border-y border-border py-16 md:py-20 px-4"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-brand-ink">
              How It Works
            </h2>
            <p className="text-brand-ink/80">
              Plan your next adventure in just three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-brand-gold border-2 border-brand-orange text-xl font-extrabold text-brand-ink shadow-sm">
                01
              </div>

              <h3 className="text-lg font-bold text-brand-ink">
                Create Your Trip
              </h3>

              <p className="text-sm text-brand-ink/80 leading-relaxed max-w-xs mx-auto">
                Start by creating a trip and adding your destination and travel
                details.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-brand-gold border-2 border-brand-orange text-xl font-extrabold text-brand-ink shadow-sm">
                02
              </div>

              <h3 className="text-lg font-bold text-brand-ink">
                Organize Your Plans
              </h3>

              <p className="text-sm text-brand-ink/80 leading-relaxed max-w-xs mx-auto">
                Add destinations, organize daily activities, and keep your
                flight information together.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-brand-gold border-2 border-brand-orange text-xl font-extrabold text-brand-ink shadow-sm">
                03
              </div>

              <h3 className="text-lg font-bold text-brand-ink">
                Enjoy Your Adventure
              </h3>

              <p className="text-sm text-brand-ink/80 leading-relaxed max-w-xs mx-auto">
                Access your travel plans in one place and enjoy a more organized
                journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call-to-Action Section - Olive Green (#a4a350) Banner */}
      <section className="w-full max-w-5xl px-4 py-16 md:py-24">
        <div className="bg-brand-olive rounded-2xl px-6 py-14 md:py-16 text-center text-white space-y-5 shadow-lg border-2 border-[#8e8d43]">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-xs">
            Ready for Your Next Adventure?
          </h2>

          <p className="text-brand-cream max-w-xl mx-auto font-medium">
            Start planning your trips, organize your destinations, and keep all
            your travel details in one place.
          </p>

          <div className="pt-2">
            <form action={login}>
              <button
                type="submit"
                className="rounded-lg bg-brand-gold hover:bg-[#f6be58] px-8 py-3.5 text-brand-ink font-bold transition-colors cursor-pointer shadow-md"
              >
                Sign In to Start →
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
