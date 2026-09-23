import { apiFetch } from "./api.js";

export const getSucursales = () => apiFetch("/sucursales");
export const getSucursalById = (id) => apiFetch(`/sucursales/${id}`);
export const createSucursal = (data) =>
  apiFetch("/sucursales", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateSucursal = (id, data) =>
  apiFetch(`/sucursales/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteSucursal = (id) =>
  apiFetch(`/sucursales/${id}`, { method: "DELETE" });
