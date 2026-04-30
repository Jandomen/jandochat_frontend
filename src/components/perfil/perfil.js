import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";
import { getSeguidores, getSiguiendo, uploadCoverPhoto, deleteCoverPhoto } from "../../api/user";
import {
  getPostsByUser,
  reaccionarPost,
  comentarPost,
  responderComentario,
  editPost,
  deletePost,
  sharePost,
  editComentario,
  deleteComentario,
  bookmarkPost,
  getMentionsByUser
} from "../../api/posts";
import { Link } from "react-router-dom";
import { Users, User, Edit3, ChevronRight, Newspaper, Trash2, Camera, Play, Plus, Loader2, AtSign } from "lucide-react";
import PostCard from "../Usuarios/PostCard";
import EditPostModal from "../Usuarios/EditPostModal";
import ImageViewer from "../UI/ImageViewer";
import MediaPickerModal from "../UI/MediaPickerModal";
import ProfilePhotoCropper from "../UI/ProfilePhotoCropper";
import PhotoUpload from "../Multimedia/PhotoUpload";
import VideoUpload from "../Multimedia/VideoUpload";
import { uploadProfilePhoto } from "../../api/user";
import { useSocket } from "../../context/SocketContext";
import { useLanguage } from "../../context/LanguageContext";

const Perfil = () => {
  const { t } = useLanguage();
  const { user, setUser } = useAuth();
  const { socket } = useSocket();
  const { showConfirm } = useModal();
  const { success, error } = useToast();
  const [seguidores, setSeguidores] = useState([]);
  const [siguiendo, setSiguiendo] = useState([]);
  const [posts, setPosts] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [activeTab, setActiveTab] = useState("publicaciones");
  const [loadingCover, setLoadingCover] = useState(false);
  const [mediaFullscreen, setMediaFullscreen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [isVideoUploadOpen, setIsVideoUploadOpen] = useState(false);
  const [currentSelectedMedia, setCurrentSelectedMedia] = useState([]);
  const [cropFile, setCropFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const coverInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const fetchDatos = useCallback(async () => {
    try {
      const [seg, sig, misPosts, misMenciones] = await Promise.all([
        getSeguidores(),
        getSiguiendo(),
        getPostsByUser(user._id),
        getMentionsByUser(user._id)
      ]);
      setSeguidores(seg || []);
      setSiguiendo(sig || []);
      setPosts(misPosts || []);
      setMentions(misMenciones || []);
    } catch (err) {
      console.error("Error al cargar datos del perfil:", err);
    }
  }, [user?._id]);

  useEffect(() => {
    if (user?._id) fetchDatos();
  }, [user?._id, fetchDatos]);

  useEffect(() => {
    if (!socket || !user?._id) return;

    const handleNuevoPost = (newPost) => {
        if (newPost.usuario._id === user._id || newPost.usuario === user._id) {
            setPosts((prev) => {
                if (prev.find(p => p._id === newPost._id)) return prev;
                return [newPost, ...prev];
            });
        }
    };

    const handleActualizarPost = (updatedPost) => {
        setPosts((prev) => prev.map((p) => p._id === updatedPost._id ? updatedPost : p));
        setMentions((prev) => prev.map((p) => p._id === updatedPost._id ? updatedPost : p));
    };

    const handleEliminarPost = (postId) => {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
    };

    const handleActualizarComentarios = ({ postId, comentarios }) => {
        setPosts((prev) => prev.map(p => p._id === postId ? { ...p, comentarios } : p));
        setMentions((prev) => prev.map(p => p._id === postId ? { ...p, comentarios } : p));
    };

    const handleActualizarReacciones = ({ postId, reacciones }) => {
        setPosts((prev) => prev.map(p => p._id === postId ? { ...p, reacciones } : p));
        setMentions((prev) => prev.map(p => p._id === postId ? { ...p, reacciones } : p));
    };

    socket.on("nuevoPost", handleNuevoPost);
    socket.on("actualizarPost", handleActualizarPost);
    socket.on("eliminarPost", handleEliminarPost);
    socket.on("actualizarComentarios", handleActualizarComentarios);
    socket.on("actualizarReacciones", handleActualizarReacciones);

    return () => {
        socket.off("nuevoPost", handleNuevoPost);
        socket.off("actualizarPost", handleActualizarPost);
        socket.off("eliminarPost", handleEliminarPost);
        socket.off("actualizarComentarios", handleActualizarComentarios);
        socket.off("actualizarReacciones", handleActualizarReacciones);
    };
  }, [socket, user?._id]);

  const handleBookmark = async (id) => {
    try {
      const res = await bookmarkPost(id);
      const updatedUser = { ...user, guardados: res.guardados };
      setUser(updatedUser);
      localStorage.setItem("usuario", JSON.stringify(updatedUser));
      success(res.msg);
    } catch (err) {
      error("Error al guardar");
    }
  };

  const handleUpdateCover = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoadingCover(true);
    const formData = new FormData();
    formData.append("fotoPortada", file);
    try {
      const res = await uploadCoverPhoto(formData);
      setUser({ ...user, fotoPortada: res.fotoPortada });
      success(t('success'));
    } catch (err) {
      error(t('error'));
    } finally {
      setLoadingCover(false);
    }
  };

  const handleDeleteCover = async () => {
    const confirm = await showConfirm("Eliminar portada", "¿Seguro que quieres eliminar tu foto de portada?");
    if (!confirm) return;
    try {
      await deleteCoverPhoto();
      setUser({ ...user, fotoPortada: "" });
      success(t('cover_deleted') || "Portada eliminada");
    } catch (err) {
      error(t('cover_delete_error') || "Error al eliminar portada");
    }
  };

  const handleUpdatePhotoFile = (e) => {
    const file = e.target.files[0];
    if (file) setCropFile(file);
  };

  const handleProfilePhotoCrop = async (blob) => {
    try {
      setLoadingCover(true);
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("fotoPerfil", file);
      
      const res = await uploadProfilePhoto(formData);
      setUser({ ...user, fotoPerfil: res.fotoPerfil });
      setCropFile(null);
      success(t('profile_photo_updated') || "¡Foto de perfil actualizada!");
    } catch (err) {
      error(t('profile_photo_update_error') || "Error al subir foto de perfil");
    } finally {
      setLoadingCover(false);
    }
  };

  const handleReact = async (id, tipo) => {
    try {
      const reacciones = await reaccionarPost(id, tipo);
      setPosts(posts.map(p => p._id === id ? { ...p, reacciones } : p));
    } catch (err) { console.error("Error react", err); }
  };

  const handleComment = async (id, texto) => {
    try {
      const comentarios = await comentarPost(id, texto);
      setPosts(posts.map(p => p._id === id ? { ...p, comentarios } : p));
    } catch (err) { console.error("Error comment", err); }
  };

  const handleReply = async (id, comentarioId, texto) => {
    try {
      const comentarios = await responderComentario(id, comentarioId, texto);
      setPosts(posts.map(p => p._id === id ? { ...p, comentarios } : p));
    } catch (err) { console.error("Error reply", err); }
  };

   const handleEdit = (id) => {
    const postToEdit = posts.find(p => p._id === id);
    setEditingPost(postToEdit);
    setIsEditing(true);
  };

  const onSaveEdit = async (id, contenido) => {
    try {
      const editado = await editPost(id, { contenido });
      setPosts(posts.map(p => p._id === id ? { ...p, contenido: editado.contenido, mentions: editado.mentions } : p));
      success(t('post_edited'));
    } catch (err) {
      error(t('error'));
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(t('delete_post_title'), t('confirm_delete_post_short'));
    if (!confirmed) return;
    try {
      await deletePost(id);
      setPosts(posts.filter(p => p._id !== id));
      success(t('post_deleted'));
    } catch (err) {
      error(t('error'));
    }
  };

  const handleShare = async (id, content) => {
    try {
      const shared = await sharePost(id, { contenidoCompartir: content });
      setPosts([shared, ...posts]);
      success(t('shared_success'));
    } catch (err) {
      error(t('error'));
    }
  };

  const handleEditComment = async (pid, cid, txt) => {
    try {
      const comments = await editComentario(pid, cid, txt);
      setPosts(posts.map(p => p._id === pid ? { ...p, comentarios: comments } : p));
    } catch (err) { console.error("Error edit comment", err); }
  };

  const handleDeleteComment = async (pid, cid) => {
      try {
        const comments = await deleteComentario(pid, cid);
        setPosts(posts.map(p => p._id === pid ? { ...p, comentarios: comments } : p));
        success(t('comment_deleted_success'));
      } catch (err) {
        error(t('error'));
      }
  };

  const renderUsuario = (usuario) => (
    <Link key={usuario._id} to={`/usuarios/${usuario._id}`} className="flex items-center justify-between p-3 bg-white/80 rounded-2xl border border-red-50 hover:bg-red-50 transition-all group">
      <div className="flex items-center gap-3">
        <img src={usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
        <div>
          <p className="text-xs sm:text-sm font-black text-gray-900 leading-none">{usuario.nombre}</p>
          <p className="text-[7px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">@{usuario.username || t('user_placeholder')}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
    </Link>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-12 px-0 sm:px-4 sm:pt-8 overflow-x-hidden w-full">
      {/* Upper Cover Block */}
      <div className="relative group px-1 sm:px-0">
        <div 
          className="h-32 sm:h-64 rounded-[2rem] sm:rounded-[4.5rem] overflow-hidden relative shadow-2xl bg-red-950 cursor-pointer"
          onClick={() => { setCurrentSelectedMedia([{ url: user?.fotoPortada || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop", tipo: "imagen" }]); setMediaFullscreen(true); }}
        >
          {loadingCover && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20 transition-all animate-in fade-in duration-300">
                <Loader2 className="w-8 h-8 sm:w-16 sm:h-16 text-white animate-spin" />
            </div>
          )}
          <img src={user?.fotoPortada || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-4 right-4 sm:bottom-10 sm:right-10 flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); coverInputRef.current.click(); }} className="p-2 sm:p-4 bg-white/10 backdrop-blur-xl hover:bg-white/30 text-white rounded-xl sm:rounded-2xl transition-all shadow-xl border border-white/20">
              <Camera className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
            {user?.fotoPortada && (
                <button onClick={(e) => { e.stopPropagation(); handleDeleteCover(); }} className="p-2 sm:p-4 bg-red-600/80 backdrop-blur-xl hover:bg-red-600 text-white rounded-xl sm:rounded-2xl transition-all">
                    <Trash2 className="w-4 h-4 sm:w-6 sm:h-6" />
                </button>
            )}
          </div>
        </div>

        {/* Floating Profile Info Card - FULLY REVEALED COVER */}
        <div className="relative mt-2 sm:-mt-20 px-4 sm:px-16 pb-4">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] sm:rounded-[4rem] p-4 sm:p-12 shadow-3xl border border-red-50 flex flex-col items-center text-center">
            <div className="relative -mt-12 sm:-mt-28 mb-4">
              <div className="p-1 sm:p-2 bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl relative group/avatar overflow-hidden">
                {loadingCover && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20 transition-all animate-in fade-in">
                    <Loader2 className="w-6 h-6 sm:w-12 sm:h-12 text-red-600 animate-spin" />
                  </div>
                )}
                <img
                  src={user?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                  className="w-16 h-16 sm:w-32 sm:h-32 rounded-[1.2rem] sm:rounded-[2rem] object-cover cursor-pointer"
                  onClick={() => { setCurrentSelectedMedia([{ url: user.fotoPerfil, tipo: "imagen" }]); setMediaFullscreen(true); }}
                  alt=""
                />
                <button onClick={() => setIsPickerOpen(true)} className="absolute -bottom-1 -right-1 p-1.5 sm:p-3.5 bg-red-600 text-white rounded-lg sm:rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all border-2 border-white">
                    <Edit3 className="w-2.5 h-2.5 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            <h2 className="text-lg sm:text-4xl font-black text-gray-900 tracking-tighter uppercase mb-0 leading-none">{user?.nombre}</h2>
            <p className="text-[8px] sm:text-sm font-black text-red-600 uppercase tracking-[0.2em] mb-3 sm:mb-6">@{user?.username || t('user_placeholder')}</p>
            
            <div className="flex flex-col items-center gap-1 mb-4 sm:mb-8">
              {user?.bio && (
                  <div className="max-w-[280px] sm:max-w-md">
                      <span className="text-[6px] sm:text-[9px] font-black uppercase text-red-600/40 tracking-[0.2em] mb-1 block">{t('bio')}</span>
                      <p className="text-[10px] sm:text-base text-gray-500 font-bold italic leading-tight px-1 line-clamp-3">"{user.bio}"</p>
                  </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 mt-2 opacity-60">
                  {user?.ubicacion && (
                      <div className="flex items-center gap-1">
                          <span className="text-[6px] sm:text-[8px] font-black uppercase text-gray-400">{t('location')}:</span>
                          <span className="text-[7px] sm:text-[10px] font-bold text-gray-600">{user.ubicacion}</span>
                      </div>
                  )}
                  <div className="flex items-center gap-1">
                      <span className="text-[6px] sm:text-[8px] font-black uppercase text-gray-400">{t('joined')}:</span>
                      <span className="text-[7px] sm:text-[10px] font-bold text-gray-600">{new Date(user.createdAt).getFullYear()}</span>
                  </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 sm:gap-12 w-full max-w-md pb-4 sm:pb-8 border-y border-red-50 py-3 sm:py-8">
                <div onClick={() => setActiveTab("publicaciones")} className="flex flex-col items-center cursor-pointer group">
                    <span className="text-xs sm:text-3xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase">{posts.length}</span>
                    <span className="text-[5px] sm:text-[10px] font-black uppercase text-gray-400 tracking-tighter mt-0.5">{t('stories_count')}</span>
                </div>
                <div onClick={() => setActiveTab("seguidores")} className="flex flex-col items-center cursor-pointer group border-x border-red-50 px-1 sm:px-6">
                    <span className="text-xs sm:text-3xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase">{seguidores.length}</span>
                    <span className="text-[5px] sm:text-[10px] font-black uppercase text-gray-400 tracking-tighter mt-0.5">{t('allies')}</span>
                </div>
                <div onClick={() => setActiveTab("siguiendo")} className="flex flex-col items-center cursor-pointer group">
                    <span className="text-xs sm:text-3xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase">{siguiendo.length}</span>
                    <span className="text-[5px] sm:text-[10px] font-black uppercase text-gray-400 tracking-tighter mt-0.5">{t('following_count')}</span>
                </div>
            </div>
          </div>
        </div>
      </div>

      <input type="file" ref={coverInputRef} onChange={handleUpdateCover} className="hidden" accept="image/*" />
      <input type="file" ref={photoInputRef} onChange={handleUpdatePhotoFile} className="hidden" accept="image/*" />

      {/* Navigation Tabs - REAL CAROUSEL */}
      <div className="bg-white/80 backdrop-blur-xl border-y border-red-50 sticky top-[52px] sm:top-24 z-30 shadow-sm overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 sm:gap-6 px-1 sm:px-6 w-max min-w-full">
            {[
              { id: "publicaciones", labelKey: "stories", icon: Newspaper },
              { id: "videos", labelKey: "videos", icon: Play },
              { id: "galeria", labelKey: "gallery_tab", icon: Camera },
              { id: "seguidores", labelKey: "allies", icon: Users },
              { id: "siguiendo", labelKey: "following_count", icon: User },
              { id: "menciones", labelKey: "mentions", icon: AtSign },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-3 px-3 py-1.5 rounded-lg transition-all relative shrink-0 ${activeTab === tab.id ? "text-red-600 bg-red-50/50" : "text-gray-400"}`}
              >
                <tab.icon className="w-3 h-3 sm:w-5 sm:h-5" />
                <span className="text-[5px] sm:text-[10px] font-black uppercase tracking-tighter sm:tracking-widest">{t(tab.labelKey)}</span>
                {activeTab === tab.id && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-red-600 rounded-full"></div>}
              </button>
            ))}
        </div>
      </div>

      <div className="min-h-[300px] px-1.5 pb-20">
        {/* Rapid Action Buttons */}
        <div className="py-6 flex justify-center">
            {activeTab === "videos" && (
                <button onClick={() => setIsVideoUploadOpen(true)} className="flex items-center gap-3 px-10 py-4 bg-black text-white rounded-2xl shadow-2xl hover:scale-105 transition-all font-black uppercase text-[10px] tracking-widest">
                    <Plus className="w-5 h-5" /> {t('viralize_video')}
                </button>
            )}
            {activeTab === "galeria" && (
                <button onClick={() => setIsPhotoUploadOpen(true)} className="flex items-center gap-3 px-10 py-4 bg-red-600 text-white rounded-2xl shadow-2xl hover:scale-105 transition-all font-black uppercase text-[10px] tracking-widest">
                    <Plus className="w-5 h-5" /> {t('upload_gallery')}
                </button>
            )}
        </div>

        {activeTab === "seguidores" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {seguidores.length > 0 ? seguidores.map(renderUsuario) : (
                <div className="col-span-full py-20 text-center opacity-30">
                   <Users className="w-12 h-12 mx-auto mb-4" />
                   <p className="font-black uppercase tracking-widest text-[8px]">{t('no_allies')}</p>
                </div>
            )}
          </div>
        ) : activeTab === "siguiendo" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {siguiendo.length > 0 ? siguiendo.map(renderUsuario) : (
                <div className="col-span-full py-20 text-center opacity-30">
                   <Users className="w-12 h-12 mx-auto mb-4" />
                   <p className="font-black uppercase tracking-widest text-[8px]">{t('not_following')}</p>
                </div>
            )}
          </div>
        ) : (activeTab === "menciones" ? (
          <div className="space-y-4">
             {mentions.length > 0 ? mentions.map(p => (
                <PostCard
                  key={p._id}
                  post={p}
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
             )) : (
                <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed border-red-50 rounded-[3rem]">
                   <AtSign className="w-12 h-12 mx-auto mb-4" />
                   <p className="font-black uppercase tracking-widest text-[8px]">{t('no_mentions')}</p>
                </div>
            )}
          </div>
        ) : ["videos", "galeria"].includes(activeTab) ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-6 px-1.5">
            {posts.filter(p => {
              if (activeTab === "videos") return p.tipo === "video";
              if (activeTab === "galeria") return p.tipo === "image";
              return false;
            }).length > 0 ? posts.filter(p => {
              if (activeTab === "videos") return p.tipo === "video";
              if (activeTab === "galeria") return p.tipo === "image";
              return false;
            }).map(p => (
              <div 
                key={p._id} 
                className="aspect-square rounded-xl sm:rounded-3xl overflow-hidden relative group cursor-pointer shadow-lg border border-red-50 hover:shadow-2xl transition-all"
                onClick={() => {
                  setCurrentSelectedMedia(p.media);
                  setMediaFullscreen(true);
                }}
              >
                {activeTab === "videos" ? (
                  <div className="relative w-full h-full bg-black">
                     <video src={p.media.find(m => m.tipo === "video")?.url} className="w-full h-full object-cover opacity-80" />
                     <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                        <Play className="w-6 h-6 sm:w-16 sm:h-16 text-white fill-white drop-shadow-2xl scale-90 group-hover:scale-110 transition-transform" />
                     </div>
                  </div>
                ) : (
                  <img 
                    src={p.media[0].url} 
                    className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" 
                    alt="" 
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 sm:p-6 text-left">
                  <p className="text-[6px] sm:text-xs text-white font-black truncate uppercase tracking-[0.1em]">{p.titulo || t('multimedia_archive')}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-red-50 rounded-[3rem] bg-white/40 opacity-40">
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-black uppercase tracking-widest text-[8px] sm:text-xs text-gray-300 italic">
                  {activeTab === "galeria" ? t('no_photos') : activeTab === "videos" ? t('no_videos') : t('no_content_stored')}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.filter(p => {
              if (activeTab === "videos") return p.tipo === "video";
              if (activeTab === "galeria") return p.tipo === "image";
              return p.tipo !== "video" && p.tipo !== "image";
            }).length > 0 ? posts.filter(p => {
              if (activeTab === "videos") return p.tipo === "video";
              if (activeTab === "galeria") return p.tipo === "image";
              return p.tipo !== "video" && p.tipo !== "image";
            }).map(p => (
              <PostCard
                key={p._id}
                post={p}
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
            )) : (
              <div className="py-20 text-center border-2 border-dashed border-red-50 rounded-[3rem] bg-white opacity-40 col-span-full">
                <p className="font-black uppercase tracking-widest text-[8px] sm:text-xs text-gray-300">
                  {activeTab === "menciones" ? t('no_mentions') : t('no_posts')}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {isPhotoUploadOpen && <PhotoUpload onClose={() => setIsPhotoUploadOpen(false)} onComplete={fetchDatos} />}
      {isVideoUploadOpen && <VideoUpload onClose={() => setIsVideoUploadOpen(false)} onComplete={fetchDatos} />}

      <MediaPickerModal 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)} 
        onSelect={(type) => {
           if (type === "gallery" || type === "camera") {
               photoInputRef.current.click();
           }
        }} 
      />

      {cropFile && (
          <ProfilePhotoCropper 
            file={cropFile} 
            onCrop={handleProfilePhotoCrop} 
            onClose={() => setCropFile(null)} 
          />
      )}

      {mediaFullscreen && (
        <ImageViewer
          media={currentSelectedMedia}
          currentIndex={0}
          onClose={() => setMediaFullscreen(false)}
        />
      )}

      {isEditing && (
          <EditPostModal 
            isOpen={isEditing} 
            post={editingPost} 
            onClose={() => setIsEditing(false)} 
            onSave={onSaveEdit} 
          />
      )}
    </div>
  );
};

export default Perfil;
