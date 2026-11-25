"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  Plane,
  Hash,
  Plus,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { addFlight } from "@/lib/actions/add-flights";

// ======================================
// TYPES
// ======================================

interface NewFlightClientProps {
  tripId: string;
}

// ======================================
// DATE HELPERS
// ======================================

// Format using local calendar components to avoid
// timezone shifts when submitting the departure date.
function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

// ======================================
// NEW FLIGHT COMPONENT
// ======================================

export default function NewFlightClient({ tripId }: NewFlightClientProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Selected departure date.
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    undefined,
  );

  // Control calendar visibility.
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Currently displayed calendar month.
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());

  // Return to Flights and restore the previous scroll position.
  const flightsUrl = `/trips/${tripId}?tab=flight&restoreFlightScroll=1`;

  // ======================================
  // FORM SUBMISSION
  // ======================================

  function handleSubmit(formData: FormData) {
    if (isPending) return;

    setError(null);

    // Validate that a departure date was selected.
    if (!departureDate) {
      setError("Please select a departure date.");
      return;
    }

    // Convert the selected date to YYYY-MM-DD.
    // This is the format expected by the server action.
    formData.set("userFlightDate", formatDateValue(departureDate));

    startTransition(async () => {
      try {
        // Save the flight through the server action.
        const result = await addFlight(formData, tripId);

        // Only navigate after a successful save.
        if (result.success) {
          // Return to the Flights tab.
          // Preserve the previous scroll position.
          router.push(flightsUrl, {
            scroll: false,
          });
        }
      } catch (error) {
        console.error("Failed to add flight:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Could not add flight. Please try again.",
        );
      }
    });
  }

  // ======================================
  // STYLES
  // ======================================

  const labelClassName =
    "mb-2 flex items-center gap-2 text-sm font-semibold text-brand-ink";

  const inputClassName =
    "w-full rounded-xl border border-input bg-white px-4 py-3 pr-11 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground hover:border-brand-olive focus:border-primary focus:ring-2 focus:ring-primary/20";

  // ======================================
  // RENDER
  // ======================================

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-background px-4 py-10 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* ====================================== */}
        {/* BACK NAVIGATION */}
        {/* ====================================== */}

        <Link
          href={flightsUrl}
          scroll={false}
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-brand-ink transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Flights
        </Link>

        {/* ====================================== */}
        {/* MAIN FORM CARD */}
        {/* ====================================== */}

        <div className="rounded-2xl border border-border bg-brand-cream shadow-lg">
          {/* ====================================== */}
          {/* OLIVE HEADER */}
          {/* ====================================== */}

          <div className="rounded-t-2xl bg-brand-olive px-6 py-7 text-white sm:px-8">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-white/15 p-5">
                <Plane className="h-7 w-7 text-white" />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Add New Flight
                </h1>

                <p className="mt-2 text-sm leading-relaxed text-white/90">
                  Add a flight to your trip itinerary.
                </p>
              </div>
            </div>
          </div>

          {/* ====================================== */}
          {/* ADD FLIGHT FORM */}
          {/* ====================================== */}

          <form
            action={handleSubmit}
            className="space-y-6 p-6 sm:p-8"
            aria-busy={isPending}
          >
            {/* ====================================== */}
            {/* FLIGHT NUMBER */}
            {/* ====================================== */}

            <div>
              <label htmlFor="flightNumber" className={labelClassName}>
                <Hash className="h-4 w-4 text-brand-orange" />
                Flight Number
              </label>

              <input
                id="flightNumber"
                name="flightNumber"
                type="text"
                required
                maxLength={20}
                autoComplete="off"
                disabled={isPending}
                placeholder="e.g. NH105"
                className={inputClassName}
              />
            </div>

            {/* ====================================== */}
            {/* DEPARTURE DATE */}
            {/* ====================================== */}

            <div>
              <label htmlFor="userFlightDate" className={labelClassName}>
                <CalendarDays className="h-4 w-4 text-brand-orange" />
                Departure Date
              </label>

              {/* Hidden input submitted to the server action */}
              <input
                type="hidden"
                name="userFlightDate"
                value={departureDate ? formatDateValue(departureDate) : ""}
              />

              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    id="userFlightDate"
                    type="button"
                    disabled={isPending}
                    aria-label="Choose departure date"
                    aria-expanded={calendarOpen}
                    className={
                      "flex h-12 w-full items-center justify-between " +
                      "rounded-xl border border-input bg-white px-4 " +
                      "text-sm text-foreground transition-all " +
                      "hover:border-brand-olive " +
                      "focus:outline-none " +
                      "focus:border-primary " +
                      "focus:ring-2 focus:ring-primary/20 " +
                      "data-[state=open]:border-brand-orange " +
                      "data-[state=open]:ring-2 " +
                      "data-[state=open]:ring-brand-orange/25 " +
                      "disabled:cursor-not-allowed disabled:opacity-60"
                    }
                  >
                    <span
                      className={
                        departureDate
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {departureDate
                        ? formatDisplayDate(departureDate)
                        : "mm/dd/yyyy"}
                    </span>

                    <CalendarDays className="h-5 w-5 text-brand-orange" />
                  </button>
                </PopoverTrigger>

                {/* ====================================== */}
                {/* COMPACT CALENDAR POPUP */}
                {/* ====================================== */}

                <PopoverContent
                  align="start"
                  side="bottom"
                  sideOffset={6}
                  avoidCollisions
                  collisionPadding={12}
                  className={
                    "z-50 !w-fit max-w-[calc(100vw-2rem)] " +
                    "gap-0 rounded-2xl border " +
                    "border-brand-olive/25 !bg-white " +
                    "p-1.5 text-brand-ink shadow-xl"
                  }
                >
                  <Calendar
                    mode="single"
                    selected={departureDate}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    onSelect={(date) => {
                      setDepartureDate(date);

                      if (date) {
                        setCalendarMonth(date);
                        setCalendarOpen(false);
                        setError(null);
                      }
                    }}
                    showOutsideDays
                    captionLayout="label"
                    buttonVariant="ghost"
                    className={
                      "rounded-xl !bg-white p-2 text-brand-ink " +
                      "[--cell-size:2rem] " +
                      "[--cell-radius:0.5rem]"
                    }
                    classNames={{
                      root: "w-fit",

                      months: "relative flex flex-col gap-2",

                      month: "flex w-full flex-col gap-2",

                      month_caption:
                        "flex h-8 w-full items-center justify-center px-9",

                      caption_label: "text-sm font-bold text-brand-ink",

                      nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between",

                      button_previous:
                        "flex h-8 w-8 items-center justify-center " +
                        "rounded-lg text-brand-olive " +
                        "hover:!bg-brand-gold/30 " +
                        "hover:!text-brand-ink",

                      button_next:
                        "flex h-8 w-8 items-center justify-center " +
                        "rounded-lg text-brand-olive " +
                        "hover:!bg-brand-gold/30 " +
                        "hover:!text-brand-ink",

                      weekdays: "flex",

                      weekday:
                        "flex-1 text-center text-xs font-semibold " +
                        "text-muted-foreground",

                      week: "mt-1 flex w-full",

                      today:
                        "rounded-lg bg-brand-cream " +
                        "font-semibold text-brand-orange",

                      outside: "text-muted-foreground/50",

                      day:
                        "group/day relative aspect-square h-full w-full " +
                        "rounded-lg p-0 text-center",

                      selected: "rounded-lg bg-brand-gold text-brand-ink",
                    }}
                    components={{
                      DayButton: (props) => (
                        <CalendarDayButton
                          {...props}
                          className={
                            "rounded-lg text-sm " +
                            "hover:!bg-brand-gold/30 " +
                            "hover:!text-brand-ink " +
                            "data-[selected-single=true]:!bg-brand-gold " +
                            "data-[selected-single=true]:!text-brand-ink " +
                            "data-[selected-single=true]:font-bold"
                          }
                        />
                      ),
                    }}
                  />

                  {/* ====================================== */}
                  {/* COMPACT CALENDAR FOOTER */}
                  {/* ====================================== */}

                  <div className="flex items-center justify-between gap-2 border-t border-brand-olive/15 px-2 py-1.5">
                    {/* Clear */}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setDepartureDate(undefined);
                        setError(null);
                        setCalendarOpen(false);
                      }}
                      className={
                        "rounded-lg px-2 py-1.5 text-xs " +
                        "font-medium text-muted-foreground " +
                        "transition-colors " +
                        "hover:bg-brand-gold/20 " +
                        "hover:text-brand-ink"
                      }
                    >
                      Clear
                    </button>

                    {/* Today */}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        const today = new Date();

                        setDepartureDate(today);
                        setCalendarMonth(today);
                        setCalendarOpen(false);
                        setError(null);
                      }}
                      className={
                        "rounded-lg px-2 py-1.5 text-xs " +
                        "font-semibold text-brand-orange " +
                        "transition-colors " +
                        "hover:bg-brand-gold/20"
                      }
                    >
                      Today
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* ====================================== */}
            {/* AUTOMATIC LOOKUP INFORMATION */}
            {/* ====================================== */}

            <div className="rounded-xl border border-brand-olive/20 bg-white p-4">
              <div className="flex items-start gap-3">
                <Plane className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />

                <div>
                  <p className="text-sm font-semibold text-brand-ink">
                    Automatic Flight Lookup
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    We&apos;ll look up your flight details using AirLabs,
                    including airports, departure and arrival times, and flight
                    status when available.
                  </p>
                </div>
              </div>
            </div>

            {/* ====================================== */}
            {/* ERROR MESSAGE */}
            {/* ====================================== */}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

                <span>{error}</span>
              </div>
            )}

            {/* ====================================== */}
            {/* FORM ACTIONS */}
            {/* ====================================== */}

            <div className="flex flex-col-reverse gap-3 border-t border-brand-olive/20 pt-6 sm:flex-row">
              {/* Cancel */}
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  router.push(flightsUrl, {
                    scroll: false,
                  });
                }}
                className="h-11 flex-1 border-brand-olive/40 !bg-brand-gold/20 text-brand-ink hover:!bg-brand-gold/50 cursor-pointer"
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

                {isPending ? "Looking Up Flight..." : "Add Flight"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
