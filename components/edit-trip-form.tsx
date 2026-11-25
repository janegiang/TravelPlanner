"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import Image from "next/image";
import Link from "next/link";

import { AlertTriangle, Save } from "lucide-react";

import type { Trip } from "@/app/generated/prisma/client";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { updateTrip } from "@/lib/actions/update-trip";
import { UploadButton } from "@/lib/upload-thing";

// ======================================
// TYPES
// ======================================

interface EditTripFormProps {
  trip: Trip;
}

// ======================================
// DATE FORMATTING
// ======================================

function formatInputDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ======================================
// EDIT TRIP FORM
// ======================================

export default function EditTripForm({ trip }: EditTripFormProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [imageUrl, setImageUrl] = useState<string | null>(trip.imageUrl);

  const [startDate, setStartDate] = useState(formatInputDate(trip.startDate));

  const [endDate, setEndDate] = useState(formatInputDate(trip.endDate));

  const [error, setError] = useState<string | null>(null);

  // ======================================
  // DATE VALIDATION
  // ======================================

  const dateError =
    startDate && endDate && endDate < startDate
      ? "End date cannot be before start date."
      : "";

  // ======================================
  // STYLES
  // ======================================

  const inputStyle =
    "w-full rounded-xl border border-[#DCD4B8] bg-[#FFFCF4] " +
    "px-4 py-3 text-[#1F1C14] placeholder:text-[#9B9481] " +
    "outline-none transition-all duration-200 " +
    "focus:border-[#8E8D43] focus:ring-2 focus:ring-[#8E8D43]/20";

  const labelStyle = "mb-2 block text-sm font-semibold text-card-foreground";

  // ======================================
  // FORM SUBMISSION
  // ======================================

  function handleSubmit(formData: FormData) {
    if (dateError || isPending) return;

    setError(null);

    // Include the selected image URL.
    // An empty value removes the existing image.
    formData.set("imageUrl", imageUrl ?? "");

    startTransition(async () => {
      try {
        await updateTrip(trip.id, formData);

        router.push(`/trips/${trip.id}`);
        router.refresh();
      } catch (error) {
        console.error("Failed to update trip:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Could not update trip. Please try again.",
        );
      }
    });
  }

  // ======================================
  // RENDER
  // ======================================

  return (
    <main className="container mx-auto flex-1 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* ====================================== */}
        {/* PAGE HEADER */}
        {/* ====================================== */}

        <div className="space-y-2">
          <Link
            href={`/trips/${trip.id}`}
            className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-brand-ink transition-colors hover:text-primary"
          >
            ← Back to Trip
          </Link>

          <h1 className="text-3xl font-bold tracking-tight">Edit Trip</h1>

          <p className="text-muted-foreground">Update your trip information.</p>
        </div>

        {/* ====================================== */}
        {/* TRIP FORM */}
        {/* ====================================== */}

        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>

            <p className="text-sm text-muted-foreground">
              Make changes to your trip below.
            </p>
          </CardHeader>

          <CardContent>
            <form
              action={handleSubmit}
              className="space-y-6"
              aria-busy={isPending}
            >
              {/* ====================================== */}
              {/* TRIP TITLE */}
              {/* ====================================== */}

              <div>
                <label htmlFor="title" className={labelStyle}>
                  Trip Title
                  <span className="ml-1 text-primary">*</span>
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  defaultValue={trip.title}
                  placeholder="e.g. Summer in Japan"
                  className={inputStyle}
                  required
                  maxLength={150}
                  disabled={isPending}
                />

                <p className="mt-1.5 text-xs text-muted-foreground">
                  Give your trip a memorable name.
                </p>
              </div>

              {/* ====================================== */}
              {/* DESCRIPTION */}
              {/* ====================================== */}

              <div>
                <label htmlFor="description" className={labelStyle}>
                  Description
                  <span className="ml-1 text-primary">*</span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  defaultValue={trip.description}
                  placeholder="Describe your travel plans..."
                  className={`${inputStyle} resize-y`}
                  required
                  disabled={isPending}
                />
              </div>

              {/* ====================================== */}
              {/* TRAVEL DATES */}
              {/* ====================================== */}

              <div className="space-y-3">
                <h3 className="text-base font-semibold text-card-foreground">
                  Travel Dates
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* START DATE */}
                  <div>
                    <label htmlFor="startDate" className={labelStyle}>
                      Start Date
                      <span className="ml-1 text-primary">*</span>
                    </label>

                    <input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={startDate}
                      onChange={(event) => {
                        setStartDate(event.target.value);
                        setError(null);
                      }}
                      className={inputStyle}
                      required
                      disabled={isPending}
                    />
                  </div>

                  {/* END DATE */}
                  <div>
                    <label htmlFor="endDate" className={labelStyle}>
                      End Date
                      <span className="ml-1 text-primary">*</span>
                    </label>

                    <input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(event) => {
                        setEndDate(event.target.value);
                        setError(null);
                      }}
                      aria-invalid={Boolean(dateError)}
                      aria-describedby={dateError ? "date-error" : undefined}
                      className={inputStyle}
                      required
                      disabled={isPending}
                    />
                  </div>
                </div>

                {dateError && (
                  <p
                    id="date-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {dateError}
                  </p>
                )}
              </div>

              {/* ====================================== */}
              {/* TRIP COVER IMAGE */}
              {/* ====================================== */}

              <div className="space-y-3">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold text-card-foreground">
                    Trip Cover Image
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload a new photo or keep your existing cover.
                  </p>
                </div>

                <div className="rounded-xl border-2 border-dashed border-border bg-background/60 p-5">
                  {/* IMAGE PREVIEW */}
                  {imageUrl ? (
                    <div className="mb-4 overflow-hidden rounded-lg">
                      <Image
                        src={imageUrl}
                        alt="Trip cover preview"
                        width={600}
                        height={300}
                        className="h-48 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 text-center">
                      <p className="text-sm font-medium text-foreground">
                        Add a cover photo
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Choose an image that represents your trip.
                      </p>
                    </div>
                  )}

                  {/* UPLOAD BUTTON */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        if (res && res[0]?.ufsUrl) {
                          setImageUrl(res[0].ufsUrl);
                          setError(null);
                        }
                      }}
                      onUploadError={(error: Error) => {
                        console.error("Upload error:", error);

                        setError(
                          "Could not upload the image. Please try again.",
                        );
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ====================================== */}
              {/* ERROR MESSAGE */}
              {/* ====================================== */}

              {error && (
                <div
                  role="alert"
                  className={
                    "flex items-start gap-2 rounded-xl " +
                    "border border-destructive/30 " +
                    "bg-destructive/10 p-3 " +
                    "text-sm text-destructive"
                  }
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

                  <span>{error}</span>
                </div>
              )}

              {/* ====================================== */}
              {/* FORM ACTIONS */}
              {/* ====================================== */}

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                {/* CANCEL */}
                <Button
                  type="button"
                  asChild
                  variant="outline"
                  className={
                    "w-full cursor-pointer " +
                    "border-brand-olive " +
                    "!bg-brand-cream text-brand-ink " +
                    "hover:!bg-brand-gold " +
                    "hover:!text-brand-ink " +
                    "sm:w-auto"
                  }
                >
                  <Link href={`/trips/${trip.id}`}>Cancel</Link>
                </Button>

                {/* SAVE */}
                <Button
                  type="submit"
                  disabled={isPending || Boolean(dateError)}
                  className={
                    "w-full cursor-pointer gap-2 " +
                    "!bg-brand-orange !text-white " +
                    "hover:!bg-brand-orange/85 " +
                    "disabled:cursor-not-allowed " +
                    "sm:w-auto"
                  }
                >
                  <Save className="h-4 w-4" />

                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
