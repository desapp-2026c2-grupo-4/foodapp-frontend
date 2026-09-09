const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  // DELETE puede devolver {mensaje}
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
