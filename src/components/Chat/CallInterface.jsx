import React, { useEffect, useRef, useState } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, User } from "lucide-react";

export default function CallInterface({
  localStream,
  remoteStream,
  callStatus,
  callType,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  isMuted,
  isVideoOff,
  callerName,
  error
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  // Timer logic
  useEffect(() => {
    if (callStatus === "connected") {
      setTimer(0);
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [m, s].map(v => v.toString().padStart(2, "0"));
    if (h > 0) parts.unshift(h.toString().padStart(2, "0"));
    return parts.join(":");
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, callType]);

  const statusText = {
    calling: "Llamando...",
    connecting: "Estableciendo conexión...",
    connected: "Llamada activa",
    incoming: "Llamada entrante...",
    busy: "Usuario ocupado",
    rejected: "Llamada rechazada"
  };

  const isVideo = callType === "video";

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center animate-in fade-in duration-500"
      onClick={() => setShowControls(!showControls)}
    >
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

      {/* Audio Remote (Backdrop for voice calls or background for video) */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Video remoto (pantalla completa) o pantalla de voz */}
      {isVideo ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-black"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-900">
          <div className="relative">
            <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-white/5 border-2 border-green-500/50 flex items-center justify-center shadow-2xl relative z-10 animate-pulse">
              <User size={80} className="text-green-500/70" />
            </div>
            {/* Animación de ondas */}
            <div className="absolute inset-0 rounded-full border border-green-500/30 animate-ping"></div>
            <div className="absolute inset-0 rounded-full border border-green-500/20 animate-ping delay-75"></div>
          </div>

          <div className="mt-8 text-center space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{callerName || "Llamada de Voz"}</h2>
            <div className="flex items-center justify-center gap-2 text-green-400 font-bold tracking-widest text-xs">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></span>
              {callStatus === "connected" ? formatTime(timer) : statusText[callStatus]}
            </div>
          </div>
        </div>
      )}

      {/* Timer flotante para Video */}
      {isVideo && callStatus === "connected" && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 px-6 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white font-mono font-bold tracking-widest">{formatTime(timer)}</span>
        </div>
      )}

      {/* Video local (espejo pequeño) */}
      {isVideo && localStream && (
        <div className="absolute bottom-32 right-6 group transition-all">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-32 h-44 sm:w-40 sm:h-56 rounded-3xl object-cover border-2 border-white/20 shadow-2xl bg-slate-900 -scale-x-100 transition-transform group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded-lg text-[8px] font-bold text-white uppercase tracking-widest">Tú</div>
        </div>
      )}

      {/* Indicador de estado (solo no conectados y no video) */}
      {callStatus !== "connected" && isVideo && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl px-8 py-3 rounded-2xl border border-white/10 text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl">
          {statusText[callStatus] || "Conectando..."}
        </div>
      )}

      {/* Controles Flotantes */}
      <div className={`
        absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 p-4 px-8 bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-2xl transition-all duration-500
        ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}
      `}>
        {/* Mute */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
          className={`p-5 rounded-full transition-all active:scale-95 ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
        </button>

        {/* Video Toggle */}
        {isVideo && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVideo(); }}
            className={`p-5 rounded-full transition-all active:scale-95 ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {isVideoOff ? <VideoOff size={28} /> : <Video size={28} />}
          </button>
        )}

        {/* End Call */}
        <button
          onClick={(e) => { e.stopPropagation(); onEndCall(); }}
          className="p-5 bg-red-600 text-white rounded-full shadow-xl shadow-red-500/40 hover:bg-red-700 active:scale-90 transition-all"
        >
          <PhoneOff size={32} className="rotate-[135deg]" />
        </button>
      </div>

      {/* Errores */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-[10000]">
          <div className="bg-slate-900 p-10 rounded-[3rem] border border-red-500/30 text-center space-y-4 max-w-sm mx-4 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <PhoneOff size={32} />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Llamada Finalizada</h3>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-loose">{error}</p>
            <button
              onClick={onEndCall}
              className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all uppercase tracking-widest text-[10px]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
