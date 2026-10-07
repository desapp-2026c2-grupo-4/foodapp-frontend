import { apiFetch } from "./api.js";

export const createPedido = (payload) =>
  apiFetch("/pedidos", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getPedidos = (params = {}) => {
  const q = new URLSearchParams();
  if (params.id_sucursal) q.set("id_sucursal", params.id_sucursal);
  const qs = q.toString();
  return apiFetch(`/pedidos${qs ? `?${qs}` : ""}`);
};
export const getPedidoById = (id) => apiFetch(`/pedidos/${id}`);
export const getPedidoDetalles = (id) => apiFetch(`/pedidos/${id}/detalles`);
export const updatePedidoEstado = (id, estado) =>
  apiFetch(`/pedidos/${id}`, {
    method: "PUT",
    body: JSON.stringify({ estado }),
  });
export const updateDetallePreparado = (idPedido, idDetalle, preparado) =>
  apiFetch(`/pedidos/${idPedido}/detalles/${idDetalle}`, {
    method: "PUT",
    body: JSON.stringify({ preparado }),
  });
