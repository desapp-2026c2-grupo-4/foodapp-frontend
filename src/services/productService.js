import { apiFetch } from "./api.js";

export const getProductos = (idSucursal) =>
  apiFetch(idSucursal ? `/productos?sucursal=${idSucursal}` : "/productos");
export const getProductoById = (id) => apiFetch(`/productos/${id}`);
