import api from "./axios";

export async function userSearch(query) {
  const res = await api.get(`/api/users/buscar?search=${encodeURIComponent(query)}`);
  return res.data;
}

export async function getUserById(id) {
  const res = await api.get(`/api/users/usuarios/${id}`);
  return res.data;
}

export async function getUsuariosAleatorios() {
  const res = await api.get("/api/users/aleatorios");
  return res.data;
}

export async function actualizarPerfil(datos) {
  const res = await api.put("/api/users/profile", datos);
  return res.data;
}

export async function uploadProfilePhoto(formData) {
  const res = await api.put("/api/users/me/photo", formData);
  return res.data;
}

export async function uploadCoverPhoto(formData) {
  const res = await api.put("/api/users/me/cover", formData);
  return res.data;
}

export async function deleteProfilePhoto() {
  const res = await api.delete("/api/users/me/photo");
  return res.data;
}

export async function deleteCoverPhoto() {
  const res = await api.delete("/api/users/me/cover");
  return res.data;
}

export async function getUsuariosBloqueados() {
  const res = await api.get("/api/users/bloqueados");
  return res.data;
}

export async function desbloquearUsuario(idUsuario) {
  const res = await api.post(`/api/users/${idUsuario}/desbloquear`);
  return res.data;
}

export async function seguirUsuario(id) {
  const res = await api.put(`/api/users/${id}/seguir`);
  return res.data;
}

export async function dejarDeSeguirUsuario(idUsuario) {
  const res = await api.put(`/api/users/${idUsuario}/dejar-de-seguir`);
  return res.data;
}

export async function bloquearUsuario(userId) {
  const res = await api.post(`/api/users/${userId}/bloquear`);
  return res.data;
}

export async function getSeguidores() {
  const res = await api.get("/api/users/seguidores");
  return res.data;
}

export async function getSiguiendo() {
  const res = await api.get("/api/users/siguiendo");
  return res.data;
}

export async function deleteUser(password) {
  const res = await api.delete("/api/users/me", { data: { password } });
  return res.data;
}
