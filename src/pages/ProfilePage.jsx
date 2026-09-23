import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getClienteById, updateCliente } from "../services/clienteService.js";

export default function ProfilePage() {
  const { user, loginAsCliente } = useAuth();
  const [form, setForm] = useState({ nombre: "", apellido: "", tipo_doc: "", dni: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user || user.rol !== "CLIENTE") { setLoading(false); return; }
    getClienteById(user.id_cliente).then((c) => {
      setForm({ nombre: c.nombre, apellido: c.apellido, tipo_doc: c.tipo_doc || "", dni: c.dni || "", email: c.email });
    }).catch((e) => setMsg(e.message)).finally(() => setLoading(false));
  }, [user]);

  if (!user) return <p className="p-8 text-center">Debes <Link to="/" className="text-primary underline">elegir un usuario</Link></p>;
  if (user.rol !== "CLIENTE") return <p className="p-8 text-center text-text-soft">El perfil es solo para clientes. Estás como <b>{user.rol}</b>.</p>;
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando perfil...</p>;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const actualizado = await updateCliente(user.id_cliente, form);
      loginAsCliente(actualizado);
      setMsg("Datos actualizados correctamente");
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-extrabold">Mi perfil — #{user.id_cliente}</h1>
      <p className="text-sm text-text-soft mb-6">Modifica tus datos y guarda</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">Nombre<input name="nombre" value={form.nombre} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" /></label>
          <label className="text-sm">Apellido<input name="apellido" value={form.apellido} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" /></label>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">Tipo doc<input name="tipo_doc" value={form.tipo_doc} onChange={handleChange} placeholder="DNI" className="w-full border border-border rounded-md px-3 py-2 mt-1" /></label>
          <label className="text-sm">DNI<input name="dni" value={form.dni} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 mt-1" /></label>
        </div>
        <label className="text-sm block">Email<input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" /></label>

        {msg && <p className={`text-sm p-2 rounded-md border ${msg.startsWith("Error") ? "bg-red-50 text-danger border-red-200" : "bg-green-50 text-success border-green-200"}`}>{msg}</p>}

        <div className="flex gap-3">
          <Link to="/catalogo" className="flex-1 text-center border border-border bg-white py-2.5 rounded-pill font-semibold">Cancelar</Link>
          <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-pill font-semibold disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
        <p className="text-xs text-text-soft text-center">PUT /api/clientes/:id</p>
      </form>
    </div>
  );
}
