import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { defaultIcon } from "../utils/leafletIcon.js";

const CENTRO_DEFAULT = [-34.6037, -58.3816]; // Obelisco, CABA

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Re-centra el mapa cuando cambia la posición controlada por el padre
// (por click/drag en el mapa o por geocodificación directa al tipear).
function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    map.setView(position, map.getZoom(), { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.[0], position?.[1]]);
  return null;
}

// Mapa para ubicar un marcador. onPick(lat, lng) lo llama el padre,
// que resuelve calle/altura/etc. con geocodificación inversa.
export default function MapPicker({ position, onPick }) {
  return (
    <MapContainer
      center={position || CENTRO_DEFAULT}
      zoom={13}
      style={{ height: "280px", width: "100%", borderRadius: "8px", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <Recenter position={position} />
      {position && <Marker position={position} icon={defaultIcon} draggable eventHandlers={{ dragend: (e) => {
        const m = e.target.getLatLng();
        onPick(m.lat, m.lng);
      } }} />}
    </MapContainer>
  );
}
