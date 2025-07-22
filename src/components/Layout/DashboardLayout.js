import React, { useState } from "react";
import Header from "../UI/Header";
import Footer from "../UI/Footer";
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  BellIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon, 
} from "@heroicons/react/24/outline";
import { useNotificaciones } from "../../context/NotificationsContext";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { label: "Conversaciones", icon: ChatBubbleLeftRightIcon, path: "/chat" },
  { label: "Usuarios", icon: UserGroupIcon, path: "/usuarios" },
  { label: "Mi Perfil", icon: UserCircleIcon, path: "/perfil" },
  { label: "Notificaciones", icon: BellIcon, path: "/notificaciones" },
  { label: "Configuraciones", icon: Cog6ToothIcon, path: "/configuraciones" },
];

export default function DashboardLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const {  noLeidasCount = 0 } = useNotificaciones();

  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen">
      <Header />

     

      <div className="md:hidden bg-gray-100 p-2 border-b flex items-center justify-between">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          className="text-blue-600 p-1 rounded hover:bg-blue-100"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <div className="font-bold text-lg text-gray-700">Dashboard</div>
        <div style={{ width: 24 }}></div>
      </div>

      <main className="flex flex-1 overflow-hidden bg-gray-100 relative">
        <aside
          className={`
            fixed inset-y-0 left-0 z-30 bg-white border-r shadow-lg
            transition-all duration-300 ease-in-out
            ${menuOpen ? "translate-x-0" : "-translate-x-full"}
            md:relative md:translate-x-0
            ${collapsed ? "w-20" : "w-64"}
          `}
        >
          <div className="flex items-center justify-between p-4 border-b">
            {!collapsed && <div className="font-bold text-lg">Menú</div>}
            <button
              onClick={() => setCollapsed(!collapsed)}
              aria-label="Colapsar menú"
              className="p-1 rounded hover:bg-gray-200"
            >
              {collapsed ? (
                <Bars3Icon className="w-6 h-6" />
              ) : (
                <XMarkIcon className="w-6 h-6" />
              )}
            </button>
          </div>

          <ul className="mt-4 space-y-2">
            {menuItems.map(({ label, icon: Icon, path }) => (
              <li
                key={label}
                onClick={() => {
                  navigate(path);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-3 cursor-pointer hover:text-blue-600 px-4 py-2 relative"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(path);
                    setMenuOpen(false);
                  }
                }}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}

                {label === "Notificaciones" && noLeidasCount > 0 && (
                  <span className="absolute top-1 left-8 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {noLeidasCount}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {menuOpen && (
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
              className="p-1 rounded hover:bg-gray-200 md:hidden absolute top-2 right-2 z-40"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </aside>

        {menuOpen && (
          <div
            className="fixed inset-0 bg-black opacity-30 z-20 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <section className="flex-1 overflow-auto p-4">{children}</section>
      </main>

      <Footer />
    </div>
  );
}
