import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass, Plus, Search } from "lucide-react";
import type { Prisma } from "@/app/generated/prisma/client";

import FeaturedTrip from "@/components/dashboard/featured-trip";
import TripStats from "@/components/dashboard/trip-stats";
import TripCard from "@/components/dashboard/trip-card";
import TripSort from "@/components/dashboard/trip-sort";

import { getTodayUTC, getTomorrowUTC, getTripStatus } from "@/lib/trip-dates";

const PAGE_SIZE = 9;

type Filter = "all" | "upcoming" | "ongoing" | "completed";
type Sort = "soonest" | "latest" | "newest" | "oldest";

type SearchParams = {
  search?: string | string[];
  filter?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

function first(value?: string | string[]): string {
  return typeof value === "string" ? value : (value?.[0] ?? "");
}

function buildUrl(values: {
  search: string;
  filter: Filter;
  sort: Sort;
  page: number;
}): string {
  const params = new URLSearchParams();

  if (values.search) {
    params.set("search", values.search);
  }

  if (values.filter !== "all") {
    params.set("filter", values.filter);
  }

  if (values.sort !== "soonest") {
    params.set("sort", values.sort);
  }

  if (values.page > 1) {
    params.set("page", String(values.page));
  }

  const query = params.toString();

  return query ? `/trips?${query}` : "/trips";
}

export default async function TripPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // AUTHENTICATION
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  // SEARCH PARAMETERS
  const params = await searchParams;

  const search = first(params.search).trim().slice(0, 100);
  const rawFilter = first(params.filter);
  const rawSort = first(params.sort);

  const validFilters: Filter[] = ["all", "upcoming", "ongoing", "completed"];

  const validSorts: Sort[] = ["soonest", "latest", "newest", "oldest"];

  const filter: Filter = validFilters.includes(rawFilter as Filter)
    ? (rawFilter as Filter)
    : "all";

  const sort: Sort = validSorts.includes(rawSort as Sort)
    ? (rawSort as Sort)
    : "soonest";

  const requestedPage = Number(first(params.page) || "1");

  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;

  // DATE AND USER INFORMATION
  const today = getTodayUTC();
  const tomorrow = getTomorrowUTC();
  const userId = session.user.id;

  // TRIP STATUS CONDITIONS
  const upcomingWhere: Prisma.TripWhereInput = {
    userId,
    startDate: {
      gte: tomorrow,
    },
  };

  const ongoingWhere: Prisma.TripWhereInput = {
    userId,
    startDate: {
      lt: tomorrow,
    },
    endDate: {
      gte: today,
    },
  };

  const completedWhere: Prisma.TripWhereInput = {
    userId,
    endDate: {
      lt: today,
    },
  };

  const statusWhere: Prisma.TripWhereInput =
    filter === "upcoming"
      ? upcomingWhere
      : filter === "ongoing"
        ? ongoingWhere
        : filter === "completed"
          ? completedWhere
          : { userId };

  // SEARCH CONDITIONS
  const where: Prisma.TripWhereInput = {
    AND: [
      statusWhere,
      ...(search
        ? [
            {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  description: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  locations: {
                    some: {
                      locationTitle: {
                        contains: search,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                },
              ],
            },
          ]
        : []),
    ],
  };

  // DATABASE-LEVEL SORTING
  const orderBy: Prisma.TripOrderByWithRelationInput[] =
    sort === "latest"
      ? [{ startDate: "desc" }, { id: "asc" }]
      : sort === "newest"
        ? [{ createdAt: "desc" }, { id: "asc" }]
        : sort === "oldest"
          ? [{ createdAt: "asc" }, { id: "asc" }]
          : [{ startDate: "asc" }, { id: "asc" }];

  // DASHBOARD STATISTICS
  const [total, upcoming, ongoing, completed, filteredCount] =
    await Promise.all([
      prisma.trip.count({
        where: { userId },
      }),

      prisma.trip.count({
        where: upcomingWhere,
      }),

      prisma.trip.count({
        where: ongoingWhere,
      }),

      prisma.trip.count({
        where: completedWhere,
      }),

      prisma.trip.count({
        where,
      }),
    ]);

  // FEATURED TRIP PRIORITY
  // 1. Ongoing trip ending soonest
  // 2. Earliest upcoming trip
  // 3. Empty state with Create New Trip button

  const featuredTripInclude = {
    locations: {
      orderBy: [{ order: "asc" as const }, { id: "asc" as const }],
      select: {
        locationTitle: true,
      },
    },
  };

  // Find an ongoing trip first.
  const ongoingFeaturedTrip = await prisma.trip.findFirst({
    where: ongoingWhere,
    orderBy: [{ endDate: "asc" }, { id: "asc" }],
    include: featuredTripInclude,
  });

  // Fall back to the earliest upcoming trip.
  const featuredTrip =
    ongoingFeaturedTrip ??
    (await prisma.trip.findFirst({
      where: upcomingWhere,
      orderBy: [{ startDate: "asc" }, { id: "asc" }],
      include: featuredTripInclude,
    }));

  const featuredTripStatus: "ongoing" | "upcoming" = ongoingFeaturedTrip
    ? "ongoing"
    : "upcoming";

  // PAGINATION
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  // FETCH PAGINATED TRIPS
  const trips = await prisma.trip.findMany({
    where,
    orderBy,
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      locations: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        take: 1,
        select: {
          locationTitle: true,
        },
      },
    },
  });

  // STATUS FILTERS
  const filters: {
    value: Filter;
    label: string;
    count: number;
  }[] = [
    {
      value: "all",
      label: "All Trips",
      count: total,
    },
    {
      value: "upcoming",
      label: "Upcoming",
      count: upcoming,
    },
    {
      value: "ongoing",
      label: "Ongoing",
      count: ongoing,
    },
    {
      value: "completed",
      label: "Completed",
      count: completed,
    },
  ];

  const pageUrl = (nextPage: number) =>
    buildUrl({
      search,
      filter,
      sort,
      page: nextPage,
    });

  return (
    <main className="flex min-h-screen flex-col items-center bg-brand-cream">
      <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* DASHBOARD HEADER */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-brand-orange">
              <Compass className="h-4 w-4" />
              Your travel hub
            </p>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Welcome back
              {session.user.name ? `, ${session.user.name}` : ""}!
            </h1>

            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Every great adventure starts with a plan.
            </p>
          </div>

          <Link
            href="/trips/new"
            className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-brand-orange hover:bg-brand-orange/85 px-3 py-3 font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="h-5 w-5" />
            New Trip
          </Link>
        </header>

        {/* DASHBOARD STATISTICS */}
        <TripStats
          total={total}
          upcoming={upcoming}
          ongoing={ongoing}
          completed={completed}
        />

        {/* FEATURED TRIP */}
        {featuredTrip ? (
          <FeaturedTrip trip={featuredTrip} status={featuredTripStatus} />
        ) : (
          <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center sm:py-20">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                <Compass className="h-10 w-10 text-brand-orange" />
              </div>

              <h2 className="mb-3 text-3xl font-black tracking-tight">
                Plan Your Next Adventure
              </h2>

              <p className="mb-7 max-w-3xl text-center text-sm leading-relaxed text-muted-foreground md:whitespace-nowrap sm:text-base">
                Choose your next destination and start creating new travel
                memories.
              </p>

              <Link
                href="/trips/new"
                className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-brand-orange hover:bg-brand-orange/85 px-3 py-3 font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                <Plus className="h-5 w-5" />
                Create New Trip
              </Link>
            </div>
          </section>
        )}

        {/* TRIP COLLECTION */}
        <section
          id="your-trips"
          className="space-y-5 scroll-mt-28"
          aria-labelledby="trips-heading"
        >
          {/* SECTION HEADER */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2
                id="trips-heading"
                className="text-2xl font-black tracking-tight"
              >
                Your Trips
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Explore and manage your travel adventures.
              </p>
            </div>
          </div>

          {/* STATUS FILTERS */}
          <nav
            aria-label="Filter trips by status"
            className="flex gap-2 overflow-x-auto pb-2"
          >
            {filters.map((item) => (
              <Link
                key={item.value}
                href={buildUrl({
                  search,
                  filter: item.value,
                  sort,
                  page: 1,
                })}
                scroll={false}
                aria-current={filter === item.value ? "page" : undefined}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                  filter === item.value
                    ? "bg-brand-olive text-white shadow-sm"
                    : "border border-border bg-card text-card-foreground hover:bg-brand-gold"
                }`}
              >
                {item.label}

                <span className="ml-2 opacity-75">({item.count})</span>
              </Link>
            ))}
          </nav>

          {/* SEARCH AND SORTING */}
          <form
            action="/trips#your-trips"
            method="GET"
            role="search"
            className="flex flex-col gap-3 md:flex-row"
          >
            {/* Preserve selected status filter */}
            <input type="hidden" name="filter" value={filter} />

            {/* Search box with integrated button */}
            <div className="relative flex-1">
              {/* Search icon */}
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

              {/* Search input */}
              <input
                type="search"
                name="search"
                aria-label="Search trips"
                defaultValue={search}
                maxLength={100}
                placeholder="Search trips, descriptions, destinations..."
                className="h-12 w-full rounded-xl border border-border bg-background pl-12 pr-28 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              {/* Search button inside input */}
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 flex h-9 -translate-y-1/2 cursor-pointer items-center gap-1.5 rounded-lg bg-brand-olive px-3 font-bold text-white transition-colors hover:bg-[#737235] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">Search</span>
              </button>
            </div>

            {/* AUTOMATIC SORTING DROPDOWN */}
            <TripSort key={sort} defaultValue={sort} />
          </form>

          {/* TRIP CARDS */}
          {trips.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  status={getTripStatus(trip.startDate, trip.endDate, today)}
                />
              ))}
            </div>
          ) : (
            /* EMPTY STATE */
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <div className="mb-5 rounded-full bg-secondary p-5">
                <Compass className="h-10 w-10 text-brand-orange" />
              </div>

              <h3 className="mb-2 text-xl font-black">
                {search
                  ? "No matching trips"
                  : total === 0
                    ? "Your adventure starts here!"
                    : filter === "upcoming"
                      ? "No upcoming trips"
                      : filter === "ongoing"
                        ? "No trips in progress"
                        : filter === "completed"
                          ? "No completed trips yet"
                          : "No trips found"}
              </h3>

              <p className="mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                {search
                  ? "Try another search or clear your filters."
                  : total === 0
                    ? "Create your first trip and start planning something unforgettable."
                    : filter === "ongoing"
                      ? "When a trip begins, you'll find it here."
                      : filter === "completed"
                        ? "Your finished adventures will appear here."
                        : "Ready for another adventure? Start planning your next trip."}
              </p>

              {search || total > 0 ? (
                <Link
                  href="/trips"
                  className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-brand-orange hover:bg-brand-orange/85 px-3 py-3 font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  View All Trips
                </Link>
              ) : (
                <Link
                  href="/trips/new"
                  className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-brand-orange hover:bg-brand-orange/85 px-3 py-3 font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Trip
                </Link>
              )}
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <nav
              aria-label="Trip pagination"
              className="flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row"
            >
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredCount)} of{" "}
                {filteredCount} trips
              </p>

              <div className="flex items-center gap-3">
                {/* PREVIOUS PAGE */}
                {currentPage > 1 ? (
                  <Link
                    href={pageUrl(currentPage - 1)}
                    scroll={false}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold hover:bg-secondary"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground opacity-50">
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </span>
                )}

                {/* CURRENT PAGE */}
                <span className="text-sm font-bold">
                  {currentPage} / {totalPages}
                </span>

                {/* NEXT PAGE */}
                {currentPage < totalPages ? (
                  <Link
                    href={pageUrl(currentPage + 1)}
                    scroll={false}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold hover:bg-secondary"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground opacity-50">
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
