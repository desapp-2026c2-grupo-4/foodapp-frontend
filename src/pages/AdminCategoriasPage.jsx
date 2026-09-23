import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from "../services/categoriaService.js";

export default function AdminCategoriasPage() {
  const { isAdmin } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");

  const fetch = async () => {
    setLoading(true);
    try {
      setCategorias(await getCategorias());
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
        Acceso denegado — Solo administrador puede gestionar categorías.{" "}
        <Link to="/" className="text-primary underline">
          Elegir usuario
        </Link>
      </p>
    );
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando categorías...</p>;
  if (error) return <p className="p-8 text-center text-danger">{error}</p>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!nombre.trim()) return setMsg("Error: el nombre es obligatorio");
    try {
      if (editingId) {
        await updateCategoria(editingId, { nombre: nombre.trim() });
        setMsg("Categoría modificada");
      } else {
        await createCategoria({ nombre: nombre.trim() });
        setMsg("Categoría dada de alta");
      }
      setNombre("");
      setEditingId(null);
      fetch();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleEdit = (c) => {
    setEditingId(c.id_categoria);
    setNombre(c.nombre);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar categoría? Se desvinculará de sus productos.")) return;
    try {
      await deleteCategoria(id);
      setMsg("Categoría eliminada");
      fetch();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold">Gestión de categorías — Admin</h1>
          <p className="text-sm text-text-soft">Alta, baja y modificación via POST / PUT / DELETE /api/categorias</p>
        </div>
        <Link to="/admin/productos" className="text-sm text-primary hover:underline shrink-0">
          → Asignar a productos
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-5 space-y-4">
        <h3 className="font-semibold">{editingId ? `Modificar #${editingId}` : "Alta de categoría"}</h3>
        <label className="text-sm block">
          Nombre*
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Ej. Postres"
            className="w-full border border-border rounded-md px-3 py-2 mt-1"
          />
        </label>
        <div className="flex gap-3">
          <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-pill font-semibold">
            {editingId ? "Guardar" : "Crear"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setNombre("");
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
        <table className="w-full text-sm">
          <thead className="bg-background border-b border-border text-text-soft">
            <tr>
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">Nombre</th>
              <th className="text-left px-4 py-2">Productos</th>
              <th className="text-center px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id_categoria} className="border-b border-border align-top">
                <td className="px-4 py-2 font-bold text-primary">#{c.id_categoria}</td>
                <td className="px-4 py-2 font-medium">{c.nombre}</td>
                <td className="px-4 py-2 text-text-soft">
                  {(c.productos || []).length > 0
                    ? c.productos.map((p) => p.nombre).join(", ")
                    : "Sin productos"}
                </td>
                <td className="px-4 py-2 text-center space-x-2 whitespace-nowrap">
                  <button onClick={() => handleEdit(c)} className="text-xs border border-border px-3 py-1 rounded-pill hover:border-primary">
                    Modificar
                  </button>
                  <button onClick={() => handleDelete(c.id_categoria)} className="text-xs bg-danger text-white px-3 py-1 rounded-pill hover:bg-red-700">
                    Baja
                  </button>
                </td>
              </tr>
            ))}
            {categorias.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-text-soft">
                  No hay categorías
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
