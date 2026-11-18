import { useEffect, useMemo, useRef, useState } from "react";
import { getSucursales } from "../services/sucursalService.js";
import SucursalesMap from "../components/SucursalesMap.jsx";
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

const ordenarSucursales = (a, b) => {
  const activaA = a.estado === "activa" ? 1 : 0;
  const activaB = b.estado === "activa" ? 1 : 0;
  if (activaA !== activaB) return activaB - activaA;

  const abiertaA = a.abierta_ahora ? 1 : 0;
  const abiertaB = b.abierta_ahora ? 1 : 0;
  if (abiertaA !== abiertaB) return abiertaB - abiertaA;

  return String(a.nombre || "").localeCompare(String(b.nombre || ""), "es");
};

function SucursalCard({ sucursal, seleccionada, onSelect, cardRef }) {
  const activa = sucursal.estado === "activa";
  const abierta = Boolean(sucursal.abierta_ahora);
  const tieneUbicacion = Boolean(getCoordenadas(sucursal));
  const radio = parseFloat(sucursal.radio_km ?? 2);

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={() => onSelect(sucursal.id_sucursal)}
      className={`w-full text-left rounded-lg border p-4 transition ${
        seleccionada
          ? "border-primary ring-2 ring-primary/20 bg-orange-50/50"
          : "border-border bg-white hover:border-primary/60"
      } ${!activa ? "opacity-75" : ""}`}
    >
      <div className="flex justify-between items-start gap-2">
        <h2 className="font-bold text-text">{sucursal.nombre}</h2>
        <span
          className={`shrink-0 text-[11px] px-2 py-0.5 rounded-pill ${
            activa ? "bg-green-50 text-success" : "bg-background text-text-soft"
          }`}
        >
          {activa ? "Activa" : "Inactiva"}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        <span
          className={`text-[11px] px-2 py-0.5 rounded-pill ${
            abierta ? "bg-green-50 text-success" : "bg-background text-text-soft"
          }`}
        >
          {abierta ? "Abierta ahora" : "Cerrada ahora"}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-pill bg-background text-text-soft">
          Cobertura {Number.isFinite(radio) ? radio : 2} km
        </span>
        {!tieneUbicacion && (
          <span className="text-[11px] px-2 py-0.5 rounded-pill bg-amber-50 text-amber-700">
            Sin ubicación en mapa
          </span>
        )}
      </div>

      <p className="text-sm text-text-soft mt-3">{formatDireccion(sucursal)}</p>
      <p className="text-sm text-text-soft mt-1">Tel: {sucursal.telefono || "—"}</p>
      <p className="text-xs text-text-soft mt-2 leading-relaxed">{formatHorarios(sucursal.horarios)}</p>

      <p className="text-[11px] font-semibold text-primary mt-3">
        {seleccionada ? "Seleccionada en el mapa" : "Ver en el mapa"}
      </p>
    </button>
  );
}

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [idSeleccionado, setIdSeleccionado] = useState(null);
  const cardRefs = useRef({});

  useEffect(() => {
    getSucursales()
      .then(setSucursales)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const ordenadas = useMemo(() => [...sucursales].sort(ordenarSucursales), [sucursales]);
  const conUbicacion = useMemo(
    () => ordenadas.filter((s) => getCoordenadas(s)).length,
    [ordenadas]
  );

  const seleccionar = (id) => {
    setIdSeleccionado(id);
    cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  if (loading) return <p className="p-8 text-center text-text-soft">Cargando sucursales...</p>;
  if (error) return <p className="p-8 text-center text-danger">Error: {error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-text">Sucursales</h1>
        <p className="text-sm text-text-soft mt-1">
          Elegí una sucursal para verla en el mapa y consultar sus datos.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        <div className="h-[420px] lg:h-[620px] lg:flex-1 rounded-lg overflow-hidden border border-border bg-white">
          <SucursalesMap
            sucursales={ordenadas}
            idSeleccionado={idSeleccionado}
            onSelect={seleccionar}
          />
        </div>

        <aside className="lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-3 lg:h-[620px]">
          <div className="flex justify-between items-center gap-2">
            <p className="text-sm font-semibold text-text">
              {ordenadas.length} {ordenadas.length === 1 ? "sucursal" : "sucursales"}
            </p>
            <p className="text-xs text-text-soft">{conUbicacion} en el mapa</p>
          </div>

          <div className="space-y-3 lg:overflow-y-auto lg:pr-1 lg:flex-1">
            {ordenadas.map((sucursal) => (
              <SucursalCard
                key={sucursal.id_sucursal}
                sucursal={sucursal}
                seleccionada={idSeleccionado === sucursal.id_sucursal}
                onSelect={seleccionar}
                cardRef={(el) => {
                  cardRefs.current[sucursal.id_sucursal] = el;
                }}
              />
            ))}

            {ordenadas.length === 0 && (
              <p className="text-sm text-text-soft text-center py-8">
                No hay sucursales cargadas.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
