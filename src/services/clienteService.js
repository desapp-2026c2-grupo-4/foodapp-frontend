import { apiFetch } from "./api.js";

export const registerCliente = (data) =>
  apiFetch("/clientes", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getClientes = () => apiFetch("/clientes");
export const getClienteById = (id) => apiFetch(`/clientes/${id}`);
export const updateCliente = (id, data) =>
  apiFetch(`/clientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
