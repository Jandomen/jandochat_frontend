import React, { useState, useEffect } from "react";
import {
  userSearch,
  getUsuariosAleatorios,
  seguirUsuario,
  dejarDeSeguirUsuario,
} from "../../api/user";
import {
  getFeed,
  createPost,
  reaccionarPost,
  comentarPost,
  responderComentario,
  editPost,
  deletePost,
  sharePost,
  editComentario,
  deleteComentario,
  bookmarkPost
} from "../../api/posts";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Search, UserPlus, Users, Flame, Newspaper, X } from "lucide-react";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import EditPostModal from "./EditPostModal";
import StoryBar from "../Stories/StoryBar";
import useSocket from "../../hooks/useSocket";

export default function Usuarios() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [resultados, setResultados] = useState([]);
  const [usuariosAleatorios, setUsuariosAleatorios] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState(() => {
    const saved = localStorage.getItem("search_history_feed");
    return saved ? JSON.parse(saved) : [];
  });
  const { user: userActual, setUser: setUserActual } = useAuth();
  const { socket } = useSocket();
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { showConfirm } = useModal();
  const { success, error } = useToast();

  useEffect(() => {
    if (!socket) return;

    socket.on("nuevoPost", (newPost) => {
      setFeed((prev) => {
        if (prev.find(p => p._id === newPost._id)) return prev;
        return [newPost, ...prev];
      });
    });

    socket.on("actualizarPost", (updatedPost) => {
      setFeed((prev) => prev.map((p) => p._id === updatedPost._id ? updatedPost : p));
    });

    socket.on("eliminarPost", (postId) => {
      setFeed((prev) => prev.filter((p) => p._id !== postId));
    });

    socket.on("actualizarComentarios", ({ postId, comentarios }) => {
      setFeed((prev) => prev.map(p => p._id === postId ? { ...p, comentarios } : p));
    });

    socket.on("actualizarReacciones", ({ postId, reacciones }) => {
      setFeed((prev) => prev.map(p => p._id === postId ? { ...p, reacciones } : p));
    });

    return () => {
      socket.off("nuevoPost");
      socket.off("actualizarPost");
      socket.off("eliminarPost");
      socket.off("actualizarComentarios");
      socket.off("actualizarReacciones");
    };
  }, [socket]);

  const handleBookmark = async (id) => {
    try {
      const res = await bookmarkPost(id);

      setUserActual({ ...userActual, guardados: res.guardados });
      success(res.msg);
    } catch (err) {
      error(t('error_saving') || "Error al guardar");
    }
  };

  useEffect(() => {
    const fetchSearch = async () => {
      if (!search.trim()) return setResultados([]);
      setLoading(true);
      try {
        const data = await userSearch(search);
        setResultados(data);
      } catch (err) {
        console.error("Error buscando usuarios:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSearch();
  }, [search]);

  useEffect(() => {
    localStorage.setItem("search_history_feed", JSON.stringify(historial));
  }, [historial]);

  const addToHistory = (u) => {
    const item = { _id: u._id, nombre: u.nombre, fotoPerfil: u.fotoPerfil, username: u.username };
    setHistorial(prev => {
      const filtered = prev.filter(h => h._id !== u._id);
      return [item, ...filtered].slice(0, 5);
    });
    navigate(`/usuarios/${u._id}`);
  };

  const removeFromHistory = (e, id) => {
    e.stopPropagation();
    setHistorial(prev => prev.filter(h => h._id !== id));
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [aleatorios, feedData] = await Promise.all([
          getUsuariosAleatorios(),
          getFeed()
        ]);
        setUsuariosAleatorios(aleatorios);
        setFeed(feedData);
      } catch (err) {
        console.error("Error cargando datos iniciales:", err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const highlightPostId = location.state?.highlightPost;
    const highlightCommentId = location.state?.highlightCommentId;

    if (highlightPostId && feed.length > 0) {
      setTimeout(() => {
        const postElement = document.getElementById(`post-${highlightPostId}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: "smooth", block: "center" });
          postElement.classList.add("ring-4", "ring-red-400");

          if (highlightCommentId) {
            const commentElement = document.getElementById(`comment-${highlightCommentId}`);
            if (commentElement) {
              commentElement.scrollIntoView({ behavior: "smooth", block: "center" });
              commentElement.classList.add("ring-4", "ring-yellow-400", "bg-yellow-50");
              setTimeout(() => {
                commentElement.classList.remove("ring-4", "ring-yellow-400", "bg-yellow-50");
              }, 5000);
            }
          }

          setTimeout(() => {
            postElement.classList.remove("ring-4", "ring-red-400");
          }, 3000);
        }
      }, 100);
      navigate(location.pathname, { replace: true });
    }
  }, [feed, location.state, location.pathname, navigate]);

  const handleCreatePost = async (data) => {
    try {
      const nuevo = await createPost(data);
      setFeed([nuevo, ...feed]);
    } catch (err) {
      console.error("Error al crear post", err);
    }
  };

  const handleReact = async (id, tipo) => {
    try {
      const reacciones = await reaccionarPost(id, tipo);
      setFeed(feed.map(p => p._id === id ? { ...p, reacciones } : p));
    } catch (err) {
      console.error("Error al reaccionar", err);
    }
  };

  const handleComment = async (id, texto) => {
    try {
      const comentarios = await comentarPost(id, texto);
      setFeed(feed.map(p => p._id === id ? { ...p, comentarios } : p));
    } catch (err) {
      console.error("Error al comentar", err);
    }
  };

  const handleReply = async (id, comentarioId, texto) => {
    try {
      const comentarios = await responderComentario(id, comentarioId, texto);
      setFeed(feed.map(p => p._id === id ? { ...p, comentarios } : p));
    } catch (err) {
      console.error("Error al responder comentario", err);
    }
  };

  const handleEdit = (id) => {
    const postToEdit = feed.find(p => p._id === id);
    setEditingPost(postToEdit);
    setIsEditing(true);
  };

  const onSaveEdit = async (id, contenido) => {
    try {
      const editado = await editPost(id, { contenido });
      setFeed(feed.map(p => p._id === id ? { ...p, contenido: editado.contenido, mentions: editado.mentions } : p));
      success(t('post_edited_success'));
    } catch (err) {
      error(t('error_editing') || "Error al editar");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(t('post_delete_confirm_title'), t('post_delete_confirm_desc'));
    if (!confirmed) return;
    try {
      await deletePost(id);
      setFeed(feed.filter(p => p._id !== id));
      success(t('post_deleted_success'));
    } catch (err) {
      console.error("Error al eliminar post", err);
      error(t('error_deleting') || "Error al eliminar");
    }
  };

  const handleShare = async (id, contenidoCompartir) => {
    try {
      const compartido = await sharePost(id, { contenidoCompartir });
      setFeed([compartido, ...feed]);
    } catch (err) {
      console.error("Error al compartir post", err);
    }
  };

  const handleEditComment = async (postId, comentarioId, texto) => {
    try {
      const comentarios = await editComentario(postId, comentarioId, texto);
      setFeed(feed.map(p => p._id === postId ? { ...p, comentarios } : p));
    } catch (err) {
      console.error("Error al editar comentario", err);
    }
  };

  const handleDeleteComment = async (postId, comentarioId) => {
    const confirmed = await showConfirm(t('delete_comment_title'), t('confirm_delete_comment'));
    if (!confirmed) return;
    try {
      const comentarios = await deleteComentario(postId, comentarioId);
      setFeed(feed.map(p => p._id === postId ? { ...p, comentarios } : p));
      success(t('comment_deleted'));
    } catch (err) {
      console.error("Error al eliminar comentario", err);
      error(t('delete_error'));
    }
  };

  const handleSeguir = async (id) => {
    try {
      await seguirUsuario(id);
      setUsuariosAleatorios((prev) =>
        prev.map((u) =>
          u._id === id ? { ...u, seguidores: [...(u.seguidores || []), { _id: userActual._id }] } : u
        )
      );
    } catch (err) {
      console.error("Error al seguir usuario", err);
    }
  };

  const handleDejarDeSeguir = async (id) => {
    try {
      await dejarDeSeguirUsuario(id);
      setUsuariosAleatorios((prev) =>
        prev.map((u) =>
          u._id === id
            ? {
              ...u,
              seguidores: (u.seguidores || []).filter((s) => s._id !== userActual._id),
            }
            : u
        )
      );
    } catch (err) {
      console.error("Error al dejar de seguir", err);
    }
  };

  const yaLoSigo = (u) => {
    const id = userActual._id;
    if (!u.seguidores) return false;
    if (typeof u.seguidores[0] === "object") {
      return u.seguidores.some((s) => s._id === id);
    }
    return u.seguidores.includes(id);
  };

  const SuggestionsSlider = () => (
    <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-red-600/5 p-2 sm:p-8 shadow-xl shadow-red-100/10 overflow-hidden relative mb-3 mt-1">
      <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-5">
        <Flame className="w-16 h-16 sm:w-20 sm:h-20 text-red-600" />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-8 relative z-10">
        <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-red-600" />
        <h3 className="text-xs sm:text-lg font-black text-gray-900 tracking-tight">{t('suggestions')}</h3>
      </div>

      <Slider
        dots={false}
        infinite={true}
        speed={1000}
        autoplay={true}
        autoplaySpeed={3000}
        slidesToShow={1}
        slidesToScroll={1}
      >
        {usuariosAleatorios.map((u) => (
          <div key={u._id} className="p-1 sm:p-2">
            <div className="bg-gray-50/50 rounded-xl sm:rounded-[2rem] p-2 sm:p-6 text-center border border-red-50 space-y-2 sm:space-y-4">
              <img
                src={u.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                alt={u.nombre}
                className="w-12 h-12 sm:w-24 sm:h-24 mx-auto rounded-lg sm:rounded-[1.5rem] object-cover shadow-lg border sm:border-4 border-white cursor-pointer hover:scale-110 transition-transform"
                onClick={() => navigate(`/usuarios/${u._id}`)}
              />
              <div>
                <p className="font-black text-gray-900 text-xs sm:text-lg leading-tight">{u.nombre}</p>
                <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400">{u.seguidores?.length || 0} {t('followers')}</p>
              </div>

              {yaLoSigo(u) ? (
                <button
                  className="w-full py-2 sm:py-4 bg-red-100 text-red-600 font-black uppercase tracking-widest text-[8px] sm:text-[10px] rounded-lg sm:rounded-xl hover:bg-red-200 transition-all"
                  onClick={() => handleDejarDeSeguir(u._id)}
                >
                  {t('following')}
                </button>
              ) : (
                <button
                  className="w-full py-2 sm:py-4 bg-red-600 text-white font-black uppercase tracking-widest text-[8px] sm:text-[10px] rounded-lg sm:rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 hover:scale-[1.02] transition-all"
                  onClick={() => handleSeguir(u._id)}
                >
                  {t('follow')}
                </button>
              )}
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-1.5 sm:px-4 py-2 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-10">

        {/* Left Column: Feed */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-8">
          <div className="flex items-center gap-2 sm:gap-4 mb-2">
            <div className="p-1.5 sm:p-3 bg-red-600 text-white rounded-lg sm:rounded-2xl shadow-lg shadow-red-200">
              <Newspaper className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-3xl font-black text-gray-900 tracking-tight">🪐 {t('explore_title')}</h1>
              <p className="text-gray-400 font-bold uppercase text-[7px] sm:text-[10px] tracking-[0.3em]">{t('explore_subtitle')}</p>
            </div>
          </div>

          <StoryBar />

          {/* Search Section moved here */}
          <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-red-50 p-2 sm:p-8 shadow-xl shadow-red-100/10 mb-3 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
              <Search className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-red-600" />
              <h3 className="text-sm sm:text-lg font-black text-gray-900 tracking-tight">{t('friends')}</h3>
            </div>

            <div className="relative group mb-3 sm:mb-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-colors group-focus-within:text-red-500" />
              <input
                type="text"
                placeholder={`${t('search')}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 sm:pl-12 pr-4 sm:pr-6 py-2 sm:py-4 bg-gray-50/50 border-transparent rounded-xl sm:rounded-2xl text-[10px] sm:text-sm focus:bg-white focus:ring-4 focus:ring-red-50 transition-all outline-none italic"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (search.trim() ? resultados : historial).length > 0 && (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    {search.trim() ? t('search_results') : t('recent')}
                  </p>
                  {!search.trim() && historial.length > 0 && (
                    <button onClick={() => setHistorial([])} className="text-[9px] font-black text-red-600 uppercase tracking-widest hover:underline">{t('clear_all')}</button>
                  )}
                </div>
                {(search.trim() ? resultados : historial).map((usuario) => (
                  <div
                    key={usuario._id}
                    onClick={() => addToHistory(usuario)}
                    className="group flex items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-xl sm:rounded-3xl hover:bg-red-50 cursor-pointer transition-all border border-transparent hover:border-red-100 bg-gray-50/20"
                  >
                    <img
                      src={usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                      className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate text-[10px] sm:text-sm">{usuario.nombre}</p>
                      <p className="text-[7px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">@{usuario.username || 'usuario'}</p>
                    </div>
                    {search.trim() ? (
                      <UserPlus className="w-3 h-3 text-gray-200 group-hover:text-red-600 transition-colors" />
                    ) : (
                      <button onClick={(e) => removeFromHistory(e, usuario._id)} className="p-1 hover:bg-red-100 rounded-lg text-gray-300 hover:text-red-600 transition-all">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <CreatePost onPost={handleCreatePost} />

          <div className="space-y-6">
            {feed.length === 0 ? (
              <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-10 sm:p-20 text-center border-2 border-dashed border-red-100 opacity-50">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-red-200 mx-auto mb-4" />
                <p className="text-gray-400 font-black text-sm sm:text-base">{t('empty_feed')}</p>
              </div>
            ) : (
              feed.map((post, index) => (
                <React.Fragment key={post._id}>
                  <PostCard
                    id={`post-${post._id}`}
                    post={post}
                    onReact={handleReact}
                    onComment={handleComment}
                    onReply={handleReply}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onShare={handleShare}
                    onBookmark={handleBookmark}
                    onDeleteComment={handleDeleteComment}
                    onEditComment={handleEditComment}
                  />

                  {(index + 1) % 5 === 0 && (
                    <div className="lg:hidden">
                      <SuggestionsSlider />
                    </div>
                  )}
                </React.Fragment>
              ))
            )}
          </div>
        </div>


        <div className="space-y-10">


          <SuggestionsSlider />
        </div>
      </div>

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
}
