import React, { useEffect, useState, useRef } from "react";
import useAuth from "../../hooks/useAuth";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";
import { MessageSquare, Plus, Trash2, Clock, Search, X, Check, Film, Image as ImageIcon, Type } from "lucide-react";
import useSocket from "../../hooks/useSocket";
import api from "../../api/axios";

export default function ConversacionesList({ onSeleccionar, onCrearConversacion }) {
  const [conversaciones, setConversaciones] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [mostrarModalStatus, setMostrarModalStatus] = useState(false);
  const [nuevoStatus, setNuevoStatus] = useState("");
  const [vistasStatus, setVistasStatus] = useState([]);
  const [tipoNuevoStatus, setTipoNuevoStatus] = useState("texto"); // texto, imagen, video
  const [mediaArchivo, setMediaArchivo] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [videoDuracion, setVideoDuracion] = useState(0);
  const [videoTiempoInicio, setVideoTiempoInicio] = useState(0);
  const [videoCortado, setVideoCortado] = useState(null);
  const [cortandoVideo, setCortandoVideo] = useState(false);
  const videoRef = useRef(null);
  const { user } = useAuth();
  const { showConfirm } = useModal();
  const { success, error: showErrorToast } = useToast();

  useSocket({
    "mensaje-recibido": (nuevoMensaje) => {
      setConversaciones((prev) => {
        const index = findIndexById(prev, nuevoMensaje.conversacion);
        if (index === -1) return prev;
        const copy = [...prev];
        const updated = { ...copy[index], ultimoMensaje: nuevoMensaje, updatedAt: new Date() };
        copy.splice(index, 1);
        return [updated, ...copy];
      });
    },
    "nueva-conversacion": (nueva) => {
      setConversaciones((prev) => [nueva, ...prev]);
    }
  });

  const findIndexById = (arr, id) => arr.findIndex(i => (i._id || i).toString() === id.toString());

  useEffect(() => {
    const fetchData = async () => {
      setCargando(true);
      try {
        const [convData, statusData] = await Promise.all([
          api.get("/api/conversaciones").then(r => r.data),
          api.get("/api/status").then(r => r.data)
        ]);
        setConversaciones(Array.isArray(convData) ? convData : []);
        setStatuses(Array.isArray(statusData) ? statusData : []);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setCargando(false);
      }
    };

    fetchData();
  }, []);

  const handleVideoLoaded = (e) => {
    const video = e.target;
    setVideoDuracion(video.duration);
  };

  const cortarVideo = async () => {
    if (!previewUrl || videoDuracion <= 20) return;

    setCortandoVideo(true);

    try {
      const video = document.createElement('video');
      video.src = previewUrl;
      video.crossOrigin = 'anonymous';

      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      const maxDuration = 20;
      const startTime = videoTiempoInicio;
      const endTime = Math.min(startTime + maxDuration, video.duration);

      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoCortado(blob);
        setPreviewUrl(url);
        setCortandoVideo(false);
      };

      mediaRecorder.start();

      const drawFrame = async () => {
        if (video.currentTime >= endTime || video.currentTime < startTime) {
          video.currentTime = startTime;
        }

        if (video.currentTime < endTime) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          await new Promise(r => setTimeout(r, 33));
          requestAnimationFrame(drawFrame);
        } else {
          mediaRecorder.stop();
        }
      };

      video.currentTime = startTime;
      video.play();
      drawFrame();

    } catch (err) {
      console.error("Error al procesar video:", err);
      setCortandoVideo(false);
    }
  };

  const handleCrearStatus = async () => {
    if (!nuevoStatus.trim() && !mediaArchivo && !videoCortado) return;
    try {
      let mediaUrl = "";
      const archivoParaSubir = videoCortado || mediaArchivo;
      if (archivoParaSubir) {
        mediaUrl = URL.createObjectURL(archivoParaSubir);
      }

      const data = await api.post("/api/status", {
        contenido: nuevoStatus,
        tipo: tipoNuevoStatus,
        mediaUrl: mediaUrl,
        duracionHoras: user?.configuracionStatus?.duracion || 24
      }).then(r => r.data);
      setStatuses([data, ...statuses]);
      setNuevoStatus("");
      setMediaArchivo(null);
      setPreviewUrl(null);
      setVideoCortado(null);
      setVideoDuracion(0);
      setVideoTiempoInicio(0);
      setMostrarModalStatus(false);
    } catch (err) {
      console.error("Error al publicar estado");
    }
  };

  const verVistas = async (statusId) => {
    try {
      const data = await api.get(`/api/status/${statusId}/vistas`).then(r => r.data);
      setVistasStatus(data);
    } catch (err) {
      console.error("Error al obtener vistas");
    }
  };

  const marcarVisto = async (statusId) => {
    try {
      await api.post(`/api/status/${statusId}/visto`);
    } catch (err) {
      console.error("Error al marcar como visto");
    }
  };

  const eliminarStatus = async (statusId) => {
    const confirmed = await showConfirm("Eliminar historia", "¿Eliminar esta historia?");
    if (!confirmed) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BACKEND}/api/status/${statusId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        setStatuses(statuses.filter(s => s._id !== statusId));
        setStatusSeleccionado(null);
        success("Historia eliminada");
      }
    } catch (err) {
      console.error("Error al eliminar status");
      showErrorToast("Error al eliminar");
    }
  };

  const eliminarConversacion = async (id, e) => {
    e.stopPropagation();
    const confirmed = await showConfirm("Eliminar conversación", "¿Eliminar esta conversación?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_BACKEND}/api/conversaciones/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Error al eliminar");
      setConversaciones((prev) => prev.filter((c) => c._id !== id));
      success("Conversación eliminada");
    } catch (err) {
      console.error(err);
      showErrorToast("Error al eliminar");
    }
  };

  const conversasFiltradas = conversaciones.filter(c => {
    const otro = c.participantes.find(p => p._id !== user?._id);
    return otro?.nombre?.toLowerCase().includes(filtro.toLowerCase());
  });

  const [statusSeleccionado, setStatusSeleccionado] = useState(null);

  useEffect(() => {
    if (!statusSeleccionado) return;

    const handleKeyDown = (e) => {
      const currentIndex = statuses.findIndex(s => s._id === statusSeleccionado._id);

      if (e.key === "Escape") {
        setStatusSeleccionado(null);
        setVistasStatus([]);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (currentIndex < statuses.length - 1) {
          setStatusSeleccionado(statuses[currentIndex + 1]);
          marcarVisto(statuses[currentIndex + 1]._id);
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (currentIndex > 0) {
          setStatusSeleccionado(statuses[currentIndex - 1]);
          marcarVisto(statuses[currentIndex - 1]._id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [statusSeleccionado, statuses]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header section with Search */}
      <div className="p-8 pb-4 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black tracking-tighter text-gray-900 mb-1">Chats</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{conversaciones.length} Conversaciones</span>
            </div>
          </div>
          <button
            onClick={onCrearConversacion}
            className="p-5 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-3xl shadow-[0_15px_30px_rgba(220,38,38,0.3)] hover:shadow-[0_20px_40px_rgba(220,38,38,0.4)] hover:-translate-y-1 active:scale-95 transition-all group border-4 border-white"
          >
            <Plus className="w-7 h-7 stroke-[3] transition-transform group-hover:rotate-90" />
          </button>
        </div>

        <div className="relative group shadow-sm rounded-3xl overflow-hidden">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-red-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-gray-50 border-none rounded-3xl text-sm focus:bg-white focus:ring-4 focus:ring-red-50 transition-all outline-none font-medium placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Status section (Premium bubbles) */}
      <div className="px-8 py-6 border-b border-red-50/50 bg-white/50 backdrop-blur-sm overflow-hidden">
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          <button
            onClick={() => { setTipoNuevoStatus("texto"); setMostrarModalStatus(true); }}
            className="flex flex-col items-center gap-3 flex-shrink-0 group"
          >
            <div className="relative w-20 h-20 p-[3px] rounded-[1.8rem] bg-gradient-to-tr from-gray-100 via-gray-200 to-gray-50 group-hover:from-red-300 group-hover:to-red-500 transition-all duration-500 shadow-lg shadow-gray-200/50 group-hover:shadow-red-200/50">
              <div className="w-full h-full rounded-[1.6rem] bg-white flex items-center justify-center border-4 border-white overflow-hidden bg-gray-50/50">
                <div className="bg-red-600 text-white p-2 rounded-full shadow-lg group-hover:scale-125 transition-transform">
                  <Plus className="w-5 h-5 stroke-[4]" />
                </div>
              </div>
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest transition-colors group-hover:text-red-600">Mi Estado</span>
          </button>

          {statuses.map((status) => (
            <div
              key={status._id}
              className="flex flex-col items-center gap-3 flex-shrink-0 cursor-pointer group"
              onClick={() => {
                setStatusSeleccionado(status);
                marcarVisto(status._id);
                if (status.usuario?._id === user?._id) verVistas(status._id);
              }}
            >
              <div className="relative w-20 h-20 p-[3px] rounded-[1.8rem] bg-gradient-to-tr from-red-500 via-red-400 to-red-600 shadow-xl shadow-red-100 group-hover:scale-105 group-hover:-rotate-3 transition-all">
                <div className="w-full h-full rounded-[1.6rem] border-4 border-white overflow-hidden shadow-inner bg-gray-100">
                  <img
                    src={status.usuario?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                    alt={status.usuario?.nombre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                {/* Visual indicator for active status type */}
                <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-xl shadow-lg border border-red-50">
                  {status.tipo === 'video' ? <Film className="w-3 h-3 text-red-600" /> : status.tipo === 'imagen' ? <ImageIcon className="w-3 h-3 text-red-600" /> : <Type className="w-3 h-3 text-red-600" />}
                </div>
              </div>
              <span className="text-[10px] font-black text-gray-800 tracking-tight truncate w-20 text-center opacity-80 group-hover:opacity-100">
                {status.usuario?.nombre.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Conversations list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {cargando ? (
          <div className="space-y-6 mt-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4 items-center animate-pulse">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-100 rounded-full w-1/3"></div>
                  <div className="h-3 bg-gray-50 rounded-full w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : conversasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <div className="p-8 bg-red-50 rounded-full">
              <MessageSquare className="w-12 h-12 text-red-200" />
            </div>
            <div>
              <p className="text-gray-900 font-black text-lg">Sin conversaciones</p>
              <p className="text-gray-400 text-sm font-medium">Empieza a chatear con alguien</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-20">
            {conversasFiltradas.map((conv) => {
              const otro = conv.participantes.find((p) => p._id !== user?._id);
              const ultimoMsj = conv.ultimoMensaje;
              return (
                <div
                  key={conv._id}
                  onClick={() => onSeleccionar(conv)}
                  className="flex items-center gap-5 p-5 bg-white border border-transparent rounded-[2.5rem] cursor-pointer hover:bg-white hover:shadow-2xl hover:shadow-red-200/40 hover:border-red-50 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>

                  <div className="relative">
                    <img
                      src={otro?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                      alt="avatar"
                      className="w-16 h-16 rounded-[1.5rem] object-cover shadow-lg group-hover:scale-105 transition-transform border-2 border-white"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                  </div>

                  <div className="flex-1 min-w-0 z-10">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-gray-900 group-hover:text-red-700 transition-colors truncate text-base">
                        {otro?.nombre || "Usuario"}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        <Clock className="w-3 h-3 text-red-300" />
                        <span>Reciente</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 truncate font-medium">
                      {ultimoMsj ? (
                        <div className="flex items-center gap-2">
                          {typeof ultimoMsj.emisor === 'string' ? (ultimoMsj.emisor === user?._id && <span className="text-[10px] font-black text-red-400 uppercase tracking-tighter">Tú:</span>) : (ultimoMsj.emisor?._id === user?._id && <span className="text-[10px] font-black text-red-400 uppercase tracking-tighter">Tú:</span>)}
                          <span className="truncate">{ultimoMsj.contenido}</span>
                        </div>
                      ) : <span className="italic text-gray-300">Inicia la conversación...</span>}
                    </div>
                  </div>

                  <button
                    onClick={(e) => eliminarConversacion(conv._id, e)}
                    className="p-3 text-gray-200 hover:text-red-600 hover:bg-red-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all z-10"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Status Creation (Refined with StoryEditor design) */}
      {mostrarModalStatus && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-gray-950/80 backdrop-blur-xl transition-all duration-500">
          <div className="bg-white w-full max-w-lg h-full sm:h-auto sm:rounded-[3.5rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] flex flex-col relative group/modal">
            {/* Header decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full -mr-32 -mt-32 blur-3xl" />

            <div className="p-10 flex-1 overflow-y-auto z-10 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-4xl font-black text-gray-900 tracking-tighter">Compartir</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Nuevo Estado</p>
                </div>
                <button
                  onClick={() => { setMostrarModalStatus(false); setMediaArchivo(null); setPreviewUrl(null); }}
                  className="p-4 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Type Selectors */}
              <div className="flex p-2 bg-gray-50 rounded-[2rem] gap-1">
                {[
                  { id: "texto", icon: Type, label: "Texto" },
                  { id: "imagen", icon: ImageIcon, label: "Imagen" },
                  { id: "video", icon: Film, label: "Video" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setTipoNuevoStatus(t.id); setMediaArchivo(null); setPreviewUrl(null); setVideoCortado(null); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${tipoNuevoStatus === t.id ? 'bg-white text-red-600 shadow-xl' : 'text-gray-400 hover:bg-white/50'}`}
                  >
                    <t.icon className={`w-4 h-4 ${tipoNuevoStatus === t.id ? 'text-red-600' : 'text-gray-300'}`} />
                    <span className="hidden xs:inline">{t.label}</span>
                  </button>
                ))}
              </div>

              {tipoNuevoStatus === "texto" ? (
                <div className="relative">
                  <textarea
                    className="w-full h-64 p-10 bg-gray-50 rounded-[2.5rem] border-transparent focus:bg-white focus:ring-[15px] focus:ring-red-50 outline-none text-2xl transition-all font-black placeholder:text-gray-200 resize-none shadow-inner"
                    placeholder="Escribe algo épico..."
                    value={nuevoStatus}
                    onChange={(e) => setNuevoStatus(e.target.value)}
                  />
                  <div className="absolute bottom-6 right-8 text-[10px] font-black text-gray-200 uppercase tracking-widest italic pt-2">
                    Solo letras
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <label className="block w-full h-80 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:bg-red-50 hover:border-red-200 transition-all group/upload relative overflow-hidden shadow-inner">
                    {previewUrl ? (
                      <div className="absolute inset-0 w-full h-full group/preview">
                        {tipoNuevoStatus === "imagen" ? (
                          <img src={previewUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <video src={previewUrl} className="w-full h-full object-cover" muted onLoadedMetadata={handleVideoLoaded} />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus className="w-12 h-12 text-white rotate-45" />
                          <span className="text-white font-black uppercase text-[10px] tracking-widest ml-2">Cambiar</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center group-hover:scale-110 transition-transform">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-all">
                          {tipoNuevoStatus === "imagen" ? <ImageIcon className="w-8 h-8 text-red-500" /> : <Film className="w-8 h-8 text-red-500" />}
                        </div>
                        <span className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em]">Cargar {tipoNuevoStatus}</span>
                      </div>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept={tipoNuevoStatus === "imagen" ? "image/*" : "video/*"}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setMediaArchivo(file);
                        setPreviewUrl(URL.createObjectURL(file));
                        setVideoCortado(null);
                        setVideoTiempoInicio(0);
                      }}
                    />
                  </label>

                  {/* Enhanced Trimmer (StoryEditor Style) */}
                  {tipoNuevoStatus === "video" && previewUrl && videoDuracion > 0 && (
                    <div className="bg-gray-900 rounded-[2.5rem] p-8 space-y-6 border border-white/5 shadow-2xl overflow-hidden relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-red-300 to-red-600 animate-pulse" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-600/20 rounded-xl">
                            <Film className="w-4 h-4 text-red-500" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Ajustar Video</span>
                        </div>
                        <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                          <span className="text-[10px] font-black text-red-400 capitalize">Max 20s</span>
                        </div>
                      </div>

                      {videoDuracion > 20 ? (
                        <div className="space-y-6">
                          <div className="relative h-14 bg-white/5 rounded-2xl border border-white/10 p-1 flex items-center">
                            <div className="absolute inset-y-1 bg-red-600/20 border-x-2 border-red-500 flex items-center justify-between shadow-[0_0_20px_rgba(239,68,68,0.2)]" style={{
                              left: `${(videoTiempoInicio / videoDuracion) * 100}%`,
                              width: `${(20 / videoDuracion) * 100}%`
                            }}>
                              <div className="w-1.5 h-6 bg-red-500 rounded-full -ml-0.5" />
                              <div className="w-1.5 h-6 bg-red-500 rounded-full -mr-0.5" />
                            </div>
                            <input
                              type="range"
                              min="0"
                              max={Math.max(0, videoDuracion - 20)}
                              step="0.5"
                              value={videoTiempoInicio}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setVideoTiempoInicio(val);
                                if (videoRef.current) videoRef.current.currentTime = val;
                              }}
                              className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-20"
                            />
                            {/* Background frames simulation */}
                            <div className="flex w-full h-full gap-1 opacity-20 pointer-events-none">
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="flex-1 bg-white/30 rounded-lg" />)}
                            </div>
                          </div>

                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                            <span className="text-gray-500 italic">Segmento: {Math.floor(videoTiempoInicio)}s - {Math.floor(videoTiempoInicio + 20)}s</span>
                            <span className="text-red-500">Auto-recorte activado</span>
                          </div>

                          <button
                            onClick={cortarVideo}
                            disabled={cortandoVideo || videoCortado}
                            className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${videoCortado ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-600 text-white shadow-xl shadow-red-900/40 hover:-translate-y-1'}`}
                          >
                            {cortandoVideo ? "Transformando..." : videoCortado ? <div className="flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Listo para publicar</div> : "Confirmar Selección"}
                          </button>
                        </div>
                      ) : (
                        <div className="p-6 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                            <Check className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-green-500 tracking-widest">Perfecto</p>
                            <p className="text-[9px] font-bold text-green-500/60 uppercase">Dura {videoDuracion.toFixed(1)}s (Dentro del límite)</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-10 bg-gray-50 flex gap-4 border-t border-gray-100">
              <button
                onClick={handleCrearStatus}
                disabled={!nuevoStatus.trim() && !mediaArchivo && !videoCortado && (tipoNuevoStatus !== 'video' || videoDuracion <= 20)}
                className="flex-1 py-6 bg-gradient-to-r from-red-600 to-red-700 text-white font-black rounded-[2rem] shadow-2xl shadow-red-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 uppercase text-[10px] tracking-[0.4em]"
              >
                Publicar Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Viewer Modal */}
      {statusSeleccionado && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl transition-all p-0 sm:p-4 md:p-12"
          onClick={() => { setStatusSeleccionado(null); setVistasStatus([]); }}
        >
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-[120] bg-white/10 p-4 rounded-full">
            <X className="w-8 h-8" />
          </button>
          {statusSeleccionado.usuario?._id === user?._id && (
            <button
              onClick={(e) => { e.stopPropagation(); eliminarStatus(statusSeleccionado._id); }}
              className="absolute top-8 left-8 text-white/50 hover:text-red-500 transition-colors z-[120] bg-white/10 p-4 rounded-full"
            >
              <Trash2 className="w-8 h-8" />
            </button>
          )}

          <div className={`relative w-full max-w-lg h-full sm:h-[90vh] sm:rounded-[4rem] overflow-hidden shadow-2xl flex flex-col ${statusSeleccionado.colorFondo || 'bg-red-600'} transition-all`}>
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-2 p-6 flex gap-1 z-30">
              <div className="flex-1 h-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white animate-progress"></div>
              </div>
            </div>

            {/* Status Header */}
            <div className="p-10 flex items-center gap-4 relative z-20 pt-12">
              <img
                src={statusSeleccionado.usuario?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                alt=""
                className="w-14 h-14 rounded-2xl border-2 border-white object-cover shadow-lg"
              />
              <div>
                <h5 className="text-white font-black text-xl tracking-tight leading-none mb-1">{statusSeleccionado.usuario?.nombre}</h5>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">{new Date(statusSeleccionado.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Status Content */}
            <div className="flex-1 flex items-center justify-center p-12 text-center relative z-10">
              {statusSeleccionado.tipo === "texto" ? (
                <p className="text-white text-4xl font-black leading-tight tracking-tighter drop-shadow-2xl">
                  {statusSeleccionado.contenido}
                </p>
              ) : statusSeleccionado.tipo === "imagen" ? (
                <img src={statusSeleccionado.mediaUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
              ) : (
                <video src={statusSeleccionado.mediaUrl} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop />
              )}
              {statusSeleccionado.contenido && statusSeleccionado.tipo !== "texto" && (
                <div className="absolute bottom-24 left-0 right-0 p-8 bg-black/20 backdrop-blur-sm">
                  <p className="text-white text-lg font-bold drop-shadow-md">{statusSeleccionado.contenido}</p>
                </div>
              )}
            </div>

            {/* Viewers Section (Only for owner) */}
            {statusSeleccionado.usuario?._id === user?._id && (
              <div className="bg-white/10 backdrop-blur-3xl p-8 border-t border-white/10" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-white/50" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{vistasStatus.length} Vistos</span>
                  </div>
                </div>
                <div className="flex -space-x-3 overflow-hidden h-10">
                  {vistasStatus.map(v => (
                    <img
                      key={v?._id}
                      title={v.usuario?.nombre}
                      alt=""
                      src={v.usuario?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                      className="inline-block h-10 w-10 rounded-full ring-2 ring-white/10 object-cover bg-gray-600"
                    />
                  ))}
                  {vistasStatus.length > 5 && (
                    <div className="flex items-center justify-center h-10 w-10 rounded-full ring-2 ring-white/10 bg-white/10 text-[10px] text-white font-black">
                      +{vistasStatus.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer decoration if not owner */}
            {statusSeleccionado.usuario?._id !== user?._id && (
              <div className="p-10 text-center text-white/20 mt-auto">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-4">Pulsa para cerrar</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


