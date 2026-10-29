"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { redirect } from "next/navigation";

async function fetchFlightStatus(flightNumber: string, userFlightDate: string) {
  const apiKey = process.env.AIRLABS_API_KEY;
  const response = await fetch(
    `https://airlabs.co/api/v9/flight?flight_iata=${flightNumber}&api_key=${apiKey}`,
  );

  const data = await response.json();
  const nowUnixSeconds = Math.floor(Date.now() / 1000); // Current time in epoch seconds

  const parseDateTimeParts = (dateTimeStr: string | null) => {
    if (!dateTimeStr) return { date: null, time: null };
    const [datePart, timePart] = dateTimeStr.split(" ");
    return { date: datePart || null, time: timePart || null };
  };

  if (data && data.response) {
    const flight = Array.isArray(data.response)
      ? data.response[0]
      : data.response;

    if (flight) {
      // Use local airport time string for date matching to avoid UTC timezone shifts
      const depDateString = flight.dep_time
        ? flight.dep_time.split(" ")[0]
        : null;

      // 1. SAFETY CHECK: Compare local-derived date with user input date
      if (!depDateString || depDateString !== userFlightDate) {
        const arr = parseDateTimeParts(flight.arr_time);
        const dep = parseDateTimeParts(flight.dep_time);

        return {
          flightNumber: flight.flight_iata || flightNumber,
          airline:
            flight.airline_name || flight.airline_iata || "Scheduled Flight",
          departureAirport: flight.dep_iata || "TBD",
          arrivalAirport: flight.arr_iata || "TBD",
          departureDate: userFlightDate,
          arrivalDate: arr.date || null,
          departureTime: dep.time || null,
          arrivalTime: arr.time || null,
          estimatedDepartureTime: null,
          estimatedArrivalTime: null,
          departureTerminal: flight.dep_terminal || null,
          arrivalTerminal: flight.arr_terminal || null,
          departureGate: flight.dep_gate || null,
          arrivalGate: flight.arr_gate || null,
          arrivalBaggage: null,
          status: "scheduled",
        };
      }

      // --- Precise Calculation using AirLabs Epoch Timestamps (_ts) ---
      const depTimestamp = flight.dep_time_ts || 0;
      const estDepTimestamp = flight.dep_estimated_ts || depTimestamp;

      const hoursUntilDeparture = depTimestamp
        ? (depTimestamp - nowUnixSeconds) / 3600
        : 999;

      let calculatedStatus = "scheduled";

      if (hoursUntilDeparture > 10) {
        calculatedStatus = "scheduled";
      } else if (hoursUntilDeparture <= 10 && hoursUntilDeparture >= 0) {
        if (!estDepTimestamp || estDepTimestamp === depTimestamp) {
          calculatedStatus = "on-time";
        } else if (estDepTimestamp > depTimestamp) {
          calculatedStatus = "delay";
        } else {
          calculatedStatus = "early";
        }
      } else if (flight.status === "landed") {
        calculatedStatus = "landed";
      } else if (flight.status === "en-route") {
        calculatedStatus = "en-route";
      }

      const dep = parseDateTimeParts(flight.dep_time);
      const arr = parseDateTimeParts(flight.arr_time);
      const depEst = parseDateTimeParts(flight.dep_estimated);
      const arrEst = parseDateTimeParts(flight.arr_estimated);

      return {
        flightNumber: flight.flight_iata || flightNumber,
        airline:
          flight.airline_name || flight.airline_iata || "Scheduled Flight",
        departureAirport: flight.dep_iata || "TBD",
        arrivalAirport: flight.arr_iata || "TBD",
        departureDate: userFlightDate,
        arrivalDate: arr.date || null,
        departureTime: dep.time || null,
        arrivalTime: arr.time || null,
        estimatedDepartureTime: depEst.time || null,
        estimatedArrivalTime: arrEst.time || null,
        departureTerminal: flight.dep_terminal || null,
        arrivalTerminal: flight.arr_terminal || null,
        departureGate: flight.dep_gate || null,
        arrivalGate: flight.arr_gate || null,
        arrivalBaggage:
          calculatedStatus === "en-route" || calculatedStatus === "landed"
            ? flight.arr_baggage || null
            : null,
        status: calculatedStatus,
      };
    }
  }

  // Fallback if live flight data isn't available
  return {
    flightNumber: flightNumber,
    airline: "Scheduled Flight",
    departureAirport: "TBD",
    arrivalAirport: "TBD",
    departureDate: userFlightDate,
    arrivalDate: null,
    departureTime: null,
    arrivalTime: null,
    estimatedDepartureTime: null,
    estimatedArrivalTime: null,
    departureTerminal: null,
    arrivalTerminal: null,
    departureGate: null,
    arrivalGate: null,
    arrivalBaggage: null,
    status: "scheduled",
  };
}

export async function addFlight(formData: FormData, tripId: string) {
  const session = await auth();
  if (!session) {
    throw new Error("Not authenticated");
  }

  const flightNumber = formData.get("flightNumber")?.toString();
  const userFlightDate = formData.get("userFlightDate")?.toString();

  if (!flightNumber || !userFlightDate) {
    throw new Error("Missing flight number or date");
  }

  const flightDetails = await fetchFlightStatus(flightNumber, userFlightDate);

  const safeData = {
    flightNumber: flightDetails.flightNumber,
    airline: flightDetails.airline,
    departureAirport: flightDetails.departureAirport,
    arrivalAirport: flightDetails.arrivalAirport,
    departureTime: flightDetails.departureTime,
    arrivalTime: flightDetails.arrivalTime,
    departureDate: flightDetails.departureDate,
    arrivalDate: flightDetails.arrivalDate,
    status: flightDetails.status,
    trip: {
      connect: { id: tripId },
    },
  };

  try {
    console.log("Inserting clean flight data into DB:", safeData);

    const newFlight = await prisma.flight.create({
      data: safeData,
    });

    console.log("Successfully created flight:", newFlight);
  } catch (error) {
    console.error("CRITICAL ERROR IN addFlight:", error);
    throw error;
  }

  redirect(`/trips/${tripId}`);
}
