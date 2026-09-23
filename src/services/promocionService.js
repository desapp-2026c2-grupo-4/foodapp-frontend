import { apiFetch } from "./api.js";

export const getPromociones = () => apiFetch("/promociones");
export const getPromocionById = (id) => apiFetch(`/promociones/${id}`);
export const createPromocion = (data) =>
  apiFetch("/promociones", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updatePromocion = (id, data) =>
  apiFetch(`/promociones/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deletePromocion = (id) =>
  apiFetch(`/promociones/${id}`, { method: "DELETE" });
