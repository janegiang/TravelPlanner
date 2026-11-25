"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react";

type TripSortProps = {
  defaultValue: string;
};

const sortOptions = [
  { value: "soonest", label: "Departure: Earliest" },
  { value: "latest", label: "Departure: Latest" },
  { value: "newest", label: "Recently Created" },
  { value: "oldest", label: "Oldest Created" },
];

export default function TripSort({ defaultValue }: TripSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = searchParams.get("sort") || defaultValue;

  const selectedOption = sortOptions.find(
    (option) => option.value === selected,
  );

  // Close dropdown when clicking outside.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleSortChange(value: string) {
    setIsOpen(false);

    if (value === selected) return;

    // Preserve search and filter parameters.
    const params = new URLSearchParams(searchParams.toString());

    // Reset pagination after changing sort.
    params.delete("page");

    // Default sort does not need to appear in the URL.
    if (value === "soonest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }

    const query = params.toString();

    // Update Dashboard without scrolling to the top.
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <div ref={dropdownRef} className="relative w-full md:w-52">
      <button
        type="button"
        aria-label="Sort trips"
        aria-expanded={isOpen}
        aria-controls="trip-sort-options"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:border-brand-olive focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      >
        <span className="flex min-w-0 items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />

          <span className="truncate">
            {selectedOption?.label ?? "Sort trips"}
          </span>
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          id="trip-sort-options"
          className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-background p-1.5 shadow-xl"
        >
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSortChange(option.value)}
              className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                selected === option.value
                  ? "bg-brand-olive font-bold text-white"
                  : "text-foreground hover:bg-brand-gold"
              }`}
            >
              {option.label}

              {selected === option.value && (
                <Check className="h-4 w-4 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
