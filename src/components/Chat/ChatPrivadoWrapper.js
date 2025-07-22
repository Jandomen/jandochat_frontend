import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import ChatPrivado from "./ChatPrivado";
import { useAuth } from "../../context/AuthContext"; 

function ChatPrivadoWrapper() {
  const { id } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const [destinatario, setDestinatario] = useState(state?.destinatario || null);
  const [cargando, setCargando] = useState(!state?.destinatario);

  useEffect(() => {
    const cargarDestinatario = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BACKEND}/api/conversaciones/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, 
          },
        });

        const data = await res.json();

        let otro = data.participantes.find(p => p._id !== user._id);

        if (otro && !otro.fotoPerfil) {
          try {
            const resUser = await fetch(`${process.env.REACT_APP_API_BACKEND}/api/users/usuarios/${otro._id}`, {
             headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`, 
        },
     });
            const userData = await resUser.json();
            otro = { ...otro, fotoPerfil: userData.fotoPerfil };
          } catch (errorUser) {
            console.warn("No se pudo cargar fotoPerfil adicional del destinatario:", errorUser);
          }
        }

        setDestinatario(otro);
      } catch (error) {
        console.error("❌ Error al cargar el destinatario:", error);
      } finally {
        setCargando(false);
      }
    };

    if (!state?.destinatario && user?._id) {
      cargarDestinatario();
    }
  }, [id, state, user]);

  if (cargando) return <p className="p-4 text-gray-500">⏳ Cargando conversación...</p>;
  if (!destinatario) return <p className="p-4 text-red-500">❌ No se pudo obtener el destinatario.</p>;

  return <ChatPrivado conversacionId={id} destinatario={destinatario} />;
}

export default ChatPrivadoWrapper;
