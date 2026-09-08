import { useEffect, useState } from "react";
import { getProductos } from "../services/productService.js";
import ProductCard from "../components/ProductCard.jsx";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function CatalogPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { count } = useCart();

  useEffect(() => {
    getProductos().then(setProductos).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-8 text-center text-text-soft">Cargando productos...</p>;
  if (error) return <p className="p-8 text-center text-danger">Error: {error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-extrabold text-text">Catálogo</h1>
        <Link to="/carrito" className="bg-primary text-white px-5 py-2 rounded-pill font-semibold hover:bg-primary-dark relative">
          Carrito {count > 0 && <span className="ml-2 bg-white text-primary text-xs px-2 py-0.5 rounded-pill">{count}</span>}
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {productos.map((p) => (
          <ProductCard key={p.id_producto} producto={p} />
        ))}
      </div>
    </div>
  );
}
