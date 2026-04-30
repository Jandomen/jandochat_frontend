import React, { useState, useEffect } from "react";
import useMentions from "../../hooks/useMentions";
import { X, Send, Loader2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function EditPostModal({ isOpen, onClose, post, onSave }) {
    const { t } = useLanguage();
    const [contenido, setContenido] = useState(post?.contenido || "");
    const [isSaving, setIsSaving] = useState(false);
    const {
        suggestions,
        showSuggestions,
        handleTextChange,
        selectSuggestion,
        loadUsers,
        textareaRef
    } = useMentions();

    useEffect(() => {
        if (isOpen) {
            setContenido(post?.contenido || "");
            loadUsers();
        }
    }, [isOpen, post, loadUsers]);

    const handleTextareaChange = (e) => {
        const val = e.target.value;
        setContenido(val);
        handleTextChange(val, e.target.selectionStart);
    };

    const handleSelectMention = (u) => {
        selectSuggestion(u, contenido, (newText) => {
            setContenido(newText);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!contenido.trim()) return;
        setIsSaving(true);
        try {
            await onSave(post._id, contenido);
            onClose();
        } catch (error) {
            console.error("Error saving post:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-red-50 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 sm:p-8 border-b border-red-50 flex items-center justify-between bg-red-50/30">
                    <div>
                        <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight uppercase">{t('edit_post_label')}</h3>
                        <p className="text-[8px] sm:text-[10px] font-black text-red-600 uppercase tracking-widest mt-0.5">{t('refine_message')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 sm:p-3 hover:bg-red-100/50 rounded-xl transition-all text-gray-400 hover:text-red-600">
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            className="w-full h-32 sm:h-48 p-4 sm:p-6 bg-gray-50/50 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-transparent focus:border-red-100 focus:bg-white focus:ring-8 focus:ring-red-50 outline-none text-[13px] sm:text-lg transition-all resize-none font-medium placeholder:text-gray-300"
                            placeholder={t('edit_content_placeholder')}
                            value={contenido}
                            onChange={handleTextareaChange}
                            onKeyUp={(e) => handleTextChange(e.target.value, e.target.selectionStart)}
                            onClick={(e) => handleTextChange(e.target.value, e.target.selectionStart)}
                        />

                        {/* Mention Suggestions */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 mt-2 z-[110] bg-white rounded-2xl shadow-2xl border border-red-100 p-2 w-full max-h-48 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                                {suggestions.map(u => (
                                    <button
                                        key={u._id}
                                        type="button"
                                        onClick={() => handleSelectMention(u)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl transition-colors text-left"
                                    >
                                        <img src={u.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"} className="w-8 h-8 rounded-full object-cover" alt="" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] sm:text-xs font-black text-gray-900 truncate">@{u.username || u.nombre}</p>
                                            <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase truncate">{u.nombre}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={onClose}
                            className="flex-1 py-4 sm:py-5 bg-gray-50 text-gray-400 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={!contenido.trim() || isSaving}
                            className="flex-2 flex items-center justify-center gap-3 px-8 sm:px-12 py-4 sm:py-5 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSaving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>{t('save_changes')}</span>
                                    <Send className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
