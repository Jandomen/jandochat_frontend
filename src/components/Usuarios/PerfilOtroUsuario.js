import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserById, dejarDeSeguirUsuario, seguirUsuario, bloquearUsuario, reportUsuario } from "../../api/user";
import { getPostsByUser, reaccionarPost, comentarPost, bookmarkPost, getMentionsByUser, responderComentario, editComentario, deleteComentario, sharePost } from "../../api/posts";
import { buscarConversacionPrivada, crearConversacion } from "../../api/conversation";
import useAuth from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import PostCard from "./PostCard";
import { ShieldAlert, MessageSquare, MapPin, Newspaper, Phone, Users, Play, Camera, AtSign, MoreVertical, Flag } from "lucide-react";
import { useCall } from "../../context/CallContext";
import ImageViewer from "../UI/ImageViewer";
import { useSocket } from "../../context/SocketContext";
import { useLanguage } from "../../context/LanguageContext";

const PerfilOtroUsuario = () => {
  const { id } = useParams();
  const { user: userActual } = useAuth();
  const navigate = useNavigate();
  const { success, error: showErrorToast } = useToast();
  const [usuario, setUsuario] = useState(null);
  const [posts, setPosts] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { t } = useLanguage();
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeTab, setActiveTab] = useState("historias");
  const [mediaFullscreen, setMediaFullscreen] = useState(false);
  const [currentSelectedMedia, setCurrentSelectedMedia] = useState([]);
  const { startCall, activeCall } = useCall();
  const [showOptions, setShowOptions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const siguiendo = usuario?.seguidores?.some(
    (s) => (s._id || s).toString() === (userActual?._id || userActual?.id)?.toString()
  );

  useEffect(() => {
    const fetchDatos = async () => {
      if (!id || id === 'undefined') {
        setErrorMsg("Usuario no encontrado.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [userData, userPosts, userMentions] = await Promise.all([
          getUserById(id),
          getPostsByUser(id),
          getMentionsByUser(id)
        ]);
        setUsuario(userData);
        setPosts(userPosts);
        setMentions(userMentions);
        setErrorMsg(null);
      } catch (err) {
        console.error("Error cargando perfil:", err);
        setErrorMsg(t('error') || "No se pudo cargar el perfil del usuario.");
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, [id, userActual?._id, t]);

  useEffect(() => {
    if (!socket) return;

    const handleNuevoPost = (newPost) => {
      // Only add if it belongs to this user profile
      if ((newPost.usuario._id || newPost.usuario) === id) {
        setPosts((prev) => {
          if (prev.find(p => p._id === newPost._id)) return prev;
          return [newPost, ...prev];
        });
      }
    };

    const handleEliminarPost = (postId) => {
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setMentions((prev) => prev.filter((p) => p._id !== postId));
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
    socket.on("eliminarPost", handleEliminarPost);
    socket.on("actualizarComentarios", handleActualizarComentarios);
    socket.on("actualizarReacciones", handleActualizarReacciones);

    return () => {
      socket.off("nuevoPost", handleNuevoPost);
      socket.off("eliminarPost", handleEliminarPost);
      socket.off("actualizarComentarios", handleActualizarComentarios);
      socket.off("actualizarReacciones", handleActualizarReacciones);
    };
  }, [socket, id]);

  const handleSeguir = async () => {
    try {
      await seguirUsuario(id);
      setUsuario((prev) => ({
        ...prev,
        seguidores: [...(prev.seguidores || []), { _id: userActual._id }],
      }));
      success("Ahora sigues a este usuario");
    } catch (err) {
      showErrorToast("Error al seguir");
    }
  };

  const handleDejarDeSeguir = async () => {
    try {
      await dejarDeSeguirUsuario(id);
      setUsuario((prev) => ({
        ...prev,
        seguidores: (prev.seguidores || []).filter(
          (s) => (s._id || s).toString() !== userActual._id.toString()
        ),
      }));
      success(t('unfollowed') || "Has dejado de seguir");
    } catch (err) {
      showErrorToast(t('error') || "Error al dejar de seguir");
    }
  };

  const handleEnviarMensaje = async () => {
    try {
      const convExistente = await buscarConversacionPrivada(id);
      if (convExistente) {
        navigate(`/chat/${convExistente._id}`, { state: { destinatario: usuario } });
      } else {
        const nuevaConv = await crearConversacion(id);
        navigate(`/chat/${nuevaConv._id}`, { state: { destinatario: usuario } });
      }
    } catch (err) {
      showErrorToast(t('error') || "No se pudo iniciar chat");
    }
  };

  const handleBookmark = async (id) => {
    try {
      const res = await bookmarkPost(id);
      success(res.msg);
    } catch (err) {
      showErrorToast("Error al guardar");
    }
  };

  const handleBlockUser = async () => {
    try {
      await bloquearUsuario(id);
      success("Usuario bloqueado correctamente");
      navigate("/usuarios");
    } catch (err) {
      showErrorToast("Error al bloquear usuario");
    }
  };

  const handleReportUser = async () => {
    if (!reportReason.trim()) return showErrorToast("Ingresa un motivo");
    try {
      await reportUsuario(id, { motivo: reportReason });
      success("Reporte enviado a la administración");
      setShowReportModal(false);
      setReportReason("");
    } catch (err) {
      showErrorToast("Error al enviar reporte");
    }
  };

  const handleReact = async (postId, tipo) => {
    try {
      const reacciones = await reaccionarPost(postId, tipo);
      setPosts(posts.map(p => p._id === postId ? { ...p, reacciones } : p));
    } catch (err) {}
  };

  const handleComment = async (postId, texto) => {
    try {
      const comentarios = await comentarPost(postId, texto);
      setPosts(posts.map(p => p._id === postId ? { ...p, comentarios } : p));
    } catch (err) {}
  };

  const handleReply = async (postId, comentarioId, texto) => {
    try {
      const comentarios = await responderComentario(postId, comentarioId, texto);
      setPosts(posts.map(p => p._id === postId ? { ...p, comentarios } : p));
    } catch (err) { console.error("Error reply", err); }
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
        success("Comentario eliminado");
      } catch (err) {
        showErrorToast("Error al eliminar");
      }
  };

  const handleShare = async (postId, content) => {
    try {
      // In someone else's profile we can just optimistically add to the top of our own feed somewhere else
      // or simply show success. Wait, the share actually returns the new post.
      await sharePost(postId, { contenidoCompartir: content });
      success("Publicación compartida en tu muro");
    } catch (err) {
      showErrorToast("Error al compartir");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 font-black uppercase text-[10px]">{t('loading') || "Cargando..."}</p>
    </div>
  );

  if (errorMsg) return (
    <div className="max-w-md mx-auto mt-20 p-12 bg-white rounded-[3rem] border-2 border-dashed border-red-100 text-center">
      <ShieldAlert className="w-16 h-16 text-red-200 mx-auto mb-6" />
      <p className="font-bold text-gray-900">{errorMsg}</p>
      <button onClick={() => navigate("/usuarios")} className="mt-4 text-red-600 font-black uppercase text-[10px]">Volver</button>
    </div>
  );

  if (!usuario) return null;

  const isSelf = userActual?._id?.toString() === id?.toString();

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-10 px-1 sm:px-0 overflow-x-hidden">
      {/* Header: Cover */}
      <div className="relative w-full">
        <div 
          className="aspect-[21/9] sm:aspect-[4/1] rounded-xl sm:rounded-[3rem] overflow-hidden shadow-lg relative bg-red-950 cursor-pointer group/cover z-10"
          onClick={() => {
            setCurrentSelectedMedia([{ url: usuario?.fotoPortada || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop", tipo: "imagen" }]);
            setMediaFullscreen(true);
          }}
        >
          <img
            src={usuario?.fotoPortada || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop"}
            alt=""
            className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-110 pointer-events-none"
          />
          <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
        </div>

        {/* Info Card Overlay - Centered and Premium */}
        <div className="bg-white/95 backdrop-blur-xl border border-red-500/5 rounded-2xl sm:rounded-[4rem] p-3 sm:p-12 -mt-8 sm:-mt-20 mx-2 sm:mx-12 shadow-2xl relative z-20 flex flex-col items-center">
          
          {!isSelf && (
            <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50">
              <button onClick={() => setShowOptions(!showOptions)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
                <MoreVertical className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              {showOptions && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <button onClick={handleBlockUser} className="w-full px-4 py-3 text-left text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                    <ShieldAlert className="w-4 h-4 text-red-500" /> {t('block')}
                  </button>
                  <button onClick={() => { setShowOptions(false); setShowReportModal(true); }} className="w-full px-4 py-3 text-left text-xs sm:text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                    <Flag className="w-4 h-4" /> {t('report')}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="relative -mt-10 sm:-mt-28 mb-2 sm:mb-4">
            <div className="w-16 h-16 sm:w-32 sm:h-32 rounded-xl sm:rounded-[2rem] p-1 bg-white shadow-2xl">
              <img
                src={usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                className="w-full h-full rounded-xl sm:rounded-[1.5rem] object-cover cursor-pointer"
                alt=""
                onClick={() => {
                  setCurrentSelectedMedia([{ url: usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png", tipo: "imagen" }]);
                  setMediaFullscreen(true);
                }}
              />
            </div>
          </div>

          <div className="w-full text-center">
            <h2 className="text-sm sm:text-5xl font-black text-gray-900 tracking-tighter leading-tight mb-0.5 sm:mb-1">{usuario.nombre}</h2>
            <p className="text-red-600 font-extrabold uppercase tracking-widest text-[6px] sm:text-sm mb-2 sm:mb-4">@{usuario.username || usuario.nombre.replace(/\s+/g, '').toLowerCase()}</p>
            {usuario.bio && (
              <p className="text-gray-500 font-medium text-[7px] sm:text-base mb-2 sm:mb-6 max-w-md mx-auto leading-relaxed italic px-2">"{usuario.bio}"</p>
            )}
            
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-10 text-gray-400 mb-2 sm:mb-8 border-y border-red-500/10 py-1 sm:py-4">
              {usuario.ubicacion && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <MapPin className="w-2 sm:w-3.5 sm:h-3.5 text-red-500" />
                  <span className="text-[6px] sm:text-sm font-black uppercase tracking-tighter">{usuario.ubicacion}</span>
                </div>
              )}
            </div>

            {/* Actions (Only if not self) */}
            {!isSelf && (
              <div className="flex justify-center gap-2 sm:gap-4 mb-4 sm:mb-8">
                <button
                  onClick={handleEnviarMensaje}
                  className="p-1.5 sm:p-5 bg-gray-50 text-gray-400 rounded-lg sm:rounded-[2rem] hover:bg-red-50 hover:text-red-600 transition-all border border-gray-100 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={() => startCall(id, "voice", usuario)}
                  disabled={activeCall}
                  className="p-1.5 sm:p-5 bg-red-50 text-red-600 rounded-lg sm:rounded-[2rem] hover:bg-red-600 hover:text-white transition-all border border-red-100 disabled:opacity-30 shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
                </button>
                
                {siguiendo ? (
                  <button
                    onClick={handleDejarDeSeguir}
                    className="px-3 py-1.5 sm:px-12 sm:py-5 bg-white border-2 border-red-600 text-red-600 font-black rounded-lg sm:rounded-[2rem] text-[6px] sm:text-xs uppercase tracking-tighter"
                  >
                    {t('following') || "Siguiendo"}
                  </button>
                ) : (
                  <button
                    onClick={handleSeguir}
                    className="px-3 py-1.5 sm:px-12 sm:py-5 bg-red-600 text-white font-black rounded-lg sm:rounded-[2rem] text-[6px] sm:text-xs uppercase tracking-tighter shadow-lg shadow-red-200"
                  >
                    {t('follow') || "Aliar"}
                  </button>
                )}
              </div>
            )}

            <div className="flex justify-center gap-2 sm:gap-20">
              <div onClick={() => setActiveTab("historias")} className="flex flex-col items-center cursor-pointer group">
                <p className="text-xs sm:text-4xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase">{posts.length}</p>
                <p className="text-[5px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('stories') || "Historias"}</p>
              </div>
              <div onClick={() => setActiveTab("aliados")} className="flex flex-col items-center px-4 sm:px-8 border-x border-red-500/10 cursor-pointer group">
                <p className="text-xs sm:text-4xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase">{usuario.seguidores?.length || 0}</p>
                <p className="text-[5px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('followers') || "Aliados"}</p>
              </div>
              <div onClick={() => setActiveTab("siguiendo")} className="flex flex-col items-center cursor-pointer group">
                <p className="text-xs sm:text-4xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase">{usuario.siguiendo?.length || 0}</p>
                <p className="text-[5px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('following_count') || "Siguiendo"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section with Tabs */}
      <div className="bg-white/80 backdrop-blur-xl border-y sm:border sm:rounded-3xl border-red-500/5 sticky top-[52px] sm:top-24 z-30 shadow-xl shadow-red-100/5">
        <div className="flex gap-2 sm:gap-6 px-1 sm:px-6 overflow-x-auto scrollbar-hide py-2 sm:py-3 justify-center sm:justify-start">
          <div className="flex gap-1.5 sm:gap-6 mx-auto sm:mx-0">
            {[
              { id: "historias", label: t('stories') || "Historias", icon: Newspaper },
              { id: "videos", label: t('videos') || "Videos", icon: Play },
              { id: "galeria", label: t('gallery_tab') || "Galería", icon: Camera },
              { id: "aliados", label: t('followers') || "Aliados", icon: Users },
              { id: "siguiendo", label: t('following_count') || "Siguiendo", icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 px-3 py-1.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-2xl transition-all relative group ${
                    isActive ? "text-red-600 bg-red-50/50" : "text-gray-400 hover:text-red-400 hover:bg-red-50/30"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${isActive ? "scale-110" : "group-hover:scale-110"} transition-transform`} />
                  <span className="text-[6px] sm:text-[10px] font-black uppercase tracking-tighter sm:tracking-widest">{tab.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 w-4 sm:w-8 h-0.5 sm:h-1 bg-red-600 rounded-full shadow-lg shadow-red-200"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

        <div className="min-h-[200px] px-1 sm:px-0">
          {["videos", "galeria"].includes(activeTab) ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-4">
              {posts.filter(p => {
                if (activeTab === "videos") return p.media.some(m => m.tipo === "video");
                if (activeTab === "galeria") return p.media.some(m => m.tipo === "imagen");
                return false;
              }).map(p => (
                <div 
                  key={p._id} 
                  className="aspect-square rounded-lg sm:rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm border border-red-50"
                  onClick={() => {
                    setCurrentSelectedMedia(p.media);
                    setMediaFullscreen(true);
                  }}
                >
                  {activeTab === "videos" ? (
                    <div className="relative w-full h-full bg-black">
                       <video src={p.media.find(m => m.tipo === "video")?.url} className="w-full h-full object-cover opacity-80" />
                       <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                          <Play className="w-6 h-6 sm:w-12 sm:h-12 text-white fill-white drop-shadow-lg scale-90 group-hover:scale-110 transition-transform" />
                       </div>
                    </div>
                  ) : (
                    <img 
                      src={p.media.find(m => m.tipo === "imagen")?.url} 
                      className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110" 
                      alt="" 
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 sm:p-4">
                    <p className="text-[6px] sm:text-[10px] text-white font-black truncate uppercase tracking-tighter shadow-sm">{p.titulo || t('view_content') || "Ver contenido"}</p>
                  </div>
                </div>
              ))}
              {posts.filter(p => {
                if (activeTab === "videos") return p.media.some(m => m.tipo === "video");
                if (activeTab === "galeria") return p.media.some(m => m.tipo === "imagen");
                return false;
              }).length === 0 && (
                <div className="col-span-full bg-white/50 rounded-2xl p-10 sm:p-20 text-center border border-dashed border-red-100 opacity-40">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-[7px] sm:text-xs font-black uppercase text-gray-400 tracking-widest italic">{t('empty') || "Sin contenido en este sector"}</p>
                </div>
              )}
            </div>
          ) : activeTab === "historias" ? (
            <div className="space-y-2 sm:space-y-4">
              {posts.length === 0 ? (
                <div className="bg-white/50 rounded-2xl p-10 sm:p-20 text-center border border-dashed border-red-100 opacity-40">
                  <Newspaper className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-[7px] sm:text-xs font-black uppercase text-gray-400 tracking-widest italic">{t('no_posts') || "Aún no tiene historias"}</p>
                </div>
              ) : (
                posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={{ ...post, usuario }}
                    onReact={handleReact}
                    onComment={handleComment}
                    onReply={handleReply}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                    onShare={handleShare}
                    onBookmark={handleBookmark}
                  />
                ))
              )}
            </div>
          ) : activeTab === "aliados" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {usuario.seguidores?.length > 0 ? usuario.seguidores.map(u => (
                <div key={u._id} onClick={() => { navigate(`/usuarios/${u._id}`); window.scrollTo(0,0); }} className="flex items-center justify-between p-2 sm:p-3 bg-white/80 hover:bg-red-50 rounded-xl sm:rounded-2xl border border-red-50 cursor-pointer transition-all group">
                  <div className="flex items-center gap-2">
                    <img src={u.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover" alt={u.nombre} />
                    <div>
                      <p className="text-[9px] sm:text-sm font-black text-gray-900 leading-none">{u.nombre}</p>
                      <p className="text-[6px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">@{u.username || 'usuario'}</p>
                    </div>
                  </div>
                  <Users className="w-3 h-3 text-gray-200 group-hover:text-red-400" />
                </div>
              )) : (
                <div className="col-span-full py-10 text-center opacity-30">
                  <Users className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-black uppercase tracking-widest text-[7px] text-gray-400">{t('no_allies') || "Sin aliados"}</p>
                </div>
              )}
            </div>
          ) : activeTab === "menciones" ? (
             <div className="space-y-4">
                {mentions.length > 0 ? mentions.map(p => (
                   <PostCard
                     key={p._id}
                     post={p}
                     onReact={handleReact}
                     onComment={handleComment}
                     onReply={handleReply}
                     onEditComment={handleEditComment}
                     onDeleteComment={handleDeleteComment}
                     onShare={handleShare}
                     onBookmark={handleBookmark}
                   />
                )) : (
                   <div className="col-span-full py-20 text-center opacity-30 border-2 border-dashed border-red-100 rounded-[3rem]">
                      <AtSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-black uppercase tracking-widest text-[8px] text-gray-400">{t('no_mentions') || "Aún no tiene menciones"}</p>
                   </div>
                )}
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {usuario.siguiendo?.length > 0 ? usuario.siguiendo.map(u => (
                <div key={u._id} onClick={() => { navigate(`/usuarios/${u._id}`); window.scrollTo(0,0); }} className="flex items-center justify-between p-2 sm:p-3 bg-white/80 hover:bg-red-50 rounded-xl sm:rounded-2xl border border-red-50 cursor-pointer transition-all group">
                  <div className="flex items-center gap-2">
                    <img src={u.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover" alt={u.nombre} />
                    <div>
                      <p className="text-[9px] sm:text-sm font-black text-gray-900 leading-none">{u.nombre}</p>
                      <p className="text-[6px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">@{u.username || 'usuario'}</p>
                    </div>
                  </div>
                  <Users className="w-3 h-3 text-gray-200 group-hover:text-red-400" />
                </div>
              )) : (
                <div className="col-span-full py-10 text-center opacity-30">
                  <Users className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-black uppercase tracking-widest text-[7px] text-gray-400">{t('not_following') || "Sin seguidos"}</p>
                </div>
              )}
            </div>
          )}
        </div>

      {/* Fullscreen Media Viewer for Profile/Cover */}
      {mediaFullscreen && (
        <ImageViewer
          media={currentSelectedMedia}
          currentIndex={0}
          onClose={() => setMediaFullscreen(false)}
          onNext={() => {}}
          onPrev={() => {}}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-300 border border-red-50 text-center">
             <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag className="w-8 h-8 text-red-600" />
             </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight uppercase mb-2">{t('report_user_title')}</h3>
              <p className="text-gray-500 text-xs sm:text-sm mb-6 leading-relaxed">{t('report_user_desc')}</p>
              <textarea 
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-red-100 rounded-2xl mb-6 outline-none resize-none h-24 text-sm font-medium"
                placeholder={t('report_user_placeholder')}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
              <div className="flex gap-3">
                <button onClick={() => setShowReportModal(false)} className="flex-1 py-3 text-gray-400 font-bold uppercase text-[10px] sm:text-xs rounded-xl hover:bg-gray-50 transition-colors">{t('cancel')}</button>
                <button onClick={handleReportUser} className="flex-1 py-3 bg-red-600 text-white font-black uppercase text-[10px] sm:text-xs rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 transition-colors">{t('submit_report')}</button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfilOtroUsuario;
