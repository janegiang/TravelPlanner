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

  if (data && data.response) {
    const flight = Array.isArray(data.response)
      ? data.response[0]
      : data.response;

    if (flight) {
      // If live flight date does not match user input, return partial data with null times
      if (flight.dep_time && !flight.dep_time.startsWith(userFlightDate)) {
        return {
          flightNumber: flight.flight_iata || flightNumber,
          airline:
            flight.airline_name || flight.airline_iata || "Scheduled Flight",
          departureAirport: flight.dep_iata || "TBD",
          arrivalAirport: flight.arr_iata || "TBD",
          departureDate: userFlightDate,
          arrivalDate: null,
          departureTime: null,
          arrivalTime: null,
          status: "scheduled",
        };
      }

      // Otherwise, parse normally if it matches or has no time conflict
      const parseDateTimeParts = (dateTimeStr: string | null) => {
        if (!dateTimeStr) return { date: null, time: null };
        const [datePart, timePart] = dateTimeStr.split(" ");
        return {
          date: datePart || null,
          time: timePart || null,
        };
      };

      const dep = parseDateTimeParts(flight.dep_time);
      const arr = parseDateTimeParts(flight.arr_time);

      return {
        flightNumber: flight.flight_iata || flightNumber,
        airline:
          flight.airline_name || flight.airline_iata || "Scheduled Flight",
        departureAirport: flight.dep_iata || "TBD",
        arrivalAirport: flight.arr_iata || "TBD",
        departureDate: flight.dep_time ? dep.date : null,
        arrivalDate: flight.arr_time ? arr.date : null,
        departureTime: flight.dep_time ? dep.time : null,
        arrivalTime: flight.arr_time ? arr.time : null,
        status: flight.status || "scheduled",
      };
    }
  }

  // Fallback if live data isn't available
  return {
    flightNumber: flightNumber,
    airline: "Scheduled Flight",
    departureAirport: "TBD",
    arrivalAirport: "TBD",
    departureDate: userFlightDate,
    arrivalDate: null,
    departureTime: null,
    arrivalTime: null,
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
      connect: { id: tripId }, // <-- Changed from tripId: tripId to this relation connect
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
