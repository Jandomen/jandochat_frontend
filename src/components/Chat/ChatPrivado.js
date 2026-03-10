import React, { useEffect, useState, useRef } from "react";
import { WifiOff } from "lucide-react";
import useSocket from "../../hooks/useSocket";
import useAuth from "../../hooks/useAuth";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";
import {
  obtenerMensajes,
  enviarMensajeAPI,
  editarMensajeAPI,
  eliminarMensajeAPI,
} from "../../api/chat";
import { useParams, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { Send, Edit2, Trash2, ChevronLeft, Paperclip, X, Phone, Video } from "lucide-react";
import { useCall } from "../../context/CallContext";

function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function ChatPrivado({ conversacionId: propConversacionId, destinatario: propDestinatario }) {
  const { user: usuario } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [media, setMedia] = useState([]); // [{url, tipo, file}]
  const [destinatario, setDestinatario] = useState(propDestinatario || null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState(() => {
    const saved = localStorage.getItem(`offline_msgs_${conversacionId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const {
    startCall,
    activeCall
  } = useCall();

  const fileInputRef = useRef(null);
  const mensajesEndRef = useRef(null);
  const { id } = useParams();
  const location = useLocation();
  const locationDestinatario = location.state?.destinatario || null;
  const conversacionId = propConversacionId || id;
  const { showConfirm, showPrompt } = useModal();
  const { success, error: showErrorToast } = useToast();

  const socket = useSocket({
    "mensaje-recibido": (nuevoMensaje) => {
      if (nuevoMensaje.conversacion === conversacionId) {
        setMensajes((prev) => [...prev, nuevoMensaje]);
      }
    },
    "mensaje-editado": (msgActualizado) => {
      setMensajes((prev) =>
        prev.map((m) => (m._id === msgActualizado._id ? msgActualizado : m))
      );
    },
    "mensaje-eliminado": (idEliminado) => {
      setMensajes((prev) => prev.filter((m) => m._id !== idEliminado));
    },
  });

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  useEffect(() => {
    if (!conversacionId) return;
    const cargarMensajes = async () => {
      try {
        const data = await obtenerMensajes(conversacionId);
        setMensajes(data || []);
      } catch (error) {
        setError("Error al cargar mensajes.");
      }
    };
    cargarMensajes();
  }, [conversacionId]);

  useEffect(() => {
    if (!usuario) return;
    const cargarDestinatario = async () => {
      try {
        if (propDestinatario) {
          setDestinatario(propDestinatario);
        } else if (locationDestinatario) {
          setDestinatario(locationDestinatario);
        } else if (!destinatario && conversacionId) {
          const res = await axios.get(
            `${process.env.REACT_APP_API_BACKEND}/api/conversaciones/${conversacionId}`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
          );
          const otro = res.data.participantes?.find((p) => p._id !== usuario?._id);
          setDestinatario(otro);
        }
      } catch (error) {
        setError("Error al cargar destinatario.");
      }
    };
    cargarDestinatario();
  }, [conversacionId, propDestinatario, locationDestinatario, destinatario, usuario]);

  // Sync offline queue when coming back online
  useEffect(() => {
    if (navigator.onLine && offlineQueue.length > 0 && usuario) {
      const syncMessages = async () => {
        const queue = [...offlineQueue];
        for (const msg of queue) {
          try {
            await enviarMensajeAPI(msg);
            setOfflineQueue(prev => prev.filter(m => m.tempId !== msg.tempId));
          } catch (err) {
            console.error("Failed to sync message", msg, err);
          }
        }
      };
      syncMessages();
    }
  }, [offlineQueue, usuario]);

  useEffect(() => {
    localStorage.setItem(`offline_msgs_${conversacionId}`, JSON.stringify(offlineQueue));
  }, [offlineQueue, conversacionId]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newMedia = files.map(file => ({
      url: URL.createObjectURL(file),
      tipo: file.type.startsWith("video/") ? "video" : "imagen",
      file
    }));
    setMedia([...media, ...newMedia]);
  };

  const removeMedia = (index) => {
    const item = media[index];
    URL.revokeObjectURL(item.url);
    setMedia(media.filter((_, i) => i !== index));
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if ((!mensaje.trim() && media.length === 0) || !destinatario || loading || !usuario) return;
    const msgData = {
      contenido: mensaje,
      conversacion: conversacionId,
      emisor: usuario._id,
      media: media.map(m => ({ url: m.url, tipo: m.tipo })), // Simulation
      tempId: Date.now()
    };

    if (!navigator.onLine) {
      setOfflineQueue([...offlineQueue, msgData]);
      setMensaje("");
      setMedia([]);
      setLoading(false);
      return;
    }

    try {
      await enviarMensajeAPI(msgData);
      setMensaje("");
      setMedia([]);
    } catch (error) {
      // If error (e.g. server down), add to offline queue
      setOfflineQueue([...offlineQueue, msgData]);
      setMensaje("");
      setMedia([]);
      setError("Mensaje guardado localmente (Sin conexión)");
    } finally {
      setLoading(false);
    }
  };

  const editarMensaje = async (mensajeOriginal) => {
    const nuevoContenido = await showPrompt("Editar mensaje", "Ingresa el nuevo contenido:", mensajeOriginal.contenido);
    if (!nuevoContenido || nuevoContenido === mensajeOriginal.contenido) return;
    try {
      const actualizado = await editarMensajeAPI(mensajeOriginal._id, { contenido: nuevoContenido });
      setMensajes((prev) => prev.map((m) => (m._id === actualizado._id ? actualizado : m)));
      socket.emit("mensaje-editado", actualizado);
    } catch (error) {
      setError("Error al editar.");
    }
  };

  const eliminarMensaje = async (mensajeId) => {
    const confirmed = await showConfirm("Eliminar mensaje", "¿Eliminar este mensaje?");
    if (!confirmed) return;
    try {
      await eliminarMensajeAPI(mensajeId);
      setMensajes((prev) => prev.filter((m) => m._id !== mensajeId));
      socket.emit("mensaje-eliminado", mensajeId);
      success("Mensaje eliminado");
    } catch (err) {
      console.error(err);
      showErrorToast("Error al eliminar");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

      <div className="z-10 bg-white/80 backdrop-blur-md border-b border-red-50 p-4 sticky top-0 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/chat" className="md:hidden p-2 hover:bg-red-50 rounded-full text-red-600 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          {destinatario && (
            <Link to={`/usuarios/${destinatario._id}`} className="flex items-center gap-3 group">
              <div className="relative">
                <img
                  src={destinatario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                  alt="avatar"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover ring-2 ring-red-100 group-hover:ring-red-300 transition-all shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-gray-900 leading-tight group-hover:text-red-700 transition-colors">
                  {destinatario.nombre}
                </span>
                <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">En línea</span>
              </div>
            </Link>
          )}
        </div>

        {/* Botones de llamada */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => destinatario && startCall(destinatario._id, "voice", destinatario)}
            disabled={!destinatario || activeCall}
            className="p-3 bg-green-500/10 text-green-600 hover:bg-green-600 hover:text-white rounded-2xl transition-all disabled:opacity-30 shadow-sm"
            title="Llamada de voz"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={() => destinatario && startCall(destinatario._id, "video", destinatario)}
            disabled={!destinatario || activeCall}
            className="p-3 bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all disabled:opacity-30 shadow-sm"
            title="Videollamada"
          >
            <Video className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {[...mensajes, ...offlineQueue].map((m, i) => {
          const emisorId = m.tempId ? m.emisor : (typeof m.emisor === "string" ? m.emisor : m.emisor?._id);
          const esAutor = emisorId === usuario?._id;
          const isPending = !!m.tempId;

          return (
            <div key={m._id || m.tempId || i} className={`flex ${esAutor ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`group relative max-w-[85%] sm:max-w-[75%] ${esAutor ? "items-end" : "items-start"}`}>
                <div className={`p-5 rounded-[2.5rem] shadow-lg text-[15px] leading-relaxed transition-all ${esAutor
                  ? "bg-gradient-to-br from-red-600 to-red-700 text-white rounded-tr-none shadow-red-200"
                  : "bg-white text-gray-800 rounded-tl-none border border-red-50"
                  } ${isPending ? "opacity-60 grayscale-[0.5]" : ""}`}
                >
                  {m.media && m.media.length > 0 && (
                    <div className="mb-3 grid grid-cols-1 gap-2">
                      {m.media.map((med, idx) => (
                        <div key={idx} className="rounded-2xl overflow-hidden shadow-md">
                          {med.tipo === 'imagen' ? (
                            <img src={med.url} alt="" className="w-full max-h-60 object-cover" />
                          ) : (
                            <video src={med.url} controls className="w-full max-h-60 bg-black" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap font-medium">{escapeHTML(m.contenido)}</p>

                  <div className={`flex items-center gap-2 mt-3 opacity-60 text-[10px] font-black uppercase tracking-widest ${esAutor ? "justify-end text-white/70" : "justify-start text-gray-400"}`}>
                    {isPending ? (
                      <span className="flex items-center gap-1"><WifiOff className="w-3 h-3" /> Pendiente</span>
                    ) : (
                      <>
                        {m.updatedAt && m.updatedAt !== m.createdAt && <span>• Editado</span>}
                        <span>{new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </>
                    )}
                  </div>

                  {esAutor && !isPending && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-full mr-4 opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-2">
                      <button onClick={() => editarMensaje(m)} className="p-2.5 bg-white text-gray-400 hover:text-red-600 rounded-2xl shadow-xl shadow-red-100 border border-red-50 transition-all hover:scale-110">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => eliminarMensaje(m._id)} className="p-2.5 bg-white text-gray-400 hover:text-red-900 rounded-2xl shadow-xl shadow-red-100 border border-red-50 transition-all hover:scale-110">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={mensajesEndRef} />
      </div>

      <div className="p-6 bg-white/90 backdrop-blur-xl border-t border-red-50 z-10">
        {media.length > 0 && (
          <div className="max-w-5xl mx-auto flex gap-3 mb-4 overflow-x-auto pb-2">
            {media.map((item, index) => (
              <div key={index} className="relative flex-shrink-0">
                {item.tipo === 'imagen' ? (
                  <img src={item.url} alt="" className="w-20 h-20 object-cover rounded-2xl border" />
                ) : (
                  <video src={item.url} className="w-20 h-20 object-cover rounded-2xl border bg-black" />
                )}
                <button onClick={() => removeMedia(index)} className="absolute -top-1 -right-1 p-1 bg-red-600 text-white rounded-full shadow-md">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={enviarMensaje} className="max-w-5xl mx-auto flex items-center gap-4">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*,video/*" className="hidden" />
          <button type="button" onClick={() => fileInputRef.current.click()} className="p-4 bg-gray-50 text-gray-400 hover:text-red-600 rounded-full transition-all">
            <Paperclip className="w-6 h-6" />
          </button>
          <div className="flex-1 relative group bg-gray-50 rounded-[2.5rem] border border-transparent focus-within:border-red-200 focus-within:bg-white transition-all shadow-inner">
            <input
              type="text"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe algo increíble..."
              className="w-full px-8 py-5 bg-transparent text-gray-800 font-medium placeholder:text-gray-300 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!destinatario || loading || (!mensaje.trim() && media.length === 0)}
            className="p-5 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-full shadow-xl shadow-red-200 hover:scale-110 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all flex items-center justify-center group"
          >
            <Send className="w-7 h-7 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </form>
        {error && <p className="text-center text-[10px] text-red-500 mt-2 font-bold uppercase tracking-widest">{error}</p>}
      </div>

      {/* Modal de llamada entrante y CallInterface se manejan globalmente en CallProvider */}
    </div>
  );
}

export default ChatPrivado;

