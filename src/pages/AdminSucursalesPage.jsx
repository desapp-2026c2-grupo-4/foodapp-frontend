import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getSucursales,
  createSucursal,
  updateSucursal,
  deleteSucursal,
} from "../services/sucursalService.js";
import MapPicker from "../components/MapPicker.jsx";
import { reverseGeocode } from "../utils/geocoding.js";
import { DIAS, crearHorariosVacios, formatHora, formatHorarios } from "../utils/horarios.js";
import useDebouncedForwardGeocode from "../hooks/useDebouncedForwardGeocode.js";

const CAMPOS_DIRECCION = ["calle", "altura", "ciudad", "provincia", "codigo_postal"];

const formVacio = () => ({
  nombre: "",
  estado: "activa",
  telefono: "",
  horarios: crearHorariosVacios(),
  calle: "",
  altura: "",
  ciudad: "",
  provincia: "",
  codigo_postal: "",
  latitud: "",
  longitud: "",
  radio_km: "2",
});

export default function AdminSucursalesPage() {
  const { isAdmin } = useAuth();
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(formVacio);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [listaAbierta, setListaAbierta] = useState(false);
  const [resolviendo, setResolviendo] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");
  const { buscar: buscarCoords, cancelar: cancelarCoords, resolviendo: resolviendoFwd, error: errorFwd } =
    useDebouncedForwardGeocode();

  const latNum = parseFloat(form.latitud);
  const lngNum = parseFloat(form.longitud);
  const mapPosition =
    form.latitud !== "" && form.longitud !== "" && !Number.isNaN(latNum) && !Number.isNaN(lngNum)
      ? [latNum, lngNum]
      : null;

  const handlePick = async (lat, lng) => {
    cancelarCoords();
    setGeoMsg("");
    setResolviendo(true);
    try {
      const r = await reverseGeocode(lat, lng);
      setForm((f) => ({
        ...f,
        calle: r.calle || f.calle,
        altura: r.altura || f.altura,
        ciudad: r.ciudad || f.ciudad,
        provincia: r.provincia || f.provincia,
        codigo_postal: r.codigo_postal || f.codigo_postal,
        latitud: lat,
        longitud: lng,
      }));
      if (!r.calle || !r.altura) {
        setGeoMsg("No se encontró una dirección exacta en ese punto, completala manualmente");
      }
    } catch {
      setGeoMsg("No se pudo resolver la dirección, completala manualmente");
      setForm((f) => ({ ...f, latitud: lat, longitud: lng }));
    } finally {
      setResolviendo(false);
    }
  };

  const fetch = async () => {
    setLoading(true);
    try {
      setSucursales(await getSucursales());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (isAdmin) fetch();
  }, [isAdmin]);

  if (!isAdmin)
    return (
      <p className="p-8 text-center text-danger">
        Acceso denegado — Solo administrador puede gestionar sucursales.{" "}
        <Link to="/" className="text-primary underline">
          Elegir usuario
        </Link>
      </p>
    );
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando sucursales...</p>;
  if (error) return <p className="p-8 text-center text-danger">{error}</p>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    // Sincronización inversa: dirección tipeada -> coordenadas -> mapa
    if (!CAMPOS_DIRECCION.includes(name)) return;
    if (!next.calle.trim()) {
      cancelarCoords();
      return;
    }
    buscarCoords(
      { calle: next.calle, altura: next.altura, ciudad: next.ciudad, provincia: next.provincia, codigo_postal: next.codigo_postal },
      (pos) => {
        if (!pos) {
          setGeoMsg("No se encontró la dirección; ajustala o tocá el mapa");
          return;
        }
        setGeoMsg("");
        setForm((f) => ({ ...f, latitud: pos[0], longitud: pos[1] }));
      }
    );
  };

  const handleHorarioChange = (dia, campo, valor) => {
    setForm((f) => ({
      ...f,
      horarios: {
        ...f.horarios,
        [dia]: { ...f.horarios[dia], [campo]: valor },
      },
    }));
  };

  const toPayload = () => ({
    nombre: form.nombre,
    estado: form.estado || undefined,
    telefono: form.telefono || undefined,
    horarios: DIAS.filter((d) => form.horarios[d.id].abierto).map((d) => ({
      dia_semana: d.id,
      hora_apertura: form.horarios[d.id].apertura,
      hora_cierre: form.horarios[d.id].cierre,
    })),
    calle: form.calle,
    altura: form.altura,
    ciudad: form.ciudad,
    provincia: form.provincia,
    codigo_postal: form.codigo_postal || undefined,
    latitud: form.latitud === "" ? undefined : parseFloat(form.latitud),
    longitud: form.longitud === "" ? undefined : parseFloat(form.longitud),
    radio_km: parseFloat(form.radio_km),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!form.nombre || !form.calle || !form.altura || !form.ciudad || !form.provincia) {
      return setMsg("Error: nombre, calle, altura, ciudad y provincia son obligatorios");
    }
    const radioKm = parseFloat(form.radio_km);
    if (!Number.isFinite(radioKm) || radioKm < 0.1 || radioKm > 100) {
      return setMsg("Error: el radio de cobertura debe estar entre 0.1 y 100 km");
    }
    const diasAbiertos = DIAS.filter((d) => form.horarios[d.id].abierto);
    for (const d of diasAbiertos) {
      const h = form.horarios[d.id];
      if (!h.apertura || !h.cierre) {
        return setMsg(`Error: completá apertura y cierre para ${d.nombre}`);
      }
      if (h.apertura === h.cierre) {
        return setMsg(`Error: apertura y cierre no pueden ser iguales (${d.nombre})`);
      }
    }
    try {
      if (editingId) {
        await updateSucursal(editingId, toPayload());
        setMsg("Sucursal modificada");
      } else {
        await createSucursal(toPayload());
        setMsg("Sucursal dada de alta");
      }
      setForm(formVacio());
      setEditingId(null);
      fetch();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleEdit = (s) => {
    const horarios = crearHorariosVacios();
    for (const h of s.horarios || []) {
      horarios[h.dia_semana] = {
        abierto: true,
        apertura: formatHora(h.hora_apertura),
        cierre: formatHora(h.hora_cierre),
      };
    }
    setEditingId(s.id_sucursal);
    setForm({
      nombre: s.nombre || "",
      estado: s.estado || "activa",
      telefono: s.telefono || "",
      horarios,
      calle: s.calle || "",
      altura: s.altura || "",
      ciudad: s.ciudad || "",
      provincia: s.provincia || "",
      codigo_postal: s.codigo_postal || "",
      latitud: s.latitud ?? "",
      longitud: s.longitud ?? "",
      radio_km: s.radio_km ?? "2",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Dar de baja la sucursal?")) return;
    try {
      await deleteSucursal(id);
      setMsg("Sucursal dada de baja");
      fetch();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-extrabold">Gestión de sucursales — Admin</h1>
      <p className="text-sm text-text-soft">
        Alta, baja y modificación via POST / PUT / DELETE /api/sucursales
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-5 space-y-4">
        <h3 className="font-semibold">{editingId ? `Modificar #${editingId}` : "Alta de sucursal"}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">
            Nombre*
            <input name="nombre" value={form.nombre} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">
            Estado
            <select name="estado" value={form.estado} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 mt-1">
              <option value="activa">activa</option>
              <option value="inactiva">inactiva</option>
              <option value="cerrada">cerrada</option>
            </select>
          </label>
        </div>
        <label className="text-sm block">
          Teléfono
          <input name="telefono" value={form.telefono} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
        </label>

        <div className="border-t border-border pt-4 space-y-3">
          <div>
            <p className="font-semibold text-sm">Horarios de atención</p>
            <p className="text-xs text-text-soft">
              Sin días cargados la sucursal se considera abierta siempre. Para cerrarla, usá Estado = inactiva.
            </p>
          </div>
          <div className="space-y-2">
            {DIAS.map((d) => {
              const h = form.horarios[d.id];
              return (
                <div key={d.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <label className="flex items-center gap-2 w-32">
                    <input
                      type="checkbox"
                      checked={h.abierto}
                      onChange={(e) => handleHorarioChange(d.id, "abierto", e.target.checked)}
                      className="accent-primary"
                    />
                    {d.nombre}
                  </label>
                  <input
                    type="time"
                    value={h.apertura}
                    onChange={(e) => handleHorarioChange(d.id, "apertura", e.target.value)}
                    disabled={!h.abierto}
                    className="border border-border rounded-md px-2 py-1 disabled:opacity-50"
                  />
                  <span className="text-xs text-text-soft">a</span>
                  <input
                    type="time"
                    value={h.cierre}
                    onChange={(e) => handleHorarioChange(d.id, "cierre", e.target.value)}
                    disabled={!h.abierto}
                    className="border border-border rounded-md px-2 py-1 disabled:opacity-50"
                  />
                  {!h.abierto && <span className="text-xs text-text-soft">Cerrado</span>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="border-t border-border pt-4 space-y-3">
          <p className="font-semibold text-sm">Ubicación en mapa</p>
          <p className="text-xs text-text-soft">Tocá el mapa para ubicar el marcador (o arrastralo); se autocompletan calle, altura, ciudad, provincia y código postal. También podés escribir la dirección y el mapa se ubica solo</p>
          <MapPicker position={mapPosition} onPick={handlePick} />
          {(mapPosition || resolviendo || resolviendoFwd) && (
            <p className="text-xs text-text-soft">
              {mapPosition && <>Lat: {mapPosition[0].toFixed(6)}, Lng: {mapPosition[1].toFixed(6)}</>}
              {resolviendo && " — resolviendo dirección..."}
              {resolviendoFwd && " — ubicando en el mapa..."}
            </p>
          )}
          {errorFwd && <p className="text-xs text-danger">{errorFwd}</p>}
          {geoMsg && <p className="text-xs text-text-soft">{geoMsg}</p>}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">
            Calle*
            <input name="calle" value={form.calle} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">
            Altura*
            <input name="altura" value={form.altura} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <label className="text-sm">
            Ciudad*
            <input name="ciudad" value={form.ciudad} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">
            Provincia*
            <input name="provincia" value={form.provincia} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">
            Código postal
            <input name="codigo_postal" value={form.codigo_postal} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <label className="text-sm">
            Latitud
            <input name="latitud" type="number" step="any" value={form.latitud} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">
            Longitud
            <input name="longitud" type="number" step="any" value={form.longitud} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">
            Radio de cobertura (km)*
            <input name="radio_km" type="number" min="0.1" max="100" step="0.1" value={form.radio_km} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-pill font-semibold">
            {editingId ? "Guardar" : "Crear"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(formVacio());
              }}
              className="border border-border bg-white px-6 py-2 rounded-pill"
            >
              Cancelar
            </button>
          )}
        </div>
        {msg && (
          <p className={`text-sm p-2 rounded-md border ${msg.startsWith("Error") ? "bg-red-50 text-danger border-red-200" : "bg-green-50 text-success border-green-200"}`}>
            {msg}
          </p>
        )}
      </form>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => setListaAbierta((v) => !v)}
          aria-expanded={listaAbierta}
          className="w-full flex justify-between items-center px-4 py-3 md:cursor-default"
        >
          <span className="font-bold text-sm">Sucursales ({sucursales.length})</span>
          <svg
            className={`w-4 h-4 md:hidden transition-transform ${listaAbierta ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Tarjetas apiladas en una columna (mobile) */}
        <div className={`${listaAbierta ? "block" : "hidden"} md:hidden space-y-3 p-4 border-t border-border`}>
          {sucursales.map((s) => (
            <div key={s.id_sucursal} className="rounded-md border border-border p-4 space-y-2 bg-white">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="font-bold text-primary text-sm">#{s.id_sucursal}</span>
                  <p className="font-semibold">{s.nombre}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <span className="block text-xs text-text-soft">{s.estado}</span>
                  <span className={`inline-block text-[11px] px-2 py-0.5 rounded-pill ${s.abierta_ahora ? "bg-green-50 text-success" : "bg-background text-text-soft"}`}>
                    {s.abierta_ahora ? "Abierta ahora" : "Cerrada ahora"}
                  </span>
                </div>
              </div>
              <p className="text-sm text-text-soft">
                {s.calle} {s.altura}, {s.ciudad} ({s.provincia}){s.codigo_postal ? ` · CP ${s.codigo_postal}` : ""}
              </p>
              <p className="text-sm text-text-soft">
                Tel: {s.telefono || "—"} · {formatHorarios(s.horarios)}
              </p>
              <p className="text-sm text-text-soft">
                Radio de cobertura: {parseFloat(s.radio_km ?? 2)} km
              </p>
              <div className="flex gap-2 border-t border-border pt-3">
                <button onClick={() => handleEdit(s)} className="flex-1 text-xs border border-border px-3 py-1.5 rounded-pill hover:border-primary">
                  Modificar
                </button>
                <button onClick={() => handleDelete(s.id_sucursal)} className="flex-1 text-xs bg-danger text-white px-3 py-1.5 rounded-pill hover:bg-red-700">
                  Baja
                </button>
              </div>
            </div>
          ))}
          {sucursales.length === 0 && (
            <p className="text-sm text-text-soft text-center">No hay sucursales</p>
          )}
        </div>

        {/* Tabla (desktop) */}
        <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border text-text-soft">
              <tr>
                <th className="text-left px-4 py-2">#</th>
                <th className="text-left px-4 py-2">Nombre</th>
                <th className="text-left px-4 py-2">Estado</th>
                <th className="text-left px-4 py-2">Dirección</th>
                <th className="text-left px-4 py-2">Tel / Horarios</th>
                <th className="text-left px-4 py-2">Radio</th>
                <th className="text-center px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sucursales.map((s) => (
                <tr key={s.id_sucursal} className="border-b border-border align-top">
                  <td className="px-4 py-2 font-bold text-primary">#{s.id_sucursal}</td>
                  <td className="px-4 py-2">{s.nombre}</td>
                  <td className="px-4 py-2">
                    <div>{s.estado}</div>
                    <span className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-pill ${s.abierta_ahora ? "bg-green-50 text-success" : "bg-background text-text-soft"}`}>
                      {s.abierta_ahora ? "Abierta ahora" : "Cerrada ahora"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {s.calle} {s.altura}, {s.ciudad} ({s.provincia}){s.codigo_postal ? ` · CP ${s.codigo_postal}` : ""}
                  </td>
                  <td className="px-4 py-2 text-text-soft">
                    {s.telefono || "—"} / {formatHorarios(s.horarios)}
                  </td>
                  <td className="px-4 py-2 text-text-soft">{parseFloat(s.radio_km ?? 2)} km</td>
                  <td className="px-4 py-2 text-center space-x-2 whitespace-nowrap">
                    <button onClick={() => handleEdit(s)} className="text-xs border border-border px-3 py-1 rounded-pill hover:border-primary">
                      Modificar
                    </button>
                    <button onClick={() => handleDelete(s.id_sucursal)} className="text-xs bg-danger text-white px-3 py-1 rounded-pill hover:bg-red-700">
                      Baja
                    </button>
                  </td>
                </tr>
              ))}
              {sucursales.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-soft">
                    No hay sucursales
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
}
