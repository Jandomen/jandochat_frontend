import API from "./axios";


export const buscarConversacionPrivada = async (userId) => {
  if (!userId) throw new Error("El ID del usuario es obligatorio");

  try {
    const res = await API.get("/api/conversaciones");
    const conversaciones = res.data;

    const conversacionExistente = conversaciones.find((c) => {
      const idsParticipantes = c.participantes.map(p => (typeof p === 'string' ? p : p._id)?.toString());
      return (
        !c.esGrupo &&
        idsParticipantes.length === 2 &&
        idsParticipantes.includes(userId.toString())
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
