import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getMateriasPrimas,
  createMateriaPrima,
  updateMateriaPrima,
  deleteMateriaPrima,
} from "../services/materiaPrimaService.js";
import { getSucursales } from "../services/sucursalService.js";
import { getStockSucursal, agregarStock } from "../services/stockService.js";
import LowStockAlert from "../components/LowStockAlert.jsx";

export default function AdminMateriasPrimasPage() {
  const { isAdmin, isStaff, user } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState("disponible");
  const [stockMinimo, setStockMinimo] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");

  // Stock por sucursal
  const [sucursales, setSucursales] = useState([]);
  const [idSucursal, setIdSucursal] = useState("");
  const [stockRows, setStockRows] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [cantidades, setCantidades] = useState({});
  const [stockMsg, setStockMsg] = useState("");
  const [alertaAbierta, setAlertaAbierta] = useState(false);

  const fetchMaterias = async () => {
    setLoading(true);
    try {
      setMaterias(await getMateriasPrimas());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isStaff) return;
    fetchMaterias();
    if (isAdmin) {
      getSucursales()
        .then((sucs) => {
          setSucursales(sucs);
        })
        .catch((e) => setError(e.message));
    } else {
      setIdSucursal(user?.id_sucursal || "");
    }
  }, [isStaff, isAdmin]);

  const cargarStock = async (autoAlerta = false) => {
    if (!idSucursal) {
      setStockRows([]);
      return;
    }
    setStockLoading(true);
    try {
      const filas = await getStockSucursal(idSucursal);
      setStockRows(filas);
      if (autoAlerta && filas.some((m) => m.bajo_stock)) setAlertaAbierta(true);
    } catch (e) {
      setStockMsg(`Error: ${e.message}`);
    } finally {
      setStockLoading(false);
    }
  };
  useEffect(() => {
    cargarStock(true);
  }, [idSucursal]);

  if (!isStaff)
    return (
      <p className="p-8 text-center text-danger">
        Acceso denegado — Solo personal autorizado puede gestionar materias primas.{" "}
        <Link to="/" className="text-primary underline">
          Elegir usuario
        </Link>
      </p>
    );
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando materias primas...</p>;
  if (error) return <p className="p-8 text-center text-danger">{error}</p>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!nombre.trim()) return setMsg("Error: el nombre es obligatorio");
    const minimo = stockMinimo === "" ? 0 : parseInt(stockMinimo, 10);
    if (!Number.isInteger(minimo) || minimo < 0) {
      return setMsg("Error: el stock mínimo debe ser un entero mayor o igual a 0");
    }
    try {
      const payload = { nombre: nombre.trim(), estado, stock_minimo: minimo };
      if (editingId) {
        await updateMateriaPrima(editingId, payload);
        setMsg("Materia prima modificada");
      } else {
        await createMateriaPrima(payload);
        setMsg("Materia prima dada de alta");
      }
      setNombre("");
      setEstado("disponible");
      setStockMinimo("");
      setEditingId(null);
      fetchMaterias();
      cargarStock(true);
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleEdit = (m) => {
    setEditingId(m.id_materia_prima);
    setNombre(m.nombre);
    setEstado(m.estado);
    setStockMinimo(String(m.stock_minimo ?? 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Dar de baja la materia prima? Dejará de mostrarse.")) return;
    try {
      await deleteMateriaPrima(id);
      setMsg("Materia prima dada de baja");
      fetchMaterias();
      cargarStock(false);
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const handleAgregar = async (id_materia_prima) => {
    const cantidad = parseInt(cantidades[id_materia_prima], 10);
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      setStockMsg("Error: ingresá una cantidad entera mayor a 0");
      return;
    }
    try {
      const r = await agregarStock({ id_sucursal: idSucursal, id_materia_prima, cantidad });
      setStockMsg(`Stock actualizado: ${r.nombre} → ${r.stock} unidades`);
      setCantidades((prev) => ({ ...prev, [id_materia_prima]: "" }));
      await cargarStock(false);
    } catch (err) {
      setStockMsg(`Error: ${err.message}`);
    }
  };

  const controlAgregar = (m) => (
    <div className="flex gap-2 items-center justify-center">
      <input
        type="number"
        min="1"
        step="1"
        placeholder="Cant."
        value={cantidades[m.id_materia_prima] ?? ""}
        onChange={(e) => setCantidades((prev) => ({ ...prev, [m.id_materia_prima]: e.target.value }))}
        className="w-20 border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-primary"
      />
      <button onClick={() => handleAgregar(m.id_materia_prima)} className="text-xs bg-success text-white px-3 py-1.5 rounded-pill hover:brightness-110 shrink-0">
        Agregar
      </button>
    </div>
  );

  const bajos = stockRows.filter((m) => m.bajo_stock);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold">Materias primas</h1>
          <p className="text-sm text-text-soft">
            {isAdmin
              ? "Alta, baja y modificación + stock por sucursal"
              : "Stock de materias primas de tu sucursal"}
          </p>
        </div>
        <Link to="/admin/productos" className="text-sm text-primary hover:underline shrink-0">
          → Ver productos / receta
        </Link>
      </div>

      {isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-5 space-y-4">
          <h3 className="font-semibold">{editingId ? `Modificar #${editingId}` : "Alta de materia prima"}</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <label className="text-sm block">
              Nombre*
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Ej. Pan"
                className="w-full border border-border rounded-md px-3 py-2 mt-1"
              />
            </label>
            <label className="text-sm block">
              Estado
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 mt-1"
              >
                <option value="disponible">disponible</option>
                <option value="no_disponible">no_disponible</option>
              </select>
            </label>
            <label className="text-sm block">
              Stock mínimo
              <input
                type="number"
                min="0"
                step="1"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                placeholder="Ej. 20"
                className="w-full border border-border rounded-md px-3 py-2 mt-1"
              />
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-pill font-semibold">
              {editingId ? "Guardar" : "Crear"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setNombre("");
                  setEstado("disponible");
                  setStockMinimo("");
                }}
                className="border border-border bg-white px-6 py-2 rounded-pill"
              >
                Cancelar
              </button>
            )}
          </div>
          {msg && (
            <p className={`text-sm p-2 rounded-md border ${msg.startsWith("Error") ? "bg-red-50 text-danger border-red-200" : "bg-green-50 text-success border-green-200"}`}>
              {msg}
            </p>
          )}
        </form>
      )}

      <div className="bg-white rounded-lg border border-border p-5 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h3 className="font-semibold">Stock por sucursal</h3>
          {isAdmin ? (
            <label className="text-sm flex items-center gap-2">
              Sucursal
              <select
                value={idSucursal}
                onChange={(e) => setIdSucursal(e.target.value)}
                className="border border-border rounded-md px-3 py-1.5"
              >
                <option value="">— Seleccioná una sucursal —</option>
                {sucursales.map((s) => (
                  <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>
                ))}
              </select>
            </label>
          ) : (
            <span className="text-sm text-text-soft">{user?.sucursal?.nombre || "Tu sucursal"}</span>
          )}
        </div>

        {stockMsg && (
          <p className={`text-sm p-2 rounded-md border ${stockMsg.startsWith("Error") ? "bg-red-50 text-danger border-red-200" : "bg-green-50 text-success border-green-200"}`}>
            {stockMsg}
          </p>
        )}

        {bajos.length > 0 && !stockLoading && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-md px-4 py-3">
            <p className="text-sm text-danger font-medium">
              Stock bajo: {bajos.map((m) => m.nombre).join(", ")}
            </p>
            <button onClick={() => setAlertaAbierta(true)} className="text-xs bg-danger text-white px-3 py-1.5 rounded-pill hover:bg-red-700">
              Ver detalle
            </button>
          </div>
        )}

        {!idSucursal ? (
          <p className="text-sm text-text-soft">
            {isAdmin
              ? "Elegí una sucursal para ver el stock."
              : "No tenés una sucursal asignada. Pedile a un administrador que te asigne una."}
          </p>
        ) : stockLoading ? (
          <p className="text-sm text-text-soft">Cargando stock...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background border-b border-border text-text-soft">
                <tr>
                  <th className="text-left px-4 py-2">#</th>
                  <th className="text-left px-4 py-2">Materia prima</th>
                  <th className="text-left px-4 py-2">Estado</th>
                  <th className="text-left px-4 py-2">Stock</th>
                  <th className="text-left px-4 py-2">Mínimo</th>
                  <th className="text-center px-4 py-2">Agregar stock</th>
                </tr>
              </thead>
              <tbody>
                {stockRows.map((m) => (
                  <tr key={m.id_materia_prima} className={`border-b border-border align-top ${m.bajo_stock ? "bg-red-50" : ""}`}>
                    <td className="px-4 py-2 font-bold text-primary">#{m.id_materia_prima}</td>
                    <td className="px-4 py-2 font-medium">{m.nombre}</td>
                    <td className="px-4 py-2 text-text-soft">{m.estado}</td>
                    <td className="px-4 py-2">
                      <span className={`font-bold ${m.bajo_stock ? "text-danger" : m.stock > 0 ? "text-success" : "text-danger"}`}>{m.stock}</span>
                      {m.bajo_stock && <span className="ml-2 text-[11px] font-bold bg-danger text-white px-2 py-0.5 rounded-pill">Bajo stock</span>}
                    </td>
                    <td className="px-4 py-2 text-text-soft">{m.stock_minimo > 0 ? m.stock_minimo : "—"}</td>
                    <td className="px-4 py-2">{controlAgregar(m)}</td>
                  </tr>
                ))}
                {stockRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-text-soft">No hay materias primas</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-background border-b border-border text-text-soft">
              <tr>
                <th className="text-left px-4 py-2">#</th>
                <th className="text-left px-4 py-2">Nombre</th>
                <th className="text-left px-4 py-2">Estado</th>
                <th className="text-left px-4 py-2">Mínimo</th>
                <th className="text-center px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materias.map((m) => (
                <tr key={m.id_materia_prima} className="border-b border-border align-top">
                  <td className="px-4 py-2 font-bold text-primary">#{m.id_materia_prima}</td>
                  <td className="px-4 py-2 font-medium">{m.nombre}</td>
                  <td className="px-4 py-2 text-text-soft">{m.estado}</td>
                  <td className="px-4 py-2 text-text-soft">{m.stock_minimo > 0 ? m.stock_minimo : "—"}</td>
                  <td className="px-4 py-2 text-center space-x-2 whitespace-nowrap">
                    <button onClick={() => handleEdit(m)} className="text-xs border border-border px-3 py-1 rounded-pill hover:border-primary">
                      Modificar
                    </button>
                    <button onClick={() => handleDelete(m.id_materia_prima)} className="text-xs bg-danger text-white px-3 py-1 rounded-pill hover:bg-red-700">
                      Baja
                    </button>
                  </td>
                </tr>
              ))}
              {materias.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-soft">No hay materias primas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {alertaAbierta && <LowStockAlert items={bajos} onClose={() => setAlertaAbierta(false)} />}
    </div>
  );
}
