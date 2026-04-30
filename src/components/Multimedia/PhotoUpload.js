import React, { useState, useRef } from "react";
import { X, Plus, Trash2, Globe, Users, Lock, Image as ImageIcon } from "lucide-react";
import { createPost } from "../../api/posts";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

export default function PhotoUpload({ onClose, onComplete }) {
    const { t } = useLanguage();
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [categoria, setCategoria] = useState("General");
    const [visibilidad, setVisibilidad] = useState("público");
    const [mediaList, setMediaList] = useState([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const { success, error } = useToast();

    const categories = [
        "General", "Música", "Deportes", "Tecnología", "Entretenimiento", 
        "Educación", "Arte", "Naturaleza", "Viajes", "Moda"
    ];

    const visibilityOptions = [
        { id: "público", label: "Público", desc: "Todo el mundo", icon: Globe },
        { id: "seguidores", label: "Aliados", desc: "Solo tus seguidores", icon: Users },
        { id: "privado", label: "Privado", desc: "Solo tú", icon: Lock }
    ];

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validImages = files.filter(f => f.type.startsWith("image/"));
        
        validImages.forEach(file => {
            const url = URL.createObjectURL(file);
            setMediaList(prev => [...prev, { url, file, tipo: "imagen" }]);
        });
    };

    const removeMedia = (index) => {
        setMediaList(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!titulo.trim()) return error(t('title_required'));
        if (mediaList.length === 0) return error(t('select_photo_required'));

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("titulo", titulo);
            formData.append("contenido", descripcion);
            formData.append("categoria", categoria);
            formData.append("visibilidad", visibilidad);
            formData.append("tipo", "image"); // Metadata for gallery filtering
            
            mediaList.forEach(item => {
                formData.append("media", item.file);
            });

            await createPost(formData);
            success(t('masterpiece_published'));
            onComplete();
            onClose();
        } catch (err) {
            error(t('error_publishing'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-hide border border-red-50">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-red-50 rounded-full transition-colors text-gray-400">
                    <X className="w-5 h-5" />
                </button>

                <form onSubmit={handleSubmit} className="space-y-6 text-center sm:text-left">
                    <div className="flex flex-col items-center sm:items-start space-y-1">
                        <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-100 mb-2">
                             <ImageIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tighter uppercase">{t('photo_upload_title')}</h3>
                        <p className="text-[8px] sm:text-[10px] font-black text-red-600 uppercase tracking-widest">{t('photo_upload_subtitle')}</p>
                    </div>

                    <div className="space-y-3">
                        <input 
                            type="text" 
                            placeholder={t('photo_title_placeholder')}
                            className="w-full p-4 sm:p-5 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:ring-4 focus:ring-red-50 outline-none text-xs sm:text-base font-bold transition-all text-center sm:text-left"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            required
                        />

                        <textarea 
                            className="w-full h-24 p-4 sm:p-5 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:ring-4 focus:ring-red-50 outline-none text-[10px] sm:text-sm font-medium transition-all resize-none text-center sm:text-left"
                            placeholder={t('photo_desc_placeholder')}
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                        />
                    </div>

                    {/* Photo Previews */}
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide justify-center sm:justify-start">
                        <div className="flex gap-3 mx-auto sm:mx-0">
                            {mediaList.map((item, index) => (
                                <div key={index} className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-red-50 group shadow-md shrink-0">
                                    <img src={item.url} className="w-full h-full object-cover" alt="" />
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg shadow-lg"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="w-28 h-28 rounded-2xl bg-red-50/30 border-2 border-dashed border-red-100 flex flex-col items-center justify-center text-red-300 hover:bg-red-50 hover:text-red-600 transition-all gap-1 shrink-0 group"
                            >
                                <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                <span className="text-[8px] font-black uppercase">{t('add_photo')}</span>
                            </button>
                        </div>
                    </div>

                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} multiple accept="image/*" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-red-50">
                        {/* Categories */}
                        <div className="space-y-3">
                            <label className="text-[8px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest block text-center sm:text-left">{t('category_label')}</label>
                            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategoria(cat)}
                                        className={`px-3 py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all ${categoria === cat ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Visibility */}
                        <div className="space-y-3">
                              <label className="text-[8px] sm:text-[10px] font-black uppercase text-gray-400 tracking-widest block text-center sm:text-left">{t('visibility_label')}</label>
                             <div className="grid grid-cols-3 sm:grid-cols-1 gap-2 justify-items-center sm:justify-items-start">
                                {visibilityOptions.map(opt => {
                                    const Icon = opt.icon;
                                    const selected = visibilidad === opt.id;
                                    return (
                                        <div 
                                            key={opt.id}
                                            onClick={() => setVisibilidad(opt.id)}
                                            className={`flex flex-col sm:flex-row items-center sm:gap-4 p-2 rounded-xl cursor-pointer border-2 transition-all w-full ${selected ? 'border-red-600 bg-red-50/50' : 'border-gray-50 hover:border-red-100'}`}
                                        >
                                            <div className={`p-1.5 rounded-lg shrink-0 ${selected ? 'bg-red-600 text-white' : 'bg-white text-gray-300'}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="hidden sm:block">
                                                <p className={`text-[10px] font-black uppercase tracking-tight ${selected ? 'text-red-900' : 'text-gray-500'}`}>{opt.label}</p>
                                            </div>
                                            <div className="sm:hidden mt-1">
                                                 <p className={`text-[6px] font-black uppercase ${selected ? 'text-red-900' : 'text-gray-400'}`}>{opt.label}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                             </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 sm:py-6 rounded-2xl sm:rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] sm:text-base shadow-2xl transition-all active:scale-[0.98] ${loading ? 'bg-gray-200 text-gray-400 animate-pulse' : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-red-200'}`}
                    >
                        {loading ? t('uploading_work') : t('publish_gallery')}
                    </button>
                </form>
            </div>
        </div>
    );
}
