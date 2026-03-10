import React, { useState, useEffect } from "react";
import { Archive, Trash2, Eye, Clock, Film, Image } from "lucide-react";
import { getArchivedStories, deleteArchivedStory } from "../../api/stories";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";

export default function StoryArchive() {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStory, setSelectedStory] = useState(null);
    const { showConfirm } = useModal();
    const { success, error: showError } = useToast();

    useEffect(() => {
        const fetchArchive = async () => {
            try {
                const data = await getArchivedStories();
                setStories(data);
            } catch (err) {
                console.error("Error loading archive:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchArchive();
    }, []);

    const handleDelete = async (id) => {
        const confirmed = await showConfirm("Eliminar permanentemente", "¿Eliminar esta historia del archivo para siempre?");
        if (!confirmed) return;
        try {
            await deleteArchivedStory(id);
            setStories((prev) => prev.filter((s) => s._id !== id));
            success("Historia eliminada permanentemente");
        } catch (err) {
            showError("Error al eliminar");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-white border border-red-50 rounded-[3rem] p-8 shadow-xl shadow-red-100/20">
            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <Archive className="w-6 h-6 text-red-600" />
                <span>Archivo de Historias</span>
            </h2>

            {stories.length === 0 ? (
                <div className="py-12 text-center opacity-20">
                    <Archive className="w-16 h-16 mx-auto mb-4" />
                    <p className="font-black uppercase tracking-widest text-xs">No hay historias archivadas</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {stories.map((story) => (
                        <div key={story._id} className="relative group aspect-[9/16] bg-gray-100 rounded-2xl overflow-hidden cursor-pointer">
                            {/* Thumbnail */}
                            {story.tipo === "video" ? (
                                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                    {story.thumbnail ? (
                                        <img src={story.thumbnail} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <Film className="w-8 h-8 text-gray-600" />
                                    )}
                                    <div className="absolute top-2 left-2">
                                        <Film className="w-4 h-4 text-white drop-shadow" />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <img src={story.url} className="w-full h-full object-cover" alt="" />
                                    <div className="absolute top-2 left-2">
                                        <Image className="w-4 h-4 text-white drop-shadow" />
                                    </div>
                                </>
                            )}

                            {/* Date badge */}
                            <div className="absolute bottom-2 left-2 right-2">
                                <div className="bg-black/60 text-white text-[8px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm">
                                    <Clock className="w-2.5 h-2.5" />
                                    {new Date(story.createdAt).toLocaleDateString()}
                                </div>
                            </div>

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                                <button
                                    onClick={() => setSelectedStory(story)}
                                    className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-all"
                                >
                                    <Eye className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(story._id); }}
                                    className="p-2 bg-red-600/80 rounded-full text-white hover:bg-red-700 transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Views count */}
                            <div className="absolute top-2 right-2 bg-black/40 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <Eye className="w-2.5 h-2.5" />
                                {story.viewers?.length || 0}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview modal */}
            {selectedStory && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setSelectedStory(null)}>
                    <div className="relative max-w-[420px] max-h-[90vh] rounded-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {selectedStory.tipo === "video" ? (
                            <video src={selectedStory.url} className="w-full max-h-[80vh] object-contain" controls playsInline />
                        ) : (
                            <img src={selectedStory.url} className="w-full max-h-[80vh] object-contain" alt="" />
                        )}
                        {selectedStory.texto && (
                            <div
                                className="absolute"
                                style={{
                                    left: `${selectedStory.textoPosition?.x || 50}%`,
                                    top: `${selectedStory.textoPosition?.y || 50}%`,
                                    transform: "translate(-50%, -50%)",
                                }}
                            >
                                <p className="text-white font-black text-xl text-center px-4 py-2 bg-black/40 backdrop-blur-sm rounded-xl">
                                    {selectedStory.texto}
                                </p>
                            </div>
                        )}
                        <button
                            onClick={() => setSelectedStory(null)}
                            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
