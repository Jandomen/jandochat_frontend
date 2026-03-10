import React from "react";
import { Phone, Video } from "lucide-react";

export default function CallButton({ onVoiceCall, onVideoCall, disabled, userId }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onVoiceCall?.(userId)}
        disabled={disabled}
        className="p-2 text-green-500 hover:bg-green-50 rounded-xl transition-all disabled:opacity-50"
        title="Llamada de voz"
      >
        <Phone className="w-5 h-5" />
      </button>
      <button
        onClick={() => onVideoCall?.(userId)}
        disabled={disabled}
        className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all disabled:opacity-50"
        title="Videollamada"
      >
        <Video className="w-5 h-5" />
      </button>
    </div>
  );
}
