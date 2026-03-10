import React, { useState } from "react";
import { useNotificaciones } from "../context/NotificationsContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { Bell, BellOff, CheckCheck, Trash2, Clock, ChevronRight } from "lucide-react";

export default function NotificacionesPage() {
  const {
    notificaciones,
    marcarTodasComoLeidasEnBackend,
    eliminarNotificacionCompleta,
    eliminarTodas,
  } = useNotificaciones();

  const [loading, setLoading] = useState(false);
  const { showConfirm } = useModal();
  const { success, error: showError } = useToast();
  const { handleNotificationClick } = useNotificaciones();

  const irA = async (notificacion) => {
    if (loading) return;
    await handleNotificationClick(notificacion);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header section */}
      <div className="p-8 pb-4 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100/50 text-red-600 rounded-2xl">
              <Bell className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Notificaciones</h1>
              <p className="text-sm font-medium text-gray-400 capitalize">Tus actualizaciones recientes</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleMarcarTodasComoLeidas}
            disabled={loading || notificaciones.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            <span className="text-xs">Leer todo</span>
          </button>
          <button
            onClick={handleEliminarTodas}
            disabled={loading || notificaciones.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-xs">Limpiar</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {notificaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 select-none">
            <BellOff className="w-20 h-20 text-gray-400 mb-4" />
            <p className="text-xl font-black text-gray-500 uppercase tracking-widest">Sin notificaciones</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notificaciones.map((n) => (
              <div
                key={n._id}
                onClick={() => irA(n)}
                className={`group relative p-4 rounded-[2rem] border transition-all cursor-pointer ${n.leido
                    ? "bg-white border-gray-100 grayscale-[0.5] opacity-80"
                    : "bg-red-50/50 border-red-100 shadow-lg shadow-red-100/30"
                  } hover:shadow-xl hover:scale-[1.01]`}
              >
                {!n.leido && (
                  <div className="absolute top-4 right-8 w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                )}

                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={n.emisor?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                      alt="avatar"
                      className="w-14 h-14 rounded-2xl object-cover shadow-md"
                    />
                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-lg ${n.leido ? "bg-gray-400" : "bg-red-600"} text-white shadow-sm`}>
                      <Bell className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-black ${n.leido ? "text-gray-600" : "text-gray-900"}`}>
                      {n.emisor?.nombre || "Sistema"}
                    </h4>
                    <p className={`text-sm line-clamp-2 ${n.leido ? "text-gray-500" : "text-gray-800 font-medium"} mt-0.5`}>
                      {n.mensaje}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarUna(n._id);
                      }}
                      className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-red-300 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  async function handleEliminarUna(id) {
    const confirmed = await showConfirm("Eliminar", "¿Eliminar esta notificación?");
    if (!confirmed) return;
    setLoading(true);
    try { 
      await eliminarNotificacionCompleta(id);
      success("Notificación eliminada");
    } catch { 
      showError("Error al eliminar");
    }
    finally { setLoading(false); }
  }

  async function handleEliminarTodas() {
    const confirmed = await showConfirm("Limpiar notificaciones", "¿Eliminar TODAS las notificaciones?");
    if (!confirmed) return;
    setLoading(true);
    try { 
      await eliminarTodas();
      success("Notificaciones eliminadas");
    } catch { 
      showError("Error al eliminar");
    }
    finally { setLoading(false); }
  }

  async function handleMarcarTodasComoLeidas() {
    setLoading(true);
    try { 
      await marcarTodasComoLeidasEnBackend();
      success("Todas marcadas como leídas");
    } catch { 
      showError("Error");
    }
    finally { setLoading(false); }
  }
}

