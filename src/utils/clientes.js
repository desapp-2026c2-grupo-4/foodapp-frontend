export const DIAS_INACTIVO = 30;
export const PEDIDOS_RECURRENTE = 3;

export function nombreCompleto(cliente) {
  return `${cliente?.nombre || ""} ${cliente?.apellido || ""}`.trim();
}

export function fechaMs(valor) {
  if (!valor) return 0;
  const ms = new Date(valor).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

export function diasDesde(valor) {
  const ms = fechaMs(valor);
  if (!ms) return null;
  return Math.floor((Date.now() - ms) / 86400000);
}

export function normalizar(valor) {
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function dinero(valor) {
  return `$${Number(valor || 0).toFixed(2)}`;
}

export function segmentosDe(cliente, opciones = {}) {
  const diasInactivo = Number(opciones.diasInactivo) || DIAS_INACTIVO;
  const pedidosRecurrente = Number(opciones.pedidosRecurrente) || PEDIDOS_RECURRENTE;
  const segmentos = [];
  if (cliente.pedidos_count === 0) {
    segmentos.push("Sin pedidos");
  } else if (cliente.pedidos_entregados >= pedidosRecurrente) {
    segmentos.push("Recurrente");
  }
  if (cliente.pedidos_count > 0) {
    const dias = diasDesde(cliente.ultimo_pedido);
    if (dias !== null && dias > diasInactivo) segmentos.push("Inactivo");
    else segmentos.push("Activo");
  }
  if (cliente.pedidos_cancelados > 0) segmentos.push("Con cancelaciones");
  return segmentos;
}
