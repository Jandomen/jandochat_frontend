import React, { useState, useRef } from "react";
import { Send, Smile, Plus, Trash2, Scissors, Loader2 } from "lucide-react";
import { uploadMedia } from "../../api/posts";
import MediaPickerModal from "../UI/MediaPickerModal";

export default function CreatePost({ onPost }) {
    const [contenido, setContenido] = useState("");
    const [mediaList, setMediaList] = useState([]); // [{url, tipo, file}]
    const [errorStatus, setErrorStatus] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojis, setShowEmojis] = useState(false);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const commonEmojis = ["😊", "😂", "🥰", "😎", "🔥", "✨", "🙌", "🤔", "👍", "❤️", "⚡", "🚀", "🌈", "👀", "💯"];

    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (mediaList.length + files.length > 10) {
            setErrorStatus("Máximo 10 elementos permitidos");
            return;
        }

        const newMedia = files.map(file => {
            const url = URL.createObjectURL(file);
            const tipo = file.type.startsWith("video/") ? "video" : "imagen";

            return { url, tipo, file };
        });

        setMediaList([...mediaList, ...newMedia]);
        setErrorStatus("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!contenido.trim() && mediaList.length === 0) return;

        setIsUploading(true);
        try {
            let mediaFinal = [];

            const filesToUpload = mediaList.filter(m => m.file);
            if (filesToUpload.length > 0) {
                const uploaded = await uploadMedia(filesToUpload.map(m => m.file));
                mediaFinal = uploaded;
            }

            const mediaSinFile = mediaList.filter(m => !m.file).map(({ url, tipo }) => ({ url, tipo }));
            mediaFinal = [...mediaFinal, ...mediaSinFile];

            onPost({ contenido, media: mediaFinal });
            setContenido("");
            setMediaList([]);
            setErrorStatus("");
        } catch (error) {
            console.error("Error uploading:", error);
            setErrorStatus("Error al subir archivos");
        } finally {
            setIsUploading(false);
        }
    };

    const removeMedia = (index) => {
        const item = mediaList[index];
        if (item.url.startsWith("blob:")) {
            URL.revokeObjectURL(item.url);
        }
        setMediaList(mediaList.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white rounded-2xl sm:rounded-[3.5rem] border border-red-50 p-3 sm:p-10 shadow-xl shadow-red-100/10 mb-4 sm:mb-12 relative overflow-hidden group">
            <MediaPickerModal 
                isOpen={isPickerOpen} 
                onClose={() => setIsPickerOpen(false)} 
                onSelect={(type) => {
                    if (type === 'camera') {
                        fileInputRef.current.setAttribute('capture', 'environment');
                    } else {
                        fileInputRef.current.removeAttribute('capture');
                    }
                    setTimeout(() => fileInputRef.current.click(), 100);
                }}
                filter={["camera", "gallery"]}
            />
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 rounded-full -mr-24 -mt-24 transition-transform group-hover:scale-125"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-1.5 sm:mb-8">
                    <h3 className="text-[10px] sm:text-2xl font-black text-gray-900 tracking-tight uppercase">Publicar</h3>
                    {errorStatus && <span className="text-[7px] sm:text-[10px] font-black uppercase text-red-500 bg-red-50 px-2 sm:px-4 py-1 sm:py-2 rounded-full animate-bounce">{errorStatus}</span>}
                </div>

                <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-8">
                    <textarea
                        className="w-full h-12 sm:h-40 p-2 sm:p-8 bg-gray-50/50 rounded-lg sm:rounded-[3rem] border-transparent focus:bg-white focus:ring-4 sm:focus:ring-8 focus:ring-red-50 outline-none text-[12px] sm:text-xl transition-all resize-none font-medium placeholder:text-gray-300"
                        placeholder="¿Qué tienes en mente?"
                        value={contenido}
                        onChange={(e) => setContenido(e.target.value)}
                    />

                    {/* Media Preview Grid */}
                    {mediaList.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {mediaList.map((item, index) => (
                                <div key={index} className="relative flex-shrink-0 w-32 h-32 rounded-[1.5rem] overflow-hidden border-2 border-red-100 group/item">
                                    {item.tipo === "imagen" ? (
                                        <img src={item.url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <video src={item.url} className="w-full h-full object-cover bg-black" muted />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(index)}
                                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-xl shadow-lg opacity-0 group-hover/item:opacity-100 transition-all scale-75 group-hover/item:scale-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {item.tipo === "video" && (
                                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[8px] text-white font-black uppercase">
                                            Max 20s
                                        </div>
                                    )}
                                </div>
                            ))}
                            {mediaList.length < 10 && (
                                <button
                                    type="button"
                                    onClick={() => setIsPickerOpen(true)}
                                    className="w-32 h-32 rounded-[1.5rem] bg-red-50/30 border-2 border-dashed border-red-200 flex flex-col items-center justify-center text-red-300 hover:bg-red-50 hover:text-red-600 transition-all gap-2"
                                >
                                    <Plus className="w-8 h-8" />
                                    <span className="text-[8px] font-black uppercase">Añadir más</span>
                                </button>
                            )}
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        accept="image/*,video/*"
                        className="hidden"
                    />

                    <div className="flex items-center justify-between">
                        <div className="flex gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => setIsPickerOpen(true)}
                                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-4 rounded-lg sm:rounded-2xl bg-gray-50 text-gray-400 hover:text-red-500 font-black text-[8px] sm:text-[10px] uppercase tracking-widest transition-all shadow-sm"
                            >
                                <Scissors className="w-3.5 h-3.5 sm:w-5 sm:h-5 -rotate-90" />
                                <span className="hidden sm:inline">Media</span>
                            </button>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowEmojis(!showEmojis)}
                                    className={`p-2 sm:p-4 transition-all rounded-lg sm:rounded-2xl ${showEmojis ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-50 text-gray-300 hover:text-red-500'}`}
                                >
                                    <Smile className="w-4 h-4 sm:w-6 sm:h-6" />
                                </button>

                                {showEmojis && (
                                    <div className="absolute bottom-full left-0 mb-4 p-4 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-red-50 grid grid-cols-5 gap-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                                        {commonEmojis.map(emoji => (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => {
                                                    setContenido(prev => prev + emoji);
                                                    setShowEmojis(false);
                                                }}
                                                className="text-2xl hover:scale-125 transition-transform p-1"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={(!contenido.trim() && mediaList.length === 0) || isUploading}
                            className="flex items-center gap-2 sm:gap-4 px-4 py-2 sm:px-10 sm:py-5 bg-red-600 text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-lg sm:rounded-[1.5rem] shadow-lg shadow-red-200 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <span className="truncate tracking-tighter uppercase">Publicar</span>
                                    <Send className="w-3.5 h-3.5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
