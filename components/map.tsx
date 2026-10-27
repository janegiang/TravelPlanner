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

import { Location } from "@/app/generated/prisma";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";

interface MapProps {
  itineraries: Location[];
}

export default function ItineraryMap({ itineraries }: MapProps) {
  const center =
    itineraries.length > 0
      ? { lat: itineraries[0].lat, lng: itineraries[0].lng }
      : { lat: 0, lng: 0 };

  return (
    <div style={{ width: "100%", height: "400px" }}>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map center={center} zoom={8}>
          {itineraries.map((location, key) => (
            <Marker
              key={key}
              position={{ lat: location.lat, lng: location.lng }}
              title={location.locationTitle}
            />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
