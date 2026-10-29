const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const TOKEN_KEY = "foodapp_auth_token";

const leerToken = () => {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return null;
  }
};

const limpiarSesion = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("foodapp_auth_user");
  } catch {
    // localStorage puede no estar disponible (SSR/privacidad)
  }
  window.dispatchEvent(new Event("foodapp:unauthorized"));
};

export async function apiFetch(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options;
  const token = leerToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extraHeaders || {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...rest, headers });

  if (res.status === 401) {
    limpiarSesion();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }

  // DELETE puede devolver {mensaje}
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
