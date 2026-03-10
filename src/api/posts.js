import api from "./axios";

export const uploadMedia = async (files, trimOptions = {}) => {
    const formData = new FormData();
    files.forEach(file => {
        formData.append("media", file);
    });
    if (trimOptions.startTime !== undefined) {
        formData.append("startTime", trimOptions.startTime.toString());
    }
    if (trimOptions.endTime !== undefined) {
        formData.append("endTime", trimOptions.endTime.toString());
    }
    const res = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
};

export const getFeed = async () => {
    const res = await api.get("/api/posts/feed");
    return res.data;
};

export const createPost = async (data) => {
    const res = await api.post("/api/posts", data);
    return res.data;
};

export const reaccionarPost = async (id, tipo) => {
    const res = await api.post(`/api/posts/${id}/reaccionar`, { tipo });
    return res.data;
};

export const comentarPost = async (id, texto) => {
    const res = await api.post(`/api/posts/${id}/comentar`, { texto });
    return res.data;
};

export const responderComentario = async (id, comentarioId, texto) => {
    const res = await api.post(`/api/posts/${id}/comentario/${comentarioId}/responder`, { texto });
    return res.data;
};
export const getPostsByUser = async (id) => {
    const res = await api.get(`/api/posts/usuario/${id}`);
    return res.data;
};

export const getPostById = async (id) => {
    const res = await api.get(`/api/posts/${id}`);
    return res.data;
};

export const editPost = async (id, data) => {
    const res = await api.put(`/api/posts/${id}`, data);
    return res.data;
};

export const deletePost = async (id) => {
    const res = await api.delete(`/api/posts/${id}`);
    return res.data;
};

export const sharePost = async (id, data) => {
    const res = await api.post(`/api/posts/${id}/compartir`, data);
    return res.data;
};

export const editComentario = async (postId, comentarioId, texto) => {
    const res = await api.put(`/api/posts/${postId}/comentario/${comentarioId}`, { texto });
    return res.data;
};

export const deleteComentario = async (postId, comentarioId) => {
    const res = await api.delete(`/api/posts/${postId}/comentario/${comentarioId}`);
    return res.data;
};
