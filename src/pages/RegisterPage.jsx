import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerCliente } from "../services/clienteService.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { loginAsCliente } = useAuth();
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    tipo_doc: "DNI",
    dni: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (form.password !== form.confirmPassword) {
      return setMsg("Error: las contraseñas no coinciden");
    }
    setSaving(true);
    try {
      const { confirmPassword: _omit, ...payload } = form;
      const cliente = await registerCliente({
        ...payload,
        tipo_doc: payload.tipo_doc || undefined,
        dni: payload.dni || undefined,
      });
      loginAsCliente(cliente);
      navigate("/catalogo");
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <h1 className="text-3xl font-extrabold text-center text-text">Crear cuenta</h1>
        <p className="text-center text-text-soft mt-2">
          Registrate como cliente para comprar. ¿Ya tenés cuenta?{" "}
          <Link to="/" className="text-primary underline font-medium">
            Elegí tu usuario
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 mt-6 space-y-4">
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
              Tipo doc
              <input name="tipo_doc" value={form.tipo_doc} onChange={handleChange} placeholder="DNI" className="w-full border border-border rounded-md px-3 py-2 mt-1" />
            </label>
            <label className="text-sm">
              DNI
              <input name="dni" value={form.dni} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
            </label>
          </div>
          <label className="text-sm block">
            Email*
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm">
              Contraseña* (mín. 6)
              <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
            </label>
            <label className="text-sm">
              Repetir contraseña*
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required minLength={6} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
            </label>
          </div>

          {msg && (
            <p className="text-sm p-2 rounded-md border bg-red-50 text-danger border-red-200">{msg}</p>
          )}

          <button type="submit" disabled={saving} className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-pill font-semibold disabled:opacity-50">
            {saving ? "Registrando..." : "Registrarme"}
          </button>
          <p className="text-xs text-text-soft text-center">POST /api/clientes</p>
        </form>
      </div>
    </div>
  );
}
