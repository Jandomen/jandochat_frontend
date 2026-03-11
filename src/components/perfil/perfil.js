import React, { useState, useEffect } from "react";
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
  deleteComentario
} from "../../api/posts";
import { Link } from "react-router-dom";
import { Users, Mail, MapPin, Edit3, ChevronRight, Newspaper, Trash2, Camera } from "lucide-react";
import PostCard from "../Usuarios/PostCard";
import ImageViewer from "../UI/ImageViewer";
import MediaPickerModal from "../UI/MediaPickerModal";

const Perfil = () => {
  const { user, setUser } = useAuth();
  const { showConfirm, showPrompt } = useModal();
  const { success, error } = useToast();
  const [seguidores, setSeguidores] = useState([]);
  const [siguiendo, setSiguiendo] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("publicaciones");
  const [loadingCover, setLoadingCover] = useState(false);
  const [mediaFullscreen, setMediaFullscreen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [currentSelectedMedia, setCurrentSelectedMedia] = useState([]);
  const coverInputRef = React.useRef(null);

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

  const handleUpdateCover = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingCover(true);
    const formData = new FormData();
    formData.append("fotoPortada", file);

    try {
      const res = await uploadCoverPhoto(formData);
      const updatedUser = { ...user, fotoPortada: res.fotoPortada };
      setUser(updatedUser);
      localStorage.setItem("usuario", JSON.stringify(updatedUser));
      success("Foto de portada actualizada");
    } catch (err) {
      error("Error al subir portada");
    } finally {
      setLoadingCover(false);
    }
  };

  const handleDeleteCover = async () => {
    const confirm = await showConfirm("Eliminar portada", "¿Seguro que quieres eliminar tu foto de portada?");
    if (!confirm) return;

    try {
      await deleteCoverPhoto();
      const updatedUser = { ...user, fotoPortada: "" };
      setUser(updatedUser);
      localStorage.setItem("usuario", JSON.stringify(updatedUser));
      success("Portada eliminada");
    } catch (err) {
      error("Error al eliminar portada");
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
      className="flex items-center justify-between p-2.5 bg-gray-50/50 hover:bg-red-50/50 rounded-2xl transition-all group"
    >
      <div className="flex items-center gap-2.5">
        <img
          src={usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
          alt={usuario.nombre}
          className="w-9 h-9 rounded-xl object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform"
        />
        <div>
          <p className="font-black text-gray-900 group-hover:text-red-700 transition-colors text-[9px] sm:text-sm">{usuario.nombre}</p>
          <p className="text-[6px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest">@{usuario.username || 'usuario'}</p>
        </div>
      </div>
      <ChevronRight className="w-3 h-3 text-gray-200 group-hover:text-red-300 transition-colors" />
    </Link>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-12 px-2 sm:px-4 sm:pt-8">
      <MediaPickerModal 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)} 
        onSelect={(type) => {
          if (!coverInputRef.current) return;
          if (type === 'camera') {
            coverInputRef.current.setAttribute('capture', 'environment');
          } else {
            coverInputRef.current.removeAttribute('capture');
          }
          setTimeout(() => coverInputRef.current.click(), 100);
        }}
        filter={["camera", "gallery"]}
      />
      {/* Cover Photo Section */}
      <div className="relative w-full">
        <div 
          className="aspect-[21/9] sm:aspect-[4/1] rounded-2xl sm:rounded-[3rem] overflow-hidden shadow-lg group/cover relative bg-red-950 cursor-pointer z-10"
          onClick={() => {
            console.log("Cover clicked - Profile");
            setCurrentSelectedMedia([{ url: user?.fotoPortada || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop", tipo: "imagen" }]);
            setMediaFullscreen(true);
          }}
        >
          <img
            src={user?.fotoPortada || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop"}
            alt="Portada"
            className="w-full h-full object-cover transform transition-transform duration-700 group-hover/cover:scale-110 pointer-events-none"
          />
          <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>
          
          <div className="absolute top-1.5 right-1.5 sm:top-6 sm:right-6 flex gap-1 z-30">
            <button
              onClick={(e) => { e.stopPropagation(); setIsPickerOpen(true); }}
              className="flex items-center gap-1 bg-white/95 backdrop-blur-md text-gray-900 px-1.5 py-1 sm:px-4 sm:py-3 rounded-md font-black text-[6px] sm:text-[10px] uppercase tracking-widest shadow-xl border border-red-50 active:scale-95 transition-all"
              disabled={loadingCover}
            >
              {loadingCover ? <div className="w-2 h-2 border-2 border-red-600 border-t-transparent animate-spin rounded-full"></div> : <Camera className="w-2.5 h-2.5 text-red-600" />}
              <span>Edit</span>
            </button>
            {user?.fotoPortada && (
              <button
                onClick={handleDeleteCover}
                className="p-1 sm:p-3 bg-red-600/90 backdrop-blur-sm text-white rounded-md shadow-xl border border-red-400 active:scale-95 transition-all"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Profile Card Overlay - Ultra Compact for 340px */}
        <div className="bg-white/95 backdrop-blur-xl border border-red-500/5 rounded-2xl sm:rounded-[4rem] p-4 sm:p-12 -mt-10 sm:-mt-24 mx-2 sm:mx-16 shadow-2xl relative z-20 flex flex-col items-center">
          <div className="relative -mt-16 sm:-mt-36 mb-4">
            <div className="w-16 h-16 sm:w-44 sm:h-44 rounded-lg sm:rounded-[2.5rem] p-1 bg-white shadow-2xl relative group/avatar">
              <img
                src={user?.fotoPerfil ? `${user.fotoPerfil}${user.fotoPerfil.includes('?') ? '&' : '?'}t=${Date.now()}` : "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                className="w-full h-full rounded-lg sm:rounded-[2rem] object-cover cursor-pointer"
                alt=""
                onClick={() => {
                  setCurrentSelectedMedia([{ url: user?.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png", tipo: "imagen" }]);
                  setMediaFullscreen(true);
                }}
              />
              <Link to="/configuraciones" className="absolute -bottom-1 -right-1 z-20 p-1.5 sm:p-4 bg-red-600 text-white rounded-md sm:rounded-2xl shadow-xl border border-white active:scale-90 transition-all hover:bg-red-700">
                <Edit3 className="w-2.5 h-2.5 sm:w-6 sm:h-6" />
              </Link>
            </div>
          </div>

          <div className="w-full text-center">
            <h1 className="text-base sm:text-5xl font-black text-gray-900 tracking-tighter leading-tight mb-0">{user?.nombre}</h1>
            <p className="text-red-600 font-extrabold uppercase tracking-widest text-[7px] sm:text-sm mb-2">@{user?.username || user?.nombre?.replace(/\s+/g, '').toLowerCase()}</p>
            {user?.bio && (
              <p className="text-gray-500 font-medium text-[8px] sm:text-base mb-3 max-w-md mx-auto leading-relaxed italic px-2">"{user.bio}"</p>
            )}
            
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-10 text-gray-400 mb-4 border-y border-red-500/10 py-2">
              <div className="flex items-center gap-1">
                <Mail className="w-2.5 h-2.5 text-red-500" />
                <span className="text-[7px] sm:text-sm font-black uppercase tracking-tighter">{user?.email}</span>
              </div>
              {user?.ubicacion && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-red-500" />
                  <span className="text-[7px] sm:text-sm font-black uppercase tracking-tighter">{user.ubicacion}</span>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3 sm:gap-20">
              <div onClick={() => setActiveTab("publicaciones")} className="cursor-pointer group flex flex-col items-center">
                <p className="text-sm sm:text-4xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase">{posts.length}</p>
                <p className="text-[6px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Historias</p>
              </div>
              <div onClick={() => setActiveTab("seguidores")} className="cursor-pointer group flex flex-col items-center px-3 sm:px-8 border-x border-red-500/10">
                <p className="text-sm sm:text-4xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase">{seguidores.length}</p>
                <p className="text-[6px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Aliados</p>
              </div>
              <div onClick={() => setActiveTab("siguiendo")} className="cursor-pointer group flex flex-col items-center">
                <p className="text-sm sm:text-4xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase">{siguiendo.length}</p>
                <p className="text-[6px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Siguiendo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <input type="file" ref={coverInputRef} onChange={handleUpdateCover} className="hidden" accept="image/*" />

      {/* Tabs & Full Feed Area */}
      <div className="space-y-3 pt-3">
        <div className="flex gap-1.5 sm:gap-4 overflow-x-auto scrollbar-hide pb-1.5 justify-center sm:justify-start px-1.5">
          {["publicaciones", "seguidores", "siguiendo"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-10 py-1.5 sm:py-3.5 rounded-md sm:rounded-2xl font-black text-[8px] sm:text-xs uppercase tracking-widest transition-all whitespace-nowrap border ${activeTab === tab ? 'bg-red-600 text-white shadow-lg shadow-red-200 border-red-600' : 'bg-white text-gray-400 border-red-50 hover:text-red-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="min-h-[200px] px-1.5">
          {activeTab === "publicaciones" ? (
            <div className="space-y-2">
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
                <div className="py-10 text-center border border-dashed border-red-50 rounded-xl opacity-30">
                  <Newspaper className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="font-black uppercase tracking-widest text-[7px] text-gray-400">Sin historias</p>
                </div>
              )}
            </div>
          ) : activeTab === "seguidores" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {seguidores.length > 0 ? seguidores.map(renderUsuario) : (
                <div className="col-span-full py-10 text-center opacity-30">
                  <Users className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-black uppercase tracking-widest text-[7px] text-gray-400">Sin aliados</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {siguiendo.length > 0 ? siguiendo.map(renderUsuario) : (
                <div className="col-span-full py-10 text-center opacity-30">
                  <Users className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-black uppercase tracking-widest text-[7px] text-gray-400">Sin seguidos</p>
                </div>
              )}
            </div>
          )}
        </div>
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
    </div>
  );
};

export default Perfil;
