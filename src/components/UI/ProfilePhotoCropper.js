import React, { useState, useRef, useEffect } from "react";
import { X, Check, ZoomIn, ZoomOut, Move } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const ProfilePhotoCropper = ({ file, onCrop, onClose }) => {
  const { t } = useLanguage();
  const [image, setImage] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target.result);
      reader.readAsDataURL(file);
    }
  }, [file]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;

    // Set fixed high-res square size
    canvas.width = 800;
    canvas.height = 800;

    // Calculate crop based on current preview state
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Draw the image on canvas according to user adjustments
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 800, 800);

    const drawWidth = img.naturalWidth * scale * (800 / rect.width);
    const drawHeight = img.naturalHeight * scale * (800 / rect.height);
    const drawX = (position.x * (800 / rect.width)) + (800 / 2) - (drawWidth / 2);
    const drawY = (position.y * (800 / rect.width)) + (800 / 2) - (drawHeight / 2);

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    canvas.toBlob((blob) => {
      onCrop(blob);
    }, "image/jpeg", 0.95);
  };

  if (!image) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-[3rem] p-6 sm:p-10 shadow-[0_0_50px_rgba(255,255,255,0.1)] border border-white/20 relative overflow-hidden">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight uppercase">{t('photo_lab_title')}</h3>
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1">{t('photo_lab_subtitle')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div
          ref={containerRef}
          className="relative w-72 h-72 sm:w-96 sm:h-96 mx-auto bg-gray-900 rounded-[2.5rem] overflow-hidden cursor-move border-4 border-white shadow-2xl group"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {/* Circular Frame Overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none border-[40px] sm:border-[60px] border-black/40">
            <div className="w-full h-full rounded-full border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
          </div>

          <img
            ref={imgRef}
            src={image}
            alt=""
            className="absolute max-w-none select-none transition-opacity duration-300 pointer-events-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              left: "50%",
              top: "50%",
              marginLeft: `-${imgRef.current ? imgRef.current.width / 2 : 0}px`,
              marginTop: `-${imgRef.current ? imgRef.current.height / 2 : 0}px`,
            }}
            onLoad={(e) => {
              // Auto-scale to fill the square
              const img = e.target;
              const minScale = Math.max(300 / img.naturalWidth, 300 / img.naturalHeight);
              setScale(minScale);
            }}
          />

          {/* Guide Helper */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            <Move className="w-3 h-3" /> {t('drag_to_center')}
          </div>
        </div>

        <div className="mt-10 space-y-6">
          <div className="flex items-center gap-6">
            <ZoomOut className="w-5 h-5 text-gray-400" />
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.01"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-red-600 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
            />
            <ZoomIn className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-gray-50 text-gray-400 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-gray-100 transition-all border border-gray-100"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleCrop}
              className="flex-2 flex items-center justify-center gap-2 px-12 py-4 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 hover:scale-[1.02] transition-all"
            >
              <Check className="w-4 h-4" /> {t('apply_perfection')}
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default ProfilePhotoCropper;
