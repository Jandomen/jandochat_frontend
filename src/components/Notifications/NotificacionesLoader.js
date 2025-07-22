import { useEffect } from "react";
import { obtenerNotificaciones } from "../../api/notificaciones";
import { useNotificaciones } from "../../context/NotificationsContext";

export default function NotificacionesLoader() {
  const { setNotificaciones } = useNotificaciones();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const notis = await obtenerNotificaciones();
        setNotificaciones(notis);
      } catch (error) {
        console.error("Error cargando notificaciones iniciales", error);
      }
    };

    fetchData();
  }, [setNotificaciones]);

  return null; 
}
