import { useState } from "react";
import { useCart } from "../context/CartContext.jsx";

export default function ProductCard({ producto }) {
  const { addProduct } = useCart();
  const [selected, setSelected] = useState([]);

  const toggleOpcional = (opc) => {
    setSelected((prev) =>
      prev.find((o) => o.id_opcional === opc.id_opcional)
        ? prev.filter((o) => o.id_opcional !== opc.id_opcional)
        : [...prev, opc]
    );
  };

  const handleAdd = () => {
    addProduct(producto, 1, selected);
    setSelected([]);
  };

  const opcionales = producto.opcionales || [];
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-border p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition">
      <div className="h-32 bg-background rounded-md flex items-center justify-center overflow-hidden">
        {producto.imagen && !imgError ? (
          <img src={producto.imagen} alt={producto.nombre} onError={() => setImgError(true)} className="h-full w-full object-cover" />
        ) : (
          <span className="text-text-soft text-sm">Sin imagen</span>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-text leading-tight">{producto.nombre}</h3>
        {(producto.categorias || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {producto.categorias.map((c) => (
              <span key={c.id_categoria} className="text-[11px] bg-background border border-border text-text-soft px-2 py-0.5 rounded-pill">
                {c.nombre}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-text-soft line-clamp-2 mt-1">{producto.descripcion}</p>
        <p className="font-bold text-primary mt-2">${parseFloat(producto.precio).toFixed(2)}</p>
        {producto.estado !== "disponible" && (
          <span className="text-xs text-danger font-medium">{producto.estado}</span>
        )}

        {opcionales.length > 0 && (
          <div className="mt-3 space-y-1.5 bg-background rounded-md p-2 border border-border">
            <p className="text-xs font-semibold text-text">Opcionales</p>
            {opcionales.map((opc) => (
              <label key={opc.id_opcional} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.some((s) => s.id_opcional === opc.id_opcional)}
                  onChange={() => toggleOpcional(opc)}
                  className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary"
                />
                <span className="flex-1">{opc.nombre}</span>
                <span className="text-xs text-text-soft">+${parseFloat(opc.precio).toFixed(2)}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={handleAdd}
        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 rounded-pill transition disabled:opacity-50"
        disabled={producto.estado !== "disponible"}
      >
        Agregar al carrito
      </button>
    </div>
  );
}
