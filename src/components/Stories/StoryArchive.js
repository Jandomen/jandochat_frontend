import React, { useState, useEffect } from "react";
import { Archive, Trash2, Eye, Film } from "lucide-react";
import { getArchivedStories, deleteArchivedStory } from "../../api/stories";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

export default function StoryArchive() {
    const { t } = useLanguage();
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
        const confirmed = await showConfirm(t('delete_permanently'), t('confirm_delete_archive_story'));
        if (!confirmed) return;
        try {
            await deleteArchivedStory(id);
            setStories((prev) => prev.filter((s) => s._id !== id));
            success(t('story_deleted_permanent'));
        } catch (err) {
            showError(t('error'));
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
        <div className="bg-white border border-gray-100 rounded-[2rem] p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <Archive className="w-4 h-4 text-red-600" />
                <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-gray-900">{t('story_archives')}</span>
            </div>

            {stories.length === 0 ? (
                <div className="py-8 text-center opacity-10">
                    <Archive className="w-10 h-10 mx-auto mb-2" />
                    <p className="font-black uppercase tracking-widest text-[8px]">{t('empty')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {stories.map((story) => (
                        <div key={story._id} className="relative group aspect-[9/16] bg-gray-50 rounded-xl overflow-hidden cursor-pointer border border-gray-100/50">
                            {/* Thumbnail */}
                            {story.tipo === "video" ? (
                                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                    {story.thumbnail ? (
                                        <img src={story.thumbnail} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <Film className="w-4 h-4 text-gray-600" />
                                    )}
                                </div>
                            ) : (
                                <img src={story.url} className="w-full h-full object-cover" alt="" />
                            )}

                            {/* Info overlay (always visible mini) */}
                            <div className="absolute bottom-1 left-1 right-1 flex justify-between items-center">
                                <span className="bg-black/40 text-white text-[5px] font-bold px-1 py-0.5 rounded-sm backdrop-blur-[2px]">
                                    {new Date(story.createdAt).toLocaleDateString([], {day: '2-digit', month: '2-digit'})}
                                </span>
                                <div className="bg-red-600/80 text-white text-[5px] font-bold px-1 py-0.5 rounded-sm flex items-center gap-0.5">
                                    <Eye className="w-1.5 h-1.5" />
                                    {story.viewers?.length || 0}
                                </div>
                            </div>

                            {/* Hover Actions */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                <button
                                    onClick={() => setSelectedStory(story)}
                                    className="p-1.5 bg-white/20 rounded-lg text-white hover:bg-white/40 border border-white/20"
                                >
                                    <Eye className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(story._id); }}
                                    className="p-1.5 bg-red-600/60 rounded-lg text-white hover:bg-red-600 border border-white/10"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
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
