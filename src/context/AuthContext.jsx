import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "foodapp_auth_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const loginAsCliente = (cliente) => {
    setUser({ ...cliente, rol: "CLIENTE", tipo: "cliente" });
  };

  const loginAsAdmin = () => {
    setUser({ id_cliente: 0, id_empleado: 1, nombre: "Admin", apellido: "Principal", email: "admin@altoque.com", rol: "ADMIN", tipo: "admin" });
  };

  const logout = () => setUser(null);

  const isAdmin = user?.rol === "ADMIN";
  const isCliente = user?.rol === "CLIENTE";

  return (
    <AuthContext.Provider value={{ user, loginAsCliente, loginAsAdmin, logout, isAdmin, isCliente }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
