export default function LowStockAlert({ items, onClose }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg border border-border max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="p-6 text-center border-b border-border">
          <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-extrabold text-danger">!</span>
          </div>
          <h2 className="text-xl font-extrabold text-text">Stock bajo</h2>
          <p className="text-sm text-text-soft mt-1">Estos insumos están por debajo del mínimo configurado</p>
        </div>
        <div className="p-6 space-y-3">
          <ul className="space-y-2">
            {items.map((m) => (
              <li key={m.id_materia_prima} className="flex justify-between items-center gap-3 text-sm border border-border rounded-md px-3 py-2">
                <span className="font-medium">{m.nombre}</span>
                <span className="text-text-soft shrink-0">
                  Stock <span className="font-bold text-danger">{m.stock}</span> / mín. <span className="font-semibold">{m.stock_minimo}</span>
                </span>
              </li>
            ))}
          </ul>
          <button onClick={onClose} className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-pill font-semibold">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
