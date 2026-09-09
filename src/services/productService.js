import { apiFetch } from "./api.js";

export const getProductos = () => apiFetch("/productos");
export const getProductoById = (id) => apiFetch(`/productos/${id}`);
