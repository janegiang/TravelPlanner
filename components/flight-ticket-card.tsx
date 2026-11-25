"use client";

import {
  Building2,
  CalendarDays,
  Clock3,
  DoorOpen,
  MoreHorizontal,
  Pencil,
  Plane,
  RefreshCw,
  Trash2,
} from "lucide-react";

import type { Flight } from "@/app/generated/prisma/client";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ======================================
// TYPES
// ======================================

interface FlightTicketCardProps {
  flight: Flight;
  onEdit: (flight: Flight) => void;
  onDelete: (flight: Flight) => void;
  onRefresh?: (flight: Flight) => void;
  isRefreshing?: boolean;
}

// ======================================
// DATE FORMATTING
// ======================================

function formatFlightDate(value: string | null) {
  if (!value) return "TBD";

  const date = value.split("T")[0];
  const parts = date.split("-");

  if (parts.length !== 3) return value;

  const [year, month, day] = parts;

  return `${month}/${day}/${year}`;
}

// ======================================
// TIME FORMATTING
// ======================================

function formatFlightTime(value: string | null) {
  if (!value) return "TBD";

  const [hours, minutes] = value.split(":").map(Number);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return value;
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

// ======================================
// FLIGHT STATUS
// ======================================

function getStatusStyle(status: string) {
  switch (status.toLowerCase()) {
    // ======================================
    // SCHEDULED
    // More than 10 hours before departure
    // ======================================

    case "scheduled":
      return "bg-[#55534B] text-[#F2EFE6]";

    // ======================================
    // ON TIME
    // Within 10 hours before departure
    // ======================================

    case "on-time":
      return "bg-[#205B3A] text-[#D8F5DF]";

    // ======================================
    // EARLY
    // Estimated departure before scheduled
    // ======================================

    case "early":
      return "bg-[#526B32] text-[#F0F6DA]";

    // ======================================
    // DELAYED
    // Estimated departure after scheduled
    // ======================================

    case "delay":
    case "delayed":
      return "bg-[#854019] text-[#FFE0BA]";

    // ======================================
    // CANCELLED
    // Airline cancelled the flight
    // ======================================

    case "cancelled":
    case "canceled":
    case "cancel":
      return "bg-[#842D36] text-[#FFE0E3]";

    // ======================================
    // EN ROUTE
    // Actual departure confirmed
    // ======================================

    case "en-route":
    case "active":
      return "bg-[#254E78] text-[#DCEEFF]";

    // ======================================
    // LANDED
    // AirLabs confirms landing
    // ======================================

    case "landed":
      return "bg-[#365C43] text-[#E0F3E4]";

    // ======================================
    // COMPLETED
    // Flight has passed expected arrival
    // ======================================

    case "completed":
      return "bg-[#484B55] text-[#F0F0F4]";

    // ======================================
    // DIVERTED
    // Flight diverted to another airport
    // ======================================

    case "diverted":
      return "bg-[#684577] text-[#F5E4FF]";

    // ======================================
    // DEFAULT
    // ======================================

    default:
      return "bg-[#55534B] text-[#F2EFE6]";
  }
}

// ======================================
// FORMAT STATUS LABEL
// ======================================

function formatStatus(status: string) {
  const normalized = status.trim().toLowerCase();

  switch (normalized) {
    case "scheduled":
      return "Scheduled";

    case "on-time":
      return "On Time";

    case "early":
      return "Early";

    case "delay":
    case "delayed":
      return "Delayed";

    case "cancelled":
    case "canceled":
    case "cancel":
      return "Cancelled";

    case "en-route":
    case "active":
      return "En Route";

    case "landed":
      return "Landed";

    case "completed":
      return "Completed";

    case "diverted":
      return "Diverted";

    default:
      return status
        .replace(/-/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
  }
}

// ======================================
// SHARED HEADER BUTTON STYLING
// ======================================

const headerActionButtonClass =
  "h-10 w-10 shrink-0 rounded-lg " +
  "!border-0 !bg-transparent !shadow-none " +
  "transition-colors duration-200 " +
  "hover:!bg-[#EAD9AC] " +
  "focus-visible:!outline-none " +
  "focus-visible:!ring-0 " +
  "data-[state=open]:!bg-[#EAD9AC] " +
  "disabled:cursor-not-allowed disabled:opacity-50";

// ======================================
// FLIGHT TICKET CARD
// ======================================

export default function FlightTicketCard({
  flight,
  onEdit,
  onDelete,
  onRefresh,
  isRefreshing = false,
}: FlightTicketCardProps) {
  const flightStatus = flight.status || "scheduled";

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-olive/25 bg-white shadow-sm transition-shadow hover:shadow-lg">
      {/* ====================================== */}
      {/* FLIGHT HEADER */}
      {/* ====================================== */}

      <div className="bg-secondary px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          {/* ====================================== */}
          {/* AIRLINE INFORMATION */}
          {/* ====================================== */}

          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="min-w-0 flex-1">
              {/* Airline + Flight Number */}
              <p className="break-words font-semibold leading-snug text-foreground">
                {flight.airline || "Airline TBD"}
                {" · "}
                {flight.flightNumber
                  ? `Flight ${flight.flightNumber}`
                  : "Flight TBD"}
              </p>

              {/* Flight Status */}
              <div className="mt-3 flex items-center">
                <span
                  className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ${getStatusStyle(
                    flightStatus,
                  )}`}
                >
                  {formatStatus(flightStatus)}
                </span>
              </div>
            </div>
          </div>

          {/* ====================================== */}
          {/* HEADER ACTION BUTTONS */}
          {/* ====================================== */}

          <div className="flex shrink-0 items-center gap-1">
            {/* Refresh Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isRefreshing || !onRefresh}
              onClick={() => onRefresh?.(flight)}
              aria-label={`Refresh flight ${flight.flightNumber}`}
              title="Refresh flight information"
              className={`${headerActionButtonClass} text-brand-orange`}
            >
              <RefreshCw
                className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>

            {/* ====================================== */}
            {/* MORE ACTIONS MENU */}
            {/* ====================================== */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isRefreshing}
                  aria-label={`Actions for flight ${flight.flightNumber}`}
                  className={`${headerActionButtonClass} text-brand-ink`}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="w-44 rounded-xl border border-border !bg-white p-1.5 shadow-lg"
              >
                {/* Edit Flight */}
                <DropdownMenuItem
                  onSelect={() => onEdit(flight)}
                  className={
                    "flex cursor-pointer items-center gap-2 " +
                    "rounded-lg px-3 py-2.5 text-sm " +
                    "text-brand-ink " +
                    "focus:!bg-brand-gold " +
                    "focus:!text-brand-ink"
                  }
                >
                  <Pencil className="h-4 w-4" />
                  Edit Flight
                </DropdownMenuItem>

                {/* Delete Flight */}
                <DropdownMenuItem
                  onSelect={() => onDelete(flight)}
                  className={
                    "flex cursor-pointer items-center gap-2 " +
                    "rounded-lg px-3 py-2.5 text-sm " +
                    "text-destructive " +
                    "focus:!bg-brand-gold " +
                    "focus:!text-destructive"
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Flight
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/* AIRPORT ROUTE */}
      {/* ====================================== */}

      <div className="px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          {/* Departure Airport */}
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
              {flight.departureAirport || "TBD"}
            </p>
          </div>

          {/* Flight Route */}
          <div className="flex flex-1 items-center gap-2 text-brand-orange">
            <div className="h-px flex-1 bg-brand-olive/30" />

            <Plane className="h-5 w-5 shrink-0" />

            <div className="h-px flex-1 bg-brand-olive/30" />
          </div>

          {/* Arrival Airport */}
          <div className="min-w-0 flex-1 text-right">
            <p className="text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
              {flight.arrivalAirport || "TBD"}
            </p>
          </div>
        </div>

        {/* ====================================== */}
        {/* TICKET DIVIDER */}
        {/* ====================================== */}

        <div className="my-5 border-t border-dashed border-brand-olive/35" />

        {/* ====================================== */}
        {/* FLIGHT DATES, TIMES, TERMINALS, GATES */}
        {/* ====================================== */}

        <div className="grid grid-cols-1 gap-y-5 lg:grid-cols-2 lg:gap-y-0">
          {/* ====================================== */}
          {/* DEPARTURE DETAILS */}
          {/* ====================================== */}

          <div className="min-w-0 lg:border-r lg:border-brand-olive/30 lg:pr-5">
            <p className="mb-5 text-sm font-semibold uppercase tracking-wider text-brand-olive">
              Departure
            </p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              {/* ====================================== */}
              {/* DATE AND TIME */}
              {/* ====================================== */}

              <div className="min-w-0 space-y-5">
                <p className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-brand-ink">
                  <CalendarDays className="h-4 w-4 shrink-0 text-brand-orange" />
                  {formatFlightDate(flight.departureDate)}
                </p>

                <p className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
                  <Clock3 className="h-4 w-4 shrink-0 text-brand-orange" />
                  {formatFlightTime(flight.departureTime)}
                </p>
              </div>

              {/* ====================================== */}
              {/* TERMINAL AND GATE */}
              {/* ====================================== */}

              <div className="min-w-0 space-y-5">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0 text-brand-orange" />
                  <span>Terminal {flight.departureTerminal || "TBD"}</span>
                </p>

                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DoorOpen className="h-4 w-4 shrink-0 text-brand-orange" />
                  <span>Gate {flight.departureGate || "TBD"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* ====================================== */}
          {/* ARRIVAL DETAILS */}
          {/* ====================================== */}

          <div
            className={
              "min-w-0 " +
              "border-t-2 border-brand-olive/50 " +
              "pt-6 " +
              "lg:border-t-0 " +
              "lg:border-l-2 lg:border-brand-olive/40 " +
              "lg:pl-6 lg:pt-0"
            }
          >
            {" "}
            <p className="mb-5 text-sm font-semibold uppercase tracking-wider text-brand-olive">
              Arrival
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              {/* ====================================== */}
              {/* DATE AND TIME */}
              {/* ====================================== */}

              <div className="min-w-0 space-y-5">
                <p className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-brand-ink">
                  <CalendarDays className="h-4 w-4 shrink-0 text-brand-orange" />
                  {formatFlightDate(flight.arrivalDate)}
                </p>

                <p className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
                  <Clock3 className="h-4 w-4 shrink-0 text-brand-orange" />
                  {formatFlightTime(flight.arrivalTime)}
                </p>
              </div>

              {/* ====================================== */}
              {/* TERMINAL AND GATE */}
              {/* ====================================== */}

              <div className="min-w-0 space-y-5">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0 text-brand-orange" />
                  <span>Terminal {flight.arrivalTerminal || "TBD"}</span>
                </p>

                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DoorOpen className="h-4 w-4 shrink-0 text-brand-orange" />
                  <span>Gate {flight.arrivalGate || "TBD"}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
