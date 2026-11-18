import { useState } from "react";
import { Link } from "react-router-dom";
import { recuperarPassword, restablecerPassword } from "../services/authService.js";

export default function ForgotPasswordPage() {
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState({
    email: "",
    dni: "",
    passwordNueva: "",
    passwordConfirm: "",
  });
  const [resetToken, setResetToken] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [listo, setListo] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleVerificar = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const data = await recuperarPassword({ email: form.email, dni: form.dni });
      setResetToken(data.resetToken);
      setPaso(2);
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestablecer = async (e) => {
    e.preventDefault();
    setMsg("");
    if (form.passwordNueva !== form.passwordConfirm) {
      return setMsg("Error: la nueva contraseña y su confirmación no coinciden");
    }
    if (form.passwordNueva.length < 6) {
      return setMsg("Error: la nueva contraseña debe tener al menos 6 caracteres");
    }
    setLoading(true);
    try {
      await restablecerPassword({
        resetToken,
        passwordNueva: form.passwordNueva,
      });
      setListo(true);
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const volverAlPrimerPaso = () => {
    setPaso(1);
    setResetToken("");
    setMsg("");
    setForm({ ...form, passwordNueva: "", passwordConfirm: "" });
  };

  if (listo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-lg border border-border p-6 space-y-4 text-center">
          <h1 className="text-2xl font-extrabold text-text">Contraseña actualizada</h1>
          <p className="text-sm text-text-soft">Ya podés iniciar sesión con tu nueva contraseña.</p>
          <Link to="/login" className="block w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-pill font-semibold">
            Volver al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <h1 className="text-3xl font-extrabold text-center text-text">Recuperar contraseña</h1>
        <p className="text-center text-text-soft mt-2">
          {paso === 1
            ? "Verificá tu identidad con tu email y DNI."
            : `Ingresá una nueva contraseña para ${form.email}.`}
        </p>

        <form
          onSubmit={paso === 1 ? handleVerificar : handleRestablecer}
          className="bg-white rounded-lg border border-border p-6 mt-6 space-y-4"
        >
          {paso === 1 ? (
            <>
              <label className="text-sm block">
                Email*
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full border border-border rounded-md px-3 py-2 mt-1"
                />
              </label>
              <label className="text-sm block">
                DNI*
                <input
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  required
                  className="w-full border border-border rounded-md px-3 py-2 mt-1"
                />
              </label>
            </>
          ) : (
            <>
              <label className="text-sm block">
                Nueva contraseña* (mín. 6)
                <input
                  name="passwordNueva"
                  type="password"
                  value={form.passwordNueva}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full border border-border rounded-md px-3 py-2 mt-1"
                />
              </label>
              <label className="text-sm block">
                Repetir nueva contraseña*
                <input
                  name="passwordConfirm"
                  type="password"
                  value={form.passwordConfirm}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full border border-border rounded-md px-3 py-2 mt-1"
                />
              </label>
            </>
          )}

          {msg && (
            <p className="text-sm p-2 rounded-md border bg-red-50 text-danger border-red-200">{msg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-pill font-semibold disabled:opacity-50"
          >
            {loading
              ? "Procesando..."
              : paso === 1
                ? "Verificar identidad"
                : "Restablecer contraseña"}
          </button>

          {paso === 2 && (
            <button
              type="button"
              onClick={volverAlPrimerPaso}
              className="w-full border border-border bg-white py-2.5 rounded-pill font-semibold"
            >
              Volver
            </button>
          )}

          <p className="text-xs text-text-soft text-center">
            <Link to="/login" className="text-primary underline font-medium">
              Volver al login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
