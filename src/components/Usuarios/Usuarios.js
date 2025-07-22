import React, { useState, useEffect } from "react";
import {
  userSearch,
  getUsuariosAleatorios,
  seguirUsuario,
  dejarDeSeguirUsuario,
} from "../../api/user";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function Usuarios() {
  const [search, setSearch] = useState("");
  const [resultados, setResultados] = useState([]);
  const [usuariosAleatorios, setUsuariosAleatorios] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user: userActual } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      if (!search.trim()) return setResultados([]);
      setLoading(true);
      try {
        const data = await userSearch(search);
        setResultados(data);
      } catch (err) {
        console.error("Error buscando usuarios:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [search]);

  useEffect(() => {
    const fetchAleatorios = async () => {
      try {
        const data = await getUsuariosAleatorios();
        setUsuariosAleatorios(data);
      } catch (err) {
        console.error("Error cargando usuarios aleatorios:", err);
      }
    };
    fetchAleatorios();
  }, []);

  const handleSeguir = async (id) => {
    try {
      await seguirUsuario(id);
      setUsuariosAleatorios((prev) =>
        prev.map((u) =>
          u._id === id ? { ...u, seguidores: [...(u.seguidores || []), { _id: userActual.id }] } : u
        )
      );
    } catch (err) {
      console.error("Error al seguir usuario", err);
    }
  };

  const handleDejarDeSeguir = async (id) => {
    try {
      await dejarDeSeguirUsuario(id);
      setUsuariosAleatorios((prev) =>
        prev.map((u) =>
          u._id === id
            ? {
                ...u,
                seguidores: (u.seguidores || []).filter((s) => s._id !== userActual.id),
              }
            : u
        )
      );
    } catch (err) {
      console.error("Error al dejar de seguir", err);
    }
  };

  const yaLoSigo = (u) => {
  const id = userActual.id;
  if (!u.seguidores) return false;

  if (typeof u.seguidores[0] === "object") {
    return u.seguidores.some((s) => s._id === id);
  }

  return u.seguidores.includes(id);
};


  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 2000,
    autoplay: true,
    autoplaySpeed: 4000,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 p-4 bg-white rounded shadow space-y-10">
      <section>
        <h2 className="text-2xl font-bold text-center mb-4">Buscar Usuarios</h2>
        <input
          type="text"
          placeholder="Buscar por nombre o @usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />

        {loading ? (
          <p className="text-center text-sm text-gray-500">Buscando...</p>
        ) : (
          <ul className="space-y-2">
            {resultados.map((usuario) => (
              <li
                key={usuario._id}
                onClick={() => navigate(`/usuarios/${usuario._id}`)}
                className="p-3 border rounded hover:bg-gray-100 cursor-pointer flex items-center space-x-4"
              >
                <img
                  src={
                    usuario.fotoPerfil ||
                    "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"
                  }
                  alt={usuario.nombre}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">{usuario.nombre}</p>
                  
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

       <section style={{ paddingTop: "20.5rem" }} className="border-t">
        <h2 className="text-xl font-bold mb-4 text-center">Usuarios que podrías seguir</h2>
        <Slider {...sliderSettings}>
          {usuariosAleatorios.map((u) => (
            <div key={u._id} className="px-2">
              <div className="w-full p-4 border rounded-lg shadow bg-gray-50 text-center">
                <img
                  src={
                    u.fotoPerfil ||
                    "/assets/Custom-Icon-Design-Pretty-Office-8-User-red.256.png"
                  }
                  alt={u.nombre}
                  className="w-16 h-16 mx-auto rounded-full object-cover mb-2 cursor-pointer"
                  onClick={() => navigate(`/usuarios/${u._id}`)}
                />
                <p className="font-semibold text-sm truncate">{u.nombre}</p>
                
                {yaLoSigo(u) ? (
                  <button
                    className="mt-2 text-xs bg-yellow-500 text-white px-3 py-1 rounded"
                    onClick={() => handleDejarDeSeguir(u._id)}
                  >
                    Dejar de seguir
                  </button>
                ) : (
                  <button
                    className="mt-2 text-xs bg-green-600 text-white px-3 py-1 rounded"
                    onClick={() => handleSeguir(u._id)}
                  >
                    Seguir
                  </button>
                )}
              </div>
            </div>
          ))}
        </Slider>
      </section>
    </div>
  );
}
