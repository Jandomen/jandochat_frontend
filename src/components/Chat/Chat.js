import React, { useState, useEffect } from "react";
import ConversacionesList from "./ConversacionesList";
import BuscarUsuarios from "../Usuarios/BuscarUsuarios";
import { crearConversacion, obtenerConversaciones } from "../../api/chat";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Chat() {
  const { user, token } = useAuth();
  const [buscandoUsuario, setBuscandoUsuario] = useState(false);
  const [conversaciones, setConversaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarConversaciones = async () => {
      try {
        const data = await obtenerConversaciones(token);
        setConversaciones(data);
      } catch (error) {
        //console.error("Error cargando conversaciones", error);
        setConversaciones([]);
      } finally {
        setCargando(false);
      }
    };

    if (token) cargarConversaciones();
  }, [token]);

  const handleCrearConversacion = () => {
    setBuscandoUsuario(true);
  };

  const handleSeleccionarUsuario = async (usuarioSeleccionado) => {
    //console.log("handleSeleccionarUsuario llamado con:", usuarioSeleccionado);
   // console.log("Usuario actual (user):", user);

    if (!usuarioSeleccionado || !usuarioSeleccionado._id) {
      console.error("Usuario inválido recibido en handleSeleccionarUsuario:", usuarioSeleccionado);
      return;
    }

    try {
      const data = {
        participantes: [user._id, usuarioSeleccionado._id],
        esGrupo: false,
        nombreGrupo: null,
      };

      const nuevaConv = await crearConversacion(data, token);

      setConversaciones((prev) => [...prev, nuevaConv]);
      navigate(`/chat/${nuevaConv._id}`, { state: { destinatario: usuarioSeleccionado } });
      setBuscandoUsuario(false);
    } catch (error) {
      console.error("Error creando conversación", error);
    }
  };

  const handleSeleccionarConversacion = (conv) => {
    const otro = conv.participantes.find((p) => p._id !== user._id);
    navigate(`/chat/${conv._id}`, { state: { destinatario: otro } });
  };

  return (
    <div className="grid grid-cols-3 h-screen">
      <div className="border-r overflow-y-auto">
        {buscandoUsuario ? (
          <BuscarUsuarios onSeleccionar={handleSeleccionarUsuario} />
        ) : (
          <ConversacionesList
            conversaciones={conversaciones}
            cargando={cargando}
            onSeleccionar={handleSeleccionarConversacion}
            onCrearConversacion={handleCrearConversacion}
          />
        )}
      </div>
      <div className="col-span-2 p-4 text-gray-500 flex items-center justify-center">
        <p>Selecciona o crea una conversación para comenzar a chatear.</p>
      </div>
    </div>
  );
}
