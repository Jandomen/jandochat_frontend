import React, { useState, useEffect } from "react";
import { MessageCircle, Send, MoreHorizontal, Heart, Share2, Edit3, Trash2, X as CloseIcon, User as UserIcon } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { useModal } from "../../context/ModalContext";
import { useNavigate } from "react-router-dom";
import ImageViewer from "../UI/ImageViewer";
import ReactionsModal from "../UI/ReactionsModal";

const EMOJIS = {
    brutal: "🔥",
    acuerdo: "💯",
    blown: "🤯",
    mirando: "👀",
    inteligente: "🧠",
    apoyo: "🚀",
    colaboro: "🤝",
    respeto: "🫡"
};

const REACTION_LABELS = {
    brutal: "Está brutal / tendencia",
    acuerdo: "Totalmente de acuerdo",
    blown: "Mind blown",
    mirando: "Estoy mirando / interesante",
    inteligente: "Inteligente",
    apoyo: "Apoyo este proyecto",
    colaboro: "Colaboro / me interesa participar",
    respeto: "Respeto"
};

export default function PostCard({ post, id, onReact, onComment, onReply, onDelete, onEdit, onShare, onDeleteComment, onEditComment }) {
    const { user } = useAuth();
    const { showPrompt, showConfirm } = useModal();
    const navigate = useNavigate();
    const [comentario, setComentario] = useState("");
    const [showComments, setShowComments] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [showWhoReacted, setShowWhoReacted] = useState(false);
    const [mediaFullscreen, setMediaFullscreen] = useState(false);

    useEffect(() => {
        if (!mediaFullscreen) return;

        const handleKeyDown = (e) => {
            const mediaArr = post.media || [];
            if (mediaArr.length === 0) return;

            // No manejar teclas cuando está en fullscreen (el ImageViewer las maneja)
            if (mediaFullscreen) return;

            if (e.key === "Escape") {
                setMediaFullscreen(false);
            } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                setCurrentMediaIndex((prev) => (prev < mediaArr.length - 1 ? prev + 1 : 0));
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                setCurrentMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaArr.length - 1));
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [mediaFullscreen, post.media]);

    const esDuenoPost = user?._id === post.usuario?._id;

    const miReaccion = post.reacciones?.find(r => r.usuario?._id === user?._id);
    const miReaccionTipo = miReaccion?.tipo;

    const handleReact = (tipo) => {
        onReact(post._id, tipo);
        setShowReactions(false);
    };

    const handleSubmitComment = (e) => {
        e.preventDefault();
        if (!comentario.trim()) return;

        if (replyTo) {
            onReply(post._id, replyTo.id, comentario);
            setReplyTo(null);
        } else {
            onComment(post._id, comentario);
        }
        setComentario("");
    };

    const handleShare = async () => {
        const comment = await showPrompt("Compartir Publicación", "¿Quieres agregar un comentario al compartir?");
        if (comment !== null) {
            onShare(post._id, comment);
        }
    };

    const handleEditPost = async () => {
        const nuevo = await showPrompt("Editar Publicación", "Modifica el contenido de tu post:", post.contenido);
        if (nuevo !== null && nuevo !== post.contenido) {
            onEdit(post._id, nuevo);
        }
        setShowOptions(false);
    };

    const handleDeletePost = async () => {
        const ok = await showConfirm("Eliminar Publicación", "¿Estás seguro de que deseas borrar esta publicación para siempre?");
        if (ok) {
            onDelete(post._id);
        }
        setShowOptions(false);
    };

    const handleEditCommentModal = async (c) => {
        const nuevo = await showPrompt("Editar Comentario", "Modifica tu comentario:", c.texto);
        if (nuevo !== null && nuevo !== c.texto) {
            onEditComment(post._id, c._id, nuevo);
        }
    };

    const handleDeleteCommentModal = async (cid) => {
        const ok = await showConfirm("Eliminar Comentario", "¿Borrar este comentario?");
        if (ok) {
            onDeleteComment(post._id, cid);
        }
    };

    const renderMedia = (mediaArr) => {
        if (!mediaArr || mediaArr.length === 0) return null;
        const item = mediaArr[currentMediaIndex] || mediaArr[0];

        if (!item) return null;

        const tipoMedia = item.tipo || (item.url?.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'imagen');

        return (
            <div className="relative group/media mt-4">
                <div
                    className="relative bg-gray-100 overflow-hidden cursor-pointer"
                    onClick={() => mediaArr.length > 0 && setMediaFullscreen(true)}
                >
                    {tipoMedia === "video" ? (
                        <div className="aspect-video flex items-center justify-center bg-black">
                            <video src={item.url} controls className="max-w-full max-h-[250px] sm:max-h-[600px] object-contain" />
                        </div>
                    ) : (
                        <img src={item.url} className="w-full max-h-[250px] sm:max-h-[600px] object-contain bg-gray-100" alt="" />
                    )}
                    {mediaArr.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {mediaArr.map((_, idx) => (
                                <div key={idx} className={`h-2 rounded-full transition-all ${idx === currentMediaIndex ? 'w-6 bg-red-600' : 'w-2 bg-white/60'}`} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div id={id} className="bg-white rounded-xl sm:rounded-[2.5rem] border border-gray-100 mb-2 sm:mb-6 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-1.5 py-1 sm:p-4 flex items-start justify-between bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <div className="flex items-center gap-1.5 sm:gap-4">
                    <div className="relative cursor-pointer" onClick={() => navigate(`/usuarios/${post.usuario._id}`)}>
                        <img
                            src={post.usuario?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                            className="w-7 h-7 sm:w-12 sm:h-12 rounded-full object-cover border border-red-50 shadow-sm transition-transform active:scale-95"
                            alt=""
                        />
                    </div>
                    <div>
                        <h4 className="font-black text-gray-900 text-[10px] sm:text-base cursor-pointer hover:underline leading-none mb-0.5" onClick={() => navigate(`/usuarios/${post.usuario._id}`)}>
                            {post.usuario?.nombre}
                        </h4>
                        <div className="flex items-center gap-1 text-gray-400 text-[7px] sm:text-xs">
                            <span className="font-bold">{new Date(post.createdAt).toLocaleDateString()}</span>
                            {post.isShared && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5 uppercase font-black text-[7px] tracking-tighter text-red-400">
                                        Viral
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="p-1 px-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                        <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    {showOptions && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl z-50 overflow-hidden py-1 border border-gray-100">
                            {esDuenoPost && (
                                <>
                                    <button
                                        onClick={handleEditPost}
                                        className="w-full px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 sm:gap-3"
                                    >
                                        <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Editar publicación
                                    </button>
                                    <button
                                        onClick={handleDeletePost}
                                        className="w-full px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-all flex items-center gap-2 sm:gap-3"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Eliminar
                                    </button>
                                    <div className="border-t border-gray-100 my-1"></div>
                                </>
                            )}
                            <button onClick={() => { navigate(`/usuarios/${post.usuario._id}`); setShowOptions(false); }} className="w-full px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 sm:gap-3">
                                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Ver perfil
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-3 py-2 sm:p-5">
                {post.contenidoCompartir && (
                    <p className="text-gray-700 text-[10px] sm:text-base mb-2 font-medium">
                        {post.contenidoCompartir}
                    </p>
                )}

                {post.isShared && post.sharedFrom ? (
                    <div className="border border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-4 mb-2 sm:mb-4 bg-gray-50/50">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-3 cursor-pointer" onClick={() => navigate(`/usuarios/${post.sharedFrom.usuario?._id}`)}>
                            <img
                                src={post.sharedFrom.usuario?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                                className="w-4 h-4 sm:w-8 sm:h-8 rounded-full object-cover"
                                alt=""
                            />
                            <div>
                                <h5 className="text-[10px] sm:text-sm font-medium text-gray-900 hover:text-red-600">{post.sharedFrom.usuario?.nombre}</h5>
                            </div>
                        </div>
                        <p className="text-gray-600 text-[10px] sm:text-sm leading-relaxed mb-1.5 sm:mb-3">{post.sharedFrom.contenido}</p>
                        {renderMedia(post.sharedFrom.media)}
                    </div>
                ) : (
                    <>
                        <p className="text-gray-800 text-[11px] sm:text-base leading-snug whitespace-pre-wrap font-medium">{post.contenido}</p>
                        {renderMedia(post.media)}
                    </>
                )}
            </div>

            {/* Stats */}
            {(post.reacciones?.length > 0 || post.comentarios?.length > 0) && (
                <div className="px-2 py-1 sm:py-3 flex items-center justify-between text-[8px] sm:text-xs text-gray-400 border-t border-b border-gray-50 bg-gray-50/10">
                    <div className="flex items-center gap-1 sm:gap-2">
                        {post.reacciones?.length > 0 && (
                            <div className="flex items-center gap-1">
                                <div className="flex -space-x-1">
                                    {Array.from(new Set(post.reacciones.map(r => r.tipo))).slice(0, 3).map(tipo => (
                                        <span key={tipo} className="w-3 h-3 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center text-[6px] sm:text-xs shadow-sm border border-gray-100 leading-none">{EMOJIS[tipo]}</span>
                                    ))}
                                </div>
                                <span className="cursor-pointer hover:text-red-600 font-bold ml-0.5" onClick={() => post.reacciones.length > 0 && setShowWhoReacted(true)}>
                                    {post.reacciones?.length}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 sm:gap-4 text-[7px] sm:text-xs font-black uppercase tracking-widest">
                        <span className="cursor-pointer hover:text-red-600" onClick={() => setShowComments(!showComments)}>{post.comentarios?.length || 0} Opiniones</span>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="px-1 sm:px-4 py-0.5 sm:py-2 flex items-center justify-between border-t border-gray-100">
                <div className="flex items-center gap-0.5 sm:gap-2 flex-1">
                    <div className="relative flex-1">
                        <button
                            onClick={() => setShowReactions(!showReactions)}
                            className={`w-full flex items-center justify-center gap-1 sm:gap-2 py-1 sm:py-3 rounded-lg transition-all text-[8px] sm:text-sm font-black uppercase tracking-tighter ${miReaccionTipo ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            {miReaccionTipo ? (
                                <>
                                    <span className="text-[10px] sm:text-lg leading-none">{EMOJIS[miReaccionTipo]}</span>
                                    <span className="truncate">{REACTION_LABELS[miReaccionTipo].split(' ')[0]}</span>
                                </>
                            ) : (
                                <>
                                    <Heart className={`w-3 h-3 sm:w-5 sm:h-5 ${showReactions ? 'fill-red-600 text-red-600 transition-colors' : ''}`} />
                                    <span>Me late</span>
                                </>
                            )}
                        </button>

                        {showReactions && (
                            <div className="absolute bottom-full left-0 mb-1 bg-white/95 backdrop-blur-md border border-red-50 p-1 rounded-xl shadow-2xl flex gap-1 z-50 animate-in slide-in-from-bottom-2 duration-200">
                                {Object.entries(EMOJIS).map(([tipo, emoji]) => (
                                    <button
                                        key={tipo}
                                        onClick={(e) => { e.stopPropagation(); handleReact(tipo); }}
                                        title={REACTION_LABELS[tipo]}
                                        className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-xl hover:bg-red-50 rounded-lg transition-all hover:scale-125 hover:rotate-6 active:scale-90"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setShowComments(!showComments)}
                        className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-1 sm:py-3 rounded-lg transition-all text-[8px] sm:text-sm font-black uppercase tracking-tighter ${showComments ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <MessageCircle className="w-3 h-3 sm:w-5 sm:h-5" />
                        <span>Opinar</span>
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-1 sm:py-3 rounded-lg transition-all text-[8px] sm:text-xs font-black uppercase tracking-tighter text-gray-500 hover:bg-gray-100 group/share"
                    >
                        <Share2 className="w-3 h-3 sm:w-5 sm:h-5 group-hover/share:translate-x-1 transition-transform" />
                        <span>Viral</span>
                    </button>
                </div>
            </div>

            {/* Comments */}
            {showComments && (
                <div className="px-3 sm:px-5 pb-3 sm:pb-5 pt-1.5 sm:pt-3 bg-gray-50 border-t border-gray-200">
                    <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                        {post.comentarios?.map((c) => {
                            const esDuenoComentario = user?._id === c.usuario?._id;

                            return (
                                <div key={c._id} id={`comment-${c._id}`} className="flex gap-2 sm:gap-3">
                                    <img src={c.usuario?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover cursor-pointer flex-shrink-0" onClick={() => navigate(`/usuarios/${c.usuario?._id}`)} alt="" />
                                    <div className="flex-1">
                                        <div className="bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                                            <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                                                <p className="text-xs sm:text-sm font-medium text-gray-900 cursor-pointer hover:underline" onClick={() => navigate(`/usuarios/${c.usuario?._id}`)}>{c.usuario?.nombre}</p>
                                            </div>
                                            <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">{c.texto}</p>
                                        </div>
                                        <div className="flex gap-3 sm:gap-4 mt-1 sm:mt-1.5 ml-1 sm:ml-2 items-center">
                                            <button onClick={() => setReplyTo({ id: c._id, name: c.usuario?.nombre })} className="text-[9px] sm:text-[11px] text-gray-400 hover:text-red-600 font-black uppercase tracking-tighter">Responder</button>
                                            <span className="text-[9px] sm:text-[10px] text-gray-200">|</span>
                                            <span className="text-[9px] sm:text-[10px] text-gray-300 font-medium">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                                            {(esDuenoPost || esDuenoComentario) && (
                                                <div className="flex gap-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {esDuenoComentario && (
                                                        <button
                                                            onClick={() => handleEditCommentModal(c)}
                                                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors"
                                                            title="Editar comentario"
                                                        >
                                                            <Edit3 className="w-3 h-3" />
                                                            <span className="hidden sm:inline">Editar</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteCommentModal(c._id)}
                                                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Eliminar comentario"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        <span className="hidden sm:inline">Eliminar</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Render replies (respuestas) */}
                                        {c.respuestas && c.respuestas.length > 0 && (
                                            <div className="mt-3 ml-4 space-y-3 border-l-2 border-red-100 pl-4">
                                                {c.respuestas.map((r) => (
                                                    <div key={r._id} id={`comment-${r._id}`} className="flex gap-2">
                                                        <img
                                                            src={r.usuario?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                                                            className="w-6 h-6 rounded-full object-cover cursor-pointer flex-shrink-0"
                                                            onClick={() => navigate(`/usuarios/${r.usuario?._id}`)}
                                                            alt=""
                                                        />
                                                        <div className="flex-1">
                                                            <div className="bg-gray-50 p-2 rounded-xl rounded-tl-none border border-gray-100">
                                                                <p className="text-xs font-medium text-gray-900 cursor-pointer hover:underline" onClick={() => navigate(`/usuarios/${r.usuario?._id}`)}>
                                                                    {r.usuario?.nombre}
                                                                </p>
                                                                <p className="text-gray-600 text-xs leading-relaxed mt-0.5">{r.texto}</p>
                                                            </div>
                                                            <div className="flex gap-3 mt-0.5 ml-1">
                                                                <button onClick={() => setReplyTo({ id: c._id, name: r.usuario?.nombre })} className="text-[10px] text-gray-400 hover:text-red-600 font-medium">Responder</button>
                                                                <span className="text-[10px] text-gray-300">•</span>
                                                                <span className="text-[10px] text-gray-400">{new Date(r.createdAt).toLocaleTimeString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSubmitComment} className="relative mt-4">
                        {replyTo && (
                            <div className="absolute bottom-full left-0 mb-2 flex items-center justify-between w-full bg-red-600 text-white px-4 py-2 rounded-t-xl text-xs font-medium">
                                <span>Respondiendo a @{replyTo.name}</span>
                                <button type="button" onClick={() => setReplyTo(null)}><CloseIcon className="w-3 h-3" /></button>
                            </div>
                        )}
                        <div className="flex gap-2 items-center bg-white p-1.5 rounded-full border border-gray-100 shadow-inner">
                            <input
                                type="text"
                                placeholder={replyTo ? `Responde a ${replyTo.name}...` : "Escribe un comentario..."}
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                                className="flex-1 px-3 py-1.5 bg-transparent text-[11px] outline-none font-medium"
                            />
                            <button type="submit" disabled={!comentario.trim()} className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-40 transition-all active:scale-95 shadow-lg">
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Fullscreen Media Modal */}
            {mediaFullscreen && post.media && post.media.length > 0 && (
                <ImageViewer
                    media={post.media}
                    currentIndex={currentMediaIndex}
                    onClose={() => setMediaFullscreen(false)}
                    onNext={() => setCurrentMediaIndex((prev) => (prev < post.media.length - 1 ? prev + 1 : 0))}
                    onPrev={() => setCurrentMediaIndex((prev) => (prev > 0 ? prev - 1 : post.media.length - 1))}
                />
            )}

            {/* Reactions List Modal */}
            {showWhoReacted && post.reacciones && post.reacciones.length > 0 && (
                <ReactionsModal
                    reactions={post.reacciones}
                    onClose={() => setShowWhoReacted(false)}
                />
            )}
        </div>
    );
}
