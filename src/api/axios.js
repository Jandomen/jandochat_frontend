import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BACKEND, 
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
  // console.log("📤 Enviando token:", token); 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
     // console.log("🚫 No se encontró token en localStorage");
    }
    return config;
  },
  (error) => {
    //console.error("❌ Error en interceptor de axios:", error);
    return Promise.reject(error);
  }
);

export default api;