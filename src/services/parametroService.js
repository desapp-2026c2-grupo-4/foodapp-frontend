import { apiFetch } from "./api.js";

export const getParametros = () => apiFetch("/parametros");

export const updateParametros = (parametros) =>
  apiFetch("/parametros", {
    method: "PUT",
    body: JSON.stringify(parametros),
  });

export async function getParametrosMap() {
  const parametros = await getParametros();
  return Object.fromEntries(parametros.map((p) => [p.clave, p.valor]));
}
