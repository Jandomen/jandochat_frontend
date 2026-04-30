import api from "./axios";

export const obtenerConversaciones = async () => {
  const res = await api.get("/api/conversaciones");
  return res.data;
};

export const obtenerMensajes = async (conversacionId) => {
  const res = await api.get(`/api/mensajes/conversacion/${conversacionId}`);
  return res.data;
};

export const enviarMensajeAPI = async (data) => {
  const res = await api.post("/api/mensajes/create", data);
  return res.data;
};


export const editarMensajeAPI = async (mensajeId, data) => {
  const res = await api.put(`/api/mensajes/${mensajeId}`, data);
  return res.data;
};

export const eliminarMensajeAPI = async (mensajeId) => {
  const res = await api.delete(`/api/mensajes/${mensajeId}`);
  return res.data;
};


export const crearConversacion = async (data) => {
  const res = await api.post("/api/conversaciones", data);
  return res.data;
};

export const agregarParticipante = async (id, participanteId) => {
  const res = await api.put(
    `/api/conversaciones/${id}/participantes`,
    { participanteId }
  );
  return res.data;
};

export const eliminarConversacion = async (id) => {
  const res = await api.delete(`/api/conversaciones/${id}`);
  return res.data;
};
