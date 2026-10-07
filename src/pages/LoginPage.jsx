import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const destinoSegunRol = (usuario) =>
  usuario?.rol === "ADMIN" || usuario?.rol === "EMPLEADO" ? "/empleados/pedidos" : "/catalogo";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [ingresando, setIngresando] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setIngresando(true);
    try {
      const usuario = await login(form.email, form.password);
      navigate(destinoSegunRol(usuario));
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setIngresando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <h1 className="text-3xl font-extrabold text-center text-text">Iniciar sesión</h1>
        <p className="text-center text-text-soft mt-2">
          Ingresá con tu email y contraseña. ¿No tenés cuenta?{" "}
          <Link to="/registro" className="text-primary underline font-medium">
            Registrate
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 mt-6 space-y-4">
          <label className="text-sm block">
            Email*
            <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm block">
            Contraseña*
            <input name="password" type="password" value={form.password} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>

          {msg && (
            <p className="text-sm p-2 rounded-md border bg-red-50 text-danger border-red-200">{msg}</p>
          )}

          <button type="submit" disabled={ingresando} className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-pill font-semibold disabled:opacity-50">
            {ingresando ? "Ingresando..." : "Ingresar"}
          </button>
          <p className="text-xs text-text-soft text-center">POST /api/auth/login</p>
        </form>
      </div>
    </div>
  );
}
