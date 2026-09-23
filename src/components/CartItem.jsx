import { useState } from "react";
import { useCart } from "../context/CartContext.jsx";

export default function CartItem({ item }) {
  const { updateQuantity, removeProduct, updateObservaciones } = useCart();
  const [imgError, setImgError] = useState(false);
  const isPromo = item.tipo === "promocion";
  const extra = isPromo ? 0 : (item.opcionales || []).reduce((s, o) => s + parseFloat(o.precio || 0), 0);
  const unitPrice = item.precio + extra;
  return (
    <div className="bg-white rounded-md border border-border p-4 flex flex-col sm:flex-row gap-4 sm:items-start">
      <div className="w-full h-40 sm:w-20 sm:h-20 bg-background rounded-sm flex items-center justify-center overflow-hidden shrink-0">
        {item.imagen && !imgError ? <img src={item.imagen} alt={item.nombre} onError={() => setImgError(true)} className="w-full h-full object-cover" /> : <span className="text-xs text-text-soft">Sin img</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-text truncate">{item.nombre}</h4>
          {isPromo && <span className="text-[11px] font-bold bg-accent text-white px-2 py-0.5 rounded-pill shrink-0">Promoción</span>}
        </div>
        <p className="text-sm text-primary font-bold">${item.precio.toFixed(2)} c/u {extra > 0 && <span className="text-accent">+${extra.toFixed(2)} opc.</span>}</p>
        <p className="text-xs text-text-soft">{isPromo ? "Precio promocional por combo" : `Precio unit. con opcionales: $${unitPrice.toFixed(2)}`}</p>

        {isPromo && item.productos?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.productos.map((p) => (
              <span key={p.id_producto} className="text-xs bg-background border border-border px-2 py-0.5 rounded-pill">
                {p.nombre} x{p.cantidad}
              </span>
            ))}
          </div>
        )}

        {!isPromo && item.opcionales?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.opcionales.map((o) => (
              <span key={o.id_opcional} className="text-xs bg-background border border-border px-2 py-0.5 rounded-pill">
                {o.nombre} {parseFloat(o.precio) > 0 && `+$${parseFloat(o.precio).toFixed(2)}`}
              </span>
            ))}
          </div>
        )}

        <input
          placeholder="Observaciones (ej. Sin cebolla)"
          value={item.observaciones}
          onChange={(e) => updateObservaciones(item.cartId, e.target.value)}
          className="mt-2 w-full text-sm border border-border rounded-sm px-2 py-1 focus:outline-none focus:border-primary"
        />
        <p className="text-sm font-semibold mt-1">Subtotal: ${(unitPrice * item.cantidad).toFixed(2)}</p>
      </div>
      <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-start w-full sm:w-auto gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateQuantity(item.cartId, item.cantidad - 1)}
            className="w-8 h-8 rounded-sm border border-border bg-white hover:bg-background flex items-center justify-center"
            aria-label="Disminuir"
          >
            −
          </button>
          <span className="w-6 text-center font-semibold">{item.cantidad}</span>
          <button
            onClick={() => updateQuantity(item.cartId, item.cantidad + 1)}
            className="w-8 h-8 rounded-sm border border-border bg-white hover:bg-background flex items-center justify-center"
            aria-label="Aumentar"
          >
            +
          </button>
        </div>
        <button
          onClick={() => removeProduct(item.cartId)}
          className="text-xs text-danger hover:underline mt-1"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
