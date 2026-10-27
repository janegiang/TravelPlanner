"use client";

import Image from "next/image";
import { Calendar, MapPin, Plus } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Trip, Location, Flight } from "@/app/generated/prisma/client";
import Map from "@/components/map";
import SortableItinerary from "./sortable-itinerary";

export type TripWithLocationsAndFlights = Trip & {
  locations: Location[];
  flights: Flight[];
};

interface TripDetailClientProps {
  trip: TripWithLocationsAndFlights;
}

export default function TripDetailClient({ trip }: TripDetailClientProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {trip.imageUrl && (
        <div className="w-full h-72 md:h-96 overflow-hidden rounded-xl shadow-lg relative">
          {""}
          <Image
            src={trip.imageUrl}
            alt={trip.title}
            className="object-cover"
            fill
            priority
          />
        </div>
      )}
      <div className="bg-white p-6 shadow rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">
            {" "}
            {trip.title}
          </h1>
          <div className="flex items-center text-gray-500 mt-2">
            <Calendar className="h-5 w-5 mr-2" />
            <span className="text-lg">
              {trip.startDate.toLocaleDateString()} -{" "}
              {trip.endDate.toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="mt-4 md:mt-0">
          <Link href={`/trips/${trip.id}/itinerary/new`}>
            <Button>
              {" "}
              <Plus className="mr-2 h-5 w-5" /> Add Location
            </Button>
          </Link>
        </div>
      </div>
      <div className="bg-white p-6 shadow rounded-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="text-lg">
              Overview
            </TabsTrigger>
            <TabsTrigger value="flight" className="text-lg">
              Flight
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="text-lg">
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="map" className="text-lg">
              Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Trip Summary</h2>
                <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
                  <div className="flex items-start">
                    <Calendar className="h-6 w-6 mr-3 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-700"> Date </p>
                      <p className="text-sm text-gray-500">
                        {trip.startDate.toLocaleDateString()} -{" "}
                        {trip.endDate.toLocaleDateString()}
                        <br />
                        {`${Math.round(
                          (trip.endDate.getTime() - trip.startDate.getTime()) /
                            (1000 * 60 * 60 * 24),
                        )} days(s)`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="h-6 w-6 mr-3 text-gray-500" />
                    <div>
                      <p>Destinations</p>
                      <p>
                        {trip.locations.length}{" "}
                        {trip.locations.length === 1 ? "location" : "locations"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-62 rounded-lg overflow-hidden shadow bg-orange-100">
                <Map itineraries={trip.locations} />
              </div>
            </div>
            {trip.locations.length === 0 && (
              <div className="text-center p-4">
                <p>Add locations to see them on the map</p>
                <Link href={`/trips/${trip.id}/itinerary/new`}>
                  <Button>
                    {" "}
                    <Plus className="mr-2 h-5 w-5" /> Add Location
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="itinerary" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Full Itinerary</h2>
            </div>

            {trip.locations.length === 0 ? (
              <div className="text-center p-4">
                <p>Add locations to see them on the itinerary</p>
                <Link href={`/trips/${trip.id}/itinerary/new`}>
                  <Button>
                    {" "}
                    <Plus className="mr-2 h-5 w-5" /> Add Location
                  </Button>
                </Link>
              </div>
            ) : (
              <SortableItinerary locations={trip.locations} tripId={trip.id} />
            )}
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <div className="h-72 rounded-lg overflow-hidden shadow">
              <Map itineraries={trip.locations} />
            </div>
            {trip.locations.length === 0 && (
              <div className="text-center p-4">
                <p>Add locations to see them on the map.</p>
                <Link href={`/trips/${trip.id}/itinerary/new`}>
                  <Button>
                    {" "}
                    <Plus className="mr-2 h-5 w-5" /> Add Location
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="flight" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Flight Information</h2>
              <Link href={`/trips/${trip.id}/flight/new`}>
                <Button>
                  <Plus className="mr-2 h-5 w-5" /> Add Flight
                </Button>
              </Link>
            </div>
            {trip.flights.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-gray-500 mb-2">
                  Add flights to see their status
                </p>
                <Link href={`/trips/${trip.id}/flight/new`}>
                  <Button>
                    <Plus className="mr-2 h-5 w-5" /> Add Flight
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {trip.flights.map((flight) => (
                  <div
                    key={flight.id}
                    className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-bold text-lg">
                        {flight.flightNumber}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">
                        {flight.airline || "Airline TBD"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {flight.departureAirport || "Origin"} ➔{" "}
                        {flight.arrivalAirport || "Destination"}
                        <span className="ml-2 text-xs text-gray-400">
                          ({new Date(flight.departureDate).toLocaleDateString()}
                          )
                        </span>
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full uppercase">
                      {flight.status || "Scheduled"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <div className="text-center">
        <Link href={`/trips`}>
          <Button> Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

// <TabsContent value="flight" className="space-y-6">
//   <div className="flex justify-between items-center mb-4">
//     <h2 className="text-2xl font-semibold">Flight Information</h2>
//   </div>
//   {trip.flights.length === 0 ? (
//     <div className="text-center p-4">
//       <p>Add flights to see their status</p>
//       <Link href={`/trips/${trip.id}/itinerary/new`}>
//         <Button>
//           <Plus className="mr-2 h-5 w-5" /> Add Flight
//         </Button>
//       </Link>
//     </div>
//   ) : (
//     <div className="space-y-4">
//       {trip.flights.map((flight) => (
//         <div
//           key={flight.id}
//           className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center"
//         >
//           <div>
//             <h3 className="font-bold">{flight.flightNumber}</h3>
//             <p className="text-sm text-gray-500">
//               {flight.airline} , {flight.departureAirport} to{" "}
//               {flight.arrivalAirport}
//             </p>
//           </div>
//           <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full uppercase">
//             {flight.status}
//           </span>
//         </div>
//       ))}
//     </div>
//   )}
// </TabsContent>
