import { createContext, useContext, useMemo, useState } from "react";
import { createPedido } from "../services/pedidoService.js";
import { getPromocionById } from "../services/promocionService.js";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // {cartId, id_producto, nombre, precio, imagen, cantidad, observaciones, opcionales:[{id_opcional,nombre,precio}]}

  const getKey = (id_producto, opcionales) => {
    const ids = (opcionales || []).map((o) => o.id_opcional).sort((a, b) => a - b).join("-");
    return `${id_producto}::${ids}`;
  };

  const addProduct = (producto, cantidad = 1, selectedOpcionales = [], observaciones = "") => {
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
          observaciones: observaciones || "",
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
  const addPromo = (promocion, cantidad = 1, observaciones = "") => {
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
          observaciones: observaciones || "",
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

  // Repite un pedido: reconstruye el carrito a partir de sus detalles.
  // Los productos sueltos se agregan con su cantidad y opcionales; las líneas
  // de una promoción se agrupan y se vuelven a cargar como combo (con precios
  // actuales). Si la promoción ya no existe o no está vigente, sus productos
  // se agregan sueltos para no perder el pedido.
  const addPedido = async (pedido) => {
    const detalles = pedido?.detalles || [];
    const sueltos = [];
    const promos = new Map(); // id_promocion -> [detalles]
    for (const d of detalles) {
      if (d.id_promocion) {
        if (!promos.has(d.id_promocion)) promos.set(d.id_promocion, []);
        promos.get(d.id_promocion).push(d);
      } else {
        sueltos.push(d);
      }
    }

    const agregarSuelto = (d) => {
      if (!d.producto) return 0;
      const opcionales = (d.opciones || []).map((o) => ({
        id_opcional: o.id_opcional,
        nombre: o.opcional?.nombre,
        precio: parseFloat(o.opcional?.precio) || 0,
      }));
      addProduct(d.producto, d.cantidad, opcionales, d.observaciones);
      return 1;
    };

    let agregados = 0;
    let omitidos = 0;

    for (const d of sueltos) {
      if (agregarSuelto(d)) agregados++;
      else omitidos++;
    }

    for (const [idPromocion, lineas] of promos) {
      let reconstruida = false;
      try {
        const promo = await getPromocionById(idPromocion);
        const primera = lineas[0];
        const prodPromo = (promo.productos || []).find((p) => p.id_producto === primera.id_producto);
        const cantProducto = prodPromo?.PromocionProducto?.cantidad;
        if (promo.vigente && cantProducto && primera.cantidad % cantProducto === 0) {
          addPromo(promo, primera.cantidad / cantProducto, primera.observaciones);
          agregados++;
          reconstruida = true;
        }
      } catch {
        // promoción eliminada: se agregan sus productos sueltos abajo
      }
      if (!reconstruida) {
        for (const d of lineas) {
          if (agregarSuelto(d)) agregados++;
          else omitidos++;
        }
      }
    }

    return { agregados, omitidos };
  };

  const total = useMemo(
    () => items.reduce((sum, p) => {
      if (p.tipo === "promocion") return sum + p.precio * p.cantidad;
      const extra = (p.opcionales || []).reduce((s, o) => s + parseFloat(o.precio || 0), 0);
      return sum + (p.precio + extra) * p.cantidad;
    }, 0),
    [items]
  );

  const count = useMemo(() => items.reduce((sum, p) => sum + p.cantidad, 0), [items]);
  // Confirma el carrito para el cliente y la dirección elegidos en el checkout
  const confirmCart = async ({ id_cliente, id_direccion, id_sucursal } = {}) => {
    if (items.length === 0) throw new Error("Carrito vacío");
    if (!id_cliente) throw new Error("Falta el cliente para confirmar el pedido");
    if (!id_direccion) throw new Error("Elegí una dirección de entrega");
    // Sin sucursal explícita el backend asigna la más cercana con stock suficiente

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

    const payload = { id_cliente, id_direccion, detalles };
    if (id_sucursal) payload.id_sucursal = id_sucursal;
    const pedido = await createPedido(payload);
    clearCart();
    return pedido;
  };

  const value = { items, addProduct, addPromo, addPedido, updateQuantity, updateObservaciones, removeProduct, clearCart, total, count, confirmCart, updateQuantityByProducto, removeByProducto };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
};
