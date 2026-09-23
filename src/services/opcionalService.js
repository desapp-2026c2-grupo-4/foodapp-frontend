import { apiFetch } from "./api.js";

export const getOpcionalesByProducto = (idProducto) => apiFetch(`/productos/${idProducto}/opcionales`);
export const createOpcional = (idProducto, data) =>
  apiFetch(`/productos/${idProducto}/opcionales`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateOpcional = (idOpcional, data) =>
  apiFetch(`/opcionales/${idOpcional}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteOpcional = (idOpcional) =>
  apiFetch(`/opcionales/${idOpcional}`, { method: "DELETE" });
export const getAllOpcionales = () => apiFetch("/opcionales");
