import React from "react";
import useAuth from "../../hooks/useAuth";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-red-700 text-white flex flex-col sm:flex-row justify-between items-center p-4 gap-3 sm:gap-0">
      <h1 className="text-xl font-bold">JANDOCHAT</h1>
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
        <span className="text-sm sm:text-base">
          Hola, <strong>{user?.nombre || user?.email}</strong>
        </span>
        <button
          onClick={logout}
          className="bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition text-sm sm:text-base"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
