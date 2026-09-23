import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import isotipo from "./assets/isotipo.svg";
import { CartProvider, useCart } from "./context/CartContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import CatalogPage from "./pages/CatalogPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import EmployeeOrdersPage from "./pages/EmployeeOrdersPage.jsx";
import EmployeeOrderDetailPage from "./pages/EmployeeOrderDetailPage.jsx";
import UserSelectionPage from "./pages/UserSelectionPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ClientHistoryPage from "./pages/ClientHistoryPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import AdminProductsPage from "./pages/AdminProductsPage.jsx";
import AdminSucursalesPage from "./pages/AdminSucursalesPage.jsx";
import AdminCategoriasPage from "./pages/AdminCategoriasPage.jsx";
import AdminReportesPage from "./pages/AdminReportesPage.jsx";
import AdminPromocionesPage from "./pages/AdminPromocionesPage.jsx";

function Navbar() {
  const { count } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSalir = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const links =
    user?.rol === "CLIENTE"
      ? [
          { to: "/catalogo", label: "Catálogo" },
          { to: "/carrito", label: "Carrito", cart: true },
          { to: "/mis-pedidos", label: "Mis pedidos" },
          { to: "/perfil", label: "Perfil" },
        ]
      : user?.rol === "ADMIN"
        ? [
            { to: "/empleados/pedidos", label: "Pedidos" },
            { to: "/admin/productos", label: "Productos" },
            { to: "/admin/categorias", label: "Categorías" },
            { to: "/admin/sucursales", label: "Sucursales" },
            { to: "/admin/reportes", label: "Reportes" },
            { to: "/admin/promociones", label: "Promociones" },
            { to: "/catalogo", label: "Catálogo" },
          ]
        : [
            { to: "/catalogo", label: "Catálogo" },
            { to: "/carrito", label: "Carrito" },
          ];

  return (
    <nav className="bg-[#241C18] border-b border-[#241C18] sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center text-[#FEFCFB]">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl text-[#F8A426]" onClick={() => setOpen(false)}>
          <img src={isotipo} alt="BAJON" className="w-8 h-8 object-contain" />
          BAJON
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex gap-4 items-center text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={l.cart
                ? "font-semibold bg-danger text-white px-3 py-1.5 rounded-pill hover:bg-red-700"
                : "font-medium hover:text-[#F8A426]"}
            >
              {l.label}
              {l.cart && count > 0 && <span className="bg-white text-danger text-xs px-2 py-0.5 rounded-pill ml-1">{count}</span>}
            </Link>
          ))}
          <span className="text-xs bg-white/10 border border-white/20 px-2 py-1 rounded-pill">
            {user ? `${user.nombre} (${user.rol})` : "Sin usuario"}
          </span>
          {user ? (
            <button onClick={handleSalir} className="text-xs border border-white/30 px-3 py-1 rounded-pill hover:bg-white/10">Salir</button>
          ) : (
            <Link to="/" className="text-xs bg-primary text-white px-3 py-1 rounded-pill">Elegir usuario</Link>
          )}
        </div>

        {/* Hamburguesa (mobile, a la derecha) */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 border border-white/30 rounded-md hover:bg-white/10"
        >
          <span className={`block w-5 h-0.5 bg-[#FEFCFB] transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`block w-5 h-0.5 bg-[#FEFCFB] transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-[#FEFCFB] transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>
      </div>

      {/* Panel mobile */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#241C18] text-[#FEFCFB] px-4 py-3 space-y-1 shadow-lg">
          <p className="text-xs bg-white/10 border border-white/20 px-2 py-1 rounded-pill w-fit mb-2">
            {user ? `${user.nombre} (${user.rol})` : "Sin usuario"}
          </p>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="flex justify-between items-center px-2 py-2.5 rounded-md text-sm font-medium hover:bg-white/10 hover:text-[#F8A426]"
            >
              {l.label}
              {l.cart && count > 0 && <span className="bg-danger text-white text-xs px-2 py-0.5 rounded-pill">{count}</span>}
            </Link>
          ))}
          {user ? (
            <button onClick={handleSalir} className="w-full text-left px-2 py-2.5 rounded-md text-sm font-medium text-danger hover:bg-white/10">
              Salir
            </button>
          ) : (
            <Link to="/" onClick={() => setOpen(false)} className="block px-2 py-2.5 rounded-md text-sm font-semibold bg-primary text-white text-center">
              Elegir usuario
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

function RequireAdmin({ children }) {
  const { isAdmin, user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <div className="p-8 text-center text-danger">Acceso denegado — Solo administrador puede ver /empleados/pedidos. <Link to="/" className="text-primary underline">Elegir usuario</Link></div>;
  return children;
}

function RequireCliente({ children }) {
  const { isCliente, user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (!isCliente) return <div className="p-8 text-center text-text-soft">Solo clientes pueden ver esta página. <Link to="/" className="text-primary underline">Cambiar usuario</Link></div>;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-background">
            <Navbar />
            <Routes>
              <Route path="/" element={<UserSelectionPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/catalogo" element={<CatalogPage />} />
              <Route path="/carrito" element={<CartPage />} />
              <Route path="/mis-pedidos" element={<RequireCliente><ClientHistoryPage /></RequireCliente>} />
              <Route path="/perfil" element={<RequireCliente><ProfilePage /></RequireCliente>} />
              <Route path="/admin/productos" element={<RequireAdmin><AdminProductsPage /></RequireAdmin>} />
              <Route path="/admin/categorias" element={<RequireAdmin><AdminCategoriasPage /></RequireAdmin>} />
              <Route path="/admin/sucursales" element={<RequireAdmin><AdminSucursalesPage /></RequireAdmin>} />
              <Route path="/admin/reportes" element={<RequireAdmin><AdminReportesPage /></RequireAdmin>} />
              <Route path="/admin/promociones" element={<RequireAdmin><AdminPromocionesPage /></RequireAdmin>} />
              <Route path="/empleados/pedidos" element={<RequireAdmin><EmployeeOrdersPage /></RequireAdmin>} />
              <Route path="/empleados/pedidos/:id" element={<RequireAdmin><EmployeeOrderDetailPage /></RequireAdmin>} />
              <Route path="*" element={<div className="p-8 text-center">404 - No encontrado</div>} />
            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
