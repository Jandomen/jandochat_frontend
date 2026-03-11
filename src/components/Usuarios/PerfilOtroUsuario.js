import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getUserById,
  dejarDeSeguirUsuario,
  seguirUsuario,
  bloquearUsuario,
} from "../../api/user";
import { getPostsByUser, reaccionarPost, comentarPost } from "../../api/posts";
import { buscarConversacionPrivada, crearConversacion } from "../../api/conversation";
import useAuth from "../../hooks/useAuth";
import { useModal } from "../../context/ModalContext";
import { useToast } from "../../context/ToastContext";
import PostCard from "./PostCard";
import { ShieldAlert, MessageSquare, MapPin, Calendar, Newspaper, Phone, Users } from "lucide-react";
import { useCall } from "../../context/CallContext";
import ImageViewer from "../UI/ImageViewer";

const PerfilOtroUsuario = () => {
  const { id } = useParams();
  const { user: userActual } = useAuth();
  const navigate = useNavigate();
  const { showConfirm } = useModal();
  const { success, error: showErrorToast } = useToast();
  const [usuario, setUsuario] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeTab, setActiveTab] = useState("historias");
  const [mediaFullscreen, setMediaFullscreen] = useState(false);
  const [currentSelectedMedia, setCurrentSelectedMedia] = useState([]);
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
        setErrorMsg("No se pudo cargar el perfil del usuario.");
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
      success("Has dejado de seguir");
    } catch (err) {
      showErrorToast("Error al dejar de seguir");
    }
  };

  const handleBloquear = async () => {
    const confirmed = await showConfirm("Bloquear", "¿Bloquear a este usuario?");
    if (!confirmed) return;
    try {
      await bloquearUsuario(id);
      success("Usuario bloqueado");
      navigate("/usuarios");
    } catch (err) {
      showErrorToast("Error al bloquear");
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
      showErrorToast("No se pudo iniciar chat");
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 font-black uppercase text-[10px]">Cargando...</p>
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
    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-10 px-0.5 sm:px-0">
      {/* Header: Cover */}
      <div className="relative w-full">
        <div 
          className="aspect-[21/9] sm:aspect-[4/1] rounded-2xl sm:rounded-[3rem] overflow-hidden shadow-lg relative bg-red-950 cursor-pointer group/cover z-10"
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
        <div className="bg-white/95 backdrop-blur-xl border border-red-500/5 rounded-2xl sm:rounded-[4rem] p-3 sm:p-12 -mt-10 sm:-mt-24 mx-0.5 sm:mx-12 shadow-2xl relative z-20 flex flex-col items-center">
          <div className="relative -mt-14 sm:-mt-36 mb-2 sm:mb-4">
            <div className="w-20 h-20 sm:w-44 sm:h-44 rounded-2xl sm:rounded-[2.5rem] p-1 bg-white shadow-2xl">
              <img
                src={usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                className="w-full h-full rounded-2xl sm:rounded-[2rem] object-cover cursor-pointer"
                alt=""
                onClick={() => {
                  setCurrentSelectedMedia([{ url: usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png", tipo: "imagen" }]);
                  setMediaFullscreen(true);
                }}
              />
            </div>
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-3 h-3 sm:w-10 sm:h-10 bg-green-500 border-2 sm:border-4 border-white rounded-full shadow-lg"></div>
          </div>

          <div className="w-full text-center">
            <h2 className="text-xl sm:text-5xl font-black text-gray-900 tracking-tighter leading-tight mb-0.5 sm:mb-1">{usuario.nombre}</h2>
            <p className="text-red-600 font-extrabold uppercase tracking-widest text-[8px] sm:text-sm mb-3 sm:mb-4">@{usuario.nombre.replace(/\s+/g, '').toLowerCase()}</p>
            {usuario.bio && (
              <p className="text-gray-500 font-medium text-[9px] sm:text-base mb-4 sm:mb-6 max-w-md mx-auto leading-relaxed italic px-2">"{usuario.bio}"</p>
            )}
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-10 text-gray-400 mb-4 sm:mb-8 border-y border-red-500/10 py-2 sm:py-4">
              {usuario.ubicacion && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <MapPin className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-red-500" />
                  <span className="text-[7px] sm:text-sm font-black uppercase tracking-tighter">{usuario.ubicacion}</span>
                </div>
              )}
              {usuario.createdAt && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-red-500" />
                  <span className="text-[7px] sm:text-sm font-black uppercase tracking-tighter">
                    {new Date(usuario.createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            {/* Actions (Only if not self) */}
            {!isSelf && (
              <div className="flex justify-center gap-2 sm:gap-4 mb-4 sm:mb-8">
                <button
                  onClick={handleEnviarMensaje}
                  className="p-2 sm:p-5 bg-gray-50 text-gray-400 rounded-xl sm:rounded-[2rem] hover:bg-red-50 hover:text-red-600 transition-all border border-gray-100 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={() => startCall(id, "voice", usuario)}
                  disabled={activeCall}
                  className="p-2 sm:p-5 bg-red-50 text-red-600 rounded-xl sm:rounded-[2rem] hover:bg-red-600 hover:text-white transition-all border border-red-100 disabled:opacity-30 shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
                </button>
                
                {siguiendo ? (
                  <button
                    onClick={handleDejarDeSeguir}
                    className="px-4 py-2 sm:px-12 sm:py-5 bg-white border-2 border-red-600 text-red-600 font-black rounded-xl sm:rounded-[2rem] text-[8px] sm:text-xs uppercase tracking-tighter"
                  >
                    Siguiendo
                  </button>
                ) : (
                  <button
                    onClick={handleSeguir}
                    className="px-4 py-2 sm:px-12 sm:py-5 bg-red-600 text-white font-black rounded-xl sm:rounded-[2rem] text-[8px] sm:text-xs uppercase tracking-tighter shadow-lg shadow-red-200"
                  >
                    Aliar
                  </button>
                )}
                
                <button
                  onClick={handleBloquear}
                  className="p-2 sm:p-5 bg-gray-50 text-gray-300 hover:text-red-600 rounded-xl sm:rounded-[2rem] transition-all"
                >
                  <ShieldAlert className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
                </button>
              </div>
            )}

            <div className="flex justify-center gap-3 sm:gap-20">
              <div onClick={() => setActiveTab("historias")} className="flex flex-col items-center cursor-pointer group">
                <p className="text-sm sm:text-4xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase">{posts.length}</p>
                <p className="text-[6px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{posts.length === 1 ? 'Historia' : 'Historias'}</p>
              </div>
              <div onClick={() => setActiveTab("aliados")} className="flex flex-col items-center px-4 sm:px-8 border-x border-red-500/10 cursor-pointer group">
                <p className="text-sm sm:text-4xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase">{usuario.seguidores?.length || 0}</p>
                <p className="text-[6px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Aliados</p>
              </div>
              <div onClick={() => setActiveTab("siguiendo")} className="flex flex-col items-center cursor-pointer group">
                <p className="text-sm sm:text-4xl font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase">{usuario.siguiendo?.length || 0}</p>
                <p className="text-[6px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Siguiendo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section with Tabs */}
      <div className="space-y-3 sm:space-y-6 pt-3 sm:pt-10 px-1 sm:px-12">
        <div className="flex gap-1.5 sm:gap-4 justify-center sm:justify-start">
          {["historias", "aliados", "siguiendo"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-10 py-1.5 sm:py-3.5 rounded-md sm:rounded-2xl font-black text-[7px] sm:text-xs uppercase tracking-widest transition-all whitespace-nowrap border ${activeTab === tab ? 'bg-red-600 text-white shadow-lg border-red-600' : 'bg-white text-gray-400 border-red-50 hover:text-red-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="min-h-[200px]">
          {activeTab === "historias" ? (
            <div className="space-y-2 sm:space-y-4">
              {posts.length === 0 ? (
                <div className="bg-white/50 rounded-2xl p-10 sm:p-20 text-center border border-dashed border-red-100 opacity-40">
                  <Newspaper className="w-6 h-6 sm:w-10 sm:h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-[7px] sm:text-xs font-black uppercase text-gray-400 tracking-widest italic">Sin historias compartidas</p>
                </div>
              ) : (
                posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={{ ...post, usuario }}
                    onReact={handleReact}
                    onComment={handleComment}
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
                  <p className="font-black uppercase tracking-widest text-[7px] text-gray-400">Sin aliados</p>
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

export default PerfilOtroUsuario;
