import { apiFetch } from "./api.js";

const conParams = (base, params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") q.set(clave, valor);
  });
  const qs = q.toString();
  return apiFetch(`${base}${qs ? `?${qs}` : ""}`);
};

export const getPedidosPorDia = (params = {}) => conParams("/reportes/pedidos/dia", params);
export const getPedidosPorEstado = (params = {}) => conParams("/reportes/pedidos/estado", params);
export const getTiempoPromedioEntrega = (params = {}) => conParams("/reportes/pedidos/tiempo-entrega", params);
export const getPedidosCancelados = (params = {}) => conParams("/reportes/pedidos/cancelados", params);

export const getSucursalesResumen = (params = {}) => conParams("/reportes/sucursales", params);
export const getProductosPorSucursal = (params = {}) => conParams("/reportes/sucursales/productos", params);

export const getClientesTop = (params = {}) => conParams("/reportes/clientes/top", params);
export const getClientesNuevos = (params = {}) => conParams("/reportes/clientes/nuevos", params);
export const getClientesInactivos = (params = {}) => conParams("/reportes/clientes/inactivos", params);

export const getReporteProductos = (params = {}) => conParams("/reportes/productos", params);
export const getReportePromociones = (params = {}) => conParams("/reportes/promociones", params);
export const getImpactoPromociones = (params = {}) => conParams("/reportes/promociones/impacto", params);
