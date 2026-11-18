import { useState } from "react";

export default function ReducirStockModal({
  materia,
  sucursalNombre,
  onClose,
  onConfirm,
  loading,
  error,
}) {
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const n = parseInt(cantidad, 10);
    if (!Number.isInteger(n) || n < 1) {
      return setLocalError("Ingresá una cantidad entera mayor a 0");
    }
    if (n > materia.stock) {
      return setLocalError(`No podés reducir más de ${materia.stock} unidades`);
    }
    if (motivo.trim().length < 3) {
      return setLocalError("Ingresá un motivo de al menos 3 caracteres");
    }
    setLocalError("");
    onConfirm({ cantidad: n, motivo: motivo.trim() });
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reducir-stock-title"
    >
      <div className="bg-white rounded-lg border border-border w-full max-w-md p-5 space-y-4">
        <div className="flex justify-between items-start gap-3">
          <div>
            <h2 id="reducir-stock-title" className="text-lg font-extrabold">
              Reducir stock
            </h2>
            <p className="text-sm text-text-soft">
              {materia.nombre} · {sucursalNombre}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-text-soft hover:text-text text-lg leading-none disabled:opacity-40"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <p className="text-sm">
          Stock actual: <span className="font-bold">{materia.stock}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="text-sm block">
            Cantidad a reducir*
            <input
              type="number"
              min="1"
              max={materia.stock}
              step="1"
              value={cantidad}
              onChange={(e) => {
                setCantidad(e.target.value);
                setLocalError("");
              }}
              className="w-full border border-border rounded-md px-3 py-2 mt-1 focus:outline-none focus:border-primary"
            />
          </label>

          <label className="text-sm block">
            Motivo*
            <textarea
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setLocalError("");
              }}
              rows={3}
              maxLength={255}
              placeholder="Ej.: vencida, dañada, rotura, ajuste de inventario"
              className="w-full border border-border rounded-md px-3 py-2 mt-1 focus:outline-none focus:border-primary"
            />
          </label>

          {(localError || error) && (
            <p className="text-sm text-danger">{localError || error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="border border-border bg-white px-4 py-2 rounded-pill text-sm disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-danger text-white px-4 py-2 rounded-pill text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Reduciendo..." : "Reducir stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
