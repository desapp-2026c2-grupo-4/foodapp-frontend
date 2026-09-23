import { createContext, useContext, useMemo, useState } from "react";
import { createPedido } from "../services/pedidoService.js";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // {cartId, id_producto, nombre, precio, imagen, cantidad, observaciones, opcionales:[{id_opcional,nombre,precio}]}

  const getKey = (id_producto, opcionales) => {
    const ids = (opcionales || []).map((o) => o.id_opcional).sort((a, b) => a - b).join("-");
    return `${id_producto}::${ids}`;
  };

  const addProduct = (producto, cantidad = 1, selectedOpcionales = []) => {
    const precioBase = parseFloat(producto.precio);
    const opcionales = (selectedOpcionales || []).map((o) => ({
      id_opcional: o.id_opcional,
      nombre: o.nombre,
      precio: parseFloat(o.precio) || 0,
    }));
    const key = getKey(producto.id_producto, opcionales);
    setItems((prev) => {
      const idx = prev.findIndex((p) => p._key === key);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + cantidad };
        return copy;
      }
      return [
        ...prev,
        {
          cartId: Date.now() + Math.random(),
          _key: key,
          id_producto: producto.id_producto,
          nombre: producto.nombre,
          precio: precioBase,
          imagen: producto.imagen,
          cantidad,
          observaciones: "",
          opcionales,
        },
      ];
    });
  };

  const updateQuantity = (cartId, cantidad) => {
    if (cantidad < 1) return;
    setItems((prev) => prev.map((p) => (p.cartId === cartId ? { ...p, cantidad } : p)));
  };

  const updateObservaciones = (cartId, observaciones) => {
    setItems((prev) => prev.map((p) => (p.cartId === cartId ? { ...p, observaciones } : p)));
  };

  const removeProduct = (cartId) => {
    setItems((prev) => prev.filter((p) => p.cartId !== cartId));
  };

  // compatibilidad: si se pasa id_producto numérico, buscar por _key prefijo
  const updateQuantityByProducto = (id_producto, cantidad) => {
    if (cantidad < 1) return;
    setItems((prev) => prev.map((p) => (p.id_producto === id_producto ? { ...p, cantidad } : p)));
  };
  const removeByProducto = (id_producto) => setItems((prev) => prev.filter((p) => p.id_producto !== id_producto));

  // Item de promoción: {tipo:'promocion', id_promocion, nombre, precio (unitario promo), productos:[{id_producto,nombre,cantidad}], cantidad, observaciones}
  const addPromo = (promocion, cantidad = 1) => {
    const precio = (() => {
      const items = (promocion.productos || []).map((p) => ({
        precio: parseFloat(p.precio),
        cantidad: p.PromocionProducto.cantidad,
      }));
      const base = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
      switch (promocion.tipo) {
        case "PRECIO_FIJO": return parseFloat(promocion.valor);
        case "PORCENTAJE": return base * (1 - parseFloat(promocion.valor) / 100);
        case "DOS_POR_UNO":
          return items.reduce((s, i) => s + i.precio * (i.cantidad - Math.floor(i.cantidad / 2)), 0);
        default: return base;
      }
    })();
    const key = `promo::${promocion.id_promocion}`;
    setItems((prev) => {
      const idx = prev.findIndex((p) => p._key === key);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + cantidad };
        return copy;
      }
      return [
        ...prev,
        {
          cartId: Date.now() + Math.random(),
          _key: key,
          tipo: "promocion",
          id_promocion: promocion.id_promocion,
          nombre: promocion.nombre,
          precio,
          imagen: promocion.imagen || null,
          cantidad,
          observaciones: "",
          productos: (promocion.productos || []).map((p) => ({
            id_producto: p.id_producto,
            nombre: p.nombre,
            cantidad: p.PromocionProducto.cantidad,
          })),
        },
      ];
    });
  };

  const clearCart = () => setItems([]);

  const total = useMemo(
    () => items.reduce((sum, p) => {
      if (p.tipo === "promocion") return sum + p.precio * p.cantidad;
      const extra = (p.opcionales || []).reduce((s, o) => s + parseFloat(o.precio || 0), 0);
      return sum + (p.precio + extra) * p.cantidad;
    }, 0),
    [items]
  );

  const count = useMemo(() => items.reduce((sum, p) => sum + p.cantidad, 0), [items]);

  // Confirma carrito usando el usuario seleccionado en AuthContext
  const confirmCart = async ({ id_cliente, id_direccion, id_sucursal } = {}) => {
    if (items.length === 0) throw new Error("Carrito vacío");
    // Si no se pasa id_cliente, intentar leer de localStorage (AuthContext)
    let clienteId = id_cliente;
    let direccionId = id_direccion;
    let sucursalId = id_sucursal;
    if (!clienteId) {
      try {
        const raw = localStorage.getItem("foodapp_auth_user");
        const u = raw ? JSON.parse(raw) : null;
        if (u?.rol === "CLIENTE" && u.id_cliente) {
          clienteId = u.id_cliente;
          // buscar primera direccion del cliente como default si no se pasa
          if (!direccionId && u.direcciones?.[0]) direccionId = u.direcciones[0].id_direccion;
        }
      } catch {}
    }
    // fallback a seed 1 si aún no hay selección
    clienteId = clienteId || 1;
    // si no hay direccionId, intentar inferir: para cliente 1->1, 2->2, 3->3
    if (!direccionId) direccionId = clienteId;
    sucursalId = sucursalId || 1;

    const detalles = items.map((p) => {
      if (p.tipo === "promocion") {
        return {
          id_promocion: p.id_promocion,
          cantidad: p.cantidad,
          observaciones: p.observaciones || undefined,
        };
      }
      return {
        id_producto: p.id_producto,
        cantidad: p.cantidad,
        observaciones: p.observaciones || undefined,
        opcionales: (p.opcionales || []).map((o) => o.id_opcional),
      };
    });
    const pedido = await createPedido({ id_cliente: clienteId, id_direccion: direccionId, id_sucursal: sucursalId, detalles });
    clearCart();
    return pedido;
  };

  const value = { items, addProduct, addPromo, updateQuantity, updateObservaciones, removeProduct, clearCart, total, count, confirmCart, updateQuantityByProducto, removeByProducto };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
};
