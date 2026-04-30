import React, { useState, useRef } from "react";
import { Send, Plus, Trash2, Loader2, Globe, EyeOff, Lock } from "lucide-react";
import { uploadMedia, createPost } from "../../api/posts";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import MediaPickerModal from "../UI/MediaPickerModal";

export default function MultimediaUpload({ onComplete }) {
    const { t } = useLanguage();
    const [titulo, setTitulo] = useState("");
    const [contenido, setContenido] = useState("");
    const [categoria, setCategoria] = useState("General");
    const [visibilidad, setVisibilidad] = useState("público");
    const [mediaList, setMediaList] = useState([]); 
    const [isUploading, setIsUploading] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const { success, error } = useToast();

    const fileInputRef = useRef(null);

    const categories = [
        { id: "General", label: t('category_general') },
        { id: "Música", label: t('category_music') },
        { id: "Deportes", label: t('category_sports') },
        { id: "Tecnología", label: t('category_technology') },
        { id: "Entretenimiento", label: t('category_entertainment') },
        { id: "Educación", label: t('category_education') },
        { id: "Arte", label: t('category_art') },
        { id: "Naturaleza", label: t('category_nature') },
        { id: "Viajes", label: t('category_travel') },
        { id: "Moda", label: t('category_fashion') }
    ];

    const visibilityOptions = [
        { id: "público", icon: Globe, label: t('public_label'), desc: t('public_desc') },
        { id: "seguidores", icon: EyeOff, label: t('followers_label'), desc: t('followers_desc') },
        { id: "privado", icon: Lock, label: t('private_label'), desc: t('private_desc') }
    ];

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const newMedia = files.map(file => ({
            url: URL.createObjectURL(file),
            tipo: file.type.startsWith("video/") ? "video" : "imagen",
            file
        }));
        setMediaList([...mediaList, ...newMedia]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!titulo.trim() || mediaList.length === 0) {
            error(t('requires_title_file'));
            return;
        }

        setIsUploading(true);
        try {
            let mediaFinal = [];
            const filesToUpload = mediaList.filter(m => m.file);
            if (filesToUpload.length > 0) {
                const uploaded = await uploadMedia(filesToUpload.map(m => m.file));
                mediaFinal = uploaded;
            }

            const payload = {
                titulo,
                contenido,
                categoria,
                visibilidad,
                media: mediaFinal
            };

            await createPost(payload);
            success(t('multimedia_success'));
            
            // Reset
            setTitulo("");
            setContenido("");
            setMediaList([]);
            if (onComplete) onComplete();
        } catch (err) {
            error(t('error_upload_multimedia'));
        } finally {
            setIsUploading(false);
        }
    };

    const removeMedia = (index) => {
        setMediaList(mediaList.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white rounded-3xl sm:rounded-[3rem] p-3 sm:p-10 border border-red-50 shadow-2xl relative overflow-hidden">
            <MediaPickerModal 
                isOpen={isPickerOpen} 
                onClose={() => setIsPickerOpen(false)} 
                onSelect={() => fileInputRef.current.click()}
                filter={["gallery"]}
            />

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-10 relative z-10 text-center sm:text-left">
                <div className="space-y-1 sm:space-y-2 flex flex-col items-center sm:items-start">
                    <h3 className="text-lg sm:text-3xl font-black text-gray-900 tracking-tighter uppercase">{t('upload_to_network')}</h3>
                    <p className="text-[7px] sm:text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">{t('share_best_moments')}</p>
                </div>

                <div className="space-y-2 sm:space-y-4">
                    <input 
                        type="text" 
                        placeholder={t('title_work')}
                        className="w-full p-4 sm:p-6 bg-gray-50 rounded-xl sm:rounded-3xl border-transparent focus:bg-white focus:ring-4 focus:ring-red-50 outline-none text-[10px] sm:text-lg font-bold transition-all text-center sm:text-left"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                    />

                    <textarea 
                        className="w-full h-20 sm:h-32 p-4 sm:p-6 bg-gray-50 rounded-xl sm:rounded-3xl border-transparent focus:bg-white focus:ring-4 focus:ring-red-50 outline-none text-[9px] sm:text-sm font-medium transition-all resize-none text-center sm:text-left"
                        placeholder={t('short_description')}
                        value={contenido}
                        onChange={(e) => setContenido(e.target.value)}
                    />
                </div>

                {/* Media Preview */}
                <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 sm:pb-4 scrollbar-hide min-h-[100px] sm:min-h-[140px] justify-center sm:justify-start">
                    <div className="flex gap-2 sm:gap-4 mx-auto sm:mx-0">
                        {mediaList.map((item, index) => (
                            <div key={index} className="relative flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-red-50 group">
                                {item.tipo === "imagen" ? (
                                    <img src={item.url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <video src={item.url} className="w-full h-full object-cover bg-black" muted />
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeMedia(index)}
                                    className="absolute top-1 right-1 p-1 sm:p-2 bg-red-600 text-white rounded-lg sm:scale-75 group-hover:scale-100 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setIsPickerOpen(true)}
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl bg-red-50/50 border-2 border-dashed border-red-100 flex flex-col items-center justify-center text-red-300 hover:bg-red-50 hover:text-red-600 transition-all gap-1 sm:gap-2"
                        >
                            <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
                            <span className="text-[6px] sm:text-[8px] font-black uppercase">{t('click_here')}</span>
                        </button>
                    </div>
                </div>

                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple accept="image/*,video/*" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2 sm:pt-4 border-t border-red-50">
                    {/* Category Selection */}
                    <div className="space-y-2 sm:space-y-4">
                        <label className="text-[7px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest block text-center sm:text-left">{t('category_label')}</label>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center sm:justify-start">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategoria(cat)}
                                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[7px] sm:text-[9px] font-black uppercase tracking-widest transition-all ${categoria === cat ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600'}`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Visibility Selection */}
                    <div className="space-y-2 sm:space-y-4">
                        <label className="text-[7px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest block text-center sm:text-left">{t('visibility_label')}</label>
                        <div className="grid grid-cols-3 md:grid-cols-1 gap-1.5 sm:gap-2 justify-items-center sm:justify-items-start">
                            {visibilityOptions.map(opt => {
                                const Icon = opt.icon;
                                const selected = visibilidad === opt.id;
                                return (
                                    <div 
                                        key={opt.id}
                                        onClick={() => setVisibilidad(opt.id)}
                                        className={`flex flex-col sm:flex-row items-center sm:gap-4 p-1.5 sm:p-3 rounded-xl sm:rounded-2xl cursor-pointer border-2 transition-all w-full sm:w-auto ${selected ? 'border-red-600 bg-red-50/50' : 'border-gray-50 hover:border-red-100'}`}
                                    >
                                        <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0 ${selected ? 'bg-red-600 text-white' : 'bg-white text-gray-300'}`}>
                                            <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </div>
                                        <div className="hidden sm:block">
                                            <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-tight ${selected ? 'text-red-900' : 'text-gray-500'}`}>{opt.label}</p>
                                            <p className="text-[6px] sm:text-[8px] text-gray-400 font-bold uppercase">{opt.desc}</p>
                                        </div>
                                        <div className="sm:hidden mt-1">
                                            <p className={`text-[6px] font-black uppercase tracking-tighter ${selected ? 'text-red-900' : 'text-gray-500'}`}>{opt.label}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isUploading || !titulo.trim() || mediaList.length === 0}
                    className="w-full py-4 sm:py-7 bg-red-600 text-white font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[8px] sm:text-xs rounded-2xl sm:rounded-3xl shadow-2xl shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-4 disabled:opacity-50"
                >
                    {isUploading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <>{t('upload_to_universe')} <Send className="w-3 h-3 sm:w-4 sm:h-4" /></>}
                </button>
            </form>
        </div>
    );
}
