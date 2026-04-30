import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import socketNotification from "../socket/socketNotification";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import * as notiAPI from "../api/notificaciones";
import { getPostById } from "../api/posts";
import { NOTIF_SOUNDS } from "../utils/sounds";
import { useLanguage } from "./LanguageContext";

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [sonidoHabilitado, setSonidoHabilitado] = useState(() => {
    return localStorage.getItem("sonidoHabilitado") === "true";
  });

  const { user } = useAuth();
  const { t } = useLanguage();
  const { success: showToast, error: showErrorToast } = useToast();
  const navigate = useNavigate();
  const nuevaNotificacionListener = useRef(null);

  const getNavigationFromNotification = useCallback((notificacion) => {
    const { tipo, conversacion, publicacion, emisor, comentarioId } = notificacion;

    let navigateTo = null;
    let state = {};

    switch (tipo) {
      case "mensaje":
        if (conversacion) {
          const convId = conversacion._id || conversacion;
          navigateTo = `/chat/${convId}`;
          state = { destinatario: emisor };
        }
        break;

      case "comentario":
      case "respuesta":
      case "mencion":
        if (publicacion) {
          const postId = publicacion._id || publicacion;
          navigateTo = "/usuarios";
          state = {
            highlightPost: postId,
            highlightCommentId: comentarioId
          };
        }
        break;

      case "reaccion":
        if (publicacion) {
          const postId = publicacion._id || publicacion;
          navigateTo = "/usuarios";
          state = { highlightPost: postId };
        }
        break;

      default:
        if (emisor?._id) {
          navigateTo = `/usuarios/${emisor._id}`;
        }
    }

    return navigateTo ? { navigateTo, state } : null;
  }, []);

  useEffect(() => {
    localStorage.setItem("sonidoHabilitado", sonidoHabilitado);
  }, [sonidoHabilitado]);

  useEffect(() => {
    if (!user?._id) {
      if (socketNotification.connected) {
        socketNotification.disconnect();
      }
      setNotificaciones([]);
      return;
    }

    const cargarNotificaciones = async () => {
      try {
        const data = await notiAPI.obtenerNotificaciones();
        setNotificaciones(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("❌ Error al cargar notificaciones:", error);
        setNotificaciones([]);
      }
    };

    cargarNotificaciones();

    if (!socketNotification.connected) {
      socketNotification.connect();
    }

    socketNotification.emit("join-user", user._id);

    const onNuevaNotificacion = (notificacion) => {
      setNotificaciones((prev) => [notificacion, ...prev]);

      const sender = notificacion.emisor?.nombre || "";
      let toastMessage;
      switch (notificacion.tipo) {
        case "mensaje": toastMessage = `${sender} ${t('sent_you_message')}`; break;
        case "reaccion": toastMessage = `${sender} ${t('liked_your_post')}`; break;
        case "comentario": toastMessage = `${sender} ${t('commented_on_post')}`; break;
        case "respuesta": toastMessage = `${sender} ${t('responded_comment')}`; break;
        case "mencion": toastMessage = `${sender} ${t('mentioned_you')}`; break;
        case "compartir": toastMessage = `${sender} ${t('shared_post_noti')}`; break;
        case "sistema":
        case "seguidor": toastMessage = `${sender} ${t('followed_you')}`; break;
        default: toastMessage = notificacion.mensaje || t('new_notification');
      }
      
      const navigation = getNavigationFromNotification(notificacion);
      const emisorFoto = notificacion.emisor?.fotoPerfil || null;
      
      showToast(toastMessage, 4000, emisorFoto, navigation);

      if (sonidoHabilitado) {
        const soundType = user?.configuracionStatus?.sonidoTipo || "bleep1";
        const soundInfo = NOTIF_SOUNDS.find(s => s.id === soundType) || NOTIF_SOUNDS[0];
        const audio = new Audio(soundInfo.url);
        audio.play().catch((err) => console.warn("Audio play blocked:", err));
      }
    };

    if (nuevaNotificacionListener.current) {
      socketNotification.off("nueva-notificacion", nuevaNotificacionListener.current);
    }

    socketNotification.on("nueva-notificacion", onNuevaNotificacion);
    nuevaNotificacionListener.current = onNuevaNotificacion;

    const onConnect = () => {
      socketNotification.emit("join-user", user._id);
    };

    socketNotification.on("connect", onConnect);
    socketNotification.on("connect_error", (err) => {
      console.error("❌ Error de conexión del socket:", err.message);
    });

    return () => {
      socketNotification.off("nueva-notificacion", nuevaNotificacionListener.current);
      socketNotification.off("connect", onConnect);
      socketNotification.off("connect_error");
      socketNotification.disconnect();
    };
  }, [user, sonidoHabilitado, showToast, getNavigationFromNotification, t]);


  const agregarNotificacion = (notif) => {
    setNotificaciones((prev) => [notif, ...prev]);
  };

  const marcarComoLeidaEnBackend = async (id) => {
    try {
      await notiAPI.marcarComoLeida(id);
      setNotificaciones((prev) =>
        prev.map((n) => (n._id === id ? { ...n, leido: true } : n))
      );
    } catch (err) {
      console.error("❌ Error al marcar como leída:", err);
    }
  };

  const marcarTodasComoLeidasEnBackend = async () => {
    try {
      await notiAPI.marcarTodasLeidas();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));
    } catch (err) {
      console.error("❌ Error al marcar todas como leídas:", err);
    }
  };

  const eliminarNotificacionCompleta = async (id) => {
    try {
      await notiAPI.eliminarNotificacion(id);
      setNotificaciones((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("❌ Error al eliminar notificación:", err);
    }
  };

  const eliminarTodas = async () => {
    try {
      await notiAPI.eliminarTodas();
      setNotificaciones([]);
    } catch (err) {
      console.error("❌ Error al eliminar todas:", err);
    }
  };

  const fetchNotificaciones = async () => {
    try {
      const data = await notiAPI.obtenerNotificaciones();
      setNotificaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error al recargar notificaciones:", err);
    }
  };

  const habilitarSonido = () => {
    const audio = new Audio(NOTIF_SOUNDS[0].url);
    audio.play()
      .then(() => {
        setSonidoHabilitado(true);
      })
      .catch((err) => {
        console.warn("❌ No se pudo habilitar el sonido:", err);
      });
  };

  const deshabilitarSonido = () => {
    setSonidoHabilitado(false);
    localStorage.setItem("sonidoHabilitado", "false");
  };

  const handleNotificationClick = useCallback(async (notificacion) => {
    // Mark as read
    try {
      await notiAPI.marcarComoLeida(notificacion._id);
      setNotificaciones((prev) =>
        prev.map((n) => (n._id === notificacion._id ? { ...n, leido: true } : n))
      );
    } catch (err) {
      console.error("Error al marcar como leída:", err);
    }

    const { tipo, conversacion, publicacion, emisor, comentarioId } = notificacion;

    let navigateTo = null;
    let state = {};

    switch (tipo) {
      case "mensaje":
        if (conversacion) {
          const convId = conversacion._id || conversacion;
          navigateTo = `/chat/${convId}`;
          state = { destinatario: emisor };
        }
        break;

      case "comentario":
      case "respuesta":
      case "reaccion":
      case "mencion":
        if (publicacion) {
          const postId = publicacion._id || publicacion;
          // Verify the post still exists before navigating
          try {
            await getPostById(postId);
            navigateTo = "/usuarios";
            state = {
              highlightPost: postId,
              highlightCommentId: comentarioId
            };
          } catch (err) {
            // Post was deleted
            showErrorToast("Esta publicación ya no existe o fue eliminada");
            return;
          }
        }
        break;

      default:
        if (emisor?._id) {
          navigateTo = `/usuarios/${emisor._id}`;
        }
    }

    if (navigateTo) {
      navigate(navigateTo, { state });
    }
  }, [navigate, showErrorToast]);

  const noLeidasCount = notificaciones.filter((n) => !n.leido).length;

  return (
    <NotificationsContext.Provider
      value={{
        notificaciones,
        agregarNotificacion,
        marcarComoLeidaEnBackend,
        marcarTodasComoLeidasEnBackend,
        eliminarNotificacionCompleta,
        eliminarTodas,
        fetchNotificaciones,
        habilitarSonido,
        deshabilitarSonido,
        sonidoHabilitado,
        noLeidasCount,
        handleNotificationClick,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotificaciones = () => useContext(NotificationsContext);
