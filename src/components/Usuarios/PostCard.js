import React, { useState, useEffect, useRef } from "react";
import { Mic, Paperclip, Trash } from "lucide-react";
import useMentions from "../../hooks/useMentions";
import { MessageCircle, Send, MoreHorizontal, Heart, Share2, Edit3, Trash2, X as CloseIcon, User as UserIcon, Bookmark, Flag } from "lucide-react";
import { reportPost, trackAdClick } from "../../api/posts";
import { userSearch } from "../../api/user";
import useAuth from "../../hooks/useAuth";
import { useModal } from "../../context/ModalContext";
import { useNavigate } from "react-router-dom";
import ImageViewer from "../UI/ImageViewer";
import ReactionsModal from "../UI/ReactionsModal";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

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

const REACTION_LABELS = (t) => ({
    brutal: t('reaction_brutal') || "Está brutal",
    acuerdo: t('reaction_acuerdo') || "Totalmente de acuerdo",
    blown: t('reaction_blown') || "Mind blown",
    mirando: t('reaction_mirando') || "Interesante",
    inteligente: t('reaction_inteligente') || "Inteligente",
    apoyo: t('reaction_apoyo') || "Apoyo",
    colaboro: t('reaction_colaboro') || "Colaboro",
    respeto: t('reaction_respeto') || "Respeto"
});

export default function PostCard({ post, id, onReact = ()=>{}, onComment = ()=>{}, onReply = ()=>{}, onDelete = ()=>{}, onEdit = ()=>{}, onShare = ()=>{}, onDeleteComment = ()=>{}, onEditComment = ()=>{}, onBookmark = ()=>{} }) {
    const { t } = useLanguage();
    const { user } = useAuth();
    const isBookmarked = user?.guardados?.includes(post._id);
    const { showPrompt, showConfirm } = useModal();
    const navigate = useNavigate();
    const { success, error } = useToast();
    const [comentario, setComentario] = useState("");
    const [showComments, setShowComments] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [showWhoReacted, setShowWhoReacted] = useState(false);
    const [mediaFullscreen, setMediaFullscreen] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentText, setEditCommentText] = useState("");
    const [commentFiles, setCommentFiles] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const commentFileInputRef = useRef(null);
    const recordingIntervalRef = useRef(null);

    const {
        suggestions,
        showSuggestions,
        handleTextChange,
        selectSuggestion,
        loadUsers
    } = useMentions();

    useEffect(() => {
        if (showComments) loadUsers();
    }, [showComments, loadUsers]);

    const handleCommentInputChange = (e) => {
        const val = e.target.value;
        setComentario(val);
        handleTextChange(val, e.target.selectionStart);
    };

    const handleSelectMentionComment = (u) => {
        selectSuggestion(u, comentario, (newText) => {
            setComentario(newText);
        });
    };

    const renderContentWithMentions = (text, mentionsArray = []) => {
        if (!text) return null;
        const parts = text.split(/(@[a-zA-Z0-9_.áéíóúÁÉÍÓÚñÑ-]+)/g);
        const allAvailableMentions = [...(mentionsArray || []), ...(post.mentions || [])];

        return parts.map((part, index) => {
            if (part.startsWith("@") && part.length > 1) {
                const username = part.slice(1);
                
                // Aggressive normalization for comparison
                const normalize = (s) => (s || "").toLowerCase().replace(/[^a-z0-9áéíóúñ]/g, "");
                const normalizedTag = normalize(username);

                const mentionedUser = allAvailableMentions?.find(m => 
                    normalize(m.username) === normalizedTag ||
                    normalize(m.nombre) === normalizedTag ||
                    normalize(m.nombre).includes(normalizedTag) ||
                    normalizedTag.includes(normalize(m.nombre))
                );

                return (
                    <span 
                        key={index} 
                        onClick={async (e) => {
                            e.stopPropagation();
                            if (mentionedUser) {
                                navigate(`/usuarios/${mentionedUser._id}`);
                            } else {
                                // Fallback: try to find user by name via API
                                try {
                                    const results = await userSearch(username);
                                    // Normalize results and tag for comparison
                                    const normalizeForNav = (s) => (s || "").toLowerCase().replace(/[^a-z0-9áéíóúñ]/g, "");
                                    const nTag = normalizeForNav(username);
                                    
                                    const found = results.find(u => 
                                        normalizeForNav(u.username) === nTag || 
                                        normalizeForNav(u.nombre) === nTag ||
                                        normalizeForNav(u.nombre).includes(nTag) ||
                                        nTag.includes(normalizeForNav(u.nombre))
                                    );

                                    if (found) {
                                        navigate(`/usuarios/${found._id}`);
                                    } else {
                                        navigate(`/buscar?q=${username}`);
                                    }
                                } catch (err) {
                                    navigate(`/buscar?q=${username}`);
                                }
                            }
                        }}
                        className="text-red-600 font-black cursor-pointer hover:underline decoration-red-400 decoration-2 underline-offset-4"
                    >
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

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

    const postUserId = post.usuario?._id || (typeof post.usuario === 'string' ? post.usuario : null);
    const esDuenoPost = user?._id === postUserId;

    const miReaccion = post.reacciones?.find(r => r.usuario?._id === user?._id);
    const miReaccionTipo = miReaccion?.tipo;

    const handleReact = (tipo) => {
        onReact(post._id, tipo);
        setShowReactions(false);
    };

    const handleShare = async () => {
        const comment = await showPrompt(t('share_post_title'), t('share_post_prompt'));
        if (comment !== null) {
            onShare(post._id, comment);
        }
    };

    const handleEditPost = async () => {
        const nuevo = await showPrompt(t('edit_post_title'), t('edit_post_prompt'), post.contenido);
        if (nuevo !== null && nuevo !== post.contenido) {
            onEdit(post._id, nuevo);
        }
        setShowOptions(false);
    };

    const handleOuterDeletePost = async () => {
        const ok = await showConfirm(t('delete_post_title'), t('confirm_delete_post'));
        if (ok) {
            onDelete(post._id);
        }
        setShowOptions(false);
    };

    const handleEditCommentModal = (c) => {
        setEditingCommentId(c._id);
        setEditCommentText(c.texto);
    };

    const handleSaveCommentEdit = async (commentId) => {
        if (!editCommentText.trim()) return;
        try {
            await onEditComment(post._id, commentId, editCommentText);
            setEditingCommentId(null);
            setEditCommentText("");
            success(t('comment_updated_success'));
        } catch (err) {
            error(t('error_editing') || "Error al editar");
        }
    };

    const handleDeleteCommentModal = async (cid) => {
        const ok = await showConfirm(t('delete_comment_title'), t('confirm_delete_comment'));
        if (ok) {
            onDeleteComment(post._id, cid);
        }
    };

    const handleReportPost = async () => {
        const motivo = await showPrompt(t('report_post_title'), t('report_post_prompt'));
        if (motivo) {
            try {
                await reportPost(post._id, motivo);
                success(t('report_sent'));
            } catch (err) {
                error(t('report_error'));
            }
        }
        setShowOptions(false);
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            setRecordingTime(0);

            mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
                stream.getTracks().forEach(t => t.stop());
                clearInterval(recordingIntervalRef.current);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);

            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 59) {
                        handleStopRecording();
                        return 60;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err) {
            error(t('mic_access_error'));
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordingIntervalRef.current);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setCommentFiles(prev => [...prev, ...files]);
    };

    const removeFile = (idx) => {
        setCommentFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSendComment = async (e) => {
        e.preventDefault();
        if (!comentario.trim() && commentFiles.length === 0 && !audioBlob) return;

        const formData = new FormData();
        formData.append("texto", comentario);
        commentFiles.forEach(f => formData.append("media", f));
        if (audioBlob) {
            formData.append("media", audioBlob, `voice_note_${Date.now()}.webm`);
        }

        try {
            await onComment(post._id, formData);
            setComentario("");
            setCommentFiles([]);
            setAudioBlob(null);
            setReplyTo(null);
        } catch (err) {
            error(t('comment_send_error'));
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!comentario.trim() && commentFiles.length === 0 && !audioBlob) return;

        const formData = new FormData();
        formData.append("texto", comentario);
        commentFiles.forEach(f => formData.append("media", f));
        if (audioBlob) {
            formData.append("media", audioBlob, `voice_note_${Date.now()}.webm`);
        }

        try {
            await onReply(post._id, replyTo.id, formData);
            setComentario("");
            setCommentFiles([]);
            setAudioBlob(null);
            setReplyTo(null);
        } catch (err) {
            error(t('reply_send_error'));
        }
    };

    const renderMedia = (mediaArr) => {
        if (!mediaArr || mediaArr.length === 0) return null;

        const maxDisplay = 5;
        const displayItems = mediaArr.slice(0, maxDisplay);
        const remaining = mediaArr.length - maxDisplay;
        const total = mediaArr.length;

        const gridCols = total === 1 ? 'grid-cols-1' : total <= 3 ? 'grid-cols-3' : 'grid-cols-3';

        const renderMediaItem = (item, idx, isThumb = false) => {
            if (!item || !item.url) return null;
            const isVid = item.tipo === "video" || item.url.includes("/video/upload/");

            return (
                <div
                    key={idx}
                    className={`relative group/item overflow-hidden rounded-xl cursor-pointer bg-gray-100 ${isThumb ? '' : 'aspect-square'}`}
                    onClick={(e) => { e.stopPropagation(); setMediaFullscreen(true); setCurrentMediaIndex(idx); }}
                >
                    {isVid ? (
                        <video
                            src={item.url}
                            className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                            muted
                            playsInline
                        />
                    ) : (
                        <img
                            src={item.url}
                            className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                            alt=""
                        />
                    )}

                    {isVid && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <polygon points="8,5 19,12 8,19" />
                                </svg>
                            </div>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors duration-200" />
                </div>
            );
        };

        const content = (
            <div className="mt-3 sm:mt-4">
                <div className={`grid ${gridCols} gap-1 sm:gap-1.5 rounded-2xl overflow-hidden`}>
                    {displayItems.map((item, idx) => (
                        <div key={idx} className="relative">
                            {renderMediaItem(item, idx)}
                            {idx === maxDisplay - 1 && remaining > 0 && (
                                <div
                                    className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); setMediaFullscreen(true); setCurrentMediaIndex(idx); }}
                                >
                                    <span className="text-white text-2xl sm:text-3xl font-black">+{remaining}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );

        if (post.type === 'ad' && post.webUrl) {
            return (
                <a
                    href={post.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                    onClick={() => trackAdClick(post._id)}
                >
                    {content}
                </a>
            );
        }

        return content;
    };

    const renderCommentMedia = (mediaArr) => {
        if (!mediaArr || mediaArr.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-2 mt-2 max-w-full">
                {mediaArr.map((m, idx) => {
                    if (m.tipo === "audio") {
                        return (
                            <div key={idx} className="bg-red-50 p-1 sm:p-2 rounded-xl border border-red-100 flex items-center gap-1 sm:gap-2 max-w-full overflow-hidden shadow-sm">
                                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 fill-red-600 animate-pulse shrink-0" />
                                <audio src={m.url} controls className="h-6 sm:h-8 scale-75 sm:scale-90 origin-left" />
                            </div>
                        );
                    }
                    if (m.tipo === "video") {
                        return (
                            <video key={idx} src={m.url} controls className="max-w-[150px] sm:max-w-[200px] max-h-[100px] sm:max-h-[150px] rounded-lg border border-gray-100 shadow-sm" />
                        );
                    }
                    return (
                        <img key={idx} src={m.url} className="max-w-[100px] sm:max-w-[150px] max-h-[100px] sm:max-h-[150px] rounded-lg object-cover cursor-pointer border border-gray-100 shadow-sm hover:scale-105 transition-transform" alt="" onClick={() => { setCurrentMediaIndex(idx); setMediaFullscreen(true); }} />
                    );
                })}
            </div>
        );
    };

    return (
        <div id={id} className="bg-white rounded-xl sm:rounded-[2.5rem] border border-gray-100 mb-2 sm:mb-6 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-2 py-2 sm:p-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="relative cursor-pointer" onClick={() => post.type !== 'ad' && postUserId && navigate(`/usuarios/${postUserId}`)}>
                        <img
                            src={post.type === 'ad' ? (post.fotoPerfil || "/assets/company-default.png") : (post.usuario?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png")}
                            className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover border shadow-sm transition-transform active:scale-95 ${post.type === 'ad' ? 'border-orange-500' : 'border-red-50'}`}
                            alt=""
                        />
                        {post.type === 'ad' && (
                            <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white text-[6px] sm:text-[8px] font-black px-1 rounded-sm uppercase tracking-tighter shadow-sm border border-white">AD</div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-black text-gray-900 text-[11px] sm:text-base cursor-pointer hover:underline leading-none mb-0.5" onClick={() => post.type !== 'ad' && postUserId && navigate(`/usuarios/${postUserId}`)}>
                            {post.type === 'ad' ? post.empresa : post.usuario?.nombre}
                        </h4>
                        <div className="flex items-center gap-1 text-gray-400 text-[8px] sm:text-xs">
                            <span className="font-bold">{new Date(post.createdAt).toLocaleDateString()}</span>
                            {post.isShared && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5 uppercase font-black text-[7px] tracking-tighter text-red-400">
                                        {t('viral_label')}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="relative">
                    {post.type !== 'ad' && (
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="p-1.5 px-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                            <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    )}
                    {showOptions && post.type !== 'ad' && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl z-50 overflow-hidden py-1 border border-gray-100">
                            {esDuenoPost && (
                                <>
                                    <button
                                        onClick={handleEditPost}
                                        className="w-full px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 sm:gap-3"
                                    >
                                        <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t('edit')}
                                    </button>
                                    <button
                                        onClick={handleOuterDeletePost}
                                        className="w-full px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-all flex items-center gap-2 sm:gap-3"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t('delete')}
                                    </button>
                                    <div className="border-t border-gray-100 my-1"></div>
                                </>
                            )}
                            <button onClick={() => { if(postUserId) navigate(`/usuarios/${postUserId}`); setShowOptions(false); }} className="w-full px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 sm:gap-3">
                                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t('view_profile')}
                            </button>
                            {!esDuenoPost && (
                                <button
                                    onClick={handleReportPost}
                                    className="w-full px-3 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm text-amber-600 hover:bg-amber-50 transition-all flex items-center gap-2 sm:gap-3"
                                >
                                    <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t('report')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className={`px-3 py-3 sm:p-5 text-center sm:text-left ${post.type === 'ad' ? 'bg-orange-50/20' : ''}`}>
                {post.contenidoCompartir && (
                    <p className="text-gray-700 text-[10px] sm:text-base mb-3 font-medium">
                        {renderContentWithMentions(post.contenidoCompartir, post.mentions)}
                    </p>
                )}

                {post.isShared && post.sharedFrom ? (
                    <div className="border border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-4 mb-3 sm:mb-4 bg-gray-50/50">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 cursor-pointer justify-center sm:justify-start" onClick={() => {
                            const sid = post.sharedFrom.usuario?._id || (typeof post.sharedFrom.usuario === 'string' ? post.sharedFrom.usuario : null);
                            if(sid) navigate(`/usuarios/${sid}`);
                        }}>
                            <img
                                src={post.sharedFrom.usuario?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover shadow-sm"
                                alt=""
                            />
                            <div>
                                <h5 className="text-[10px] sm:text-sm font-black text-gray-900 hover:text-red-600 uppercase tracking-tighter">{post.sharedFrom.usuario?.nombre}</h5>
                            </div>
                        </div>
                        <p className="text-gray-600 text-[10px] sm:text-sm leading-relaxed mb-3 sm:mb-3 font-medium">{renderContentWithMentions(post.sharedFrom.contenido, post.sharedFrom.mentions)}</p>
                        <div className="flex justify-center">
                            {renderMedia(post.sharedFrom.media)}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col items-center sm:items-start">
                            {post.type === 'ad' && (
                                <div className="mb-2.5">
                                    <span className="bg-orange-500 text-white text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full shadow-lg shadow-orange-100">
                                        {t('sponsored')}
                                    </span>
                                </div>
                            )}
                            {post.categoria && post.categoria !== "general" && post.type !== 'ad' && (
                                <div className="mb-2.5">
                                    <span className="bg-red-600 text-white text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full shadow-lg shadow-red-100">
                                        {post.categoria}
                                    </span>
                                </div>
                            )}
                            {post.titulo && (
                                <h3 className="text-[15px] sm:text-3xl font-black text-gray-900 tracking-tighter mb-2 leading-tight uppercase">
                                    {post.titulo}
                                </h3>
                            )}
                            <p className="text-gray-800 text-[11px] sm:text-base leading-snug whitespace-pre-wrap font-medium">
                                {renderContentWithMentions(post.contenido, post.mentions)}
                            </p>
                            <div className="w-full flex justify-center mt-2">
                                {renderMedia(post.media)}
                            </div>
                        </div>
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
                        <span className="cursor-pointer hover:text-red-600" onClick={() => setShowComments(!showComments)}>{post.comentarios?.length || 0} {t('opinions')}</span>
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
                                    <span className="truncate">{REACTION_LABELS(t)[miReaccionTipo]?.split(' ')[0]}</span>
                                </>
                            ) : (
                                <>
                                    <Heart className={`w-3 h-3 sm:w-5 sm:h-5 ${showReactions ? 'fill-red-600 text-red-600 transition-colors' : ''}`} />
                                    <span>{t('me_late')}</span>
                                </>
                            )}
                        </button>

                        {showReactions && (
                            <div className="absolute bottom-full left-0 mb-1 bg-white/95 backdrop-blur-md border border-red-50 p-1 rounded-xl shadow-2xl flex gap-1 z-50 animate-in slide-in-from-bottom-2 duration-200">
                                {Object.entries(EMOJIS).map(([tipo, emoji]) => (
                                    <button
                                        key={tipo}
                                        onClick={(e) => { e.stopPropagation(); handleReact(tipo); }}
                                        title={REACTION_LABELS(t)[tipo]}
                                        className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center text-sm sm:text-xl hover:bg-red-50 rounded-lg transition-all hover:scale-125 hover:rotate-6 active:scale-90"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => post.permitirComentarios !== false ? setShowComments(!showComments) : null}
                        className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-1 sm:py-3 rounded-lg transition-all text-[8px] sm:text-sm font-black uppercase tracking-tighter ${showComments ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:bg-gray-100'} ${post.permitirComentarios === false ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                        <MessageCircle className="w-3 h-3 sm:w-5 sm:h-5" />
                        <span>{post.permitirComentarios === false ? t('comments_off') : t('react_comment')}</span>
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-1 sm:py-3 rounded-lg transition-all text-[8px] sm:text-xs font-black uppercase tracking-tighter text-gray-500 hover:bg-gray-100 group/share"
                    >
                        <Share2 className="w-3 h-3 sm:w-5 sm:h-5 group-hover/share:translate-x-1 transition-transform" />
                        <span>{t('react_viral')}</span>
                    </button>

                    <button
                        onClick={() => onBookmark(post._id)}
                        className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-1 sm:py-3 rounded-lg transition-all text-[8px] sm:text-xs font-black uppercase tracking-tighter ${isBookmarked ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Bookmark className={`w-3 h-3 sm:w-5 sm:h-5 ${isBookmarked ? 'fill-red-600' : ''}`} />
                        <span>{isBookmarked ? t('save') : t('react_save')}</span>
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
                                <div key={c._id} id={`comment-${c._id}`} className="flex gap-2 sm:gap-3 group">
                                    <img src={c.usuario?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover cursor-pointer flex-shrink-0" onClick={() => {
                                        const cid = c.usuario?._id || (typeof c.usuario === 'string' ? c.usuario : null);
                                        if(cid) navigate(`/usuarios/${cid}`);
                                    }} alt="" />
                                    <div className="flex-1">
                                        <div className="bg-white p-2 sm:p-3 rounded-xl sm:rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                                            <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                                                <p className="text-xs sm:text-sm font-medium text-gray-900 cursor-pointer hover:underline" onClick={() => {
                                                    const cid = c.usuario?._id || (typeof c.usuario === 'string' ? c.usuario : null);
                                                    if(cid) navigate(`/usuarios/${cid}`);
                                                }}>{c.usuario?.nombre}</p>
                                            </div>
                                            {editingCommentId === c._id ? (
                                                <div className="space-y-2 py-1 animate-in slide-in-from-top-1">
                                                    <textarea
                                                        className="w-full p-2 bg-gray-50 rounded-xl border border-red-50 focus:bg-white focus:ring-4 focus:ring-red-50 outline-none text-xs sm:text-sm transition-all resize-none font-medium"
                                                        value={editCommentText}
                                                        onChange={(e) => setEditCommentText(e.target.value)}
                                                        placeholder={t('edit_comment_hint')}
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 text-[8px] sm:text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 transition-colors">{t('cancel')}</button>
                                                        <button onClick={() => handleSaveCommentEdit(c._id)} className="px-3 py-1 bg-red-600 text-white text-[8px] sm:text-[10px] font-black uppercase rounded-lg shadow-sm hover:bg-red-700 transition-all">{t('save_btn')}</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">{renderContentWithMentions(c.texto, c.mentions)}</p>
                                                    {renderCommentMedia(c.media)}
                                                </>
                                            )}
                                        </div>
                                        <div className="flex gap-3 sm:gap-4 mt-1 sm:mt-1.5 ml-1 sm:ml-2 items-center">
                                            <button onClick={() => setReplyTo({ id: c._id, name: c.usuario?.nombre })} className="text-[9px] sm:text-[11px] text-gray-400 hover:text-red-600 font-black uppercase tracking-tighter">{t('reply')}</button>
                                            <span className="text-[9px] sm:text-[10px] text-gray-200">|</span>
                                            <span className="text-[9px] sm:text-[10px] text-gray-300 font-medium">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                                            {(esDuenoPost || esDuenoComentario) && (
                                                <div className="flex gap-2 sm:gap-3 ml-auto opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {esDuenoComentario && (
                                                        <button
                                                            onClick={() => handleEditCommentModal(c)}
                                                            className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors"
                                                            title={t('edit_comment')}
                                                        >
                                                            <Edit3 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                            <span className="hidden sm:inline font-black">{t('edit')}</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteCommentModal(c._id)}
                                                        className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors"
                                                        title={t('delete_comment')}
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                        <span className="hidden sm:inline font-black">{t('delete')}</span>
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
                                                            onClick={() => {
                                                                const rid = r.usuario?._id || (typeof r.usuario === 'string' ? r.usuario : null);
                                                                if(rid) navigate(`/usuarios/${rid}`);
                                                            }}
                                                            alt=""
                                                        />
                                                        <div className="flex-1">
                                                            <div className="bg-gray-50 p-2 rounded-xl rounded-tl-none border border-gray-100">
                                                                <p className="text-xs font-medium text-gray-900 cursor-pointer hover:underline" onClick={() => {
                                                                    const rid = r.usuario?._id || (typeof r.usuario === 'string' ? r.usuario : null);
                                                                    if(rid) navigate(`/usuarios/${rid}`);
                                                                }}>
                                                                    {r.usuario?.nombre}
                                                                </p>
                                                                <p className="text-gray-600 text-xs leading-relaxed mt-0.5">{renderContentWithMentions(r.texto, r.mentions)}</p>
                                                                {renderCommentMedia(r.media)}
                                                            </div>
                                                            <div className="flex gap-3 mt-0.5 ml-1">
                                                                <button onClick={() => setReplyTo({ id: c._id, name: r.usuario?.nombre })} className="text-[10px] text-gray-400 hover:text-red-600 font-medium">{t('reply')}</button>
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

                    <form onSubmit={replyTo ? handleSendReply : handleSendComment} className="relative mt-4">
                        {/* Previews */}
                        {(commentFiles.length > 0 || audioBlob) && (
                            <div className="flex flex-wrap gap-2 mb-3 p-2 bg-white rounded-2xl border border-red-50 shadow-sm animate-in slide-in-from-bottom-2">
                                {commentFiles.map((f, idx) => (
                                    <div key={idx} className="relative group/thumb">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shadow-sm transition-transform group-hover/thumb:scale-110">
                                            {f.type.startsWith("image/") ? (
                                                <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                    <Paperclip className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <button type="button" onClick={() => removeFile(idx)} className="absolute -top-1 -right-1 bg-red-600 text-white p-1 rounded-full shadow-lg opacity-0 group-hover/thumb:opacity-100 transition-opacity"><CloseIcon className="w-2 h-2" /></button>
                                    </div>
                                ))}
                                {audioBlob && (
                                    <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-2xl border border-red-100 shadow-sm animate-pulse">
                                        <Mic className="w-4 h-4 text-red-600" />
                                        <span className="text-[10px] font-black uppercase text-red-600 tracking-widest">{t('audio_recorded')}</span>
                                        <button type="button" onClick={() => setAudioBlob(null)} className="text-gray-400 hover:text-red-600"><Trash className="w-3 h-3" /></button>
                                    </div>
                                )}
                            </div>
                        )}

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute bottom-full left-0 mb-2 z-50 bg-white rounded-2xl shadow-2xl border border-red-50 p-2 w-[200px] sm:w-[250px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                {suggestions.map(u => (
                                    <button
                                        key={u._id}
                                        type="button"
                                        onClick={() => handleSelectMentionComment(u)}
                                        className="w-full flex items-center gap-2 p-2 hover:bg-red-50 rounded-xl transition-colors text-left"
                                    >
                                        <img src={u.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"} className="w-6 h-6 rounded-full object-cover" alt="" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] sm:text-[11px] font-black text-gray-900 truncate">@{u.username || u.nombre}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {replyTo && (
                            <div className="flex items-center justify-between w-full bg-red-600 text-white px-3 py-1 rounded-t-xl text-[9px] font-black uppercase tracking-widest animate-in slide-in-from-bottom-1">
                                <span>{t('replying_to')} @{replyTo.name}</span>
                                <button type="button" onClick={() => setReplyTo(null)}><CloseIcon className="w-3 h-3" /></button>
                            </div>
                        )}
                        <div className={`flex items-center gap-2 bg-white p-1 sm:p-2 border border-gray-100 shadow-lg relative z-10 transition-all ${replyTo ? 'rounded-b-3xl' : 'rounded-3xl sm:rounded-[2.5rem]'}`}>
                            <div className="flex items-center gap-0.5 sm:gap-1 px-1 shrink-0">
                                <button type="button" onClick={() => commentFileInputRef.current.click()} className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90" title={t('attach_media')}>
                                    <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                                    className={`p-1.5 sm:p-2 rounded-full transition-all active:scale-90 flex items-center gap-1.5 ${isRecording ? 'bg-red-600 text-white px-3' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                                    title={isRecording ? t('stop_recording') : t('record_audio')}
                                >
                                    {isRecording ? (
                                        <>
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                                            <span className="text-[10px] font-black">{formatTime(recordingTime)}</span>
                                        </>
                                    ) : (
                                        <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    )}
                                </button>
                                {isRecording && (
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
                                            setIsRecording(false);
                                            setRecordingTime(0);
                                            setAudioBlob(null);
                                            clearInterval(recordingIntervalRef.current);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                    >
                                        <CloseIcon className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <input type="file" ref={commentFileInputRef} onChange={handleFileChange} multiple hidden accept="image/*,video/*" />
                            </div>

                            <input
                                type="text"
                                placeholder={replyTo ? `${t('reply_to_placeholder')} ${replyTo.name}...` : t('write_comment_placeholder')}
                                value={comentario}
                                onChange={handleCommentInputChange}
                                className="flex-1 px-1 sm:px-2 py-1.5 bg-transparent text-[10px] sm:text-[12px] outline-none font-medium text-gray-800 placeholder:text-gray-400"
                            />

                             <button 
                                type="submit" 
                                disabled={!comentario.trim() && commentFiles.length === 0 && !audioBlob} 
                                className="px-3 sm:px-5 py-2 sm:py-3 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-full hover:shadow-red-200/50 hover:shadow-xl disabled:opacity-30 transition-all active:scale-95 shrink-0 flex items-center gap-2 group/send"
                            >
                                <span className="hidden sm:inline font-black text-[10px] uppercase tracking-widest">{t('publish')}</span>
                                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />
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
