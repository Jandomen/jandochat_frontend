import api from "./axios";

export const crearStory = async (data) => {
    const res = await api.post("/api/stories", data);
    return res.data;
};

export const getStoriesFeed = async () => {
    const res = await api.get("/api/stories/feed");
    return res.data;
};

export const getMisStories = async () => {
    const res = await api.get("/api/stories/mine");
    return res.data;
};

export const getArchivedStories = async () => {
    const res = await api.get("/api/stories/archive");
    return res.data;
};

export const getStoryById = async (id) => {
    const res = await api.get(`/api/stories/${id}`);
    return res.data;
};

export const viewStory = async (id) => {
    const res = await api.post(`/api/stories/${id}/view`);
    return res.data;
};

export const deleteStory = async (id) => {
    const res = await api.delete(`/api/stories/${id}`);
    return res.data;
};

export const deleteArchivedStory = async (id) => {
    const res = await api.delete(`/api/stories/archive/${id}`);
    return res.data;
};

export const getStoriesByUser = async (userId) => {
    const res = await api.get(`/api/stories/user/${userId}`);
    return res.data;
};
