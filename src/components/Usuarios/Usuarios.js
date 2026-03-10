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
  deleteComentario
} from "../../api/posts";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Search, UserPlus, Users, Flame, Newspaper } from "lucide-react";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import StoryBar from "../Stories/StoryBar";

export default function Usuarios() {
  const [search, setSearch] = useState("");
  const [resultados, setResultados] = useState([]);
  const [usuariosAleatorios, setUsuariosAleatorios] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user: userActual } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showConfirm, showPrompt } = useModal();
  const { success, error } = useToast();

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

  const handleEdit = async (id) => {
    const postToEdit = feed.find(p => p._id === id);
    const nuevoContenido = await showPrompt("Editar publicación", "Ingresa el nuevo contenido:", postToEdit?.contenido || "");
    if (!nuevoContenido) return;
    try {
      const editado = await editPost(id, { contenido: nuevoContenido });
      setFeed(feed.map(p => p._id === id ? { ...p, contenido: editado.contenido } : p));
      success("Publicación editada");
    } catch (err) {
      console.error("Error al editar post", err);
      error("Error al editar");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm("Eliminar publicación", "¿Seguro que quieres eliminar esta publicación?");
    if (!confirmed) return;
    try {
      await deletePost(id);
      setFeed(feed.filter(p => p._id !== id));
      success("Publicación eliminada");
    } catch (err) {
      console.error("Error al eliminar post", err);
      error("Error al eliminar");
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
    const confirmed = await showConfirm("Eliminar comentario", "¿Eliminar comentario?");
    if (!confirmed) return;
    try {
      const comentarios = await deleteComentario(postId, comentarioId);
      setFeed(feed.map(p => p._id === postId ? { ...p, comentarios } : p));
      success("Comentario eliminado");
    } catch (err) {
      console.error("Error al eliminar comentario", err);
      error("Error al eliminar");
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Left Column: Feed */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-200">
              <Newspaper className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tu Feed Social</h1>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">Novedades de tu red</p>
            </div>
          </div>

          <StoryBar />

          <CreatePost onPost={handleCreatePost} />

          <div className="space-y-6">
            {feed.length === 0 ? (
              <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-red-100 opacity-50">
                <Users className="w-16 h-16 text-red-200 mx-auto mb-4" />
                <p className="text-gray-400 font-black">Tu feed está vacío. ¡Sigue a alguien!</p>
              </div>
            ) : (
              feed.map(post => (
                <PostCard
                  key={post._id}
                  id={`post-${post._id}`}
                  post={post}
                  onReact={handleReact}
                  onComment={handleComment}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onShare={handleShare}
                  onDeleteComment={handleDeleteComment}
                  onEditComment={handleEditComment}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Column: Search & Suggestions */}
        <div className="space-y-10">
          {/* Search Section */}
          <div className="bg-white rounded-[2.5rem] border border-red-50 p-8 shadow-xl shadow-red-100/20">
            <div className="flex items-center gap-3 mb-6">
              <Search className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Encuentra Amigos</h3>
            </div>

            <div className="relative group mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-red-500" />
              <input
                type="text"
                placeholder="Nombre o @usuario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border-transparent rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-red-50 transition-all outline-none italic"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : resultados.length > 0 && (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {resultados.map((usuario) => (
                  <div
                    key={usuario._id}
                    onClick={() => navigate(`/usuarios/${usuario._id}`)}
                    className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-red-50 cursor-pointer transition-all border border-transparent hover:border-red-100"
                  >
                    <img
                      src={usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                      className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate">{usuario.nombre}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ver Perfil</p>
                    </div>
                    <UserPlus className="w-5 h-5 text-gray-200 group-hover:text-red-600 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggestions Slider */}
          <div className="bg-white rounded-[2.5rem] border border-red-600/5 p-8 shadow-xl shadow-red-100/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Flame className="w-20 h-20 text-red-600" />
            </div>

            <div className="flex items-center gap-3 mb-8 relative z-10">
              <Users className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Suguerencias</h3>
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
                <div key={u._id} className="p-2">
                  <div className="bg-gray-50/50 rounded-[2rem] p-6 text-center border border-red-50 space-y-4">
                    <img
                      src={u.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                      alt={u.nombre}
                      className="w-24 h-24 mx-auto rounded-[1.5rem] object-cover shadow-lg border-4 border-white cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => navigate(`/usuarios/${u._id}`)}
                    />
                    <div>
                      <p className="font-black text-gray-900 text-lg">{u.nombre}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{u.seguidores?.length || 0} Seguidores</p>
                    </div>

                    {yaLoSigo(u) ? (
                      <button
                        className="w-full py-4 bg-red-100 text-red-600 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-200 transition-all"
                        onClick={() => handleDejarDeSeguir(u._id)}
                      >
                        Siguiendo
                      </button>
                    ) : (
                      <button
                        className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-red-200 hover:bg-red-700 hover:scale-[1.02] transition-all"
                        onClick={() => handleSeguir(u._id)}
                      >
                        Seguir Usuario
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </div>
      </div>
    </div>
  );
}
