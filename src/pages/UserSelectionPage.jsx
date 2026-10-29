import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const accesosPorRol = ({ isAdmin, isStaff, isCliente }) => {
  if (isAdmin) {
    return [
      { to: "/empleados/pedidos", label: "Pedidos", detalle: "Todos los pedidos y estados" },
      { to: "/admin/productos", label: "Productos", detalle: "Catálogo, recetas y disponibilidad" },
      { to: "/admin/categorias", label: "Categorías", detalle: "Alta, baja y modificación" },
      { to: "/admin/materias-primas", label: "Materias primas", detalle: "Insumos y stock por sucursal" },
      { to: "/admin/sucursales", label: "Sucursales", detalle: "Direcciones, horarios y estado" },
      { to: "/admin/reportes", label: "Reportes", detalle: "Ventas por producto y promoción" },
      { to: "/admin/promociones", label: "Promociones", detalle: "Combos y descuentos" },
      { to: "/admin/banners", label: "Banners", detalle: "Contenido del catálogo" },
      { to: "/admin/empleados", label: "Empleados", detalle: "Usuarios y roles" },
    ];
  }
  if (isStaff) {
    return [
      { to: "/empleados/pedidos", label: "Pedidos", detalle: "Pedidos de tu sucursal" },
      { to: "/admin/productos", label: "Productos", detalle: "Disponibilidad de tu sucursal" },
      { to: "/admin/materias-primas", label: "Materias primas", detalle: "Stock de tu sucursal" },
      { to: "/admin/reportes", label: "Reportes", detalle: "Ventas de tu sucursal" },
    ];
  }
  if (isCliente) {
    return [
      { to: "/catalogo", label: "Catálogo", detalle: "Productos y promociones" },
      { to: "/carrito", label: "Carrito", detalle: "Revisá tu pedido" },
      { to: "/mis-pedidos", label: "Mis pedidos", detalle: "Historial y seguimiento" },
      { to: "/perfil", label: "Mi perfil", detalle: "Datos y direcciones" },
    ];
  }
  return [];
};

export default function UserSelectionPage() {
  const { user, logout, isAdmin, isStaff, isCliente } = useAuth();
  const navigate = useNavigate();

  const handleSalir = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-3xl font-extrabold text-text">Bienvenido a BAJON</h1>
          <p className="text-text-soft mt-2">
            Ingresá con tu cuenta para pedir, o registrate como cliente.
          </p>

          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <button
              onClick={() => navigate("/login")}
              className="bg-primary hover:bg-primary-dark text-white rounded-lg p-6 font-semibold text-lg"
            >
              Iniciar sesión
              <span className="block text-sm font-normal opacity-90 mt-1">Clientes, empleados y administradores</span>
            </button>
            <button
              onClick={() => navigate("/registro")}
              className="bg-white border border-border hover:border-primary rounded-lg p-6 font-semibold text-lg"
            >
              Registrarme
              <span className="block text-sm font-normal text-text-soft mt-1">Crear una cuenta de cliente</span>
            </button>
          </div>

          <button onClick={() => navigate("/catalogo")} className="mt-6 text-sm text-primary hover:underline">
            Ver catálogo sin iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  const accesos = accesosPorRol({ isAdmin, isStaff, isCliente });

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="bg-white border border-border rounded-lg p-5 flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="text-sm text-text-soft">Sesión actual</p>
            <h1 className="text-xl font-extrabold">
              {user.nombre} {user.apellido}
            </h1>
            <p className="text-sm text-text-soft">
              {user.email} · <span className="font-semibold text-primary">{user.rol}</span>
              {user.id_sucursal ? ` · Sucursal #${user.id_sucursal}` : ""}
            </p>
          </div>
          <button
            onClick={handleSalir}
            className="border border-border bg-white px-4 py-2 rounded-pill text-sm font-semibold hover:border-danger hover:text-danger"
          >
            Cerrar sesión
          </button>
        </div>

        <h2 className="text-lg font-extrabold mt-6 mb-3">¿Qué querés hacer?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accesos.map((a) => (
            <button
              key={a.to}
              onClick={() => navigate(a.to)}
              className="bg-white border border-border rounded-lg p-5 text-left hover:border-primary hover:shadow-md transition"
            >
              <h3 className="font-semibold">{a.label}</h3>
              <p className="text-sm text-text-soft mt-1">{a.detalle}</p>
              <span className="inline-block mt-3 text-xs font-semibold bg-background border border-border px-3 py-1 rounded-pill">
                Ir a {a.label} →
              </span>
            </button>
          ))}
        </div>

        <button onClick={() => navigate("/catalogo")} className="mt-6 text-sm text-primary hover:underline">
          Ir al catálogo
        </button>
      </div>
    </div>
  );
}
