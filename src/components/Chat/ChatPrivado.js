import React, { useEffect, useState, useRef } from "react";
import useSocket from "../../hooks/useSocket";
import useAuth from "../../hooks/useAuth";
import {
  obtenerMensajes,
  enviarMensajeAPI,
  editarMensajeAPI,
  eliminarMensajeAPI,
  crearConversacion,
} from "../../api/chat";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";


function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}



function ChatPrivado({ conversacionId: propConversacionId, destinatario: propDestinatario }) {
  const { user: usuario } = useAuth();

  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [destinatario, setDestinatario] = useState(propDestinatario || null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuActivoId, setMenuActivoId] = useState(null);

  const mensajesEndRef = useRef(null);
  const { id } = useParams();
  const location = useLocation();
  const locationDestinatario = location.state?.destinatario || null;
  const conversacionId = propConversacionId || id;

  const socket = useSocket({
    "mensaje-recibido": (nuevoMensaje) => {
      if (nuevoMensaje.conversacion === conversacionId) {
        setMensajes((prev) => [...prev, nuevoMensaje]);
      }
    },
    "mensaje-editado": (msgActualizado) => {
      setMensajes((prev) =>
        prev.map((m) => (m._id === msgActualizado._id ? msgActualizado : m))
      );
    },
    "mensaje-eliminado": (idEliminado) => {
      setMensajes((prev) => prev.filter((m) => m._id !== idEliminado));
    },
  });

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  useEffect(() => {
    if (!conversacionId) return;

    const cargarMensajes = async () => {
      try {
        const data = await obtenerMensajes(conversacionId);
        setMensajes(data || []);
        setError(null);
      } catch (error) {
        setError("No se pudieron cargar los mensajes.");
      }
    };

    cargarMensajes();
  }, [conversacionId]);

  useEffect(() => {
    if (!usuario) return;

    const cargarDestinatario = async () => {
      try {
        if (propDestinatario) {
          setDestinatario(propDestinatario);
        } else if (locationDestinatario) {
          setDestinatario(locationDestinatario);
        } else if (!destinatario && conversacionId) {
          const res = await axios.get(
            `${process.env.REACT_APP_API_BACKEND}/api/conversaciones/${conversacionId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          const participantes = res.data.participantes || [];
          const otro = participantes.find((p) => p._id !== usuario?._id);
          setDestinatario(otro);
        }
      } catch (error) {
        setError("No se pudo cargar el destinatario.");
      }
    };

    cargarDestinatario();
  }, [conversacionId, propDestinatario, locationDestinatario, destinatario, usuario]);

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!mensaje.trim() || !destinatario || loading || !usuario) return;
    setLoading(true);

    try {
      let idConversacion = conversacionId;

      if (!idConversacion) {
        const nuevaConversacion = await crearConversacion(
          { participantes: [usuario._id, destinatario._id] },
          localStorage.getItem("token")
        );
        idConversacion = nuevaConversacion._id;
      }

      const nuevoMensaje = {
        contenido: mensaje,
        conversacion: idConversacion,
        emisor: usuario._id,
      };

      await enviarMensajeAPI(nuevoMensaje);
      setMensaje("");
      setError(null);
    } catch (error) {
      setError("Error al enviar el mensaje.");
      console.error("❌ Error al enviar el mensaje:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = (id) => {
    setMenuActivoId(menuActivoId === id ? null : id);
  };

  const editarMensaje = async (mensajeOriginal) => {
    const nuevoContenido = prompt("Editar mensaje:", mensajeOriginal.contenido);
    if (!nuevoContenido || nuevoContenido === mensajeOriginal.contenido) return;

    try {
      const actualizado = await editarMensajeAPI(mensajeOriginal._id, { contenido: nuevoContenido });
      setMensajes((prev) =>
        prev.map((m) => (m._id === actualizado._id ? actualizado : m))
      );
      socket.emit("mensaje-editado", actualizado);
    } catch (error) {
      setError("No se pudo editar el mensaje.");
    } finally {
      setMenuActivoId(null);
    }
  };

  const eliminarMensaje = async (mensajeId) => {
    const confirmar = window.confirm("¿Eliminar este mensaje?");
    if (!confirmar) return;

    try {
      await eliminarMensajeAPI(mensajeId);
      setMensajes((prev) => prev.filter((m) => m._id !== mensajeId));
      socket.emit("mensaje-eliminado", mensajeId);
    } catch (error) {
      setError("No se pudo eliminar el mensaje.");
    } finally {
      setMenuActivoId(null);
    }
  };

  return (
    <div>
    
     
    <div className="flex flex-col h-screen max-h-screen w-full md:w-[600px] mx-auto border rounded shadow bg-white-400">
      
      {destinatario ? (
           <div className="flex items-center gap-3 p-4 border-b bg-gray-50 sticky top-0 z-10">
           <Link
  to={`/usuarios/${destinatario._id}`}
  className="flex items-center gap-3 hover:bg-gray-100 p-1 rounded transition"
>
  <img
    src={
      destinatario.fotoPerfil ||
      "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"
    }
    alt="avatar"
    className="w-10 h-10 rounded-full object-cover"
  />
  <span className="font-semibold text-base sm:text-lg">
    {destinatario.nombre}
  </span>
</Link>
     
     </div>

      ) : (
        <div className="p-4 border-b text-red-500 text-sm bg-red-50 sticky top-0 z-10">
          ❗ Cargando destinatario...
        </div>
      )}

    
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 text-sm sm:text-base">
        {mensajes.map((m, i) => {
          const emisorId = typeof m.emisor === "string" ? m.emisor : m.emisor?._id;
          const esAutor = emisorId === usuario?._id;

          return (
            <div
              key={m._id || i}
              className={`mb-4 flex flex-col ${esAutor ? "items-end" : "items-start"} relative group`}
            >
              <div className="text-xs text-gray-500 mb-1">
                {m.emisorNombre || (esAutor ? "Tú" : destinatario?.nombre || "Desconocido")}
              </div>

              <div
                className={`relative px-4 py-2 rounded-lg max-w-xs break-words ${
                  esAutor ? "bg-green-600 text-white" : "bg-gray-200 text-black"
                }`}
                title={
                  m.updatedAt && m.updatedAt !== m.createdAt
                    ? `Editado el ${new Date(m.updatedAt).toLocaleString()}`
                    : `Enviado el ${new Date(m.createdAt).toLocaleString()}`
                }
              >
                <span>{escapeHTML(m.contenido)}</span>

                {m.updatedAt && m.updatedAt !== m.createdAt && (
                  <span className="ml-2 text-xs italic opacity-70">(editado)</span>
                )}

                {esAutor && (
                  <div className="absolute top-0 right-0">
                    <button
                      onClick={() => toggleMenu(m._id)}
                      className="text-white/60 hover:text-white/90 px-1 text-sm"
                      aria-label="Menú opciones"
                    >
                      &#x22EE;
                    </button>

                    {menuActivoId === m._id && (
                      <div className="absolute right-0 mt-6 w-28 bg-white border rounded shadow-md z-10 text-sm">
                        <button
                          onClick={() => editarMensaje(m)}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-700"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => eliminarMensaje(m._id)}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                        >
                          🗑 Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={mensajesEndRef} />
      </div>


      {error && <div className="text-red-500 text-sm text-center">{error}</div>}

     
      <form onSubmit={enviarMensaje} className="p-2 sm:p-4 flex gap-2 border-t bg-gray-50">
        <input
          type="text"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 px-3 py-2 sm:px-4 sm:py-2 border rounded text-sm sm:text-base focus:outline-none focus:ring focus:border-blue-300"
        />
        <button
          type="submit"
          className="bg-green-500 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base disabled:opacity-50"
          disabled={!destinatario || loading || !mensaje.trim()}
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </div>
    
    </div>
  );
}

export default ChatPrivado;
