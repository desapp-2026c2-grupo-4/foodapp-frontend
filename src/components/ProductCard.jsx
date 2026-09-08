import { useCart } from "../context/CartContext.jsx";

export default function ProductCard({ producto }) {
  const { addProduct } = useCart();
  return (
    <div className="bg-white rounded-lg border border-border p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition">
      <div className="h-32 bg-background rounded-md flex items-center justify-center overflow-hidden">
        {producto.imagen ? (
          <img src={producto.imagen} alt={producto.nombre} className="h-full w-full object-cover" />
        ) : (
          <span className="text-text-soft text-sm">Sin imagen</span>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-text leading-tight">{producto.nombre}</h3>
        <p className="text-sm text-text-soft line-clamp-2 mt-1">{producto.descripcion}</p>
        <p className="font-bold text-primary mt-2">${parseFloat(producto.precio).toFixed(2)}</p>
        {producto.estado !== "disponible" && (
          <span className="text-xs text-danger font-medium">{producto.estado}</span>
        )}
      </div>
      <button
        onClick={() => addProduct(producto, 1)}
        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 rounded-pill transition disabled:opacity-50"
        disabled={producto.estado !== "disponible"}
      >
        Agregar al carrito
      </button>
    </div>
  );
}
