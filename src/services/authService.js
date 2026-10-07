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
