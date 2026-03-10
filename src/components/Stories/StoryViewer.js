import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Eye, Pause, Volume2, VolumeX } from "lucide-react";
import { viewStory } from "../../api/stories";
import useAuth from "../../hooks/useAuth";

export default function StoryViewer({ storyGroups, initialGroupIndex = 0, onClose }) {
    const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
    const [storyIdx, setStoryIdx] = useState(0);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);
    const [muted, setMuted] = useState(true);
    const [touchStart, setTouchStart] = useState(null);
    const { user } = useAuth();

    const videoRef = useRef(null);
    const timerRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const modalRef = useRef(document.createElement('div'));

    useEffect(() => {
        const el = modalRef.current;
        el.id = 'story-viewer-modal';
        el.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.95);';
        
        if (!document.getElementById('story-viewer-modal')) {
            document.body.appendChild(el);
        }
        
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.body.style.overflow = originalOverflow;
            if (document.body.contains(el)) {
                document.body.removeChild(el);
            }
        };
    }, []);

    const currentGroup = storyGroups[groupIdx];
    const currentStory = currentGroup?.stories?.[storyIdx];

    const markAsViewed = useCallback(async (storyId) => {
        try {
            await viewStory(storyId);
        } catch (err) {}
    }, []);

    const goNextStory = useCallback(() => {
        if (!currentGroup) return;
        if (storyIdx < currentGroup.stories.length - 1) {
            setStoryIdx(prev => prev + 1);
            setProgress(0);
        } else if (groupIdx < storyGroups.length - 1) {
            setGroupIdx(prev => prev + 1);
            setStoryIdx(0);
            setProgress(0);
        } else {
            onClose();
        }
    }, [storyIdx, groupIdx, currentGroup, storyGroups.length, onClose]);

    const goPrevStory = useCallback(() => {
        if (storyIdx > 0) {
            setStoryIdx(prev => prev - 1);
            setProgress(0);
        } else if (groupIdx > 0) {
            setGroupIdx(prev => prev - 1);
            const prevGroup = storyGroups[groupIdx - 1];
            setStoryIdx(prevGroup.stories.length - 1);
            setProgress(0);
        }
    }, [storyIdx, groupIdx, storyGroups]);

    useEffect(() => {
        if (!currentStory || paused) return;

        const duration = (currentStory.duracion || 5) * 1000;
        let startTime = Date.now();

        progressIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            setProgress(Math.min(elapsed / duration, 1));
        }, 50);

        timerRef.current = setTimeout(() => {
            goNextStory();
        }, duration);

        markAsViewed(currentStory._id);

        return () => {
            clearTimeout(timerRef.current);
            clearInterval(progressIntervalRef.current);
        };
    }, [currentStory, paused, goNextStory, markAsViewed]);

    useEffect(() => {
        if (videoRef.current && currentStory?.tipo === "video") {
            videoRef.current.currentTime = currentStory.trimStart || 0;
            if (!paused) {
                videoRef.current.play().catch(() => {});
            }
        }
    }, [currentStory, paused]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight" || e.key === " ") goNextStory();
            if (e.key === "ArrowLeft") goPrevStory();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, goNextStory, goPrevStory]);

    const handleTouchStart = (e) => {
        setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() });
        setPaused(true);
    };

    const handleTouchEnd = (e) => {
        setPaused(false);
        if (!touchStart) return;

        const dx = e.changedTouches[0].clientX - touchStart.x;
        const dy = e.changedTouches[0].clientY - touchStart.y;
        const dt = Date.now() - touchStart.time;

        if (dy > 100 && Math.abs(dx) < 50) {
            onClose();
            return;
        }

        if (dt > 500) {
            setTouchStart(null);
            return;
        }

        const screenWidth = window.innerWidth;
        const tapX = e.changedTouches[0].clientX;
        if (tapX < screenWidth / 3) {
            goPrevStory();
        } else if (tapX > (2 * screenWidth) / 3) {
            goNextStory();
        }

        setTouchStart(null);
    };

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) {
            goPrevStory();
        } else if (x > (2 * rect.width) / 3) {
            goNextStory();
        }
    };

    if (!currentStory) return null;

    const modalContent = (
        <div 
            style={{ 
                position: 'fixed', 
                inset: 0, 
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <button
                onClick={(e) => { e.stopPropagation(); goPrevStory(); }}
                style={{
                    position: 'absolute', left: 16, zIndex: 30,
                    padding: 12, background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%', color: 'white', display: 'none'
                }}
                className="md:flex items-center justify-center"
            >
                <ChevronLeft size={24} />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); goNextStory(); }}
                style={{
                    position: 'absolute', right: 16, zIndex: 30,
                    padding: 12, background: 'rgba(255,255,255,0.1)',
                    borderRadius: '50%', color: 'white', display: 'none'
                }}
                className="md:flex items-center justify-center"
            >
                <ChevronRight size={24} />
            </button>

            <div
                style={{
                    position: 'relative',
                    width: 380,
                    height: 680,
                    background: 'black',
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onClick={(e) => { e.stopPropagation(); handleClick(e); }}
            >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', gap: 4, padding: 12 }}>
                    {currentGroup.stories.map((_, idx) => (
                        <div key={idx} style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.3)', borderRadius: 10, overflow: 'hidden' }}>
                            <div
                                style={{
                                    height: '100%',
                                    background: 'white',
                                    width: idx < storyIdx ? '100%' : idx === storyIdx ? `${progress * 100}%` : '0%',
                                    transition: idx === storyIdx ? 'none' : 'width 0.3s'
                                }}
                            />
                        </div>
                    ))}
                </div>

                <div style={{ position: 'absolute', top: 24, left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                            src={currentGroup.usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                            alt=""
                            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                        />
                        <div>
                            <p style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{currentGroup.usuario.nombre}</p>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                                {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {paused && (
                            <div style={{ padding: 8, background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}>
                                <Pause size={16} color="white" />
                            </div>
                        )}
                        {currentStory.tipo === "video" && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted; }}
                                style={{ padding: 8, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', border: 'none', cursor: 'pointer' }}
                            >
                                {muted ? <VolumeX size={16} color="white" /> : <Volume2 size={16} color="white" />}
                            </button>
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            style={{ padding: 8, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', border: 'none', cursor: 'pointer' }}
                        >
                            <X size={20} color="white" />
                        </button>
                    </div>
                </div>

                {currentStory.tipo === "video" ? (
                    <video
                        ref={videoRef}
                        src={currentStory.url}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        playsInline
                        muted={muted}
                        loop={false}
                    />
                ) : (
                    <img
                        src={currentStory.url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                )}

                {currentStory.texto && (
                    <div
                        style={{
                            position: 'absolute', zIndex: 10,
                            left: `${currentStory.textoPosition?.x || 50}%`,
                            top: `${currentStory.textoPosition?.y || 50}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <p style={{ color: 'white', fontWeight: '900', fontSize: 20, textAlign: 'center', padding: '8px 16px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', borderRadius: 12, maxWidth: 250, wordBreak: 'break-word' }}>
                            {currentStory.texto}
                        </p>
                    </div>
                )}

                {currentStory.emoji && (
                    <div style={{ position: 'absolute', bottom: 80, right: 16, zIndex: 10, fontSize: 40 }}>
                        {currentStory.emoji}
                    </div>
                )}

                {currentStory.usuario?.toString() === user?._id || currentGroup.usuario._id === user?._id ? (
                    <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '8px 16px', borderRadius: 20 }}>
                        <Eye size={16} color="rgba(255,255,255,0.7)" />
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold' }}>
                            {currentStory.viewers?.length || 0} vistas
                        </span>
                    </div>
                ) : null}
            </div>
        </div>
    );

    return createPortal(modalContent, modalRef.current);
}
