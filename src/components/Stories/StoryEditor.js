import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Type, Smile, Upload, Play, Send, Image, Film } from "lucide-react";
import { uploadMedia } from "../../api/posts";
import { crearStory } from "../../api/stories";
import { useToast } from "../../context/ToastContext";

const MAX_DURATION = 30;

const EMOJI_LIST = ["😀", "😂", "🥰", "😎", "🤩", "🔥", "❤️", "👑", "💪", "🎉", "🚀", "⭐", "💯", "🤯", "🫡", "✨", "💀", "🥳", "😤", "🤝"];

export default function StoryEditor({ onClose, onPublished }) {
    const { success, error: showError } = useToast();
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [mediaType, setMediaType] = useState(null); // "imagen" | "video"
    const [videoDuration, setVideoDuration] = useState(0);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(MAX_DURATION);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [overlayText, setOverlayText] = useState("");
    const [showTextInput, setShowTextInput] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState("");
    const [uploading, setUploading] = useState(false);
    const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
    const [isDraggingText, setIsDraggingText] = useState(false);
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);
    const previewContainerRef = useRef(null);
    const animFrameRef = useRef(null);

    const handleFileSelect = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        const isVideo = selected.type.startsWith("video/");
        const isImage = selected.type.startsWith("image/");

        if (!isVideo && !isImage) {
            showError("Solo se permiten imágenes y videos");
            return;
        }

        setFile(selected);
        setMediaType(isVideo ? "video" : "imagen");
        setPreviewUrl(URL.createObjectURL(selected));
        setOverlayText("");
        setSelectedEmoji("");
        setTrimStart(0);
        setTrimEnd(MAX_DURATION);
    };

    const handleVideoLoaded = () => {
        if (videoRef.current) {
            const dur = videoRef.current.duration;
            setVideoDuration(dur);
            setTrimEnd(Math.min(dur, MAX_DURATION));
            videoRef.current.currentTime = 0;
        }
    };

    const updateTimeLoop = useCallback(() => {
        if (videoRef.current && !videoRef.current.paused) {
            const ct = videoRef.current.currentTime;
            setCurrentTime(ct);
            if (ct >= trimEnd) {
                videoRef.current.pause();
                videoRef.current.currentTime = trimStart;
                setIsPlaying(false);
            }
            animFrameRef.current = requestAnimationFrame(updateTimeLoop);
        }
    }, [trimEnd, trimStart]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            cancelAnimationFrame(animFrameRef.current);
            setIsPlaying(false);
        } else {
            if (videoRef.current.currentTime < trimStart || videoRef.current.currentTime >= trimEnd) {
                videoRef.current.currentTime = trimStart;
            }
            videoRef.current.play();
            setIsPlaying(true);
            animFrameRef.current = requestAnimationFrame(updateTimeLoop);
        }
    };

    useEffect(() => {
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleTextDrag = (e) => {
        if (!isDraggingText || !previewContainerRef.current) return;
        const rect = previewContainerRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
        const y = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));
        setTextPosition({ x, y });
    };

    const handlePublish = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const trimOptions = mediaType === "video"
                ? { startTime: trimStart, endTime: trimEnd }
                : {};

            const uploaded = await uploadMedia([file], trimOptions);
            if (!uploaded || uploaded.length === 0) throw new Error("Upload failed");

            const storyData = {
                tipo: mediaType,
                url: uploaded[0].url,
                duracion: mediaType === "video" ? Math.min(trimEnd - trimStart, MAX_DURATION) : 5,
                trimStart: mediaType === "video" ? trimStart : 0,
                trimEnd: mediaType === "video" ? trimEnd : 5,
                texto: overlayText,
                textoPosition: textPosition,
                emoji: selectedEmoji,
                metadata: {
                    size: file.size,
                    mimeType: file.type,
                },
            };

            await crearStory(storyData);
            success("¡Historia publicada! 🎉");
            onPublished();
        } catch (err) {
            console.error("Error publishing story:", err);
            showError("Error al publicar historia");
        } finally {
            setUploading(false);
        }
    };

    const selectedDuration = mediaType === "video" ? (trimEnd - trimStart).toFixed(1) : "5.0";

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center">
            <div className="relative w-full max-w-[320px] h-[80vh] flex flex-col bg-gray-950 rounded-[2rem] overflow-hidden shadow-2xl mx-4">

                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 bg-black/50 backdrop-blur-sm z-20">
                    <h3 className="text-white font-black text-[10px] sm:text-sm uppercase tracking-widest">
                        {file ? "Editar" : "Nueva Historia"}
                    </h3>
                    <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Preview Area */}
                <div
                    ref={previewContainerRef}
                    className="flex-1 relative bg-black flex items-center justify-center overflow-hidden"
                    style={{ aspectRatio: "9/16" }}
                    onMouseMove={handleTextDrag}
                    onTouchMove={handleTextDrag}
                    onMouseUp={() => setIsDraggingText(false)}
                    onTouchEnd={() => setIsDraggingText(false)}
                >
                    {!file ? (
                        <div className="flex flex-col items-center gap-6 text-center p-8">
                            <div className="w-24 h-24 rounded-full bg-red-600/20 flex items-center justify-center">
                                <Upload className="w-10 h-10 text-red-500" />
                            </div>
                            <div>
                                <p className="text-white font-black text-lg mb-2">Sube tu historia</p>
                                <p className="text-gray-400 text-sm">Imagen o video (máx 30s)</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all"
                                >
                                    <Image className="w-4 h-4" /> Imagen
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-2xl font-bold text-sm hover:bg-white/20 transition-all"
                                >
                                    <Film className="w-4 h-4" /> Video
                                </button>
                            </div>
                        </div>
                    ) : mediaType === "video" ? (
                        <video
                            ref={videoRef}
                            src={previewUrl}
                            className="w-full h-full object-contain"
                            onLoadedMetadata={handleVideoLoaded}
                            onClick={togglePlay}
                            playsInline
                        />
                    ) : (
                        <img src={previewUrl} alt="" className="w-full h-full object-contain" />
                    )}

                    {/* Overlay Text */}
                    {overlayText && (
                        <div
                            className="absolute z-10 cursor-move select-none"
                            style={{
                                left: `${textPosition.x}%`,
                                top: `${textPosition.y}%`,
                                transform: "translate(-50%, -50%)",
                            }}
                            onMouseDown={() => setIsDraggingText(true)}
                            onTouchStart={() => setIsDraggingText(true)}
                        >
                            <p className="text-white font-black text-xl text-center px-4 py-2 bg-black/40 backdrop-blur-sm rounded-xl max-w-[250px] break-words">
                                {overlayText}
                            </p>
                        </div>
                    )}

                    {/* Overlay Emoji */}
                    {selectedEmoji && (
                        <div className="absolute bottom-20 right-4 z-10 text-5xl animate-bounce">
                            {selectedEmoji}
                        </div>
                    )}

                    {/* Video Play/Pause overlay */}
                    {file && mediaType === "video" && (
                        <button
                            onClick={togglePlay}
                            className="absolute inset-0 flex items-center justify-center bg-transparent group z-5"
                        >
                            {!isPlaying && (
                                <div className="w-16 h-16 bg-red-600/80 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                                    <Play className="w-8 h-8 text-white ml-1" fill="white" />
                                </div>
                            )}
                        </button>
                    )}

                    {/* Duration badge */}
                    {file && (
                        <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs font-black">{selectedDuration}s</span>
                        </div>
                    )}
                </div>

                {/* Video Timeline Trim Controls */}
                {file && mediaType === "video" && videoDuration > 0 && (
                    <div className="px-6 py-5 bg-gradient-to-t from-gray-950 to-gray-900/90 backdrop-blur-lg border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20 space-y-4">
                        {/* Info Header */}
                        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                            <span className="flex items-center gap-2">
                                <Film className="w-4 h-4 text-red-500" />
                                Ajustar Tiempo
                            </span>
                            <div className="flex bg-black/50 px-3 py-1.5 rounded-full border border-white/5 items-center gap-2">
                                <span className="text-red-400">{(trimEnd - trimStart).toFixed(1)}s</span>
                                <span className="text-gray-600">|</span>
                                <span>Máx {MAX_DURATION}s</span>
                            </div>
                        </div>

                        {/* Interactive Timeline */}
                        <div
                            className="relative h-14 bg-gray-800/80 rounded-2xl select-none cursor-pointer border border-gray-700 overflow-visible shadow-inner flex items-center"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                                const time = (x / rect.width) * videoDuration;
                                if (videoRef.current) videoRef.current.currentTime = time;
                                setCurrentTime(time);
                            }}
                        >
                            {/* Track Base Pattern */}
                            <div className="absolute inset-0 rounded-2xl opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px]" />

                            {/* Unselected regions darkening */}
                            <div className="absolute top-0 bottom-0 left-0 bg-black/60 rounded-l-2xl" style={{ width: `${(trimStart / videoDuration) * 100}%` }} />
                            <div className="absolute top-0 bottom-0 right-0 bg-black/60 rounded-r-2xl" style={{ width: `${100 - (trimEnd / videoDuration) * 100}%` }} />

                            {/* Active Trimmer Range Highlight */}
                            <div
                                className="absolute top-0 bottom-0 border-y-4 border-red-500 bg-red-500/10 box-border pointer-events-none"
                                style={{
                                    left: `${(trimStart / videoDuration) * 100}%`,
                                    width: `${((trimEnd - trimStart) / videoDuration) * 100}%`,
                                }}
                            >
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 animate-pulse" />
                            </div>

                            {/* Left Handle (Start) */}
                            <div
                                className="absolute top-1/2 w-5 h-16 bg-white border border-gray-200 shadow-xl rounded-full cursor-ew-resize -translate-y-1/2 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-20 group"
                                style={{ left: `calc(${(trimStart / videoDuration) * 100}% - 10px)` }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    const rect = e.target.parentElement.getBoundingClientRect();
                                    const onMove = (ev) => {
                                        const pct = Math.max(0, Math.min((ev.clientX - rect.left) / rect.width, trimEnd / videoDuration - 0.02));
                                        const newVal = pct * videoDuration;
                                        if (trimEnd - newVal <= MAX_DURATION && newVal >= 0) {
                                            setTrimStart(newVal);
                                            if (videoRef.current) videoRef.current.currentTime = newVal;
                                        }
                                    };
                                    const onUp = () => {
                                        document.removeEventListener('mousemove', onMove);
                                        document.removeEventListener('mouseup', onUp);
                                    };
                                    document.addEventListener('mousemove', onMove);
                                    document.addEventListener('mouseup', onUp);
                                }}
                            >
                                <div className="w-1 h-6 bg-gray-300 rounded-full group-hover:bg-red-500 transition-colors" />
                            </div>

                            {/* Right Handle (End) */}
                            <div
                                className="absolute top-1/2 w-5 h-16 bg-white border border-gray-200 shadow-xl rounded-full cursor-ew-resize -translate-y-1/2 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-20 group"
                                style={{ left: `calc(${(trimEnd / videoDuration) * 100}% - 10px)` }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    const rect = e.target.parentElement.getBoundingClientRect();
                                    const onMove = (ev) => {
                                        const pct = Math.max(trimStart / videoDuration + 0.02, Math.min((ev.clientX - rect.left) / rect.width, 1));
                                        const newVal = pct * videoDuration;
                                        const maxEnd = Math.min(trimStart + MAX_DURATION, videoDuration);
                                        if (newVal - trimStart <= MAX_DURATION && newVal <= maxEnd) {
                                            setTrimEnd(newVal);
                                        }
                                    };
                                    const onUp = () => {
                                        document.removeEventListener('mousemove', onMove);
                                        document.removeEventListener('mouseup', onUp);
                                    };
                                    document.addEventListener('mousemove', onMove);
                                    document.addEventListener('mouseup', onUp);
                                }}
                            >
                                <div className="w-1 h-6 bg-gray-300 rounded-full group-hover:bg-red-500 transition-colors" />
                            </div>

                            {/* Current Playback Marker (Scrubber line) */}
                            <div
                                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10 pointer-events-none transition-all duration-75"
                                style={{ left: `${(currentTime / videoDuration) * 100}%`, transform: 'translateX(-50%)' }}
                            />
                        </div>
                    </div>
                )}

                {/* Text Input Overlay */}
                {showTextInput && (
                    <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
                        <div className="w-full max-w-sm space-y-4">
                            <input
                                type="text"
                                value={overlayText}
                                onChange={(e) => setOverlayText(e.target.value.slice(0, 200))}
                                placeholder="Escribe tu texto..."
                                autoFocus
                                className="w-full px-6 py-4 bg-white/10 border border-white/20 text-white text-lg rounded-2xl outline-none focus:border-red-500 placeholder:text-white/30 font-bold text-center"
                                maxLength={200}
                            />
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">{overlayText.length}/200</span>
                                <button
                                    onClick={() => setShowTextInput(false)}
                                    className="px-6 py-2 bg-red-600 text-white rounded-full font-bold text-sm"
                                >
                                    Listo
                                </button>
                            </div>
                            <p className="text-gray-500 text-xs text-center">Arrastra el texto en la preview para moverlo</p>
                        </div>
                    </div>
                )}

                {/* Emoji Picker Overlay */}
                {showEmojiPicker && (
                    <div className="absolute bottom-28 left-4 right-4 z-30 bg-gray-900/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-white/10">
                        <div className="grid grid-cols-5 gap-2">
                            {EMOJI_LIST.map((em) => (
                                <button
                                    key={em}
                                    onClick={() => { setSelectedEmoji(em === selectedEmoji ? "" : em); setShowEmojiPicker(false); }}
                                    className={`w-12 h-12 text-2xl rounded-xl flex items-center justify-center transition-all hover:scale-110 ${selectedEmoji === em ? "bg-red-600/30 ring-2 ring-red-500" : "hover:bg-white/10"}`}
                                >
                                    {em}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowEmojiPicker(false)} className="w-full mt-3 py-2 text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-white">
                            Cerrar
                        </button>
                    </div>
                )}

                {/* Bottom Controls */}
                <div className="p-4 bg-black/50 backdrop-blur-sm flex items-center justify-between gap-3">
                    <div className="flex gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
                            title="Cambiar archivo"
                        >
                            <Upload className="w-5 h-5" />
                        </button>
                        {file && (
                            <>
                                <button
                                    onClick={() => { setShowTextInput(true); setShowEmojiPicker(false); }}
                                    className={`p-3 rounded-full transition-all ${overlayText ? "bg-red-600 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                                    title="Agregar texto"
                                >
                                    <Type className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowTextInput(false); }}
                                    className={`p-3 rounded-full transition-all ${selectedEmoji ? "bg-red-600 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                                    title="Agregar emoji"
                                >
                                    <Smile className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>

                    {file && (
                        <button
                            onClick={handlePublish}
                            disabled={uploading}
                            className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-full font-black text-sm uppercase tracking-wider hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-red-600/30"
                        >
                            {uploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Subiendo...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>Publicar</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
}
