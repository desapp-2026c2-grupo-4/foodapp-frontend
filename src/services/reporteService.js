import { apiFetch } from "./api.js";

const conSucursal = (base, params = {}) => {
  const q = new URLSearchParams();
  if (params.id_sucursal) q.set("id_sucursal", params.id_sucursal);
  const qs = q.toString();
  return apiFetch(`${base}${qs ? `?${qs}` : ""}`);
};

export const getReporteProductos = (params = {}) => conSucursal("/reportes/productos", params);
export const getReportePromociones = (params = {}) => conSucursal("/reportes/promociones", params);
