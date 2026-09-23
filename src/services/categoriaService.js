import { apiFetch } from "./api.js";

export const getCategorias = () => apiFetch("/categorias");
export const getCategoriaById = (id) => apiFetch(`/categorias/${id}`);
export const createCategoria = (data) =>
  apiFetch("/categorias", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateCategoria = (id, data) =>
  apiFetch(`/categorias/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteCategoria = (id) =>
  apiFetch(`/categorias/${id}`, { method: "DELETE" });
