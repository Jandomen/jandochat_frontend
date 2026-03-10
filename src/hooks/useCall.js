import { useState, useEffect, useCallback, useRef } from "react";
import callSocket from "../socket/socketCall";
import { ringtonePlayer } from "../utils/ringtone";
import useAuth from "../hooks/useAuth";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export function useCall() {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callStatus, setCallStatus] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const initialized = useRef(false);

  const cleanupCall = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    remoteStreamRef.current = null;
    setActiveCall(null);
    setCallStatus(null);
    setIsConnecting(false);
    setError(null);
    ringtonePlayer.stop();
  }, []);

  const initializeMedia = useCallback(async (callType) => {
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
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("Error al obtener medios:", err);
      setError("No se pudo acceder a la cámara o micrófono");
      throw err;
    }
  }, []);

  const createPeerConnection = useCallback((stream, remoteUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      setCallStatus("connected");
      setIsConnecting(false);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        callSocket.sendIceCandidate(remoteUserId, event.candidate, user._id);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        setError("Conexión perdida");
        cleanupCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [user._id, cleanupCall]);

  useEffect(() => {
    if (!user?._id || initialized.current) return;
    
    initialized.current = true;
    ringtonePlayer.loadSavedRingtone();
    
    callSocket.connect(user._id);

    callSocket.on("call:incoming", (call) => {
      ringtonePlayer.play();
      setIncomingCall(call);
      setCallStatus("incoming");
    });

    callSocket.on("call:busy", (data) => {
      ringtonePlayer.stop();
      setError("El usuario está ocupado");
      setCallStatus("busy");
      cleanupCall();
    });

    callSocket.on("call:accept", async (data) => {
      ringtonePlayer.stop();
      setCallStatus("accepted");
      setIsConnecting(true);
    });

    callSocket.on("call:reject", (data) => {
      ringtonePlayer.stop();
      setCallStatus("rejected");
      cleanupCall();
    });

    callSocket.on("call:end", (data) => {
      cleanupCall();
    });

    callSocket.on("webrtc:offer", async ({ offer, callerId }) => {
      try {
        if (!localStreamRef.current) {
          await initializeMedia(activeCall?.callType || "video");
        }
        
        if (!peerConnectionRef.current) {
          createPeerConnection(localStreamRef.current, callerId);
        }

        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        callSocket.sendAnswer(callerId, answer, user._id);
      } catch (err) {
        console.error("Error manejando offer:", err);
      }
    });

    callSocket.on("webrtc:answer", async ({ answer, callerId }) => {
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("Error manejando answer:", err);
      }
    });

    callSocket.on("webrtc:ice-candidate", async ({ candidate, callerId }) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    });

    return () => {
      initialized.current = false;
      cleanupCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const startCall = useCallback(async (to, callType = "video") => {
    setError(null);
    setIsConnecting(true);
    
    try {
      const stream = await initializeMedia(callType);
      const pc = createPeerConnection(stream, to);
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const caller = {
        id: user._id,
        nombre: user.nombre,
        fotoPerfil: user.fotoPerfil
      };

      setActiveCall({
        to,
        caller,
        callType,
        status: "calling"
      });

      callSocket.startCall(to, caller);

    } catch (err) {
      console.error("Error iniciando llamada:", err);
      setError("No se pudo iniciar la llamada");
      setIsConnecting(false);
    }
  }, [user, initializeMedia, createPeerConnection]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    
    setError(null);
    setIsConnecting(true);
    setCallStatus("connecting");
    
    try {
      const callerId = incomingCall.caller.id;
      const callType = incomingCall.caller.callType || "video";
      
      const stream = await initializeMedia(callType);
      createPeerConnection(stream, callerId);

      callSocket.acceptCall(incomingCall.to, callerId);

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      callSocket.sendOffer(callerId, offer, user._id);

      setActiveCall({
        to: callerId,
        caller: incomingCall.caller,
        callType,
        status: "connecting"
      });
      
      setIncomingCall(null);
      ringtonePlayer.stop();
      
    } catch (err) {
      console.error("Error aceptando llamada:", err);
      setError("No se pudo aceptar la llamada");
      setIsConnecting(false);
    }
  }, [incomingCall, user, initializeMedia, createPeerConnection]);

  const rejectCall = useCallback(() => {
    if (!incomingCall) return;
    
    callSocket.rejectCall(incomingCall.to, incomingCall.caller.id);
    ringtonePlayer.stop();
    setIncomingCall(null);
    setCallStatus(null);
  }, [incomingCall]);

  const endCall = useCallback(() => {
    if (!activeCall) return;
    
    const otherUserId = activeCall.to || activeCall.caller?.id;
    callSocket.endCall(otherUserId, user._id);
    cleanupCall();
  }, [activeCall, user._id, cleanupCall]);

  return {
    incomingCall,
    activeCall,
    callStatus,
    isConnecting,
    error,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
    peerConnection: peerConnectionRef.current,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    cleanupCall,
    setError,
  };
}

export default useCall;
