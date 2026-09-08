import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { CartProvider, useCart } from "./context/CartContext.jsx";
import CatalogPage from "./pages/CatalogPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import EmployeeOrdersPage from "./pages/EmployeeOrdersPage.jsx";
import EmployeeOrderDetailPage from "./pages/EmployeeOrderDetailPage.jsx";

function Navbar() {
  const { count } = useCart();
  return (
    <nav className="bg-white border-b border-border sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="font-extrabold text-xl text-primary">BAJON</Link>
        <div className="flex gap-2 md:gap-4 items-center">
          <Link to="/" className="text-sm font-medium hover:text-primary">Productos</Link>
          <Link to="/empleados/pedidos" className="text-sm font-medium hover:text-primary">Pedidos</Link>
          <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-pill">Empleados</span>
          <Link to="/carrito" className="text-sm font-semibold bg-background border border-border px-4 py-1.5 rounded-pill hover:bg-white">
            Carrito {count > 0 && <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-pill ml-1">{count}</span>}
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <div className="min-h-screen bg-background">
          <Navbar />
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/carrito" element={<CartPage />} />
            <Route path="/empleados/pedidos" element={<EmployeeOrdersPage />} />
            <Route path="/empleados/pedidos/:id" element={<EmployeeOrderDetailPage />} />
            <Route path="*" element={<div className="p-8 text-center">404 - No encontrado</div>} />
          </Routes>
        </div>
      </CartProvider>
    </BrowserRouter>
  );
}
