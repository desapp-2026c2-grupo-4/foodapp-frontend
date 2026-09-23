import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiFetch } from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";

export default function ClientHistoryPage() {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.rol !== "CLIENTE") { setLoading(false); return; }
    apiFetch(`/pedidos?id_cliente=${user.id_cliente}`)
      .then(setPedidos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return <p className="p-8 text-center">Debes <Link to="/" className="text-primary underline">elegir un usuario</Link></p>;
  if (user.rol !== "CLIENTE") return <p className="p-8 text-center text-text-soft">El historial es solo para clientes. Estás como <b>{user.rol}</b>. <Link to="/" className="text-primary underline">Cambiar usuario</Link></p>;
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando historial...</p>;
  if (error) return <p className="p-8 text-center text-danger">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-extrabold">Mi historial — {user.nombre} {user.apellido}</h1>
      <p className="text-sm text-text-soft">Pedidos del cliente #{user.id_cliente} — {pedidos.length} encontrados</p>

      {pedidos.length === 0 ? (
        <div className="bg-white border border-border rounded-lg p-8 text-center">
          <p className="text-text-soft">Aún no tienes pedidos</p>
          <Link to="/catalogo" className="inline-block mt-4 bg-primary text-white px-6 py-2 rounded-pill">Ir al catálogo</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((p) => (
            <div key={p.id_pedido} className="bg-white rounded-lg border border-border p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">Pedido <span className="text-primary">#{p.id_pedido}</span></p>
                  <p className="text-xs text-text-soft">{new Date(p.fecha_hora).toLocaleString("es-AR")} — {p.direccion?.calle} {p.direccion?.altura}, {p.direccion?.ciudad}</p>
                </div>
                <StatusBadge estado={p.estado} />
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {p.detalles?.map((d) => (
                  <li key={d.id_detalle} className="flex justify-between gap-4 border border-border rounded-md px-3 py-2 bg-background">
                    <div>
                      <span className="font-medium">{d.producto?.nombre} x{d.cantidad}</span>
                      {d.promocion && (
                        <span className="ml-2 text-[11px] font-bold bg-accent text-white px-2 py-0.5 rounded-pill">
                          Promo: {d.promocion.nombre}
                        </span>
                      )}
                      {d.opciones?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {d.opciones.map((o) => (
                            <span key={o.id_detalle_opcional} className="text-xs bg-white border border-border px-2 py-0.5 rounded-pill">
                              {o.opcional?.nombre} {parseFloat(o.opcional?.precio) > 0 && `+$${parseFloat(o.precio).toFixed(2)}`}
                            </span>
                          ))}
                        </div>
                      )}
                      {d.observaciones && <p className="text-xs text-text-soft mt-1">Obs: {d.observaciones}</p>}
                    </div>
                    <span className="font-semibold shrink-0">${(d.cantidad*parseFloat(d.precio)).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-bold border-t border-border pt-3 mt-3">
                <span>Total</span><span className="text-primary">${parseFloat(p.importe).toFixed(2)}</span>
              </div>
              <div className="mt-3">
                <p className="font-semibold text-sm mb-2">Seguimiento del pedido</p>
                {p.historial?.length > 0 ? (
                  <ol className="space-y-1.5">
                    {[...p.historial]
                      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
                      .map((h) => (
                        <li key={h.id_historial} className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          <StatusBadge estado={h.estado} />
                          <span className="text-text-soft">{new Date(h.fecha_hora).toLocaleString("es-AR")}</span>
                        </li>
                      ))}
                  </ol>
                ) : (
                  <p className="text-xs text-text-soft">Sin movimientos registrados.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
