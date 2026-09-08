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

  const handleEstadoChange = async (nuevo) => {
    if (nuevo === pedido.estado) return;
    setUpdating(true);
    setMsg("");
    try {
      const actualizado = await updatePedidoEstado(id, nuevo);
      setPedido(actualizado);
      setMsg(`Estado actualizado a ${nuevo}`);
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
              <div key={d.id_detalle} className="flex gap-4 items-start border border-border rounded-md p-3 bg-white">
                <div className="w-16 h-16 bg-background rounded-sm flex items-center justify-center overflow-hidden shrink-0">
                  {d.producto?.imagen ? <img src={d.producto.imagen} alt={d.producto.nombre} className="w-full h-full object-cover" /> : <span className="text-xs text-text-soft">Sin img</span>}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{d.producto?.nombre || `Producto #${d.id_producto}`}</p>
                  <p className="text-xs text-text-soft">{d.producto?.descripcion}</p>
                  <p className="text-xs mt-1">Cantidad: <span className="font-bold">{d.cantidad}</span> × Precio: ${parseFloat(d.precio).toFixed(2)} = <span className="font-bold text-primary">${(d.cantidad * parseFloat(d.precio)).toFixed(2)}</span></p>
                  {d.observaciones && <p className="text-xs text-text-soft mt-1">Obs: {d.observaciones}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <h3 className="font-semibold text-sm">Cambiar estado</h3>
          <div className="flex flex-wrap gap-2">
            {ESTADOS_EMPLEADO.map((est) => (
              <button
                key={est}
                onClick={() => handleEstadoChange(est)}
                disabled={updating || pedido.estado === est}
                className={`px-4 py-1.5 rounded-pill text-sm font-semibold border ${pedido.estado === est ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary hover:text-primary"} disabled:opacity-50`}
              >
                {est === "Preparando" ? "En preparación" : est}
              </button>
            ))}
          </div>
          {msg && <p className={`text-sm p-2 rounded-md ${msg.startsWith("Error") ? "bg-red-50 text-danger border border-red-200" : "bg-green-50 text-success border border-green-200"}`}>{msg}</p>}
          {updating && <p className="text-xs text-text-soft">Actualizando...</p>}
          <p className="text-xs text-text-soft">Estados disponibles: pendiente, confirmado, en preparación, en camino y entregado — se persiste con <code className="bg-background border border-border px-1 rounded-sm">PUT /api/pedidos/:id</code> y genera historial.</p>
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
