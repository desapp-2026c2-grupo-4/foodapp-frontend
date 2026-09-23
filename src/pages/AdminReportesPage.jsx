import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getReporteProductos } from "../services/reporteService.js";

const ORDENES = {
  unidades_desc: { label: "Más vendidos", fn: (a, b) => b.unidades_vendidas - a.unidades_vendidas },
  unidades_asc: { label: "Menos vendidos", fn: (a, b) => a.unidades_vendidas - b.unidades_vendidas },
  facturacion_desc: { label: "Mayor facturación", fn: (a, b) => b.facturacion - a.facturacion },
  nombre: { label: "Nombre A-Z", fn: (a, b) => a.nombre.localeCompare(b.nombre) },
};

function RankingCard({ titulo, items, metrica, destaque }) {
  return (
    <div className="bg-white rounded-lg border border-border p-4 flex-1 min-w-60">
      <h3 className="font-semibold text-sm mb-3">{titulo}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-text-soft">Sin datos</p>
      ) : (
        <ol className="space-y-2">
          {items.map((p, i) => (
            <li key={p.id_producto} className={`flex justify-between items-center gap-2 text-sm border rounded-md px-3 py-2 ${i === 0 && destaque ? destaque : "border-border bg-background"}`}>
              <span className="font-medium truncate">
                <span className="text-text-soft font-bold mr-2">{i + 1}.</span>
                {p.nombre}
              </span>
              <span className="font-bold text-primary shrink-0">{metrica(p)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function AdminReportesPage() {
  const { isAdmin } = useAuth();
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orden, setOrden] = useState("unidades_desc");

  useEffect(() => {
    if (!isAdmin) return;
    getReporteProductos().then(setDatos).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [isAdmin]);

  const masVendidos = useMemo(() => [...datos].sort(ORDENES.unidades_desc.fn).slice(0, 3), [datos]);
  const menosVendidos = useMemo(() => [...datos].sort(ORDENES.unidades_asc.fn).slice(0, 3), [datos]);
  const mayorFacturacion = useMemo(() => [...datos].sort(ORDENES.facturacion_desc.fn).slice(0, 3), [datos]);
  const lista = useMemo(() => [...datos].sort(ORDENES[orden].fn), [datos, orden]);

  if (!isAdmin) return <p className="p-8 text-center text-danger">Acceso denegado — Solo administrador puede ver reportes. <Link to="/" className="text-primary underline">Elegir usuario</Link></p>;
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando reportes...</p>;
  if (error) return <p className="p-8 text-center text-danger">Error: {error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Reportes — Admin</h1>
        <p className="text-sm text-text-soft">Ventas por producto via <code className="bg-white border border-border px-1 rounded-sm">GET /api/reportes/productos</code> (precio histórico de cada detalle)</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <RankingCard titulo="Productos más vendidos" items={masVendidos} metrica={(p) => `${p.unidades_vendidas} u.`} destaque="border-green-200 bg-green-50" />
        <RankingCard titulo="Productos menos vendidos" items={menosVendidos} metrica={(p) => `${p.unidades_vendidas} u.`} destaque="border-red-200 bg-red-50" />
        <RankingCard titulo="Mayor facturación" items={mayorFacturacion} metrica={(p) => `$${p.facturacion.toFixed(2)}`} destaque="border-amber-200 bg-amber-50" />
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="flex flex-wrap justify-between items-center gap-2 px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Lista de productos ({lista.length})</h3>
          <label className="text-xs flex items-center gap-2">
            Ordenar por
            <select value={orden} onChange={(e) => setOrden(e.target.value)} className="border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-primary">
              {Object.entries(ORDENES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </label>
        </div>
        {/* Tarjetas apiladas en una columna (mobile) */}
        <div className="md:hidden space-y-3 p-4">
          {lista.map((p) => (
            <div key={p.id_producto} className="rounded-md border border-border p-4 space-y-2 bg-white">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="font-bold text-primary text-sm">#{p.id_producto}</span>
                  <p className="font-semibold">{p.nombre}</p>
                </div>
                <span className="text-xs text-text-soft shrink-0">{p.estado}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="text-text-soft">Unidades vendidas</span>
                <span className="font-bold">{p.unidades_vendidas}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-soft">Pedidos</span>
                <span className="font-medium">{p.cantidad_pedidos}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-soft">Facturación</span>
                <span className="font-bold text-primary">${p.facturacion.toFixed(2)}</span>
              </div>
            </div>
          ))}
          {lista.length === 0 && (
            <p className="text-sm text-text-soft text-center">No hay productos</p>
          )}
        </div>

        {/* Tabla (desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border text-text-soft">
              <tr>
                <th className="text-left px-4 py-2">#</th>
                <th className="text-left px-4 py-2">Producto</th>
                <th className="text-left px-4 py-2">Estado</th>
                <th className="text-right px-4 py-2">Unidades vendidas</th>
                <th className="text-right px-4 py-2">Pedidos</th>
                <th className="text-right px-4 py-2">Facturación</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id_producto} className="border-b border-border">
                  <td className="px-4 py-2 font-bold text-primary">#{p.id_producto}</td>
                  <td className="px-4 py-2 font-medium">{p.nombre}</td>
                  <td className="px-4 py-2 text-text-soft">{p.estado}</td>
                  <td className="px-4 py-2 text-right font-bold">{p.unidades_vendidas}</td>
                  <td className="px-4 py-2 text-right">{p.cantidad_pedidos}</td>
                  <td className="px-4 py-2 text-right font-bold text-primary">${p.facturacion.toFixed(2)}</td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-text-soft">No hay productos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
