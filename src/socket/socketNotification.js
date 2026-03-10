import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_API_BACKEND;

const socketNotification = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

socketNotification.on("connect", () => {
  // console.log("✅ Socket conectado con ID:", socketNotification.id);
});

socketNotification.on("connect_error", (err) => {
  console.error("❌ Error de conexión del socket:", err.message);
});

socketNotification.on("disconnect", () => {
  // console.log("🔌 Socket desconectado");
});

socketNotification.on("nueva-notificacion", (notificacion) => {
  //console.log("🔔 Notificación recibida en socketNotification:", notificacion);
});

export default socketNotification;
