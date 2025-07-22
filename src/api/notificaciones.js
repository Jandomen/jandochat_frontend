import axios from "./axios";

export const obtenerNotificaciones = async () => {
  try {
    const response = await axios.get("/api/notificaciones");
    
    return response.data;
  } catch (err) {
    console.error("❌ Error al obtener notificaciones:", err);
    throw err;
  }
};

export const crearNotificacion = async (notificacion) => {
  try {
    const res = await axios.post("/api/notificaciones", notificacion);
    return res.data;
  } catch (error) {
    //console.error("❌ Error al crear notificación:", error);
    throw error;
  }
};

export const marcarComoLeida = async (id) => {
  try {
    const response = await axios.put(`/api/notificaciones/${id}/leido`);
   // console.log("📝 Notificación marcada como leída:", response.data);
    return response;
  } catch (err) {
    console.error("❌ Error al marcar notificación como leída:", err);
    throw err;
  }
};

export const marcarTodasLeidas = async () => {
  try {
    const res = await axios.put("/api/notificaciones/leidas");
  //  console.log("📝 Todas las notificaciones marcadas como leídas:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Error al marcar todas las notificaciones como leídas:", error);
    throw error;
  }
};

export const eliminarNotificacion = async (id) => {
  try {
    const res = await axios.delete(`/api/notificaciones/${id}`);
   // console.log(`🗑️ Notificación ${id} eliminada:`, res.data);
    return res.data;
  } catch (error) {
    console.error(`❌ Error al eliminar notificación ${id}:`, error);
    throw error;
  }
};

export const eliminarTodas = async () => {
  try {
    const res = await axios.delete("/api/notificaciones");
   // console.log("🗑️ Todas las notificaciones eliminadas:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Error al eliminar todas las notificaciones:", error);
    throw error;
  }
};






