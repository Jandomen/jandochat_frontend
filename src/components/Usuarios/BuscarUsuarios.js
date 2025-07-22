import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { buscarConversacionPrivada, crearConversacion } from "../../api/conversation";
import { MessageSquare } from "lucide-react";

export default function BuscarUsuarios() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim() === "") {
      setResultados([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      const buscar = async () => {
        setCargando(true);
        try {
          const res = await fetch(
            `${process.env.REACT_APP_API_BACKEND}/api/users?search=${query}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          const data = await res.json();
          setResultados(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error("Error al buscar usuarios", error);
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
    try {
      const existente = await buscarConversacionPrivada(usuario._id);
      if (existente) {
        navigate(`/chat/${existente._id}`, { state: { destinatario: usuario } });
      } else {
        const nueva = await crearConversacion(usuario._id);
        navigate(`/chat/${nueva._id}`, { state: { destinatario: usuario } });
      }
    } catch (error) {
      console.error("Error al iniciar conversación:", error);
      alert("No se pudo iniciar la conversación.");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Buscar usuario</h3>
      <input
        type="text"
        placeholder="Nombre o correo..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border p-2 w-full rounded"
      />

      {!cargando && resultados.length === 0 && query.trim() !== "" && (
        <p className="text-gray-500">No se encontraron usuarios.</p>
      )}

      {resultados.map((user) => (
        <div
          key={user._id}
          className="flex justify-between items-center p-2 hover:bg-gray-100 rounded"
        >
          <div className="flex items-center gap-3">
            <img
              src={
                user.fotoPerfil ||
                "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"
              }
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-medium">{user.nombre}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => iniciarConversacion(user)}
            className="text-green-600 hover:text-green-700 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
            title="Iniciar chat"
            aria-label={`Iniciar chat con ${user.nombre}`}
          >
            <MessageSquare size={22} strokeWidth={2} />
          </button>
        </div>
      ))}
    </div>
  );
}
