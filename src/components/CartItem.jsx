import { useCart } from "../context/CartContext.jsx";

export default function CartItem({ item }) {
  const { updateQuantity, removeProduct, updateObservaciones } = useCart();
  return (
    <div className="bg-white rounded-md border border-border p-4 flex gap-4 items-start">
      <div className="w-20 h-20 bg-background rounded-sm flex items-center justify-center overflow-hidden shrink-0">
        {item.imagen ? <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover" /> : <span className="text-xs text-text-soft">Sin img</span>}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-text truncate">{item.nombre}</h4>
        <p className="text-sm text-primary font-bold">${item.precio.toFixed(2)} c/u</p>
        <input
          placeholder="Observaciones (ej. Sin cebolla)"
          value={item.observaciones}
          onChange={(e) => updateObservaciones(item.id_producto, e.target.value)}
          className="mt-2 w-full text-sm border border-border rounded-sm px-2 py-1 focus:outline-none focus:border-primary"
        />
        <p className="text-sm font-semibold mt-1">Subtotal: ${(item.precio * item.cantidad).toFixed(2)}</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateQuantity(item.id_producto, item.cantidad - 1)}
            className="w-8 h-8 rounded-sm border border-border bg-white hover:bg-background flex items-center justify-center"
            aria-label="Disminuir"
          >
            −
          </button>
          <span className="w-6 text-center font-semibold">{item.cantidad}</span>
          <button
            onClick={() => updateQuantity(item.id_producto, item.cantidad + 1)}
            className="w-8 h-8 rounded-sm border border-border bg-white hover:bg-background flex items-center justify-center"
            aria-label="Aumentar"
          >
            +
          </button>
        </div>
        <button
          onClick={() => removeProduct(item.id_producto)}
          className="text-xs text-danger hover:underline mt-1"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
