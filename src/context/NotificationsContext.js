import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import socketNotification from "../socket/socketNotification";
import { useAuth } from "./AuthContext";
import * as notiAPI from "../api/notificaciones";

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [sonidoHabilitado, setSonidoHabilitado] = useState(() => {
    return localStorage.getItem("sonidoHabilitado") === "true";
  });

  const { user } = useAuth();
  const nuevaNotificacionListener = useRef(null);

  useEffect(() => {
    localStorage.setItem("sonidoHabilitado", sonidoHabilitado);
  }, [sonidoHabilitado]);

  useEffect(() => {
    if (!user?._id) {
      if (socketNotification.connected) {
        console.log("🔌 Desconectando socket porque no hay usuario");
        socketNotification.disconnect();
      }
      setNotificaciones([]);
      return;
    }

    const cargarNotificaciones = async () => {
      try {
        const data = await notiAPI.obtenerNotificaciones();
        setNotificaciones(Array.isArray(data) ? data : []);
       // console.log("📬 Notificaciones iniciales cargadas:", data);
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
    //console.log("🟢 Usuario unido a la sala:", user._id);

    const onNuevaNotificacion = (notificacion) => {
     // console.log("🔔 Nueva notificación recibida:", notificacion);

      setNotificaciones((prev) => [notificacion, ...prev]);

     // console.log("🎚️ Estado de sonidoHabilitado:", sonidoHabilitado);
      if (sonidoHabilitado) {
        try {
       //   console.log("✅ Intentando reproducir sonido...");

          const audio = new Audio("/sounds/bbc_electronic_07043302.mp3");

          audio.play()
            .then(() => {
             // console.log("🔊 Sonido reproducido correctamente");
            })
            .catch((err) => {
              console.warn("🔇 No se pudo reproducir el sonido:", err);
            });
        } catch (err) {
          console.error("🔇 Error al reproducir sonido:", err);
        }
      }
    };

    if (nuevaNotificacionListener.current) {
      socketNotification.off("nueva-notificacion", nuevaNotificacionListener.current);
    }

    socketNotification.on("nueva-notificacion", onNuevaNotificacion);
    nuevaNotificacionListener.current = onNuevaNotificacion;

    const onConnect = () => {
     // console.log("🔁 Reconectado, re-uniendo a sala");
      socketNotification.emit("join-user", user._id);
    };

    socketNotification.on("connect", onConnect);
    socketNotification.on("connect_error", (err) => {
      console.error("❌ Error de conexión del socket:", err.message);
    });

    return () => {
     // console.log("🧹 Limpiando listeners de socket");
      socketNotification.off("nueva-notificacion", nuevaNotificacionListener.current);
      socketNotification.off("connect", onConnect);
      socketNotification.off("connect_error");
      socketNotification.disconnect();
    };
  }, [user, sonidoHabilitado]);

  
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
    const audio = new Audio("/sounds/bbc_electronic_07043302.mp3");
    audio.play()
      .then(() => {
        setSonidoHabilitado(true);
       // console.log("🔊 Sonido habilitado por el usuario");
      })
      .catch((err) => {
        console.warn("❌ No se pudo habilitar el sonido:", err);
      });
  };

  const deshabilitarSonido = () => {
  setSonidoHabilitado(false);
  localStorage.setItem("sonidoHabilitado", "false");
   //console.log("🔇 Sonido deshabilitado por el usuario");
  };


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
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotificaciones = () => useContext(NotificationsContext);
