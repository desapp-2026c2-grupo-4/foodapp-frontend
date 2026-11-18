import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getClienteById } from "../services/clienteService.js";
import { getPedidos } from "../services/pedidoService.js";
import { getParametrosMap } from "../services/parametroService.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatFecha, formatFechaHora } from "../utils/fechas.js";
import {
  DIAS_INACTIVO,
  PEDIDOS_RECURRENTE,
  dinero,
  nombreCompleto,
  segmentosDe,
} from "../utils/clientes.js";

function formatDireccion(direccion) {
  const calle = [direccion.calle, direccion.altura].filter(Boolean).join(" ");
  const piso = direccion.piso ? `Piso ${direccion.piso}` : "";
  const depto = direccion.departamento ? `Dto ${direccion.departamento}` : "";
  const ciudad = [direccion.ciudad, direccion.provincia].filter(Boolean).join(", ");
  const cp = direccion.codigo_postal ? `CP ${direccion.codigo_postal}` : "";
  return [calle, piso, depto, ciudad, cp].filter(Boolean).join(" · ") || "—";
}

function Dato({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-text-soft">{label}</dt>
      <dd className="text-sm font-medium text-text mt-0.5">
        {value === "" || value == null ? "—" : value}
      </dd>
    </div>
  );
}

export default function AdminClienteDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const [cliente, setCliente] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [parametros, setParametros] = useState({
    diasInactivo: DIAS_INACTIVO,
    pedidosRecurrente: PEDIDOS_RECURRENTE,
  });

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([getClienteById(id), getPedidos({ id_cliente: id })])
      .then(([datosCliente, datosPedidos]) => {
        setCliente(datosCliente);
        setPedidos(datosPedidos);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isAdmin]);

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

  const metricas = useMemo(() => {
    const ordenados = [...pedidos].sort(
      (a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime()
    );
    const entregados = pedidos.filter((p) => p.estado === "Entregado");
    const cancelados = pedidos.filter((p) => p.estado === "Cancelado");
    const activos = pedidos.filter(
      (p) => p.estado !== "Entregado" && p.estado !== "Cancelado"
    );
    const totalGastado = entregados.reduce(
      (sum, p) => sum + Number(p.importe || 0),
      0
    );
    const ticketPromedio = entregados.length ? totalGastado / entregados.length : 0;

    const noCancelados = pedidos.filter((p) => p.estado !== "Cancelado");
    const porSucursal = new Map();
    for (const p of noCancelados) {
      const nombre = p.sucursal?.nombre;
      if (!nombre) continue;
      porSucursal.set(nombre, (porSucursal.get(nombre) || 0) + 1);
    }
    const sucursalFavorita =
      [...porSucursal.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    const porProducto = new Map();
    for (const p of noCancelados) {
      for (const detalle of p.detalles || []) {
        const nombre = detalle.producto?.nombre || detalle.promocion?.nombre || "Producto";
        const cantidad = Number(detalle.cantidad || 0);
        porProducto.set(nombre, (porProducto.get(nombre) || 0) + cantidad);
      }
    }
    const productosFavoritos = [...porProducto.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      ordenados,
      entregados: entregados.length,
      cancelados: cancelados.length,
      activos: activos.length,
      totalGastado,
      ticketPromedio,
      sucursalFavorita,
      productosFavoritos,
      primero: ordenados[ordenados.length - 1] || null,
      ultimo: ordenados[0] || null,
    };
  }, [pedidos]);

  if (!isAdmin) {
    return (
      <p className="p-8 text-center text-danger">
        Acceso denegado — Solo administrador puede consultar clientes.{" "}
        <Link to="/" className="text-primary underline">Volver al inicio</Link>
      </p>
    );
  }
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando cliente...</p>;
  if (error) {
    return (
      <p className="p-8 text-center text-danger">
        Error: {error}{" "}
        <Link to="/admin/clientes" className="text-primary underline">Volver a clientes</Link>
      </p>
    );
  }
  if (!cliente) return null;

  const segmentos = segmentosDe({
    pedidos_count: pedidos.length,
    pedidos_entregados: metricas.entregados,
    pedidos_cancelados: metricas.cancelados,
    ultimo_pedido: metricas.ultimo?.fecha_hora,
  }, parametros);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <Link to="/admin/clientes" className="text-sm text-primary hover:underline">
        ← Volver a clientes
      </Link>

      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-text">
              {nombreCompleto(cliente)}
            </h1>
            <p className="text-sm text-text-soft mt-1">{cliente.email}</p>
            <p className="text-sm text-text-soft">
              Cliente desde {formatFecha(cliente.created_at)} · #{cliente.id_cliente}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {segmentos.map((s) => (
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
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="bg-white rounded-lg border border-border p-5">
          <h2 className="font-semibold text-sm mb-4">Datos personales</h2>
          <dl className="grid grid-cols-2 gap-4">
            <Dato label="Nombre" value={cliente.nombre} />
            <Dato label="Apellido" value={cliente.apellido} />
            <Dato label="Tipo de documento" value={cliente.tipo_doc} />
            <Dato label="Documento" value={cliente.dni} />
            <Dato label="Email" value={cliente.email} />
            <Dato label="Alta" value={formatFecha(cliente.created_at)} />
          </dl>
        </section>

        <section className="bg-white rounded-lg border border-border p-5">
          <h2 className="font-semibold text-sm mb-4">Resumen de compras</h2>
          <dl className="grid grid-cols-2 gap-4">
            <Dato label="Pedidos totales" value={pedidos.length} />
            <Dato label="Entregados" value={metricas.entregados} />
            <Dato label="Activos" value={metricas.activos} />
            <Dato label="Cancelados" value={metricas.cancelados} />
            <Dato label="Gasto total" value={dinero(metricas.totalGastado)} />
            <Dato label="Ticket promedio" value={dinero(metricas.ticketPromedio)} />
            <Dato label="Primer pedido" value={metricas.primero ? formatFechaHora(metricas.primero.fecha_hora) : "—"} />
            <Dato label="Último pedido" value={metricas.ultimo ? formatFechaHora(metricas.ultimo.fecha_hora) : "—"} />
            <Dato label="Sucursal habitual" value={metricas.sucursalFavorita} />
          </dl>
        </section>

        <section className="bg-white rounded-lg border border-border p-5">
          <h2 className="font-semibold text-sm mb-4">
            Direcciones ({cliente.direcciones?.length || 0})
          </h2>
          {cliente.direcciones?.length ? (
            <ul className="space-y-3">
              {cliente.direcciones.map((direccion) => (
                <li key={direccion.id_direccion} className="text-sm border border-border rounded-md p-3 bg-background">
                  <p className="font-medium">{formatDireccion(direccion)}</p>
                  <p className="text-xs text-text-soft mt-1">
                    Lat: {direccion.latitud ?? "—"} · Lng: {direccion.longitud ?? "—"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-soft">Sin direcciones cargadas.</p>
          )}
        </section>

        <section className="bg-white rounded-lg border border-border p-5">
          <h2 className="font-semibold text-sm mb-4">Productos más pedidos</h2>
          {metricas.productosFavoritos.length ? (
            <ol className="space-y-2">
              {metricas.productosFavoritos.map(([nombre, cantidad], index) => (
                <li key={nombre} className="flex justify-between items-center gap-2 text-sm border border-border rounded-md px-3 py-2 bg-background">
                  <span className="font-medium">
                    <span className="text-text-soft font-bold mr-2">{index + 1}.</span>
                    {nombre}
                  </span>
                  <span className="font-bold text-primary shrink-0">{cantidad} u.</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-text-soft">Sin datos de productos.</p>
          )}
        </section>
      </div>

      <section className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="flex flex-wrap justify-between items-center gap-2 px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-sm">Historial de pedidos ({pedidos.length})</h2>
          <p className="text-xs text-text-soft">Gasto total calculado solo con pedidos entregados</p>
        </div>

        {metricas.ordenados.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border text-text-soft">
                <tr>
                  <th className="text-left px-4 py-2">Pedido</th>
                  <th className="text-left px-4 py-2">Fecha</th>
                  <th className="text-left px-4 py-2">Sucursal</th>
                  <th className="text-left px-4 py-2">Estado</th>
                  <th className="text-right px-4 py-2">Importe</th>
                  <th className="text-center px-4 py-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {metricas.ordenados.map((pedido) => (
                  <tr key={pedido.id_pedido} className="border-b border-border align-top">
                    <td className="px-4 py-3 font-bold text-primary">#{pedido.id_pedido}</td>
                    <td className="px-4 py-3 text-text-soft">{formatFechaHora(pedido.fecha_hora)}</td>
                    <td className="px-4 py-3 text-text-soft">{pedido.sucursal?.nombre || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge estado={pedido.estado} /></td>
                    <td className="px-4 py-3 text-right font-semibold">{dinero(pedido.importe)}</td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to={`/empleados/pedidos/${pedido.id_pedido}`}
                        className="text-xs border border-border px-3 py-1 rounded-pill hover:border-primary hover:text-primary"
                      >
                        Ver pedido
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-text-soft">Este cliente todavía no realizó pedidos.</p>
        )}
      </section>
    </div>
  );
}
