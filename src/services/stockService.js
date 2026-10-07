import { apiFetch } from "./api.js";

export const getStockSucursal = (idSucursal) =>
  apiFetch(`/stock?sucursal=${idSucursal}`);

export const agregarStock = ({ id_sucursal, id_producto, cantidad }) =>
  apiFetch("/stock", {
    method: "POST",
    body: JSON.stringify({ id_sucursal, id_producto, cantidad }),
  });
