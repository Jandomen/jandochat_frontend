import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getUserById,
  dejarDeSeguirUsuario,
  seguirUsuario,
  bloquearUsuario,
} from "../../api/user";
import { useAuth } from "../../context/AuthContext";

const PerfilOtroUsuario = () => {
  const { id } = useParams();
  const { user: userActual } = useAuth();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const siguiendo = usuario?.seguidores?.some(
    (s) => s._id.toString() === userActual.id.toString()
  );

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        setLoading(true);
        const data = await getUserById(id);
        setUsuario(data);
        setError(null);
      } catch (err) {
        setError("No se pudo cargar el perfil del usuario.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsuario();
  }, [id, userActual.id]);

  const handleSeguir = async () => {
    try {
      await seguirUsuario(id);
      setUsuario((prev) => ({
        ...prev,
        seguidores: [...(prev.seguidores || []), {
          _id: userActual.id,
          nombre: userActual.nombre,
          username: userActual.username,
          fotoPerfil: userActual.fotoPerfil,
        }],
      }));
    } catch {
      alert("Error al seguir al usuario.");
    }
  };

  const handleDejarDeSeguir = async () => {
    try {
      await dejarDeSeguirUsuario(id);
      setUsuario((prev) => ({
        ...prev,
        seguidores: (prev.seguidores || []).filter(
          (s) => s._id.toString() !== userActual.id.toString()
        ),
      }));
    } catch {
      alert("Error al dejar de seguir al usuario.");
    }
  };

  const handleBloquear = async () => {
    if (!window.confirm("¿Estás seguro de que quieres bloquear a este usuario?")) return;
    try {
      await bloquearUsuario(id);
      alert("Usuario bloqueado correctamente.");
    } catch {
      alert("Error al bloquear usuario.");
    }
  };

  if (loading) return <p className="text-center mt-4">Cargando perfil...</p>;
  if (error) return <p className="text-center text-red-600 mt-4">{error}</p>;
  if (!usuario) return null;

  return (
    <div className="max-w-md mx-auto mt-6 p-6 bg-white shadow rounded-xl border">
      <div className="flex flex-col items-center">
        <img
          src={usuario.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
          alt="Avatar"
          className="w-24 h-24 rounded-full object-cover mb-4 border"
        />
        <h2 className="text-xl font-bold">{usuario.nombre}</h2>
        <p className="text-gray-600">{usuario.username}</p>

        <div className="flex gap-4 mt-4">
          <div>
            <p className="font-semibold text-center">{usuario.seguidores?.length || 0}</p>
            <p className="text-sm text-gray-500 text-center">Seguidores</p>
          </div>
          <div>
            <p className="font-semibold text-center">{usuario.siguiendo?.length || 0}</p>
            <p className="text-sm text-gray-500 text-center">Siguiendo</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {siguiendo ? (
            <button
              onClick={handleDejarDeSeguir}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            >
              Dejar de seguir
            </button>
          ) : (
            <button
              onClick={handleSeguir}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Seguir
            </button>
          )}

          <button
            onClick={handleBloquear}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Bloquear
          </button>
        </div>

        <div className="mt-8 w-full">
          <h3 className="font-bold text-lg mb-2">Seguidores</h3>
          {usuario.seguidores?.length ? (
            <ul className="max-h-40 overflow-auto border rounded p-2 space-y-2">
              {usuario.seguidores.map((seguidor) => (
                <li
                  key={seguidor._id}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 rounded p-1"
                  onClick={() => window.location.href = `/usuarios/${seguidor._id}`}
                >
                  <img
                    src={seguidor.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                    alt={seguidor.nombre}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span>{seguidor.nombre} </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No tiene seguidores aún.</p>
          )}
        </div>

        <div className="mt-6 w-full">
          <h3 className="font-bold text-lg mb-2">Siguiendo</h3>
          {usuario.siguiendo?.length ? (
            <ul className="max-h-40 overflow-auto border rounded p-2 space-y-2">
              {usuario.siguiendo.map((siguiendoUser) => (
                <li
                  key={siguiendoUser._id}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 rounded p-1"
                  onClick={() => window.location.href = `/usuarios/${siguiendoUser._id}`}
                >
                  <img
                    src={siguiendoUser.fotoPerfil || "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"}
                    alt={siguiendoUser.nombre}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span>{siguiendoUser.nombre} </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No sigue a ningún usuario aún.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerfilOtroUsuario;
