import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function ImageViewer({ 
  media, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev 
}) {
  const item = media[currentIndex];
  const isVideo = item?.tipo === "video" || item?.url?.match(/\.(mp4|webm|ogg)$/i);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") onPrev();
    if (e.key === "ArrowRight" || e.key === "ArrowDown") onNext();
  }, [onClose, onPrev, onNext]);

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

  const handlePrevClick = (e) => {
    e.stopPropagation();
    onPrev();
  };

  const handleNextClick = (e) => {
    e.stopPropagation();
    onNext();
  };

  const viewer = (
    <div 
      className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button 
        className="absolute top-4 right-4 z-[1000] text-white/70 hover:text-white bg-black/50 hover:bg-black/70 p-2 rounded-full transition-all"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Counter */}
      {media.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] text-white text-sm font-medium bg-black/50 px-4 py-1.5 rounded-full">
          {currentIndex + 1} / {media.length}
        </div>
      )}

      {/* Previous button */}
      {media.length > 1 && (
        <button 
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[1000] text-white/70 hover:text-white bg-black/50 hover:bg-black/70 p-2 sm:p-3 rounded-full transition-all"
          onClick={handlePrevClick}
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      )}

      {/* Media container */}
      <div 
        className="max-w-[90vw] max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video 
            src={item.url} 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            controls
            autoPlay
          />
        ) : (
          <img 
            src={item.url} 
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        )}
      </div>

      {/* Next button */}
      {media.length > 1 && (
        <button 
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[1000] text-white/70 hover:text-white bg-black/50 hover:bg-black/70 p-2 sm:p-3 rounded-full transition-all"
          onClick={handleNextClick}
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      )}

      {/* Dots indicator */}
      {media.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
          {media.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-200 ${
                idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
              }`} 
            />
          ))}
        </div>
      )}
    </div>
  );

  return createPortal(viewer, document.body);
}
