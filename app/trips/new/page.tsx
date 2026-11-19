"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTrip } from "@/lib/actions/create-trip";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/upload-thing";
import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";

export default function NewTrip() {
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const dateError =
    startDate && endDate && endDate < startDate
      ? "End date cannot be before start date."
      : "";

  const inputStyle =
    "w-full rounded-xl border border-[#DCD4B8] bg-[#FFFCF4] " +
    "px-4 py-3 text-[#1F1C14] placeholder:text-[#9B9481] " +
    "outline-none transition-all duration-200 " +
    "focus:border-[#8E8D43] focus:ring-2 focus:ring-[#8E8D43]/20";

  const labelStyle = "mb-2 block text-sm font-semibold text-card-foreground";

  return (
    <main className="container mx-auto flex-1 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <Link
            href="/trips"
            className="inline-block text-sm font-medium text-muted-foreground hover:text-primary"
          >
            ← Back to Trips
          </Link>

          <h1 className="text-3xl font-bold tracking-tight">Create New Trip</h1>

          <p className="text-muted-foreground">
            Start planning your next adventure.
          </p>
        </div>

        {/* Trip Form */}
        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your trip information below.
            </p>
          </CardHeader>

          <CardContent>
            <form
              className="space-y-6"
              action={(formData: FormData) => {
                if (dateError) return;

                if (imageUrl) {
                  formData.append("imageUrl", imageUrl);
                }

                startTransition(() => {
                  createTrip(formData);
                });
              }}
            >
              {/* Trip Title */}
              <div>
                <label htmlFor="title" className={labelStyle}>
                  Trip Title
                  <span className="ml-1 text-primary">*</span>
                </label>

                <input
                  id="title"
                  type="text"
                  name="title"
                  placeholder="e.g. Summer in Japan"
                  className={inputStyle}
                  required
                />

                <p className="mt-1.5 text-xs text-muted-foreground">
                  Give your trip a memorable name.
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className={labelStyle}>
                  Description
                  <span className="ml-1 text-primary">*</span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Describe your travel plans..."
                  className={`${inputStyle} resize-y`}
                  required
                />
              </div>

              {/* Travel Dates */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-card-foreground">
                  Travel Dates
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Start Date */}
                  <div>
                    <label htmlFor="startDate" className={labelStyle}>
                      Start Date
                      <span className="ml-1 text-primary">*</span>
                    </label>

                    <input
                      id="startDate"
                      type="date"
                      name="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={inputStyle}
                      required
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label htmlFor="endDate" className={labelStyle}>
                      End Date
                      <span className="ml-1 text-primary">*</span>
                    </label>

                    <input
                      id="endDate"
                      type="date"
                      name="endDate"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                      aria-invalid={Boolean(dateError)}
                      aria-describedby={dateError ? "date-error" : undefined}
                      className={inputStyle}
                      required
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

              {/* Trip Cover Image */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-card-foreground">
                    Trip Cover Image
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload a photo for your trip (optional).
                  </p>
                </div>

                <div className="rounded-xl border-2 border-dashed border-border bg-background/60 p-5">
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

                  <div className="flex justify-center">
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={(res) => {
                        if (res && res[0]?.ufsUrl) {
                          setImageUrl(res[0].ufsUrl);
                        }
                      }}
                      onUploadError={(error: Error) => {
                        console.error("Upload error:", error);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  asChild
                  className="w-full sm:w-auto bg-brand-cream text-brand-ink border-brand-olive hover:bg-brand-gold hover:text-brand-ink"
                >
                  <Link href="/trips">Cancel</Link>
                </Button>

                <Button
                  type="submit"
                  disabled={isPending || Boolean(dateError)}
                  className="w-full sm:w-auto hover:bg-brand-gold hover:text-brand-ink"
                >
                  {isPending ? "Creating..." : "Create Trip"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
