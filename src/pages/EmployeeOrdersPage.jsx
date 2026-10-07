import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getPedidos, updateDetallePreparado } from "../services/pedidoService.js";
import { getSucursalById, getSucursales } from "../services/sucursalService.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const FILTRO_TODOS = "Todos";
const ESTADOS_FILTRO = ["Pendiente", "Confirmado", "Preparando", "En camino", "Entregado", "Cancelado"];

function formatFecha(fecha) {
  return new Date(fecha).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

function formatDireccion(dir) {
  if (!dir) return "—";
  return `${dir.calle} ${dir.altura}${dir.piso ? ` ${dir.piso}` : ""}, ${dir.ciudad} (${dir.provincia})`;
}

export default function EmployeeOrdersPage() {
  const { user, isAdmin } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [sucursal, setSucursal] = useState(null);
  const [sucursales, setSucursales] = useState([]);
  const [filtroSucursal, setFiltroSucursal] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState(FILTRO_TODOS);
  const [msg, setMsg] = useState("");
  const [marcando, setMarcando] = useState(null); // id_detalle en curso

  // El empleado ve solo los pedidos de su sucursal; el admin ve todos
  const idSucursalEmpleado = !isAdmin ? user?.id_sucursal : null;

  // Sucursal efectiva: el empleado solo ve la suya, el admin puede filtrar
  const sucursalEfectiva = isAdmin ? (filtroSucursal || null) : idSucursalEmpleado;

  const fetchPedidos = async () => {
    setLoading(true);
    setError("");
    try {
      if (!isAdmin && !user?.id_sucursal) {
        setPedidos([]);
        setError("No tenés sucursal asignada. Pedile a un administrador que te asigne una.");
        return;
      }
      const params = sucursalEfectiva ? { id_sucursal: sucursalEfectiva } : {};
      const [lista, suc, todas] = await Promise.all([
        getPedidos(params),
        sucursalEfectiva ? getSucursalById(sucursalEfectiva) : Promise.resolve(null),
        isAdmin ? getSucursales() : Promise.resolve([]),
      ]);
      setPedidos(lista);
      setSucursal(suc);
      if (isAdmin) setSucursales(todas);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPedidos(); }, [user?.id_sucursal, isAdmin, filtroSucursal]);

  const conteos = useMemo(() => {
    const c = { [FILTRO_TODOS]: pedidos.length };
    for (const est of ESTADOS_FILTRO) c[est] = pedidos.filter((p) => p.estado === est).length;
    return c;
  }, [pedidos]);

  const filtrados = useMemo(() => (
    filtroEstado === FILTRO_TODOS ? pedidos : pedidos.filter((p) => p.estado === filtroEstado)
  ), [pedidos, filtroEstado]);

  const handleTogglePreparado = async (pedido, detalle) => {
    setMarcando(detalle.id_detalle);
    setMsg("");
    try {
      const r = await updateDetallePreparado(pedido.id_pedido, detalle.id_detalle, !detalle.preparado);
      if (r.pedidoAvanzadoA) {
        setMsg(`Pedido #${pedido.id_pedido} avanzado a ${r.pedidoAvanzadoA}: todos los items confirmados.`);
      }
      const params = sucursalEfectiva ? { id_sucursal: sucursalEfectiva } : {};
      const actualizados = await getPedidos(params);
      setPedidos(actualizados);
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setMarcando(null);
    }
  };

  // Checkbox de confirmación por item (solo pedidos en preparación)
  const checkItem = (p, d) => (
    p.estado === "Preparando" ? (
      <input
        type="checkbox"
        checked={!!d.preparado}
        disabled={marcando === d.id_detalle}
        onChange={() => handleTogglePreparado(p, d)}
        title={d.preparado ? "Marcar como pendiente" : "Confirmar item preparado"}
        className="h-4 w-4 shrink-0 rounded-sm border-border text-success focus:ring-success cursor-pointer disabled:opacity-50"
      />
    ) : null
  );

  if (loading) return <p className="p-8 text-center text-text-soft">Cargando pedidos...</p>;
  if (error) return <p className="p-8 text-center text-danger">Error: {error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text">Pedidos — Vista Empleados</h1>
        <p className="text-sm text-text-soft">
          {isAdmin
            ? `${sucursal ? `Pedidos de ${sucursal.nombre}` : "Todos los pedidos"}. Total: ${pedidos.length}`
            : `Pedidos de tu sucursal${sucursal ? ` (${sucursal.nombre})` : ""}. Total: ${pedidos.length}`}
        </p>
      </div>

      {/* Filtro por sucursal (solo admin) */}
      {isAdmin && (
        <label className="text-xs flex items-center gap-2">
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

      {/* Filtro por estado */}
      <div className="flex flex-wrap gap-2">
        {[FILTRO_TODOS, ...ESTADOS_FILTRO].map((est) => (
          <button
            key={est}
            onClick={() => setFiltroEstado(est)}
            className={`text-xs px-4 py-1.5 rounded-pill border font-semibold transition ${filtroEstado === est ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary hover:text-primary"}`}
          >
            {est} ({conteos[est] ?? 0})
          </button>
        ))}
      </div>

      {msg && <p className={`text-sm p-2 rounded-md border ${msg.startsWith("Error") ? "bg-red-50 text-danger border-red-200" : "bg-green-50 text-success border-green-200"}`}>{msg}</p>}

      {/* Tarjetas apiladas en una columna (mobile) */}
      <div className="md:hidden space-y-3">
        {filtrados.map((p) => (
          <div key={p.id_pedido} className="bg-white rounded-lg border border-border p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-primary">Pedido #{p.id_pedido}</span>
              <StatusBadge estado={p.estado} />
            </div>
            <p className="text-xs text-text-soft">{formatFecha(p.fecha_hora)}</p>
            <div>
              <p className="text-xs font-semibold text-text-soft mb-1">Productos</p>
              <ul className="space-y-1.5 text-sm">
                {p.detalles?.map((d) => (
                  <li key={d.id_detalle} className="flex items-center gap-2 leading-tight">
                    {checkItem(p, d)}
                    <span className={d.preparado ? "line-through text-text-soft" : ""}>
                      <span className="font-medium">{d.producto?.nombre || `Prod #${d.id_producto}`}</span>
                      <span className="text-text-soft"> x{d.cantidad}</span>
                    </span>
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
        {filtrados.length === 0 && (
          <p className="bg-white rounded-lg border border-border p-8 text-center text-text-soft">No hay pedidos con ese estado</p>
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
              {filtrados.map((p) => (
                <tr key={p.id_pedido} className="border-b border-border hover:bg-background/60">
                  <td className="px-4 py-3 font-bold text-primary">#{p.id_pedido}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatFecha(p.fecha_hora)}</td>
                  <td className="px-4 py-3"><StatusBadge estado={p.estado} /></td>
                  <td className="px-4 py-3">
                    <ul className="space-y-1.5">
                      {p.detalles?.map((d) => (
                        <li key={d.id_detalle} className="flex items-center gap-2 leading-tight">
                          {checkItem(p, d)}
                          <span className={d.preparado ? "line-through text-text-soft" : ""}>
                            <span className="font-medium">{d.producto?.nombre || `Prod #${d.id_producto}`}</span>
                            <span className="text-text-soft"> x{d.cantidad}</span>
                          </span>
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
              {filtrados.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-text-soft">No hay pedidos con ese estado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
