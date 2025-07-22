import React, { useEffect, useState } from "react";
import useAuth from "../../hooks/useAuth";

export default function ConversacionesList({ onSeleccionar, onCrearConversacion }) {
  const [conversaciones, setConversaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchConversaciones = async () => {
      setCargando(true);
      setError(null);
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BACKEND}/api/conversaciones`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (!res.ok) throw new Error("Error al cargar conversaciones");
        const data = await res.json();
        setConversaciones(Array.isArray(data) ? data : []);
      } catch (error) {
        setError(error.message);
        setConversaciones([]);
      } finally {
        setCargando(false);
      }
    };

    fetchConversaciones();
  }, []);

  const eliminarConversacion = async (id) => {
    const confirmar = window.confirm(
      "¿Eliminar esta conversación y todos sus mensajes?"
    );
    if (!confirmar) return;

    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_BACKEND}/api/conversaciones/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!res.ok) throw new Error("Error al eliminar la conversación");

      setConversaciones((prev) => prev.filter((c) => c._id !== id));
    } catch (error) {
      alert(error.message || "Error eliminando conversación");
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Conversaciones</h3>
        <button
          onClick={onCrearConversacion}
          className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition"
          aria-label="Crear nueva conversación"
        >
          + 
        </button>
      </div>

      {cargando && (
        <div role="status" className="animate-pulse space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-8 bg-gray-300 rounded w-full max-w-xs"
              aria-hidden="true"
            />
          ))}
          <span className="sr-only">Cargando conversaciones...</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="text-red-600 bg-red-100 border border-red-400 p-2 rounded"
        >
          {error}
        </div>
      )}

      {!cargando && !error && conversaciones.length === 0 && (
        <p className="text-gray-500">Aún no hay conversaciones.</p>
      )}

      {!cargando && !error && conversaciones.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {conversaciones.map((conv) => {
            const otro = conv.participantes.find((p) => p._id !== user._id);
            return (
              <li
                key={conv._id}
                className="flex justify-between items-center py-2 cursor-pointer hover:bg-gray-100 rounded px-2"
                onClick={() => onSeleccionar(conv)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSeleccionar(conv);
                }}
                role="button"
                aria-label={`Abrir conversación con ${otro?.nombre || "Usuario"}`}
              >
                <div className="flex items-center gap-3">
                    <img
                     src={
                   otro?.fotoPerfil ||
                  "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"
                     }
                     alt="avatar"
                    className="w-8 h-8 rounded-full object-cover"
                 />
                  <span className="font-medium">{otro?.nombre || "Usuario"}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    eliminarConversacion(conv._id);
                  }}
                  className="text-red-500 hover:text-red-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                  aria-label={`Eliminar conversación con ${otro?.nombre || "Usuario"}`}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
