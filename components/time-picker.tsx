"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimePickerProps {
  id?: string;
  name: string;
  disabled?: boolean;
  defaultValue?: string;
}

const hours = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);

const minutes = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);

const periods = ["AM", "PM"] as const;

type Period = (typeof periods)[number];

function convertTo24Hour(hour: string, minute: string, period: Period) {
  let h = Number(hour);

  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;

  return `${String(h).padStart(2, "0")}:${minute}`;
}

function parseTime(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return {
      hour: "10",
      minute: "00",
      period: "AM" as Period,
    };
  }

  const [hour24, minute] = value.split(":");
  const numericHour = Number(hour24);

  return {
    hour: String(numericHour % 12 || 12).padStart(2, "0"),
    minute,
    period: (numericHour >= 12 ? "PM" : "AM") as Period,
  };
}

function formatDisplay(value: string) {
  if (!value) return "Select a time";

  const { hour, minute, period } = parseTime(value);

  return `${Number(hour)}:${minute} ${period}`;
}

export default function TimePicker({
  id,
  name,
  disabled = false,
  defaultValue = "",
}: TimePickerProps) {
  const initialTime = parseTime(defaultValue);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);

  const [hour, setHour] = useState(initialTime.hour);
  const [minute, setMinute] = useState(initialTime.minute);
  const [period, setPeriod] = useState<Period>(initialTime.period);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close the picker when clicking outside.
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Synchronize with an updated default value.
  useEffect(() => {
    const parsed = parseTime(defaultValue);

    setValue(defaultValue);
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setPeriod(parsed.period);
  }, [defaultValue]);

  function handleApply() {
    setValue(convertTo24Hour(hour, minute, period));
    setOpen(false);
  }

  function handleClear() {
    setValue("");
    setOpen(false);
  }

  const selectedClass = "bg-brand-gold text-brand-ink font-semibold shadow-sm";

  const optionClass =
    "flex w-full shrink-0 items-center justify-center " +
    "rounded-lg px-2 py-2.5 text-sm transition-colors " +
    "hover:bg-brand-gold/60 focus-visible:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-brand-orange";

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden value submitted with the form */}
      <input type="hidden" name={name} value={value} disabled={disabled} />

      {/* Time Input */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(!open)}
        className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-white px-4 text-sm text-foreground transition-all hover:border-brand-olive focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={value ? "" : "text-muted-foreground"}>
          {formatDisplay(value)}
        </span>

        <Clock3 className="h-5 w-5 text-brand-orange" />
      </button>

      {/* Time Dropdown */}
      {open && (
        <div
          role="dialog"
          aria-label="Choose activity time"
          className="absolute left-0 top-full z-50 mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-white p-3 shadow-xl"
        >
          <p className="mb-3 text-sm font-semibold text-brand-ink">
            Choose Activity Time
          </p>

          <div className="grid grid-cols-3 gap-2">
            {/* Hours */}
            <div>
              <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
                Hour
              </p>

              <div className="h-44 space-y-1 overflow-y-auto rounded-lg bg-brand-cream/40 p-1">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHour(h)}
                    aria-pressed={hour === h}
                    className={`${optionClass} ${
                      hour === h ? selectedClass : "text-brand-ink"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div>
              <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
                Minute
              </p>

              <div className="h-44 space-y-1 overflow-y-auto rounded-lg bg-brand-cream/40 p-1">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinute(m)}
                    aria-pressed={minute === m}
                    className={`${optionClass} ${
                      minute === m ? selectedClass : "text-brand-ink"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* AM / PM */}
            <div>
              <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
                AM / PM
              </p>

              <div className="h-44 space-y-1 overflow-y-auto rounded-lg bg-brand-cream/40 p-1">
                {periods.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    aria-pressed={period === p}
                    className={`${optionClass} ${
                      period === p ? selectedClass : "text-brand-ink"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-between gap-3 border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="border-brand-gold/40"
            >
              Clear
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="gap-2 bg-brand-gold text-brand-ink hover:bg-brand-gold/90"
            >
              <Check className="h-4 w-4" />
              Apply Time
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
