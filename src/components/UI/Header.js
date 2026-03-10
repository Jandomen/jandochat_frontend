import React from "react";
import useAuth from "../../hooks/useAuth";
import { LogOut, Bell, Menu } from "lucide-react";

export default function Header({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const letters = [
    { src: "/Letras/icons8-j-50.png", alt: "J" },
    { src: "/Letras/icons8-a-50.png", alt: "A" },
    { src: "/Letras/icons8-n-50.png", alt: "N" },
    { src: "/Letras/icons8-d-50.png", alt: "D" },
    { src: "/Letras/icons8-o-50.png", alt: "O" },
    { src: "/Letras/icons8-c-50.png", alt: "C" },
    { src: "/Letras/icons8-h-50.png", alt: "H" },
    { src: "/Letras/icons8-a-50.png", alt: "A" },
    { src: "/Letras/icons8-t-50.png", alt: "T" },
  ];

  return (
    <header className="bg-gradient-to-r from-red-950 via-red-900 to-red-800 text-white flex justify-between items-center px-4 py-4 shadow-2xl z-50 border-b border-red-500/10">
      {/* Brand: JandoChat Reverted with White Fill */}
      <div className="flex items-center gap-0.5 md:gap-1">
        {letters.map((letter, index) => (
          <img
            key={index}
            src={letter.src}
            alt={letter.alt}
            className="w-6 h-6 sm:w-8 sm:h-8 hover:scale-110 transition-transform cursor-pointer filter brightness-0 invert"
          />
        ))}
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        {/* Mobile Icons */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={logout}
            className="p-2.5 text-red-100 hover:text-white transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-6 h-6 text-red-400 font-bold" />
          </button>

          <button className="p-2.5 text-red-100 hover:text-white transition-colors relative">
            <Bell className="w-6 h-6" />
            <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border border-red-900 ring-2 ring-red-950 shadow-sm"></div>
          </button>

          <button
            onClick={onMenuToggle}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/20 active:scale-90 transition-all"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Desktop User Info & Logout */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Sesión Activa</span>
            <span className="text-sm font-bold text-white/90 truncate max-w-[150px]">{user?.nombre || user?.email}</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 bg-white text-red-800 font-black px-6 py-2.5 rounded-2xl hover:bg-red-50 transition-all shadow-xl active:scale-95 group border-2 border-transparent"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}
