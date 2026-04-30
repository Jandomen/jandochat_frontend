import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

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

export default function ReactionsModal({ 
  reactions, 
  onClose 
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const REACTION_LABELS = {
    brutal: t('reaction_brutal'),
    acuerdo: t('reaction_acuerdo'),
    blown: t('reaction_blown'),
    mirando: t('reaction_mirando'),
    inteligente: t('reaction_inteligente'),
    apoyo: t('reaction_apoyo'),
    colaboro: t('reaction_colaboro'),
    respeto: t('reaction_respeto')
  };

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
        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-600 to-red-500 shrink-0">
          <h3 className="font-black text-white text-xs uppercase tracking-widest">{t('reactions_label')}</h3>
          <button 
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reactions list */}
        <div className="overflow-y-auto flex-1 p-1">
          {reactions && reactions.length > 0 ? (
            reactions.map((reaccion, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors"
                onClick={() => handleUserClick(reaccion.usuario?._id)}
              >
                <img 
                  src={reaccion.usuario?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"} 
                  className="w-8 h-8 rounded-full object-cover shadow-sm" 
                  alt="" 
                />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-[10px] leading-tight truncate">{reaccion.usuario?.nombre}</p>
                  <p className="text-gray-400 text-[8px] font-bold uppercase tracking-tighter truncate">{REACTION_LABELS[reaccion.tipo]}</p>
                </div>
                <span className="text-base sm:text-lg">{EMOJIS[reaccion.tipo]}</span>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-6 text-[10px] uppercase font-black tracking-widest">{t('no_reactions')}</div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
