import { useEffect, useState } from "react";
import { apiFetch } from "../services/api.js";
import { getProductos } from "../services/productService.js";
import { getOpcionalesByProducto, createOpcional, updateOpcional, deleteOpcional } from "../services/opcionalService.js";
import { getCategorias } from "../services/categoriaService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";

export default function AdminProductsPage() {
  const { isAdmin } = useAuth();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ nombre: "", descripcion: "", precio: "", imagen: "", estado: "disponible" });
  const [formCategorias, setFormCategorias] = useState([]);
  const [todasCategorias, setTodasCategorias] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");

  // Opcionales admin
  const [opciones, setOpciones] = useState({}); // {id_producto: [opcionales]}
  const [opcForm, setOpcForm] = useState({ id_producto: "", nombre: "", descripcion: "", precio: "", estado: "disponible" });
  const [editingOpcId, setEditingOpcId] = useState(null);
  const [opcMsg, setOpcMsg] = useState("");
  const [listaAbierta, setListaAbierta] = useState(false);

  const resetForm = () => {
    setForm({ nombre: "", descripcion: "", precio: "", imagen: "", estado: "disponible" });
    setFormCategorias([]);
    setEditingId(null);
  };

  const toggleFormCategoria = (id) => {
    setFormCategorias((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const fetch = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([getProductos(), getCategorias()]);
      setProductos(prods);
      setTodasCategorias(cats);
      // cargar opcionales por producto
      const map = {};
      for (const p of prods) {
        try { map[p.id_producto] = await getOpcionalesByProducto(p.id_producto); } catch { map[p.id_producto] = []; }
      }
      setOpciones(map);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { if (isAdmin) fetch(); }, [isAdmin]);

  if (!isAdmin) return <p className="p-8 text-center text-danger">Acceso denegado — Solo administrador puede gestionar productos. <Link to="/" className="text-primary underline">Elegir usuario</Link></p>;
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando productos...</p>;
  if (error) return <p className="p-8 text-center text-danger">{error}</p>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      const payload = { ...form, precio: parseFloat(form.precio), categorias: formCategorias };
      if (editingId) {
        await apiFetch(`/productos/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
        setMsg("Producto modificado");
      } else {
        await apiFetch("/productos", { method: "POST", body: JSON.stringify(payload) });
        setMsg("Producto dado de alta");
      }
      resetForm();
      fetch();
    } catch (err) { setMsg(`Error: ${err.message}`); }
  };

  const handleEdit = (p) => {
    setEditingId(p.id_producto);
    setForm({ nombre: p.nombre, descripcion: p.descripcion || "", precio: p.precio, imagen: p.imagen || "", estado: p.estado });
    setFormCategorias((p.categorias || []).map((c) => c.id_categoria));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar producto?")) return;
    try {
      await apiFetch(`/productos/${id}`, { method: "DELETE" });
      setMsg("Producto eliminado");
      fetch();
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
      fetch();
    } catch (err) { setOpcMsg(`Error: ${err.message}`); }
  };

  const handleOpcEdit = (o) => {
    setEditingOpcId(o.id_opcional);
    setOpcForm({ id_producto: o.id_producto, nombre: o.nombre, descripcion: o.descripcion || "", precio: o.precio, estado: o.estado });
  };

  const handleOpcDelete = async (id) => {
    if (!confirm("¿Eliminar opcional?")) return;
    try { await deleteOpcional(id); setOpcMsg("Opcional eliminado"); fetch(); } catch (err) { setOpcMsg(`Error: ${err.message}`); }
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
            <tr><th className="text-left px-4 py-2">#</th><th className="text-left px-4 py-2">Nombre</th><th className="text-left px-4 py-2">Precio</th><th className="text-left px-4 py-2">Estado</th><th className="text-left px-4 py-2">Categorías</th><th className="text-left px-4 py-2">Opcionales</th><th className="text-center px-4 py-2">Acciones</th></tr>
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
