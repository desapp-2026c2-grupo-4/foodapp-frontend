const map = {
  Pendiente: { label: "Pendiente", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  Confirmado: { label: "Confirmado", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  Preparando: { label: "En preparación", cls: "bg-orange-100 text-orange-800 border-orange-200" },
  "En preparacion": { label: "En preparación", cls: "bg-orange-100 text-orange-800 border-orange-200" },
  Listo: { label: "Listo", cls: "bg-purple-100 text-purple-800 border-purple-200" },
  "En camino": { label: "En camino", cls: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  Entregado: { label: "Entregado", cls: "bg-green-100 text-green-800 border-green-200" },
  Cancelado: { label: "Cancelado", cls: "bg-red-100 text-red-800 border-red-200" },
};

export default function StatusBadge({ estado }) {
  const cfg = map[estado] || { label: estado, cls: "bg-gray-100 text-gray-700 border-gray-200" };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-pill border ${cfg.cls}`}>{cfg.label}</span>;
}

export const ESTADOS_EMPLEADO = ["Pendiente", "Confirmado", "Preparando", "En camino", "Entregado"];
