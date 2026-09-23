import { apiFetch } from "./api.js";

export const getReporteProductos = () => apiFetch("/reportes/productos");
