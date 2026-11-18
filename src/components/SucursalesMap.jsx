import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { defaultIcon } from "../utils/leafletIcon.js";
import { formatHorarios } from "../utils/horarios.js";

const getCoordenadas = (sucursal) => {
  if (sucursal.latitud == null || sucursal.longitud == null) return null;
  if (sucursal.latitud === "" || sucursal.longitud === "") return null;

  const lat = Number(sucursal.latitud);
  const lng = Number(sucursal.longitud);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
};

const formatDireccion = (sucursal) => {
  const calle = [sucursal.calle, sucursal.altura].filter(Boolean).join(" ");
  const ciudad = [sucursal.ciudad, sucursal.provincia].filter(Boolean).join(", ");
  return [calle, ciudad, sucursal.codigo_postal ? `CP ${sucursal.codigo_postal}` : ""]
    .filter(Boolean)
    .join(" · ");
};

function FitBounds({ posiciones }) {
  const map = useMap();

  useEffect(() => {
    if (posiciones.length === 0) return;
    if (posiciones.length === 1) {
      map.setView(posiciones[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(posiciones), { padding: [32, 32], maxZoom: 14 });
  }, [map, posiciones]);

  return null;
}

function FocusSucursal({ idSeleccionado, marcables }) {
  const map = useMap();

  useEffect(() => {
    if (!idSeleccionado) return;
    const seleccionada = marcables.find((m) => m.sucursal.id_sucursal === idSeleccionado);
    if (!seleccionada) return;
    map.flyTo(seleccionada.posicion, Math.max(map.getZoom(), 14), { duration: 0.6 });
  }, [map, idSeleccionado, marcables]);

  return null;
}

export default function SucursalesMap({ sucursales, idSeleccionado, onSelect }) {
  const marcables = useMemo(
    () =>
      sucursales
        .map((sucursal) => ({ sucursal, posicion: getCoordenadas(sucursal) }))
        .filter((m) => m.posicion),
    [sucursales]
  );

  const posiciones = useMemo(() => marcables.map((m) => m.posicion), [marcables]);

  if (posiciones.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center text-sm text-text-soft">
        No hay sucursales con ubicación cargada para mostrar en el mapa.
      </div>
    );
  }

  return (
    <MapContainer
      center={posiciones[0]}
      zoom={12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds posiciones={posiciones} />
      <FocusSucursal idSeleccionado={idSeleccionado} marcables={marcables} />

      {marcables.map(({ sucursal, posicion }) => (
        <Marker
          key={sucursal.id_sucursal}
          position={posicion}
          icon={defaultIcon}
          zIndexOffset={idSeleccionado === sucursal.id_sucursal ? 1000 : 0}
          eventHandlers={{ click: () => onSelect?.(sucursal.id_sucursal) }}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-bold text-sm">{sucursal.nombre}</p>
              <p className="text-xs">{formatDireccion(sucursal)}</p>
              {sucursal.telefono && <p className="text-xs">Tel: {sucursal.telefono}</p>}
              <p className="text-xs">{formatHorarios(sucursal.horarios)}</p>
              <p className={`text-xs font-semibold ${sucursal.abierta_ahora ? "text-success" : "text-text-soft"}`}>
                {sucursal.abierta_ahora ? "Abierta ahora" : "Cerrada ahora"}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
