import React, { useEffect, useState, useRef } from "react";
import { WifiOff } from "lucide-react";
import useSocket from "../../hooks/useSocket";
import { useLanguage } from "../../context/LanguageContext";
import useAuth from "../../hooks/useAuth";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";
import {
  obtenerMensajes,
  enviarMensajeAPI,
  editarMensajeAPI,
  eliminarMensajeAPI,
} from "../../api/chat";
import { uploadMedia } from "../../api/posts";
import { useParams, useLocation, Link } from "react-router-dom";
import api from "../../api/axios";
import { Send, Edit2, Trash2, ChevronLeft, Paperclip, X, Phone, Video, Loader2, FileText, Mic, StopCircle, Download } from "lucide-react";
import { useCall } from "../../context/CallContext";
import MediaPickerModal from "../UI/MediaPickerModal";

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
  const { t } = useLanguage();
  const { user: usuario } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [media, setMedia] = useState([]); // [{url, tipo, file}]
  const [destinatario, setDestinatario] = useState(propDestinatario || null);
  const [loading, setLoading] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
  const { error: showErrorToast } = useToast();

  const [offlineQueue, setOfflineQueue] = useState(() => {
    const saved = localStorage.getItem(`offline_msgs_${conversacionId}`);
    try {
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

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
    if (socket && conversacionId) {
      socket.emit("join", conversacionId);
    }
  }, [socket, conversacionId]);

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
        showErrorToast(t('load_messages_error'));
      }
    };
    cargarMensajes();
  }, [conversacionId, showErrorToast, t]);

  useEffect(() => {
    if (!usuario) return;
    const cargarDestinatario = async () => {
      try {
        if (propDestinatario) {
          setDestinatario(propDestinatario);
        } else if (locationDestinatario) {
          setDestinatario(locationDestinatario);
        } else if (!destinatario && conversacionId) {
          const res = await api.get(`/api/conversaciones/${conversacionId}`);
          const otro = res.data.participantes?.find((p) => p._id !== usuario?._id);
          setDestinatario(otro);
        }
      } catch (error) {
        showErrorToast(t('load_recipient_error'));
      }
    };
    cargarDestinatario();
  }, [conversacionId, propDestinatario, locationDestinatario, destinatario, usuario, showErrorToast, t]);

  useEffect(() => {
    if (navigator.onLine && offlineQueue.length > 0 && usuario) {
      const syncMessages = async () => {
        const queue = [...offlineQueue];
        for (const msg of queue) {
          try {
            let finalMsg = { ...msg };
            if (msg.localFiles && msg.localFiles.length > 0) {
              const uploadedMedia = await uploadMedia(msg.localFiles);
              finalMsg.media = uploadedMedia.map(m => ({ url: m.url, tipo: m.tipo }));
              delete finalMsg.localFiles;
            }
            await enviarMensajeAPI(finalMsg);
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

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      showErrorToast(t('mic_access_error'));
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 25 * 1024 * 1024;
    const validFiles = [];
    files.forEach(file => {
      if (file.size > MAX_SIZE) return;
      let tipo = "archivo";
      if (file.type.startsWith("image/")) tipo = "imagen";
      else if (file.type.startsWith("video/")) tipo = "video";
      else if (file.type.startsWith("audio/")) tipo = "audio";
      else tipo = "documento";
      validFiles.push({
        url: URL.createObjectURL(file),
        tipo,
        name: file.name,
        size: file.size,
        file
      });
    });
    setMedia([...media, ...validFiles]);
  };

  const removeMedia = (index) => {
    const item = media[index];
    URL.revokeObjectURL(item.url);
    setMedia(media.filter((_, i) => i !== index));
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if ((!mensaje.trim() && media.length === 0 && !audioBlob) || !destinatario || loading || !usuario) return;

    setLoading(true);

    // Use FormData for multimedia uploads
    const formData = new FormData();
    formData.append("conversacion", conversacionId);
    formData.append("emisor", usuario._id);
    if (mensaje.trim()) formData.append("contenido", mensaje);

    media.forEach(m => {
      if (m.file) formData.append("media", m.file);
    });

    if (audioBlob) {
      formData.append("media", audioBlob, `voice_note_${Date.now()}.webm`);
    }

    if (!navigator.onLine) {
      // Offline mode currently doesn't support FormData persistence easily in this implementation
      showErrorToast(t('offline_multimedia_error'));
      setLoading(false);
      return;
    }

    try {
      await enviarMensajeAPI(formData);
      setMensaje("");
      setMedia([]);
      setAudioBlob(null);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      showErrorToast(t('send_message_error'));
    } finally {
      setLoading(false);
    }
  };

  const descargarArchivo = async (url, nombre) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = nombre || t('document_label');
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {

      window.open(url, "_blank");
    }
  };

  const editarMensaje = async (mensajeOriginal) => {
    const nuevoContenido = await showPrompt(t('edit_message_title'), t('enter_new_content'), mensajeOriginal.contenido);
    if (!nuevoContenido || nuevoContenido === mensajeOriginal.contenido) return;
    try {
      const actualizado = await editarMensajeAPI(mensajeOriginal._id, { contenido: nuevoContenido });
      setMensajes((prev) => prev.map((m) => (m._id === actualizado._id ? actualizado : m)));
      socket.emit("mensaje-editado", actualizado);
    } catch (error) { showErrorToast(t('error')); }
  };

  const eliminarMensaje = async (mensajeId) => {
    const confirmed = await showConfirm(t('delete_message_title'), t('confirm_delete_message'));
    if (!confirmed) return;
    try {
      await eliminarMensajeAPI(mensajeId);
      setMensajes((prev) => prev.filter((m) => m._id !== mensajeId));
      socket.emit("mensaje-eliminado", mensajeId);
    } catch (err) { showErrorToast(t('error')); }
  };

  const handlePickerSelect = (type) => {
    if (!fileInputRef.current) return;

    if (type === 'camera') {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.accept = "image/*,video/*";
    } else if (type === 'gallery') {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.accept = "image/*,video/*";
    } else if (type === 'files') {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.accept = "*/*";
    }

    setTimeout(() => {
      fileInputRef.current.click();
    }, 100);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden flex-1 shadow-inner">
      <MediaPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handlePickerSelect}
      />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

      {/* Header Compacto - Sticky debajo del header principal */}
      <div className="z-40 bg-white/90 backdrop-blur-xl border-b border-red-50 p-1.5 sm:p-4 sticky top-0 left-0 right-0 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link to="/chat" className="md:hidden p-1.5 hover:bg-red-50 rounded-full text-red-600 transition-colors flex-shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          {destinatario && (
            <Link to={`/usuarios/${destinatario._id}`} className="flex items-center gap-2 group min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <img
                  src={destinatario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                  alt="avatar"
                  className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg object-cover ring-2 ring-red-100 group-hover:ring-red-300 transition-all shadow-sm"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-black text-gray-900 leading-tight group-hover:text-red-700 transition-colors text-[10px] sm:text-sm truncate">
                  {destinatario.nombre}
                </span>
                <span className="text-[7px] text-green-600 font-bold uppercase tracking-widest leading-none">{t('active_status')}</span>
              </div>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-1">
          <button
            onClick={() => destinatario && startCall(destinatario._id, "voice", destinatario)}
            disabled={!destinatario || activeCall}
            className="p-1 px-1.5 sm:p-2.5 bg-green-500/10 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all flex-shrink-0 active:scale-90"
          >
            <Phone className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
          </button>
          <button
            onClick={() => destinatario && startCall(destinatario._id, "video", destinatario)}
            disabled={!destinatario || activeCall}
            className="p-1 px-1.5 sm:p-2.5 bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all flex-shrink-0 active:scale-90"
          >
            <Video className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>

      {/* Mensajes - Contenedor con Scroll */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-6 space-y-3 sm:space-y-4 scroll-smooth min-h-0">
        {[...mensajes, ...offlineQueue].map((m, i) => {
          const emisorId = m.tempId ? m.emisor : (typeof m.emisor === "string" ? m.emisor : m.emisor?._id);
          const esAutor = emisorId === usuario?._id;
          const isPending = !!m.tempId;

          return (
            <div key={m._id || m.tempId || i} className={`flex w-full ${esAutor ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300 px-1`}>
              <div className={`group relative max-w-[85%] sm:max-w-[75%] ${esAutor ? "items-end" : "items-start"}`}>
                <div className={`p-3 sm:p-5 rounded-2xl sm:rounded-[2.5rem] shadow-lg text-[13px] sm:text-[15px] leading-relaxed transition-all ${esAutor
                  ? "bg-gradient-to-br from-red-600 to-red-700 text-white rounded-tr-none shadow-red-200"
                  : "bg-white text-gray-800 rounded-tl-none border border-red-50"
                  } ${isPending ? "opacity-60 grayscale-[0.5]" : ""}`}
                >
                  {m.media && m.media.length > 0 && (
                    <div className="mb-2 grid grid-cols-1 gap-2">
                      {m.media.map((med, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden shadow-sm border border-gray-100">
                          {med.tipo === 'imagen' ? (
                            <img src={med.url} alt="" className="w-full max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(med.url, '_blank')} />
                          ) : med.tipo === 'video' ? (
                            <video src={med.url} controls className="w-full max-h-48 bg-black" />
                          ) : med.tipo === 'audio' ? (
                            <div className="bg-red-50/20 p-2 rounded-xl flex items-center gap-2">
                              <Mic className="w-4 h-4 text-white fill-white animate-pulse" />
                              <audio src={med.url} controls className="h-8 max-w-full invert opacity-80" />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => descargarArchivo(med.url, med.nombre)}
                              className={`flex items-center justify-between gap-3 p-3 rounded-xl transition-all border border-white/10 text-left outline-none ${esAutor ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-50 hover:bg-red-50 text-gray-800"}`}
                            >
                               <div className="flex items-center gap-3 min-w-0">
                                 <div className="bg-red-600 p-2 rounded-lg text-white shadow-sm flex-shrink-0">
                                   <FileText className="w-4 h-4" />
                                 </div>
                                 <div className="flex flex-col min-w-0">
                                   <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[150px]">{med.nombre || t('document_label')}</span>
                                   <span className="text-[7px] opacity-60 uppercase font-black">{t('download_file_label')}</span>
                                 </div>
                               </div>
                               <Download className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap font-medium">{escapeHTML(m.contenido)}</p>

                  <div className={`flex items-center gap-1.5 mt-1 opacity-60 text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${esAutor ? "justify-end text-white/70" : "justify-start text-gray-400"}`}>
                    {isPending ? (
                      <span className="flex items-center gap-1"><WifiOff className="w-2.5 h-2.5" /> {t('pending_label')}</span>
                    ) : (
                      <>
                        {m.updatedAt && m.updatedAt !== m.createdAt && <span>• {t('edited_label')}</span>}
                        <span>{new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </>
                    )}
                  </div>
                </div>

                {esAutor && !isPending && (
                  <div className="absolute top-1/2 -translate-y-1/2 right-full mr-2 opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-1">
                    <button onClick={() => editarMensaje(m)} className="p-1.5 bg-white text-gray-400 hover:text-red-600 rounded-lg shadow-md border border-red-50 active:scale-90">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => eliminarMensaje(m._id)} className="p-1.5 bg-white text-gray-400 hover:text-red-900 rounded-lg shadow-md border border-red-50 active:scale-90">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={mensajesEndRef} />
      </div>

      {/* Input de Chat Fijo al Fondo */}
      <div className="p-2 sm:p-6 bg-white border-t border-red-50 z-20 mt-auto">
        {(media.length > 0 || audioBlob) && (
          <div className="max-w-5xl mx-auto flex flex-wrap gap-3 mb-2 overflow-x-auto pb-1 bg-white p-2 rounded-xl border border-red-50 shadow-sm animate-in slide-in-from-bottom-2">
            {media.map((item, index) => (
              <div key={index} className="relative flex-shrink-0 group">
                <img src={item.tipo === 'imagen' ? item.url : "https://via.placeholder.com/64?text=Archivo"} alt="" className="w-12 h-12 object-cover rounded-lg border shadow-sm" />
                <button type="button" onClick={() => removeMedia(index)} className="absolute -top-1 -right-1 p-0.5 bg-red-600 text-white rounded-full shadow-lg">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
            {audioBlob && (
              <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-xl shadow-lg ring-2 ring-red-100 animate-pulse">
                <Mic className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('audio_recorded_label')}</span>
                <button type="button" onClick={() => setAudioBlob(null)} className="ml-2 hover:scale-110 transition-transform"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
        )}
        <form onSubmit={enviarMensaje} className="max-w-5xl mx-auto flex items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="*/*" className="hidden" />
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setIsPickerOpen(true)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all flex-shrink-0 active:scale-90" title={t('attach_multimedia_title')}>
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`p-2.5 rounded-full transition-all active:scale-90 ${isRecording ? 'bg-red-600 text-white animate-pulse shadow-lg ring-4 ring-red-100' : 'bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
              title={isRecording ? t('stop_recording_title') : t('record_voice_note_title')}
            >
              {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex-1 relative bg-gray-100/50 rounded-2xl border border-transparent focus-within:border-red-100 focus-within:bg-white transition-all shadow-inner overflow-hidden">
            <input
              type="text"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder={isRecording ? t('recording_audio_placeholder') : t('message_placeholder')}
              disabled={isRecording}
              className="w-full px-4 py-2 bg-transparent text-gray-800 text-[13px] font-medium outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!destinatario || loading || (!mensaje.trim() && media.length === 0 && !audioBlob) || isRecording}
            className="p-3 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-full shadow-lg shadow-red-100 active:scale-95 transition-all flex-shrink-0 group hover:rotate-12"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPrivado;
