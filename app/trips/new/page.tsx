// "use client";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { createTrip } from "@/lib/actions/create-trip";
// import { cn } from "@/lib/utils";
// import { UploadButton } from "@/lib/upload-thing";
// import { useState, useTransition } from "react";
// import Image from "next/image";
// import Link from "next/link";
// import {
//   ArrowLeft,
//   Luggage,
//   NotebookPen,
//   CalendarDays,
//   Image as ImageIcon,
//   Plus,
// } from "lucide-react";

// export default function NewTrip() {
//   const [isPending, startTransition] = useTransition();
//   const [imageUrl, setImageUrl] = useState<string | null>(null);
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");

//   const dateError =
//     startDate && endDate && endDate < startDate
//       ? "End date cannot be before start date."
//       : "";

//   const inputStyle =
//     "w-full rounded-xl border border-input bg-white " +
//     "px-4 py-3 text-sm text-foreground " +
//     "placeholder:text-muted-foreground " +
//     "outline-none transition-all " +
//     "hover:border-brand-olive " +
//     "focus:border-primary focus:ring-2 focus:ring-primary/20 " +
//     "disabled:cursor-not-allowed disabled:opacity-60";

//   const labelStyle =
//     "mb-2 flex items-center gap-2 text-sm font-semibold text-brand-ink";

//   return (
//     <div className="min-h-[calc(100vh-8rem)] bg-background px-4 py-10 sm:py-12">
//       {/* Page Header */}
//       <div className="mx-auto max-w-2xl">
//         <Link
//           href="/trips"
//           className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-brand-ink transition-colors hover:text-primary"
//         >
//           <ArrowLeft className="h-4 w-4" />
//           Back to Trips
//         </Link>

//         <div className="rounded-2xl border border-border bg-brand-cream shadow-lg">
//           <div className="rounded-t-2xl bg-brand-olive px-6 py-7 text-white sm:px-8">
//             <div className="flex items-start gap-4">
//               <div className="rounded-xl bg-white/15 p-5">
//                 <Luggage className="h-7 w-7 text-white" />
//               </div>
//               <div className="min-w-0">
//                 <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
//                   Create New Trip
//                 </h1>

//                 <p className="mt-2 text-sm leading-relaxed text-white/90">
//                   Start planning your next adventure.
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Trip Form */}
//           <form
//             className="space-y-6 p-6 sm:p-8"
//             action={(formData: FormData) => {
//               if (dateError) return;

//               if (imageUrl) {
//                 formData.append("imageUrl", imageUrl);
//               }

//               startTransition(() => {
//                 createTrip(formData);
//               });
//             }}
//           >
//             {/* Trip Title */}
//             <div>
//               <label htmlFor="title" className={labelStyle}>
//                 <Luggage className="h-4 w-4 text-brand-orange" />
//                 Trip Title
//               </label>

//               <input
//                 id="title"
//                 type="text"
//                 name="title"
//                 placeholder="e.g. Summer in Japan"
//                 className={inputStyle}
//                 required
//               />
//             </div>

//             {/* Description */}
//             <div>
//               <label htmlFor="description" className={labelStyle}>
//                 <NotebookPen className="h-4 w-4 text-brand-orange" />
//                 Description
//               </label>

//               <textarea
//                 id="description"
//                 name="description"
//                 rows={4}
//                 placeholder="Describe your travel plans"
//                 className={`${inputStyle} resize-y`}
//                 required
//               />
//             </div>

//             {/* Travel Dates */}
//             <div className="grid gap-5 sm:grid-cols-2">
//               {/* Start Date */}
//               <div>
//                 <label htmlFor="startDate" className={labelStyle}>
//                   <CalendarDays className="h-4 w-4 text-brand-orange" />
//                   Start Date
//                 </label>

//                 <input
//                   id="startDate"
//                   type="date"
//                   name="startDate"
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                   className={inputStyle}
//                   required
//                 />
//               </div>

//               {/* End Date */}
//               <div>
//                 <label htmlFor="endDate" className={labelStyle}>
//                   <CalendarDays className="h-4 w-4 text-brand-orange" />
//                   End Date
//                 </label>

//                 <input
//                   id="endDate"
//                   type="date"
//                   name="endDate"
//                   value={endDate}
//                   min={startDate || undefined}
//                   onChange={(e) => setEndDate(e.target.value)}
//                   aria-invalid={Boolean(dateError)}
//                   aria-describedby={dateError ? "date-error" : undefined}
//                   className={inputStyle}
//                   required
//                 />
//               </div>

//               {dateError && (
//                 <p
//                   id="date-error"
//                   role="alert"
//                   className="text-sm text-destructive"
//                 >
//                   {dateError}
//                 </p>
//               )}
//             </div>

//             {/* Trip Cover Image */}
//             <div>
//               <label htmlFor="coverImage" className={labelStyle}>
//                 <ImageIcon className="h-4 w-4 text-brand-orange" />
//                 Trip Cover Image
//               </label>
//               <div className="rounded-xl border-2 border-dashed border-border bg-white p-5">
//                 {imageUrl ? (
//                   <div className="mb-4 overflow-hidden rounded-lg">
//                     <Image
//                       src={imageUrl}
//                       alt="Trip cover preview"
//                       width={600}
//                       height={300}
//                       className="h-48 w-full object-cover"
//                     />
//                   </div>
//                 ) : (
//                   <div className="mb-4 text-center">
//                     <p className="mt-1 text-sm text-muted-foreground">
//                       Choose an image that represents your trip.
//                     </p>
//                   </div>
//                 )}

//                 <div className="flex justify-center">
//                   <UploadButton
//                     endpoint="imageUploader"
//                     onClientUploadComplete={(res) => {
//                       if (res && res[0]?.ufsUrl) {
//                         setImageUrl(res[0].ufsUrl);
//                       }
//                     }}
//                     onUploadError={(error: Error) => {
//                       console.error("Upload error:", error);
//                     }}
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* Form Actions */}
//             <div className="flex flex-col-reverse gap-3 border-t border-brand-olive/20 pt-6 sm:flex-row">
//               <Button
//                 type="button"
//                 asChild
//                 className="h-11 flex-1 border-brand-olive/40 bg-brand-gold/20 text-brand-ink hover:bg-brand-gold/50 cursor-pointer"
//               >
//                 <Link href="/trips">Cancel</Link>
//               </Button>

//               <Button
//                 type="submit"
//                 disabled={isPending || Boolean(dateError)}
//                 className="h-11 flex-1 gap-2 bg-brand-orange font-semibold text-white shadow-sm transition-colors hover:bg-brand-orange/90 cursor-pointer"
//               >
//                 <Plus className="h-4 w-4" />

//                 {isPending ? "Creating..." : "Create Trip"}
//               </Button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createTrip } from "@/lib/actions/create-trip";
import { UploadButton } from "@/lib/upload-thing";
import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Luggage,
  NotebookPen,
  CalendarDays,
  Image as ImageIcon,
  Plus,
} from "lucide-react";

// Parse "YYYY-MM-DD" in local time without timezone shift.
function parseIsoDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

// Format Date to "YYYY-MM-DD" for form submission.
function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format Date to "mm/dd/yyyy" for button display.
function formatDisplayDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

export default function NewTrip() {
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formError, setFormError] = useState("");

  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const selectedStartDate = parseIsoDate(startDate);
  const selectedEndDate = parseIsoDate(endDate);

  const [startMonth, setStartMonth] = useState<Date>(
    selectedStartDate ?? new Date(),
  );
  const [endMonth, setEndMonth] = useState<Date>(
    selectedEndDate ?? selectedStartDate ?? new Date(),
  );

  const dateError =
    startDate && endDate && endDate < startDate
      ? "End date cannot be before start date."
      : "";

  const inputStyle =
    "w-full rounded-xl border border-input bg-white " +
    "px-4 py-3 text-sm text-foreground " +
    "placeholder:text-muted-foreground " +
    "outline-none transition-all " +
    "hover:border-brand-olive " +
    "focus:border-primary focus:ring-2 focus:ring-primary/20 " +
    "disabled:cursor-not-allowed disabled:opacity-60";

  const dateTriggerStyle =
    "flex h-12 w-full cursor-pointer items-center justify-between " +
    "rounded-xl border border-input bg-white px-4 " +
    "text-sm text-foreground transition-all " +
    "hover:border-brand-olive " +
    "focus:outline-none " +
    "focus:border-primary " +
    "focus:ring-2 focus:ring-primary/20 " +
    "data-[state=open]:border-brand-orange " +
    "data-[state=open]:ring-2 " +
    "data-[state=open]:ring-brand-orange/25 " +
    "disabled:cursor-not-allowed disabled:opacity-60";

  const calendarClassNames = {
    root: "w-fit",
    months: "relative flex flex-col gap-2",
    month: "flex w-full flex-col gap-2",
    month_caption: "flex h-8 w-full items-center justify-center px-9",
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
    weekday: "flex-1 text-center text-xs font-semibold text-muted-foreground",
    week: "mt-1 flex w-full",
    today: "rounded-lg bg-brand-cream font-semibold text-brand-orange",
    outside: "text-muted-foreground/50",
    day:
      "group/day relative aspect-square h-full w-full " +
      "rounded-lg p-0 text-center",
    selected: "rounded-lg bg-brand-gold text-brand-ink",
  };

  const labelStyle =
    "mb-2 flex items-center gap-2 text-sm font-semibold text-brand-ink";

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-background px-4 py-10 sm:py-12">
      {/* Page Header */}
      <div className="mx-auto max-w-2xl">
        <Link
          href="/trips"
          className="mb-6 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-brand-ink transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trips
        </Link>

        <div className="rounded-2xl border border-border bg-brand-cream shadow-lg">
          <div className="rounded-t-2xl bg-brand-olive px-6 py-7 text-white sm:px-8">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-white/15 p-5">
                <Luggage className="h-7 w-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Create New Trip
                </h1>

                <p className="mt-2 text-sm leading-relaxed text-white/90">
                  Start planning your next adventure.
                </p>
              </div>
            </div>
          </div>

          {/* Trip Form */}
          <form
            className="space-y-6 p-6 sm:p-8"
            action={(formData: FormData) => {
              setFormError("");

              if (!startDate || !endDate) {
                setFormError(
                  "Please select both a start date and an end date.",
                );
                return;
              }

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
                <Luggage className="h-4 w-4 text-brand-orange" />
                Trip Title
              </label>

              <input
                id="title"
                type="text"
                name="title"
                placeholder="e.g. Summer in Japan"
                className={inputStyle}
                disabled={isPending}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className={labelStyle}>
                <NotebookPen className="h-4 w-4 text-brand-orange" />
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Describe your travel plans"
                className={`${inputStyle} resize-y`}
                disabled={isPending}
                required
              />
            </div>

            {/* Travel Dates */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className={labelStyle}>
                  <CalendarDays className="h-4 w-4 text-brand-orange" />
                  Start Date
                </label>

                <input
                  type="hidden"
                  name="startDate"
                  value={startDate}
                  required
                />

                <Popover
                  open={startOpen}
                  onOpenChange={(nextOpen) => {
                    setStartOpen(nextOpen);
                    if (nextOpen) {
                      setStartMonth(selectedStartDate ?? new Date());
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      id="startDate"
                      type="button"
                      disabled={isPending}
                      aria-label="Choose start date"
                      aria-expanded={startOpen}
                      className={dateTriggerStyle}
                    >
                      <span
                        className={
                          selectedStartDate
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {selectedStartDate
                          ? formatDisplayDate(selectedStartDate)
                          : "mm/dd/yyyy"}
                      </span>

                      <CalendarDays className="h-5 w-5 text-brand-orange" />
                    </button>
                  </PopoverTrigger>

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
                      selected={selectedStartDate}
                      month={startMonth}
                      onMonthChange={setStartMonth}
                      onSelect={(date) => {
                        const iso = date ? toIsoDate(date) : "";
                        setStartDate(iso);
                        setFormError("");
                        if (date) {
                          setStartMonth(date);
                          setStartOpen(false);
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
                      classNames={calendarClassNames}
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

                    <div className="flex items-center justify-between gap-2 border-t border-brand-olive/15 px-2 py-1.5">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          setStartDate("");
                          setFormError("");
                          setStartOpen(false);
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

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          const today = new Date();
                          setStartDate(toIsoDate(today));
                          setStartMonth(today);
                          setFormError("");
                          setStartOpen(false);
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

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className={labelStyle}>
                  <CalendarDays className="h-4 w-4 text-brand-orange" />
                  End Date
                </label>

                <input type="hidden" name="endDate" value={endDate} required />

                <Popover
                  open={endOpen}
                  onOpenChange={(nextOpen) => {
                    setEndOpen(nextOpen);
                    if (nextOpen) {
                      setEndMonth(
                        selectedEndDate ?? selectedStartDate ?? new Date(),
                      );
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      id="endDate"
                      type="button"
                      disabled={isPending}
                      aria-label="Choose end date"
                      aria-expanded={endOpen}
                      aria-invalid={Boolean(dateError)}
                      aria-describedby={dateError ? "date-error" : undefined}
                      className={dateTriggerStyle}
                    >
                      <span
                        className={
                          selectedEndDate
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {selectedEndDate
                          ? formatDisplayDate(selectedEndDate)
                          : "mm/dd/yyyy"}
                      </span>

                      <CalendarDays className="h-5 w-5 text-brand-orange" />
                    </button>
                  </PopoverTrigger>

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
                      selected={selectedEndDate}
                      month={endMonth}
                      onMonthChange={setEndMonth}
                      disabled={
                        selectedStartDate
                          ? { before: selectedStartDate }
                          : undefined
                      }
                      onSelect={(date) => {
                        const iso = date ? toIsoDate(date) : "";
                        setEndDate(iso);
                        setFormError("");
                        if (date) {
                          setEndMonth(date);
                          setEndOpen(false);
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
                      classNames={calendarClassNames}
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

                    <div className="flex items-center justify-between gap-2 border-t border-brand-olive/15 px-2 py-1.5">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          setEndDate("");
                          setFormError("");
                          setEndOpen(false);
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

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          const today = new Date();
                          setEndDate(toIsoDate(today));
                          setEndMonth(today);
                          setFormError("");
                          setEndOpen(false);
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

              {(dateError || formError) && (
                <p
                  id="date-error"
                  role="alert"
                  className="text-sm text-destructive sm:col-span-2"
                >
                  {dateError || formError}
                </p>
              )}
            </div>

            {/* Trip Cover Image */}
            <div>
              <label htmlFor="coverImage" className={labelStyle}>
                <ImageIcon className="h-4 w-4 text-brand-orange" />
                Trip Cover Image
              </label>
              <div className="rounded-xl border-2 border-dashed border-border bg-white p-5">
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
                    <p className="mt-1 text-sm text-muted-foreground">
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
            <div className="flex flex-col-reverse gap-3 border-t border-brand-olive/20 pt-6 sm:flex-row">
              <Button
                type="button"
                asChild
                className="h-11 flex-1 border-brand-olive/40 bg-brand-gold/20 text-brand-ink hover:bg-brand-gold/50 cursor-pointer"
              >
                <Link href="/trips">Cancel</Link>
              </Button>

              <Button
                type="submit"
                disabled={isPending || Boolean(dateError)}
                className="h-11 flex-1 gap-2 bg-brand-orange font-semibold text-white shadow-sm transition-colors hover:bg-brand-orange/90 cursor-pointer"
              >
                <Plus className="h-4 w-4" />

                {isPending ? "Creating..." : "Create Trip"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
