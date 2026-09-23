import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getSucursales,
  createSucursal,
  updateSucursal,
  deleteSucursal,
} from "../services/sucursalService.js";

const emptyForm = {
  nombre: "",
  estado: "activa",
  telefono: "",
  horario: "",
  calle: "",
  altura: "",
  ciudad: "",
  provincia: "",
  latitud: "",
  longitud: "",
};

export default function AdminSucursalesPage() {
  const { isAdmin } = useAuth();
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [listaAbierta, setListaAbierta] = useState(false);

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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toPayload = () => ({
    nombre: form.nombre,
    estado: form.estado || undefined,
    telefono: form.telefono || undefined,
    horario: form.horario || undefined,
    calle: form.calle,
    altura: form.altura,
    ciudad: form.ciudad,
    provincia: form.provincia,
    latitud: form.latitud === "" ? undefined : parseFloat(form.latitud),
    longitud: form.longitud === "" ? undefined : parseFloat(form.longitud),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!form.nombre || !form.calle || !form.altura || !form.ciudad || !form.provincia) {
      return setMsg("Error: nombre, calle, altura, ciudad y provincia son obligatorios");
    }
    try {
      if (editingId) {
        await updateSucursal(editingId, toPayload());
        setMsg("Sucursal modificada");
      } else {
        await createSucursal(toPayload());
        setMsg("Sucursal dada de alta");
      }
      setForm(emptyForm);
      setEditingId(null);
      fetch();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleEdit = (s) => {
    setEditingId(s.id_sucursal);
    setForm({
      nombre: s.nombre || "",
      estado: s.estado || "activa",
      telefono: s.telefono || "",
      horario: s.horario || "",
      calle: s.calle || "",
      altura: s.altura || "",
      ciudad: s.ciudad || "",
      provincia: s.provincia || "",
      latitud: s.latitud ?? "",
      longitud: s.longitud ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar sucursal?")) return;
    try {
      await deleteSucursal(id);
      setMsg("Sucursal eliminada");
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
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">
            Teléfono
            <input name="telefono" value={form.telefono} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">
            Horario
            <input name="horario" value={form.horario} onChange={handleChange} placeholder="10:00-23:00" className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
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
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">
            Ciudad*
            <input name="ciudad" value={form.ciudad} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">
            Provincia*
            <input name="provincia" value={form.provincia} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">
            Latitud
            <input name="latitud" type="number" step="any" value={form.latitud} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">
            Longitud
            <input name="longitud" type="number" step="any" value={form.longitud} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
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
                setForm(emptyForm);
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
                <span className="text-xs text-text-soft shrink-0">{s.estado}</span>
              </div>
              <p className="text-sm text-text-soft">
                {s.calle} {s.altura}, {s.ciudad} ({s.provincia})
              </p>
              <p className="text-sm text-text-soft">
                Tel: {s.telefono || "—"} · Horario: {s.horario || "—"}
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
                <th className="text-left px-4 py-2">Tel / Horario</th>
                <th className="text-center px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sucursales.map((s) => (
                <tr key={s.id_sucursal} className="border-b border-border align-top">
                  <td className="px-4 py-2 font-bold text-primary">#{s.id_sucursal}</td>
                  <td className="px-4 py-2">{s.nombre}</td>
                  <td className="px-4 py-2">{s.estado}</td>
                  <td className="px-4 py-2">
                    {s.calle} {s.altura}, {s.ciudad} ({s.provincia})
                  </td>
                  <td className="px-4 py-2 text-text-soft">
                    {s.telefono || "—"} / {s.horario || "—"}
                  </td>
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
                  <td colSpan={6} className="p-8 text-center text-text-soft">
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
