import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotificaciones } from "../../context/NotificationsContext";
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

const Configuraciones = () => {
  const { user, setUser } = useAuth();
  const { sonidoHabilitado, habilitarSonido, deshabilitarSonido } = useNotificaciones();

  const [form, setForm] = useState({
    nombre: user?.nombre || "",
    passwordActual: "",
    passwordNueva: "",
    confirmarPassword: "",
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
        console.error(error);
      }
    };
    cargarBloqueados();
  }, []);

  const handleDesbloquear = async (userId) => {
    if (!window.confirm("¿Seguro que quieres desbloquear este usuario?")) return;
    try {
      await desbloquearUsuario(userId);
      setBloqueados((prev) => prev.filter((u) => (u._id || u.id) !== userId));
      alert("Usuario desbloqueado con éxito.");
    } catch (error) {
      setErrorMsg("Error al desbloquear el usuario.");
      console.error(error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && !selectedFile.type.startsWith("image/")) {
      setErrorMsg("Solo se permiten archivos de imagen (jpg, png, etc.).");
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg("Por favor, selecciona una imagen primero.");
      return;
    }
    const formData = new FormData();
    formData.append("fotoPerfil", file);
    setLoading(true);
    try {
      const res = await uploadProfilePhoto(formData);
      setUser({ ...user, fotoPerfil: res.fotoPerfil });
      setErrorMsg("");
      alert("Foto subida con éxito.");
    } catch (error) {
      setErrorMsg("Error al subir la foto.");
      console.error(error);
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Seguro que quieres eliminar tu foto de perfil?")) return;
    setLoading(true);
    try {
      await deleteProfilePhoto();
      setUser({ ...user, fotoPerfil: "" });
      setErrorMsg("");
      alert("Foto eliminada con éxito.");
    } catch (error) {
      setErrorMsg("Error al eliminar la foto.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleActualizarPerfil = async () => {
    const sanitizedNombre = DOMPurify.sanitize(form.nombre.trim());

    if (
      !sanitizedNombre &&
      !form.passwordActual &&
      !form.passwordNueva &&
      !form.confirmarPassword
    ) {
      setErrorMsg("Por favor, completa al menos un campo para actualizar.");
      return;
    }

    if (form.passwordNueva || form.confirmarPassword) {
      if (!form.passwordActual) {
        setErrorMsg("Debes proporcionar la contraseña actual.");
        return;
      }
      if (form.passwordNueva.length < 8) {
        setErrorMsg("La nueva contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
          form.passwordNueva
        )
      ) {
        setErrorMsg(
          "La contraseña debe incluir mayúsculas, minúsculas, números y caracteres especiales."
        );
        return;
      }
      if (form.passwordNueva !== form.confirmarPassword) {
        setErrorMsg("Las contraseñas no coinciden.");
        return;
      }
    }

    setLoading(true);
    try {
      const datosActualizados = {};
      if (sanitizedNombre) datosActualizados.nombre = sanitizedNombre;
      if (form.passwordActual) datosActualizados.passwordActual = form.passwordActual;
      if (form.passwordNueva) datosActualizados.passwordNueva = form.passwordNueva;

      const res = await actualizarPerfil(datosActualizados);

      if (res.nombre) {
        setUser({ ...user, nombre: res.nombre });
        setForm({ ...form, nombre: res.nombre });
      }

      setErrorMsg("");
      alert("Perfil actualizado con éxito.");

      setForm((prev) => ({
        ...prev,
        passwordActual: "",
        passwordNueva: "",
        confirmarPassword: "",
      }));
    } catch (error) {
      setErrorMsg(error?.response?.data?.mensaje || "Error al actualizar el perfil.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteAccountConfirmed = async (password) => {
    setLoading(true);
    try {
      await deleteUser(password);
      setUser(null);
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (error) {
      setErrorMsg("Error al eliminar la cuenta.");
      console.error(error);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-6 p-4 bg-white shadow-lg rounded-lg space-y-6">
      <h1 className="text-2xl font-bold text-center">Configuraciones</h1>

      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm text-center">
          {DOMPurify.sanitize(errorMsg)}
        </div>
      )}

  
      <div className="flex flex-col items-center space-y-3">
        <img
          src={user?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
          alt="Foto de perfil"
          className="object-cover w-36 h-36 border border-gray-300 rounded-full"
        />
        <input type="file" onChange={handleFileChange} accept="image/*" disabled={loading} />
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Subiendo..." : "Subir Foto"}
          </button>
          {user?.fotoPerfil && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Eliminando..." : "Eliminar Foto"}
            </button>
          )}
        </div>
      </div>

     
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-sm text-center">
        {sonidoHabilitado ? (
          <>
            🔊 El sonido está activado.{" "}
            <button
              onClick={deshabilitarSonido}
              className="text-blue-700 underline hover:text-blue-900 ml-1"
            >
              Desactivar
            </button>
          </>
        ) : (
          <>
            🔕 El sonido está desactivado.{" "}
            <button
              onClick={habilitarSonido}
              className="text-blue-700 underline hover:text-blue-900 ml-1"
            >
              Activar
            </button>
          </>
        )}
      </div>

   
      <div>
        <h2 className="text-lg font-semibold mb-3">Usuarios bloqueados</h2>
        {bloqueados.length === 0 ? (
          <p className="text-sm text-gray-500">No has bloqueado a ningún usuario.</p>
        ) : (
          <ul className="space-y-2">
            {bloqueados.map((usuario) => (
              <li
                key={usuario._id || usuario.id}
                className="flex justify-between items-center p-2 border rounded hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      usuario.fotoPerfil ||
                      "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"
                    }
                    alt={`${DOMPurify.sanitize(usuario.nombre)} foto`}
                    className="w-10 h-10 object-cover border border-gray-300 rounded-sm"
                  />
                  <div>
                    <p className="font-medium">{DOMPurify.sanitize(usuario.nombre)}</p>
                    <p className="text-sm text-gray-600">
                      {DOMPurify.sanitize(usuario.username || "Sin username")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDesbloquear(usuario._id || usuario.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Desbloquear
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Actualizar perfil</h2>

        <input
          type="text"
          placeholder="Nuevo nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />

        <div>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={mostrarPasswords}
              onChange={() => setMostrarPasswords(!mostrarPasswords)}
            />
            Mostrar contraseñas
          </label>
        </div>

        <input
          type={mostrarPasswords ? "text" : "password"}
          placeholder="Contraseña actual"
          value={form.passwordActual}
          onChange={(e) => setForm({ ...form, passwordActual: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
        <input
          type={mostrarPasswords ? "text" : "password"}
          placeholder="Nueva contraseña"
          value={form.passwordNueva}
          onChange={(e) => setForm({ ...form, passwordNueva: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />
        <input
          type={mostrarPasswords ? "text" : "password"}
          placeholder="Confirmar nueva contraseña"
          value={form.confirmarPassword}
          onChange={(e) => setForm({ ...form, confirmarPassword: e.target.value })}
          className="w-full border rounded px-3 py-2"
        />

        <button
          onClick={handleActualizarPerfil}
          disabled={loading}
          className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Actualizando..." : "Actualizar perfil"}
        </button>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={handleDeleteAccount}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Eliminar cuenta
        </button>
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
};

export default Configuraciones;
