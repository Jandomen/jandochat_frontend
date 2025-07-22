import axios from './axios';

export const loginUsuario = async (data) => {
  try {
   //  console.log("📤 Enviando datos de login:", data);
    const response = await axios.post("/api/auth/login", data);
   // console.log("✅ Respuesta login:", response.data);

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
     // console.log("🔐 Token guardado en localStorage:", response.data.token);
    }

   

    return response.data;
  } catch (error) {
   // console.error("❌ Error en login:", error.response?.data || error.message);
    throw error.response?.data || { msg: "Error desconocido en login" };
  }
};


export const registrarUsuario = async (data) => {
  try {
   // console.log("📤 Enviando datos de registro:", data);
    const response = await axios.post("/api/auth/registro", data);
   // console.log("✅ Respuesta registro:", response.data);

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
     // console.log("🔐 Token guardado en localStorage:", response.data.token);
    }

    return response.data;
  } catch (error) {
  // console.error("❌ Error en registro:", error.response?.data || error.message);
    throw error.response?.data || { msg: "Error desconocido en registro" };
  }
};

export const obtenerPerfil = async () => {
  try {
   // console.log("📥 Solicitando perfil del usuario...");
    const response = await axios.get("/api/users/me");
   // console.log("👤 Perfil obtenido:", response.data);
    return response.data;
  } catch (error) {
   // console.error("❌ Error al obtener perfil:", error.response?.data || error.message);
    throw error.response?.data || { msg: "Error al obtener el perfil" };
  }
};
