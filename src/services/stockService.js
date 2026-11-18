import { apiFetch } from "./api.js";

export const getStockSucursal = (idSucursal) =>
  apiFetch(`/stock?sucursal=${idSucursal}`);

export const agregarStock = ({ id_sucursal, id_materia_prima, cantidad }) =>
  apiFetch("/stock", {
    method: "POST",
    body: JSON.stringify({ id_sucursal, id_materia_prima, cantidad }),
  });

export const reducirStock = ({ id_sucursal, id_materia_prima, cantidad, motivo }) =>
  apiFetch("/stock/reducciones", {
    method: "POST",
    body: JSON.stringify({ id_sucursal, id_materia_prima, cantidad, motivo }),
  });

export const getReduccionesStock = (idSucursal) =>
  apiFetch(`/stock/reducciones?sucursal=${idSucursal}`);

export const getStockProducto = (idProducto, idSucursal) =>
  apiFetch(`/productos/${idProducto}/stock?sucursal=${idSucursal}`);
