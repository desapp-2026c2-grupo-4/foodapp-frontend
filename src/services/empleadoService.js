import { apiFetch } from "./api.js";

export const getEmpleados = () => apiFetch("/empleados");
export const getEmpleadoById = (id) => apiFetch(`/empleados/${id}`);
export const createEmpleado = (data) =>
  apiFetch("/empleados", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateEmpleado = (id, data) =>
  apiFetch(`/empleados/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteEmpleado = (id) =>
  apiFetch(`/empleados/${id}`, { method: "DELETE" });
