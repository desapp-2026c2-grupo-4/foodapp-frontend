import { apiFetch } from "./api.js";

export const getStockSucursal = (idSucursal) =>
  apiFetch(`/stock?sucursal=${idSucursal}`);

export const agregarStock = ({ id_sucursal, id_materia_prima, cantidad }) =>
  apiFetch("/stock", {
    method: "POST",
    body: JSON.stringify({ id_sucursal, id_materia_prima, cantidad }),
  });

export const getStockProducto = (idProducto, idSucursal) =>
  apiFetch(`/productos/${idProducto}/stock?sucursal=${idSucursal}`);
