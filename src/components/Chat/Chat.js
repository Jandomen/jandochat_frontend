import React, { useState, useEffect } from "react";
import ConversacionesList from "./ConversacionesList";
import BuscarUsuarios from "../Usuarios/BuscarUsuarios";
import { crearConversacion, obtenerConversaciones } from "../../api/chat";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Plus } from "lucide-react";

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
    if (!usuarioSeleccionado || !usuarioSeleccionado._id) {
      return;
    }

    try {
      const data = {
        participantes: [user._id, usuarioSeleccionado._id],
        esGrupo: false,
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
    <div className="max-w-4xl mx-auto px-4 py-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-red-600 text-white rounded-[1.5rem] shadow-xl shadow-red-200">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Mensajes</h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">{conversaciones.length} Chat(s) activos</p>
          </div>
        </div>
        <button
          onClick={handleCrearConversacion}
          className="p-5 bg-white text-red-600 border border-red-50 rounded-[1.5rem] hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-red-100/10 group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      <div className="bg-white rounded-[3rem] border border-red-50 shadow-2xl shadow-red-100/20 overflow-hidden min-h-[400px]">
        {buscandoUsuario ? (
          <BuscarUsuarios
            onSeleccionar={handleSeleccionarUsuario}
            onBack={() => setBuscandoUsuario(false)}
          />
        ) : (
          <ConversacionesList
            conversaciones={conversaciones}
            cargando={cargando}
            onSeleccionar={handleSeleccionarConversacion}
            onCrearConversacion={handleCrearConversacion}
          />
        )}
      </div>

      {conversaciones.length === 0 && !buscandoUsuario && !cargando && (
        <div className="mt-12 text-center space-y-4 opacity-50">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-10 h-10 text-gray-200" />
          </div>
          <p className="text-gray-400 font-black uppercase text-xs tracking-widest">¿A quién quieres escribir hoy?</p>
          <button onClick={handleCrearConversacion} className="text-red-600 font-black uppercase text-[10px] tracking-[0.4em] hover:underline">Buscar Contactos</button>
        </div>
      )}
    </div>
  );
}
