// Helpers de promociones (solo visualización).
// El precio final lo calcula el backend al crear el pedido.

export const itemsBasePromo = (promocion) =>
  (promocion.productos || []).map((p) => ({
    precio: parseFloat(p.precio),
    cantidad: p.PromocionProducto.cantidad,
  }));

export const totalBasePromo = (promocion) =>
  itemsBasePromo(promocion).reduce((sum, i) => sum + i.precio * i.cantidad, 0);

export function precioUnitarioPromo(promocion) {
  const items = itemsBasePromo(promocion);
  const totalBase = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  switch (promocion.tipo) {
    case "PRECIO_FIJO":
      return parseFloat(promocion.valor);
    case "PORCENTAJE":
      return totalBase * (1 - parseFloat(promocion.valor) / 100);
    case "DOS_POR_UNO":
      return items.reduce(
        (sum, i) => sum + i.precio * (i.cantidad - Math.floor(i.cantidad / 2)),
        0
      );
    default:
      return totalBase;
  }
}

export function tipoPromoLabel(tipo) {
  switch (tipo) {
    case "PRECIO_FIJO": return "Precio fijo";
    case "PORCENTAJE": return "Descuento";
    case "DOS_POR_UNO": return "2x1";
    default: return tipo;
  }
}
