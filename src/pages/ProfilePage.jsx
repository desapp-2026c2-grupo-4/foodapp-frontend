import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getClienteById, updateCliente, cambiarPassword } from "../services/clienteService.js";
import { createDireccion, deleteDireccion } from "../services/direccionService.js";
import DireccionPicker from "../components/DireccionPicker.jsx";
import { formatDireccionCorta } from "../utils/geocoding.js";

export default function ProfilePage() {
  const { user, loginAsCliente } = useAuth();
  const [form, setForm] = useState({ nombre: "", apellido: "", tipo_doc: "", dni: "" });
  const [email, setEmail] = useState("");
  const [passForm, setPassForm] = useState({ passwordActual: "", passwordNueva: "", passwordConfirm: "" });
  const [msgPass, setMsgPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [mostrarFormDir, setMostrarFormDir] = useState(false);
  const [nuevaDir, setNuevaDir] = useState(null);
  const [msgDir, setMsgDir] = useState("");
  const [guardandoDir, setGuardandoDir] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!user || user.rol !== "CLIENTE") { setLoading(false); return; }
    getClienteById(user.id_cliente).then((c) => {
      setForm({ nombre: c.nombre, apellido: c.apellido, tipo_doc: c.tipo_doc || "", dni: c.dni || "" });
      setEmail(c.email || "");
      setDirecciones(c.direcciones || []);
    }).catch((e) => setMsg(e.message)).finally(() => setLoading(false));
  }, [user]);

  if (!user) return <p className="p-8 text-center">Debes <Link to="/" className="text-primary underline">elegir un usuario</Link></p>;
  if (user.rol !== "CLIENTE") return <p className="p-8 text-center text-text-soft">El perfil es solo para clientes. Estás como <b>{user.rol}</b>.</p>;
  if (loading) return <p className="p-8 text-center text-text-soft">Cargando perfil...</p>;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleChangePass = (e) => setPassForm({ ...passForm, [e.target.name]: e.target.value });

  const handleSubmitPass = async (e) => {
    e.preventDefault();
    setMsgPass("");
    if (passForm.passwordNueva !== passForm.passwordConfirm) {
      return setMsgPass("Error: la nueva contraseña y su confirmación no coinciden");
    }
    setSavingPass(true);
    try {
      const r = await cambiarPassword(user.id_cliente, {
        passwordActual: passForm.passwordActual,
        passwordNueva: passForm.passwordNueva,
      });
      setPassForm({ passwordActual: "", passwordNueva: "", passwordConfirm: "" });
      setMsgPass(r.mensaje || "Contraseña actualizada correctamente");
    } catch (err) {
      setMsgPass(`Error: ${err.message}`);
    } finally { setSavingPass(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const actualizado = await updateCliente(user.id_cliente, form);
      loginAsCliente(actualizado);
      setMsg("Datos actualizados correctamente");
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    } finally { setSaving(false); }
  };

  const direccionValida = (d) =>
    d && d.latitud !== undefined && d.calle && d.altura && d.ciudad && d.provincia;

  const refrescarDirecciones = async () => {
    const c = await getClienteById(user.id_cliente);
    setDirecciones(c.direcciones || []);
    loginAsCliente(c);
  };

  const handleAddDireccion = async () => {
    setMsgDir("");
    if (!direccionValida(nuevaDir)) {
      return setMsgDir("Error: ubicá el punto en el mapa (calle, altura, ciudad y provincia)");
    }
    setGuardandoDir(true);
    try {
      await createDireccion(user.id_cliente, {
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
      setNuevaDir(null);
      setFormKey((k) => k + 1);
      setMostrarFormDir(false);
      await refrescarDirecciones();
    } catch (err) {
      setMsgDir(`Error: ${err.message}`);
    } finally {
      setGuardandoDir(false);
    }
  };

  const handleDeleteDireccion = async (id) => {
    if (!confirm("¿Eliminar esta dirección?")) return;
    setMsgDir("");
    try {
      await deleteDireccion(user.id_cliente, id);
      await refrescarDirecciones();
    } catch (err) {
      setMsgDir(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-extrabold">Mi perfil — #{user.id_cliente}</h1>
      <p className="text-sm text-text-soft mb-6">Modifica tus datos y guarda</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-border p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">Nombre<input name="nombre" value={form.nombre} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" /></label>
          <label className="text-sm">Apellido<input name="apellido" value={form.apellido} onChange={handleChange} required className="w-full border border-border rounded-md px-3 py-2 mt-1" /></label>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">Tipo doc<input name="tipo_doc" value={form.tipo_doc} onChange={handleChange} placeholder="DNI" className="w-full border border-border rounded-md px-3 py-2 mt-1" /></label>
          <label className="text-sm">DNI<input name="dni" value={form.dni} onChange={handleChange} className="w-full border border-border rounded-md px-3 py-2 mt-1" /></label>
        </div>
        <div className="text-sm">
          <p className="text-text-soft">Email (no se puede modificar, es tu credencial de acceso)</p>
          <p className="font-medium mt-1">{email}</p>
        </div>

        {msg && <p className={`text-sm p-2 rounded-md border ${msg.startsWith("Error") ? "bg-red-50 text-danger border-red-200" : "bg-green-50 text-success border-green-200"}`}>{msg}</p>}

        <div className="flex gap-3">
          <Link to="/catalogo" className="flex-1 text-center border border-border bg-white py-2.5 rounded-pill font-semibold">Cancelar</Link>
          <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary-dark text-white py-2.5 rounded-pill font-semibold disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
        <p className="text-xs text-text-soft text-center">PUT /api/clientes/:id</p>
      </form>

      <form onSubmit={handleSubmitPass} className="bg-white rounded-lg border border-border p-6 mt-6 space-y-4">
        <h2 className="font-extrabold text-lg">Cambiar contraseña</h2>
        <label className="text-sm block">Contraseña actual
          <input name="passwordActual" type="password" value={passForm.passwordActual} onChange={handleChangePass} required className="w-full border border-border rounded-md px-3 py-2 mt-1" />
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">Nueva contraseña (mín. 6)
            <input name="passwordNueva" type="password" value={passForm.passwordNueva} onChange={handleChangePass} required minLength={6} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
          <label className="text-sm">Repetir nueva contraseña
            <input name="passwordConfirm" type="password" value={passForm.passwordConfirm} onChange={handleChangePass} required minLength={6} className="w-full border border-border rounded-md px-3 py-2 mt-1" />
          </label>
        </div>
        {msgPass && <p className={`text-sm p-2 rounded-md border ${msgPass.startsWith("Error") ? "bg-red-50 text-danger border-red-200" : "bg-green-50 text-success border-green-200"}`}>{msgPass}</p>}
        <button type="submit" disabled={savingPass} className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-pill font-semibold disabled:opacity-50">
          {savingPass ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </form>

      <div className="bg-white rounded-lg border border-border p-6 mt-6">
        <div className="flex justify-between items-center">
          <h2 className="font-extrabold text-lg">Mis direcciones</h2>
          <button
            onClick={() => setMostrarFormDir((v) => !v)}
            className="text-sm text-primary hover:underline font-medium"
          >
            {mostrarFormDir ? "Cancelar" : "+ Agregar"}
          </button>
        </div>

        {mostrarFormDir && (
          <div className="mt-4 border-t border-border pt-4 space-y-3">
            <p className="text-sm font-semibold">Nueva dirección</p>
            <DireccionPicker key={formKey} onChange={setNuevaDir} />
            {msgDir && (
              <p className="text-sm p-2 rounded-md border bg-red-50 text-danger border-red-200">{msgDir}</p>
            )}
            <button
              onClick={handleAddDireccion}
              disabled={guardandoDir}
              className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-pill font-semibold disabled:opacity-50"
            >
              {guardandoDir ? "Guardando..." : "Guardar dirección"}
            </button>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {direcciones.length === 0 && !mostrarFormDir && (
            <p className="text-sm text-text-soft">Todavía no tenés direcciones cargadas.</p>
          )}
          {direcciones.map((d) => (
            <div key={d.id_direccion} className="flex justify-between items-center gap-3 border border-border rounded-md px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{formatDireccionCorta(d)}</p>
                <p className="text-xs text-text-soft">
                  {d.ciudad}{d.piso ? ` · Piso ${d.piso}` : ""}{d.departamento ? ` · Dto ${d.departamento}` : ""}
                </p>
              </div>
              <button
                onClick={() => handleDeleteDireccion(d.id_direccion)}
                className="text-xs text-danger hover:underline shrink-0"
              >
                Eliminar
              </button>
            </div>
          ))}
          {msgDir && !mostrarFormDir && (
            <p className="text-sm p-2 rounded-md border bg-red-50 text-danger border-red-200">{msgDir}</p>
          )}
        </div>
      </div>
    </div>
  );
}
