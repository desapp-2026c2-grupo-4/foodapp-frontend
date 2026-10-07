import { apiFetch } from "./api.js";

export const getBanners = (soloActivos = false) =>
  apiFetch(soloActivos ? "/banners?activo=true" : "/banners");
export const getBannerById = (id) => apiFetch(`/banners/${id}`);
export const createBanner = (data) =>
  apiFetch("/banners", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateBanner = (id, data) =>
  apiFetch(`/banners/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteBanner = (id) =>
  apiFetch(`/banners/${id}`, { method: "DELETE" });
