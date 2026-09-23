import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getClientes } from "../services/clienteService.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function UserSelectionPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { loginAsCliente, loginAsAdmin, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getClientes().then(setClientes).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const handleCliente = (c) => {
    loginAsCliente(c);
    navigate("/catalogo");
  };

  const handleAdmin = () => {
    loginAsAdmin();
    navigate("/empleados/pedidos");
  };

  if (loading) return <p className="p-8 text-center text-text-soft">Cargando usuarios...</p>;
  if (error) return <p className="p-8 text-center text-danger">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl font-extrabold text-center text-text">Elige tu usuario</h1>
        <p className="text-center text-text-soft mt-2">Selecciona con qué perfil quieres navegar. Podés cambiarlo desde el menú.</p>
        {user && (
          <p className="text-center text-sm mt-3 bg-white border border-border rounded-pill px-4 py-2 mx-auto w-fit">
            Sesión actual: <span className="font-bold text-primary">{user.nombre} {user.apellido}</span> ({user.rol})
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-4 mt-8">
          {clientes.slice(0,3).map((c) => (
            <button
              key={c.id_cliente}
              onClick={() => handleCliente(c)}
              className="bg-white rounded-lg border border-border p-5 text-left hover:border-primary hover:shadow-md transition"
            >
              <div className="w-12 h-12 bg-primary text-white rounded-pill flex items-center justify-center font-bold text-lg">
                {c.nombre[0]}{c.apellido[0]}
              </div>
              <h3 className="font-semibold mt-3">{c.nombre} {c.apellido}</h3>
              <p className="text-sm text-text-soft">{c.email}</p>
              <p className="text-xs text-text-soft mt-1">DNI {c.dni} — Cliente #{c.id_cliente}</p>
              <span className="inline-block mt-3 text-xs font-semibold bg-background border border-border px-3 py-1 rounded-pill">Entrar como cliente → Catálogo</span>
            </button>
          ))}

          <button
            onClick={handleAdmin}
            className="bg-white rounded-lg border-2 border-accent p-5 text-left hover:shadow-md transition md:col-span-2"
          >
            <div className="w-12 h-12 bg-accent text-white rounded-pill flex items-center justify-center font-bold">A</div>
            <h3 className="font-semibold mt-3">Administrador</h3>
            <p className="text-sm text-text-soft">admin@altoque.com — Acceso total</p>
            <p className="text-xs text-text-soft mt-1">Puede gestionar productos y ver todos los pedidos en /empleados/pedidos</p>
            <span className="inline-block mt-3 text-xs font-semibold bg-accent text-white px-3 py-1 rounded-pill">Entrar como admin → Pedidos empleados</span>
          </button>
        </div>

        <div className="bg-white rounded-lg border border-border p-5 mt-6 text-center">
          <p className="text-sm text-text-soft">¿No tenés cuenta?</p>
          <button onClick={() => navigate("/registro")} className="mt-2 bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-pill font-semibold text-sm">
            Registrarme como cliente
          </button>
        </div>

        <div className="flex gap-3 justify-center mt-6">
          <button onClick={() => navigate("/catalogo")} className="text-sm text-primary hover:underline">Ir al catálogo sin seleccionar</button>
        </div>
      </div>
    </div>
  );
}
