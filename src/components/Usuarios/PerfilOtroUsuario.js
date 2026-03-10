import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getUserById,
  dejarDeSeguirUsuario,
  seguirUsuario,
  bloquearUsuario,
} from "../../api/user";
import { getPostsByUser, reaccionarPost, comentarPost, responderComentario, editPost, deletePost, sharePost, editComentario, deleteComentario } from "../../api/posts";
import { buscarConversacionPrivada, crearConversacion } from "../../api/conversation";
import useAuth from "../../hooks/useAuth";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";
import PostCard from "./PostCard";
import { UserPlus, UserMinus, ShieldAlert, MessageSquare, MapPin, Calendar, Link as LinkIcon, Camera, Phone, Video } from "lucide-react";
import { useCall } from "../../context/CallContext";

const PerfilOtroUsuario = () => {
  const { id } = useParams();
  const { user: userActual } = useAuth();
  const navigate = useNavigate();
  const { showConfirm, showPrompt } = useModal();
  const { success, error: showErrorToast } = useToast();
  const [usuario, setUsuario] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const { startCall, activeCall } = useCall();

  const siguiendo = usuario?.seguidores?.some(
    (s) => (s._id || s).toString() === (userActual?._id || userActual?.id)?.toString()
  );

  useEffect(() => {
    const fetchDatos = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [userData, userPosts] = await Promise.all([
          getUserById(id),
          getPostsByUser(id)
        ]);
        setUsuario(userData);
        setPosts(userPosts);
        setErrorMsg(null);
      } catch (err) {
        console.error("Error cargando perfil:", err);
        setErrorMsg("No se pudo cargar el perfil del usuario o no tienes permiso.");
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, [id, userActual?._id]);

  const handleSeguir = async () => {
    try {
      await seguirUsuario(id);
      setUsuario((prev) => ({
        ...prev,
        seguidores: [...(prev.seguidores || []), { _id: userActual._id }],
      }));
      success("Ahora sigues a este usuario");
    } catch (err) {
      console.error(err);
      showErrorToast("Error al seguir al usuario");
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
      success("Has dejado de seguir");
    } catch (err) {
      console.error(err);
      showErrorToast("Error al dejar de seguir");
    }
  };

  const handleBloquear = async () => {
    const confirmed = await showConfirm("Bloquear usuario", "¿Estás seguro de que quieres bloquear a este usuario?");
    if (!confirmed) return;
    try {
      await bloquearUsuario(id);
      success("Usuario bloqueado");
      navigate("/usuarios");
    } catch (err) {
      console.error(err);
      showErrorToast("Error al bloquear usuario");
    }
  };

  const handleEnviarMensaje = async () => {
    try {
      // First, try to find an existing conversation with this user
      const convExistente = await buscarConversacionPrivada(id);
      if (convExistente) {
        navigate(`/chat/${convExistente._id}`, { state: { destinatario: usuario } });
      } else {
        // Create a new conversation
        const nuevaConv = await crearConversacion(id);
        navigate(`/chat/${nuevaConv._id}`, { state: { destinatario: usuario } });
      }
    } catch (err) {
      console.error("Error al iniciar conversación:", err);
      showErrorToast("No se pudo iniciar la conversación");
    }
  };

  const handleReact = async (postId, tipo) => {
    try {
      const reacciones = await reaccionarPost(postId, tipo);
      setPosts(posts.map(p => p._id === postId ? { ...p, reacciones } : p));
    } catch (err) {
      console.error("Error al reaccionar", err);
    }
  };

  const handleComment = async (postId, texto) => {
    try {
      const comentarios = await comentarPost(postId, texto);
      setPosts(posts.map(p => p._id === postId ? { ...p, comentarios } : p));
    } catch (err) {
      console.error("Error al comentar", err);
    }
  };

  const handleReply = async (postId, comentarioId, texto) => {
    try {
      const comentarios = await responderComentario(postId, comentarioId, texto);
      setPosts(posts.map(p => p._id === postId ? { ...p, comentarios } : p));
    } catch (err) {
      console.error("Error al responder comentario", err);
    }
  };

  const handleEdit = async (id) => {
    const post = posts.find(p => p._id === id);
    const nuevoContenido = await showPrompt("Editar publicación", "Ingresa el nuevo contenido:", post?.contenido || "");
    if (!nuevoContenido) return;
    try {
      const editado = await editPost(id, { contenido: nuevoContenido });
      setPosts(posts.map(p => p._id === id ? { ...p, contenido: editado.contenido } : p));
      success("Publicación editada");
    } catch (err) {
      console.error("Error al editar post", err);
      showErrorToast("Error al editar");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm("Eliminar", "¿Seguro que quieres eliminar esta publicación?");
    if (!confirmed) return;
    try {
      await deletePost(id);
      setPosts(posts.filter(p => p._id !== id));
      success("Publicación eliminada");
    } catch (err) {
      console.error("Error al eliminar post", err);
      showErrorToast("Error al eliminar");
    }
  };

  const handleShare = async (id, contenidoCompartir) => {
    try {
      await sharePost(id, { contenidoCompartir });
      success("¡Publicación compartida!");
    } catch (err) {
      console.error("Error al compartir post", err);
      showErrorToast("Error al compartir");
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
    const confirmed = await showConfirm("Eliminar comentario", "¿Eliminar comentario?");
    if (!confirmed) return;
    try {
      const comentarios = await deleteComentario(postId, comentarioId);
      setPosts(posts.map(p => p._id === postId ? { ...p, comentarios } : p));
      success("Comentario eliminado");
    } catch (err) {
      console.error("Error al eliminar comentario", err);
      showErrorToast("Error al eliminar");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Cargando Universo...</p>
    </div>
  );

  if (errorMsg) return (
    <div className="max-w-md mx-auto mt-20 p-12 bg-white rounded-[3rem] border-2 border-dashed border-red-100 text-center">
      <ShieldAlert className="w-16 h-16 text-red-200 mx-auto mb-6" />
      <p className="text-gray-900 font-bold mb-2">{errorMsg}</p>
      <button onClick={() => navigate("/usuarios")} className="text-red-600 font-black uppercase text-[10px] tracking-widest hover:underline">Volver a Usuarios</button>
    </div>
  );

  if (!usuario) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10 animate-in fade-in duration-700">

      {/* Profile Header Card */}
      <div className="relative group">
        {/* Cover Photo */}
        <div className="h-64 rounded-[3.5rem] bg-gradient-to-br from-red-600 to-red-800 shadow-2xl relative overflow-hidden">
          <img
            src={usuario?.fotoPortada || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop"}
            alt="Portada"
            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all"></div>
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-12 left-1/4 w-32 h-32 bg-red-400/20 rounded-full blur-2xl"></div>
        </div>

        {/* Profile Info Card */}
        <div className="bg-white/80 backdrop-blur-3xl rounded-[3rem] border border-white p-8 -mt-24 mx-4 sm:mx-12 shadow-2xl relative z-10 flex flex-col md:flex-row items-center md:items-end gap-8">
          <div className="relative -mt-20 md:-mt-32">
            <div className="w-40 h-40 rounded-[3rem] p-2 bg-white shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-500">
              <img
                src={usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                alt="Avatar"
                className="w-full h-full rounded-[2.5rem] object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 border-4 border-white rounded-full shadow-lg"></div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-1">{usuario.nombre}</h2>
            {usuario.bio && (
              <p className="text-gray-600 font-bold text-sm mb-2">{usuario.bio}</p>
            )}
            <p className="text-red-600 font-bold uppercase tracking-[0.3em] text-xs mb-4">@{usuario.nombre}</p>

            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-500">
              {usuario.ubicacion && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">{usuario.ubicacion}</span>
                </div>
              )}
              {usuario.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {new Date(usuario.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleEnviarMensaje}
              className="p-5 bg-gray-50 text-gray-400 rounded-[2rem] hover:bg-red-50 hover:text-red-600 transition-all shadow-sm border border-transparent hover:border-red-100"
              title="Enviar Mensaje"
            >
              <MessageSquare className="w-6 h-6" />
            </button>

            <button
              onClick={() => startCall(id, "voice", usuario)}
              disabled={activeCall}
              className="p-5 bg-green-50 text-green-400 rounded-[2rem] hover:bg-green-600 hover:text-white transition-all shadow-sm border border-transparent hover:border-green-100 disabled:opacity-30"
              title="Llamada de voz"
            >
              <Phone className="w-6 h-6" />
            </button>

            <button
              onClick={() => startCall(id, "video", usuario)}
              disabled={activeCall}
              className="p-5 bg-blue-50 text-blue-400 rounded-[2rem] hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-transparent hover:border-blue-100 disabled:opacity-30"
              title="Videollamada"
            >
              <Video className="w-6 h-6" />
            </button>

            {siguiendo ? (
              <button
                onClick={handleDejarDeSeguir}
                className="px-10 py-5 bg-white border-2 border-red-600 text-red-600 font-black rounded-[2rem] hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-red-100 uppercase text-[10px] tracking-widest flex items-center gap-3 group/btn"
              >
                <UserMinus className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                <span>Siguiendo</span>
              </button>
            ) : (
              <button
                onClick={handleSeguir}
                className="px-10 py-5 bg-red-600 text-white font-black rounded-[2rem] hover:bg-red-700 transition-all shadow-xl shadow-red-200 uppercase text-[10px] tracking-widest flex items-center gap-3 group/btn"
              >
                <UserPlus className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                <span>Seguir</span>
              </button>
            )}

            <button
              onClick={handleBloquear}
              className="p-5 bg-white border border-red-100 text-red-200 hover:text-red-600 hover:border-red-600 rounded-[2rem] transition-all group/block"
              title="Bloquear Usuario"
            >
              <ShieldAlert className="w-6 h-6 group-hover/block:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-white rounded-[3rem] p-8 border border-red-50 shadow-xl shadow-red-100/10">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
              <Camera className="w-6 h-6 text-red-600" />
              <span>Estadísticas</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-red-50 rounded-[2rem] text-center">
                <p className="text-2xl font-black text-red-600">{usuario.seguidores?.length || 0}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Seguidores</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-[2rem] text-center">
                <p className="text-2xl font-black text-gray-900">{usuario.siguiendo?.length || 0}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Siguiendo</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-8 border border-red-50 shadow-xl shadow-red-100/10">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
              <LinkIcon className="w-6 h-6 text-red-600" />
              <span>Enlaces</span>
            </h3>
            <div className="space-y-4">
              {usuario.sitioWeb && (
                <a
                  href={usuario.sitioWeb.startsWith('http') ? usuario.sitioWeb : `https://${usuario.sitioWeb}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 hover:bg-red-50 rounded-2xl transition-all cursor-pointer group/link text-gray-400 hover:text-red-700"
                >
                  <p className="text-sm font-bold truncate">{usuario.sitioWeb.replace(/^https?:\/\//, '')}</p>
                </a>
              )}
              <div className="flex items-center gap-4 p-4 hover:bg-red-50 rounded-2xl transition-all cursor-pointer group/link text-gray-400 hover:text-red-700">
                <p className="text-sm font-bold truncate">@{usuario.nombre}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Posts Feed */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white text-red-600 rounded-2xl shadow-lg border border-red-100">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Publicaciones</h3>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em]">{posts.length} Historias compartidas</p>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-red-50 opacity-50">
              <Camera className="w-16 h-16 text-red-200 mx-auto mb-4" />
              <p className="text-gray-400 font-black">Este usuario aún no ha publicado nada.</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post._id}
                post={{ ...post, usuario }} // Ensure user image is present
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
    </div>
  );
};

export default PerfilOtroUsuario;
