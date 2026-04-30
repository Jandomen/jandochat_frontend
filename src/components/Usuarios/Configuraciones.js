import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotificaciones } from "../../context/NotificationsContext";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";
import {
  uploadProfilePhoto,
  uploadCoverPhoto,
  getUsuariosBloqueados,
  desbloquearUsuario,
  actualizarPerfil,
  deleteUser,
} from "../../api/user";
import DOMPurify from "dompurify";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import StoryArchive from "../Stories/StoryArchive";
import MediaPickerModal from "../UI/MediaPickerModal";
import {
  Camera,
  Volume2,
  ShieldAlert,
  User as UserIcon,
  Key,
  Eye,
  EyeOff,
  Save,
  UserX,
  XCircle,
  Settings,
  Clock,
  Globe
} from "lucide-react";

import { NOTIF_SOUNDS } from "../../utils/sounds";
import { useLanguage } from "../../context/LanguageContext";

const Configuraciones = () => {
  const { user, setUser } = useAuth();
  const { language, setLanguage, t, translations } = useLanguage();
  const { sonidoHabilitado, habilitarSonido, deshabilitarSonido } = useNotificaciones();
  const { showConfirm } = useModal();
  const { success, error: showError } = useToast();
  const profileInputRef = React.useRef(null);
  const coverInputRef = React.useRef(null);

  const [form, setForm] = useState({
    nombre: user?.nombre || "",
    username: user?.username || "",
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
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // 'profile' or 'cover'

  useEffect(() => {
    const cargarBloqueados = async () => {
      try {
        const data = await getUsuariosBloqueados();
        setBloqueados(data);
      } catch (error) {
        setErrorMsg(t('error'));
      }
    };
    cargarBloqueados();
  }, [t]);

  const handleDesbloquear = async (userId) => {
    const confirmed = await showConfirm(t('unblock'), t('confirm_unblock_user'));
    if (!confirmed) return;
    try {
      await desbloquearUsuario(userId);
      setBloqueados((prev) => prev.filter((u) => (u._id || u.id) !== userId));
      success(t('user_unblocked'));
    } catch (err) {
      console.error(err);
      showError(t('error'));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && !selectedFile.type.startsWith("image/")) {
      setErrorMsg(t('only_images_error') || "Solo se permiten imágenes");
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
      success(t('success'));
    } catch (err) {
      console.error(err);
      showError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCoverFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && !selectedFile.type.startsWith("image/")) {
      setErrorMsg(t('only_images_error') || "Solo se permiten imágenes");
      return;
    }
    setCoverFile(selectedFile);
  };

  const handleUploadCover = async () => {
    if (!coverFile) return;
    const formData = new FormData();
    formData.append("fotoPortada", coverFile);
    setLoading(true);
    try {
      const res = await uploadCoverPhoto(formData);
      const updatedUser = { ...user, fotoPortada: res.fotoPortada };
      setUser(updatedUser);
      localStorage.setItem("usuario", JSON.stringify(updatedUser));
      setCoverFile(null);
      success(t('success'));
    } catch (err) {
      console.error(err);
      showError(t('error'));
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
      if (form.username) datosActualizados.username = form.username.trim();
      if (form.bio) datosActualizados.bio = form.bio.trim();
      if (form.ubicacion) datosActualizados.ubicacion = form.ubicacion.trim();
      if (form.sitioWeb) datosActualizados.sitioWeb = form.sitioWeb.trim();
      if (form.passwordActual) {
        datosActualizados.passwordActual = form.passwordActual;
        datosActualizados.passwordNueva = form.passwordNueva;
      }
      datosActualizados.idioma = language;

      const res = await actualizarPerfil(datosActualizados);
      if (res.nombre) setUser({ ...user, nombre: res.nombre, username: res.username });
      if (res.bio !== undefined) setUser((prev) => ({ ...prev, bio: res.bio }));
      if (res.ubicacion !== undefined) setUser({ ...user, ubicacion: res.ubicacion });
      if (res.sitioWeb !== undefined) setUser({ ...user, sitioWeb: res.sitioWeb });

      const updatedUser = { ...user, ...datosActualizados, idioma: language };
      delete updatedUser.passwordActual;
      delete updatedUser.passwordNueva;
      setUser(updatedUser);
      localStorage.setItem("usuario", JSON.stringify(updatedUser));

      setForm({ ...form, passwordActual: "", passwordNueva: "", confirmarPassword: "" });
      success(t('success'));
    } catch (err) {
      console.error(err);
      showError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 px-2 sm:px-4">
      <MediaPickerModal 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)} 
        onSelect={(type) => {
          const input = pickerTarget === 'profile' ? profileInputRef.current : coverInputRef.current;
          if (!input) return;
          if (type === 'camera') {
            input.setAttribute('capture', 'environment');
          } else {
            input.removeAttribute('capture');
          }
          setTimeout(() => input.click(), 100);
        }}
        filter={["camera", "gallery"]}
      />
      <div className="py-4 sm:py-8 px-2 flex items-center justify-between">
        <div>
          <p className="text-[8px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-red-600 mb-0.5">{t('control_center')}</p>
          <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">{t('settings_label')}</h1>
        </div>
        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-200">
          <Settings className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <ShieldAlert className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase">{errorMsg}</span>
        </div>
      )}

      <div className="space-y-3">
        {/* Header: Profile & Cover Integrated */}
        <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-xl shadow-gray-200/50">
          <div className="relative h-20 sm:h-32 group">
            <img
              src={user?.fotoPortada || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop"}
              alt={t('cover')}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <button 
                onClick={() => { setPickerTarget('cover'); setIsPickerOpen(true); }}
                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white cursor-pointer hover:bg-white/40 transition-all border border-white/20"
              >
                <Camera className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </button>
              <input type="file" ref={coverInputRef} className="hidden" onChange={handleCoverFileChange} accept="image/*" />
              {coverFile && (
                <button 
                  onClick={handleUploadCover}
                  className="ml-2 px-3 py-1 bg-red-600 text-white text-[8px] sm:text-[11px] font-black uppercase rounded-full shadow-lg"
                >
                  {t('confirm')}
                </button>
              )}
            </div>
          </div>
          <div className="px-4 pb-4 -mt-8 sm:-mt-12 relative z-10">
            <div className="flex items-end gap-3 mb-2">
              <div className="relative group/avatar">
                <img
                  src={user?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                  alt={t('profile_label')}
                  className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-2xl sm:rounded-3xl border-4 border-white shadow-xl"
                />
                <button 
                  onClick={() => { setPickerTarget('profile'); setIsPickerOpen(true); }}
                  className="absolute inset-0 bg-black/40 rounded-2xl sm:rounded-3xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input type="file" ref={profileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
              </div>
              <div className="mb-1 flex-1">
                <h3 className="text-sm sm:text-lg font-black text-gray-900 leading-none">{user?.nombre}</h3>
                <p className="text-[8px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest">@{user?.username || t('user_placeholder')}</p>
                {file && (
                  <button 
                    onClick={handleUpload}
                    className="mt-1 px-3 py-0.5 bg-red-600 text-white text-[7px] sm:text-[10px] font-black uppercase rounded-full"
                  >
                    {t('save_photo')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-red-600" />
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-900">{t('sound')}</span>
              </div>
              <button
                onClick={sonidoHabilitado ? deshabilitarSonido : habilitarSonido}
                className={`w-8 h-4 sm:w-10 sm:h-5 rounded-full relative transition-all ${sonidoHabilitado ? 'bg-green-500' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full transition-all ${sonidoHabilitado ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
              {NOTIF_SOUNDS.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    const newConfig = { ...user?.configuracionStatus, sonidoTipo: s.id };
                    setUser({ ...user, configuracionStatus: newConfig });
                    actualizarPerfil({ configuracionStatus: newConfig });
                    new Audio(s.url).play().catch(e => {});
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[8px] sm:text-[11px] font-black transition-all ${(user?.configuracionStatus?.sonidoTipo || 'classic') === s.id ? 'bg-red-600 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-red-50'}`}
                >
                  <span className="uppercase tracking-widest">{s.name}</span>
                  {(user?.configuracionStatus?.sonidoTipo || 'classic') === s.id && <div className="w-1 h-1 bg-white rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-red-600" />
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-900">{t('status_duration')}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[4, 12, 24, 72, 168].map(h => (
                <button
                  key={h}
                  onClick={() => {
                    const newConfig = { ...user?.configuracionStatus, duracion: h };
                    setUser({ ...user, configuracionStatus: newConfig });
                    actualizarPerfil({ configuracionStatus: newConfig });
                  }}
                  className={`py-1.5 rounded-lg text-[8px] sm:text-[11px] font-black transition-all ${(user?.configuracionStatus?.duracion || 24) === h ? 'bg-red-600 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-red-50'}`}
                >
                  {h === 168 ? `1 ${t('week_short')}` : `${h}${t('hours_short')}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Language Selection */}
        <div className="bg-white/70 backdrop-blur-md border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-red-600" />
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-gray-900">{t('language')}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.keys(translations).map(l => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${language === l ? 'bg-red-600 text-white shadow-lg scale-105' : 'bg-gray-50 text-gray-400 hover:bg-red-50'}`}
              >
                {t(`lang_${l.split('-')[0]}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Info Form */}
        <div className="bg-white border border-gray-100 rounded-[2rem] p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <UserIcon className="w-4 h-4 text-red-600" />
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-gray-900">{t('personal_info')}</span>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-[7px] font-black uppercase text-gray-400 ml-3 mb-1">{t('name')}</p>
              <input
                type="text"
                placeholder={t('name')}
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[10px] focus:bg-white focus:ring-1 focus:ring-red-500 transition-all outline-none font-bold"
              />
            </div>
            <div>
              <p className="text-[7px] font-black uppercase text-gray-400 ml-3 mb-1">{t('username')}</p>
              <input
                type="text"
                placeholder={`@${t('username')}`}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[10px] focus:bg-white focus:ring-1 focus:ring-red-500 transition-all outline-none font-bold mb-2"
              />
            </div>
            <div>
              <p className="text-[7px] font-black uppercase text-gray-400 ml-3 mb-1">{t('bio')}</p>
              <textarea
                placeholder={t('bio')}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[10px] focus:bg-white focus:ring-1 focus:ring-red-500 transition-all outline-none font-bold resize-none h-12"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[7px] font-black uppercase text-gray-400 ml-3 mb-1">{t('location')}</p>
                <input
                  type="text"
                  placeholder={t('location')}
                  value={form.ubicacion}
                  onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[10px] focus:bg-white focus:ring-1 focus:ring-red-500 transition-all outline-none font-bold"
                />
              </div>
              <div>
                <p className="text-[7px] sm:text-[10px] font-black uppercase text-gray-400 ml-3 mb-1">{t('website')}</p>
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.sitioWeb}
                  onChange={(e) => setForm({ ...form, sitioWeb: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[10px] sm:text-[13px] focus:bg-white focus:ring-1 focus:ring-red-500 transition-all outline-none font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white border border-gray-100 rounded-[2rem] p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-red-600" />
              <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-gray-900">{t('security')}</span>
            </div>
            <button 
              onClick={() => setMostrarPasswords(!mostrarPasswords)}
              className={`p-1.5 rounded-lg transition-all ${mostrarPasswords ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}
            >
              {mostrarPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="space-y-2">
            <input
              type={mostrarPasswords ? "text" : "password"}
              placeholder={t('current_password')}
              value={form.passwordActual}
              onChange={(e) => setForm({ ...form, passwordActual: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[10px] sm:text-[13px] outline-none border border-transparent focus:border-red-100 font-bold"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type={mostrarPasswords ? "text" : "password"}
                placeholder={t('new_password_label')}
                value={form.passwordNueva}
                onChange={(e) => setForm({ ...form, passwordNueva: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[10px] sm:text-[13px] outline-none border border-transparent focus:border-red-100 font-bold"
              />
              <input
                type={mostrarPasswords ? "text" : "password"}
                placeholder={t('confirm_password_label')}
                value={form.confirmarPassword}
                onChange={(e) => setForm({ ...form, confirmarPassword: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 rounded-xl text-[10px] sm:text-[13px] outline-none border border-transparent focus:border-red-100 font-bold"
              />
            </div>
          </div>
          <button
            onClick={handleActualizarPerfil}
            disabled={loading}
            className="mt-4 w-full py-3 bg-red-600 text-white font-black uppercase tracking-[0.2em] text-[10px] sm:text-[13px] rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            <span>{t('save_settings')}</span>
          </button>
        </div>

        {/* Blocked Users - Multi-grid or List */}
        {bloqueados.length > 0 && (
          <div className="bg-white border border-red-50 rounded-2xl p-4 shadow-sm">
             <div className="flex items-center gap-2 mb-3">
              <UserX className="w-4 h-4 text-red-600" />
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-900">{t('blocked_users')} ({bloqueados.length})</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {bloqueados.map((u) => (
                <div key={u._id || u.id} className="flex-shrink-0 flex items-center gap-2 bg-gray-50 p-1.5 pr-3 rounded-full border border-gray-100">
                  <img src={u.fotoPerfil || "/assets/placeholder.png"} className="w-6 h-6 rounded-full object-cover" alt=""/>
                  <span className="text-[8px] sm:text-[11px] font-bold truncate max-w-[60px] sm:max-w-none">{u.nombre?.split(' ')[0]}</span>
                  <button onClick={() => handleDesbloquear(u._id || u.id)} className="text-red-500 hover:text-red-700">
                    <XCircle className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Story Archive */}
        <StoryArchive />

        {/* Danger Zone */}
        <div className="pt-6">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-4 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border-2 border-red-50 hover:border-red-600 rounded-[2rem] transition-all flex flex-col items-center justify-center gap-1 group overflow-hidden relative shadow-lg shadow-red-100/50"
          >
            <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative z-10 flex flex-col items-center">
              <ShieldAlert className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t('delete_account_title')}</span>
              <span className="text-[7px] font-bold opacity-60 uppercase tracking-tighter">{t('delete_account_desc')}</span>
            </div>
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
    } catch { setErrorMsg(t('delete_account_error')); }
    finally { setLoading(false); setShowDeleteModal(false); }
  }
};

export default Configuraciones;

