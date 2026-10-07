import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from "../services/bannerService.js";

const emptyForm = {
  titulo: "",
  descripcion: "",
  imagen: "",
  activo: true,
  orden: 0,
};

export default function AdminBannersPage() {
  const { isAdmin } = useAuth();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [listaAbierta, setListaAbierta] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      setBanners(await getBanners());
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
        Acceso denegado — Solo administrador puede gestionar banners.{" "}
        <Link to="/" className="text-primary underline">
          Elegir usuario
        </Link>
      </p>
    );
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando banners...</p>;
  if (error) return <p className="p-8 text-center text-danger">{error}</p>;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!form.titulo.trim() || !form.imagen.trim()) {
      return setMsg("Error: título e imagen son obligatorios");
    }
    try {
      const payload = { ...form, orden: parseInt(form.orden, 10) || 0 };
      if (editingId) {
        await updateBanner(editingId, payload);
        setMsg("Banner modificado");
      } else {
        await createBanner(payload);
        setMsg("Banner dado de alta");
      }
      setForm(emptyForm);
      setEditingId(null);
      fetch();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleEdit = (b) => {
    setEditingId(b.id_banner);
    setForm({
      titulo: b.titulo || "",
      descripcion: b.descripcion || "",
      imagen: b.imagen || "",
      activo: b.activo,
      orden: b.orden ?? 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleActiva = async (b) => {
    try {
      await updateBanner(b.id_banner, { activo: !b.activo });
      setMsg(`Banner ${!b.activo ? "activado" : "desactivado"}`);
      fetch();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar banner?")) return;
    try {
      await deleteBanner(id);
      setMsg("Banner eliminado");
      fetch();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-extrabold">Gestión de banners — Admin</h1>
      <p className="text-sm text-text-soft">
        Alta, baja y modificación via POST / PUT / DELETE /api/banners. Se muestran arriba del catálogo, ordenados por orden.
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-5 space-y-4">
        <h3 className="font-semibold">{editingId ? `Modificar #${editingId}` : "Alta de banner"}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">
            Título*
            <input name="titulo" value={form.titulo} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">
            Imagen URL*
            <input name="imagen" value={form.imagen} onChange={handleChange} required placeholder="https://..." className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
        </div>
        <label className="text-sm block">
          Descripción
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
        </label>
        <div className="grid md:grid-cols-2 gap-4 items-end">
          <label className="text-sm">
            Orden
            <input name="orden" type="number" min="0" value={form.orden} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
            <input name="activo" type="checkbox" checked={form.activo} onChange={handleChange} className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary" />
            Activo (visible en catálogo)
          </label>
        </div>
        {form.imagen && (
          <div className="h-32 bg-background rounded-md overflow-hidden border border-border">
            <img src={form.imagen} alt="Vista previa" className="h-full w-full object-cover" />
          </div>
        )}
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
          <span className="font-bold text-sm">Banners ({banners.length})</span>
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
          {banners.map((b) => (
            <div key={b.id_banner} className="rounded-md border border-border p-4 space-y-2 bg-white">
              <div className="h-28 bg-background rounded-sm overflow-hidden border border-border">
                <img src={b.imagen} alt={b.titulo} className="w-full h-full object-cover" />
              </div>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="font-bold text-primary text-sm">#{b.id_banner}</span>
                  <p className="font-semibold">{b.titulo}</p>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-pill border shrink-0 ${b.activo ? "bg-green-50 text-success border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                  {b.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="text-sm text-text-soft">Orden: {b.orden}</p>
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <button onClick={() => handleEdit(b)} className="flex-1 text-xs border border-border px-3 py-1.5 rounded-pill hover:border-primary">Modificar</button>
                <button onClick={() => handleToggleActiva(b)} className={`flex-1 text-xs px-3 py-1.5 rounded-pill border ${b.activo ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-success"}`}>
                  {b.activo ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => handleDelete(b.id_banner)} className="flex-1 text-xs bg-danger text-white px-3 py-1.5 rounded-pill hover:bg-red-700">Baja</button>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <p className="text-sm text-text-soft text-center">No hay banners</p>
          )}
        </div>

        {/* Tabla (desktop) */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border text-text-soft">
              <tr>
                <th className="text-left px-4 py-2">#</th>
                <th className="text-left px-4 py-2">Banner</th>
                <th className="text-left px-4 py-2">Estado</th>
                <th className="text-left px-4 py-2">Orden</th>
                <th className="text-center px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id_banner} className="border-b border-border align-top">
                  <td className="px-4 py-2 font-bold text-primary">#{b.id_banner}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-10 bg-background rounded-sm flex items-center justify-center overflow-hidden shrink-0 border border-border">
                        <img src={b.imagen} alt={b.titulo} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-medium">{b.titulo}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-pill border ${b.activo ? "bg-green-50 text-success border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {b.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-2">{b.orden}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">
                    <div className="flex flex-wrap gap-1 justify-center">
                      <button onClick={() => handleEdit(b)} className="text-xs border border-border px-3 py-1 rounded-pill hover:border-primary">Modificar</button>
                      <button onClick={() => handleToggleActiva(b)} className={`text-xs px-3 py-1 rounded-pill border ${b.activo ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-success"}`}>
                        {b.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button onClick={() => handleDelete(b.id_banner)} className="text-xs bg-danger text-white px-3 py-1 rounded-pill hover:bg-red-700">Baja</button>
                    </div>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-text-soft">No hay banners</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
