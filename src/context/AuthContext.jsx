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
  const login = async (email, password) => {
    const { token: nuevoToken, user: usuario } = await authApi.login({ email, password });
    setToken(nuevoToken);
    setUser(usuario);
    return usuario;
  };

  // Registro público: siempre crea CLIENTE (lo garantiza el backend)
  const register = async (data) => {
    const { token: nuevoToken, user: usuario } = await authApi.register(data);
    setToken(nuevoToken);
    setUser(usuario);
    return usuario;
  };

  // Accesos rápidos de desarrollo (sin contraseña)
  const loginAsCliente = (cliente) => {
    setToken(null);
    setUser({ ...cliente, rol: "CLIENTE", tipo: "cliente" });
  };

  const loginAsAdmin = () => {
    setToken(null);
    setUser({ id_cliente: 0, id_empleado: 1, nombre: "Admin", apellido: "Principal", email: "admin@altoque.com", rol: "ADMIN", tipo: "admin" });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const isAdmin = user?.rol === "ADMIN";
  const isCliente = user?.rol === "CLIENTE";
  // Personal con acceso de administración: ADMIN y EMPLEADO (no clientes)
  const isStaff = user?.rol === "ADMIN" || user?.rol === "EMPLEADO";

  return (
    <AuthContext.Provider value={{ user, token, login, register, loginAsCliente, loginAsAdmin, logout, isAdmin, isCliente, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
