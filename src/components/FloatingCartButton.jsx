import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Botón flotante del carrito (solo vista mobile, lado cliente).
// Hace un "pop" cada vez que se agrega un producto.
export default function FloatingCartButton() {
  const { count, total } = useCart();
  const { isStaff } = useAuth();
  const { pathname } = useLocation();
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);
  const timer = useRef(null);

  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setBump(false), 450);
    }
    prevCount.current = count;
    return () => clearTimeout(timer.current);
  }, [count]);

  if (isStaff || pathname === "/carrito") return null;

  return (
    <Link
      to="/carrito"
      aria-label={`Ir al carrito (${count} productos)`}
      className={`md:hidden fixed bottom-5 right-5 z-30 flex items-center gap-2 bg-danger text-white pl-4 pr-5 py-3 rounded-pill shadow-lg hover:bg-red-700 ${bump ? "animate-cart-bump" : ""}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6" aria-hidden="true">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <span className="bg-white text-danger text-xs font-bold px-2 py-0.5 rounded-pill">{count}</span>
      )}
      {total > 0 && (
        <span className="text-sm font-bold">${total.toFixed(2)}</span>
      )}
    </Link>
  );
}
