import { useCallback, useEffect, useRef, useState } from "react";
import { forwardGeocode } from "../utils/geocoding.js";

// Geocodificación directa con debounce para no saturar Nominatim (máx. 1 req/seg).
// - buscar(parts, onResult): agenda la consulta y descarta respuestas viejas.
// - onResult recibe [lat, lng] o null si no hay resultados.
export default function useDebouncedForwardGeocode(delay = 700) {
  const [resolviendo, setResolviendo] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef(null);
  const reqId = useRef(0);

  const limpiarTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    reqId.current += 1;
  }, []);

  const cancelar = useCallback(() => {
    limpiarTimer();
    setResolviendo(false);
    setError("");
  }, [limpiarTimer]);

  const buscar = useCallback(
    (parts, onResult) => {
      limpiarTimer();
      const id = reqId.current;
      setError("");
      setResolviendo(true);
      timer.current = setTimeout(async () => {
        try {
          const pos = await forwardGeocode(parts);
          if (id !== reqId.current) return;
          setResolviendo(false);
          onResult?.(pos);
        } catch (e) {
          if (id !== reqId.current) return;
          setResolviendo(false);
          setError(e.message);
        }
      }, delay);
    },
    [delay, limpiarTimer]
  );

  // Al desmontar solo limpiamos el timer, sin tocar estado.
  useEffect(() => limpiarTimer, [limpiarTimer]);

  return { buscar, cancelar, resolviendo, error };
}
