import { apiFetch } from "./api.js";

export const getDirecciones = (idCliente) => apiFetch(`/clientes/${idCliente}/direcciones`);
export const createDireccion = (idCliente, data) =>
  apiFetch(`/clientes/${idCliente}/direcciones`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const deleteDireccion = (idCliente, idDireccion) =>
  apiFetch(`/clientes/${idCliente}/direcciones/${idDireccion}`, { method: "DELETE" });
