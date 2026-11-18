import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getParametros, updateParametros } from "../services/parametroService.js";

const GRUPOS = [
  { id: "operacion", label: "Operación", descripcion: "Tiempos de entrega y cobertura." },
  { id: "stock", label: "Stock", descripcion: "Valores sugeridos y visibilidad del historial." },
  { id: "clientes", label: "Clientes", descripcion: "Criterios de segmentación." },
  { id: "reportes", label: "Reportes", descripcion: "Rangos y límites de consulta." },
];

const formatearFecha = (valor) => {
  if (!valor) return "Valor por defecto";
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? "Valor por defecto"
    : `Actualizado ${fecha.toLocaleString("es-AR")}`;
};

export default function AdminParametrosPage() {
  const { isAdmin } = useAuth();
  const [parametros, setParametros] = useState([]);
  const [valores, setValores] = useState({});
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    getParametros()
      .then((datos) => {
        setParametros(datos);
        setValores(Object.fromEntries(datos.map((p) => [p.clave, String(p.valor)])));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const porGrupo = useMemo(
    () =>
      GRUPOS.map((grupo) => ({
        ...grupo,
        parametros: parametros.filter((p) => p.grupo === grupo.id),
      })).filter((grupo) => grupo.parametros.length > 0),
    [parametros]
  );

  const handleChange = (clave, valor) => {
    setValores((prev) => ({ ...prev, [clave]: valor }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");

    const payload = {};
    for (const parametro of parametros) {
      const valor = valores[parametro.clave];
      if (valor === "" || valor === undefined) {
        setError(`Completá el parámetro "${parametro.descripcion}"`);
        return;
      }
      if (parametro.tipo === "integer") {
        const numero = Number.parseInt(valor, 10);
        if (!Number.isInteger(numero)) {
          setError(`"${parametro.descripcion}" debe ser un número entero`);
          return;
        }
        payload[parametro.clave] = numero;
      } else if (parametro.tipo === "decimal") {
        const numero = Number.parseFloat(valor);
        if (!Number.isFinite(numero)) {
          setError(`"${parametro.descripcion}" debe ser un número`);
          return;
        }
        payload[parametro.clave] = numero;
      } else {
        payload[parametro.clave] = valor;
      }
    }

    setGuardando(true);
    try {
      const actualizados = await updateParametros(payload);
      setParametros(actualizados);
      setValores(Object.fromEntries(actualizados.map((p) => [p.clave, String(p.valor)])));
      setMsg("Parámetros guardados");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (!isAdmin) {
    return (
      <p className="p-8 text-center text-danger">
        Acceso denegado — Solo administrador puede modificar parámetros.{" "}
        <Link to="/" className="text-primary underline">Volver al inicio</Link>
      </p>
    );
  }
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando parámetros...</p>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-text">Parámetros</h1>
        <p className="text-sm text-text-soft mt-1">
          Ajustá valores operativos sin modificar el código. Los cambios se aplican a todo el sistema.
        </p>
      </div>

      {error && <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md p-3">{error}</p>}
      {msg && <p className="text-sm text-success bg-green-50 border border-green-200 rounded-md p-3">{msg}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {porGrupo.map((grupo) => (
          <section key={grupo.id} className="bg-white rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-sm">{grupo.label}</h2>
              <p className="text-xs text-text-soft mt-0.5">{grupo.descripcion}</p>
            </div>
            <div className="divide-y divide-border">
              {grupo.parametros.map((parametro) => (
                <div key={parametro.clave} className="p-4 grid md:grid-cols-[1fr_220px] gap-4 items-start">
                  <div>
                    <label htmlFor={parametro.clave} className="text-sm font-medium">
                      {parametro.descripcion}
                    </label>
                    <p className="text-xs text-text-soft mt-1">
                      {parametro.clave}
                      {parametro.unidad ? ` · ${parametro.unidad}` : ""}
                      {parametro.min !== undefined ? ` · mínimo ${parametro.min}` : ""}
                      {parametro.max !== undefined ? ` · máximo ${parametro.max}` : ""}
                    </p>
                    <p className="text-[11px] text-text-soft mt-1">
                      {formatearFecha(parametro.actualizado_en)} · Valor por defecto: {parametro.valor_defecto}
                    </p>
                  </div>
                  <input
                    id={parametro.clave}
                    type="number"
                    min={parametro.min}
                    max={parametro.max}
                    step={parametro.tipo === "decimal" ? "0.1" : "1"}
                    value={valores[parametro.clave] ?? ""}
                    onChange={(e) => handleChange(parametro.clave, e.target.value)}
                    className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={guardando}
            className="bg-primary hover:bg-primary-dark disabled:opacity-60 text-white px-6 py-2 rounded-pill font-semibold"
          >
            {guardando ? "Guardando..." : "Guardar parámetros"}
          </button>
        </div>
      </form>
    </div>
  );
}
