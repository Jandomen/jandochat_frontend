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

export const comentarPost = async (id, data) => {
    const res = await api.post(`/api/posts/${id}/comentar`, data);
    return res.data;
};

export const responderComentario = async (id, comentarioId, data) => {
    const res = await api.post(`/api/posts/${id}/comentario/${comentarioId}/responder`, data);
    return res.data;
};
export const getPostsByUser = async (id) => {
    const res = await api.get(`/api/posts/usuario/${id}`);
    return res.data;
};

export const getMentionsByUser = async (id) => {
    const res = await api.get(`/api/posts/mentions/${id}`);
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

export const bookmarkPost = async (id) => {
    const res = await api.post(`/api/posts/${id}/guardar`);
    return res.data;
};

export const getBookmarkedPosts = async () => {
    const res = await api.get("/api/posts/baul");
    return res.data;
};

export const getVideos = async (categoria = "", q = "") => {
    const res = await api.get(`/api/posts/videos?categoria=${categoria}&q=${q}`);
    return res.data;
};

export const getGallery = async (categoria = "", q = "") => {
    const res = await api.get(`/api/posts/gallery?categoria=${categoria}&q=${q}`);
    return res.data;
};

export const updatePostSettings = async (id, data) => {
    const res = await api.put(`/api/posts/${id}/settings`, data);
    return res.data;
};

export const incrementVistas = async (id) => {
    try {
        await api.post(`/api/posts/${id}/view`);
    } catch (e) {
        // Silently fail if view count can't increment
    }
};

export const reportPost = async (id, motivo, detalles) => {
    const res = await api.post(`/api/posts/${id}/report`, { motivo, detalles });
    return res.data;
};

export const trackAdClick = async (id) => {
    try {
        await api.post(`/api/posts/ads/${id}/click`);
    } catch (e) {}
};
