import { useEffect, useState } from "react";
import { apiFetch } from "../services/api.js";
import { getProductos } from "../services/productService.js";
import { getOpcionalesByProducto, createOpcional, updateOpcional, deleteOpcional } from "../services/opcionalService.js";
import { getCategorias } from "../services/categoriaService.js";
import { getMateriasPrimas } from "../services/materiaPrimaService.js";
import { getSucursales } from "../services/sucursalService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";

function VistaProductosEmpleado({ idSucursal }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listaAbierta, setListaAbierta] = useState(false);

  useEffect(() => {
    if (!idSucursal) { setLoading(false); return; }
    setLoading(true);
    getProductos(idSucursal)
      .then(setProductos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [idSucursal]);

  if (!idSucursal) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <p className="bg-white rounded-lg border border-border p-8 text-center text-text-soft">No tenés sucursal asignada. Pedile a un administrador que te asigne una.</p>
      </div>
    );
  }
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando productos...</p>;
  if (error) return <p className="p-8 text-center text-danger">{error}</p>;

  const receta = (p) =>
    (p.materiasPrimas || []).length > 0 ? (
      <div className="flex flex-wrap gap-1">
        {p.materiasPrimas.map((m) => (
          <span key={m.id_materia_prima} className="text-[11px] bg-background border border-border px-2 py-0.5 rounded-pill">
            {m.nombre}{m.ProductoMateriaPrima ? ` ×${m.ProductoMateriaPrima.cantidad}` : ""}
          </span>
        ))}
      </div>
    ) : (
      <span className="text-xs text-danger">Sin receta (no disponible)</span>
    );

  const disponible = (p) => (
    <span className={`font-bold ${(p.stock ?? 0) > 0 ? "text-success" : "text-danger"}`}>{p.stock ?? 0}</span>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Productos y disponibilidad</h1>
        <p className="text-sm text-text-soft">Cantidad disponible estimada según el stock de materias primas de tu sucursal. Para cargar stock, andá a <Link to="/admin/materias-primas" className="text-primary underline">Materias primas</Link>.</p>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => setListaAbierta((v) => !v)}
          aria-expanded={listaAbierta}
          className="w-full flex justify-between items-center px-4 py-3 md:cursor-default"
        >
          <span className="font-bold text-sm">Productos ({productos.length})</span>
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
          {productos.map((p) => (
            <div key={p.id_producto} className="rounded-md border border-border p-4 space-y-2 bg-white">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="font-bold text-primary text-sm">#{p.id_producto}</span>
                  <p className="font-semibold">{p.nombre}</p>
                </div>
                <span className="text-xs text-text-soft shrink-0">{p.estado}</span>
              </div>
              <p className="text-sm text-text-soft">${parseFloat(p.precio).toFixed(2)} · Disponible: {disponible(p)}</p>
              <div>
                <p className="text-xs font-semibold text-text-soft mb-1">Receta</p>
                {receta(p)}
              </div>
            </div>
          ))}
          {productos.length === 0 && <p className="text-sm text-text-soft text-center">No hay productos</p>}
        </div>

        {/* Tabla (desktop) */}
        <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-background border-b border-border text-text-soft">
            <tr><th className="text-left px-4 py-2">#</th><th className="text-left px-4 py-2">Producto</th><th className="text-left px-4 py-2">Precio</th><th className="text-left px-4 py-2">Estado</th><th className="text-left px-4 py-2">Receta</th><th className="text-left px-4 py-2">Disponible</th></tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id_producto} className="border-b border-border align-top">
                <td className="px-4 py-2 font-bold text-primary">#{p.id_producto}</td>
                <td className="px-4 py-2">{p.nombre}</td>
                <td className="px-4 py-2">${parseFloat(p.precio).toFixed(2)}</td>
                <td className="px-4 py-2">{p.estado}</td>
                <td className="px-4 py-2">{receta(p)}</td>
                <td className="px-4 py-2">{disponible(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const { isAdmin, isStaff, user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ nombre: "", descripcion: "", precio: "", imagen: "", estado: "disponible" });
  const [formCategorias, setFormCategorias] = useState([]);
  const [todasCategorias, setTodasCategorias] = useState([]);
  const [formReceta, setFormReceta] = useState([]); // [{id_materia_prima, cantidad}]
  const [todasMaterias, setTodasMaterias] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");

  // Disponibilidad derivada por sucursal (sección aparte)
  const [sucursales, setSucursales] = useState([]);
  const [sucursalVista, setSucursalVista] = useState("");
  const [disponibilidad, setDisponibilidad] = useState([]);

  // Opcionales admin
  const [opciones, setOpciones] = useState({}); // {id_producto: [opcionales]}
  const [opcForm, setOpcForm] = useState({ id_producto: "", nombre: "", descripcion: "", precio: "", estado: "disponible" });
  const [editingOpcId, setEditingOpcId] = useState(null);
  const [opcMsg, setOpcMsg] = useState("");
  const [listaAbierta, setListaAbierta] = useState(false);

  const resetForm = () => {
    setForm({ nombre: "", descripcion: "", precio: "", imagen: "", estado: "disponible" });
    setFormCategorias([]);
    setFormReceta([]);
    setEditingId(null);
  };

  const toggleFormCategoria = (id) => {
    setFormCategorias((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleFormMateria = (id) => {
    setFormReceta((prev) =>
      prev.some((r) => r.id_materia_prima === id)
        ? prev.filter((r) => r.id_materia_prima !== id)
        : [...prev, { id_materia_prima: id, cantidad: "1" }]
    );
  };

  const setRecetaCantidad = (id, cantidad) => {
    setFormReceta((prev) => prev.map((r) => (r.id_materia_prima === id ? { ...r, cantidad } : r)));
  };

  const cargar = async () => {
    setLoading(true);
    try {
      const [prods, cats, materias] = await Promise.all([getProductos(), getCategorias(), getMateriasPrimas()]);
      setProductos(prods);
      setTodasCategorias(cats);
      setTodasMaterias(materias);
      // cargar opcionales por producto
      const map = {};
      for (const p of prods) {
        try { map[p.id_producto] = await getOpcionalesByProducto(p.id_producto); } catch { map[p.id_producto] = []; }
      }
      setOpciones(map);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => {
    if (!isAdmin) return;
    cargar();
    getSucursales().then(setSucursales).catch((e) => setError(e.message));
  }, [isAdmin]);

  // Disponibilidad por sucursal (independiente de la lista de productos).
  // Se refresca también cuando cambian los productos (ej. se edita una receta).
  useEffect(() => {
    if (!isAdmin || !sucursalVista) { setDisponibilidad([]); return; }
    getProductos(sucursalVista)
      .then(setDisponibilidad)
      .catch((e) => setError(e.message));
  }, [isAdmin, sucursalVista, productos]);

  if (!isStaff) return <p className="p-8 text-center text-danger">Acceso denegado — Solo personal autorizado puede ver esta página. <Link to="/" className="text-primary underline">Elegir usuario</Link></p>;
  if (!isAdmin) return <VistaProductosEmpleado idSucursal={user?.id_sucursal} />;
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando productos...</p>;
  if (error) return <p className="p-8 text-center text-danger">{error}</p>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const receta = formReceta
        .map((r) => ({ id_materia_prima: Number(r.id_materia_prima), cantidad: parseInt(r.cantidad, 10) }))
        .filter((r) => Number.isInteger(r.cantidad) && r.cantidad >= 1);
      const payload = { ...form, precio: parseFloat(form.precio), categorias: formCategorias, materiasPrimas: receta };
      if (editingId) {
        await apiFetch(`/productos/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
        setMsg("Producto modificado");
      } else {
        await apiFetch("/productos", { method: "POST", body: JSON.stringify(payload) });
        setMsg("Producto dado de alta");
      }
      resetForm();
      cargar();
    } catch (err) { setMsg(`Error: ${err.message}`); }
  };

  const handleEdit = (p) => {
    setEditingId(p.id_producto);
    setForm({ nombre: p.nombre, descripcion: p.descripcion || "", precio: p.precio, imagen: p.imagen || "", estado: p.estado });
    setFormCategorias((p.categorias || []).map((c) => c.id_categoria));
    setFormReceta(
      (p.materiasPrimas || []).map((m) => ({
        id_materia_prima: m.id_materia_prima,
        cantidad: String(m.ProductoMateriaPrima?.cantidad ?? 1),
      }))
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Dar de baja el producto?")) return;
    try {
      await apiFetch(`/productos/${id}`, { method: "DELETE" });
      setMsg("Producto dado de baja");
      cargar();
    } catch (err) { setMsg(`Error: ${err.message}`); }
  };

  const handleOpcSubmit = async (e) => {
    e.preventDefault();
    setOpcMsg("");
    if (!opcForm.id_producto) return setOpcMsg("Error: selecciona producto");
    if (!opcForm.nombre) return setOpcMsg("Error: nombre opcional requerido");
    try {
      if (editingOpcId) {
        await updateOpcional(editingOpcId, { nombre: opcForm.nombre, descripcion: opcForm.descripcion, precio: parseFloat(opcForm.precio || 0), estado: opcForm.estado });
        setOpcMsg("Opcional modificado");
      } else {
        await createOpcional(opcForm.id_producto, { nombre: opcForm.nombre, descripcion: opcForm.descripcion, precio: parseFloat(opcForm.precio || 0), estado: opcForm.estado });
        setOpcMsg("Opcional agregado");
      }
      setOpcForm({ id_producto: "", nombre: "", descripcion: "", precio: "", estado: "disponible" });
      setEditingOpcId(null);
      cargar();
    } catch (err) { setOpcMsg(`Error: ${err.message}`); }
  };

  const handleOpcEdit = (o) => {
    setEditingOpcId(o.id_opcional);
    setOpcForm({ id_producto: o.id_producto, nombre: o.nombre, descripcion: o.descripcion || "", precio: o.precio, estado: o.estado });
  };

  const handleOpcDelete = async (id) => {
    if (!confirm("¿Dar de baja el opcional?")) return;
    try { await deleteOpcional(id); setOpcMsg("Opcional dado de baja"); cargar(); } catch (err) { setOpcMsg(`Error: ${err.message}`); }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold">Gestión de productos — Admin</h1>
          <p className="text-sm text-text-soft">Alta, baja y modificación via POST / PUT / DELETE /api/productos</p>
        </div>
        <Link to="/admin/categorias" className="text-sm text-primary hover:underline shrink-0">→ Gestionar categorías</Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-5 space-y-4">
        <h3 className="font-semibold">{editingId ? `Modificar #${editingId}` : "Alta de producto"}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">Nombre*<input value={form.nombre} onChange={(e)=>setForm({...form,nombre:e.target.value})} required className="w-full border border-border rounded-md px-3 py-2 mt-1" /></label>
          <label className="text-sm">Precio*<input type="number" step="0.01" value={form.precio} onChange={(e)=>setForm({...form,precio:e.target.value})} required className="w-full border border-border rounded-md px-3 py-2 mt-1" /></label>
        </div>
        <label className="text-sm block">Descripción<textarea value={form.descripcion} onChange={(e)=>setForm({...form,descripcion:e.target.value})} className="w-full border border-border rounded-md px-3 py-2 mt-1" rows={2} /></label>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">Imagen URL<input value={form.imagen} onChange={(e)=>setForm({...form,imagen:e.target.value})} className="w-full border border-border rounded-md px-3 py-2 mt-1" /></label>
          <label className="text-sm">Estado
            <select value={form.estado} onChange={(e)=>setForm({...form,estado:e.target.value})} className="w-full border border-border rounded-md px-3 py-2 mt-1">
              <option value="disponible">disponible</option>
              <option value="no_disponible">no_disponible</option>
              <option value="pausado">pausado</option>
            </select>
          </label>
        </div>
        <div className="bg-background rounded-md p-3 border border-border">
          <p className="text-sm font-semibold mb-2">Categorías (una o más)</p>
          {todasCategorias.length === 0 ? (
            <p className="text-xs text-text-soft">No hay categorías. <Link to="/admin/categorias" className="text-primary underline">Crear una</Link></p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {todasCategorias.map((c) => (
                <label key={c.id_categoria} className="flex items-center gap-1.5 text-sm bg-white border border-border rounded-pill px-3 py-1 cursor-pointer hover:border-primary">
                  <input
                    type="checkbox"
                    checked={formCategorias.includes(c.id_categoria)}
                    onChange={() => toggleFormCategoria(c.id_categoria)}
                    className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary"
                  />
                  {c.nombre}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="bg-background rounded-md p-3 border border-border">
          <p className="text-sm font-semibold mb-2">Materias primas (receta)</p>
          <p className="text-xs text-text-soft mb-2">Cantidad de cada insumo por unidad de producto. El stock del producto se calcula a partir de estas.</p>
          {todasMaterias.length === 0 ? (
            <p className="text-xs text-text-soft">No hay materias primas. <Link to="/admin/materias-primas" className="text-primary underline">Crear una</Link></p>
          ) : (
            <div className="space-y-2">
              {todasMaterias.map((m) => {
                const seleccionada = formReceta.find((r) => r.id_materia_prima === m.id_materia_prima);
                return (
                  <div key={m.id_materia_prima} className="flex items-center gap-3 bg-white border border-border rounded-md px-3 py-2">
                    <label className="flex items-center gap-2 text-sm flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!seleccionada}
                        onChange={() => toggleFormMateria(m.id_materia_prima)}
                        className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary"
                      />
                      {m.nombre}
                    </label>
                    {seleccionada && (
                      <label className="flex items-center gap-2 text-xs text-text-soft">
                        Cantidad
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={seleccionada.cantidad}
                          onChange={(e) => setRecetaCantidad(m.id_materia_prima, e.target.value)}
                          className="w-20 border border-border rounded-md px-2 py-1 text-sm"
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-pill font-semibold">{editingId ? "Guardar" : "Crear"}</button>
          {editingId && <button type="button" onClick={resetForm} className="border border-border bg-white px-6 py-2 rounded-pill">Cancelar</button>}
        </div>
        {msg && <p className={`text-sm p-2 rounded-md border ${msg.startsWith("Error") ? "bg-red-50 text-danger border-red-200" : "bg-green-50 text-success border-green-200"}`}>{msg}</p>}
      </form>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => setListaAbierta((v) => !v)}
          aria-expanded={listaAbierta}
          className="w-full flex justify-between items-center px-4 py-3 md:cursor-default"
        >
          <span className="font-bold text-sm">Productos ({productos.length})</span>
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
          {productos.map((p)=> (
            <div key={p.id_producto} className="rounded-md border border-border p-4 space-y-3 bg-white">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="font-bold text-primary text-sm">#{p.id_producto}</span>
                  <p className="font-semibold">{p.nombre}</p>
                </div>
                <span className="text-xs text-text-soft shrink-0">{p.estado}</span>
              </div>
              <p className="font-bold text-primary">${parseFloat(p.precio).toFixed(2)}</p>
              <div>
                <p className="text-xs font-semibold text-text-soft mb-1">Categorías</p>
                {(p.categorias || []).length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {p.categorias.map((c) => (
                      <span key={c.id_categoria} className="text-[11px] bg-background border border-border px-2 py-0.5 rounded-pill">{c.nombre}</span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-text-soft">Sin categorías</span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-text-soft mb-1">Receta</p>
                {(p.materiasPrimas || []).length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {p.materiasPrimas.map((m) => (
                      <span key={m.id_materia_prima} className="text-[11px] bg-background border border-border px-2 py-0.5 rounded-pill">
                        {m.nombre}{m.ProductoMateriaPrima ? ` ×${m.ProductoMateriaPrima.cantidad}` : ""}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-danger">Sin receta (no disponible)</span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-text-soft mb-1">Opcionales</p>
                <ul className="space-y-1">
                  {(opciones[p.id_producto] || []).map((o) => (
                    <li key={o.id_opcional} className="flex gap-2 items-center text-xs">
                      <span className="font-medium flex-1">{o.nombre}</span>
                      <span className="text-text-soft">${parseFloat(o.precio).toFixed(2)}</span>
                      <button onClick={()=>handleOpcEdit(o)} className="text-[11px] border border-border px-2 py-0.5 rounded-pill">✎</button>
                      <button onClick={()=>handleOpcDelete(o.id_opcional)} className="text-[11px] bg-red-50 text-danger px-2 py-0.5 rounded-pill">x</button>
                    </li>
                  ))}
                  {(opciones[p.id_producto] || []).length === 0 && <li className="text-xs text-text-soft">Sin opcionales</li>}
                </ul>
              </div>
              <div className="flex gap-2 border-t border-border pt-3">
                <button onClick={()=>handleEdit(p)} className="flex-1 text-xs border border-border px-3 py-1.5 rounded-pill hover:border-primary">Modificar</button>
                <button onClick={()=>handleDelete(p.id_producto)} className="flex-1 text-xs bg-danger text-white px-3 py-1.5 rounded-pill hover:bg-red-700">Baja</button>
              </div>
            </div>
          ))}
          {productos.length === 0 && (
            <p className="text-sm text-text-soft text-center">No hay productos</p>
          )}
        </div>

        {/* Tabla (desktop) */}
        <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-background border-b border-border text-text-soft">
            <tr><th className="text-left px-4 py-2">#</th><th className="text-left px-4 py-2">Nombre</th><th className="text-left px-4 py-2">Precio</th><th className="text-left px-4 py-2">Estado</th><th className="text-left px-4 py-2">Categorías</th><th className="text-left px-4 py-2">Receta</th><th className="text-left px-4 py-2">Opcionales</th><th className="text-center px-4 py-2">Acciones</th></tr>
          </thead>
          <tbody>
            {productos.map((p)=> (
              <tr key={p.id_producto} className="border-b border-border align-top">
                <td className="px-4 py-2 font-bold text-primary">#{p.id_producto}</td>
                <td className="px-4 py-2">{p.nombre}</td>
                <td className="px-4 py-2">${parseFloat(p.precio).toFixed(2)}</td>
                <td className="px-4 py-2">{p.estado}</td>
                <td className="px-4 py-2">
                  {(p.categorias || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {p.categorias.map((c) => (
                        <span key={c.id_categoria} className="text-[11px] bg-background border border-border px-2 py-0.5 rounded-pill">{c.nombre}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-text-soft">Sin categorías</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {(p.materiasPrimas || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {p.materiasPrimas.map((m) => (
                        <span key={m.id_materia_prima} className="text-[11px] bg-background border border-border px-2 py-0.5 rounded-pill">
                          {m.nombre}{m.ProductoMateriaPrima ? ` ×${m.ProductoMateriaPrima.cantidad}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-danger">Sin receta</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <ul className="space-y-1">
                    {(opciones[p.id_producto] || []).map((o) => (
                      <li key={o.id_opcional} className="flex gap-2 items-center text-xs">
                        <span className="font-medium">{o.nombre}</span>
                        <span className="text-text-soft">${parseFloat(o.precio).toFixed(2)}</span>
                        <button onClick={()=>handleOpcEdit(o)} className="text-[11px] border border-border px-2 py-0.5 rounded-pill">✎</button>
                        <button onClick={()=>handleOpcDelete(o.id_opcional)} className="text-[11px] bg-red-50 text-danger px-2 py-0.5 rounded-pill">x</button>
                      </li>
                    ))}
                    {(opciones[p.id_producto] || []).length === 0 && <li className="text-xs text-text-soft">Sin opcionales</li>}
                  </ul>
                </td>
                <td className="px-4 py-2 text-center space-x-2">
                  <button onClick={()=>handleEdit(p)} className="text-xs border border-border px-3 py-1 rounded-pill hover:border-primary">Modificar</button>
                  <button onClick={()=>handleDelete(p.id_producto)} className="text-xs bg-danger text-white px-3 py-1 rounded-pill hover:bg-red-700">Baja</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-5 space-y-4">
        <div>
          <h3 className="font-semibold">Disponibilidad por sucursal</h3>
          <p className="text-xs text-text-soft">El stock se deriva de la receta. Cargá insumos en <Link to="/admin/materias-primas" className="text-primary underline">Materias primas</Link>.</p>
        </div>
        <label className="text-sm flex items-center gap-2">
          Sucursal
          <select value={sucursalVista} onChange={(e)=>setSucursalVista(e.target.value)} className="border border-border rounded-md px-3 py-1.5">
            <option value="">— sin sucursal —</option>
            {sucursales.map((s)=><option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>)}
          </select>
        </label>
        {!sucursalVista ? (
          <p className="text-sm text-text-soft">Elegí una sucursal para ver la disponibilidad.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border text-text-soft">
                <tr>
                  <th className="text-left px-4 py-2">#</th>
                  <th className="text-left px-4 py-2">Producto</th>
                  <th className="text-left px-4 py-2">Estado</th>
                  <th className="text-left px-4 py-2">Disponible</th>
                </tr>
              </thead>
              <tbody>
                {disponibilidad.map((p) => (
                  <tr key={p.id_producto} className="border-b border-border align-top">
                    <td className="px-4 py-2 font-bold text-primary">#{p.id_producto}</td>
                    <td className="px-4 py-2">{p.nombre}</td>
                    <td className="px-4 py-2 text-text-soft">{p.estado}</td>
                    <td className="px-4 py-2">
                      {(p.materiasPrimas || []).length === 0 ? (
                        <span className="text-xs text-danger">Sin receta</span>
                      ) : (
                        <span className={`font-bold ${(p.stock ?? 0) > 0 ? "text-success" : "text-danger"}`}>{p.stock ?? 0}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {disponibilidad.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-text-soft">No hay productos</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-border p-5 space-y-4">
        <h3 className="font-semibold">{editingOpcId ? `Modificar opcional #${editingOpcId}` : "Agregar opcional a producto"}</h3>
        <p className="text-xs text-text-soft">El cliente los verá como checkboxes en el producto y se suman al precio. Observaciones siguen en campo libre.</p>
        <form onSubmit={handleOpcSubmit} className="space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <label className="text-sm">Producto*
              <select value={opcForm.id_producto} onChange={(e)=>setOpcForm({...opcForm,id_producto:e.target.value})} required className="w-full border border-border rounded-md px-3 py-2 mt-1">
                <option value="">-- elige --</option>
                {productos.map((p)=><option key={p.id_producto} value={p.id_producto}>{p.nombre} (#{p.id_producto})</option>)}
              </select>
            </label>
            <label className="text-sm">Nombre*<input value={opcForm.nombre} onChange={(e)=>setOpcForm({...opcForm,nombre:e.target.value})} required placeholder="Extra queso" className="w-full border border-border rounded-md px-3 py-2 mt-1" /></label>
            <label className="text-sm">Precio extra<input type="number" step="0.01" value={opcForm.precio} onChange={(e)=>setOpcForm({...opcForm,precio:e.target.value})} placeholder="0" className="w-full border border-border rounded-md px-3 py-2 mt-1" /></label>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="text-sm">Descripción<input value={opcForm.descripcion} onChange={(e)=>setOpcForm({...opcForm,descripcion:e.target.value})} className="w-full border border-border rounded-md px-3 py-2 mt-1" /></label>
            <label className="text-sm">Estado
              <select value={opcForm.estado} onChange={(e)=>setOpcForm({...opcForm,estado:e.target.value})} className="w-full border border-border rounded-md px-3 py-2 mt-1">
                <option value="disponible">disponible</option>
                <option value="no_disponible">no_disponible</option>
              </select>
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-accent hover:bg-amber-600 text-white px-6 py-2 rounded-pill font-semibold">{editingOpcId ? "Guardar opcional" : "Agregar opcional"}</button>
            {editingOpcId && <button type="button" onClick={()=>{setEditingOpcId(null); setOpcForm({id_producto:"",nombre:"",descripcion:"",precio:"",estado:"disponible"})}} className="border border-border bg-white px-6 py-2 rounded-pill">Cancelar</button>}
          </div>
        </form>
        {opcMsg && <p className={`text-sm p-2 rounded-md border ${opcMsg.startsWith("Error") ? "bg-red-50 text-danger border-red-200" : "bg-green-50 text-success border-green-200"}`}>{opcMsg}</p>}
        <p className="text-xs text-text-soft">Endpoints: <code className="bg-background border border-border px-1 rounded-sm">POST /api/productos/:id/opcionales</code> <code className="bg-background border border-border px-1 rounded-sm">PUT /api/opcionales/:id</code> <code className="bg-background border border-border px-1 rounded-sm">DELETE /api/opcionales/:id</code></p>
      </div>
    </div>
  );
}
