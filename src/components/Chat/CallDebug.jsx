import React, { useState, useEffect } from "react";
import callSocket from "../socket/socketCall";
import { Phone, Video } from "lucide-react";

export default function CallDebug({ userId, remoteUserId }) {
  const [status, setStatus] = useState("desconectado");
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    if (!userId) return;

    console.log("🔧 CallDebug: Conectando socket...");
    const socket = callSocket.connect(userId);
    setStatus("conectando");

    callSocket.on("connect", () => {
      console.log("🔧 CallDebug: Conectado");
      setStatus("conectado");
    });

    callSocket.on("call:incoming", (call) => {
      console.log("🔧 CallDebug: Llamada entrante:", call);
      setLastEvent({ type: "incoming", data: call });
    });

    callSocket.on("call:accepted", (data) => {
      console.log("🔧 CallDebug: Aceptada:", data);
      setLastEvent({ type: "accepted", data });
    });

    callSocket.on("call:ended", (data) => {
      console.log("🔧 CallDebug: Terminada:", data);
      setLastEvent({ type: "ended", data });
    });

    return () => {
      setStatus("desconectado");
    };
  }, [userId]);

  const makeCall = (type) => {
    console.log("🔧 CallDebug: Haciendo llamada a", remoteUserId, "tipo:", type);
    callSocket.callUser(remoteUserId, userId, type);
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 10,
      right: 10,
      background: "rgba(0,0,0,0.8)",
      color: "white",
      padding: 10,
      borderRadius: 8,
      fontSize: 12,
      zIndex: 9999
    }}>
      <div>Status: <span style={{ color: status === "conectado" ? "green" : "red" }}>{status}</span></div>
      <div>Tu ID: {userId?.slice(0, 8)}...</div>
      <div>Destino: {remoteUserId?.slice(0, 8)}...</div>
      <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
        <button onClick={() => makeCall("voice")} style={{ padding: 5, background: "green" }}>
          <Phone size={16} />
        </button>
        <button onClick={() => makeCall("video")} style={{ padding: 5, background: "blue" }}>
          <Video size={16} />
        </button>
      </div>
      {lastEvent && (
        <div style={{ marginTop: 5, fontSize: 10 }}>
          Último: {lastEvent.type}
        </div>
      )}
    </div>
  );
}
