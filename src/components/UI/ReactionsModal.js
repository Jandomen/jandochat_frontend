import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EMOJIS = {
    brutal: "🔥",
    acuerdo: "💯",
    blown: "🤯",
    mirando: "👀",
    inteligente: "🧠",
    apoyo: "🚀",
    colaboro: "🤝",
    respeto: "🫡"
};

const REACTION_LABELS = {
    brutal: "Está brutal / tendencia",
    acuerdo: "Totalmente de acuerdo",
    blown: "Mind blown",
    inteligente: "Inteligente",
    apoyo: "Apoyo este proyecto",
    colaboro: "Colaboro / me interesa participar",
    respeto: "Respeto",
    mirando: "Estoy mirando / interesante"
};

export default function ReactionsModal({ 
  reactions, 
  onClose 
}) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleUserClick = (userId) => {
    navigate(`/usuarios/${userId}`);
    onClose();
  };

  const modal = (
    <div 
      className="fixed inset-0 z-[999] bg-black/60 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-600 to-red-500 shrink-0">
          <h3 className="font-bold text-white text-lg">Reacciones</h3>
          <button 
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Reactions list */}
        <div className="overflow-y-auto flex-1 p-2">
          {reactions && reactions.length > 0 ? (
            reactions.map((reaccion, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                onClick={() => handleUserClick(reaccion.usuario?._id)}
              >
                <img 
                  src={reaccion.usuario?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"} 
                  className="w-10 h-10 rounded-full object-cover" 
                  alt="" 
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{reaccion.usuario?.nombre}</p>
                  <p className="text-gray-500 text-xs">{REACTION_LABELS[reaccion.tipo]}</p>
                </div>
                <span className="text-xl">{EMOJIS[reaccion.tipo]}</span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8"></p>
          )}
No hay reacciones        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
