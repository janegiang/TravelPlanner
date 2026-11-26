"use client";

import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";

import type { Trip } from "@/app/generated/prisma/client";

import { Button } from "@/components/ui/button";

// ======================================
// TYPES
// ======================================

interface TripHeaderProps {
  trip: Trip;
}

// ======================================
// TRIP HEADER
// ======================================

export default function TripHeader({ trip }: TripHeaderProps) {
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
