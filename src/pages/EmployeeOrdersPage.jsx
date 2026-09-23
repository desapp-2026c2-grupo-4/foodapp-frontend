import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPedidos } from "../services/pedidoService.js";
import StatusBadge from "../components/StatusBadge.jsx";

function formatFecha(fecha) {
  return new Date(fecha).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

function formatDireccion(dir) {
  if (!dir) return "—";
  return `${dir.calle} ${dir.altura}${dir.piso ? ` ${dir.piso}` : ""}, ${dir.ciudad} (${dir.provincia})`;
}

export default function EmployeeOrdersPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPedidos().then(setPedidos).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-8 text-center text-text-soft">Cargando pedidos...</p>;
  if (error) return <p className="p-8 text-center text-danger">Error: {error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text">Pedidos — Vista Empleados</h1>
        <p className="text-sm text-text-soft">Sin login (solo funcionalidad). Total: {pedidos.length}</p>
      </div>

      {/* Tarjetas apiladas en una columna (mobile) */}
      <div className="md:hidden space-y-3">
        {pedidos.map((p) => (
          <div key={p.id_pedido} className="bg-white rounded-lg border border-border p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-primary">Pedido #{p.id_pedido}</span>
              <StatusBadge estado={p.estado} />
            </div>
            <p className="text-xs text-text-soft">{formatFecha(p.fecha_hora)}</p>
            <div>
              <p className="text-xs font-semibold text-text-soft mb-1">Productos</p>
              <ul className="space-y-1 text-sm">
                {p.detalles?.map((d) => (
                  <li key={d.id_detalle} className="leading-tight">
                    <span className="font-medium">{d.producto?.nombre || `Prod #${d.id_producto}`}</span>
                    <span className="text-text-soft"> x{d.cantidad}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-text-soft">{formatDireccion(p.direccion)}</p>
            <div className="flex justify-between items-center border-t border-border pt-3">
              <span className="font-bold">Total: <span className="text-primary">${parseFloat(p.importe).toFixed(2)}</span></span>
              <Link to={`/empleados/pedidos/${p.id_pedido}`} className="bg-white border border-border px-4 py-1.5 rounded-pill text-xs font-semibold hover:bg-background hover:border-primary">
                Ver detalle
              </Link>
            </div>
          </div>
        ))}
        {pedidos.length === 0 && (
          <p className="bg-white rounded-lg border border-border p-8 text-center text-text-soft">No hay pedidos</p>
        )}
      </div>

      {/* Tabla (desktop) */}
      <div className="hidden md:block bg-white rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border text-text-soft">
              <tr>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Fecha y hora</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Productos</th>
                <th className="text-right px-4 py-3">Importe</th>
                <th className="text-left px-4 py-3">Dirección cliente</th>
                <th className="text-center px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id_pedido} className="border-b border-border hover:bg-background/60">
                  <td className="px-4 py-3 font-bold text-primary">#{p.id_pedido}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatFecha(p.fecha_hora)}</td>
                  <td className="px-4 py-3"><StatusBadge estado={p.estado} /></td>
                  <td className="px-4 py-3">
                    <ul className="space-y-1">
                      {p.detalles?.map((d) => (
                        <li key={d.id_detalle} className="leading-tight">
                          <span className="font-medium">{d.producto?.nombre || `Prod #${d.id_producto}`}</span>
                          <span className="text-text-soft"> x{d.cantidad}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3 text-right font-bold">${parseFloat(p.importe).toFixed(2)}</td>
                  <td className="px-4 py-3 text-text-soft max-w-xs truncate">{formatDireccion(p.direccion)}</td>
                  <td className="px-4 py-3 text-center">
                    <Link to={`/empleados/pedidos/${p.id_pedido}`} className="inline-block bg-white border border-border px-3 py-1 rounded-pill text-xs font-semibold hover:bg-background hover:border-primary">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
              {pedidos.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-text-soft">No hay pedidos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
