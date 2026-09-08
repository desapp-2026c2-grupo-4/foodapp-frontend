import { createContext, useContext, useMemo, useState } from "react";
import { createPedido } from "../services/pedidoService.js";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // {id_producto, nombre, precio, imagen, cantidad, observaciones}

  const addProduct = (producto, cantidad = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id_producto === producto.id_producto);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + cantidad };
        return copy;
      }
      return [
        ...prev,
        {
          id_producto: producto.id_producto,
          nombre: producto.nombre,
          precio: parseFloat(producto.precio),
          imagen: producto.imagen,
          cantidad,
          observaciones: "",
        },
      ];
    });
  };

  const updateQuantity = (id_producto, cantidad) => {
    if (cantidad < 1) return;
    setItems((prev) => prev.map((p) => (p.id_producto === id_producto ? { ...p, cantidad } : p)));
  };

  const updateObservaciones = (id_producto, observaciones) => {
    setItems((prev) => prev.map((p) => (p.id_producto === id_producto ? { ...p, observaciones } : p)));
  };

  const removeProduct = (id_producto) => {
    setItems((prev) => prev.filter((p) => p.id_producto !== id_producto));
  };

  const clearCart = () => setItems([]);

  const total = useMemo(() => items.reduce((sum, p) => sum + p.precio * p.cantidad, 0), [items]);

  const count = useMemo(() => items.reduce((sum, p) => sum + p.cantidad, 0), [items]);

  // Confirma carrito creando pedido en backend
  // Por ahora usa cliente/direccion/sucursal de seed (1/1/1). Se puede extender a selector.
  const confirmCart = async ({ id_cliente = 1, id_direccion = 1, id_sucursal = 1 } = {}) => {
    if (items.length === 0) throw new Error("Carrito vacío");
    const detalles = items.map((p) => ({
      id_producto: p.id_producto,
      cantidad: p.cantidad,
      observaciones: p.observaciones || undefined,
    }));
    const pedido = await createPedido({ id_cliente, id_direccion, id_sucursal, detalles });
    clearCart();
    return pedido;
  };

  const value = { items, addProduct, updateQuantity, updateObservaciones, removeProduct, clearCart, total, count, confirmCart };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
};
