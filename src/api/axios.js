import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BACKEND,
});

//console.log("🛠️ Backend URL en uso:", process.env.REACT_APP_API_BACKEND);


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    // Only add standard token if no Authorization header is already set (e.g. by admin api)
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    //console.error("❌ Error en interceptor de axios:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Evitar bucles si ya estamos en login
      if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
        window.dispatchEvent(new CustomEvent("session_expired"));
      }
    }
    return Promise.reject(error);
  }
);

export default api;