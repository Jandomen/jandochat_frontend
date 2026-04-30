import React from "react";
import useAuth from "../../hooks/useAuth";
import { LogOut, Bell, LayoutDashboard } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useNavigate } from "react-router-dom";

export default function Header({ onMenuToggle }) {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-gradient-to-r from-red-950 via-red-900 to-red-800 text-white flex justify-between items-center px-2 sm:px-4 py-1 shadow-lg z-50 border-b border-white/5 h-12 sm:h-20 flex-shrink-0">
        {/* Brand: JandoChat (Text Based) */}
      <div className="flex items-center gap-0 group select-none relative px-2">
        <div className="absolute inset-0 bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {"JANDOCHAT".split("").map((letter, index) => (
          <span
            key={index}
            className="text-[14px] sm:text-2xl font-black bg-gradient-to-b from-white via-white to-red-100 bg-clip-text text-transparent hover:scale-125 hover:rotate-6 transition-all cursor-pointer inline-block transform-gpu tracking-tighter sm:tracking-normal animate-pulse"
            style={{ 
              textShadow: "0 0 15px rgba(255,255,255,0.8), 0 0 30px rgba(255,255,255,0.4)",
              animationDelay: `${index * 100}ms`
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        {/* Mobile Icons: Reordered - Menu, Bell, Logout */}
        <div className="flex md:hidden items-center gap-0.5 sm:gap-2">
          <button
            onClick={onMenuToggle}
            className="p-1.5 sm:p-2.5 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 active:scale-90 transition-all shadow-lg"
            title={t('menu')}
          >
            <LayoutDashboard className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={() => navigate('/notificaciones')}
            className="p-1 sm:p-2.5 text-red-100 hover:text-white transition-colors relative"
            title={t('notifications_title')}
          >
            <Bell className="w-3.5 h-3.5 sm:w-6 sm:h-6" />
            <div className="absolute top-0.5 right-0.5 sm:top-3 sm:right-3 w-1 h-1 sm:w-2 sm:h-2 bg-red-500 rounded-full border border-red-900 ring-1 sm:ring-2 ring-red-950 shadow-sm"></div>
          </button>

          <button
            onClick={logout}
            className="p-1 sm:p-2.5 text-red-100 hover:text-white transition-colors"
            title={t('logout_title')}
          >
            <LogOut className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-red-500 font-bold" />
          </button>
        </div>

        {/* Desktop User Info & Logout */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">{t('active_session')}</span>
            <span className="text-sm font-bold text-white/90 truncate max-w-[150px]">{user?.nombre || user?.email}</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 bg-white text-red-800 font-black px-6 py-2.5 rounded-2xl hover:bg-red-50 transition-all shadow-xl active:scale-95 group border-2 border-transparent"
            title={t('logout_title')}
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span>{t('logout_title')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
