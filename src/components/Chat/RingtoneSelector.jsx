import React, { useState, useEffect } from "react";
import { ringtonePlayer, RINGTONES } from "../../utils/ringtone";
import { Music, Check } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function RingtoneSelector({ onClose }) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(ringtonePlayer.loadSavedRingtone());
  const [previewing, setPreviewing] = useState(null);

  const handleSelect = (key) => {
    setSelected(key);
    ringtonePlayer.setRingtone(key);
    
    if (previewing) {
      ringtonePlayer.stop();
    }
    setPreviewing(key);
    ringtonePlayer.play();
    
    setTimeout(() => {
      ringtonePlayer.stop();
      setPreviewing(null);
    }, 3000);
  };

  const handleStop = () => {
    ringtonePlayer.stop();
    setPreviewing(null);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      background: "rgba(0,0,0,0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "white",
        borderRadius: 16,
        padding: 24,
        width: "90%",
        maxWidth: 400
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: "bold", display: "flex", alignItems: "center", gap: 8 }}>
            <Music size={20} />
            {t('ringtone_title')}
          </h2>
          <button onClick={onClose} style={{ padding: 8, background: "transparent", border: "none", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(RINGTONES).map(([key, ringtone]) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: selected === key ? "#fee2e2" : "#f3f4f6",
                border: "none",
                borderRadius: 12,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <span style={{ fontWeight: 500 }}>{ringtone.name}</span>
              {selected === key && (
                <Check size={20} color="#dc2626" />
              )}
            </button>
          ))}
        </div>

        {previewing && (
          <button
            onClick={handleStop}
            style={{
              marginTop: 16,
              width: "100%",
              padding: 12,
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            {t('stop_preview')}
          </button>
        )}
      </div>
    </div>
  );
}
