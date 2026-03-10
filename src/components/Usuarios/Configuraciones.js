import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotificaciones } from "../../context/NotificationsContext";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";
import {
  uploadProfilePhoto,
  deleteProfilePhoto,
  getUsuariosBloqueados,
  desbloquearUsuario,
  actualizarPerfil,
  deleteUser,
} from "../../api/user";
import DOMPurify from "dompurify";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import StoryArchive from "../Stories/StoryArchive";
import {
  Camera,
  Trash2,
  Volume2,
  VolumeX,
  ShieldAlert,
  User as UserIcon,
  Key,
  Eye,
  EyeOff,
  Save,
  UserX,
  XCircle,
  Music
} from "lucide-react";

import { NOTIF_SOUNDS } from "../../utils/sounds";

const Configuraciones = () => {
  const { user, setUser } = useAuth();
  const { sonidoHabilitado, habilitarSonido, deshabilitarSonido } = useNotificaciones();
  const { showConfirm } = useModal();
  const { success, error: showError } = useToast();

  const [form, setForm] = useState({
    nombre: user?.nombre || "",
    passwordActual: "",
    passwordNueva: "",
    confirmarPassword: "",
    bio: user?.bio || "",
    ubicacion: user?.ubicacion || "",
    sitioWeb: user?.sitioWeb || "",
  });
  const [mostrarPasswords, setMostrarPasswords] = useState(false);
  const [bloqueados, setBloqueados] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const cargarBloqueados = async () => {
      try {
        const data = await getUsuariosBloqueados();
        setBloqueados(data);
      } catch (error) {
        setErrorMsg("Error al cargar usuarios bloqueados.");
      }
    };
    cargarBloqueados();
  }, []);

  const handleDesbloquear = async (userId) => {
    const confirmed = await showConfirm("Desbloquear", "¿Seguro que quieres desbloquear este usuario?");
    if (!confirmed) return;
    try {
      await desbloquearUsuario(userId);
      setBloqueados((prev) => prev.filter((u) => (u._id || u.id) !== userId));
      success("Usuario desbloqueado");
    } catch (err) {
      console.error(err);
      showError("Error al desbloquear");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && !selectedFile.type.startsWith("image/")) {
      setErrorMsg("Solo se permiten archivos de imagen.");
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("fotoPerfil", file);
    setLoading(true);
    try {
      const res = await uploadProfilePhoto(formData);
      const updatedUser = { ...user, fotoPerfil: res.fotoPerfil };
      setUser(updatedUser);
      localStorage.setItem("usuario", JSON.stringify(updatedUser));
      setFile(null);
      success("Foto actualizada");
    } catch (err) {
      console.error(err);
      showError("Error al subir foto");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm("Eliminar foto", "¿Eliminar foto de perfil?");
    if (!confirmed) return;
    setLoading(true);
    try {
      await deleteProfilePhoto();
      const updatedUser = { ...user, fotoPerfil: "" };
      setUser(updatedUser);
      localStorage.setItem("usuario", JSON.stringify(updatedUser));
    } catch (error) {
      setErrorMsg("Error al eliminar foto.");
    } finally {
      setLoading(false);
    }
  };

  const handleActualizarPerfil = async () => {
    const sanitizedNombre = DOMPurify.sanitize(form.nombre.trim());
    setLoading(true);
    try {
      const datosActualizados = {};
      if (sanitizedNombre) datosActualizados.nombre = sanitizedNombre;
      if (form.bio) datosActualizados.bio = form.bio.trim();
      if (form.ubicacion) datosActualizados.ubicacion = form.ubicacion.trim();
      if (form.sitioWeb) datosActualizados.sitioWeb = form.sitioWeb.trim();
      if (form.passwordActual) {
        datosActualizados.passwordActual = form.passwordActual;
        datosActualizados.passwordNueva = form.passwordNueva;
      }

      const res = await actualizarPerfil(datosActualizados);
      if (res.nombre) setUser({ ...user, nombre: res.nombre });
      if (res.bio !== undefined) setUser({ ...user, bio: res.bio });
      if (res.ubicacion !== undefined) setUser({ ...user, ubicacion: res.ubicacion });
      if (res.sitioWeb !== undefined) setUser({ ...user, sitioWeb: res.sitioWeb });

      const updatedUser = { ...user, ...datosActualizados };
      delete updatedUser.passwordActual;
      delete updatedUser.passwordNueva;
      localStorage.setItem("usuario", JSON.stringify(updatedUser));

      setForm({ ...form, passwordActual: "", passwordNueva: "", confirmarPassword: "" });
      success("Perfil actualizado");
    } catch (err) {
      console.error(err);
      showError(err?.response?.data?.mensaje || "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="p-8 pb-4">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Configuraciones</h1>
        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Personaliza tu experiencia</p>
      </div>

      {errorMsg && (
        <div className="mx-8 mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-sm font-bold">{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-8">
        {/* Profile Picture Section */}
        <div className="bg-white border border-red-50 rounded-[3rem] p-8 shadow-xl shadow-red-100/20">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <Camera className="w-6 h-6 text-red-600" />
            <span>Imagen de Perfil</span>
          </h2>
          <div className="flex flex-col items-center gap-6">
            <div className="relative group/avatar">
              <div className="absolute inset-0 bg-red-600 rounded-[2.5rem] blur-xl opacity-10 group-hover/avatar:opacity-20 transition-opacity"></div>
              <img
                src={user?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                alt="Perfil"
                className="w-40 h-40 object-cover rounded-[2.5rem] border-4 border-white shadow-lg relative z-10"
              />
            </div>

            <div className="w-full space-y-3">
              <label className="flex items-center justify-center gap-2 w-full py-4 bg-gray-50 text-gray-600 font-black text-xs uppercase tracking-widest rounded-3xl cursor-pointer hover:bg-gray-100 transition-all border-2 border-dashed border-gray-200">
                <Camera className="w-4 h-4" />
                <span>{file ? file.name : "Seleccionar Imagen"}</span>
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>

              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={loading || !file}
                  className="flex-1 py-4 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-3xl shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-40"
                >
                  Subir
                </button>
                {user?.fotoPerfil && (
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="p-4 bg-red-50 text-red-600 rounded-3xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences / Sound */}
        <div className="bg-white border border-red-50 rounded-[3rem] p-8 shadow-xl shadow-red-100/20">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <Volume2 className="w-6 h-6 text-red-600" />
            <span>Preferencias</span>
          </h2>
          <div className="space-y-4">
            <div className={`p-6 rounded-[2.5rem] transition-all flex items-center justify-between ${sonidoHabilitado ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
              <div className="flex items-center gap-4">
                {sonidoHabilitado ? <Volume2 className="w-8 h-8" /> : <VolumeX className="w-8 h-8" />}
                <div>
                  <p className="font-black text-sm uppercase tracking-wider">Sonido</p>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-tighter">Notificaciones</p>
                </div>
              </div>
              <button
                onClick={sonidoHabilitado ? deshabilitarSonido : habilitarSonido}
                className={`px-6 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${sonidoHabilitado ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-red-600 hover:text-white'}`}
              >
                {sonidoHabilitado ? 'On' : 'Off'}
              </button>
            </div>

            <div className="p-6 bg-red-50 rounded-[2.5rem]">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 mb-4 ml-2 flex items-center gap-2">
                <Music className="w-3 h-3" />
                <span>Tipo de Sonido</span>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {NOTIF_SOUNDS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      const newConfig = { ...user?.configuracionStatus, sonidoTipo: s.id };
                      setUser({ ...user, configuracionStatus: newConfig });
                      actualizarPerfil({ configuracionStatus: newConfig });
                      // Probar sonido
                      const audio = new Audio(s.url);
                      audio.play().catch(e => console.error("Error al reproducir audio", e));
                    }}
                    className={`py-3 rounded-2xl text-[10px] font-black transition-all ${(user?.configuracionStatus?.sonidoTipo || 'classic') === s.id ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-red-100'}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 bg-red-50 rounded-[2.5rem]">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 mb-4 ml-2">Duración de Estados</h4>
              <div className="grid grid-cols-3 gap-2">
                {[1, 4, 8, 12, 24, 72].map(h => (
                  <button
                    key={h}
                    onClick={() => {
                      const newConfig = { ...user?.configuracionStatus, duracion: h };
                      setUser({ ...user, configuracionStatus: newConfig });
                      actualizarPerfil({ configuracionStatus: newConfig });
                    }}
                    className={`py-3 rounded-2xl text-[10px] font-black transition-all ${(user?.configuracionStatus?.duracion || 24) === h ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-red-100'}`}
                  >
                    {h}H
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Info Profile */}
        <div className="bg-white border border-red-50 rounded-[3rem] p-8 shadow-xl shadow-red-100/20 lg:col-span-2">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <UserIcon className="w-6 h-6 text-red-600" />
            <span>Información del Perfil</span>
          </h2>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Bio (describe quién eres)"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-[2rem] text-sm focus:bg-white focus:ring-2 focus:ring-red-500 transition-all outline-none font-bold"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Ubicación (ciudad, país)"
                value={form.ubicacion}
                onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-[2rem] text-sm focus:bg-white focus:ring-2 focus:ring-red-500 transition-all outline-none font-bold"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Sitio web"
                value={form.sitioWeb}
                onChange={(e) => setForm({ ...form, sitioWeb: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-[2rem] text-sm focus:bg-white focus:ring-2 focus:ring-red-500 transition-all outline-none font-bold"
              />
            </div>
          </div>
        </div>

        {/* Security / Profile Update */}
        <div className="bg-white border border-red-50 rounded-[3rem] p-8 shadow-xl shadow-red-100/20 lg:col-span-2">
          <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
            <Key className="w-6 h-6 text-red-600" />
            <span>Seguridad del Perfil</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="relative">
                <UserIcon className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nuevo nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-[2rem] text-sm focus:bg-white focus:ring-2 focus:ring-red-500 transition-all outline-none font-bold"
                />
              </div>
              <div className="flex items-center gap-4 p-4 bg-red-50 rounded-[2rem]">
                <button onClick={() => setMostrarPasswords(!mostrarPasswords)} className="text-red-600 bg-white p-2 rounded-xl shadow-sm">
                  {mostrarPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <span className="text-xs font-black text-red-700 uppercase tracking-widest">Mostrar Contraseñas</span>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type={mostrarPasswords ? "text" : "password"}
                placeholder="Contraseña Actual"
                value={form.passwordActual}
                onChange={(e) => setForm({ ...form, passwordActual: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-[2rem] text-sm focus:bg-white focus:ring-2 focus:ring-red-500 transition-all outline-none"
              />
              <input
                type={mostrarPasswords ? "text" : "password"}
                placeholder="Nueva Contraseña"
                value={form.passwordNueva}
                onChange={(e) => setForm({ ...form, passwordNueva: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-[2rem] text-sm focus:bg-white focus:ring-2 focus:ring-red-500 transition-all outline-none"
              />
              <input
                type={mostrarPasswords ? "text" : "password"}
                placeholder="Confirmar Contraseña"
                value={form.confirmarPassword}
                onChange={(e) => setForm({ ...form, confirmarPassword: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-[2rem] text-sm focus:bg-white focus:ring-2 focus:ring-red-500 transition-all outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleActualizarPerfil}
            disabled={loading}
            className="mt-8 w-full py-5 bg-red-600 text-white font-black uppercase tracking-[0.3em] text-xs rounded-[2.5rem] shadow-xl shadow-red-200 hover:bg-red-700 hover:scale-[1.01] active:scale-100 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>Guardar Cambios</span>
          </button>
        </div>

        {/* Blocked Users */}
        <div className="bg-white border border-red-50 rounded-[3rem] p-8 shadow-xl shadow-red-100/20 lg:col-span-2">
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
            <UserX className="w-6 h-6 text-red-600" />
            <span>Usuarios Bloqueados</span>
          </h2>
          {bloqueados.length === 0 ? (
            <div className="py-12 text-center opacity-20">
              <UserX className="w-16 h-16 mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest text-xs">No hay bloqueos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bloqueados.map((usuario) => (
                <div key={usuario._id || usuario.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-[2rem] border border-gray-100 group">
                  <div className="flex items-center gap-4">
                    <img
                      src={usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                      alt="avatar"
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-white"
                    />
                    <div>
                      <p className="font-black text-gray-900 text-sm">{usuario.nombre}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">@{usuario.username || 'usuario'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDesbloquear(usuario._id || usuario.id)}
                    className="px-4 py-2 bg-white text-green-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                  >
                    Desbloquear
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Story Archive */}
        <div className="lg:col-span-2">
          <StoryArchive />
        </div>

        {/* Danger Zone */}
        <div className="lg:col-span-2 pt-8 text-center">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-8 py-3 text-red-300 hover:text-red-700 font-black text-[10px] uppercase tracking-[0.4em] transition-all flex items-center gap-4 mx-auto group"
          >
            <XCircle className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>Eliminar mi Cuenta permanentemente</span>
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmDeleteModal
          onConfirm={handleDeleteAccountConfirmed}
          onClose={() => setShowDeleteModal(false)}
          loading={loading}
          error={errorMsg}
        />
      )}
    </div>
  );

  async function handleDeleteAccountConfirmed(password) {
    setLoading(true);
    try {
      await deleteUser(password);
      setUser(null);
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch { setErrorMsg("Error al eliminar cuenta."); }
    finally { setLoading(false); setShowDeleteModal(false); }
  }
};

export default Configuraciones;

