"use client";

import Link from "next/link";
import { ArrowRight, ListOrdered, MapPin, Plus } from "lucide-react";

import type { Location } from "@/app/generated/prisma/client";

import { Button } from "@/components/ui/button";

interface TripActivityPreviewProps {
  locations: Location[];
  tripId: string;
  onViewItinerary: () => void;
}

export default function TripActivityPreview({
  locations,
  tripId,
  onViewItinerary,
}: TripActivityPreviewProps) {
  // Sort locations by their saved itinerary order.
  const sortedLocations = [...locations].sort((a, b) => a.order - b.order);

  // Show only the first three locations.
  const previewLocations = sortedLocations.slice(0, 3);

  return (
    <div className=" space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Planned Destinations</h2>

      {/* Empty State */}
      {locations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-background px-4 py-10 text-center">
          <MapPin className="mx-auto mb-3 h-9 w-9 text-gray-400" />

          <h3 className="font-semibold text-gray-900">
            No activities planned yet
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Start building your itinerary by adding your first destination.
          </p>

          <Link href={`/trips/${tripId}/itinerary/new`} className="mt-5">
            <Button className="gap-2 cursor-pointer bg-brand-orange text-white hover:bg-brand-orange/90">
              <Plus className="h-4 w-4" />
              Add Location
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Activity List */}
          <div className="space-y-3">
            {previewLocations.map((location, index) => (
              <div
                key={location.id}
                className="bg-white group flex items-center gap-4 rounded-xl border border-gray-200 p-3 transition-colors hover:bg-gray-50"
              >
                {/* Location Number */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-cream font-bold text-brand-orange">
                  {index + 1}
                </div>

                {/* Location Details */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-gray-900">
                    {location.locationTitle}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray/20 pt-4">
            <p className="text-normal text-foreground">
              {locations.length > 3
                ? `Showing 3 of ${locations.length} locations`
                : `Showing all ${locations.length} ${locations.length === 1 ? "location" : "locations"}`}
            </p>

            <Button
              variant="outline"
              className="gap-2 !bg-brand-orange !text-white hover:!bg-brand-orange/90 cursor-pointer"
              onClick={onViewItinerary}
            >
              View Full Itinerary
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
