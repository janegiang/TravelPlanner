// "use client";

// import { Location } from "@/app/generated/prisma/client";
// import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";

// interface MapProps {
//   itineraries: Location[];
// }

// // Handle marker clicks
// function LocationMarkers({ itineraries }: { itineraries: Location[] }) {
//   const map = useMap();

//   function handleMarkerClick(location: Location) {
//     if (!map) return;

//     // Get the clicked marker's coordinates
//     const position = {
//       lat: location.lat,
//       lng: location.lng,
//     };

//     // Center the map on the clicked marker
//     map.panTo(position);

//     // Zoom in on the clicked marker
//     map.setZoom(16);
//   }

//   return (
//     <>
//       {itineraries.map((location) => (
//         <Marker
//           key={location.id}
//           position={{
//             lat: location.lat,
//             lng: location.lng,
//           }}
//           title={location.locationTitle}
//           onClick={() => handleMarkerClick(location)}
//         />
//       ))}
//     </>
//   );
// }

// export default function ItineraryMap({ itineraries }: MapProps) {
//   const center =
//     itineraries.length > 0
//       ? { lat: itineraries[0].lat, lng: itineraries[0].lng }
//       : { lat: 0, lng: 0 };

//   return (
//     <div style={{ width: "100%", height: "400px" }}>
//       <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
//         <Map defaultCenter={center} defaultZoom={12} gestureHandling="greedy">
//           {itineraries.map((location, key) => (
//             <LocationMarkers itineraries={itineraries} />
//           ))}
//         </Map>
//       </APIProvider>
//     </div>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";

import type { Location } from "@/app/generated/prisma/client";

import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";

interface MapProps {
  itineraries: Location[];
}

function LocationMarkers({ itineraries }: { itineraries: Location[] }) {
  const map = useMap();

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );

  // Sort locations by itinerary order.
  const sortedLocations = useMemo(
    () => [...itineraries].sort((a, b) => a.order - b.order),
    [itineraries],
  );

  // Automatically fit all destinations.
  useEffect(() => {
    if (!map || sortedLocations.length === 0) return;

    if (sortedLocations.length === 1) {
      map.setCenter({
        lat: sortedLocations[0].lat,
        lng: sortedLocations[0].lng,
      });

      map.setZoom(13);
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    sortedLocations.forEach((location) => {
      bounds.extend({
        lat: location.lat,
        lng: location.lng,
      });
    });

    map.fitBounds(bounds, 60);
  }, [map, sortedLocations]);

  function handleMarkerClick(location: Location) {
    if (!map) return;

    setSelectedLocation(location);

    map.panTo({
      lat: location.lat,
      lng: location.lng,
    });

    map.setZoom(15);
  }

  return (
    <>
      {/* Numbered Location Markers */}
      {sortedLocations.map((location, index) => (
        <AdvancedMarker
          key={location.id}
          position={{
            lat: location.lat,
            lng: location.lng,
          }}
          title={location.locationTitle}
          onClick={() => handleMarkerClick(location)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-sm font-bold text-white shadow-lg">
            {index + 1}
          </div>
        </AdvancedMarker>
      ))}

      {/* Selected Location Information */}
      {selectedLocation && (
        <InfoWindow
          position={{
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
          }}
          onCloseClick={() => setSelectedLocation(null)}
        >
          <div className="min-w-36 p-1">
            <h3 className="text-sm font-semibold text-gray-900">
              {selectedLocation.locationTitle}
            </h3>

            <p className="mt-1 text-xs text-gray-500">Planned destination</p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function ItineraryMap({ itineraries }: MapProps) {
  const sortedLocations = useMemo(
    () => [...itineraries].sort((a, b) => a.order - b.order),
    [itineraries],
  );

  const center =
    sortedLocations.length > 0
      ? {
          lat: sortedLocations[0].lat,
          lng: sortedLocations[0].lng,
        }
      : {
          lat: 0,
          lng: 0,
        };

  return (
    <div className="h-full w-full">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map
          defaultCenter={center}
          defaultZoom={sortedLocations.length > 0 ? 12 : 2}
          gestureHandling="greedy"
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <LocationMarkers itineraries={sortedLocations} />
        </Map>
      </APIProvider>
    </div>
  );
}
