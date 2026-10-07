import { useState } from "react";
import MapPicker from "./MapPicker.jsx";
import { reverseGeocode } from "../utils/geocoding.js";

// Selector de dirección con mapa (OpenStreetMap + Leaflet).
// El usuario ubica el marcador y se autocompletan calle/altura/ciudad/
// provincia/código postal (editables). Avisa al padre con onChange.
export default function DireccionPicker({ onChange }) {
  const [position, setPosition] = useState(null);
  const [fields, setFields] = useState({
    calle: "",
    altura: "",
    ciudad: "",
    provincia: "",
    codigo_postal: "",
  });
  const [piso, setPiso] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [resolviendo, setResolviendo] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");

  const emitir = (f, pos, p = piso, d = departamento) => {
    onChange(
      pos
        ? { ...f, piso: p, departamento: d, latitud: pos[0], longitud: pos[1] }
        : null
    );
  };

  const handlePick = async (lat, lng) => {
    const pos = [lat, lng];
    setPosition(pos);
    setGeoMsg("");
    setResolviendo(true);
    try {
      const r = await reverseGeocode(lat, lng);
      const f = {
        calle: r.calle,
        altura: r.altura,
        ciudad: r.ciudad,
        provincia: r.provincia,
        codigo_postal: r.codigo_postal,
      };
      setFields(f);
      emitir(f, pos);
      if (!r.calle || !r.altura) {
        setGeoMsg("No se encontró una dirección exacta en ese punto, completala manualmente");
      }
    } catch {
      setGeoMsg("No se pudo resolver la dirección, completala manualmente");
      emitir(fields, pos);
    } finally {
      setResolviendo(false);
    }
  };

  const handleField = (e) => {
    const f = { ...fields, [e.target.name]: e.target.value };
    setFields(f);
    emitir(f, position);
  };

  const inputCls = "w-full border border-border rounded-md px-3 py-2 mt-1 text-sm";

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-soft">Tocá el mapa para ubicar el marcador (o arrastralo)</p>
      <MapPicker position={position} onPick={handlePick} />
      {position && (
        <p className="text-xs text-text-soft">
          Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
          {resolviendo && " — resolviendo dirección..."}
        </p>
      )}
      {geoMsg && <p className="text-xs text-text-soft">{geoMsg}</p>}
      <div className="grid md:grid-cols-2 gap-3">
        <label className="text-sm">Calle*
          <input name="calle" value={fields.calle} onChange={handleField} className={inputCls} />
        </label>
        <label className="text-sm">Altura*
          <input name="altura" value={fields.altura} onChange={handleField} className={inputCls} />
        </label>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <label className="text-sm">Ciudad*
          <input name="ciudad" value={fields.ciudad} onChange={handleField} className={inputCls} />
        </label>
        <label className="text-sm">Provincia*
          <input name="provincia" value={fields.provincia} onChange={handleField} className={inputCls} />
        </label>
        <label className="text-sm">Código postal
          <input name="codigo_postal" value={fields.codigo_postal} onChange={handleField} className={inputCls} />
        </label>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <label className="text-sm">Piso
          <input value={piso} onChange={(e) => { setPiso(e.target.value); emitir(fields, position, e.target.value, departamento); }} className={inputCls} />
        </label>
        <label className="text-sm">Departamento
          <input value={departamento} onChange={(e) => { setDepartamento(e.target.value); emitir(fields, position, piso, e.target.value); }} className={inputCls} />
        </label>
      </div>
    </div>
  );
}
