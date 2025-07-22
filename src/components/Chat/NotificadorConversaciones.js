import { useEffect, useState, useRef } from "react";
import { obtenerConversaciones } from "../../api/chat";
import useAuth from "../../hooks/useAuth";

export default function NotificadorConversaciones({ onNuevaConversacion }) {
  const { user } = useAuth();
  const [prevIds, setPrevIds] = useState([]);
  const audioRef = useRef(null);

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const revisarConversaciones = async () => {
      try {
        const token = localStorage.getItem("token");
        const data = await obtenerConversaciones(token);
        const idsActuales = data.map((conv) => conv._id);

        const nuevas = idsActuales.filter((id) => !prevIds.includes(id));
        if (nuevas.length > 0) {
          const nueva = data.find((conv) => nuevas.includes(conv._id));

          if (Notification.permission === "granted") {
            new Notification("📩 Nueva conversación", {
              body: `Has sido agregado por ${obtenerNombreOtro(nueva, user._id)}`,
              icon: "/logo192.png",
            });
          }

          if (audioRef.current) {
            audioRef.current.play();
          }

          if (onNuevaConversacion) {
            onNuevaConversacion(nueva);
          }

          setPrevIds(idsActuales);
        } else {
          setPrevIds(idsActuales);
        }
      } catch (error) {
        console.error("Error verificando conversaciones nuevas:", error);
      }
    };

    revisarConversaciones();

    const intervalo = setInterval(revisarConversaciones, 60 * 60 * 1000); 
    return () => clearInterval(intervalo);
  }, [prevIds, user]);

  const obtenerNombreOtro = (conv, myId) => {
    const otro = conv.participantes.find((p) => p._id !== myId);
    return otro?.nombre || "alguien";
  };

  return (
    <audio ref={audioRef} src="/alerta.mp3" preload="auto" />
  );
}
