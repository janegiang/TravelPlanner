import { Skeleton } from "@/components/ui/skeleton";

export default function TripsLoading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32 rounded-lg" />
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-4 w-72 max-w-full rounded-lg" />
          </div>

          <Skeleton className="hidden h-12 w-32 rounded-xl sm:block" />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="space-y-4 rounded-2xl border border-border bg-card p-5"
            >
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="h-9 w-16 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Featured trip */}
        <div className="grid overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-2">
          <div className="space-y-5 p-8">
            <Skeleton className="h-8 w-44 rounded-full" />
            <Skeleton className="h-12 w-3/4 rounded-lg" />
            <Skeleton className="h-5 w-1/2 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>

          <Skeleton className="min-h-64 rounded-none lg:min-h-80" />
        </div>

        {/* Search */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl md:w-52" />
            <Skeleton className="h-12 w-full rounded-xl md:w-24" />
          </div>

          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-28 shrink-0 rounded-xl" />
            ))}
          </div>

          {/* Trip cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <Skeleton className="h-48 w-full rounded-none" />

                <div className="space-y-4 p-5">
                  <Skeleton className="h-7 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-4 w-2/3 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
