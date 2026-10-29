const TIMEZONE = "America/Argentina/Buenos_Aires";

const formateador = new Intl.DateTimeFormat("es-AR", {
  timeZone: TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function obtenerPartes(fecha) {
  const partes = {};
  for (const parte of formateador.formatToParts(fecha)) {
    if (parte.type !== "literal") partes[parte.type] = parte.value;
  }
  return partes;
}

export function formatFechaHora(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  const partes = obtenerPartes(fecha);
  return `${partes.day}/${partes.month}/${partes.year} ${partes.hour}:${partes.minute}`;
}

export function formatFecha(valor) {
  if (!valor) return "—";
  const fecha = String(valor).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return "—";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export function toInputDate(valor) {
  if (!valor) return "";
  return String(valor).slice(0, 10);
}
