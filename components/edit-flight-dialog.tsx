"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  CalendarDays,
  Plane,
  Hash,
  X,
  AlertTriangle,
  Save,
} from "lucide-react";

import type { Flight } from "@/app/generated/prisma/client";

import { updateFlight } from "@/lib/actions/update-flight";

import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ======================================
// TYPES
// ======================================

interface EditFlightDialogProps {
  flight: Flight;
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ======================================
// DATE HELPERS
// ======================================

function parseFlightDate(value: string): Date | undefined {
  const datePart = value.split("T")[0];

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);

  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

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
// EDIT FLIGHT DIALOG
// ======================================

export default function EditFlightDialog({
  flight,
  tripId,
  open,
  onOpenChange,
}: EditFlightDialogProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // ======================================
  // CALENDAR STATE
  // ======================================

  const [departureDate, setDepartureDate] = useState<Date | undefined>(() =>
    parseFlightDate(flight.departureDate),
  );

  const [calendarOpen, setCalendarOpen] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState<Date>(
    () => parseFlightDate(flight.departureDate) ?? new Date(),
  );

  // ======================================
  // RESET CALENDAR
  // ======================================

  function resetCalendar() {
    const savedDate = parseFlightDate(flight.departureDate);

    setDepartureDate(savedDate);
    setCalendarMonth(savedDate ?? new Date());
    setCalendarOpen(false);
    setError(null);
  }

  // ======================================
  // FORM SUBMISSION
  // ======================================

  function handleSubmit(formData: FormData) {
    setError(null);

    if (!departureDate) {
      setError("Please select a departure date.");
      return;
    }

    // Send the selected date to the existing
    // updateFlight server action.
    formData.set("userFlightDate", formatDateValue(departureDate));

    startTransition(async () => {
      try {
        await updateFlight(flight.id, tripId, formData);

        // Close only after a successful update.
        onOpenChange(false);

        // Refresh flight information on the page.
        router.refresh();
      } catch (error) {
        console.error("Failed to update flight:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Could not update flight. Please try again.",
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
    "h-12 w-full rounded-xl border border-input bg-white " +
    "px-4 text-sm text-brand-ink " +
    "outline-none transition-all " +
    "hover:border-brand-olive " +
    "focus:border-brand-orange " +
    "focus:ring-2 focus:ring-brand-orange/25 " +
    "disabled:cursor-not-allowed disabled:opacity-60";

  // ======================================
  // RENDER
  // ======================================

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Prevent closing while saving.
        if (isPending) return;

        if (nextOpen) {
          resetCalendar();
        } else {
          setCalendarOpen(false);
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[90dvh] gap-0 overflow-y-auto rounded-2xl border border-brand-olive/30 !bg-brand-cream p-0 text-brand-ink shadow-xl sm:max-w-lg"
      >
        {/* ====================================== */}
        {/* OLIVE HEADER */}
        {/* ====================================== */}

        <DialogHeader className="rounded-t-2xl bg-brand-olive px-6 py-6 text-left sm:px-8">
          <div className="flex items-center gap-4">
            {/* Flight Icon */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Plane className="h-7 w-7 text-white" />
            </div>

            {/* Header Text */}
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                Edit Flight
              </DialogTitle>

              <DialogDescription className="mt-1 text-sm leading-relaxed text-white/90">
                Update flight details.
              </DialogDescription>
            </div>

            {/* Close Button */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              aria-label="Close edit flight"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        {/* ====================================== */}
        {/* EDIT FLIGHT FORM */}
        {/* ====================================== */}

        <form
          action={handleSubmit}
          className="space-y-5 p-6 sm:p-8"
          aria-busy={isPending}
        >
          {/* ====================================== */}
          {/* FLIGHT NUMBER */}
          {/* ====================================== */}

          <div>
            <label
              htmlFor={`flight-number-${flight.id}`}
              className={labelClassName}
            >
              <Hash className="h-4 w-4 text-brand-orange" />
              Flight Number
            </label>

            <input
              id={`flight-number-${flight.id}`}
              name="flightNumber"
              type="text"
              defaultValue={flight.flightNumber}
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
            <label
              htmlFor={`flight-date-${flight.id}`}
              className={labelClassName}
            >
              <CalendarDays className="h-4 w-4 text-brand-orange" />
              Departure Date
            </label>

            {/* Value submitted to server action */}
            <input
              type="hidden"
              name="userFlightDate"
              value={departureDate ? formatDateValue(departureDate) : ""}
            />

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button
                  id={`flight-date-${flight.id}`}
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
                onInteractOutside={(event) => {
                  // Prevent the dialog from treating
                  // calendar interaction as outside
                  // interaction.
                  if (calendarOpen) {
                    event.preventDefault();
                  }
                }}
                className={
                  "z-[100] !w-fit max-w-[calc(100vw-2rem)] " +
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
                      "flex h-8 w-8 cursor-pointer items-center justify-center " +
                      "rounded-lg text-brand-olive " +
                      "hover:!bg-brand-gold/30 " +
                      "hover:!text-brand-ink",

                    button_next:
                      "flex h-8 w-8 cursor-pointer items-center justify-center " +
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
                          "cursor-pointer rounded-lg text-sm " +
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
                      "cursor-pointer rounded-lg px-2 py-1.5 text-xs " +
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
                      "cursor-pointer rounded-lg px-2 py-1.5 text-xs " +
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
          {/* AUTOMATIC LOOKUP NOTICE */}
          {/* ====================================== */}

          <div className="rounded-xl border border-brand-olive/20 bg-white p-4">
            <div className="flex items-start gap-3">
              <Plane className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" />

              <p className="text-sm leading-relaxed text-brand-ink">
                Flight details will be automatically updated using AirLabs when
                you save.
              </p>
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

          <DialogFooter className="gap-3 border-t border-brand-olive/20 pt-4">
            {/* Cancel */}
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className={
                "h-10 rounded-lg border-brand-olive/30 " +
                "!bg-white px-5 text-brand-ink " +
                "shadow-sm transition-all " +
                "hover:!bg-brand-gold/50 " +
                "focus-visible:border-brand-orange " +
                "focus-visible:ring-2 " +
                "focus-visible:ring-brand-orange/40"
              }
            >
              Cancel
            </Button>

            {/* Save */}
            <Button
              type="submit"
              disabled={isPending}
              className="h-10 gap-2 rounded-lg !bg-brand-orange px-5 font-semibold !text-white shadow-md transition-colors hover:!bg-brand-orange/80"
            >
              <Save className="h-4 w-4" />

              {isPending ? "Updating..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
