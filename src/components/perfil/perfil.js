import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getSeguidores, getSiguiendo } from "../../api/user";
import { Link } from "react-router-dom";

function Perfil() {
  const { user } = useAuth();
  const [seguidores, setSeguidores] = useState([]);
  const [siguiendo, setSiguiendo] = useState([]);

  useEffect(() => {
    const cargarSeguidoresYSiguiendo = async () => {
      try {
        const seguidoresData = await getSeguidores();
        const siguiendoData = await getSiguiendo();
        setSeguidores(seguidoresData || []);
        setSiguiendo(siguiendoData || []);
      } catch (error) {
        console.error("Error al cargar seguidores/siguiendo:", error);
      }
    };

    cargarSeguidoresYSiguiendo();
  }, []);

  const renderUsuario = (usuario) => (
    <Link
      key={usuario._id || usuario.id}
      to={`/usuarios/${usuario._id}`}
      className="flex items-center gap-3 p-2 border rounded hover:bg-gray-100"
    >
      <img
        src={
          usuario.fotoPerfil
            ? `${usuario.fotoPerfil}?t=${Date.now()}`
            : "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"
        }
        alt={`${usuario.nombre} foto`}
        className="w-12 h-12 rounded-full object-cover border border-gray-300"
      />
      <div>
        <p className="font-medium">{usuario.nombre}</p>
        <p className="text-sm text-gray-600">{usuario.username}</p>
      </div>
    </Link>
  );

  return (
    <div className="max-w-xl mx-auto mt-6 p-4 bg-white shadow-lg rounded-lg space-y-6">
      <h1 className="text-2xl font-bold text-center">Mi Perfil</h1>

      <div className="flex flex-col items-center space-y-3">
        <img
          src={
            user?.fotoPerfil
              ? `${user.fotoPerfil}?t=${Date.now()}`
              : "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"
          }
          alt="Foto de perfil"
          className="object-cover w-36 h-36 rounded-full border border-gray-300"
        />
        <p className="text-xl font-semibold">{user?.nombre}</p>
        <p className="text-gray-600">{user?.email}</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Seguidores ({seguidores.length})</h2>
        {seguidores.length === 0 ? (
          <p className="text-sm text-gray-500">Nadie te sigue aún.</p>
        ) : (
          <ul className="space-y-2 mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
            {seguidores.map(renderUsuario)}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold">Siguiendo ({siguiendo.length})</h2>
        {siguiendo.length === 0 ? (
          <p className="text-sm text-gray-500">No estás siguiendo a nadie aún.</p>
        ) : (
          <ul className="space-y-2 mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
            {siguiendo.map(renderUsuario)}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Perfil;
