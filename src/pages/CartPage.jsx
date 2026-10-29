import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import CartItem from "../components/CartItem.jsx";
import OrderConfirmation from "../components/OrderConfirmation.jsx";
import DireccionPicker from "../components/DireccionPicker.jsx";
import { createDireccion, getDirecciones } from "../services/direccionService.js";
import { formatDireccionCorta } from "../utils/geocoding.js";

const direccionValida = (d) =>
  d && d.latitud !== undefined && d.calle && d.altura && d.ciudad && d.provincia;

export default function CartPage() {
  const { items, total, clearCart, confirmCart, count } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);
  const [direcciones, setDirecciones] = useState([]);
  const [idDireccion, setIdDireccion] = useState("");
  const [loadingDirecciones, setLoadingDirecciones] = useState(false);
  const [errorDirecciones, setErrorDirecciones] = useState("");
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [nuevaDir, setNuevaDir] = useState(null);
  const [guardandoDir, setGuardandoDir] = useState(false);
  const [msgDir, setMsgDir] = useState("");
  const [formKey, setFormKey] = useState(0);

  const cargarDirecciones = useCallback(async () => {
    if (!user || user.rol !== "CLIENTE" || !user.id_cliente) return;
    setLoadingDirecciones(true);
    setErrorDirecciones("");
    try {
      const dirs = await getDirecciones(user.id_cliente);
      setDirecciones(dirs);
      setIdDireccion((prev) =>
        dirs.some((d) => String(d.id_direccion) === String(prev))
          ? prev
          : dirs[0]
            ? String(dirs[0].id_direccion)
            : ""
      );
      if (dirs.length === 0) setMostrarNueva(true);
    } catch (e) {
      setErrorDirecciones(e.message);
    } finally {
      setLoadingDirecciones(false);
    }
  }, [user]);

  useEffect(() => {
    cargarDirecciones();
  }, [cargarDirecciones]);

  const handleAddDireccion = async () => {
    setMsgDir("");
    if (!direccionValida(nuevaDir)) {
      return setMsgDir("Error: ubicá el punto en el mapa (calle, altura, ciudad y provincia)");
    }
    setGuardandoDir(true);
    try {
      const creada = await createDireccion(user.id_cliente, {
        calle: nuevaDir.calle,
        altura: nuevaDir.altura,
        piso: nuevaDir.piso || undefined,
        departamento: nuevaDir.departamento || undefined,
        ciudad: nuevaDir.ciudad,
        provincia: nuevaDir.provincia,
        codigo_postal: nuevaDir.codigo_postal || undefined,
        latitud: nuevaDir.latitud,
        longitud: nuevaDir.longitud,
      });
      setDirecciones((prev) => [...prev, creada]);
      setIdDireccion(String(creada.id_direccion));
      setNuevaDir(null);
      setFormKey((k) => k + 1);
      setMostrarNueva(false);
    } catch (e) {
      setMsgDir(`Error: ${e.message}`);
    } finally {
      setGuardandoDir(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setMsg({ type: "", text: "" });
    try {
      if (!user || user.rol !== "CLIENTE") {
        throw new Error("Elegí un usuario cliente para confirmar el pedido");
      }
      if (!idDireccion) {
        throw new Error("Elegí una dirección de entrega");
      }
      // El pedido se crea a nombre del usuario logueado y sin sucursal fija:
      // el backend asigna la más cercana a la dirección con stock suficiente
      const pedido = await confirmCart({
        id_cliente: user.id_cliente,
        id_direccion: Number(idDireccion),
      });
      setPedidoConfirmado(pedido);
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-text">Carrito</h1>
        <Link to="/catalogo" className="text-sm text-primary hover:underline">← Seguir comprando</Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg border border-border p-8 text-center">
          <p className="text-text-soft">Tu carrito está vacío</p>
          <Link to="/catalogo" className="inline-block mt-4 bg-primary text-white px-6 py-2 rounded-pill font-semibold">Ver productos</Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <CartItem key={item.cartId} item={item} />
            ))}
          </div>

          <div className="bg-white rounded-lg border border-border p-5 space-y-3">
            <div className="flex justify-between items-center gap-3">
              <h2 className="font-semibold">Dirección de entrega</h2>
              <button
                type="button"
                onClick={() => setMostrarNueva((v) => !v)}
                className="text-sm text-primary hover:underline font-medium"
              >
                {mostrarNueva ? "Cancelar" : "+ Agregar dirección"}
              </button>
            </div>

            {loadingDirecciones ? (
              <p className="text-sm text-text-soft">Cargando direcciones...</p>
            ) : errorDirecciones ? (
              <div className="text-sm p-3 rounded-md bg-red-50 text-danger border border-red-200 space-y-1">
                <p>{errorDirecciones}</p>
                <button
                  type="button"
                  onClick={cargarDirecciones}
                  className="text-primary hover:underline font-medium"
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {direcciones.length === 0 && !mostrarNueva && (
                  <p className="text-sm text-text-soft">
                    No tenés direcciones cargadas. Agregá una para continuar.
                  </p>
                )}
                {direcciones.map((d) => {
                  const seleccionada = String(idDireccion) === String(d.id_direccion);
                  return (
                    <label
                      key={d.id_direccion}
                      className={`flex items-start gap-3 border rounded-md px-3 py-2 cursor-pointer ${
                        seleccionada ? "border-primary bg-red-50" : "border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        name="direccion"
                        value={d.id_direccion}
                        checked={seleccionada}
                        onChange={(e) => setIdDireccion(e.target.value)}
                        className="mt-1 accent-primary"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium truncate">
                          {formatDireccionCorta(d)}
                        </span>
                        <span className="block text-xs text-text-soft">
                          {d.ciudad}
                          {d.piso ? ` · Piso ${d.piso}` : ""}
                          {d.departamento ? ` · Dto ${d.departamento}` : ""}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {mostrarNueva && (
              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-sm font-semibold">Nueva dirección</p>
                <DireccionPicker key={formKey} onChange={setNuevaDir} />
                {msgDir && (
                  <p className="text-sm p-2 rounded-md border bg-red-50 text-danger border-red-200">
                    {msgDir}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleAddDireccion}
                  disabled={guardandoDir}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-pill font-semibold disabled:opacity-50"
                >
                  {guardandoDir ? "Guardando..." : "Guardar dirección"}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-border p-5 space-y-4">
            <div className="flex justify-between text-text-soft text-sm">
              <span>Productos ({count})</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-lg border-t border-border pt-3">
              <span>Total a pagar</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>

            {msg.text && (
              <div className="p-3 rounded-md text-sm bg-red-50 text-danger border border-red-200">
                {msg.text}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={clearCart} className="flex-1 border border-border bg-white py-2.5 rounded-pill font-semibold hover:bg-background">
                Vaciar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || loadingDirecciones || guardandoDir || !idDireccion}
                className="flex-1 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-pill font-semibold disabled:opacity-50"
              >
                {loading ? "Confirmando..." : "Confirmar pedido"}
              </button>
            </div>
            <p className="text-xs text-text-soft text-center">Al confirmar se crea un pedido con <span className="font-semibold">POST /api/pedidos</span> a nombre de {user?.rol === "CLIENTE" ? `${user.nombre} ${user.apellido}` : "el usuario seleccionado"}</p>
          </div>
        </>
      )}
      {pedidoConfirmado && <OrderConfirmation pedido={pedidoConfirmado} onClose={() => setPedidoConfirmado(null)} />}
    </div>
  );
}
