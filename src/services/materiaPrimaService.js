import { apiFetch } from "./api.js";

export const getMateriasPrimas = () => apiFetch("/materias-primas");
export const getMateriaPrimaById = (id) => apiFetch(`/materias-primas/${id}`);
export const createMateriaPrima = (data) =>
  apiFetch("/materias-primas", { method: "POST", body: JSON.stringify(data) });
export const updateMateriaPrima = (id, data) =>
  apiFetch(`/materias-primas/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteMateriaPrima = (id) =>
  apiFetch(`/materias-primas/${id}`, { method: "DELETE" });
