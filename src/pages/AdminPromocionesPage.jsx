import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getProductos } from "../services/productService.js";
import {
  getPromociones,
  createPromocion,
  updatePromocion,
  deletePromocion,
} from "../services/promocionService.js";

const TIPOS = ["PRECIO_FIJO", "PORCENTAJE", "DOS_POR_UNO"];

const emptyForm = {
  nombre: "",
  descripcion: "",
  imagen: "",
  tipo: "PRECIO_FIJO",
  valor: "",
  fecha_inicio: "",
  fecha_fin: "",
  activa: true,
};

function tipoLabel(tipo) {
  switch (tipo) {
    case "PRECIO_FIJO": return "Precio fijo";
    case "PORCENTAJE": return "Porcentaje";
    case "DOS_POR_UNO": return "2x1";
    default: return tipo;
  }
}

export default function AdminPromocionesPage() {
  const { isAdmin } = useAuth();
  const [promociones, setPromociones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  // { id_producto: cantidad }
  const [seleccion, setSeleccion] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [listaAbierta, setListaAbierta] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const [promos, prods] = await Promise.all([getPromociones(), getProductos()]);
      setPromociones(promos);
      setProductos(prods);
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
        Acceso denegado — Solo administrador puede gestionar promociones.{" "}
        <Link to="/" className="text-primary underline">
          Elegir usuario
        </Link>
      </p>
    );
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando promociones...</p>;
  if (error) return <p className="p-8 text-center text-danger">{error}</p>;

  const toggleProducto = (id) => {
    setSeleccion((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  };

  const setCantidad = (id, cantidad) => {
    const n = Math.max(1, parseInt(cantidad, 10) || 1);
    setSeleccion((prev) => ({ ...prev, [id]: n }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setSeleccion({});
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    const items = Object.entries(seleccion).map(([id_producto, cantidad]) => ({
      id_producto: parseInt(id_producto, 10),
      cantidad,
    }));
    if (items.length === 0) return setMsg("Error: seleccioná al menos un producto");
    try {
      const payload = {
        ...form,
        imagen: form.imagen || null,
        valor: parseFloat(form.valor),
        productos: items,
      };
      if (editingId) {
        await updatePromocion(editingId, payload);
        setMsg("Promoción modificada");
      } else {
        await createPromocion(payload);
        setMsg("Promoción dada de alta");
      }
      resetForm();
      fetch();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleEdit = (p) => {
    setEditingId(p.id_promocion);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || "",
      imagen: p.imagen || "",
      tipo: p.tipo,
      valor: p.valor,
      fecha_inicio: p.fecha_inicio,
      fecha_fin: p.fecha_fin,
      activa: p.activa,
    });
    const sel = {};
    for (const prod of p.productos || []) sel[prod.id_producto] = prod.PromocionProducto.cantidad;
    setSeleccion(sel);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleActiva = async (p) => {
    try {
      await updatePromocion(p.id_promocion, { activa: !p.activa });
      setMsg(`Promoción ${!p.activa ? "activada" : "desactivada"}`);
      fetch();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar promoción?")) return;
    try {
      await deletePromocion(id);
      setMsg("Promoción eliminada");
      fetch();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-extrabold">Gestión de promociones — Admin</h1>
      <p className="text-sm text-text-soft">Alta, modificación, activación/desactivación y baja via POST / PUT / DELETE /api/promociones</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-5 space-y-4">
        <h3 className="font-semibold">{editingId ? `Modificar #${editingId}` : "Nueva promoción"}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">
            Nombre*
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required placeholder="Combo Bajón" className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">
            Tipo*
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full border border-border rounded-md px-3 py-2 mt-1">
              {TIPOS.map((t) => (
                <option key={t} value={t}>{t} ({tipoLabel(t)})</option>
              ))}
            </select>
          </label>
        </div>
        <label className="text-sm block">
          Descripción
          <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
        </label>
        <label className="text-sm block">
          Imagen URL
          <input value={form.imagen} onChange={(e) => setForm({ ...form, imagen: e.target.value })} placeholder="https://..." className="w-full border border-border rounded-md px-3 py-2 mt-1" />
        </label>
        <div className="grid md:grid-cols-3 gap-4">
          <label className="text-sm">
            Valor* {form.tipo === "PRECIO_FIJO" ? "(precio final $)" : form.tipo === "PORCENTAJE" ? "(% descuento)" : "(ignorado en 2x1)"}
            <input type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">
            Fecha inicio*
            <input type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">
            Fecha fin*
            <input type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary" />
          Activa
        </label>

        <div className="bg-background rounded-md p-3 border border-border">
          <p className="text-sm font-semibold mb-2">Productos y cantidades*</p>
          <div className="space-y-2">
            {productos.map((p) => {
              const checked = seleccion[p.id_producto] !== undefined;
              return (
                <div key={p.id_producto} className="flex items-center gap-2 text-sm bg-white border border-border rounded-md px-3 py-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleProducto(p.id_producto)}
                    className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary"
                  />
                  <span className="flex-1">{p.nombre} <span className="text-xs text-text-soft">${parseFloat(p.precio).toFixed(2)}</span></span>
                  {checked && (
                    <label className="text-xs flex items-center gap-1">
                      Cant.
                      <input
                        type="number"
                        min="1"
                        value={seleccion[p.id_producto]}
                        onChange={(e) => setCantidad(p.id_producto, e.target.value)}
                        className="w-16 border border-border rounded-md px-2 py-1 text-sm"
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-pill font-semibold">
            {editingId ? "Guardar" : "Crear"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="border border-border bg-white px-6 py-2 rounded-pill">
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
          <span className="font-bold text-sm">Promociones ({promociones.length})</span>
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
          {promociones.map((p) => (
            <div key={p.id_promocion} className="rounded-md border border-border p-4 space-y-3 bg-white">
              <div className="flex gap-3 items-start">
                <div className="w-16 h-16 bg-background rounded-sm flex items-center justify-center overflow-hidden shrink-0 border border-border">
                  {p.imagen ? <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" /> : <span className="text-[10px] text-text-soft">Sin img</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-primary text-sm">#{p.id_promocion}</span>
                  <p className="font-semibold">{p.nombre}</p>
                  <span className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-pill border ${p.vigente ? "bg-green-50 text-success border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {p.vigente ? "Vigente" : p.activa ? "Fuera de vigencia" : "Inactiva"}
                  </span>
                </div>
              </div>
              <p className="text-sm">{tipoLabel(p.tipo)}: <span className="font-semibold">{p.tipo === "PORCENTAJE" ? `${parseFloat(p.valor)}%` : `$${parseFloat(p.valor).toFixed(2)}`}</span></p>
              <p className="text-sm text-text-soft">{p.fecha_inicio} → {p.fecha_fin}</p>
              <div>
                <p className="text-xs font-semibold text-text-soft mb-1">Productos</p>
                <ul className="space-y-0.5 text-xs">
                  {(p.productos || []).map((prod) => (
                    <li key={prod.id_producto}>{prod.nombre} × {prod.PromocionProducto.cantidad}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <button onClick={() => handleEdit(p)} className="flex-1 text-xs border border-border px-3 py-1.5 rounded-pill hover:border-primary">Modificar</button>
                <button onClick={() => handleToggleActiva(p)} className={`flex-1 text-xs px-3 py-1.5 rounded-pill border ${p.activa ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-success"}`}>
                  {p.activa ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => handleDelete(p.id_promocion)} className="flex-1 text-xs bg-danger text-white px-3 py-1.5 rounded-pill hover:bg-red-700">Baja</button>
              </div>
            </div>
          ))}
          {promociones.length === 0 && (
            <p className="text-sm text-text-soft text-center">No hay promociones</p>
          )}
        </div>

        {/* Tabla (desktop) */}
        <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-background border-b border-border text-text-soft">
            <tr>
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Nombre</th>
              <th className="text-left px-4 py-2">Tipo / Valor</th>
              <th className="text-left px-4 py-2">Vigencia</th>
              <th className="text-left px-4 py-2">Productos</th>
              <th className="text-center px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {promociones.map((p) => (
              <tr key={p.id_promocion} className="border-b border-border align-top">
                <td className="px-4 py-2 font-bold text-primary">#{p.id_promocion}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-background rounded-sm flex items-center justify-center overflow-hidden shrink-0 border border-border">
                      {p.imagen ? <img src={p.imagen} alt={p.nombre} className="w-full h-full object-cover" /> : <span className="text-[10px] text-text-soft">Sin img</span>}
                    </div>
                    <span className="font-medium">{p.nombre}</span>
                  </div>
                  <span className={`ml-2 text-[11px] px-2 py-0.5 rounded-pill border ${p.vigente ? "bg-green-50 text-success border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {p.vigente ? "Vigente" : p.activa ? "Fuera de vigencia" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-2">{tipoLabel(p.tipo)}: <span className="font-semibold">{p.tipo === "PORCENTAJE" ? `${parseFloat(p.valor)}%` : `$${parseFloat(p.valor).toFixed(2)}`}</span></td>
                <td className="px-4 py-2 text-text-soft whitespace-nowrap">{p.fecha_inicio} → {p.fecha_fin}</td>
                <td className="px-4 py-2">
                  <ul className="space-y-0.5 text-xs">
                    {(p.productos || []).map((prod) => (
                      <li key={prod.id_producto}>{prod.nombre} × {prod.PromocionProducto.cantidad}</li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-2 text-center whitespace-nowrap">
                  <div className="flex flex-wrap gap-1 justify-center">
                    <button onClick={() => handleEdit(p)} className="text-xs border border-border px-3 py-1 rounded-pill hover:border-primary">Modificar</button>
                    <button onClick={() => handleToggleActiva(p)} className={`text-xs px-3 py-1 rounded-pill border ${p.activa ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-success"}`}>
                      {p.activa ? "Desactivar" : "Activar"}
                    </button>
                    <button onClick={() => handleDelete(p.id_promocion)} className="text-xs bg-danger text-white px-3 py-1 rounded-pill hover:bg-red-700">Baja</button>
                  </div>
                </td>
              </tr>
            ))}
            {promociones.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-text-soft">No hay promociones</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
