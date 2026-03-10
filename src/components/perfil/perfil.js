import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";
import { getSeguidores, getSiguiendo } from "../../api/user";
import {
  getPostsByUser,
  reaccionarPost,
  comentarPost,
  responderComentario,
  editPost,
  deletePost,
  sharePost,
  editComentario,
  deleteComentario
} from "../../api/posts";
import { Link } from "react-router-dom";
import { Users, Mail, Calendar, MapPin, Edit3, ChevronRight, Newspaper, Globe } from "lucide-react";
import PostCard from "../Usuarios/PostCard";

function Perfil() {
  const { user } = useAuth();
  const { showConfirm, showPrompt } = useModal();
  const { success, error } = useToast();
  const [seguidores, setSeguidores] = useState([]);
  const [siguiendo, setSiguiendo] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("publicaciones");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [seg, sig, misPosts] = await Promise.all([
          getSeguidores(),
          getSiguiendo(),
          getPostsByUser(user._id)
        ]);
        setSeguidores(seg || []);
        setSiguiendo(sig || []);
        setPosts(misPosts || []);
      } catch (error) {
        console.error("Error al cargar datos del perfil:", error);
      }
    };
    if (user?._id) cargarDatos();
  }, [user?._id]);

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

  const handleEdit = async (id) => {
    const post = posts.find(p => p._id === id);
    const nuevo = await showPrompt("Editar publicación", "Nuevo contenido:", post?.contenido || "");
    if (!nuevo) return;
    try {
      const editado = await editPost(id, { contenido: nuevo });
      setPosts(posts.map(p => p._id === id ? { ...p, contenido: editado.contenido } : p));
      success("Editado");
    } catch (err) { 
      console.error("Error edit", err);
      error("Error al editar");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm("Eliminar", "¿Eliminar esta publicación?");
    if (!confirmed) return;
    try {
      await deletePost(id);
      setPosts(posts.filter(p => p._id !== id));
      success("Publicación eliminada");
    } catch (err) { 
      console.error("Error delete", err);
      error("Error al eliminar");
    }
  };

  const handleShare = async (id, content) => {
    try {
      const shared = await sharePost(id, { contenidoCompartir: content });
      setPosts([shared, ...posts]);
      success("Compartido");
    } catch (err) { 
      console.error("Error share", err);
      error("Error al compartir");
    }
  };

  const handleEditComment = async (pid, cid, txt) => {
    try {
      const comments = await editComentario(pid, cid, txt);
      setPosts(posts.map(p => p._id === pid ? { ...p, comentarios: comments } : p));
    } catch (err) { console.error("Error edit comment", err); }
  };

  const handleDeleteComment = async (pid, cid) => {
    const confirmed = await showConfirm("Eliminar comentario", "¿Eliminar?");
    if (!confirmed) return;
    try {
      const comments = await deleteComentario(pid, cid);
      setPosts(posts.map(p => p._id === pid ? { ...p, comentarios: comments } : p));
      success("Comentario eliminado");
    } catch (err) { 
      console.error("Error delete comment", err);
      error("Error al eliminar");
    }
  };

  const renderUsuario = (usuario) => (
    <Link
      key={usuario._id || usuario.id}
      to={`/usuarios/${usuario._id}`}
      className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-red-50/50 rounded-3xl transition-all group"
    >
      <div className="flex items-center gap-4">
        <img
          src={usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
          alt={usuario.nombre}
          className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform"
        />
        <div>
          <p className="font-black text-gray-900 group-hover:text-red-700 transition-colors">{usuario.nombre}</p>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">@{usuario.username || 'usuario'}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-red-300 transition-colors" />
    </Link>
  );

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="relative mt-8 group">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-400 rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
        <div className="relative bg-white border border-red-50 rounded-[3rem] p-8 shadow-xl shadow-red-100/20 overflow-hidden text-center md:text-left">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-red-600/5 rounded-full"></div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="relative group/avatar">
              <div className="absolute inset-0 bg-red-600 rounded-[2.5rem] blur-lg opacity-20 group-hover/avatar:opacity-40 transition-opacity"></div>
              <img
                src={user?.fotoPerfil ? `${user.fotoPerfil}${user.fotoPerfil.includes('?') ? '&' : '?'}t=${Date.now()}` : "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                alt="Perfil"
                className="w-40 h-40 md:w-48 md:h-48 object-cover rounded-[2.5rem] border-4 border-white shadow-2xl relative z-10"
              />
              <Link to="/configuraciones" className="absolute bottom-2 right-2 z-20 p-3 bg-red-600 text-white rounded-2xl shadow-lg hover:bg-red-700 transition-all">
                <Edit3 className="w-5 h-5" />
              </Link>
            </div>
            <div className="flex-1 pt-4">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">{user?.nombre}</h1>
              {user?.bio && (
                <p className="text-gray-600 font-bold mt-2 text-sm">{user.bio}</p>
              )}
              <p className="text-red-600 font-black uppercase tracking-[0.2em] text-xs mt-1">Tu Espacio Personal</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                <div className="px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-bold text-gray-600 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-500" /> {user?.email}
                </div>
                {user?.createdAt && (
                  <div className="px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-bold text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-500" /> 
                    {new Date(user.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
                {user?.ubicacion && (
                  <div className="px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-bold text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" /> {user.ubicacion}
                  </div>
                )}
                {user?.sitioWeb && (
                  <a href={user.sitioWeb.startsWith('http') ? user.sitioWeb : `https://${user.sitioWeb}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-bold text-red-600 flex items-center gap-2 hover:bg-red-50 transition-colors">
                    <Globe className="w-4 h-4" /> {user.sitioWeb.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
              <div className="flex justify-center md:justify-start gap-8 mt-8 border-t border-gray-50 pt-6">
                <div onClick={() => setActiveTab("publicaciones")} className="cursor-pointer group">
                  <p className="text-2xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase">{posts.length}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Publicaciones</p>
                </div>
                <div onClick={() => setActiveTab("seguidores")} className="cursor-pointer group px-4 border-x border-gray-50">
                  <p className="text-2xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase">{seguidores.length}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seguidores</p>
                </div>
                <div onClick={() => setActiveTab("siguiendo")} className="cursor-pointer group">
                  <p className="text-2xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase">{siguiendo.length}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Siguiendo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 px-4">
        <div className="flex gap-4 mb-6 overflow-x-auto scrollbar-hide pb-2">
          {["publicaciones", "seguidores", "siguiendo"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'bg-white text-gray-400 hover:text-red-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div>
          {activeTab === "publicaciones" ? (
            <div className="space-y-6">
              {posts.length > 0 ? posts.map(p => (
                <PostCard
                  key={p._id}
                  post={p}
                  onReact={handleReact}
                  onComment={handleComment}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onShare={handleShare}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                />
              )) : (
                <div className="py-20 text-center opacity-20 border-2 border-dashed border-red-100 rounded-[3rem]">
                  <Newspaper className="w-16 h-16 mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest">No has publicado nada aún</p>
                </div>
              )}
            </div>
          ) : activeTab === "seguidores" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seguidores.length > 0 ? seguidores.map(renderUsuario) : (
                <div className="col-span-full py-20 text-center opacity-20">
                  <Users className="w-16 h-16 mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest">Nadie te sigue aún</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {siguiendo.length > 0 ? siguiendo.map(renderUsuario) : (
                <div className="col-span-full py-20 text-center opacity-20">
                  <Users className="w-16 h-16 mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest">No sigues a nadie</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Perfil;

