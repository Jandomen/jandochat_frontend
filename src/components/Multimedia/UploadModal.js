import React from "react";
import { X } from "lucide-react";
import MultimediaUpload from "./MultimediaUpload";

export default function UploadModal({ isOpen, onClose, onComplete }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-red-950/40 backdrop-blur-md animate-in fade-in duration-500">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide animate-in zoom-in-95 duration-300">
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-3 bg-red-600 text-white rounded-2xl shadow-xl z-[110] hover:scale-110 active:scale-95 transition-all"
                >
                    <X className="w-6 h-6" />
                </button>
                
                <MultimediaUpload onComplete={() => {
                    if (onComplete) onComplete();
                    onClose();
                }} />
            </div>
        </div>
    );
}
