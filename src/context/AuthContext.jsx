import { createContext, useContext, useState, useEffect } from "react";
import * as authApi from "../services/authService.js";

const AuthContext = createContext(null);

const STORAGE_USER = "foodapp_auth_user";
const STORAGE_TOKEN = "foodapp_auth_token";

const leerStorage = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => leerStorage(STORAGE_USER));
  const [token, setToken] = useState(() => leerStorage(STORAGE_TOKEN));

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_USER);
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem(STORAGE_TOKEN, JSON.stringify(token));
    else localStorage.removeItem(STORAGE_TOKEN);
  }, [token]);

  // Login real contra el backend (email + contraseña)
  const guardarSesion = (nuevoToken, usuario) => {
    localStorage.setItem(STORAGE_TOKEN, JSON.stringify(nuevoToken));
    localStorage.setItem(STORAGE_USER, JSON.stringify(usuario));
    setToken(nuevoToken);
    setUser(usuario);
  };

  const login = async (email, password) => {
    const { token: nuevoToken, user: usuario } = await authApi.login({ email, password });
    guardarSesion(nuevoToken, usuario);
    return usuario;
  };

  // Registro público: siempre crea CLIENTE (lo garantiza el backend)
  const register = async (data) => {
    const { token: nuevoToken, user: usuario } = await authApi.register(data);
    guardarSesion(nuevoToken, usuario);
    return usuario;
  };

  const updateUser = (datos) => {
    setUser((prev) => ({ ...prev, ...datos }));
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener("foodapp:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("foodapp:unauthorized", handleUnauthorized);
  }, []);

  const isAdmin = user?.rol === "ADMIN";
  const isCliente = user?.rol === "CLIENTE";
  // Personal con acceso de administración: ADMIN y EMPLEADO (no clientes)
  const isStaff = user?.rol === "ADMIN" || user?.rol === "EMPLEADO";

  return (
    <AuthContext.Provider value={{ user, token, login, register, updateUser, logout, isAdmin, isCliente, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
