import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificaciones } from "../context/NotificationsContext";

export default function NotificacionesPage() {
  const {
    notificaciones,
    marcarComoLeidaEnBackend,
    marcarTodasComoLeidasEnBackend,
    eliminarNotificacionCompleta,
    eliminarTodas,
  } = useNotificaciones();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const irAlChat = async (notificacion) => {
    if (loading) return;
    setLoading(true);
    try {
      await marcarComoLeidaEnBackend(notificacion._id);

      if (notificacion.conversacion) {
        const convId = notificacion.conversacion._id || notificacion.conversacion;
        navigate(`/chat/${convId}`, {
          state: { destinatario: notificacion.destinatario },
        });
      } else if (notificacion.emisor?._id) {
        navigate(`/usuarios/${notificacion.emisor._id}`);
      } else {
        alert("No se puede navegar a esta notificación.");
      }
    } catch (err) {
      console.error("❌ Error al navegar desde notificación:", err);
      alert("Ocurrió un error al abrir la notificación.");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarUna = async (id) => {
    if (loading) return;
    const confirmar = window.confirm("¿Seguro que deseas eliminar esta notificación?");
    if (confirmar) {
      setLoading(true);
      try {
        await eliminarNotificacionCompleta(id);
      } catch (err) {
        alert("No se pudo eliminar la notificación.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEliminarTodas = async () => {
    if (loading) return;
    const confirmar = window.confirm("❗ Esto eliminará TODAS las notificaciones. ¿Continuar?");
    if (confirmar) {
      setLoading(true);
      try {
        await eliminarTodas();
      } catch (error) {
        alert("No se pudieron eliminar todas las notificaciones.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMarcarTodasComoLeidas = async () => {
    if (loading) return;
    const confirmar = window.confirm("¿Marcar todas las notificaciones como leídas?");
    if (confirmar) {
      setLoading(true);
      try {
        await marcarTodasComoLeidasEnBackend();
      } catch {
        alert("No se pudieron marcar todas como leídas.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Notificaciones</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={handleMarcarTodasComoLeidas}
          disabled={loading}
          className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded ${
            loading ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          Marcar todas como leídas
        </button>
        <button
          onClick={handleEliminarTodas}
          disabled={loading}
          className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded ${
            loading ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          Eliminar todas
        </button>
      </div>

      {notificaciones.length === 0 ? (
        <p className="text-gray-500">No tienes notificaciones.</p>
      ) : (
        <ul className="space-y-3">
          {notificaciones.map((n) => (
            <li
              key={n._id}
              onClick={() => irAlChat(n)}
              className={`cursor-pointer p-4 rounded border relative transition ${
                n.leido
                  ? "bg-gray-100 hover:bg-gray-200"
                  : "bg-yellow-100 hover:bg-yellow-200 text-gray-800 font-semibold"
              } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    n.emisor?.fotoPerfil ||
                    "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"
                  }
                  alt="Foto de perfil del emisor"
                  className="w-10 h-10 rounded-full object-cover border"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">
                    {n.emisor?.nombre || "Usuario"}
                  </div>
                  <div className="text-gray-600 text-sm">{n.mensaje}</div>
                  {n.destinatario?.nombre && (
                    <div className="text-xs text-gray-500 italic">
                      Destinatario: {n.destinatario.nombre}
                    </div>
                  )}
                  {n.createdAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEliminarUna(n._id);
                }}
                disabled={loading}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                title="Eliminar notificación"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
