"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import {
  CalendarDays,
  Clock3,
  MapPin,
  NotebookPen,
  X,
  AlertTriangle,
  Save,
} from "lucide-react";

import type { Location } from "@/app/generated/prisma/client";

import {
  updateLocation,
  type PendingLocationMove,
} from "@/lib/actions/update-location";

import { getTripDuration, formatTripDate } from "@/lib/trip-dates";

import { Button } from "@/components/ui/button";
import TimePicker from "@/components/time-picker";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface EditLocationDialogProps {
  location: Location;
  tripId: string;
  startDate: Date | string;
  endDate: Date | string;
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // True when opened from Activity Time Conflict.
  focusTime?: boolean;

  // Original requested drag destination.
  pendingMove?: PendingLocationMove | null;
}

// ======================================
// EDIT LOCATION DIALOG
// ======================================

export default function EditLocationDialog({
  location,
  tripId,
  startDate,
  endDate,
  open,
  onOpenChange,
  focusTime = false,
  pendingMove = null,
}: EditLocationDialogProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const timeFieldRef = useRef<HTMLDivElement>(null);

  const duration = getTripDuration(startDate, endDate);

  // ======================================
  // INITIAL TRIP DAY
  // ======================================

  // If opened after a time conflict, use the
  // destination day from the original drag.
  //
  // Otherwise use the location's current day.
  const selectedDay = pendingMove ? pendingMove.targetDay : location.dayNumber;

  const initialDay =
    selectedDay !== null && selectedDay >= 1 && selectedDay <= duration
      ? String(selectedDay)
      : "unscheduled";

  // ======================================
  // FOCUS ACTIVITY TIME
  // ======================================

  useEffect(() => {
    if (!open || !focusTime) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const timeButton =
        timeFieldRef.current?.querySelector<HTMLButtonElement>("button");

      timeButton?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [open, focusTime]);

  // ======================================
  // FORMAT TRIP DAY
  // ======================================

  function getDayDate(day: number) {
    const date = new Date(startDate);

    date.setUTCDate(date.getUTCDate() + day - 1);

    return formatTripDate(date);
  }

  // ======================================
  // SUBMIT FORM
  // ======================================

  function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      try {
        // Convert Unscheduled to the empty string
        // expected by the server action.
        if (formData.get("dayNumber") === "unscheduled") {
          formData.set("dayNumber", "");
        }

        // Save the edited location.
        //
        // If pendingMove exists, the server also
        // completes the original requested drag.
        await updateLocation(
          location.id,
          tripId,
          formData,
          pendingMove ?? undefined,
        );

        // Close only after successful saving.
        onOpenChange(false);

        // Refresh itinerary data.
        router.refresh();
      } catch (error) {
        console.error("Failed to update location:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Could not update location. Please try again.",
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
        if (isPending) {
          return;
        }

        if (nextOpen) {
          setError(null);
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
            {/* Location Icon */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <MapPin className="h-7 w-7 text-white" />
            </div>

            {/* Header Text */}
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                {focusTime ? "Adjust Activity Time" : "Edit Location"}
              </DialogTitle>

              <DialogDescription className="mt-1 text-sm leading-relaxed text-white/90">
                {focusTime
                  ? "Choose a new time to complete your requested itinerary change."
                  : "Update the details of this stop."}
              </DialogDescription>
            </div>

            {/* Close Button */}
            <button
              type="button"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              aria-label="Close edit location"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        {/* ====================================== */}
        {/* EDIT LOCATION FORM */}
        {/* ====================================== */}

        <form
          action={handleSubmit}
          className="space-y-5 p-6 sm:p-8"
          aria-busy={isPending}
        >
          {/* ====================================== */}
          {/* LOCATION NAME */}
          {/* ====================================== */}

          <div>
            <label
              htmlFor={`address-${location.id}`}
              className={labelClassName}
            >
              <MapPin className="h-4 w-4 text-brand-orange" />
              Location Name
            </label>

            <input
              id={`address-${location.id}`}
              name="address"
              defaultValue={location.locationTitle}
              required
              maxLength={500}
              disabled={isPending}
              className={inputClassName}
            />
          </div>

          {/* ====================================== */}
          {/* TRIP DAY */}
          {/* ====================================== */}

          <div>
            <label htmlFor={`day-${location.id}`} className={labelClassName}>
              <CalendarDays className="h-4 w-4 text-brand-orange" />
              Trip Day
            </label>

            <Select
              key={`${location.id}-${initialDay}`}
              name="dayNumber"
              defaultValue={initialDay}
              disabled={isPending}
            >
              <SelectTrigger
                id={`day-${location.id}`}
                className="
                      !h-12 w-full rounded-xl
                      border border-input !bg-white
                      px-4 text-sm text-foreground
                      shadow-none transition-all
                      hover:border-brand-olive
                      focus:border-brand-orange
                      focus:ring-2
                      focus:ring-brand-orange/25
                      focus-visible:!border-brand-orange
                      focus-visible:!ring-2
                      focus-visible:!ring-brand-orange/25
                      data-[state=open]:!border-brand-orange
                      data-[state=open]:!ring-2
                      data-[state=open]:!ring-brand-orange/25
                    "
              >
                <SelectValue placeholder="Select a trip day" />
              </SelectTrigger>

              <SelectContent
                position="popper"
                side="bottom"
                align="start"
                sideOffset={3}
                avoidCollisions={false}
                className="
    z-50
    !w-[var(--radix-select-trigger-width)]
    !min-w-[var(--radix-select-trigger-width)]
    max-h-64
    overflow-hidden
    rounded-xl
    border border-border
    !bg-white
    !p-0
    shadow-xl
  "
              >
                <SelectItem
                  value="unscheduled"
                  className="
      !rounded-none
      !m-0
      py-3 pl-5 pr-10
      text-sm text-brand-ink
      data-[highlighted]:!bg-brand-gold
      data-[highlighted]:!text-brand-ink
    "
                >
                  Unscheduled
                </SelectItem>

                {Array.from({ length: duration }, (_, index) => index + 1).map(
                  (day) => (
                    <SelectItem
                      key={day}
                      value={String(day)}
                      className="
        !rounded-none
        !m-0
        py-3 pl-5 pr-10
        text-sm text-brand-ink
        data-[highlighted]:!bg-brand-gold
        data-[highlighted]:!text-brand-ink
      "
                    >
                      Day {day} — {getDayDate(day)}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>

            {pendingMove && (
              <p className="mt-2 text-xs leading-relaxed text-brand-olive">
                This day was selected from your original drag-and-drop
                destination.
              </p>
            )}
          </div>

          {/* ====================================== */}
          {/* ACTIVITY TIME */}
          {/* ====================================== */}

          <div
            ref={timeFieldRef}
            className={
              focusTime
                ? "rounded-xl border border-brand-orange/40 bg-brand-gold/15 p-3"
                : ""
            }
          >
            <label htmlFor={`time-${location.id}`} className={labelClassName}>
              <Clock3 className="h-4 w-4 text-brand-orange" />
              Activity Time
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>

            <TimePicker
              key={`${location.id}-${location.startTime ?? ""}`}
              id={`time-${location.id}`}
              name="startTime"
              defaultValue={location.startTime ?? ""}
              disabled={isPending}
            />

            {focusTime && (
              <p className="mt-2 text-xs leading-relaxed text-brand-ink/70">
                Choose a time that matches your requested position. Your
                original drag will be completed after you save.
              </p>
            )}
          </div>

          {/* ====================================== */}
          {/* NOTES */}
          {/* ====================================== */}

          <div>
            <label htmlFor={`notes-${location.id}`} className={labelClassName}>
              <NotebookPen className="h-4 w-4 text-brand-orange" />
              Notes
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>

            <textarea
              id={`notes-${location.id}`}
              name="notes"
              rows={4}
              maxLength={2000}
              defaultValue={location.notes ?? ""}
              disabled={isPending}
              placeholder="Add notes, reservations, or reminders..."
              className={`${inputClassName} resize-none py-3`}
            />
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
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
