import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";
import isotipo from "./assets/isotipo.svg";
import { CartProvider, useCart } from "./context/CartContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import CatalogPage from "./pages/CatalogPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import EmployeeOrdersPage from "./pages/EmployeeOrdersPage.jsx";
import EmployeeOrderDetailPage from "./pages/EmployeeOrderDetailPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ClientHistoryPage from "./pages/ClientHistoryPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SucursalesPage from "./pages/SucursalesPage.jsx";
import AdminProductsPage from "./pages/AdminProductsPage.jsx";
import AdminSucursalesPage from "./pages/AdminSucursalesPage.jsx";
import AdminCategoriasPage from "./pages/AdminCategoriasPage.jsx";
import AdminMateriasPrimasPage from "./pages/AdminMateriasPrimasPage.jsx";
import AdminReportesPage from "./pages/AdminReportesPage.jsx";
import AdminParametrosPage from "./pages/AdminParametrosPage.jsx";
import AdminPromocionesPage from "./pages/AdminPromocionesPage.jsx";
import AdminBannersPage from "./pages/AdminBannersPage.jsx";
import AdminEmpleadosPage from "./pages/AdminEmpleadosPage.jsx";
import AdminClientesPage from "./pages/AdminClientesPage.jsx";
import AdminClienteDetailPage from "./pages/AdminClienteDetailPage.jsx";
import FloatingCartButton from "./components/FloatingCartButton.jsx";
import { AdminDesktopNav, AdminMobileNav } from "./components/AdminNav.jsx";
import {
  BarChart3,
  BookOpen,
  Boxes,
  CircleUserRound,
  ClipboardList,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Package,
  ReceiptText,
  ShoppingCart,
  User,
  UserPlus,
  X,
} from "lucide-react";

function Navbar() {
  const { count } = useCart();
  const { user, logout, isAdmin, isStaff } = useAuth();
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
          { to: "/catalogo", label: "Catálogo", icon: BookOpen },
          { to: "/sucursales", label: "Sucursales", icon: MapPin },
          { to: "/carrito", label: "Carrito", cart: true, icon: ShoppingCart },
          { to: "/mis-pedidos", label: "Mis pedidos", icon: ReceiptText },
          { to: "/perfil", label: "Perfil", icon: User },
        ]
      : isStaff
        ? [
            { to: "/empleados/pedidos", label: "Pedidos", icon: ClipboardList },
            { to: "/admin/productos", label: "Productos", icon: Package },
            { to: "/admin/materias-primas", label: "Materias primas", icon: Boxes },
            { to: "/admin/reportes", label: "Reportes", icon: BarChart3 },
            { to: "/catalogo", label: "Catálogo", icon: BookOpen },
          ]
        : [
            { to: "/catalogo", label: "Catálogo", icon: BookOpen },
            { to: "/carrito", label: "Carrito", icon: ShoppingCart },
          ];

  return (
    <nav className="bg-[#241C18] border-b border-[#241C18] sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center text-[#FEFCFB]">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl text-[#F8A426]" onClick={() => setOpen(false)}>
          <img src={isotipo} alt="BAJON" className="w-8 h-8 object-contain" />
          BAJON
        </Link>

        {/* Desktop */}
        <div className={`${isAdmin ? "hidden lg:flex" : "hidden md:flex"} gap-4 items-center text-sm`}>
          {isAdmin ? (
            <AdminDesktopNav />
          ) : (
            links.map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={l.cart
                    ? "flex items-center gap-1.5 font-semibold bg-danger text-white px-3 py-1.5 rounded-pill hover:bg-red-700"
                    : "flex items-center gap-1.5 font-medium hover:text-[#F8A426]"}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{l.label}</span>
                  {l.cart && count > 0 && <span className="bg-white text-danger text-xs px-2 py-0.5 rounded-pill ml-1">{count}</span>}
                </Link>
              );
            })
          )}
          <span className="flex items-center gap-1.5 text-xs bg-white/10 border border-white/20 px-2 py-1 rounded-pill">
            <CircleUserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {user ? `${user.nombre} (${user.rol})` : "Sin usuario"}
          </span>
          {user ? (
            <button onClick={handleSalir} className="flex items-center gap-1.5 text-xs border border-white/30 px-3 py-1 rounded-pill hover:bg-white/10">
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Salir
            </button>
          ) : (
            <>
              <Link to="/login" className="flex items-center gap-1.5 text-xs font-medium hover:text-[#F8A426]">
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                Ingresar
              </Link>
              <Link to="/registro" className="flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1 rounded-pill">
                <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                Registrarme
              </Link>
            </>
          )}
        </div>

        {/* Hamburguesa (mobile, a la derecha) */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          className={`${isAdmin ? "lg:hidden" : "md:hidden"} w-10 h-10 flex items-center justify-center border border-white/30 rounded-md hover:bg-white/10`}
        >
          {open ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Panel mobile */}
      {open && (
        <div className={`${isAdmin ? "lg:hidden" : "md:hidden"} border-t border-white/10 bg-[#241C18] text-[#FEFCFB] px-4 py-3 space-y-1 shadow-lg`}>
          <p className="flex items-center gap-1.5 text-xs bg-white/10 border border-white/20 px-2 py-1 rounded-pill w-fit mb-2">
            <CircleUserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {user ? `${user.nombre} (${user.rol})` : "Sin usuario"}
          </p>
          {isAdmin ? (
            <AdminMobileNav onNavigate={() => setOpen(false)} />
          ) : (
            links.map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="flex justify-between items-center px-2 py-2.5 rounded-md text-sm font-medium hover:bg-white/10 hover:text-[#F8A426]"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {l.label}
                  </span>
                  {l.cart && count > 0 && <span className="bg-danger text-white text-xs px-2 py-0.5 rounded-pill">{count}</span>}
                </Link>
              );
            })
          )}
          {user ? (
            <button onClick={handleSalir} className="flex w-full items-center gap-2 text-left px-2 py-2.5 rounded-md text-sm font-medium text-danger hover:bg-white/10">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Salir
            </button>
          ) : (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 px-2 py-2.5 rounded-md text-sm font-semibold bg-primary text-white text-center">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Ingresar
              </Link>
              <Link to="/registro" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 px-2 py-2.5 rounded-md text-sm font-medium text-center hover:bg-white/10">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Registrarme
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

function RequireAdmin({ children }) {
  const { isAdmin, user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <div className="p-8 text-center text-danger">Acceso denegado — Solo administrador puede ver esta página. <Link to="/" className="text-primary underline">Volver al inicio</Link></div>;
  return children;
}

function RequireStaff({ children }) {
  const { isStaff, user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isStaff) return <div className="p-8 text-center text-danger">Acceso denegado — Solo personal autorizado puede ver esta página. <Link to="/" className="text-primary underline">Volver al inicio</Link></div>;
  return children;
}

function RequireCliente({ children }) {
  const { isCliente, user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isCliente) return <div className="p-8 text-center text-text-soft">Solo clientes pueden ver esta página. <Link to="/" className="text-primary underline">Volver al inicio</Link></div>;
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
              <Route path="/" element={<CatalogPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/recuperar-password" element={<ForgotPasswordPage />} />
              <Route path="/catalogo" element={<CatalogPage />} />
              <Route path="/sucursales" element={<RequireCliente><SucursalesPage /></RequireCliente>} />
              <Route path="/carrito" element={<CartPage />} />
              <Route path="/mis-pedidos" element={<RequireCliente><ClientHistoryPage /></RequireCliente>} />
              <Route path="/perfil" element={<RequireCliente><ProfilePage /></RequireCliente>} />
              <Route path="/admin/productos" element={<RequireStaff><AdminProductsPage /></RequireStaff>} />
              <Route path="/admin/categorias" element={<RequireAdmin><AdminCategoriasPage /></RequireAdmin>} />
              <Route path="/admin/materias-primas" element={<RequireStaff><AdminMateriasPrimasPage /></RequireStaff>} />
              <Route path="/admin/sucursales" element={<RequireAdmin><AdminSucursalesPage /></RequireAdmin>} />
              <Route path="/admin/reportes" element={<RequireStaff><AdminReportesPage /></RequireStaff>} />
              <Route path="/admin/promociones" element={<RequireAdmin><AdminPromocionesPage /></RequireAdmin>} />
              <Route path="/admin/banners" element={<RequireAdmin><AdminBannersPage /></RequireAdmin>} />
              <Route path="/admin/clientes" element={<RequireAdmin><AdminClientesPage /></RequireAdmin>} />
              <Route path="/admin/clientes/:id" element={<RequireAdmin><AdminClienteDetailPage /></RequireAdmin>} />
              <Route path="/admin/empleados" element={<RequireAdmin><AdminEmpleadosPage /></RequireAdmin>} />
              <Route path="/admin/parametros" element={<RequireAdmin><AdminParametrosPage /></RequireAdmin>} />
              <Route path="/empleados/pedidos" element={<RequireStaff><EmployeeOrdersPage /></RequireStaff>} />
              <Route path="/empleados/pedidos/:id" element={<RequireStaff><EmployeeOrderDetailPage /></RequireStaff>} />
              <Route path="*" element={<div className="p-8 text-center">404 - No encontrado</div>} />
            </Routes>
            <FloatingCartButton />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
