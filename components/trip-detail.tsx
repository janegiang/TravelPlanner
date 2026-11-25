"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  LayoutDashboard,
  Map as MapIcon,
  MapPin,
  Plane,
  Plus,
  X,
  Clock3,
  Hourglass,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { Trip, Location, Flight } from "@/app/generated/prisma/client";

import { formatTripDate, getTripDuration } from "@/lib/trip-dates";

import { refreshFlight } from "@/lib/actions/refresh-flight";

import TripHeader from "@/components/trip-header";
import TripStats from "@/components/trip-stats";
import TripActivityPreview from "@/components/trip-activity-preview";
import Map from "@/components/map";
import SortableItinerary from "@/components/sortable-itinerary";

import FlightTicketCard from "@/components/flight-ticket-card";
import EditFlightDialog from "@/components/edit-flight-dialog";
import DeleteFlightDialog from "@/components/delete-flight-dialog";

// ======================================
// TYPES
// ======================================

export type TripWithLocationsAndFlights = Trip & {
  locations: Location[];
  flights: Flight[];
};

interface TripDetailClientProps {
  trip: TripWithLocationsAndFlights;
}

const VALID_TABS = ["overview", "flight", "itinerary", "map"] as const;

type TripTab = (typeof VALID_TABS)[number];

function isTripTab(value: string | null): value is TripTab {
  return VALID_TABS.some((tab) => tab === value);
}

// ======================================
// FLIGHT SORTING
// ======================================

function sortFlights(flights: Flight[]): Flight[] {
  return [...flights].sort((a, b) => {
    const dateA = a.departureDate || "";
    const dateB = b.departureDate || "";

    const dateComparison = dateA.localeCompare(dateB);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    const timeA = a.departureTime || "99:99";
    const timeB = b.departureTime || "99:99";

    const timeComparison = timeA.localeCompare(timeB);

    if (timeComparison !== 0) {
      return timeComparison;
    }

    return a.flightNumber.localeCompare(b.flightNumber);
  });
}

// ======================================
// TRIP COUNTDOWN
// ======================================

// Compare calendar days rather than exact
// timestamps to avoid timezone-related
// countdown differences.
//
// Trip dates are treated as UTC calendar dates.
// Today is based on the user's local timezone.

function getTripCountdown(startDate: Date, endDate: Date): string {
  const now = new Date();

  const todayDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const start = new Date(startDate);
  const end = new Date(endDate);

  const startDay = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
  );

  const endDay = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
  );

  const daysUntilTrip = Math.round(
    (startDay - todayDay) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilTrip > 0) {
    return `${daysUntilTrip} ${daysUntilTrip === 1 ? "day" : "days"}`;
  }

  if (todayDay <= endDay) {
    return "In Progress";
  }

  return "Completed";
}

// ======================================
// MAIN TRIP DETAIL COMPONENT
// ======================================

export default function TripDetailClient({ trip }: TripDetailClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ======================================
  // TAB NAVIGATION
  // ======================================

  const requestedTab = searchParams.get("tab");

  const initialTab: TripTab = isTripTab(requestedTab)
    ? requestedTab
    : "overview";

  const [activeTab, setActiveTab] = useState<TripTab>(initialTab);

  const newLocationId = searchParams.get("locationId");

  const restoreScroll = searchParams.get("restoreScroll");

  const restoreFlightScroll = searchParams.get("restoreFlightScroll");

  const tripDuration = getTripDuration(trip.startDate, trip.endDate);

  // ======================================
  // TRIP COUNTDOWN STATE
  // ======================================

  const [tripCountdown, setTripCountdown] = useState<string>("—");

  useEffect(() => {
    setTripCountdown(getTripCountdown(trip.startDate, trip.endDate));
  }, [trip.startDate, trip.endDate]);

  // ======================================
  // FLIGHT MANAGEMENT STATE
  // ======================================

  const [editingFlightId, setEditingFlightId] = useState<string | null>(null);

  const [deletingFlightId, setDeletingFlightId] = useState<string | null>(null);

  // ======================================
  // REFRESH FLIGHT STATE
  // ======================================

  const [refreshingFlightId, setRefreshingFlightId] = useState<string | null>(
    null,
  );

  const [refreshError, setRefreshError] = useState<string | null>(null);

  const refreshingFlightRef = useRef(false);

  // ======================================
  // SELECTED FLIGHTS
  // ======================================

  const editingFlight =
    trip.flights.find((flight) => flight.id === editingFlightId) ?? null;

  const deletingFlight =
    trip.flights.find((flight) => flight.id === deletingFlightId) ?? null;

  const sortedFlights = sortFlights(trip.flights);

  // ======================================
  // SCROLL RESTORATION
  // ======================================

  const handledNavigationRef = useRef<string | null>(null);

  const handledFlightNavigationRef = useRef<string | null>(null);

  // Keep tab synchronized with URL changes.
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // ======================================
  // SAVE ITINERARY SCROLL POSITION
  // ======================================

  function saveItineraryScrollPosition() {
    sessionStorage.setItem(
      `trip-${trip.id}-itinerary-scroll`,
      String(window.scrollY),
    );
  }

  // ======================================
  // SAVE FLIGHT SCROLL POSITION
  // ======================================

  function saveFlightScrollPosition() {
    sessionStorage.setItem(
      `trip-${trip.id}-flight-scroll`,
      String(window.scrollY),
    );
  }

  // ======================================
  // TAB CHANGE
  // ======================================

  function handleTabChange(value: string) {
    if (!isTripTab(value)) return;

    setActiveTab(value);

    const params = new URLSearchParams(searchParams.toString());

    params.set("tab", value);

    // Remove old navigation instructions.
    params.delete("locationId");
    params.delete("restoreScroll");
    params.delete("restoreFlightScroll");

    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  }

  // ======================================
  // RESTORE ITINERARY SCROLL
  // ======================================

  useEffect(() => {
    if (activeTab !== "itinerary") return;

    const navigationKey = newLocationId
      ? `location:${trip.id}:${newLocationId}`
      : restoreScroll === "1"
        ? `restore:${trip.id}`
        : null;

    if (!navigationKey) {
      handledNavigationRef.current = null;
      return;
    }

    let cancelled = false;
    let frameId = 0;
    let attempts = 0;

    const maxAttempts = 60;

    function attemptScroll() {
      if (cancelled) return;

      if (newLocationId) {
        const element = document.getElementById(`location-${newLocationId}`);

        if (element) {
          handledNavigationRef.current = navigationKey;

          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          return;
        }
      } else if (restoreScroll === "1") {
        const savedPosition = sessionStorage.getItem(
          `trip-${trip.id}-itinerary-scroll`,
        );

        if (savedPosition !== null) {
          const position = Number(savedPosition);

          if (Number.isFinite(position) && position >= 0) {
            const maxScroll =
              document.documentElement.scrollHeight - window.innerHeight;

            if (maxScroll >= position - 2) {
              handledNavigationRef.current = navigationKey;

              window.scrollTo({
                top: position,
                behavior: "instant",
              });

              sessionStorage.removeItem(`trip-${trip.id}-itinerary-scroll`);

              return;
            }
          }
        } else {
          handledNavigationRef.current = navigationKey;

          return;
        }
      }

      attempts += 1;

      if (attempts < maxAttempts) {
        frameId = requestAnimationFrame(attemptScroll);
      }
    }

    frameId = requestAnimationFrame(attemptScroll);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [activeTab, newLocationId, restoreScroll, trip.id, trip.locations]);

  // ======================================
  // RESTORE FLIGHT SCROLL
  // ======================================

  useEffect(() => {
    if (activeTab !== "flight") return;

    if (restoreFlightScroll !== "1") {
      handledFlightNavigationRef.current = null;

      return;
    }

    const navigationKey = `flight:${trip.id}`;

    if (handledFlightNavigationRef.current === navigationKey) {
      return;
    }

    const savedPosition = sessionStorage.getItem(
      `trip-${trip.id}-flight-scroll`,
    );

    if (savedPosition === null) {
      handledFlightNavigationRef.current = navigationKey;

      return;
    }

    const position = Number(savedPosition);

    if (!Number.isFinite(position) || position < 0) {
      sessionStorage.removeItem(`trip-${trip.id}-flight-scroll`);

      handledFlightNavigationRef.current = navigationKey;

      return;
    }

    let cancelled = false;
    let frameId = 0;
    let attempts = 0;

    const maxAttempts = 60;

    function attemptScroll() {
      if (cancelled) return;

      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );

      if (maxScroll >= position - 2) {
        handledFlightNavigationRef.current = navigationKey;

        window.scrollTo({
          top: position,
          behavior: "instant",
        });

        sessionStorage.removeItem(`trip-${trip.id}-flight-scroll`);

        return;
      }

      attempts += 1;

      if (attempts < maxAttempts) {
        frameId = requestAnimationFrame(attemptScroll);
      } else {
        handledFlightNavigationRef.current = navigationKey;

        window.scrollTo({
          top: Math.min(position, maxScroll),
          behavior: "instant",
        });

        sessionStorage.removeItem(`trip-${trip.id}-flight-scroll`);
      }
    }

    frameId = requestAnimationFrame(attemptScroll);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [activeTab, restoreFlightScroll, trip.id, trip.flights]);

  // ======================================
  // EDIT FLIGHT
  // ======================================

  function handleEditFlight(flight: Flight) {
    setDeletingFlightId(null);
    setRefreshError(null);
    setEditingFlightId(flight.id);
  }

  // ======================================
  // DELETE FLIGHT
  // ======================================

  function handleDeleteFlight(flight: Flight) {
    setEditingFlightId(null);
    setRefreshError(null);
    setDeletingFlightId(flight.id);
  }

  // ======================================
  // REFRESH FLIGHT
  // ======================================

  async function handleRefreshFlight(flight: Flight) {
    // Prevent simultaneous refresh requests.
    if (refreshingFlightRef.current) {
      return;
    }

    refreshingFlightRef.current = true;

    setRefreshingFlightId(flight.id);
    setRefreshError(null);

    try {
      // Retrieve latest flight information
      // from AirLabs and update the database.
      const result = await refreshFlight(flight.id, trip.id);

      if (!result.success) {
        throw new Error("Could not refresh flight information.");
      }

      // Refresh server component data.
      // The Flights tab remains selected.
      router.refresh();
    } catch (error) {
      console.error("Failed to refresh flight:", error);

      setRefreshError(
        error instanceof Error
          ? error.message
          : "Could not refresh flight information. Please try again.",
      );
    } finally {
      refreshingFlightRef.current = false;
      setRefreshingFlightId(null);
    }
  }

  // ======================================
  // SHARED TAB STYLES
  // ======================================

  const tabTriggerClass =
    "cursor-pointer rounded-lg transition-colors " +
    "px-4 py-2.5 text-normal sm:text-base gap-2 " +
    "data-[state=active]:!bg-brand-gold " +
    "data-[state=active]:!text-brand-ink " +
    "hover:bg-brand-gold/50";

  // ======================================
  // RENDER
  // ======================================

  return (
    <div className="min-h-screen w-full bg-brand-cream">
      <div className="container mx-auto space-y-8 px-4 py-8">
        {/* ====================================== */}
        {/* TRIP HEADER */}
        {/* ====================================== */}

        <TripHeader trip={trip} />

        {/* ====================================== */}
        {/* MAIN NAVIGATION */}
        {/* ====================================== */}

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            {/* NAVIGATION */}

            <div className="mb-6 w-full overflow-x-auto pb-1">
              <TabsList className="inline-flex h-auto min-w-max items-center gap-1.5 rounded-xl bg-white p-2">
                {/* Overview */}
                <TabsTrigger value="overview" className={tabTriggerClass}>
                  <LayoutDashboard className="h-6 w-6" />
                  <span>Overview</span>
                </TabsTrigger>

                {/* Flights */}
                <TabsTrigger value="flight" className={tabTriggerClass}>
                  <Plane className="h-6 w-6" />
                  <span>Flights</span>

                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                    {trip.flights.length}
                  </span>
                </TabsTrigger>

                {/* Itinerary */}
                <TabsTrigger value="itinerary" className={tabTriggerClass}>
                  <MapPin className="h-6 w-6" />
                  <span>Itinerary</span>

                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                    {trip.locations.length}
                  </span>
                </TabsTrigger>

                {/* Map */}
                <TabsTrigger value="map" className={tabTriggerClass}>
                  <MapIcon className="h-6 w-6" />
                  <span>Map</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ====================================== */}
            {/* OVERVIEW TAB */}
            {/* ====================================== */}

            <TabsContent value="overview" className="space-y-6">
              <div className="grid items-stretch gap-6 md:grid-cols-2">
                {/* ====================================== */}
                {/* TRIP SUMMARY */}
                {/* ====================================== */}

                <div className="flex min-w-0 flex-col">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Trip Summary
                  </h2>

                  {/* SUMMARY CARD */}
                  <div className="mt-5 flex flex-1 flex-col justify-between rounded-xl border border-gray-200 !bg-background p-5 shadow-sm sm:p-6">
                    {/* MAIN SUMMARY GRID */}
                    <div className="grid grid-cols-2 gap-x-5 gap-y-6">
                      {/* TRIP DATES */}
                      <div className="col-span-2 flex items-start gap-3">
                        <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />

                        <div className="min-w-0">
                          <p className="font-medium text-muted-foreground">
                            Trip Dates
                          </p>

                          <p className="mt-1 text-lg font-bold text-brand-ink">
                            {formatTripDate(trip.startDate)}
                            {" – "}
                            {formatTripDate(trip.endDate)}
                          </p>
                        </div>
                      </div>

                      {/* DURATION */}
                      <div className="flex items-start gap-3">
                        <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />

                        <div className="min-w-0">
                          <p className="font-medium text-muted-foreground">
                            Duration
                          </p>

                          <p className="mt-1 text-lg font-bold text-brand-ink">
                            {tripDuration} {tripDuration === 1 ? "day" : "days"}
                          </p>
                        </div>
                      </div>

                      {/* COUNTDOWN */}
                      <div className="flex items-start gap-3">
                        <Hourglass className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />

                        <div className="min-w-0">
                          <p className="font-medium text-muted-foreground">
                            Countdown
                          </p>

                          <p className="mt-1 text-lg font-bold text-brand-ink">
                            {tripCountdown}
                          </p>
                        </div>
                      </div>

                      {/* FLIGHTS */}
                      <div className="flex items-start gap-3">
                        <Plane className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />

                        <div className="min-w-0">
                          <p className="font-medium text-muted-foreground">
                            Flights
                          </p>

                          <p className="mt-1 text-lg font-bold text-brand-ink">
                            {trip.flights.length}
                          </p>
                        </div>
                      </div>

                      {/* DESTINATIONS */}
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />

                        <div className="min-w-0">
                          <p className="font-medium text-muted-foreground">
                            Destinations
                          </p>

                          <p className="mt-1 text-lg font-bold text-brand-ink">
                            {trip.locations.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ====================================== */}
                {/* DESTINATION MAP */}
                {/* ====================================== */}

                <div className="flex min-w-0 flex-col">
                  {/* MAP HEADER */}
                  <h2 className="text-3xl font-bold text-gray-900">
                    Destination Map
                  </h2>

                  {/* MAP CARD - MATCHES TRIP SUMMARY HEIGHT */}
                  <div className="mt-5 flex min-h-[265px] flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 !bg-background shadow-sm">
                    {/* MAP PREVIEW */}
                    <div className="relative min-h-[160px] flex-1">
                      <div className="absolute inset-0"></div>
                      <Map itineraries={trip.locations} />
                    </div>

                    {/* MAP FOOTER */}
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white p-4">
                      {/* SAVED DESTINATIONS */}
                      <p className="flex items-center gap-2 text-sm text-foreground">
                        <MapPin className="h-4 w-4 shrink-0 text-brand-orange" />

                        {trip.locations.length === 0
                          ? "No destinations added yet"
                          : `${trip.locations.length} saved ${
                              trip.locations.length === 1
                                ? "destination"
                                : "destinations"
                            }`}
                      </p>

                      {/* VIEW FULL MAP BUTTON */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleTabChange("map")}
                        className="cursor-pointer gap-2 !bg-brand-orange !text-white hover:!bg-brand-orange/90"
                      >
                        View Full Map
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ====================================== */}
              {/* ACTIVITY PREVIEW */}
              {/* ====================================== */}
              <div className="pt-6">
                <TripActivityPreview
                  locations={trip.locations}
                  tripId={trip.id}
                  onViewItinerary={() => handleTabChange("itinerary")}
                />
              </div>
            </TabsContent>

            {/* ====================================== */}
            {/* FLIGHTS TAB */}
            {/* ====================================== */}

            <TabsContent value="flight" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Flight Information
                  </h2>

                  <p className="mt-1 text-sm text-gray-700">
                    Manage your trip flights.
                  </p>
                </div>

                {/* Top Add Flight Button */}
                {trip.flights.length > 0 && (
                  <Link
                    href={`/trips/${trip.id}/flight/new`}
                    onClick={saveFlightScrollPosition}
                  >
                    <Button className="gap-2 bg-brand-orange text-white hover:bg-brand-orange/90 cursor-pointer">
                      <Plus className="h-4 w-4" />
                      Add Flight
                    </Button>
                  </Link>
                )}
              </div>

              {/* ====================================== */}
              {/* REFRESH ERROR MESSAGE */}
              {/* ====================================== */}

              {refreshError && (
                <div
                  role="alert"
                  className={
                    "flex items-start gap-3 rounded-xl " +
                    "border border-red-200 bg-red-50 " +
                    "p-4 text-sm text-red-700"
                  }
                >
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">Could not refresh flight</p>

                    <p className="mt-1 leading-relaxed">{refreshError}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRefreshError(null)}
                    aria-label="Dismiss refresh error"
                    className="rounded-md p-1 transition-colors hover:bg-red-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* ====================================== */}
              {/* EMPTY STATE */}
              {/* ====================================== */}

              {trip.flights.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-background px-4 py-10 text-center">
                  <Plane className="mx-auto mb-3 h-9 w-9 text-gray-400" />

                  <h3 className="font-semibold text-gray-900">
                    No flights added yet
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Add your flight details to keep of track your flight status.
                  </p>

                  <Link
                    href={`/trips/${trip.id}/flight/new`}
                    onClick={saveFlightScrollPosition}
                    className="mt-4 inline-block"
                  >
                    <Button className="gap-2 bg-brand-orange text-white hover:bg-brand-orange/90 cursor-pointer">
                      <Plus className="h-4 w-4" />
                      Add Flight
                    </Button>
                  </Link>
                </div>
              ) : (
                /* ====================================== */
                /* FLIGHT TICKETS + BOTTOM ADD BUTTON */
                /* ====================================== */

                <div className="space-y-6">
                  {/* Flight Ticket Cards */}

                  <div className="grid gap-5 lg:grid-cols-2">
                    {sortedFlights.map((flight) => (
                      <FlightTicketCard
                        key={flight.id}
                        flight={flight}
                        onEdit={handleEditFlight}
                        onDelete={handleDeleteFlight}
                        onRefresh={handleRefreshFlight}
                        isRefreshing={refreshingFlightId === flight.id}
                      />
                    ))}
                  </div>

                  {/* Bottom Add Flight Button */}

                  <div className="flex justify-center pt-4">
                    <Link
                      href={`/trips/${trip.id}/flight/new`}
                      onClick={saveFlightScrollPosition}
                    >
                      <Button
                        type="button"
                        className="gap-2 bg-brand-orange text-white hover:bg-brand-orange/90 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Add Flight
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ====================================== */}
            {/* ITINERARY TAB */}
            {/* ====================================== */}

            <TabsContent value="itinerary" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Full Itinerary
                  </h2>

                  <p className="mt-1 text-sm text-gray-700">
                    Organize and manage your trip destinations.
                  </p>
                </div>

                {/* Top Add Location */}
                {trip.locations.length > 0 && (
                  <Link
                    href={`/trips/${trip.id}/itinerary/new`}
                    onClick={saveItineraryScrollPosition}
                  >
                    <Button className="gap-2 bg-brand-orange text-white hover:bg-brand-orange/90 cursor-pointer">
                      <Plus className="h-4 w-4" />
                      Add Location
                    </Button>
                  </Link>
                )}
              </div>

              {trip.locations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-background px-4 py-10 text-center">
                  <MapPin className="mx-auto mb-3 h-9 w-9 text-gray-400" />

                  <h3 className="font-semibold text-gray-900">
                    No locations added yet
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Start building your itinerary by adding your first location.
                  </p>

                  <Link
                    href={`/trips/${trip.id}/itinerary/new`}
                    onClick={saveItineraryScrollPosition}
                    className="mt-4 inline-block"
                  >
                    <Button className="gap-2 bg-brand-orange text-white hover:bg-brand-orange/90 cursor-pointer">
                      <Plus className="h-4 w-4" />
                      Add Location
                    </Button>
                  </Link>
                </div>
              ) : (
                <SortableItinerary
                  locations={trip.locations}
                  tripId={trip.id}
                  startDate={trip.startDate}
                  endDate={trip.endDate}
                />
              )}
            </TabsContent>

            {/* ====================================== */}
            {/* MAP TAB */}
            {/* ====================================== */}

            <TabsContent value="map" className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Trip Map</h2>

                <p className="mt-1 text-sm text-gray-700">
                  Explore all your saved destinations.
                </p>
              </div>

              <div className="h-[500px] overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <Map itineraries={trip.locations} />
              </div>

              {trip.locations.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                  <p className="mb-4 text-sm text-gray-500">
                    Add locations to see them on the map.
                  </p>

                  <Link
                    href={`/trips/${trip.id}/itinerary/new`}
                    onClick={saveItineraryScrollPosition}
                  >
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Location
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ====================================== */}
        {/* EDIT FLIGHT DIALOG */}
        {/* ====================================== */}

        {editingFlight && (
          <EditFlightDialog
            key={editingFlight.id}
            flight={editingFlight}
            tripId={trip.id}
            open={editingFlightId !== null}
            onOpenChange={(nextOpen) => {
              if (!nextOpen) {
                setEditingFlightId(null);
              }
            }}
          />
        )}

        {/* ====================================== */}
        {/* DELETE FLIGHT DIALOG */}
        {/* ====================================== */}

        {deletingFlight && (
          <DeleteFlightDialog
            key={deletingFlight.id}
            flight={deletingFlight}
            tripId={trip.id}
            open={deletingFlightId !== null}
            onOpenChange={(nextOpen) => {
              if (!nextOpen) {
                setDeletingFlightId(null);
              }
            }}
          />
        )}

        {/* ====================================== */}
        {/* BACK TO DASHBOARD */}
        {/* ====================================== */}

        <div className="text-center">
          <Link href="/trips">
            <Button
              variant="outline"
              className={
                "cursor-pointer " +
                "border border-brand-olive/30 " +
                "!bg-brand-olive px-6 py-3 " +
                "font-semibold text-white " +
                "shadow-sm transition-colors duration-200 " +
                "hover:!bg-[#595824] " +
                "hover:!text-white "
              }
            >
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
