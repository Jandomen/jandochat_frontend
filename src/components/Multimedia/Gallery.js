import React, { useState, useEffect, useCallback } from "react";
import { getGallery } from "../../api/posts";
import { Loader2, Search, Maximize2, MessageCircle, Heart, Plus } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useSocket } from "../../context/SocketContext";
import { useLanguage } from "../../context/LanguageContext";
import ImageViewer from "../UI/ImageViewer";
import UploadModal from "./UploadModal";

export default function Gallery() {
    const { t } = useLanguage();
    const { socket } = useSocket();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("todas");
    const [search, setSearch] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const { error } = useToast();
    
    // ImageViewer State
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerMedia, setViewerMedia] = useState([]);
    const [viewerIndex, setViewerIndex] = useState(0);

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

    const fetchPhotos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getGallery(category, search);
            setPhotos(data);
        } catch (err) {
            error(t('load_gallery_error'));
        } finally {
            setLoading(false);
        }
    }, [category, search, error, t]);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    useEffect(() => {
        if (!socket) return;
        
        socket.on("nuevoPost", (newPost) => {
            if (newPost.media && newPost.media.length > 0) {
                setPhotos(prev => [newPost, ...prev]);
            }
        });

        socket.on("actualizarComentarios", ({ postId, comentarios }) => {
            setPhotos((prev) => prev.map(p => p._id === postId ? { ...p, comentarios } : p));
        });

        socket.on("actualizarReacciones", ({ postId, reacciones }) => {
            setPhotos((prev) => prev.map(p => p._id === postId ? { ...p, reacciones } : p));
        });

        return () => {
            socket.off("nuevoPost");
            socket.off("actualizarComentarios");
            socket.off("actualizarReacciones");
        };
    }, [socket]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPhotos();
    };

    const openViewer = (post, mediaIndex) => {
        setViewerMedia(post.media);
        setViewerIndex(mediaIndex);
        setViewerOpen(true);
    };

    if (loading && photos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
                <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest animate-pulse">{t('capturing_light_loader')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-2 sm:space-y-8 px-0 sm:px-4 pb-24 overflow-x-hidden w-full pt-0 sm:pt-8">
            {/* High-Impact Header (Profile Style) - HYPER COMPACT */}
            <div className="relative group px-1 sm:px-0">
                <div className="h-24 sm:h-56 rounded-[1.5rem] sm:rounded-[4rem] overflow-hidden relative shadow-xl bg-gradient-to-br from-red-900 via-red-600 to-black">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <h2 className="text-lg sm:text-6xl font-black text-white tracking-tighter uppercase leading-none mb-0.5 sm:mb-2">{t('gallery_title')}</h2>
                        <p className="text-[5px] sm:text-[12px] font-black text-red-200 uppercase tracking-[0.4em]">{t('gallery_subtitle')}</p>
                    </div>
                </div>

                {/* Floating Search & Category Bar (Sticky style) - ULTRA COMPACT WIDTH */}
                <div className="relative -mt-4 sm:-mt-12 px-0 flex justify-center w-full">
                    <div className="bg-white/95 backdrop-blur-2xl rounded-lg sm:rounded-[3rem] p-1.5 sm:p-8 shadow-md border border-red-50 flex flex-col items-center gap-1.5 sm:gap-4 w-[280px] sm:w-full max-w-[280px] sm:max-w-md">
                        <form onSubmit={handleSearch} className="relative w-full px-2">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 sm:w-4 sm:h-4 text-gray-300" />
                            <input 
                                type="text" 
                                placeholder={`${t('search')}...`}
                                className="w-full pl-6 pr-2 py-1 sm:py-4 bg-gray-50 rounded-md sm:rounded-2xl text-[6px] sm:text-xs font-black border-transparent focus:bg-white focus:ring-1 focus:ring-red-50 outline-none transition-all text-center"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
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

            {/* Masonry-like Grid - Symmetrically Centered */}
            <div className="columns-2 sm:columns-3 md:columns-4 gap-2 sm:gap-4 space-y-2 sm:space-y-4 px-1">
                {photos.length > 0 ? (
                    photos.map(photo => {
                        const mainMedia = photo.media[0];
                        return (
                            <div 
                                key={photo._id} 
                                className="relative rounded-xl sm:rounded-[2rem] overflow-hidden group cursor-pointer border border-red-50/50 break-inside-avoid shadow-sm hover:shadow-xl transition-all mx-auto"
                                onClick={() => openViewer(photo, 0)}
                            >
                                <img 
                                    src={mainMedia.url} 
                                    alt={photo.titulo} 
                                    className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-110"
                                />
                                {/* Overlay Info */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-2 sm:p-6 text-center">
                                    <h4 className="text-white text-[8px] sm:text-xs font-black uppercase tracking-tight mb-0.5 sm:mb-1 truncate">{photo.titulo || t('immortalized_label')}</h4>
                                    <div className="flex items-center justify-between text-[6px] sm:text-[8px] text-red-100 font-bold uppercase tracking-widest px-1">
                                        <div className="flex items-center gap-1.5 sm:gap-3">
                                            <span className="flex items-center gap-0.5 sm:gap-1"><Heart className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> {photo.reacciones?.length || 0}</span>
                                            <span className="flex items-center gap-0.5 sm:gap-1"><MessageCircle className="w-2 sm:w-2.5 h-2 sm:h-2.5" /> {photo.comentarios?.length || 0}</span>
                                        </div>
                                        <Maximize2 className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-white" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-10 sm:py-20 bg-white/50 rounded-2xl sm:rounded-[3rem] border border-dashed border-red-100 italic col-span-full w-full">
                         <p className="text-gray-300 font-bold uppercase text-[8px] sm:text-[10px] tracking-widest">{t('archive_empty_desc')}</p>
                    </div>
                )}
            </div>

            {/* Floating Action for Uploading in Gallery */}
            <button 
                onClick={() => setIsUploadOpen(true)}
                className="fixed bottom-24 right-4 sm:right-12 p-4 sm:p-5 bg-red-600 text-white rounded-full shadow-2xl z-[60] hover:scale-110 active:scale-95 transition-all shadow-red-200"
            >
                <Plus className="w-5 h-5 sm:w-7 sm:h-7" />
            </button>

            <UploadModal 
                isOpen={isUploadOpen} 
                onClose={() => setIsUploadOpen(false)}
                onComplete={fetchPhotos}
            />

            {viewerOpen && (
                <ImageViewer 
                    media={viewerMedia}
                    currentIndex={viewerIndex}
                    onClose={() => setViewerOpen(false)}
                    onNext={() => setViewerIndex(prev => (prev + 1) % viewerMedia.length)}
                    onPrev={() => setViewerIndex(prev => (prev - 1 + viewerMedia.length) % viewerMedia.length)}
                />
            )}
        </div>
    );
}
