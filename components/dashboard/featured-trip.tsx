// import Link from "next/link";
// import { ArrowRight, CalendarDays, MapPin, Plane } from "lucide-react";

// import {
//   formatTripDate,
//   getCountdownLabel,
//   getTripDuration,
// } from "@/lib/trip-dates";

// import type { DashboardTrip } from "./trip-card";

// type FeaturedTripProps = {
//   trip: DashboardTrip;
//   status: "ongoing" | "upcoming";
// };

// export default function FeaturedTrip({ trip, status }: FeaturedTripProps) {
//   const destination =
//     trip.locations[0]?.locationTitle || "Your next destination";

//   const duration = getTripDuration(trip.startDate, trip.endDate);

//   const isOngoing = status === "ongoing";

//   return (
//     <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
//       <div className="grid lg:grid-cols-2">
//         {/* LEFT SIDE - TRIP INFORMATION */}
//         <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
//           {/* Dynamic heading */}
//           <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-secondary-foreground">
//             <Plane className="h-4 w-4 text-brand-orange" />

//             {isOngoing ? "Your Current Adventure" : "Your Next Adventure"}
//           </div>

//           {/* Trip title */}
//           <h2 className="mb-3 text-3xl font-black tracking-tight sm:text-4xl">
//             {trip.title}
//           </h2>

//           {/* Description */}
//           <p className="mb-6 line-clamp-3 leading-relaxed text-foreground/80">
//             {trip.description}
//           </p>

//           {/* Locations */}
//           <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
//             <MapPin className="h-4 w-4 shrink-0 text-brand-orange" />

//             <span>
//               {trip.locations.length === 0 ? (
//                 "No locations added yet"
//               ) : (
//                 <>
//                   {destination}
//                   {trip.locations.length > 1 &&
//                     ` and ${trip.locations.length - 1} more ${
//                       trip.locations.length - 1 === 1 ? "location" : "locations"
//                     }`}
//                 </>
//               )}
//             </span>
//           </div>

//           {/* Trip status and dates */}
//           <div className="mb-6 flex flex-wrap items-center gap-3">
//             <span
//               className={`rounded-xl px-4 py-2 text-sm font-extrabold ${
//                 isOngoing
//                   ? "bg-brand-gold text-brand-ink"
//                   : "bg-brand-gold text-brand-ink"
//               }`}
//             >
//               {isOngoing
//                 ? "Adventure in Progress"
//                 : getCountdownLabel(trip.startDate)}
//             </span>

//             <span className="flex items-center gap-2 text-sm font-semibold">
//               <CalendarDays className="h-4 w-4 text-brand-orange" />
//               {formatTripDate(trip.startDate)}
//               {" – "}
//               {formatTripDate(trip.endDate)}
//               {" · "}
//               {duration} {duration === 1 ? "day" : "days"}
//             </span>
//           </div>

//           {/* View itinerary button */}
//           <Link
//             href={`/trips/${trip.id}`}
//             className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition-colors hover:bg-brand-orange/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
//           >
//             View Itinerary
//             <ArrowRight className="h-4 w-4" />
//           </Link>
//         </div>

//         {/* RIGHT SIDE - TRIP IMAGE */}
//         <div className="relative min-h-64 bg-brand-olive lg:min-h-96">
//           {trip.imageUrl ? (
//             <div
//               role="img"
//               aria-label={`Cover image for ${trip.title}`}
//               className="absolute inset-0 bg-cover bg-center"
//               style={{
//                 backgroundImage: `url("${encodeURI(trip.imageUrl)}")`,
//               }}
//             />
//           ) : (
//             <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-brand-olive to-brand-gold text-white">
//               <Plane className="h-20 w-20" />

//               <span className="text-lg font-black tracking-widest uppercase">
//                 Adventure awaits
//               </span>
//             </div>
//           )}
//         </div>
//       </div>
//     </section>
//   );
// }

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MapPin, Plane } from "lucide-react";

import {
  formatTripDate,
  getCountdownLabel,
  getTripDuration,
} from "@/lib/trip-dates";

import type { DashboardTrip } from "./trip-card";

type FeaturedTripProps = {
  trip: DashboardTrip;
  status: "ongoing" | "upcoming";
};

export default function FeaturedTrip({ trip, status }: FeaturedTripProps) {
  const destination =
    trip.locations[0]?.locationTitle || "Your next destination";

  const duration = getTripDuration(trip.startDate, trip.endDate);

  const isOngoing = status === "ongoing";

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="grid lg:grid-cols-2">
        {/* LEFT SIDE - TRIP INFORMATION */}
        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          {/* 1. DYNAMIC HEADING */}
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-secondary-foreground">
            <Plane className="h-4 w-4 text-brand-orange" />
            {isOngoing ? "Your Current Adventure" : "Your Next Adventure"}
          </div>

          {/* 2. TRIP TITLE */}
          <h2 className="mb-2 text-3xl font-black tracking-tight sm:text-4xl">
            {trip.title}
          </h2>

          {/* 3. TRIP DESCRIPTION */}
          <p className="mb-6 line-clamp-3 text-base leading-relaxed text-foreground/75">
            {trip.description}
          </p>

          {/* TRIP DETAILS */}
          <div className="mb-7 space-y-4">
            {/* 4. LOCATIONS */}
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />

              <span className="text-sm font-semibold text-foreground/85">
                {trip.locations.length === 0 ? (
                  "No locations added yet"
                ) : (
                  <>
                    {destination}
                    {trip.locations.length > 1 &&
                      ` and ${trip.locations.length - 1} more ${
                        trip.locations.length - 1 === 1
                          ? "location"
                          : "locations"
                      }`}
                  </>
                )}
              </span>
            </div>

            {/* 5. TRIP DATES */}
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />

              <span className="text-sm font-semibold text-foreground/85">
                {formatTripDate(trip.startDate)}
                {" – "}
                {formatTripDate(trip.endDate)}
              </span>
            </div>

            {/* 6. TRIP DURATION */}
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground/85">
                  {duration} {duration === 1 ? "day" : "days"}
                </span>

                {!isOngoing && (
                  <span className="rounded-full bg-brand-gold px-3 py-1 text-xs font-extrabold text-brand-ink">
                    {getCountdownLabel(trip.startDate)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 7. VIEW ITINERARY BUTTON */}
          <div className="flex justify-center">
            <Link
              href={`/trips/${trip.id}`}
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition-colors hover:bg-brand-orange/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              View Itinerary
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* RIGHT SIDE - TRIP IMAGE */}
        <div className="relative min-h-64 bg-brand-olive lg:min-h-96">
          {trip.imageUrl ? (
            <div
              role="img"
              aria-label={`Cover image for ${trip.title}`}
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url("${encodeURI(trip.imageUrl)}")`,
              }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-brand-olive to-brand-gold text-white">
              <Plane className="h-20 w-20" />

              <span className="text-lg font-black tracking-widest uppercase">
                Adventure awaits
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
