import { apiFetch } from "./api.js";

export const login = (data) =>
  apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const register = (data) =>
  apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const recuperarPassword = ({ email, dni }) =>
  apiFetch("/auth/password/recuperar", {
    method: "POST",
    body: JSON.stringify({ email, dni }),
  });

export const restablecerPassword = ({ resetToken, passwordNueva }) =>
  apiFetch("/auth/password/restablecer", {
    method: "POST",
    body: JSON.stringify({ resetToken, passwordNueva }),
  });
