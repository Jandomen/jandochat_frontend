import api from "./axios";

export const obtenerConversaciones = async (token) => {
  const res = await api.get("/api/conversaciones", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const obtenerMensajes = async (conversacionId, token) => {
  const res = await api.get(`/api/mensajes/conversacion/${conversacionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const enviarMensajeAPI = async (data) => {
  const token = localStorage.getItem("token");
  const res = await api.post("/api/mensajes/create", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};


export const editarMensajeAPI = async (mensajeId, data) => {
  const token = localStorage.getItem("token");
  const res = await api.put(`/api/mensajes/${mensajeId}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const eliminarMensajeAPI = async (mensajeId) => {
  const token = localStorage.getItem("token");
  const res = await api.delete(`/api/mensajes/${mensajeId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};


export const crearConversacion = async (data, token) => {
  const res = await api.post("/api/conversaciones", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const agregarParticipante = async (id, participanteId, token) => {
  const res = await api.put(
    `/api/conversaciones/${id}/participantes`,
    { participanteId },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

export const eliminarConversacion = async (id, token) => {
  const res = await api.delete(`/api/conversaciones/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
