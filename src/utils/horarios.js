export const DIAS = [
  { id: 1, nombre: "Lunes", corto: "Lun" },
  { id: 2, nombre: "Martes", corto: "Mar" },
  { id: 3, nombre: "Miércoles", corto: "Mié" },
  { id: 4, nombre: "Jueves", corto: "Jue" },
  { id: 5, nombre: "Viernes", corto: "Vie" },
  { id: 6, nombre: "Sábado", corto: "Sáb" },
  { id: 7, nombre: "Domingo", corto: "Dom" },
];

export const crearHorariosVacios = () =>
  Object.fromEntries(
    DIAS.map((d) => [d.id, { abierto: false, apertura: "", cierre: "" }])
  );

export function formatHora(hora) {
  if (!hora) return "";
  return String(hora).slice(0, 5);
}

// Resume los horarios agrupando días consecutivos con el mismo rango.
export function formatHorarios(horarios) {
  if (!horarios || horarios.length === 0) return "Siempre abierto";
  const ordenados = [...horarios].sort((a, b) => a.dia_semana - b.dia_semana);

  const grupos = [];
  for (const h of ordenados) {
    const rango = `${formatHora(h.hora_apertura)}–${formatHora(h.hora_cierre)}`;
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.rango === rango && ultimo.hasta + 1 === h.dia_semana) {
      ultimo.hasta = h.dia_semana;
    } else {
      grupos.push({ desde: h.dia_semana, hasta: h.dia_semana, rango });
    }
  }

  const partes = grupos.map((g) => {
    const desde = DIAS.find((d) => d.id === g.desde)?.corto || "";
    const hasta = DIAS.find((d) => d.id === g.hasta)?.corto || "";
    return `${g.desde === g.hasta ? desde : `${desde}–${hasta}`} ${g.rango}`;
  });

  const abiertos = new Set(ordenados.map((h) => h.dia_semana));
  const cerrados = DIAS.filter((d) => !abiertos.has(d.id)).map((d) => d.corto);
  if (cerrados.length > 0) partes.push(`Cerrado: ${cerrados.join(", ")}`);

  return partes.join(" · ");
}
