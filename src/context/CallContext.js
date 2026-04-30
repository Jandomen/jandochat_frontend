import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import callSocket from "../socket/socketCall";
import { ringtonePlayer } from "../utils/ringtone";
import useAuth from "../hooks/useAuth";
import IncomingCallModal from "../components/Chat/IncomingCallModal";
import CallInterface from "../components/Chat/CallInterface";

const CallContext = createContext();

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
    ],
};

export const CallProvider = ({ children }) => {
    const { user } = useAuth();
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const [callStatus, setCallStatus] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const peerConnectionRef = useRef(null);

    const cleanupCall = useCallback(() => {

        if (peerConnectionRef.current) {
            console.log("📞 [CallContext] Cerrando PeerConnection");
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        setLocalStream(prev => {
            if (prev) {
                prev.getTracks().forEach(track => {
                    console.log(`📞 [CallContext] Deteniendo track local: ${track.kind}`);
                    track.stop();
                });
            }
            return null;
        });

        setRemoteStream(null);
        setActiveCall(null);
        setCallStatus(null);
        setIsConnecting(false);
        setError(null);
        setIsMuted(false);
        setIsVideoOff(false);
        ringtonePlayer.stop();
    }, []);

    const initializeMedia = useCallback(async (callType) => {
        console.log(`📞 [CallContext] Inicializando medios tipo: ${callType}`);
        try {
            const constraints = {
                audio: true,
                video: callType === "video" ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                } : false
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("📞 [CallContext] Medios obtenidos con éxito");
            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.error("📞 [CallContext] Error al obtener medios:", err);
            setError("No se pudo acceder a la cámara o micrófono");
            throw err;
        }
    }, []);

    const createPeerConnection = useCallback((stream, remoteUserId) => {
        console.log(`📞 [CallContext] Creando PeerConnection para usuario: ${remoteUserId}`);
        if (peerConnectionRef.current) {
            console.log("📞 [CallContext] Cerrando conexión previa");
            peerConnectionRef.current.close();
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);

        stream.getTracks().forEach(track => {
            console.log(`📞 [CallContext] Añadiendo track a PC: ${track.kind}`);
            pc.addTrack(track, stream);
        });

        pc.ontrack = (event) => {
            console.log("📞 [CallContext] Track remoto RECIBIDO");
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            }
            setCallStatus("connected");
            setIsConnecting(false);
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("📞 [CallContext] Enviando ICE Candidate al backend");
                callSocket.sendIceCandidate(remoteUserId, event.candidate, user._id);
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`📞 [CallContext] ICE Connection State: ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
                setError("Conexión perdida");
                setTimeout(cleanupCall, 2000);
            }
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [user?._id, cleanupCall]);

    useEffect(() => {
        if (!user?._id) return;

        ringtonePlayer.loadSavedRingtone();
        callSocket.connect(user._id);

        const onIncoming = (call) => {
            console.log("📞 [CallContext] Evento RECIBIDO: call:incoming", call);
            setActiveCall(prev => {
                if (prev) {
                    console.log("📞 [CallContext] Ya hay una llamada activa. Rechazando entrante (Busy)");
                    callSocket.rejectCall(call.to, call.caller.id);
                    return prev;
                }
                ringtonePlayer.play();
                setIncomingCall(call);
                setCallStatus("incoming");
                return null;
            });
        };

        const onBusy = () => {
            console.log("📞 [CallContext] Evento RECIBIDO: call:busy");
            ringtonePlayer.stop();
            setError("El usuario está ocupado");
            setCallStatus("busy");
            setTimeout(cleanupCall, 3000);
        };

        const onAccept = () => {
            console.log("📞 [CallContext] Evento RECIBIDO: call:accept");
            ringtonePlayer.stop();
            setCallStatus("accepted");
        };

        const onReject = () => {
            console.log("📞 [CallContext] Evento RECIBIDO: call:reject");
            ringtonePlayer.stop();
            setCallStatus("rejected");
            setError("Llamada rechazada");
            setTimeout(cleanupCall, 3000);
        };

        const onEnd = () => {
            console.log("📞 [CallContext] Evento RECIBIDO: call:end");
            cleanupCall();
        };

        const onOffer = async ({ offer, callerId }) => {
            console.log(`📞 [CallContext] Evento RECIBIDO: webrtc:offer de ${callerId}`);
            try {
                if (!peerConnectionRef.current) {
                    console.warn("📞 [CallContext] No hay PeerConnection para procesar oferta");
                    return;
                }
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
                console.log("📞 [CallContext] RemoteDescription (Offer) establecida. Creando Answer...");
                const answer = await peerConnectionRef.current.createAnswer();
                await peerConnectionRef.current.setLocalDescription(answer);
                console.log("📞 [CallContext] Enviando Answer al backend");
                callSocket.sendAnswer(callerId, answer, user._id);
            } catch (err) {
                console.error("📞 [CallContext] Error manejando offer:", err);
            }
        };

        const onAnswer = async ({ answer }) => {
            console.log("📞 [CallContext] Evento RECIBIDO: webrtc:answer");
            try {
                if (peerConnectionRef.current) {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                    console.log("📞 [CallContext] RemoteDescription (Answer) establecida");
                }
            } catch (err) {
                console.error("📞 [CallContext] Error manejando answer:", err);
            }
        };

        const onIceCandidate = async ({ candidate }) => {
            console.log("📞 [CallContext] Evento RECIBIDO: webrtc:ice-candidate");
            try {
                if (peerConnectionRef.current) {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log("📞 [CallContext] ICE Candidate añadido con éxito");
                }
            } catch (err) {
                console.error("📞 [CallContext] Error añadiendo ICE candidate:", err);
            }
        };

        callSocket.on("call:incoming", onIncoming);
        callSocket.on("call:busy", onBusy);
        callSocket.on("call:accept", onAccept);
        callSocket.on("call:reject", onReject);
        callSocket.on("call:end", onEnd);
        callSocket.on("webrtc:offer", onOffer);
        callSocket.on("webrtc:answer", onAnswer);
        callSocket.on("webrtc:ice-candidate", onIceCandidate);

        return () => {
            callSocket.off("call:incoming", onIncoming);
            callSocket.off("call:busy", onBusy);
            callSocket.off("call:accept", onAccept);
            callSocket.off("call:reject", onReject);
            callSocket.off("call:end", onEnd);
            callSocket.off("webrtc:offer", onOffer);
            callSocket.off("webrtc:answer", onAnswer);
            callSocket.off("webrtc:ice-candidate", onIceCandidate);
            cleanupCall();
        };
    }, [user?._id, cleanupCall]);

    const startCall = useCallback(async (to, callType = "video", destinatario) => {
        console.log(`📞 [CallContext] INICIANDO llamada hacia: ${to} (Tipo: ${callType})`);
        setError(null);
        setIsConnecting(true);

        try {
            const stream = await initializeMedia(callType);
            const pc = createPeerConnection(stream, to);

            console.log("📞 [CallContext] Creando Oferta...");
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const caller = {
                id: user._id,
                nombre: user.nombre,
                fotoPerfil: user.fotoPerfil,
                callType
            };

            setActiveCall({
                to,
                caller: destinatario || { nombre: "Usuario" },
                callType,
                status: "calling",
                isInitiator: true
            });

            setCallStatus("calling");
            console.log("📞 [CallContext] Enviando call:start al backend");
            callSocket.startCall(to, caller);

        } catch (err) {
            console.error("📞 [CallContext] Error iniciando llamada:", err);
            setError("No se pudo iniciar la llamada");
            setIsConnecting(false);
        }
    }, [user, initializeMedia, createPeerConnection]);

    const acceptCall = useCallback(async () => {
        if (!incomingCall) return;
        console.log(`📞 [CallContext] ACEPTANDO llamada de: ${incomingCall.caller.id}`);

        setError(null);
        setIsConnecting(true);
        setCallStatus("connecting");

        try {
            const callerId = incomingCall.caller.id;
            const callType = incomingCall.caller.callType || "video";

            const stream = await initializeMedia(callType);
            createPeerConnection(stream, callerId);

            console.log("📞 [CallContext] Enviando call:accept al backend");
            callSocket.acceptCall(incomingCall.to, callerId);

            console.log("📞 [CallContext] Creando Oferta inicial desde el receptor...");
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);
            callSocket.sendOffer(callerId, offer, user._id);

            setActiveCall({
                to: callerId,
                caller: incomingCall.caller,
                callType,
                status: "connecting",
                isInitiator: false
            });

            setIncomingCall(null);
            ringtonePlayer.stop();

        } catch (err) {
            console.error("📞 [CallContext] Error aceptando llamada:", err);
            setError("No se pudo aceptar la llamada");
            setIsConnecting(false);
        }
    }, [incomingCall, user, initializeMedia, createPeerConnection]);

    const rejectCall = useCallback(() => {
        if (!incomingCall) return;
        console.log(`📞 [CallContext] RECHAZANDO llamada de: ${incomingCall.caller.id}`);
        callSocket.rejectCall(incomingCall.to, incomingCall.caller.id);
        ringtonePlayer.stop();
        setIncomingCall(null);
        setCallStatus(null);
    }, [incomingCall]);

    const endCall = useCallback(() => {
        const targetUserId = activeCall?.to || incomingCall?.caller?.id;
        console.log(`📞 [CallContext] TERMINANDO llamada con: ${targetUserId}`);
        if (targetUserId) {
            callSocket.endCall(targetUserId, user._id);
        }
        cleanupCall();
    }, [activeCall, incomingCall, user?._id, cleanupCall]);

    const toggleMute = () => {
        if (localStream) {
            const newState = !isMuted;
            localStream.getAudioTracks().forEach(track => track.enabled = !newState);
            setIsMuted(newState);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const newState = !isVideoOff;
            localStream.getVideoTracks().forEach(track => track.enabled = !newState);
            setIsVideoOff(newState);
        }
    };

    return (
        <CallContext.Provider value={{
            incomingCall,
            activeCall,
            callStatus,
            isConnecting,
            error,
            localStream,
            remoteStream,
            startCall,
            acceptCall,
            rejectCall,
            endCall,
            toggleMute,
            toggleVideo,
            isMuted,
            isVideoOff
        }}>
            {children}

            {incomingCall && (
                <IncomingCallModal
                    call={incomingCall}
                    onAccept={acceptCall}
                    onReject={rejectCall}
                />
            )}

            {activeCall && (
                <CallInterface
                    localStream={localStream}
                    remoteStream={remoteStream}
                    callStatus={callStatus}
                    callType={activeCall.callType}
                    callerName={activeCall.caller?.nombre || "Usuario"}
                    error={error}
                    onEndCall={endCall}
                    onToggleMute={toggleMute}
                    onToggleVideo={toggleVideo}
                    isMuted={isMuted}
                    isVideoOff={isVideoOff}
                />
            )}
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error("useCall debe usarse dentro de un CallProvider");
    }
    return context;
};
