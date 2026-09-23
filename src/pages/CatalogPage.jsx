import { useEffect, useMemo, useState } from "react";
import { getProductos } from "../services/productService.js";
import { getCategorias } from "../services/categoriaService.js";
import { getPromociones } from "../services/promocionService.js";
import ProductCard from "../components/ProductCard.jsx";
import PromoCard from "../components/PromoCard.jsx";

export default function CatalogPage() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [catsSeleccionadas, setCatsSeleccionadas] = useState([]);
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [soloEnPromo, setSoloEnPromo] = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  useEffect(() => {
    Promise.all([getProductos(), getCategorias(), getPromociones()])
      .then(([prods, cats, promos]) => {
        setProductos(prods);
        setCategorias(cats);
        setPromociones(promos.filter((p) => p.vigente));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleCategoria = (id) => {
    setCatsSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const limpiarFiltros = () => {
    setCatsSeleccionadas([]);
    setPrecioMin("");
    setPrecioMax("");
    setSoloEnPromo(false);
  };

  const hayFiltros = catsSeleccionadas.length > 0 || precioMin !== "" || precioMax !== "" || soloEnPromo;

  const filtrados = useMemo(() => {
    const min = precioMin === "" ? null : parseFloat(precioMin);
    const max = precioMax === "" ? null : parseFloat(precioMax);
    return productos.filter((p) => {
      if (catsSeleccionadas.length > 0) {
        const ids = (p.categorias || []).map((c) => c.id_categoria);
        if (!catsSeleccionadas.some((id) => ids.includes(id))) return false;
      }
      const precio = parseFloat(p.precio);
      if (min !== null && !Number.isNaN(min) && precio < min) return false;
      if (max !== null && !Number.isNaN(max) && precio > max) return false;
      return true;
    });
  }, [productos, catsSeleccionadas, precioMin, precioMax]);

  if (loading) return <p className="p-8 text-center text-text-soft">Cargando productos...</p>;
  if (error) return <p className="p-8 text-center text-danger">Error: {error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-extrabold text-text">Catálogo</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Filtros a la izquierda (desplegable en mobile) */}
        <aside className="w-full md:w-64 shrink-0 bg-white rounded-lg border border-border p-4 md:sticky md:top-20">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setFiltrosAbiertos((v) => !v)}
              aria-expanded={filtrosAbiertos}
              className="flex items-center gap-2 font-bold text-sm md:cursor-default"
            >
              Filtros
              <svg
                className={`w-4 h-4 md:hidden transition-transform ${filtrosAbiertos ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {hayFiltros && (
              <button onClick={limpiarFiltros} className="text-xs border border-border px-3 py-1 rounded-pill hover:border-danger hover:text-danger">
                Limpiar
              </button>
            )}
          </div>
          <div className={`${filtrosAbiertos ? "block" : "hidden"} md:block space-y-4 mt-4`}>
          <div>
            <p className="text-sm font-semibold mb-2">Promociones</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={soloEnPromo}
                onChange={(e) => setSoloEnPromo(e.target.checked)}
                className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary"
              />
              Solo promociones
            </label>
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Categorías</p>
            {categorias.length === 0 ? (
              <p className="text-xs text-text-soft">No hay categorías</p>
            ) : (
              <div className="flex flex-wrap md:flex-col md:items-start gap-2">
                {categorias.map((c) => {
                  const activa = catsSeleccionadas.includes(c.id_categoria);
                  return (
                    <button
                      key={c.id_categoria}
                      onClick={() => toggleCategoria(c.id_categoria)}
                      className={`text-sm px-4 py-1.5 rounded-pill border font-medium transition ${activa ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary hover:text-primary"}`}
                    >
                      {c.nombre}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Precio</p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-sm flex items-center gap-1">
                Mín $
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioMin}
                  onChange={(e) => setPrecioMin(e.target.value)}
                  placeholder="0"
                  className="w-24 border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-primary"
                />
              </label>
              <span className="text-text-soft">—</span>
              <label className="text-sm flex items-center gap-1">
                Máx $
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioMax}
                  onChange={(e) => setPrecioMax(e.target.value)}
                  placeholder="Sin tope"
                  className="w-24 border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-primary"
                />
              </label>
            </div>
          </div>

          <p className="text-xs text-text-soft">
            {soloEnPromo
              ? `Mostrando ${promociones.length} promociones`
              : `Mostrando ${filtrados.length} de ${productos.length} productos`}
            {hayFiltros ? " (con filtros aplicados)" : ""}
          </p>
          </div>
        </aside>

        {/* Contenido: promociones arriba, productos debajo */}
        <div className="flex-1 min-w-0 space-y-8 w-full">
          <section>
            <h2 className="text-xl font-extrabold text-text mb-1">Promociones activas</h2>
            <p className="text-xs text-text-soft mb-3">Se agregan al carrito como combo y se facturan con precio promocional</p>
            {promociones.length === 0 ? (
              <p className="text-sm text-text-soft bg-white rounded-lg border border-border p-4">No hay promociones activas en este momento</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {promociones.map((promo) => (
                  <PromoCard key={promo.id_promocion} promocion={promo} />
                ))}
              </div>
            )}
          </section>

          {!soloEnPromo && (
            <section>
              <h2 className="text-xl font-extrabold text-text mb-3">Productos</h2>
              {filtrados.length === 0 ? (
                <div className="bg-white rounded-lg border border-border p-8 text-center">
                  <p className="text-text-soft">Ningún producto coincide con los filtros</p>
                  <button onClick={limpiarFiltros} className="mt-4 text-sm text-primary hover:underline">Limpiar filtros</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtrados.map((p) => (
                    <ProductCard key={p.id_producto} producto={p} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
