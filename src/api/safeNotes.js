import api from "./axios";

export const getNotes = () => api.get("/api/caja-fuerte");
export const getNote = (id) => api.get(`/api/caja-fuerte/${id}`);
export const createNote = (data) => api.post("/api/caja-fuerte", data);
export const updateNote = (id, data) => api.put(`/api/caja-fuerte/${id}`, data);
export const deleteNote = (id) => api.delete(`/api/caja-fuerte/${id}`);
export const togglePin = (id) => api.patch(`/api/caja-fuerte/${id}/pin`);
