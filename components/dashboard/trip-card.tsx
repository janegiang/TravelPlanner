import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import {
  formatTripDate,
  getTripDuration,
  type TripStatus,
} from "@/lib/trip-dates";

export type DashboardTrip = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  startDate: Date;
  endDate: Date;
  locations: {
    locationTitle: string;
  }[];
};

export function StatusBadge({ status }: { status: TripStatus }) {
  const styles = {
    upcoming: "bg-brand-ink text-white",
    ongoing: "bg-brand-ink text-white",
    completed: "bg-brand-ink text-white",
  };

  const labels = {
    upcoming: "Upcoming",
    ongoing: "Ongoing",
    completed: "Completed",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}
    >
      {status === "ongoing" && (
        <span className="mr-2 h-2 w-2 rounded-full bg-white" />
      )}
      {labels[status]}
    </span>
  );
}

export default function TripCard({
  trip,
  status,
}: {
  trip: DashboardTrip;
  status: TripStatus;
}) {
  const destination = trip.locations[0]?.locationTitle || "Your adventure";

  const duration = getTripDuration(trip.startDate, trip.endDate);

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      aria-label={`View trip: ${trip.title}`}
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="relative h-48 overflow-hidden bg-brand-olive">
          {trip.imageUrl ? (
            <div
              role="img"
              aria-label={`Cover image for ${trip.title}`}
              className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage: `url("${encodeURI(trip.imageUrl)}")`,
              }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-olive via-[#aaa85f] to-brand-gold text-white">
              <MapPin className="h-10 w-10" />
              <span className="text-sm font-semibold tracking-widest uppercase">
                Explore the world
              </span>
            </div>
          )}

          <div className="absolute left-4 top-4">
            <StatusBadge status={status} />
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-xl font-extrabold tracking-tight">
              {trip.title}
            </h3>

            <ArrowUpRight className="h-5 w-5 shrink-0 text-brand-orange transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>

          <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{destination}</span>
          </div>

          <p className="mb-5 line-clamp-2 flex-1 text-sm leading-relaxed text-foreground/75">
            {trip.description}
          </p>

          <div className="space-y-2 border-t border-foreground/10 pt-4">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 shrink-0 text-brand-orange" />
              <span>
                {formatTripDate(trip.startDate, {
                  year: undefined,
                })}{" "}
                – {formatTripDate(trip.endDate)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock3 className="h-4 w-4 shrink-0 text-brand-orange" />
              <span>
                {duration} {duration === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
