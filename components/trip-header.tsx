// "use client";

// import Image from "next/image";
// import { useEffect, useState } from "react";
// import Link from "next/link";

// import { CalendarDays, Clock3, Pencil, Plane, MapPin } from "lucide-react";

// import type { Trip } from "@/app/generated/prisma/client";

// import {
//   formatTripDate,
//   getCountdownLabel,
//   getCurrentTripDay,
//   getTripDuration,
//   getTodayUTC,
//   getTripStatus,
//   type TripStatus,
// } from "@/lib/trip-dates";

// import { Button } from "@/components/ui/button";

// // ======================================
// // TYPES
// // ======================================

// interface TripHeaderProps {
//   trip: Trip;
// }

// // ======================================
// // TRIP STATUS STYLING
// // ======================================

// const statusStyles: Record<TripStatus, string> = {
//   upcoming: "bg-[#DCEAFF] text-[#2454B5]",
//   ongoing: "bg-[#DDF2E2] text-[#205B3A]",
//   completed: "bg-[#E8E7E2] text-[#55534B]",
// };

// // ======================================
// // TRIP HEADER
// // ======================================

// export default function TripHeader({ trip }: TripHeaderProps) {
//   const [today, setToday] = useState<Date | null>(null);

//   // ======================================
//   // CURRENT DATE
//   // ======================================

//   useEffect(() => {
//     setToday(getTodayUTC());
//   }, []);

//   // ======================================
//   // TRIP STATUS
//   // ======================================

//   const status = today
//     ? getTripStatus(trip.startDate, trip.endDate, today)
//     : null;

//   const duration = getTripDuration(trip.startDate, trip.endDate);

//   // ======================================
//   // TRIP PROGRESS
//   // ======================================

//   const progressLabel =
//     !today || !status
//       ? null
//       : status === "upcoming"
//         ? getCountdownLabel(trip.startDate, today)
//         : status === "ongoing"
//           ? `Day ${getCurrentTripDay(
//               trip.startDate,
//               trip.endDate,
//               today,
//             )} of ${duration}`
//           : "Trip completed";

//   // ======================================
//   // RENDER
//   // ======================================

//   return (
//     <div className="overflow-hidden rounded-2xl border border-brand-olive/20 bg-white shadow-sm">
//       {/* ====================================== */}
//       {/* DESTINATION HERO */}
//       {/* ====================================== */}

//       <div
//         className={
//           "relative h-[200px] overflow-hidden " +
//           "bg-gradient-to-br " +
//           "from-[#6E9FC4] via-[#4A769A] to-[#243F55] " +
//           "sm:h-[240px] lg:h-[270px]"
//         }
//       >
//         {/* DESTINATION IMAGE */}
//         {trip.imageUrl && (
//           <Image
//             src={trip.imageUrl}
//             alt={trip.title}
//             fill
//             priority
//             sizes="(max-width: 768px) 100vw, 1200px"
//             className="object-cover object-center"
//           />
//         )}

//         {/* ====================================== */}
//         {/* IMAGE GRADIENT OVERLAY */}
//         {/* ====================================== */}

//         <div
//           className={
//             "absolute inset-0 " +
//             "bg-gradient-to-t " +
//             "from-black/80 via-black/30 to-transparent"
//           }
//         >
//           {trip.imageUrl ? (
//             <div
//               role="img"
//               aria-label={`Cover image for ${trip.title}`}
//               className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
//               style={{
//                 backgroundImage: `url("${encodeURI(trip.imageUrl)}")`,
//               }}
//             />
//           ) : (
//             <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-olive via-[#aaa85f] to-brand-gold text-white"></div>
//           )}
//         </div>

//         {/* ====================================== */}
//         {/* EDIT TRIP - TOP RIGHT CORNER */}
//         {/* ====================================== */}

//         <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
//           <Button
//             type="button"
//             variant="outline"
//             asChild
//             className={
//               "h-11 cursor-pointer gap-2 rounded-xl " +
//               "border border-brand-olive/25 " +
//               "!bg-brand-cream px-5 " +
//               "font-semibold text-brand-ink " +
//               "shadow-sm transition-colors " +
//               "hover:!bg-[#EAD9AC] " +
//               "hover:!text-brand-ink"
//             }
//           >
//             <Link href={`/trips/${trip.id}/edit`}>
//               <Pencil className="h-4 w-4" />
//               Edit Trip
//             </Link>
//           </Button>
//         </div>

//         {/* ====================================== */}
//         {/* HERO CONTENT */}
//         {/* ====================================== */}

//         <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8 lg:p-10">
//           {/* TRIP TITLE */}
//           <h1
//             className={
//               "max-w-4xl break-words " +
//               "text-4xl font-bold tracking-tight " +
//               "drop-shadow-lg " +
//               "sm:text-5xl lg:text-6xl"
//             }
//           >
//             {trip.title}
//           </h1>

//           {/* ====================================== */}
//           {/* TRIP DATE AND DURATION BADGES */}
//           {/* ====================================== */}

//           <div className="mt-5 flex flex-wrap items-center gap-3">
//             {/* TRIP DATES */}
//             <div
//               className={
//                 "inline-flex max-w-full items-center gap-2 " +
//                 "rounded-full border border-white/50 " +
//                 "bg-black/20 px-4 py-2 " +
//                 "text-sm font-medium text-white " +
//                 "backdrop-blur-sm sm:text-base"
//               }
//             >
//               <CalendarDays className="h-4 w-4 shrink-0" />

//               <span className="min-w-0">
//                 {formatTripDate(trip.startDate)}
//                 {" – "}
//                 {formatTripDate(trip.endDate)}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";

import { CalendarDays, Pencil } from "lucide-react";

import type { Trip } from "@/app/generated/prisma/client";

import {
  formatTripDate,
  getCountdownLabel,
  getCurrentTripDay,
  getTripDuration,
  getTodayUTC,
  getTripStatus,
  type TripStatus,
} from "@/lib/trip-dates";

import { Button } from "@/components/ui/button";

// ======================================
// TYPES
// ======================================

interface TripHeaderProps {
  trip: Trip;
}

// ======================================
// TRIP STATUS STYLING
// ======================================

const statusStyles: Record<TripStatus, string> = {
  upcoming: "bg-[#DCEAFF] text-[#2454B5]",
  ongoing: "bg-[#DDF2E2] text-[#205B3A]",
  completed: "bg-[#E8E7E2] text-[#55534B]",
};

// ======================================
// TRIP HEADER
// ======================================

export default function TripHeader({ trip }: TripHeaderProps) {
  const [today, setToday] = useState<Date | null>(null);

  // ======================================
  // CURRENT DATE
  // ======================================

  useEffect(() => {
    setToday(getTodayUTC());
  }, []);

  // ======================================
  // TRIP STATUS
  // ======================================

  const status = today
    ? getTripStatus(trip.startDate, trip.endDate, today)
    : null;

  const duration = getTripDuration(trip.startDate, trip.endDate);

  // ======================================
  // TRIP PROGRESS
  // ======================================

  const progressLabel =
    !today || !status
      ? null
      : status === "upcoming"
        ? getCountdownLabel(trip.startDate, today)
        : status === "ongoing"
          ? `Day ${getCurrentTripDay(
              trip.startDate,
              trip.endDate,
              today,
            )} of ${duration}`
          : "Trip completed";

  // ======================================
  // RENDER
  // ======================================

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-olive/20 bg-white shadow-sm">
      {/* ====================================== */}
      {/* DESTINATION HERO (IMAGE ONLY)          */}
      {/* ====================================== */}

      <div
        className={
          "relative h-[200px] overflow-hidden " +
          "bg-gradient-to-br " +
          "from-[#6E9FC4] via-[#4A769A] to-[#243F55] " +
          "sm:h-[240px] lg:h-[270px]"
        }
      >
        {/* DESTINATION IMAGE */}
        {trip.imageUrl ? (
          <Image
            src={trip.imageUrl}
            alt={trip.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1200px"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-olive via-[#aaa85f] to-brand-gold text-white" />
        )}

        {/* SUBTLE IMAGE GRADIENT OVERLAY */}
        <div
          className={
            "pointer-events-none absolute inset-0 " +
            "bg-gradient-to-t " +
            "from-black/30 via-transparent to-black/15"
          }
        />

        {/* ====================================== */}
        {/* EDIT TRIP - TOP RIGHT CORNER           */}
        {/* ====================================== */}

        <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
          <Button
            type="button"
            variant="outline"
            asChild
            className={
              "h-11 cursor-pointer gap-2 rounded-xl " +
              "border border-brand-olive/25 " +
              "!bg-brand-cream px-5 " +
              "font-semibold text-brand-ink " +
              "shadow-sm transition-colors " +
              "hover:!bg-[#EAD9AC] " +
              "hover:!text-brand-ink"
            }
          >
            <Link href={`/trips/${trip.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit Trip
            </Link>
          </Button>
        </div>
      </div>

      {/* ====================================== */}
      {/* TRIP TITLE & DATES (BELOW IMAGE)       */}
      {/* ====================================== */}

      <div className="flex flex-col justify-between gap-4 border-t border-brand-olive/15 bg-brand-gold px-6 py-5 sm:flex-row sm:items-center sm:px-8">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              {trip.title}
            </h1>
          </div>

          {trip.description && (
            <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-foreground/80">
              {trip.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
