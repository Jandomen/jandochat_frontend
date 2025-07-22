import React from "react";
import useAuth from "../../hooks/useAuth";

export default function HeaderChat({ notificaciones = [] }) {
  const { user } = useAuth();

  if (!user) return null; 

  return (
    <header className="p-4 border-b border-gray-300 flex justify-between items-center">
      <div>
        <strong>{user.nombre || user.username || "Usuario"}</strong>
      </div>
      <div>
        <button className="relative">
          🛎️
          {notificaciones.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs px-1">
              {notificaciones.length}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
