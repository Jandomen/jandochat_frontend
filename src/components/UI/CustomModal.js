import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, AlertCircle, HelpCircle } from "lucide-react";

const CustomModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = "alert",
    placeholder = "Escribe aquí...",
    defaultValue = "",
    confirmText = "Aceptar",
    cancelText = "Cancelar"
}) => {
    const [inputValue, setInputValue] = useState(defaultValue);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            const handleEsc = (e) => {
                if (e.key === "Escape") onClose();
            };
            document.addEventListener("keydown", handleEsc);
            return () => {
                document.body.style.overflow = "";
                document.removeEventListener("keydown", handleEsc);
            };
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) setInputValue(defaultValue);
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const modal = (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl shadow-red-900/20 border border-red-50 overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8 pb-0 flex justify-between items-start">
                    <div className="p-3 bg-red-50/50 rounded-2xl text-red-600">
                        {type === "prompt" ? <HelpCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 pt-6">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2 uppercase italic">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 font-medium">{message}</p>

                    {type === "prompt" && (
                        <div className="relative group">
                            <input
                                autoFocus
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={placeholder}
                                className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:bg-white focus:border-red-500/30 rounded-2xl outline-none transition-all font-black uppercase text-[10px] tracking-widest text-red-600 placeholder:text-gray-300 shadow-inner"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") onConfirm(inputValue);
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="p-8 pt-0 flex gap-4">
                    {(type === "confirm" || type === "prompt") && (
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-2xl bg-gray-50 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all border border-transparent"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={() => onConfirm(type === "prompt" ? inputValue : true)}
                        className="flex-1 px-6 py-4 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-[0.3em] hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        <span>{confirmText}</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
};

export default CustomModal;
