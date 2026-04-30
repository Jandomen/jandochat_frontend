import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Settings as SettingsIcon } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function SettingsModal({ isOpen, onClose, children }) {
  const { t } = useLanguage();

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const modal = (
    <div 
      className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="animate-in fade-in zoom-in-95 duration-200 w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-black text-gray-900">{t('settings_label')}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
