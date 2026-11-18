import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getResumenClientes } from "../services/clienteService.js";
import { getParametrosMap } from "../services/parametroService.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatFecha, formatFechaHora } from "../utils/fechas.js";
import {
  DIAS_INACTIVO,
  PEDIDOS_RECURRENTE,
  diasDesde,
  dinero,
  fechaMs,
  nombreCompleto,
  normalizar,
  segmentosDe,
} from "../utils/clientes.js";

const FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "con_pedidos", label: "Con pedidos" },
  { id: "sin_pedidos", label: "Sin pedidos" },
  { id: "recurrentes", label: "Recurrentes" },
  { id: "inactivos", label: "Inactivos" },
  { id: "cancelaciones", label: "Con cancelaciones" },
];

const ORDENES = {
  nombre: { label: "Nombre A-Z", fn: (a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), "es") },
  alta_desc: { label: "Alta más reciente", fn: (a, b) => fechaMs(b.created_at) - fechaMs(a.created_at) },
  gasto_desc: { label: "Mayor gasto", fn: (a, b) => b.total_gastado - a.total_gastado },
  pedidos_desc: { label: "Más pedidos", fn: (a, b) => b.pedidos_count - a.pedidos_count },
  ultimo_desc: { label: "Última compra", fn: (a, b) => fechaMs(b.ultimo_pedido) - fechaMs(a.ultimo_pedido) },
};

function coincideFiltro(cliente, filtro, parametros) {
  if (filtro === "con_pedidos") return cliente.pedidos_count > 0;
  if (filtro === "sin_pedidos") return cliente.pedidos_count === 0;
  if (filtro === "recurrentes") return cliente.pedidos_entregados >= parametros.pedidosRecurrente;
  if (filtro === "inactivos") {
    const dias = diasDesde(cliente.ultimo_pedido);
    return cliente.pedidos_count > 0 && dias !== null && dias > parametros.diasInactivo;
  }
  if (filtro === "cancelaciones") return cliente.pedidos_cancelados > 0;
  return true;
}

function Segmentos({ cliente, parametros }) {
  return (
    <div className="flex flex-wrap gap-1">
      {segmentosDe(cliente, parametros).map((s) => (
        <span
          key={s}
          className={`text-[11px] px-2 py-0.5 rounded-pill ${
            s === "Activo" || s === "Recurrente"
              ? "bg-green-50 text-success"
              : s === "Inactivo" || s === "Con cancelaciones"
                ? "bg-amber-50 text-amber-700"
                : "bg-background text-text-soft"
          }`}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function ResumenCard({ label, value, detalle }) {
  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <p className="text-xs text-text-soft">{label}</p>
      <p className="text-2xl font-extrabold text-text mt-1">{value}</p>
      {detalle && <p className="text-xs text-text-soft mt-1">{detalle}</p>}
    </div>
  );
}

export default function AdminClientesPage() {
  const { isAdmin } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [orden, setOrden] = useState("nombre");
  const [parametros, setParametros] = useState({
    diasInactivo: DIAS_INACTIVO,
    pedidosRecurrente: PEDIDOS_RECURRENTE,
  });

  useEffect(() => {
    if (!isAdmin) return;
    getResumenClientes()
      .then(setClientes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    getParametrosMap()
      .then((map) => {
        setParametros({
          diasInactivo: Number(map.dias_cliente_inactivo) || DIAS_INACTIVO,
          pedidosRecurrente: Number(map.pedidos_cliente_recurrente) || PEDIDOS_RECURRENTE,
        });
      })
      .catch(() => {});
  }, [isAdmin]);

  const resumen = useMemo(() => {
    const conPedidos = clientes.filter((c) => c.pedidos_count > 0).length;
    const inactivos = clientes.filter((c) => {
      const dias = diasDesde(c.ultimo_pedido);
      return c.pedidos_count > 0 && dias !== null && dias > parametros.diasInactivo;
    }).length;
    return {
      total: clientes.length,
      conPedidos,
      sinPedidos: clientes.length - conPedidos,
      inactivos,
      cancelaciones: clientes.filter((c) => c.pedidos_cancelados > 0).length,
      gastoTotal: clientes.reduce((sum, c) => sum + Number(c.total_gastado || 0), 0),
    };
  }, [clientes, parametros.diasInactivo]);

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return clientes
      .filter((c) => {
        if (!coincideFiltro(c, filtro, parametros)) return false;
        if (!q) return true;
        return [nombreCompleto(c), c.email, c.dni, c.tipo_doc].some((v) =>
          normalizar(v).includes(q)
        );
      })
      .sort(ORDENES[orden].fn);
  }, [clientes, busqueda, filtro, orden, parametros]);

  if (!isAdmin) {
    return (
      <p className="p-8 text-center text-danger">
        Acceso denegado — Solo administrador puede consultar clientes.{" "}
        <Link to="/" className="text-primary underline">Volver al inicio</Link>
      </p>
    );
  }
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando clientes...</p>;
  if (error) return <p className="p-8 text-center text-danger">Error: {error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-text">Clientes</h1>
        <p className="text-sm text-text-soft mt-1">
          Consultá datos, direcciones, actividad e historial de compras.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <ResumenCard label="Total clientes" value={resumen.total} />
        <ResumenCard label="Con pedidos" value={resumen.conPedidos} />
        <ResumenCard label="Sin pedidos" value={resumen.sinPedidos} />
        <ResumenCard label="Inactivos" value={resumen.inactivos} detalle={`+${parametros.diasInactivo} días`} />
        <ResumenCard label="Con cancelaciones" value={resumen.cancelaciones} />
        <ResumenCard label="Gasto entregado" value={dinero(resumen.gastoTotal)} />
      </div>

      <div className="bg-white rounded-lg border border-border p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <label className="flex-1 text-xs font-semibold">
            Buscar
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, email o DNI"
              className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm font-normal focus:outline-none focus:border-primary"
            />
          </label>
          <label className="text-xs font-semibold">
            Segmento
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="mt-1 block border border-border rounded-md px-3 py-2 text-sm font-normal bg-white focus:outline-none focus:border-primary"
            >
              {FILTROS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold">
            Ordenar por
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="mt-1 block border border-border rounded-md px-3 py-2 text-sm font-normal bg-white focus:outline-none focus:border-primary"
            >
              {Object.entries(ORDENES).map(([id, cfg]) => (
                <option key={id} value={id}>{cfg.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`text-xs px-3 py-1.5 rounded-pill border font-semibold transition ${
                filtro === f.id
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-border hover:border-primary hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="flex flex-wrap justify-between items-center gap-2 px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-sm">Listado ({filtrados.length})</h2>
          <p className="text-xs text-text-soft">Gasto calculado solo con pedidos entregados</p>
        </div>

        <div className="md:hidden divide-y divide-border">
          {filtrados.map((cliente) => (
            <div key={cliente.id_cliente} className="p-4 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold">{nombreCompleto(cliente)}</p>
                  <p className="text-xs text-text-soft">{cliente.email}</p>
                  <p className="text-xs text-text-soft">
                    {cliente.tipo_doc || "Doc."} {cliente.dni || "—"}
                  </p>
                </div>
                <span className="text-xs text-text-soft shrink-0">#{cliente.id_cliente}</span>
              </div>
              <Segmentos cliente={cliente} parametros={parametros} />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-text-soft">Alta: </span>{formatFecha(cliente.created_at)}</div>
                <div><span className="text-text-soft">Direcciones: </span>{cliente.direcciones_count}</div>
                <div><span className="text-text-soft">Pedidos: </span>{cliente.pedidos_count}</div>
                <div><span className="text-text-soft">Gasto: </span>{dinero(cliente.total_gastado)}</div>
                <div><span className="text-text-soft">Ticket: </span>{dinero(cliente.ticket_promedio)}</div>
                <div><span className="text-text-soft">Sucursal: </span>{cliente.sucursal_favorita || "—"}</div>
              </div>
              <div className="flex justify-between items-center gap-2">
                <div className="text-xs text-text-soft">
                  {cliente.ultimo_pedido ? `Último: ${formatFechaHora(cliente.ultimo_pedido)}` : "Sin pedidos"}
                </div>
                <Link
                  to={`/admin/clientes/${cliente.id_cliente}`}
                  className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-pill hover:bg-primary-dark"
                >
                  Ver ficha
                </Link>
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <p className="p-8 text-center text-sm text-text-soft">No hay clientes que coincidan con los filtros.</p>
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border text-text-soft">
              <tr>
                <th className="text-left px-4 py-2">Cliente</th>
                <th className="text-left px-4 py-2">Documento</th>
                <th className="text-left px-4 py-2">Alta</th>
                <th className="text-right px-4 py-2">Direcciones</th>
                <th className="text-left px-4 py-2">Pedidos</th>
                <th className="text-right px-4 py-2">Gasto total</th>
                <th className="text-left px-4 py-2">Última compra</th>
                <th className="text-left px-4 py-2">Segmento</th>
                <th className="text-center px-4 py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((cliente) => (
                <tr key={cliente.id_cliente} className="border-b border-border align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{nombreCompleto(cliente)}</p>
                    <p className="text-xs text-text-soft">{cliente.email}</p>
                    <p className="text-xs text-text-soft">#{cliente.id_cliente}</p>
                  </td>
                  <td className="px-4 py-3 text-text-soft">
                    {cliente.tipo_doc || "—"} {cliente.dni || ""}
                  </td>
                  <td className="px-4 py-3 text-text-soft">{formatFecha(cliente.created_at)}</td>
                  <td className="px-4 py-3 text-right">{cliente.direcciones_count}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{cliente.pedidos_count}</p>
                    <p className="text-[11px] text-text-soft">
                      {cliente.pedidos_entregados} ent. · {cliente.pedidos_activos} act. · {cliente.pedidos_cancelados} canc.
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-primary">
                    {dinero(cliente.total_gastado)}
                    <p className="text-[11px] font-normal text-text-soft">Ticket {dinero(cliente.ticket_promedio)}</p>
                  </td>
                  <td className="px-4 py-3">
                    {cliente.ultimo_pedido ? (
                      <>
                        <p className="text-xs text-text-soft">{formatFechaHora(cliente.ultimo_pedido)}</p>
                        <StatusBadge estado={cliente.ultimo_estado} />
                      </>
                    ) : (
                      <span className="text-xs text-text-soft">Sin pedidos</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><Segmentos cliente={cliente} parametros={parametros} /></td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      to={`/admin/clientes/${cliente.id_cliente}`}
                      className="text-xs border border-border px-3 py-1 rounded-pill hover:border-primary hover:text-primary"
                    >
                      Ver ficha
                    </Link>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-text-soft">
                    No hay clientes que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
