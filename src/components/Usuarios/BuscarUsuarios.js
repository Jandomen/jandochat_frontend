import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { buscarConversacionPrivada, crearConversacion } from "../../api/conversation";
import { useToast } from "../../context/ToastContext";
import { MessageSquare, Search, UserPlus2, ArrowLeft, X as CloseIcon, History } from "lucide-react";

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
          const token = localStorage.getItem("token");
          const res = await fetch(
            `${process.env.REACT_APP_API_BACKEND}/api/users/buscar?search=${encodeURIComponent(query)}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const data = await res.json();
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
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Cerca de ti</p>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-sm focus:bg-white focus:border-red-500 focus:shadow-xl focus:shadow-red-500/10 transition-all outline-none italic font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 pb-24">
        {/* Historial de búsqueda */}
        {!query && historial.length > 0 && (
          <div className="space-y-4 mb-10">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                <History className="w-4 h-4" />
                Recientes
              </h4>
              <button
                onClick={() => { localStorage.removeItem("search_history"); setHistorial([]); }}
                className="text-[10px] font-black text-red-500 uppercase hover:underline"
              >
                Borrar todo
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {historial.map((user) => (
                <div
                  key={`hist-${user._id}`}
                  onClick={() => iniciarConversacion(user)}
                  className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-2xl hover:bg-red-50 group cursor-pointer border border-transparent hover:border-red-100 transition-all"
                >
                  <img src={user.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"} alt={user.nombre} className="w-10 h-10 rounded-xl object-cover" />
                  <span className="flex-1 font-bold text-gray-700 text-sm truncate">{user.nombre}</span>
                  <button
                    onClick={(e) => removeFromHistory(user._id, e)}
                    className="p-2 text-gray-300 hover:text-red-500 rounded-lg hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resultados */}
        {!cargando && resultados.length === 0 && query.trim() !== "" && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300 opacity-60">
            <UserPlus2 className="w-16 h-16 mb-4 stroke-[1.5]" />
            <p className="text-sm font-black uppercase tracking-[0.2em]">Sin resultados encontrados</p>
          </div>
        )}

        {cargando ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-50 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {resultados.map((user) => (
              <div
                key={user._id}
                onClick={() => iniciarConversacion(user)}
                className="flex items-center gap-5 p-5 bg-white border-2 border-gray-50 rounded-[2.5rem] cursor-pointer hover:border-red-500 hover:shadow-2xl hover:shadow-red-500/10 transition-all group relative overflow-hidden active:scale-[0.98]"
              >
                <div className="relative">
                  <img
                    src={user.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                    alt="avatar"
                    className="w-14 h-14 rounded-2xl object-cover shadow-lg border-2 border-white group-hover:scale-105 transition-transform"
                  />
                  {user.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-gray-900 group-hover:text-red-700 transition-colors truncate">
                    {user.nombre}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 truncate italic">
                    {user.email}
                  </p>
                </div>

                <div className="p-3 bg-red-600 text-white rounded-2xl translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all shadow-lg shadow-red-200">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

