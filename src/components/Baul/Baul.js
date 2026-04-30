import React, { useState, useEffect, useCallback } from "react";
import { getBookmarkedPosts, bookmarkPost, reaccionarPost, comentarPost, responderComentario, editPost, deletePost, sharePost, editComentario, deleteComentario } from "../../api/posts";
import PostCard from "../Usuarios/PostCard";
import { Bookmark, Loader2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useModal } from "../../context/ModalContext";
import { useLanguage } from "../../context/LanguageContext";
import { useSocket } from "../../context/SocketContext";

export default function Baul() {
    const { t } = useLanguage();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocket();
    const { success, error } = useToast();
    const { showConfirm, showPrompt } = useModal();

    const fetchSavedPosts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getBookmarkedPosts();
            setPosts(data);
        } catch (err) {
            console.error("Error al obtener guardados:", err);
            error(t('load_saved_error'));
        } finally {
            setLoading(false);
        }
    }, [error, t]);

    useEffect(() => {
        fetchSavedPosts();
    }, [fetchSavedPosts]);

    useEffect(() => {
        if (!socket) return;

        const handleActualizarComentarios = ({ postId, comentarios }) => {
            setPosts((prev) => prev.map(p => p._id === postId ? { ...p, comentarios } : p));
        };

        const handleActualizarReacciones = ({ postId, reacciones }) => {
            setPosts((prev) => prev.map(p => p._id === postId ? { ...p, reacciones } : p));
        };

        socket.on("actualizarComentarios", handleActualizarComentarios);
        socket.on("actualizarReacciones", handleActualizarReacciones);

        return () => {
            socket.off("actualizarComentarios", handleActualizarComentarios);
            socket.off("actualizarReacciones", handleActualizarReacciones);
        };
    }, [socket]);

    const handleBookmark = async (id) => {
        try {
            await bookmarkPost(id);
            // Remove from local state since it's the "Baul" view
            setPosts(prev => prev.filter(p => p._id !== id));
            success(t('removed_from_baul'));
        } catch (err) {
            error(t('update_baul_error'));
        }
    };

    const handleReact = async (id, tipo) => {
        try {
            const reacciones = await reaccionarPost(id, tipo);
            setPosts(posts.map(p => p._id === id ? { ...p, reacciones } : p));
        } catch (err) {
            console.error("Error al reaccionar", err);
        }
    };

    const handleComment = async (id, texto) => {
        try {
            const comentarios = await comentarPost(id, texto);
            setPosts(posts.map(p => p._id === id ? { ...p, comentarios } : p));
        } catch (err) {
            console.error("Error al comentar", err);
        }
    };

    const handleReply = async (id, comentarioId, texto) => {
        try {
            const comentarios = await responderComentario(id, comentarioId, texto);
            setPosts(posts.map(p => p._id === id ? { ...p, comentarios } : p));
        } catch (err) {
            console.error("Error al responder comentario", err);
        }
    };

    const handleEdit = async (id) => {
        const postToEdit = posts.find(p => p._id === id);
        const nuevoContenido = await showPrompt(t('edit_post'), t('enter_new_content'), postToEdit?.contenido || "");
        if (!nuevoContenido) return;
        try {
            const editado = await editPost(id, { contenido: nuevoContenido });
            setPosts(posts.map(p => p._id === id ? { ...p, contenido: editado.contenido } : p));
            success(t('post_edited'));
        } catch (err) {
            error(t('error'));
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm(t('delete_post_title'), t('confirm_delete_post'));
        if (!confirmed) return;
        try {
            await deletePost(id);
            setPosts(posts.filter(p => p._id !== id));
            success(t('post_deleted'));
        } catch (err) {
            error(t('error'));
        }
    };

    const handleShare = async (id, contenidoCompartir) => {
        try {
            await sharePost(id, { contenidoCompartir });
            success(t('post_shared'));
        } catch (err) {
            error(t('error_share') || t('error'));
        }
    };

    const handleEditComment = async (postId, comentarioId, texto) => {
        try {
            const comentarios = await editComentario(postId, comentarioId, texto);
            setPosts(posts.map(p => p._id === postId ? { ...p, comentarios } : p));
        } catch (err) {
            console.error("Error al editar comentario", err);
        }
    };

    const handleDeleteComment = async (postId, comentarioId) => {
        const confirmed = await showConfirm(t('delete_comment_title'), t('confirm_delete_comment'));
        if (!confirmed) return;
        try {
            const comentarios = await deleteComentario(postId, comentarioId);
            setPosts(posts.map(p => p._id === postId ? { ...p, comentarios } : p));
            success(t('comment_deleted'));
        } catch (err) {
            error(t('error'));
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-200">
                    <Bookmark className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('baul_title')}</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">{t('baul_subtitle')}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
                    <p className="text-gray-400 font-black uppercase text-xs tracking-widest">{t('opening_baul_loader')}</p>
                </div>
            ) : posts.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-red-100 opacity-50">
                    <Bookmark className="w-16 h-16 text-red-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-black text-base">{t('baul_empty_desc')}</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {posts.map(post => (
                        <PostCard
                            key={post._id}
                            post={post}
                            onReact={handleReact}
                            onComment={handleComment}
                            onReply={handleReply}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onShare={handleShare}
                            onBookmark={handleBookmark}
                            onEditComment={handleEditComment}
                            onDeleteComment={handleDeleteComment}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
