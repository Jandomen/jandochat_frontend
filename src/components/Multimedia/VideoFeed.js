import React, { useState, useEffect, useCallback } from "react";
import { getVideos, reaccionarPost, comentarPost } from "../../api/posts";
import { Loader2, Search, Filter, Volume2, VolumeX } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import PostCard from "../Usuarios/PostCard";
import UploadModal from "./UploadModal";
import { useLanguage } from "../../context/LanguageContext";
import { useSocket } from "../../context/SocketContext";

export default function VideoFeed() {
    const { t } = useLanguage();
    const { socket } = useSocket();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("todas");
    const [search, setSearch] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const { error } = useToast();
    const [isMuted, setIsMuted] = useState(true);

    const categories = [
        { id: "todas", labelKey: "all_categories" },
        { id: "General", labelKey: "general" },
        { id: "Música", labelKey: "music" },
        { id: "Deportes", labelKey: "sports" },
        { id: "Tecnología", labelKey: "technology" },
        { id: "Entretenimiento", labelKey: "entertainment" }, 
        { id: "Educación", labelKey: "education" },
        { id: "Arte", labelKey: "art" },
        { id: "Naturaleza", labelKey: "nature" },
        { id: "Viajes", labelKey: "travel" },
        { id: "Moda", labelKey: "fashion" }
    ];

    const fetchVideos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getVideos(category, search);
            setVideos(data);
        } catch (err) {
            error(t('load_videos_error'));
        } finally {
            setLoading(false);
        }
    }, [category, search, error, t]);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    useEffect(() => {
        if (!socket) return;
        
        socket.on("nuevoPost", (newPost) => {
            if (newPost.media && newPost.media.some(m => m.tipo === "video")) {
                setVideos(prev => [newPost, ...prev]);
            }
        });

        socket.on("actualizarComentarios", ({ postId, comentarios }) => {
            setVideos((prev) => prev.map(v => v._id === postId ? { ...v, comentarios } : v));
        });

        socket.on("actualizarReacciones", ({ postId, reacciones }) => {
            setVideos((prev) => prev.map(v => v._id === postId ? { ...v, reacciones } : v));
        });

        return () => {
            socket.off("nuevoPost");
            socket.off("actualizarComentarios");
            socket.off("actualizarReacciones");
        };
    }, [socket]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchVideos();
    };

    if (loading && videos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
                <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest animate-pulse">{t('tuning_universe_loader')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-2 sm:space-y-8 px-0 sm:px-4 pb-24 overflow-x-hidden w-full pt-0 sm:pt-8">
            {/* High-Impact Header (Profile Style) - HYPER COMPACT */}
            <div className="relative group px-1 sm:px-0">
                <div className="h-24 sm:h-56 rounded-[1.5rem] sm:rounded-[4rem] overflow-hidden relative shadow-xl bg-black">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <h2 className="text-lg sm:text-6xl font-black text-white tracking-tighter uppercase leading-none mb-0.5 sm:mb-2">{t('viralize_title')}</h2>
                        <p className="text-[5px] sm:text-[12px] font-black text-red-600 uppercase tracking-[0.4em]">{t('viralize_subtitle')}</p>
                    </div>
                </div>

                {/* Floating Search & Action Bar (Sticky style) - ULTRA COMPACT WIDTH */}
                <div className="relative -mt-4 sm:-mt-12 px-0 flex justify-center w-full">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-lg sm:rounded-[3rem] p-1.5 sm:p-8 shadow-md border border-red-50 flex flex-col items-center gap-1.5 sm:gap-4 w-[280px] sm:w-full max-w-[280px] sm:max-w-md">
                        <form onSubmit={handleSearch} className="flex gap-1 sm:gap-1.5 w-full px-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 sm:w-4 sm:h-4 text-gray-300" />
                                <input 
                                    type="text" 
                                    placeholder={`${t('viralize_title')}...`}
                                    className="w-full pl-6 pr-2 py-1 sm:py-4 bg-gray-50 rounded-md sm:rounded-2xl text-[6px] sm:text-xs font-black border-transparent focus:bg-white focus:ring-1 focus:ring-red-50 outline-none transition-all text-center"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="p-1 sm:p-4 bg-red-600 text-white rounded-lg sm:rounded-2xl shadow-lg hover:bg-black transition-all">
                                <Filter className="w-3 h-3 sm:w-5 sm:h-5" />
                            </button>
                        </form>

                        <div className="flex gap-1 sm:gap-3 overflow-x-auto w-full scrollbar-hide px-0.5">
                            <div className="flex gap-1 sm:gap-3 mx-auto w-max px-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategory(cat.id)}
                                        className={`px-2 py-0.5 sm:px-6 sm:py-2.5 rounded-full text-[5px] sm:text-[9px] font-black uppercase tracking-tighter sm:tracking-widest transition-all border shrink-0 ${category === cat.id ? 'bg-red-600 border-red-600 text-white' : 'bg-white border-red-50 text-gray-400 hover:border-red-200'}`}
                                    >
                                        {t(cat.labelKey)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <UploadModal 
                isOpen={isUploadOpen} 
                onClose={() => setIsUploadOpen(false)}
                onComplete={fetchVideos}
            />

            {/* Video List - Vertically Scrolled - Strictly Centered for Mobile */}
            <div className="space-y-4 sm:space-y-20 flex flex-col items-center">
                {videos.length > 0 ? (
                    videos.map(video => (
                        <div key={video._id} className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-700">
                             <PostCard 
                                post={video} 
                                onReact={(id, tipo) => reaccionarPost(id, tipo)}
                                onComment={(id, texto) => comentarPost(id, texto)}
                             />
                        </div>
                    ))
                ) : (
                    <div className="w-full text-center py-10 sm:py-20 bg-white/50 rounded-2xl sm:rounded-[3rem] border border-dashed border-red-100 italic">
                         <p className="text-gray-300 font-bold uppercase text-[8px] sm:text-[10px] tracking-widest">{t('no_videos_sector')}</p>
                    </div>
                )}
            </div>

            {/* Global Mute Toggle for Feed */}
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className="fixed bottom-24 right-4 sm:right-12 p-3 sm:p-4 bg-white/80 backdrop-blur-md rounded-full shadow-2xl border border-red-50 text-red-600 z-[60] hover:scale-110 active:scale-90 transition-all"
            >
                {isMuted ? <VolumeX className="w-4 h-4 sm:w-6 sm:h-6" /> : <Volume2 className="w-4 h-4 sm:w-6 sm:h-6" />}
            </button>
        </div>
    );
}
