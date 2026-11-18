import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getPedidosPorDia,
  getPedidosPorEstado,
  getTiempoPromedioEntrega,
  getPedidosCancelados,
  getSucursalesResumen,
  getProductosPorSucursal,
  getClientesTop,
  getClientesNuevos,
  getClientesInactivos,
  getReporteProductos,
  getReportePromociones,
  getImpactoPromociones,
} from "../services/reporteService.js";
import { getSucursales } from "../services/sucursalService.js";
import { getParametrosMap } from "../services/parametroService.js";
import { formatFecha, formatFechaHora } from "../utils/fechas.js";

const TABS = [
  { id: "pedidos", label: "Pedidos" },
  { id: "clientes", label: "Clientes" },
  { id: "sucursales", label: "Sucursales" },
  { id: "productos", label: "Productos" },
  { id: "promociones", label: "Promociones" },
];

const ORDENES_PRODUCTOS = {
  unidades_desc: { label: "Más vendidos", fn: (a, b) => b.unidades_vendidas - a.unidades_vendidas },
  unidades_asc: { label: "Menos vendidos", fn: (a, b) => a.unidades_vendidas - b.unidades_vendidas },
  facturacion_desc: { label: "Mayor facturación", fn: (a, b) => b.facturacion - a.facturacion },
  nombre: { label: "Nombre A-Z", fn: (a, b) => a.nombre.localeCompare(b.nombre) },
};

const aISO = (fecha) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

const hoyISO = () => aISO(new Date());

const restarDiasISO = (fechaISO, dias) => {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  fecha.setDate(fecha.getDate() - dias);
  return aISO(fecha);
};

const dinero = (valor) =>
  `$${Number(valor || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const entero = (valor) => Number(valor || 0).toLocaleString("es-AR");

const minutos = (valor) => {
  const total = Number(valor || 0);
  if (total <= 0) return "—";
  if (total < 60) return `${Math.round(total)} min`;
  const horas = Math.floor(total / 60);
  const resto = Math.round(total % 60);
  return `${horas} h ${resto} min`;
};

function KpiCard({ label, value, detalle }) {
  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <p className="text-[11px] uppercase tracking-wide text-text-soft">{label}</p>
      <p className="text-2xl font-extrabold text-primary mt-1">{value}</p>
      {detalle && <p className="text-xs text-text-soft mt-1">{detalle}</p>}
    </div>
  );
}

function SectionCard({ titulo, extra, children }) {
  return (
    <section className="bg-white rounded-lg border border-border overflow-hidden">
      <div className="flex flex-wrap justify-between items-center gap-2 px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">{titulo}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

function BarList({ items, labelKey, valueKey, formatValue = entero, formatLabel = (valor) => valor, empty = "Sin datos" }) {
  const maximo = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1);
  if (items.length === 0) return <p className="p-6 text-sm text-text-soft text-center">{empty}</p>;
  return (
    <div className="p-4 space-y-3">
      {items.map((item, indice) => {
        const valor = Number(item[valueKey]) || 0;
        return (
          <div key={item.estado ?? item.fecha ?? item.periodo ?? item.id_sucursal ?? indice}>
            <div className="flex justify-between gap-2 text-xs mb-1">
              <span className="font-medium truncate">{formatLabel(item[labelKey])}</span>
              <span className="text-text-soft shrink-0">{formatValue(valor)}</span>
            </div>
            <div className="h-2 bg-background rounded-pill overflow-hidden">
              <div className="h-2 bg-primary rounded-pill" style={{ width: `${(valor / maximo) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankingCard({ titulo, items, metrica, destaque, clave = "id_producto" }) {
  return (
    <div className="bg-white rounded-lg border border-border p-4 flex-1 min-w-60">
      <h3 className="font-semibold text-sm mb-3">{titulo}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-text-soft">Sin datos</p>
      ) : (
        <ol className="space-y-2">
          {items.map((item, indice) => (
            <li
              key={item[clave]}
              className={`flex justify-between items-center gap-2 text-sm border rounded-md px-3 py-2 ${
                indice === 0 && destaque ? destaque : "border-border bg-background"
              }`}
            >
              <span className="font-medium truncate">
                <span className="text-text-soft font-bold mr-2">{indice + 1}.</span>
                {item.nombre}
              </span>
              <span className="font-bold text-primary shrink-0">{metrica(item)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function AdminReportesPage() {
  const { user, isAdmin, isStaff } = useAuth();
  const [tab, setTab] = useState("pedidos");
  const [desde, setDesde] = useState(() => restarDiasISO(hoyISO(), 29));
  const [hasta, setHasta] = useState(() => hoyISO());
  const [filtroSucursal, setFiltroSucursal] = useState("");
  const [sucursales, setSucursales] = useState([]);
  const [agrupacion, setAgrupacion] = useState("dia");
  const [diasInactivos, setDiasInactivos] = useState(30);
  const [limiteTop, setLimiteTop] = useState(10);
  const [ordenProductos, setOrdenProductos] = useState("unidades_desc");
  const [loading, setLoading] = useState(true);
  const [parametrosListos, setParametrosListos] = useState(false);
  const [error, setError] = useState("");
  const [datos, setDatos] = useState({
    pedidosDia: [],
    pedidosEstado: [],
    tiempoEntrega: null,
    cancelados: null,
    sucursales: [],
    productosSucursal: [],
    clientesTop: [],
    clientesNuevos: null,
    clientesInactivos: [],
    productos: [],
    promociones: [],
    impacto: [],
  });

  const idSucursalEmpleado = !isAdmin ? user?.id_sucursal : null;
  const sucursalEfectiva = isAdmin ? filtroSucursal || null : idSucursalEmpleado;
  const sucursalActual = sucursales.find(
    (s) => Number(s.id_sucursal) === Number(sucursalEfectiva)
  );

  useEffect(() => {
    getSucursales().then(setSucursales).catch(() => setSucursales([]));
  }, []);

  useEffect(() => {
    let cancelado = false;
    getParametrosMap()
      .then((map) => {
        if (cancelado) return;
        const diasDefault = Number(map.reporte_dias_default) || 30;
        setDesde(restarDiasISO(hoyISO(), diasDefault - 1));
        setDiasInactivos(Number(map.dias_cliente_inactivo) || 30);
        setLimiteTop(Number(map.reporte_limite_default) || 10);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelado) setParametrosListos(true);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      if (!parametrosListos) return;
      if (!isAdmin && !user?.id_sucursal) {
        setError("No tenés sucursal asignada. Pedile a un administrador que te asigne una.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      const idSucursal = isAdmin ? filtroSucursal || undefined : user?.id_sucursal;
      const params = {
        id_sucursal: idSucursal,
        desde: desde || undefined,
        hasta: hasta || undefined,
      };

      try {
        if (tab === "pedidos") {
          const [pedidosDia, pedidosEstado, tiempoEntrega, cancelados, resumenSucursales] = await Promise.all([
            getPedidosPorDia(params),
            getPedidosPorEstado(params),
            getTiempoPromedioEntrega(params),
            getPedidosCancelados(params),
            getSucursalesResumen(params),
          ]);
          if (cancelado) return;
          setDatos((prev) => ({
            ...prev,
            pedidosDia,
            pedidosEstado,
            tiempoEntrega,
            cancelados,
            sucursales: resumenSucursales,
          }));
        } else if (tab === "clientes") {
          const [clientesTop, clientesNuevos, clientesInactivos, tiempoEntrega] = await Promise.all([
            getClientesTop({ ...params, limite: limiteTop }),
            getClientesNuevos({ ...params, agrupacion }),
            getClientesInactivos({ id_sucursal: params.id_sucursal, dias: diasInactivos }),
            getTiempoPromedioEntrega(params),
          ]);
          if (cancelado) return;
          setDatos((prev) => ({ ...prev, clientesTop, clientesNuevos, clientesInactivos, tiempoEntrega }));
        } else if (tab === "sucursales") {
          const [resumen, productosSucursal] = await Promise.all([
            getSucursalesResumen(params),
            getProductosPorSucursal(params),
          ]);
          if (cancelado) return;
          setDatos((prev) => ({ ...prev, sucursales: resumen, productosSucursal }));
        } else if (tab === "productos") {
          const productos = await getReporteProductos(params);
          if (cancelado) return;
          setDatos((prev) => ({ ...prev, productos }));
        } else if (tab === "promociones") {
          const [promociones, impacto] = await Promise.all([
            getReportePromociones(params),
            getImpactoPromociones(params),
          ]);
          if (cancelado) return;
          setDatos((prev) => ({ ...prev, promociones, impacto }));
        }
      } catch (e) {
        if (!cancelado) setError(e.message);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    cargar();
    return () => {
      cancelado = true;
    };
  }, [
    tab,
    desde,
    hasta,
    filtroSucursal,
    isAdmin,
    user?.id_sucursal,
    agrupacion,
    diasInactivos,
    limiteTop,
    parametrosListos,
  ]);

  const aplicarRango = (dias) => {
    setHasta(hoyISO());
    setDesde(restarDiasISO(hoyISO(), dias - 1));
  };

  const totalPedidos = datos.pedidosDia.reduce((acc, fila) => acc + fila.total, 0);
  const totalEntregados = datos.pedidosDia.reduce((acc, fila) => acc + fila.entregados, 0);
  const totalVentas = datos.pedidosDia.reduce((acc, fila) => acc + fila.ventas, 0);
  const ticketPromedio = totalEntregados ? totalVentas / totalEntregados : 0;

  const productosOrdenados = useMemo(
    () => [...datos.productos].sort(ORDENES_PRODUCTOS[ordenProductos].fn),
    [datos.productos, ordenProductos]
  );
  const productosMasVendidos = useMemo(
    () => [...datos.productos].sort(ORDENES_PRODUCTOS.unidades_desc.fn).slice(0, 3),
    [datos.productos]
  );
  const productosMayorFacturacion = useMemo(
    () => [...datos.productos].sort(ORDENES_PRODUCTOS.facturacion_desc.fn).slice(0, 3),
    [datos.productos]
  );
  const promocionesMasUtilizadas = useMemo(
    () => [...datos.promociones].sort((a, b) => b.cantidad_pedidos - a.cantidad_pedidos).slice(0, 3),
    [datos.promociones]
  );

  if (!isStaff) {
    return (
      <p className="p-8 text-center text-danger">
        Acceso denegado — Solo personal autorizado puede ver reportes.{" "}
        <Link to="/" className="text-primary underline">Volver al inicio</Link>
      </p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">
          Reportes{sucursalActual ? ` — ${sucursalActual.nombre}` : ""}
        </h1>
        <p className="text-sm text-text-soft">
          {isAdmin ? "Vista global con filtro opcional por sucursal." : "Vista de tu sucursal asignada."}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-border p-4 flex flex-wrap items-end gap-3">
        <label className="text-xs flex flex-col gap-1">
          Desde
          <input
            type="date"
            value={desde}
            max={hasta || undefined}
            onChange={(e) => setDesde(e.target.value)}
            className="border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-primary bg-white"
          />
        </label>
        <label className="text-xs flex flex-col gap-1">
          Hasta
          <input
            type="date"
            value={hasta}
            min={desde || undefined}
            onChange={(e) => setHasta(e.target.value)}
            className="border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-primary bg-white"
          />
        </label>
        <div className="flex gap-2 pb-0.5">
          <button type="button" onClick={() => aplicarRango(7)} className="text-xs border border-border rounded-pill px-3 py-1.5 hover:bg-background">7 días</button>
          <button type="button" onClick={() => aplicarRango(30)} className="text-xs border border-border rounded-pill px-3 py-1.5 hover:bg-background">30 días</button>
          <button type="button" onClick={() => aplicarRango(90)} className="text-xs border border-border rounded-pill px-3 py-1.5 hover:bg-background">90 días</button>
        </div>
        {isAdmin && (
          <label className="text-xs flex flex-col gap-1 ml-auto">
            Sucursal
            <select
              value={filtroSucursal}
              onChange={(e) => setFiltroSucursal(e.target.value)}
              className="border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:border-primary bg-white"
            >
              <option value="">Todas</option>
              {sucursales.map((s) => (
                <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
              tab === item.id
                ? "border-primary text-primary"
                : "border-transparent text-text-soft hover:text-text"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}
      {loading && <p className="text-sm text-text-soft">Cargando reportes...</p>}

      {!loading && !error && tab === "pedidos" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KpiCard label="Pedidos" value={entero(totalPedidos)} />
            <KpiCard label="Entregados" value={entero(totalEntregados)} />
            <KpiCard label="Cancelados" value={entero(datos.cancelados?.total || 0)} detalle={`${datos.cancelados?.porcentaje || 0}% del total`} />
            <KpiCard label="Ventas entregadas" value={dinero(totalVentas)} />
            <KpiCard label="Ticket promedio" value={dinero(ticketPromedio)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SectionCard titulo="Pedidos por día">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-background border-b border-border text-text-soft">
                    <tr>
                      <th className="text-left px-4 py-2">Fecha</th>
                      <th className="text-right px-4 py-2">Pedidos</th>
                      <th className="text-right px-4 py-2">Entregados</th>
                      <th className="text-right px-4 py-2">Cancelados</th>
                      <th className="text-right px-4 py-2">Ventas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.pedidosDia.map((fila) => (
                      <tr key={fila.fecha} className="border-b border-border">
                        <td className="px-4 py-2">{formatFecha(fila.fecha)}</td>
                        <td className="px-4 py-2 text-right font-bold">{entero(fila.total)}</td>
                        <td className="px-4 py-2 text-right text-success">{entero(fila.entregados)}</td>
                        <td className="px-4 py-2 text-right text-danger">{entero(fila.cancelados)}</td>
                        <td className="px-4 py-2 text-right font-medium">{dinero(fila.ventas)}</td>
                      </tr>
                    ))}
                    {datos.pedidosDia.length === 0 && (
                      <tr><td colSpan={5} className="p-6 text-center text-text-soft">Sin pedidos en el período</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard titulo="Pedidos por estado">
              <BarList items={datos.pedidosEstado} labelKey="estado" valueKey="cantidad" />
            </SectionCard>
          </div>

          <SectionCard titulo="Pedidos por sucursal">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border text-text-soft">
                  <tr>
                    <th className="text-left px-4 py-2">Sucursal</th>
                    <th className="text-right px-4 py-2">Pedidos</th>
                    <th className="text-right px-4 py-2">Atendidos</th>
                    <th className="text-right px-4 py-2">Cancelados</th>
                    <th className="text-right px-4 py-2">Ventas</th>
                    <th className="text-right px-4 py-2">Ticket promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.sucursales.map((fila) => (
                    <tr key={fila.id_sucursal} className="border-b border-border">
                      <td className="px-4 py-2 font-medium">{fila.nombre}</td>
                      <td className="px-4 py-2 text-right">{entero(fila.total_pedidos)}</td>
                      <td className="px-4 py-2 text-right text-success font-bold">{entero(fila.entregados)}</td>
                      <td className="px-4 py-2 text-right text-danger">{entero(fila.cancelados)}</td>
                      <td className="px-4 py-2 text-right font-medium">{dinero(fila.ventas)}</td>
                      <td className="px-4 py-2 text-right">{dinero(fila.ticket_promedio)}</td>
                    </tr>
                  ))}
                  {datos.sucursales.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-text-soft">Sin datos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard
            titulo="Pedidos cancelados"
            extra={<span className="text-xs text-text-soft">Total: {entero(datos.cancelados?.total || 0)} · {datos.cancelados?.porcentaje || 0}%</span>}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
              <div className="md:col-span-1">
                <h4 className="text-xs font-semibold text-text-soft mb-2">Por día</h4>
                <BarList items={datos.cancelados?.por_dia || []} labelKey="fecha" valueKey="cantidad" formatLabel={formatFecha} empty="Sin cancelaciones" />
              </div>
              <div className="md:col-span-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-background border-b border-border text-text-soft">
                    <tr>
                      <th className="text-left px-4 py-2">Pedido</th>
                      <th className="text-left px-4 py-2">Fecha</th>
                      <th className="text-left px-4 py-2">Cliente</th>
                      <th className="text-left px-4 py-2">Sucursal</th>
                      <th className="text-right px-4 py-2">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(datos.cancelados?.pedidos || []).map((pedido) => (
                      <tr key={pedido.id_pedido} className="border-b border-border">
                        <td className="px-4 py-2 font-bold text-primary">#{pedido.id_pedido}</td>
                        <td className="px-4 py-2 text-text-soft">{formatFechaHora(pedido.fecha_hora)}</td>
                        <td className="px-4 py-2">{pedido.cliente}</td>
                        <td className="px-4 py-2 text-text-soft">{pedido.sucursal || "—"}</td>
                        <td className="px-4 py-2 text-right">{dinero(pedido.importe)}</td>
                      </tr>
                    ))}
                    {(datos.cancelados?.pedidos || []).length === 0 && (
                      <tr><td colSpan={5} className="p-6 text-center text-text-soft">Sin pedidos cancelados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {!loading && !error && tab === "clientes" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Clientes nuevos" value={entero(datos.clientesNuevos?.total || 0)} />
            <KpiCard label="Clientes inactivos" value={entero(datos.clientesInactivos.length)} detalle={`Sin pedidos hace ${diasInactivos} días`} />
            <KpiCard label="Top mostrado" value={entero(datos.clientesTop.length)} />
            <KpiCard label="Tiempo promedio" value={minutos(datos.tiempoEntrega?.promedio_minutos)} detalle={`${datos.tiempoEntrega?.pedidos_considerados || 0} entregas`} />
          </div>

          <div className="bg-white rounded-lg border border-border p-4 flex flex-wrap gap-3">
            <label className="text-xs flex flex-col gap-1">
              Agrupación de nuevos
              <select value={agrupacion} onChange={(e) => setAgrupacion(e.target.value)} className="border border-border rounded-md px-2 py-1.5 text-sm bg-white">
                <option value="dia">Por día</option>
                <option value="semana">Por semana</option>
                <option value="mes">Por mes</option>
              </select>
            </label>
            <label className="text-xs flex flex-col gap-1">
              Días para inactivos
              <select value={diasInactivos} onChange={(e) => setDiasInactivos(Number(e.target.value))} className="border border-border rounded-md px-2 py-1.5 text-sm bg-white">
                {[...new Set([15, 30, 60, 90, diasInactivos])]
                  .sort((a, b) => a - b)
                  .map((dias) => (
                    <option key={dias} value={dias}>{dias} días</option>
                  ))}
              </select>
            </label>
            <label className="text-xs flex flex-col gap-1">
              Límite del ranking
              <select value={limiteTop} onChange={(e) => setLimiteTop(Number(e.target.value))} className="border border-border rounded-md px-2 py-1.5 text-sm bg-white">
                {[...new Set([5, 10, 20, limiteTop])]
                  .sort((a, b) => a - b)
                  .map((limite) => (
                    <option key={limite} value={limite}>Top {limite}</option>
                  ))}
              </select>
            </label>
          </div>

          <SectionCard titulo="Clientes con mayor cantidad de pedidos">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border text-text-soft">
                  <tr>
                    <th className="text-left px-4 py-2">Cliente</th>
                    <th className="text-left px-4 py-2">Email</th>
                    <th className="text-right px-4 py-2">Entregados</th>
                    <th className="text-right px-4 py-2">Totales</th>
                    <th className="text-right px-4 py-2">Gastado</th>
                    <th className="text-left px-4 py-2">Último pedido</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.clientesTop.map((cliente) => (
                    <tr key={cliente.id_cliente} className="border-b border-border">
                      <td className="px-4 py-2 font-medium">{cliente.nombre} {cliente.apellido}</td>
                      <td className="px-4 py-2 text-text-soft">{cliente.email}</td>
                      <td className="px-4 py-2 text-right font-bold text-primary">{entero(cliente.pedidos_entregados)}</td>
                      <td className="px-4 py-2 text-right">{entero(cliente.pedidos_totales)}</td>
                      <td className="px-4 py-2 text-right">{dinero(cliente.total_gastado)}</td>
                      <td className="px-4 py-2 text-text-soft">{formatFechaHora(cliente.ultimo_pedido)}</td>
                    </tr>
                  ))}
                  {datos.clientesTop.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-text-soft">Sin datos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SectionCard titulo="Clientes nuevos por período">
              <BarList items={datos.clientesNuevos?.serie || []} labelKey="periodo" valueKey="cantidad" formatLabel={formatFecha} empty="Sin clientes nuevos" />
            </SectionCard>
            <SectionCard titulo="Detalle de clientes nuevos">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-background border-b border-border text-text-soft">
                    <tr>
                      <th className="text-left px-4 py-2">Cliente</th>
                      <th className="text-left px-4 py-2">Email</th>
                      <th className="text-left px-4 py-2">Primer pedido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(datos.clientesNuevos?.clientes || []).map((cliente) => (
                      <tr key={cliente.id_cliente} className="border-b border-border">
                        <td className="px-4 py-2 font-medium">{cliente.nombre} {cliente.apellido}</td>
                        <td className="px-4 py-2 text-text-soft">{cliente.email}</td>
                        <td className="px-4 py-2 text-text-soft">{formatFechaHora(cliente.primer_pedido)}</td>
                      </tr>
                    ))}
                    {(datos.clientesNuevos?.clientes || []).length === 0 && (
                      <tr><td colSpan={3} className="p-6 text-center text-text-soft">Sin datos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          <SectionCard titulo="Clientes inactivos">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border text-text-soft">
                  <tr>
                    <th className="text-left px-4 py-2">Cliente</th>
                    <th className="text-left px-4 py-2">Email</th>
                    <th className="text-left px-4 py-2">Último pedido</th>
                    <th className="text-right px-4 py-2">Días inactivo</th>
                    <th className="text-right px-4 py-2">Pedidos entregados</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.clientesInactivos.map((cliente) => (
                    <tr key={cliente.id_cliente} className="border-b border-border">
                      <td className="px-4 py-2 font-medium">{cliente.nombre} {cliente.apellido}</td>
                      <td className="px-4 py-2 text-text-soft">{cliente.email}</td>
                      <td className="px-4 py-2 text-text-soft">{formatFechaHora(cliente.ultimo_pedido)}</td>
                      <td className="px-4 py-2 text-right font-bold text-danger">{entero(cliente.dias_inactivo)}</td>
                      <td className="px-4 py-2 text-right">{entero(cliente.pedidos_entregados)}</td>
                    </tr>
                  ))}
                  {datos.clientesInactivos.length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-text-soft">Sin clientes inactivos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {!loading && !error && tab === "sucursales" && (
        <div className="space-y-5">
          <SectionCard titulo="Ventas y pedidos atendidos por sucursal">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border text-text-soft">
                  <tr>
                    <th className="text-left px-4 py-2">Sucursal</th>
                    <th className="text-right px-4 py-2">Pedidos</th>
                    <th className="text-right px-4 py-2">Atendidos</th>
                    <th className="text-right px-4 py-2">Cancelados</th>
                    <th className="text-right px-4 py-2">Ventas</th>
                    <th className="text-right px-4 py-2">Ticket promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.sucursales.map((fila) => (
                    <tr key={fila.id_sucursal} className="border-b border-border">
                      <td className="px-4 py-2 font-medium">{fila.nombre}</td>
                      <td className="px-4 py-2 text-right">{entero(fila.total_pedidos)}</td>
                      <td className="px-4 py-2 text-right font-bold text-success">{entero(fila.entregados)}</td>
                      <td className="px-4 py-2 text-right text-danger">{entero(fila.cancelados)}</td>
                      <td className="px-4 py-2 text-right font-medium">{dinero(fila.ventas)}</td>
                      <td className="px-4 py-2 text-right">{dinero(fila.ticket_promedio)}</td>
                    </tr>
                  ))}
                  {datos.sucursales.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-text-soft">Sin datos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard titulo="Productos vendidos por sucursal">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border text-text-soft">
                  <tr>
                    <th className="text-left px-4 py-2">Sucursal</th>
                    <th className="text-left px-4 py-2">Producto</th>
                    <th className="text-right px-4 py-2">Unidades</th>
                    <th className="text-right px-4 py-2">Facturación</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.productosSucursal.map((fila) => (
                    <tr key={`${fila.id_sucursal}-${fila.id_producto}`} className="border-b border-border">
                      <td className="px-4 py-2 text-text-soft">{fila.sucursal}</td>
                      <td className="px-4 py-2 font-medium">{fila.producto}</td>
                      <td className="px-4 py-2 text-right font-bold">{entero(fila.unidades_vendidas)}</td>
                      <td className="px-4 py-2 text-right">{dinero(fila.facturacion)}</td>
                    </tr>
                  ))}
                  {datos.productosSucursal.length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-text-soft">Sin ventas entregadas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {!loading && !error && tab === "productos" && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row gap-4">
            <RankingCard titulo="Productos más vendidos" items={productosMasVendidos} metrica={(p) => `${p.unidades_vendidas} u.`} destaque="border-green-200 bg-green-50" />
            <RankingCard titulo="Mayor facturación" items={productosMayorFacturacion} metrica={(p) => dinero(p.facturacion)} destaque="border-amber-200 bg-amber-50" />
          </div>

          <SectionCard
            titulo={`Lista de productos (${productosOrdenados.length})`}
            extra={
              <label className="text-xs flex items-center gap-2">
                Ordenar por
                <select value={ordenProductos} onChange={(e) => setOrdenProductos(e.target.value)} className="border border-border rounded-md px-2 py-1 text-sm bg-white">
                  {Object.entries(ORDENES_PRODUCTOS).map(([clave, valor]) => (
                    <option key={clave} value={clave}>{valor.label}</option>
                  ))}
                </select>
              </label>
            }
          >
            <div className="overflow-x-auto">
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
                  {productosOrdenados.map((producto) => (
                    <tr key={producto.id_producto} className="border-b border-border">
                      <td className="px-4 py-2 font-bold text-primary">#{producto.id_producto}</td>
                      <td className="px-4 py-2 font-medium">{producto.nombre}</td>
                      <td className="px-4 py-2 text-text-soft">{producto.estado}</td>
                      <td className="px-4 py-2 text-right font-bold">{entero(producto.unidades_vendidas)}</td>
                      <td className="px-4 py-2 text-right">{entero(producto.cantidad_pedidos)}</td>
                      <td className="px-4 py-2 text-right font-bold text-primary">{dinero(producto.facturacion)}</td>
                    </tr>
                  ))}
                  {productosOrdenados.length === 0 && (
                    <tr><td colSpan={6} className="p-6 text-center text-text-soft">Sin productos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {!loading && !error && tab === "promociones" && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row gap-4">
            <RankingCard
              titulo="Promociones más utilizadas"
              items={promocionesMasUtilizadas}
              metrica={(p) => `${p.cantidad_pedidos} pedidos`}
              destaque="border-green-200 bg-green-50"
              clave="id_promocion"
            />
            <RankingCard
              titulo="Mayor facturación"
              items={[...datos.promociones].sort((a, b) => b.facturacion - a.facturacion).slice(0, 3)}
              metrica={(p) => dinero(p.facturacion)}
              destaque="border-amber-200 bg-amber-50"
              clave="id_promocion"
            />
          </div>

          <SectionCard titulo={`Uso de promociones (${datos.promociones.length})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border text-text-soft">
                  <tr>
                    <th className="text-left px-4 py-2">#</th>
                    <th className="text-left px-4 py-2">Promoción</th>
                    <th className="text-left px-4 py-2">Tipo</th>
                    <th className="text-left px-4 py-2">Estado</th>
                    <th className="text-right px-4 py-2">Combos vendidos</th>
                    <th className="text-right px-4 py-2">Pedidos</th>
                    <th className="text-right px-4 py-2">Ticket promedio</th>
                    <th className="text-right px-4 py-2">Facturación</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.promociones.map((promocion) => (
                    <tr key={promocion.id_promocion} className="border-b border-border">
                      <td className="px-4 py-2 font-bold text-primary">#{promocion.id_promocion}</td>
                      <td className="px-4 py-2 font-medium">{promocion.nombre}</td>
                      <td className="px-4 py-2 text-text-soft">{promocion.tipo}</td>
                      <td className="px-4 py-2 text-text-soft">{promocion.activa ? "Activa" : "Inactiva"}</td>
                      <td className="px-4 py-2 text-right font-bold">{entero(promocion.unidades_vendidas)}</td>
                      <td className="px-4 py-2 text-right">{entero(promocion.cantidad_pedidos)}</td>
                      <td className="px-4 py-2 text-right">{dinero(promocion.ticket_promedio)}</td>
                      <td className="px-4 py-2 text-right font-bold text-primary">{dinero(promocion.facturacion)}</td>
                    </tr>
                  ))}
                  {datos.promociones.length === 0 && (
                    <tr><td colSpan={8} className="p-6 text-center text-text-soft">Sin promociones</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard titulo="Impacto sobre las ventas">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              <div>
                <h4 className="text-xs font-semibold text-text-soft mb-2">Participación en ventas</h4>
                <BarList
                  items={datos.impacto}
                  labelKey="nombre"
                  valueKey="participacion_ventas_pct"
                  formatValue={(valor) => `${valor}%`}
                  empty="Sin ventas de promociones"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-background border-b border-border text-text-soft">
                    <tr>
                      <th className="text-left px-4 py-2">Promoción</th>
                      <th className="text-right px-4 py-2">Venta promo</th>
                      <th className="text-right px-4 py-2">Venta total</th>
                      <th className="text-right px-4 py-2">Participación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.impacto.map((fila) => (
                      <tr key={fila.id_promocion} className="border-b border-border">
                        <td className="px-4 py-2 font-medium">{fila.nombre}</td>
                        <td className="px-4 py-2 text-right">{dinero(fila.facturacion_promocion)}</td>
                        <td className="px-4 py-2 text-right text-text-soft">{dinero(fila.facturacion_total)}</td>
                        <td className="px-4 py-2 text-right font-bold text-primary">{fila.participacion_ventas_pct}%</td>
                      </tr>
                    ))}
                    {datos.impacto.length === 0 && (
                      <tr><td colSpan={4} className="p-6 text-center text-text-soft">Sin datos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
