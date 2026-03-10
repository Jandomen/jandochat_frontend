import React, { useState } from "react";
import Header from "../UI/Header";
import Footer from "../UI/Footer";
import {
  MessageCircle,
  Users,
  Bell,
  User,
  Settings,
  ChevronLeft,
  X,
  Home,
  Plus,
  Search
} from "lucide-react";
import { useNotificaciones } from "../../context/NotificationsContext";
import { useNavigate, useLocation } from "react-router-dom";

const menuItems = [
  { label: "Conversaciones", icon: MessageCircle, path: "/chat" },
  { label: "Usuarios", icon: Users, path: "/usuarios" },
  { label: "Mi Perfil", icon: User, path: "/perfil" },
  { label: "Notificaciones", icon: Bell, path: "/notificaciones" },
  { label: "Configuraciones", icon: Settings, path: "/configuraciones" },
];

export default function DashboardLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isBarVisible, setIsBarVisible] = useState(true);
  const { noLeidasCount = 0 } = useNotificaciones();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header onMenuToggle={() => setMenuOpen(true)} />

      <main className="flex flex-1 overflow-hidden relative">
        {/* Mobile Bottom Navigation Bar (Floating Pill - Positioned higher as requested) */}
        <div
          className={`
            md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-50 transition-all duration-500
            ${isBarVisible ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'}
          `}
        >
          <div className="bg-white/95 backdrop-blur-xl border border-red-50 shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-full px-6 flex justify-between items-center h-20 relative">

            {/* INICIO */}
            <button
              onClick={() => navigate('/usuarios')}
              className={`flex flex-col items-center gap-1 transition-all ${location.pathname === '/usuarios' ? 'text-red-600 scale-105' : 'text-gray-400'}`}
            >
              <div className={`p-1.5 rounded-full ${location.pathname === '/usuarios' ? 'bg-red-50' : ''}`}>
                <Home className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Inicio</span>
            </button>

            {/* CERCA (Search) */}
            <button
              onClick={() => navigate('/buscar')} // Changed to /buscar
              className={`flex flex-col items-center gap-1 transition-all ${location.pathname === '/buscar' ? 'text-red-600 scale-105' : 'text-gray-400'}`}
            >
              <div className={`p-1.5 rounded-full ${location.pathname === '/buscar' ? 'bg-red-50' : ''}`}>
                <Search className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Cerca</span>
            </button>

            {/* Central Floating Plus Button */}
            <div className="relative -top-10">
              <button
                onClick={() => navigate('/usuarios')}
                className="bg-red-600 text-white p-5 rounded-full shadow-[0_15px_30px_rgba(220,38,38,0.5)] active:scale-95 transition-all outline-none border-4 border-gray-50 flex items-center justify-center group"
              >
                <Plus className="w-8 h-8 stroke-[4] transition-transform group-hover:rotate-90" />
              </button>
            </div>

            {/* CHAT */}
            <button
              onClick={() => navigate('/chat')}
              className={`flex flex-col items-center gap-1 relative transition-all ${location.pathname === '/chat' ? 'text-red-600 scale-105' : 'text-gray-400'}`}
            >
              <div className={`p-1.5 rounded-full ${location.pathname === '/chat' ? 'bg-red-50' : ''}`}>
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Chat</span>
              {noLeidasCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-600 w-2.5 h-2.5 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>

            {/* TÚ */}
            <button
              onClick={() => navigate('/perfil')}
              className={`flex flex-col items-center gap-1 transition-all ${location.pathname === '/perfil' ? 'text-red-600 scale-105' : 'text-gray-400'}`}
            >
              <div className={`p-1.5 rounded-full ${location.pathname === '/perfil' ? 'bg-red-50' : ''}`}>
                <User className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Tú</span>
            </button>

          </div>
        </div>

        {/* Small Toggle Button (?) Always visible or easily accessible */}
        <button
          onClick={() => setIsBarVisible(!isBarVisible)}
          className={`
            md:hidden fixed z-[60] bottom-8 left-1/2 -translate-x-1/2 
            bg-white text-red-600 rounded-full w-8 h-8 flex items-center justify-center 
            border-2 border-red-500 shadow-xl font-black text-xs transition-all
            ${!isBarVisible ? 'animate-bounce scale-125' : 'opacity-80 hover:opacity-100'}
          `}
        >
          {isBarVisible ? '?' : '+'}
        </button>

        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40 bg-white border-r border-red-50 shadow-2xl md:shadow-none
            transition-all duration-300 ease-in-out
            ${menuOpen ? "translate-x-0" : "-translate-x-full"}
            md:relative md:translate-x-0
            ${collapsed ? "w-20" : "w-72"}
          `}
        >
          <div className="flex items-center justify-between p-6 border-b border-red-50 mb-4">
            {!collapsed && <div className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-red-700 to-red-500 bg-clip-text text-transparent">Navegación</div>}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-xl hover:bg-red-50 text-red-600 transition-colors hidden md:block"
            >
              {collapsed ? (
                <ChevronLeft className="w-5 h-5 rotate-180" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setMenuOpen(false)}
              className="md:hidden p-2 rounded-xl hover:bg-red-50 text-red-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="px-3 space-y-1">
            {menuItems.map(({ label, icon: Icon, path }) => {
              const isActive = location.pathname === path;
              return (
                <div
                  key={label}
                  onClick={() => {
                    navigate(path);
                    setMenuOpen(false);
                  }}
                  className={`
                    flex items-center gap-4 cursor-pointer px-4 py-4 rounded-2xl relative transition-all duration-200 group
                    ${isActive
                      ? "bg-red-50 text-red-700 font-bold"
                      : "text-gray-500 hover:bg-gray-50 hover:text-red-600"
                    }
                  `}
                  role="button"
                  tabIndex={0}
                >
                  <Icon className={`w-6 h-6 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-red-700' : ''}`} />
                  {!collapsed && <span className="text-sm tracking-wide">{label}</span>}

                  {label === "Notificaciones" && noLeidasCount > 0 && (
                    <span className={`
                      bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-bounce
                      ${collapsed ? 'absolute -top-1 -right-1' : ''}
                    `}>
                      {noLeidasCount}
                    </span>
                  )}

                  {isActive && !collapsed && (
                    <div className="absolute right-2 w-1.5 h-6 bg-red-600 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Backdrop for mobile */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-red-900/20 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* Page Content Container */}
        <section className="flex-1 overflow-auto bg-white/50 backdrop-blur-sm shadow-inner relative pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto min-h-full">
            {children}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

