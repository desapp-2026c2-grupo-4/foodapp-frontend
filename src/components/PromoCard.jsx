import { useState } from "react";
import { useCart } from "../context/CartContext.jsx";
import { precioUnitarioPromo, totalBasePromo, tipoPromoLabel } from "../utils/promociones.js";

export default function PromoCard({ promocion }) {
  const { addPromo } = useCart();
  const [imgError, setImgError] = useState(false);
  const precioPromo = precioUnitarioPromo(promocion);
  const base = totalBasePromo(promocion);
  const ahorro = Math.max(0, base - precioPromo);

  return (
    <div className="bg-white rounded-lg border-2 border-accent p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition">
      <div className="h-32 bg-background rounded-md flex items-center justify-center overflow-hidden">
        {promocion.imagen && !imgError ? (
          <img src={promocion.imagen} alt={promocion.nombre} onError={() => setImgError(true)} className="h-full w-full object-cover" />
        ) : (
          <span className="text-text-soft text-sm">Sin imagen</span>
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-text leading-tight">{promocion.nombre}</h3>
        <span className="text-[11px] font-bold bg-accent text-white px-2 py-0.5 rounded-pill shrink-0">
          {tipoPromoLabel(promocion.tipo)}
        </span>
      </div>
      {promocion.descripcion && <p className="text-sm text-text-soft line-clamp-2">{promocion.descripcion}</p>}
      <ul className="text-sm space-y-1 bg-background rounded-md p-2 border border-border">
        {(promocion.productos || []).map((p) => (
          <li key={p.id_producto} className="flex justify-between gap-2">
            <span>{p.nombre} <span className="text-text-soft">x{p.PromocionProducto.cantidad}</span></span>
          </li>
        ))}
      </ul>
      <div className="flex items-baseline gap-2 mt-auto">
        <span className="font-extrabold text-lg text-primary">${precioPromo.toFixed(2)}</span>
        {ahorro > 0.005 && <span className="text-sm text-text-soft line-through">${base.toFixed(2)}</span>}
      </div>
      {ahorro > 0.005 && <p className="text-xs text-success font-semibold">Ahorrás ${ahorro.toFixed(2)}</p>}
      <button
        onClick={() => addPromo(promocion, 1)}
        className="w-full bg-accent hover:bg-amber-600 text-white font-semibold py-2 rounded-pill transition"
      >
        Agregar promo al carrito
      </button>
    </div>
  );
}
