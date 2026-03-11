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
  const { noLeidasCount = 0 } = useNotificaciones();
  const navigate = useNavigate();
  const location = useLocation();
  const isChatPrivado = location.pathname.includes('/chat/') && location.pathname !== '/chat';

  return (
    <div className="flex flex-col h-screen bg-gray-50 select-none">
      <Header onMenuToggle={() => setMenuOpen(!menuOpen)} />

      <main className={`flex flex-1 relative scrollbar-hide ${isChatPrivado ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {/* Mobile Bottom Navigation Bar (Floating Pill) */}
        {!isChatPrivado && (
          <div className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 w-[80%] max-w-[300px] z-50 animate-in slide-in-from-bottom duration-700">
            <div className="bg-white/40 backdrop-blur-3xl border border-white/30 shadow-[0_25px_50px_rgba(0,0,0,0.25)] rounded-full px-4 flex justify-between items-center h-11 relative ring-1 ring-white/40">

              {/* INICIO */}
              <button
                onClick={() => navigate('/usuarios')}
                className={`flex flex-col items-center transition-all ${location.pathname === '/usuarios' ? 'text-red-600 scale-110' : 'text-gray-400'}`}
              >
                <div className={`p-1 rounded-full ${location.pathname === '/usuarios' ? 'bg-red-500/10' : ''}`}>
                  <Home className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* CERCA (Search) */}
              <button
                onClick={() => navigate('/buscar')}
                className={`flex flex-col items-center transition-all ${location.pathname === '/buscar' ? 'text-red-600 scale-110' : 'text-gray-400'}`}
              >
                <div className={`p-1 rounded-full ${location.pathname === '/buscar' ? 'bg-red-500/10' : ''}`}>
                  <Search className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Central Floating Plus Button - Precise Sphere */}
              <div className="relative -top-3">
                <button
                  onClick={() => navigate('/usuarios')}
                  className="
                    bg-gradient-to-tr from-red-600 to-red-500 
                    text-white p-2.5 rounded-full
                    shadow-[0_12px_24px_rgba(220,38,38,0.5)] 
                    active:scale-90 transition-all outline-none 
                    border-[2px] border-white flex items-center justify-center group
                    relative
                  "
                >
                  <div className="absolute inset-0 rounded-full animate-ping bg-red-400/20 group-hover:hidden duration-[3000ms]"></div>
                  <Plus className="w-4 h-4 stroke-[3] transition-transform group-hover:rotate-90 relative z-10" />
                </button>
              </div>

              {/* CHAT */}
              <button
                onClick={() => navigate('/chat')}
                className={`flex flex-col items-center relative transition-all ${location.pathname === '/chat' ? 'text-red-600 scale-110' : 'text-gray-400'}`}
              >
                <div className={`p-1 rounded-full ${location.pathname === '/chat' ? 'bg-red-500/10' : ''}`}>
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
                {noLeidasCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[6px] font-black w-3 h-3 rounded-full border border-white flex items-center justify-center">
                    {noLeidasCount}
                  </span>
                )}
              </button>

              {/* TÚ */}
              <button
                onClick={() => navigate('/perfil')}
                className={`flex flex-col items-center transition-all ${location.pathname === '/perfil' ? 'text-red-600 scale-110' : 'text-gray-400'}`}
              >
                <div className={`p-1 rounded-full ${location.pathname === '/perfil' ? 'bg-red-500/10' : ''}`}>
                  <User className="w-3.5 h-3.5" />
                </div>
              </button>

            </div>
          </div>
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-12 sm:top-20 bottom-0 left-0 z-40 bg-white border-r border-red-50 shadow-2xl md:shadow-none
            transition-all duration-300 ease-in-out
            ${menuOpen ? "translate-x-0" : "-translate-x-full"}
            md:relative md:translate-x-0 md:top-0
            ${collapsed ? "w-14" : "w-48"}
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
                    flex items-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl relative transition-all duration-200 group
                    ${isActive
                      ? "bg-red-50 text-red-700 font-bold shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 hover:text-red-600"
                    }
                  `}
                  role="button"
                  tabIndex={0}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-red-700' : ''}`} />
                  {!collapsed && <span className="text-[7px] sm:text-[10px] font-black tracking-tight uppercase">{label}</span>}

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
        <section className={`flex-1 flex flex-col bg-white/50 backdrop-blur-sm relative md:pb-0 ${!isChatPrivado ? 'pb-20 pt-1 sm:pt-4' : 'h-full overflow-hidden'}`}>
          <div className={`flex-1 overflow-visible max-w-7xl mx-auto w-full flex flex-col relative px-2 sm:px-4 ${isChatPrivado ? 'h-full' : ''}`}>
             {children}
           </div>
         </section>
      </main>

      <Footer />
    </div>
  );
}

