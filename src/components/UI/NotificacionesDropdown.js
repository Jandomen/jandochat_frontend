import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificaciones } from "../../context/NotificationsContext";

export default function NotificacionesDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const {
    notificaciones,
    marcarComoLeidaEnBackend,
  } = useNotificaciones();

  const irAConversacion = async (noti) => {
    try {
      if (!noti.leido) {
        await marcarComoLeidaEnBackend(noti._id);
      }

      switch (noti.tipo) {
        case "chat":
          const convId = noti.conversacion?._id || noti.conversacion;
          if (!convId) {
            alert("No se encontró la conversación asociada.");
            break;
          }
          navigate(`/chat/${convId}`);
          break;

        case "seguidor":
          const userId = noti.emisor?._id || noti.emisor;
          if (!userId) {
            alert("No se encontró el usuario.");
            break;
          }
          navigate(`/perfil/${userId}`);
          break;

        case "sistema":
          alert(noti.mensaje || "Notificación del sistema");
          break;

        default:
          alert("Tipo de notificación no manejado.");
      }

      setIsOpen(false);
    } catch (err) {
      console.error("Error al marcar como leída o navegar:", err);
    }
  };

  const noLeidas = notificaciones.filter((n) => !n.leido);

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
        aria-label="Ver notificaciones"
      >
        🔔
        {noLeidas.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {noLeidas.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50 p-3">
          <h4 className="text-sm font-semibold mb-2">Notificaciones</h4>
          {notificaciones.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay notificaciones.</p>
          ) : (
            <ul className="space-y-1 max-h-60 overflow-y-auto">
              {notificaciones.map((noti) => (
                <li
                  key={noti._id}
                  onClick={() => irAConversacion(noti)}
                  className={`cursor-pointer p-2 rounded text-sm ${
                    noti.leido ? "bg-gray-100 hover:bg-gray-200" : "bg-blue-100 hover:bg-blue-200"
                  }`}
                >
                  {noti.mensaje}
                  <span className="text-xs text-gray-500 block">
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
