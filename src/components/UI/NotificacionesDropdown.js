import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificaciones } from "../../context/NotificationsContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

export default function NotificacionesDropdown() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { info, error: showError } = useToast();

  const {
    notificaciones,
    marcarComoLeidaEnBackend,
  } = useNotificaciones();

  const irAConversacion = async (noti) => {
    try {
      if (!noti.leido) {
        await marcarComoLeidaEnBackend(noti._id);
      }

      if (noti.publicacion) {
        const postId = noti.publicacion._id || noti.publicacion;
        navigate("/usuarios", { state: { highlightPost: postId } });
        setIsOpen(false);
        return;
      }

      switch (noti.tipo) {
        case "chat":
          const convId = noti.conversacion?._id || noti.conversacion;
          if (!convId) {
            info(t('no_conversation_found') || "No se encontró la conversación asociada.");
            break;
          }
          navigate(`/chat/${convId}`);
          break;

        case "seguidor":
          const userId = noti.emisor?._id || noti.emisor;
          if (!userId) {
            info(t('user_not_found') || "No se encontró el usuario.");
            break;
          }
          navigate(`/perfil/${userId}`);
          break;

        case "sistema":
          info(noti.mensaje || t('notification_system') || "Notificación del sistema");
          break;

        default:
          info(t('notification_type_not_handled') || "Tipo de notificación no manejado.");
      }

      setIsOpen(false);
    } catch (err) {
      console.error("Error al marcar como leída o navegar:", err);
    }
  };

  const noLeidas = notificaciones.filter((n) => !n.leido);

  const translateNotiMessage = (noti) => {
    const sender = noti.emisor?.nombre || "";
    switch (noti.tipo) {
      case "mensaje": return `${sender} ${t('sent_you_message')}`;
      case "reaccion": return `${sender} ${t('liked_your_post')}`;
      case "comentario": return `${sender} ${t('commented_on_post')}`;
      case "respuesta": return `${sender} ${t('responded_comment')}`;
      case "mencion": return `${sender} ${t('mentioned_you')}`;
      case "compartir": return `${sender} ${t('shared_post_noti')}`;
      case "sistema":
      case "seguidor": return `${sender} ${t('followed_you')}`;
      default: return noti.mensaje || t('new_notification');
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative focus:outline-none"
        aria-label={t('notifications_title')}
      >
        🔔
        {noLeidas.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
            {noLeidas.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl z-50 p-4 border border-red-50 animate-in fade-in zoom-in duration-200">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-4 pb-2 border-b border-red-50">{t('notifications_title')}</h4>
          {notificaciones.length === 0 ? (
            <p className="text-gray-400 text-[10px] font-bold uppercase text-center py-8">{t('no_notifications')}</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-hide">
              {notificaciones.map((noti) => (
                <li
                  key={noti._id}
                  onClick={() => irAConversacion(noti)}
                  className={`cursor-pointer p-3 rounded-xl transition-all border ${
                    noti.leido ? "bg-white border-transparent text-gray-500 grayscale opacity-70" : "bg-red-50/50 border-red-100 text-gray-900 shadow-sm"
                  } hover:scale-[1.02] hover:bg-white hover:border-red-50`}
                >
                  <p className="text-[10px] sm:text-xs font-bold leading-tight line-clamp-2">{translateNotiMessage(noti)}</p>
                  <span className="text-[7px] sm:text-[9px] font-black text-red-500 uppercase tracking-widest mt-1 block">
                    {new Date(noti.createdAt).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
