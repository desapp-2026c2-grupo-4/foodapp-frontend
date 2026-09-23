import { Link } from "react-router-dom";

export default function OrderConfirmation({ pedido, onClose }) {
  if (!pedido) return null;
  const fecha = new Date(pedido.fecha_hora).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg border border-border max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="p-6 text-center border-b border-border">
          <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-success">✓</span>
          </div>
          <h2 className="text-2xl font-extrabold text-text">¡Pedido confirmado!</h2>
          <p className="text-sm text-text-soft mt-1">Tu pedido se generó correctamente</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-background rounded-md p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-soft">N° Pedido</span>
              <span className="font-bold text-primary">#{pedido.id_pedido}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-soft">Fecha</span>
              <span className="font-medium">{fecha}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-soft">Estado</span>
              <span className="font-semibold bg-accent text-white text-xs px-2 py-0.5 rounded-pill">{pedido.estado}</span>
            </div>
            {pedido.sucursal && (
              <div className="flex justify-between">
                <span className="text-text-soft">Sucursal</span>
                <span className="font-medium">{pedido.sucursal.nombre}</span>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Productos</h3>
            <div className="space-y-2">
              {pedido.detalles?.map((d) => (
                <div key={d.id_detalle} className="flex justify-between text-sm border border-border rounded-md px-3 py-2 bg-white">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{d.producto?.nombre || `Producto #${d.id_producto}`}</span>
                    <span className="text-text-soft"> x{d.cantidad}</span>
                    {d.promocion && (
                      <span className="ml-2 text-[11px] font-bold bg-accent text-white px-2 py-0.5 rounded-pill">
                        Promo: {d.promocion.nombre}
                      </span>
                    )}
                    {d.opciones?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {d.opciones.map((o) => (
                          <span key={o.id_detalle_opcional} className="text-xs bg-background border border-border px-2 py-0.5 rounded-pill">
                            {o.opcional?.nombre} {parseFloat(o.precio) > 0 && `+$${parseFloat(o.precio).toFixed(2)}`}
                          </span>
                        ))}
                      </div>
                    )}
                    {d.observaciones && <p className="text-xs text-text-soft">Obs: {d.observaciones}</p>}
                  </div>
                  <span className="font-semibold shrink-0 ml-3">${(parseFloat(d.precio) * d.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between font-extrabold text-lg border-t border-border pt-4">
            <span>Total pagado</span>
            <span className="text-primary">${parseFloat(pedido.importe).toFixed(2)}</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-border bg-white py-2.5 rounded-pill font-semibold hover:bg-background">
              Cerrar
            </button>
            <Link to="/catalogo" onClick={onClose} className="flex-1 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-pill font-semibold text-center">
              Seguir comprando
            </Link>
          </div>
          <p className="text-xs text-text-soft text-center">Podés seguir el estado en historial de pedidos</p>
        </div>
      </div>
    </div>
  );
}
