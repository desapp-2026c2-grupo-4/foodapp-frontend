import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import CartItem from "../components/CartItem.jsx";
import OrderConfirmation from "../components/OrderConfirmation.jsx";

export default function CartPage() {
  const { items, total, clearCart, confirmCart, count } = useCart();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);

  const handleConfirm = async () => {
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      const pedido = await confirmCart({ id_cliente: 1, id_direccion: 1, id_sucursal: 1 });
      setPedidoConfirmado(pedido);
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-text">Carrito</h1>
        <Link to="/" className="text-sm text-primary hover:underline">← Seguir comprando</Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg border border-border p-8 text-center">
          <p className="text-text-soft">Tu carrito está vacío</p>
          <Link to="/" className="inline-block mt-4 bg-primary text-white px-6 py-2 rounded-pill font-semibold">Ver productos</Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <CartItem key={item.id_producto} item={item} />
            ))}
          </div>

          <div className="bg-white rounded-lg border border-border p-5 space-y-4">
            <div className="flex justify-between text-text-soft text-sm">
              <span>Productos ({count})</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-lg border-t border-border pt-3">
              <span>Total a pagar</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>

            {msg.text && (
              <div className="p-3 rounded-md text-sm bg-red-50 text-danger border border-red-200">
                {msg.text}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={clearCart} className="flex-1 border border-border bg-white py-2.5 rounded-pill font-semibold hover:bg-background">
                Vaciar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-pill font-semibold disabled:opacity-50"
              >
                {loading ? "Confirmando..." : "Confirmar pedido"}
              </button>
            </div>
            <p className="text-xs text-text-soft text-center">Al confirmar se crea un pedido con <span className="font-semibold">POST /api/pedidos</span> (cliente 1 / dirección 1 / sucursal 1)</p>
          </div>
        </>
      )}
      {pedidoConfirmado && <OrderConfirmation pedido={pedidoConfirmado} onClose={() => setPedidoConfirmado(null)} />}
    </div>
  );
}
