import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { reverseGeocode } from "../utils/geocoding.js";

// Corrige las URLs del marcador por defecto (se rompen con bundlers como Vite)
const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const CENTRO_DEFAULT = [-34.6037, -58.3816]; // Obelisco, CABA

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
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
      {position && <Marker position={position} icon={defaultIcon} draggable eventHandlers={{ dragend: (e) => {
        const m = e.target.getLatLng();
        onPick(m.lat, m.lng);
      } }} />}
    </MapContainer>
  );
}
