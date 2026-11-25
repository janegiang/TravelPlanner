"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { APIProvider } from "@vis.gl/react-google-maps";

import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  Clock3,
  NotebookPen,
  Plus,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import LocationAutocomplete from "@/components/location-autocomplete";
import TimePicker from "@/components/time-picker";

import { addLocation } from "@/lib/actions/add-locations";
import { formatTripDate, getTripDuration } from "@/lib/trip-dates";

interface NewLocationClientProps {
  tripId: string;
  tripTitle: string;
  startDate: string;
  endDate: string;
}

export default function NewLocationClient({
  tripId,
  tripTitle,
  startDate,
  endDate,
}: NewLocationClientProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [selectedDay, setSelectedDay] = useState("unscheduled");
  const duration = getTripDuration(startDate, endDate);

  // Format the date corresponding to a trip day.
  function getDayDate(day: number) {
    const date = new Date(startDate);

    date.setUTCDate(date.getUTCDate() + day - 1);

    return formatTripDate(date);
  }

  // Return to the Itinerary tab and restore the saved scroll position.
  const itineraryReturnUrl = `/trips/${tripId}?tab=itinerary&restoreScroll=1`;

  // Handle successful location creation.
  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        const result = await addLocation(formData, tripId);

        // Navigate to the newly created location.
        router.push(
          `/trips/${tripId}?tab=itinerary&locationId=${encodeURIComponent(
            result.locationId,
          )}`,
          { scroll: false },
        );
      } catch (error) {
        console.error("Failed to add location:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Could not add location. Please try again.",
        );
      }
    });
  }

  const inputClassName =
    "w-full rounded-xl border border-input bg-white " +
    "px-4 py-3 text-sm text-foreground " +
    "placeholder:text-muted-foreground " +
    "outline-none transition-all " +
    "hover:border-brand-olive " +
    "focus:border-primary focus:ring-2 focus:ring-primary/20 " +
    "disabled:cursor-not-allowed disabled:opacity-60";

  const labelClassName =
    "mb-2 flex items-center gap-2 text-sm font-semibold text-brand-ink";

  // ======================================
  // TRIP DAY DROPDOWN STYLING (MATCHES SORT)
  // ======================================

  const selectTriggerClassName =
    "group !h-12 w-full cursor-pointer " +
    "rounded-xl border border-border " +
    "!bg-white px-4 " +
    "text-sm font-semibold text-foreground " +
    "shadow-none transition-colors " +
    "hover:border-brand-olive " +
    "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 " +
    "focus-visible:!border-primary focus-visible:!ring-2 focus-visible:!ring-primary/20 " +
    "data-[state=open]:!border-primary data-[state=open]:!ring-2 data-[state=open]:!ring-primary/20 " +
    "[&>svg:last-child]:transition-transform [&>svg:last-child]:duration-200 " +
    "data-[state=open]:[&>svg:last-child]:rotate-180";

  const selectContentClassName =
    "z-50 " +
    "!w-[auto] " +
    "!min-w-0 " +
    "!max-w-[calc(100vw-1rem)] " +
    "mt-1 overflow-hidden " +
    "rounded-xl border border-border " +
    "!bg-white !p-2 shadow-xl";

  function getSelectItemStyle(value: string) {
    const isSelected = selectedDay === value;

    return (
      "w-full min-w-0 cursor-pointer rounded-lg " +
      "!px-3 !py-2.5 !pr-8 " +
      "text-sm transition-colors " +
      "[&>span:first-child]:!right-3 [&>span:first-child]:!left-auto " +
      (isSelected
        ? "!bg-brand-olive !font-bold !text-white " +
          "hover:!bg-brand-olive hover:!text-white " +
          "focus:!bg-brand-olive focus:!text-white " +
          "data-[highlighted]:!bg-brand-olive data-[highlighted]:!text-white " +
          "[&_svg]:!text-white "
        : "!text-foreground " +
          "hover:!bg-brand-gold focus:!bg-brand-gold " +
          "data-[highlighted]:!bg-brand-gold data-[highlighted]:!text-foreground ")
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-background px-4 py-10 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Back Navigation */}
        <Link
          href={itineraryReturnUrl}
          scroll={false}
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-brand-ink transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Itinerary
        </Link>

        {/* Main Form Card */}
        <div className="rounded-2xl border border-border bg-brand-cream shadow-lg">
          {/* Olive Header */}
          <div className="rounded-t-2xl bg-brand-olive px-6 py-7 text-white sm:px-8">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-white/15 p-5">
                <MapPin className="h-7 w-7 text-white" />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Add New Location
                </h1>

                <p className="mt-2 text-sm leading-relaxed text-white/90">
                  Add a destination to{" "}
                  <span className="font-semibold">{tripTitle}</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            action={handleSubmit}
            className="space-y-6 p-6 sm:p-8"
            aria-busy={isPending}
          >
            {/* Location Name */}
            <div>
              <label htmlFor="address" className={labelClassName}>
                <MapPin className="h-4 w-4 text-brand-orange" />
                Location Name
              </label>

              <APIProvider
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
                version="weekly"
              >
                <LocationAutocomplete
                  name="address"
                  required
                  disabled={isPending}
                />
              </APIProvider>
            </div>

            {/* Day and Time */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Trip Day */}
              <div>
                <label htmlFor="dayNumber" className={labelClassName}>
                  <CalendarDays className="h-4 w-4 text-brand-orange" />
                  Trip Day
                </label>

                <Select
                  name="dayNumber"
                  value={selectedDay}
                  onValueChange={setSelectedDay}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="dayNumber"
                    className={selectTriggerClassName}
                  >
                    <SelectValue placeholder="Select a trip day" />
                  </SelectTrigger>

                  <SelectContent
                    position="popper"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    avoidCollisions
                    className={selectContentClassName}
                  >
                    <SelectItem
                      value="unscheduled"
                      className={getSelectItemStyle("unscheduled")}
                    >
                      Unscheduled
                    </SelectItem>

                    {Array.from(
                      { length: duration },
                      (_, index) => index + 1,
                    ).map((day) => (
                      <SelectItem
                        key={day}
                        value={String(day)}
                        className={getSelectItemStyle(String(day))}
                      >
                        Day {day} — {getDayDate(day)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Activity Time */}
              <div>
                <label htmlFor="startTime" className={labelClassName}>
                  <Clock3 className="h-4 w-4 text-brand-orange" />
                  Activity Time
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>

                <TimePicker
                  id="startTime"
                  name="startTime"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className={labelClassName}>
                <NotebookPen className="h-4 w-4 text-brand-orange" />
                Notes
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>

              <textarea
                id="notes"
                name="notes"
                rows={4}
                maxLength={2000}
                disabled={isPending}
                placeholder="What would you like to do here? Add reminders, reservation details, or travel tips..."
                className={`${inputClassName} resize-y`}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-brand-olive/20 pt-6 sm:flex-row">
              {/* Cancel */}
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                className="h-11 flex-1 border-brand-olive/40 !bg-brand-gold/20 text-brand-ink hover:!bg-brand-gold/50 cursor-pointer"
                onClick={() =>
                  router.push(itineraryReturnUrl, {
                    scroll: false,
                  })
                }
              >
                Cancel
              </Button>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isPending}
                className="h-11 flex-1 gap-2 bg-brand-orange font-semibold text-white shadow-sm transition-colors hover:bg-brand-orange/90 cursor-pointer"
              >
                <Plus className="h-4 w-4" />

                {isPending ? "Adding Location..." : "Add Location"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
