import API from "./axios";


export const buscarConversacionPrivada = async (userId) => {
  if (!userId) throw new Error("El ID del usuario es obligatorio");

  try {
    const res = await API.get("/api/conversaciones");
    const conversaciones = res.data;

    const conversacionExistente = conversaciones.find((c) => {
      return (
        !c.esGrupo &&
        c.participantes.length === 2 &&
        c.participantes.some((p) => p._id === userId)
      );
    });

    return conversacionExistente || null;
  } catch (error) {
    console.error("❌ Error al buscar conversación privada:", error);
    return null;
  }
};


export const crearConversacion = async (destinatarioId) => {
  if (!destinatarioId) throw new Error("El ID del destinatario es obligatorio");

  try {
    const res = await API.post("/api/conversaciones", {
      participantes: [destinatarioId],
      esGrupo: false,
    });

    return res.data;
  } catch (error) {
    console.error("❌ Error al crear conversación:", error.response?.data || error);
    throw error;
  }
};
