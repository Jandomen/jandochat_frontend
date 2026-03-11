import React, { useEffect, useState } from "react";
import { Camera, Image, FileText, X } from "lucide-react";

const MediaPickerModal = ({ isOpen, onClose, onSelect, filter = ["camera", "gallery", "files"] }) => {
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
    } else {
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered && !isOpen) return null;

  const allOptions = [
    {
      id: "camera",
      label: "Cámara",
      icon: <Camera className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: "from-red-500 to-pink-600",
      shadow: "shadow-red-200",
      description: "Toma una foto"
    },
    {
      id: "gallery",
      label: "Galería",
      icon: <Image className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-200",
      description: "Fotos y videos"
    },
    {
      id: "files",
      label: "Archivos",
      icon: <FileText className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: "from-gray-600 to-gray-800",
      shadow: "shadow-gray-200",
      description: "Documentos PDF"
    }
  ];

  const options = allOptions.filter(opt => filter.includes(opt.id));

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${
        isOpen ? "bg-black/40 backdrop-blur-sm" : "bg-transparent pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-[340px] sm:max-w-md bg-white/90 backdrop-blur-2xl rounded-t-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl transition-all duration-500 transform border border-white/20 ${
          isOpen ? "translate-y-0 opacity-100" : "translate-y-full sm:translate-y-10 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle for mobile bottom sheet */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />
        
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase">Compartir</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onSelect(option.id);
                onClose();
              }}
              className="group flex items-center gap-4 p-4 sm:p-6 bg-white border border-gray-100 rounded-3xl hover:border-red-100 hover:bg-red-50/30 transition-all active:scale-[0.98] text-left relative overflow-hidden"
            >
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${option.color} flex items-center justify-center text-white shadow-lg ${option.shadow} group-hover:scale-110 transition-transform`}>
                {option.icon}
              </div>
              <div>
                <p className="font-black text-gray-900 text-sm sm:text-lg uppercase tracking-wider">{option.label}</p>
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">{option.description}</p>
              </div>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-200">
                  <X className="w-4 h-4 rotate-45" />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8">
          <button 
            onClick={onClose}
            className="w-full py-4 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-gray-400 hover:text-red-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaPickerModal;
