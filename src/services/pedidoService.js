import { apiFetch } from "./api.js";

export const createPedido = (payload) =>
  apiFetch("/pedidos", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getPedidos = () => apiFetch("/pedidos");
export const getPedidoById = (id) => apiFetch(`/pedidos/${id}`);
export const getPedidoDetalles = (id) => apiFetch(`/pedidos/${id}/detalles`);
export const updatePedidoEstado = (id, estado) =>
  apiFetch(`/pedidos/${id}`, {
    method: "PUT",
    body: JSON.stringify({ estado }),
  });
