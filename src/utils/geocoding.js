// Geocodificación inversa con Nominatim (OpenStreetMap).
// Convierte lat/lng en calle, altura, ciudad, provincia y código postal.

// Lectura corta para mostrar en el frontend: calle, altura, provincia y CP
export function formatDireccionCorta(d) {
  if (!d) return "—";
  const base = `${d.calle || ""} ${d.altura || ""}`.trim();
  const prov = d.provincia || "";
  const cp = d.codigo_postal ? ` (CP ${d.codigo_postal})` : "";
  return `${base}${base && prov ? ", " : ""}${prov}${cp}`.trim() || "—";
}

// Geocodificación directa (dirección -> coordenadas).
// Recibe las partes de la dirección, arma la consulta con las no vacías
// y devuelve [lat, lng] o null si Nominatim no encuentra resultados.
export async function forwardGeocode({ calle, altura, ciudad, provincia, codigo_postal } = {}) {
  const query = [calle, altura, ciudad, provincia, codigo_postal]
    .map((p) => (p ?? "").toString().trim())
    .filter(Boolean)
    .join(", ");
  if (!query) return null;

  const url =
    `https://nominatim.openstreetmap.org/search?format=jsonv2` +
    `&addressdetails=1&limit=1&accept-language=es` +
    `&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("No se pudo ubicar la dirección");
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return [lat, lng];
}

export async function reverseGeocode(lat, lng) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
    `&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}` +
    `&addressdetails=1&accept-language=es`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("No se pudo resolver la dirección");
  const data = await res.json();
  const a = data.address || {};
  return {
    calle: a.road || a.pedestrian || a.cycleway || a.footway || "",
    altura: a.house_number || "",
    ciudad:
      a.city || a.town || a.village || a.municipality ||
      a.city_district || a.suburb || a.county || "",
    provincia: a.state || "",
    codigo_postal: a.postcode || "",
    display: data.display_name || "",
  };
}
