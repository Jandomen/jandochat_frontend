import axios from "axios";
import api from "./axios";
const API_URL = process.env.REACT_APP_API_BACKEND;


export async function buscarUsuarios(query) {
  const res = await fetch(`${API_URL}/api/users?search=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Error buscando usuarios");
  return res.json(); 
}


export async function userSearch(query) {
  const res = await api.get(`/api/users/buscar?search=${encodeURIComponent(query)}`);
  return res.data;
}


export async function crearConversacion(userId) {
  const res = await fetch(`${API_URL}/api/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Error creando conversación");
  return res.json(); 
}


export async function getUserProfile(userId) {
  const response = await axios.get(`/users/${userId}`);
  return response.data;
}

export async function getUsers() {
  const token = localStorage.getItem("token"); 
  const res = await fetch(`${API_URL}/api/users/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Error obteniendo usuarios");
  return res.json();
}


export const getUserById = async (id) => {
  const res = await api.get(`/api/users/usuarios/${id}`);
  return res.data;
};



export async function updateUserProfile(data) {
  const res = await fetch(`${API_URL}/api/users/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error actualizando perfil");
  return res.json();
}

export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/api/users/me`);
  if (!res.ok) throw new Error("Error obteniendo usuario actual");
  return res.json();
}

export async function deleteUser(password) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/users/me`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) throw new Error("Error eliminando usuario");
  return res.json();
}


export const getUsuariosAleatorios = async () => {
  const res = await api.get("/api/users/aleatorios");
  return res.data;
};

export const actualizarPerfil = async (datos) => {
  const res = await api.put("/api/users/profile", datos, { withCredentials: true });
  return res.data;
};







export async function uploadProfilePhoto(formData) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/users/me/photo`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  if (!res.ok) throw new Error("Error subiendo foto de perfil");
  return res.json();
}


export async function deleteProfilePhoto() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/users/me/photo`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Error eliminando foto de perfil");
  return res.json();
}









export async function bloquearUsuario(userId) {
  const token = localStorage.getItem("token");
  const res = await api.post(
    `${API_URL}/api/users/${userId}/bloquear`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
}


export const getUsuariosBloqueados = async () => {
  const res = await api.get("/api/users/bloqueados");
  return res.data;
};


export const desbloquearUsuario = async (idUsuario) => {
  const res = await api.post(`/api/users/${idUsuario}/desbloquear`);
  return res.data;
};








export const seguirUsuario = async (id) => {
  const res = await api.put(`/api/users/${id}/seguir`);
  return res.data;
};


export const getSeguidores = async () => {
  const res = await api.get("/api/users/seguidores");
  return res.data;
};

export const getSiguiendo = async () => {
  const res = await api.get("/api/users/siguiendo");
  return res.data;
};

export const dejarDeSeguirUsuario = async (idUsuario) => {
  const res = await api.put(`/api/users/${idUsuario}/dejar-de-seguir`);
  return res.data;
};




