import { apiFetch } from "./api.js";

export const createPedido = (payload) =>
  apiFetch("/pedidos", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getPedidos = () => apiFetch("/pedidos");
