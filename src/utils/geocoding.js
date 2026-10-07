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
