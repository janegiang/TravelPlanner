"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { AlertTriangle, Trash2 } from "lucide-react";

import type { Location } from "@/app/generated/prisma/client";

import { deleteLocation } from "@/lib/actions/delete-location";

import { Button } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ======================================
// TYPES
// ======================================

interface DeleteLocationDialogProps {
  location: Location;
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ======================================
// DELETE LOCATION DIALOG
// ======================================

export default function DeleteLocationDialog({
  location,
  tripId,
  open,
  onOpenChange,
}: DeleteLocationDialogProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // ======================================
  // DELETE LOCATION
  // ======================================

  function handleDelete() {
    if (isPending) return;

    setError(null);

    startTransition(async () => {
      try {
        await deleteLocation(location.id, tripId);

        // Close after successful deletion.
        onOpenChange(false);

        // Refresh the trip's itinerary.
        router.refresh();
      } catch (error) {
        console.error("Failed to delete location:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Could not delete the location. Please try again.",
        );
      }
    });
  }

  // ======================================
  // RENDER
  // ======================================

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Prevent closing during deletion.
        if (isPending) return;

        if (nextOpen) {
          setError(null);
        }

        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent
        className={
          "w-[calc(100%-2rem)] max-w-md " +
          "gap-0 rounded-2xl " +
          "border border-brand-olive/30 " +
          "!bg-[#FFFDF7] p-6 " +
          "text-brand-ink shadow-2xl " +
          "sm:max-w-lg sm:p-7"
        }
      >
        {/* ====================================== */}
        {/* HEADER */}
        {/* ====================================== */}

        <AlertDialogHeader className="text-left">
          <div className="flex items-start gap-4">
            {/* Warning Icon */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <Trash2 className="h-7 w-7 text-red-600" />
            </div>

            {/* Title and Description */}
            <div className="min-w-0 flex-1">
              <AlertDialogTitle className="text-xl font-bold tracking-tight text-brand-ink">
                Delete this location?
              </AlertDialogTitle>

              <AlertDialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-brand-ink">
                  {location.locationTitle}
                </span>
                ?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {/* ====================================== */}
        {/* ERROR MESSAGE */}
        {/* ====================================== */}

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{error}</span>
          </div>
        )}

        {/* ====================================== */}
        {/* ACTION BUTTONS */}
        {/* ====================================== */}

        <AlertDialogFooter className="mt-8 gap-3 border-t border-brand-olive/20 pt-5">
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
              "hover:!bg-brand-gold/20 " +
              "focus-visible:border-brand-orange " +
              "focus-visible:ring-2 " +
              "focus-visible:ring-brand-orange/40"
            }
          >
            Cancel
          </Button>

          {/* Delete */}
          <Button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className={
              "h-10 gap-2 rounded-lg !bg-red-600 " +
              "px-5 font-semibold !text-white " +
              "shadow-sm transition-colors " +
              "hover:!bg-red-700 " +
              "focus-visible:ring-2 " +
              "focus-visible:ring-red-500/40 " +
              "disabled:cursor-not-allowed " +
              "disabled:opacity-60"
            }
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
