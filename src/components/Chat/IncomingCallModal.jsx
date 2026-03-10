import React, { useState, useEffect } from "react";
import { PhoneOff, Video, Phone, User } from "lucide-react";

export default function IncomingCallModal({ call, onAccept, onReject }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!call) return null;

  const { caller, callType } = call;
  const isVideo = callType === "video";

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.9)",
      animation: isVisible ? "fadeIn 0.3s ease" : "none"
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        borderRadius: 24,
        padding: 40,
        textAlign: "center",
        maxWidth: 320,
        width: "90%",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        animation: isVisible ? "scaleIn 0.3s ease" : "none"
      }}>
        <div style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          margin: "0 auto 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "3px solid #4ade80",
          animation: "pulse 2s infinite"
        }}>
          {caller?.fotoPerfil ? (
            <img 
              src={caller.fotoPerfil} 
              alt={caller.nombre}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover"
              }}
            />
          ) : (
            <User size={60} color="#4ade80" />
          )}
        </div>

        <h2 style={{
          color: "white",
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 8
        }}>
          {isVideo ? "Videollamada" : "Llamada de voz"}
        </h2>

        <p style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: 16,
          marginBottom: 32
        }}>
          {caller?.nombre || "Usuario"} está llamándote
        </p>

        <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
          <button
            onClick={onReject}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#ef4444",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s"
            }}
          >
            <PhoneOff size={28} color="white" />
          </button>

          <button
            onClick={onAccept}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#4ade80",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s"
            }}
          >
            {isVideo ? (
              <Video size={28} color="white" />
            ) : (
              <Phone size={28} color="white" />
            )}
          </button>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
