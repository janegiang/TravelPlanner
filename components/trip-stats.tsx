"use client";

import { useSyncExternalStore } from "react";
import {
  CalendarDays,
  MapPin,
  Plane,
  Clock3,
  type LucideIcon,
} from "lucide-react";

import type { Trip, Location, Flight } from "@/app/generated/prisma/client";

import {
  formatTripDate,
  getTripDuration,
  getTripStatus,
  getDaysUntil,
  getCurrentTripDay,
  getTodayUTC,
} from "@/lib/trip-dates";

const subscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

interface TripStatsProps {
  trip: Trip & {
    locations: Location[];
    flights: Flight[];
  };
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}

function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>

        <div className="rounded-lg bg-gray-100 p-2">
          <Icon className="h-5 w-5 text-gray-600" />
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
        {value}
      </p>

      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}

export default function TripStats({ trip }: TripStatsProps) {
  const isClient = useIsClient();
  const today = isClient ? getTodayUTC() : null;

  const duration = getTripDuration(trip.startDate, trip.endDate);

  const status = today
    ? getTripStatus(trip.startDate, trip.endDate, today)
    : null;

  let countdownValue = "—";
  let countdownDescription = "Checking trip status";

  if (today && status) {
    if (status === "upcoming") {
      const days = getDaysUntil(trip.startDate, today);

      countdownValue = `${days} ${days === 1 ? "day" : "days"}`;
      countdownDescription = days === 1 ? "Starts tomorrow" : "Until departure";
    } else if (status === "ongoing") {
      const currentDay = getCurrentTripDay(trip.startDate, trip.endDate, today);

      countdownValue = `Day ${currentDay}`;
      countdownDescription = `Of ${duration} total days`;
    } else {
      countdownValue = "Completed";
      countdownDescription = "Your trip has ended";
    }
  }

  return (
    <section aria-label="Trip statistics">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Trip Duration"
          value={`${duration} ${duration === 1 ? "day" : "days"}`}
          description={`${formatTripDate(trip.startDate, {
            year: undefined,
          })} – ${formatTripDate(trip.endDate, {
            year: undefined,
          })}`}
          icon={CalendarDays}
        />

        <StatCard
          title="Destinations"
          value={String(trip.locations.length)}
          description={
            trip.locations.length === 1
              ? "Planned location"
              : "Planned locations"
          }
          icon={MapPin}
        />

        <StatCard
          title="Flights"
          value={String(trip.flights.length)}
          description={
            trip.flights.length === 1 ? "Saved flight" : "Saved flights"
          }
          icon={Plane}
        />

        <StatCard
          title="Trip Countdown"
          value={countdownValue}
          description={countdownDescription}
          icon={Clock3}
        />
      </div>
    </section>
  );
}
