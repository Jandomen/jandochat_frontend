import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { buscarConversacionPrivada, crearConversacion } from "../../api/conversation";
import { userSearch } from "../../api/user";
import { useToast } from "../../context/ToastContext";
import { Search, UserPlus2, ArrowLeft, X as CloseIcon, History } from "lucide-react";

export default function BuscarUsuarios({ onBack }) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState([]);
  const navigate = useNavigate();
  const { error } = useToast();

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("search_history");
    if (saved) {
      try {
        setHistorial(JSON.parse(saved));
      } catch (e) {
        setHistorial([]);
      }
    }
  }, []);

  const saveToHistory = (user) => {
    const newHistory = [user, ...historial.filter(h => h._id !== user._id)].slice(0, 10);
    setHistorial(newHistory);
    localStorage.setItem("search_history", JSON.stringify(newHistory));
  };

  const removeFromHistory = (id, e) => {
    e.stopPropagation();
    const newHistory = historial.filter(h => h._id !== id);
    setHistorial(newHistory);
    localStorage.setItem("search_history", JSON.stringify(newHistory));
  };

  useEffect(() => {
    if (query.trim() === "") {
      setResultados([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      const buscar = async () => {
        setCargando(true);
        try {
          const data = await userSearch(query);
          setResultados(Array.isArray(data) ? data : []);
        } catch (err) {
          setResultados([]);
        } finally {
          setCargando(false);
        }
      };
      buscar();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const iniciarConversacion = async (usuario) => {
    saveToHistory(usuario);
    try {
      const existente = await buscarConversacionPrivada(usuario._id);
      if (existente) {
        navigate(`/chat/${existente._id}`, { state: { destinatario: usuario } });
      } else {
        const nueva = await crearConversacion(usuario._id);
        navigate(`/chat/${nueva._id}`, { state: { destinatario: usuario } });
      }
    } catch (err) {
      console.error(err);
      error("No se pudo iniciar la conversación");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white max-w-2xl mx-auto min-h-screen">
      <div className="p-6 space-y-6 bg-white sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onBack ? onBack() : navigate(-1)}
            className="p-2.5 bg-gray-50 hover:bg-red-50 rounded-2xl text-gray-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Explorar</h3>
            <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em]">Encuentra nuevas estrellas</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-300 group-focus-within:text-red-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o @usuario..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full pl-14 pr-12 py-5 bg-gray-50/50 border-transparent rounded-[2rem] text-sm focus:bg-white focus:ring-4 focus:ring-red-50 transition-all outline-none font-medium italic shadow-inner"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-300 hover:text-red-500"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 pb-20 overflow-y-auto">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-12 h-12 bg-red-50 rounded-full mb-4"></div>
            <p className="text-[10px] font-black text-red-200 uppercase tracking-widest">Calculando trayectorias...</p>
          </div>
        ) : query ? (
          <div className="space-y-4">
            {resultados.length > 0 ? (
              <>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-6">Resultados encontrados</p>
                {resultados.map((usuario) => (
                  <div
                    key={usuario._id}
                    onClick={() => iniciarConversacion(usuario)}
                    className="group flex items-center gap-4 p-5 rounded-[2.5rem] hover:bg-red-50 cursor-pointer transition-all border border-transparent hover:border-red-100 bg-gray-50/30"
                  >
                    <div className="relative">
                      <img
                        src={usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                        className="w-12 h-12 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                        alt=""
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate group-hover:text-red-700 transition-colors">{usuario.nombre}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">@{usuario.username || 'usuario'}</p>
                    </div>
                    <div className="p-3 bg-white text-gray-200 group-hover:bg-red-600 group-hover:text-white rounded-2xl shadow-sm transition-all">
                      <UserPlus2 className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No hay nada en este sector</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {historial.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <History className="w-3 h-3 text-red-600" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Búsquedas Recientes</p>
                  </div>
                  <button
                    onClick={() => { setHistorial([]); localStorage.removeItem("search_history"); }}
                    className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline"
                  >
                    Borrar todo
                  </button>
                </div>
                <div className="space-y-2">
                  {historial.map((usuario) => (
                    <div
                      key={usuario._id}
                      onClick={() => iniciarConversacion(usuario)}
                      className="group flex items-center gap-4 p-4 rounded-3xl hover:bg-gray-50 cursor-pointer transition-all border border-transparent hover:border-gray-100"
                    >
                      <img
                        src={usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                        className="w-10 h-10 rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100"
                        alt=""
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-600 group-hover:text-gray-900 truncate text-sm">{usuario.nombre}</p>
                        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">@{usuario.username || 'usuario'}</p>
                      </div>
                      <button
                        onClick={(e) => removeFromHistory(usuario._id, e)}
                        className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-8 bg-gradient-to-br from-red-600 to-red-700 rounded-[3rem] text-white overflow-hidden relative">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <h4 className="text-xl font-black mb-2 tracking-tight">Crea nuevas conexiones</h4>
                <p className="text-red-100 text-xs font-bold leading-relaxed opacity-80">Busca a tus amigos por su nombre o nombre de usuario único en la red.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
