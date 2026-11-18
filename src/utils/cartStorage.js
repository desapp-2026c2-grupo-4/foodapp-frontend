const STORAGE_PREFIX = "foodapp_cart";
const STORAGE_VERSION = 1;

export const CART_GUEST_KEY = `${STORAGE_PREFIX}_guest`;

const getStorage = () => {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
};

const normalizarOpcionales = (opcionales) =>
  Array.isArray(opcionales)
    ? opcionales
        .filter((opcional) => opcional && opcional.id_opcional != null)
        .map((opcional) => ({
          id_opcional: opcional.id_opcional,
          nombre: opcional.nombre || "",
          precio: Number(opcional.precio) || 0,
        }))
    : [];

export const claveItemProducto = (idProducto, opcionales) => {
  const ids = (opcionales || [])
    .map((opcional) => opcional.id_opcional)
    .sort((a, b) => a - b)
    .join("-");
  return `${idProducto}::${ids}`;
};

export const claveCarritoCliente = (idCliente) =>
  `${STORAGE_PREFIX}_cliente_${idCliente}`;

export const claveCarritoUsuario = (user) => {
  if (user?.id_cliente) return claveCarritoCliente(user.id_cliente);
  if (user?.id_empleado) return `${STORAGE_PREFIX}_empleado_${user.id_empleado}`;
  return CART_GUEST_KEY;
};

const normalizarItem = (item) => {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;

  const cantidad = Math.max(1, Math.floor(Number(item.cantidad) || 1));
  const cartId = item.cartId ?? `${Date.now()}-${Math.random()}`;

  if (item.tipo === "promocion") {
    if (item.id_promocion == null) return null;
    return {
      ...item,
      cartId,
      _key: item._key || `promo::${item.id_promocion}`,
      tipo: "promocion",
      id_promocion: item.id_promocion,
      nombre: item.nombre || "",
      precio: Number(item.precio) || 0,
      imagen: item.imagen ?? null,
      cantidad,
      observaciones:
        typeof item.observaciones === "string" ? item.observaciones : "",
      productos: Array.isArray(item.productos)
        ? item.productos
            .filter((producto) => producto && producto.id_producto != null)
            .map((producto) => ({
              id_producto: producto.id_producto,
              nombre: producto.nombre || "",
              cantidad: Math.max(
                1,
                Math.floor(Number(producto.cantidad) || 1)
              ),
            }))
        : [],
    };
  }

  if (item.id_producto == null) return null;
  const opcionales = normalizarOpcionales(item.opcionales);
  return {
    ...item,
    cartId,
    _key: item._key || claveItemProducto(item.id_producto, opcionales),
    id_producto: item.id_producto,
    nombre: item.nombre || "",
    precio: Number(item.precio) || 0,
    imagen: item.imagen ?? null,
    cantidad,
    observaciones:
      typeof item.observaciones === "string" ? item.observaciones : "",
    opcionales,
  };
};

export const leerCarrito = (storageKey) => {
  const storage = getStorage();
  if (!storage || !storageKey) return [];

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : parsed?.items;
    if (!Array.isArray(items)) return [];
    return items.map(normalizarItem).filter(Boolean);
  } catch {
    return [];
  }
};

export const guardarCarrito = (storageKey, items) => {
  const storage = getStorage();
  if (!storage || !storageKey) return;

  try {
    storage.setItem(
      storageKey,
      JSON.stringify({ version: STORAGE_VERSION, items })
    );
  } catch {
    // Si el almacenamiento no está disponible, el carrito sigue en memoria.
  }
};

export const eliminarCarrito = (storageKey) => {
  const storage = getStorage();
  if (!storage || !storageKey) return;

  try {
    storage.removeItem(storageKey);
  } catch {
    // Ignorar errores de almacenamiento.
  }
};

export const fusionarCarritos = (base = [], extra = []) => {
  const resultado = base.map((item) => ({ ...item }));

  for (const item of extra) {
    const indice = resultado.findIndex(
      (existente) => existente._key === item._key
    );
    if (indice >= 0) {
      resultado[indice] = {
        ...resultado[indice],
        cantidad: resultado[indice].cantidad + item.cantidad,
        observaciones:
          resultado[indice].observaciones || item.observaciones || "",
      };
      continue;
    }
    resultado.push({
      ...item,
      cartId: `${Date.now()}-${Math.random()}`,
    });
  }

  return resultado;
};

export const cargarCarritoInicial = (storageKey, idCliente) => {
  const propio = leerCarrito(storageKey);
  if (!idCliente) return propio;

  const invitado = leerCarrito(CART_GUEST_KEY);
  if (invitado.length === 0) return propio;

  const fusionado = fusionarCarritos(propio, invitado);
  guardarCarrito(storageKey, fusionado);
  eliminarCarrito(CART_GUEST_KEY);
  return fusionado;
};
