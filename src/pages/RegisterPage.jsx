import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import DireccionPicker from "../components/DireccionPicker.jsx";
import { createDireccion } from "../services/direccionService.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
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
  const [direccion, setDireccion] = useState(null);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  useEffect(() => {
    if (!registroExitoso) return;
    const timer = setTimeout(() => navigate("/catalogo", { replace: true }), 1800);
    return () => clearTimeout(timer);
  }, [registroExitoso, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const direccionValida = (d) =>
    d && d.latitud !== undefined && d.calle && d.altura && d.ciudad && d.provincia;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (form.password !== form.confirmPassword) {
      return setMsg("Error: las contraseñas no coinciden");
    }
    if (!direccionValida(direccion)) {
      return setMsg("Error: ubicá tu dirección en el mapa (calle, altura, ciudad y provincia)");
    }
    setSaving(true);
    try {
      const { confirmPassword: _omit, ...payload } = form;
      // El backend siempre crea CLIENTE, sin importar qué se envíe
      const usuario = await register({
        ...payload,
        tipo_doc: payload.tipo_doc || undefined,
      });
      await createDireccion(usuario.id_cliente, {
        calle: direccion.calle,
        altura: direccion.altura,
        piso: direccion.piso || undefined,
        departamento: direccion.departamento || undefined,
        ciudad: direccion.ciudad,
        provincia: direccion.provincia,
        codigo_postal: direccion.codigo_postal || undefined,
        latitud: direccion.latitud,
        longitud: direccion.longitud,
      });
      setRegistroExitoso(true);
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {registroExitoso && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md pointer-events-none"
        >
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-white px-4 py-3 shadow-lg">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-lg font-bold text-success">✓</span>
            <div>
              <p className="font-bold text-text">¡Registro exitoso!</p>
              <p className="text-sm text-text-soft">Te redirigimos al catálogo...</p>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-xl w-full">
        <h1 className="text-3xl font-extrabold text-center text-text">Crear cuenta</h1>
        <p className="text-center text-text-soft mt-2">
          Registrate como cliente para comprar. ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="text-primary underline font-medium">
            Iniciá sesión
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
              DNI*
              <input name="dni" value={form.dni} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
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

          <div className="border-t border-border pt-4">
            <p className="font-semibold text-sm mb-1">Tu dirección*</p>
            <DireccionPicker onChange={setDireccion} />
          </div>

          {msg && (
            <p className="text-sm p-2 rounded-md border bg-red-50 text-danger border-red-200">{msg}</p>
          )}

          <button type="submit" disabled={saving || registroExitoso} className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-pill font-semibold disabled:opacity-50">
            {registroExitoso ? "Registro exitoso" : saving ? "Registrando..." : "Registrarme"}
          </button>
        </form>
      </div>
    </div>
  );
}
