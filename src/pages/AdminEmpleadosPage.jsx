import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getEmpleados,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
} from "../services/empleadoService.js";
import { getSucursales } from "../services/sucursalService.js";

const ROLES = ["ADMIN", "EMPLEADO", "REPARTIDOR"];

const emptyForm = {
  nombre: "",
  apellido: "",
  rol: "EMPLEADO",
  email: "",
  password: "",
  id_sucursal: "",
};

export default function AdminEmpleadosPage() {
  const { isAdmin } = useAuth();
  const [empleados, setEmpleados] = useState([]);
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
      const [emps, sucs] = await Promise.all([getEmpleados(), getSucursales()]);
      setEmpleados(emps);
      setSucursales(sucs);
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
        Acceso denegado — Solo administrador puede gestionar empleados.{" "}
        <Link to="/" className="text-primary underline">
          Elegir usuario
        </Link>
      </p>
    );
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando empleados...</p>;
  if (error) return <p className="p-8 text-center text-danger">{error}</p>;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toPayload = () => {
    const payload = {
      nombre: form.nombre,
      apellido: form.apellido,
      rol: form.rol,
      email: form.email || null,
      id_sucursal: form.id_sucursal ? parseInt(form.id_sucursal, 10) : null,
    };
    if (!editingId || form.password) payload.password = form.password;
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!form.nombre || !form.apellido) {
      return setMsg("Error: nombre y apellido son obligatorios");
    }
    if (!editingId && !form.password) {
      return setMsg("Error: la contraseña es obligatoria");
    }
    try {
      if (editingId) {
        await updateEmpleado(editingId, toPayload());
        setMsg("Empleado modificado");
      } else {
        await createEmpleado(toPayload());
        setMsg("Empleado dado de alta");
      }
      setForm(emptyForm);
      setEditingId(null);
      fetch();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleEdit = (t) => {
    setEditingId(t.id_empleado);
    setForm({
      nombre: t.nombre || "",
      apellido: t.apellido || "",
      rol: t.rol || "EMPLEADO",
      email: t.email || "",
      password: "",
      id_sucursal: t.id_sucursal ? String(t.id_sucursal) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar empleado?")) return;
    try {
      await deleteEmpleado(id);
      setMsg("Empleado eliminado");
      fetch();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-extrabold">Gestión de empleados — Admin</h1>
      <p className="text-sm text-text-soft">
        Alta, baja y modificación via POST / PUT / DELETE /api/empleados
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-5 space-y-4">
        <h3 className="font-semibold">{editingId ? `Modificar #${editingId}` : "Alta de empleado"}</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">
            Nombre*
            <input name="nombre" value={form.nombre} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">
            Apellido*
            <input name="apellido" value={form.apellido} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">
            Rol*
            <select name="rol" value={form.rol} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 mt-1">
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Sucursal
            <select name="id_sucursal" value={form.id_sucursal} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 mt-1">
              <option value="">— Sin asignar —</option>
              {sucursales.map((s) => (
                <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">
            Contraseña{editingId ? " (vacía = no cambiar)" : "* (mín. 6)"}
            <input name="password" type="password" value={form.password} onChange={handleChange} required={!editingId} minLength={editingId ? undefined : 6} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
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
          <span className="font-bold text-sm">Empleados ({empleados.length})</span>
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
          {empleados.map((t) => (
            <div key={t.id_empleado} className="rounded-md border border-border p-4 space-y-2 bg-white">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="font-bold text-primary text-sm">#{t.id_empleado}</span>
                  <p className="font-semibold">{t.nombre} {t.apellido}</p>
                </div>
                <span className="text-xs bg-background border border-border px-2 py-0.5 rounded-pill shrink-0">{t.rol}</span>
              </div>
              <p className="text-sm text-text-soft">{t.email || "Sin email"}</p>
              <p className="text-sm text-text-soft">Sucursal: {t.sucursal?.nombre || "—"}</p>
              <div className="flex gap-2 border-t border-border pt-3">
                <button onClick={() => handleEdit(t)} className="flex-1 text-xs border border-border px-3 py-1.5 rounded-pill hover:border-primary">
                  Modificar
                </button>
                <button onClick={() => handleDelete(t.id_empleado)} className="flex-1 text-xs bg-danger text-white px-3 py-1.5 rounded-pill hover:bg-red-700">
                  Baja
                </button>
              </div>
            </div>
          ))}
          {empleados.length === 0 && (
            <p className="text-sm text-text-soft text-center">No hay empleados</p>
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
                <th className="text-left px-4 py-2">Rol</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Sucursal</th>
                <th className="text-center px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map((t) => (
                <tr key={t.id_empleado} className="border-b border-border align-top">
                  <td className="px-4 py-2 font-bold text-primary">#{t.id_empleado}</td>
                  <td className="px-4 py-2">{t.nombre} {t.apellido}</td>
                  <td className="px-4 py-2">{t.rol}</td>
                  <td className="px-4 py-2">{t.email || "—"}</td>
                  <td className="px-4 py-2">{t.sucursal?.nombre || "—"}</td>
                  <td className="px-4 py-2 text-center space-x-2 whitespace-nowrap">
                    <button onClick={() => handleEdit(t)} className="text-xs border border-border px-3 py-1 rounded-pill hover:border-primary">
                      Modificar
                    </button>
                    <button onClick={() => handleDelete(t.id_empleado)} className="text-xs bg-danger text-white px-3 py-1 rounded-pill hover:bg-red-700">
                      Baja
                    </button>
                  </td>
                </tr>
              ))}
              {empleados.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-soft">
                    No hay empleados
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
