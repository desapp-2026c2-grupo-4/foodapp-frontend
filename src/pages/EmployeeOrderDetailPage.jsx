import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPedidoById, updatePedidoEstado } from "../services/pedidoService.js";
import StatusBadge, { ESTADOS_EMPLEADO } from "../components/StatusBadge.jsx";

function formatFecha(fecha) {
  return new Date(fecha).toLocaleString("es-AR", { dateStyle: "long", timeStyle: "medium" });
}

export default function EmployeeOrderDetailPage() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchPedido = async () => {
    try {
      const data = await getPedidoById(id);
      setPedido(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPedido(); }, [id]);

  // Flujo en un solo sentido: Pendiente -> Confirmado -> Preparando -> En camino -> Entregado
  const idxActual = ESTADOS_EMPLEADO.indexOf(pedido?.estado);
  const siguiente = idxActual !== -1 && idxActual < ESTADOS_EMPLEADO.length - 1
    ? ESTADOS_EMPLEADO[idxActual + 1]
    : null;

  const handleAvanzar = async () => {
    if (!siguiente) return;
    setUpdating(true);
    setMsg("");
    try {
      const actualizado = await updatePedidoEstado(id, siguiente);
      setPedido(actualizado);
      setMsg(`Estado actualizado a ${siguiente}`);
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="p-8 text-center text-text-soft">Cargando pedido #{id}...</p>;
  if (error) return <p className="p-8 text-center text-danger">Error: {error} <Link to="/empleados/pedidos" className="text-primary underline">Volver</Link></p>;
  if (!pedido) return null;

  const dir = pedido.direccion;
  const cli = pedido.cliente;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <Link to="/empleados/pedidos" className="text-sm text-primary hover:underline">← Volver a pedidos</Link>

      <div className="bg-white rounded-lg border border-border p-6 space-y-6">
        <div className="flex flex-wrap justify-between gap-4 items-start">
          <div>
            <h1 className="text-2xl font-extrabold">Pedido <span className="text-primary">#{pedido.id_pedido}</span></h1>
            <p className="text-sm text-text-soft">Fecha y hora: {formatFecha(pedido.fecha_hora)}</p>
            <p className="text-sm text-text-soft">Cliente: <span className="font-medium text-text">{cli?.nombre} {cli?.apellido}</span> ({cli?.email})</p>
          </div>
          <StatusBadge estado={pedido.estado} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-background rounded-md p-4 border border-border">
            <h3 className="font-semibold text-sm mb-2">Dirección de entrega</h3>
            {dir ? (
              <p className="text-sm leading-relaxed">
                {dir.calle} {dir.altura}{dir.piso ? `, Piso ${dir.piso}` : ""}{dir.departamento ? ` Dto ${dir.departamento}` : ""}<br />
                {dir.ciudad}, {dir.provincia}<br />
                <span className="text-xs text-text-soft">Lat: {dir.latitud} Lng: {dir.longitud}</span>
              </p>
            ) : <p className="text-sm text-text-soft">Sin dirección</p>}
          </div>

          <div className="bg-background rounded-md p-4 border border-border">
            <h3 className="font-semibold text-sm mb-2">Resumen</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-text-soft">Importe total</span><span className="font-bold text-primary text-base">${parseFloat(pedido.importe).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-text-soft">Sucursal</span><span className="font-medium">{pedido.sucursal?.nombre || "—"}</span></div>
              <div className="flex justify-between"><span className="text-text-soft">Productos</span><span className="font-medium">{pedido.detalles?.length || 0}</span></div>
            </div>
          </div>
        </div>

          <div>
            <h3 className="font-semibold mb-3">Productos y cantidades</h3>
            <div className="space-y-2">
              {pedido.detalles?.map((d) => (
                <div key={d.id_detalle} className="flex flex-col sm:flex-row gap-4 sm:items-start border border-border rounded-md p-3 bg-white">
                  <div className="w-full h-40 sm:w-16 sm:h-16 bg-background rounded-sm flex items-center justify-center overflow-hidden shrink-0">
                    {d.producto?.imagen ? <img src={d.producto.imagen} alt={d.producto.nombre} className="w-full h-full object-cover" /> : <span className="text-xs text-text-soft">Sin img</span>}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{d.producto?.nombre || `Producto #${d.id_producto}`}</p>
                    {d.promocion && (
                      <span className="inline-block mt-1 text-[11px] font-bold bg-accent text-white px-2 py-0.5 rounded-pill">
                        Promo: {d.promocion.nombre}
                      </span>
                    )}
                    <p className="text-xs text-text-soft">{d.producto?.descripcion}</p>
                    <p className="text-xs mt-1">Cantidad: <span className="font-bold">{d.cantidad}</span> × Precio unit. (con opcionales): ${parseFloat(d.precio).toFixed(2)} = <span className="font-bold text-primary">${(d.cantidad * parseFloat(d.precio)).toFixed(2)}</span></p>
                    {d.opciones?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {d.opciones.map((o) => (
                          <span key={o.id_detalle_opcional} className="text-xs bg-background border border-border px-2 py-0.5 rounded-pill">
                            {o.opcional?.nombre} {parseFloat(o.precio) > 0 && `+$${parseFloat(o.precio).toFixed(2)}`}
                          </span>
                        ))}
                      </div>
                    )}
                    {d.observaciones && <p className="text-xs text-text-soft mt-1">Obs: {d.observaciones}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

        <div className="border-t border-border pt-4 space-y-3">
          <h3 className="font-semibold text-sm">Avanzar estado</h3>
          <ol className="flex flex-wrap items-center gap-1 text-xs">
            {ESTADOS_EMPLEADO.map((est, i) => {
              const pasado = idxActual !== -1 && i < idxActual;
              const actual = i === idxActual;
              return (
                <li key={est} className="flex items-center gap-1">
                  {i > 0 && <span className="text-text-soft mx-1">→</span>}
                  <span className={`px-2.5 py-1 rounded-pill border font-semibold ${actual ? "bg-primary text-white border-primary" : pasado ? "bg-green-50 text-success border-green-200" : "bg-white text-text-soft border-border"}`}>
                    {est === "Preparando" ? "En preparación" : est}
                  </span>
                </li>
              );
            })}
          </ol>
          {siguiente ? (
            <button
              onClick={handleAvanzar}
              disabled={updating}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-pill font-semibold disabled:opacity-50"
            >
              {updating ? "Actualizando..." : `Avanzar a ${siguiente === "Preparando" ? "En preparación" : siguiente}`}
            </button>
          ) : (
            <p className="text-sm font-semibold text-success">Pedido finalizado — no hay más estados a los que avanzar.</p>
          )}
          {msg && <p className={`text-sm p-2 rounded-md ${msg.startsWith("Error") ? "bg-red-50 text-danger border border-red-200" : "bg-green-50 text-success border border-green-200"}`}>{msg}</p>}
          <p className="text-xs text-text-soft">El flujo es en un solo sentido (pendiente → confirmado → en preparación → en camino → entregado): no se puede volver a un estado anterior — se persiste con <code className="bg-background border border-border px-1 rounded-sm">PUT /api/pedidos/:id</code> y genera historial.</p>
        </div>

        {pedido.historial?.length > 0 && (
          <div className="border-t border-border pt-4">
            <h3 className="font-semibold text-sm mb-2">Historial</h3>
            <ul className="space-y-1 text-xs text-text-soft">
              {[...pedido.historial].sort((a,b)=> new Date(a.fecha_hora)-new Date(b.fecha_hora)).map((h)=> (
                <li key={h.id_historial} className="flex justify-between border border-border rounded-sm px-3 py-1 bg-background">
                  <span>{h.estado}</span><span>{new Date(h.fecha_hora).toLocaleString("es-AR")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
