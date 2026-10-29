// "use client";

// import { Location } from "@/app/generated/prisma";
// import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

// interface MapProps {
//   itineraries: Location[];
// }

// export default function Map({ itineraries }: MapProps) {
//   const { isLoaded, loadError } = useLoadScript({
//     googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
//   });

//   if (loadError) return <div>Error loading maps</div>;
//   if (!isLoaded) return <div>Loading maps...</div>;

//   const center =
//     itineraries.length > 0
//       ? { lat: itineraries[0].lat, lng: itineraries[0].lng }
//       : { lat: 0, lng: 0 };

//   return (
//     <GoogleMap
//       mapContainerStyle={{ width: "100%", height: "100%" }}
//       zoom={8}
//       center={center}
//     >
//       {itineraries.map((location, key) => (
//         <Marker
//           key={key}
//           position={{ lat: location.lat, lng: location.lng }}
//           title={location.locationTitle}
//         />
//       ))}
//     </GoogleMap>
//   );
// }

"use client";

import { Location } from "@/app/generated/prisma/client";
import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";

interface MapProps {
  itineraries: Location[];
}

// Handle marker clicks
function LocationMarkers({ itineraries }: { itineraries: Location[] }) {
  const map = useMap();

  function handleMarkerClick(location: Location) {
    if (!map) return;

    // Get the clicked marker's coordinates
    const position = {
      lat: location.lat,
      lng: location.lng,
    };

    // Center the map on the clicked marker
    map.panTo(position);

    // Zoom in on the clicked marker
    map.setZoom(16);
  }

  return (
    <>
      {itineraries.map((location) => (
        <Marker
          key={location.id}
          position={{
            lat: location.lat,
            lng: location.lng,
          }}
          title={location.locationTitle}
          onClick={() => handleMarkerClick(location)}
        />
      ))}
    </>
  );
}

export default function ItineraryMap({ itineraries }: MapProps) {
  const center =
    itineraries.length > 0
      ? { lat: itineraries[0].lat, lng: itineraries[0].lng }
      : { lat: 0, lng: 0 };

  return (
    <div style={{ width: "100%", height: "400px" }}>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map defaultCenter={center} defaultZoom={12} gestureHandling="greedy">
          {itineraries.map((location, key) => (
            <LocationMarkers itineraries={itineraries} />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
