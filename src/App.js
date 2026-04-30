import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { WifiOff, ShieldAlert } from "lucide-react";
import { App as CapApp } from "@capacitor/app";
import Home from "./components/Auth/Home";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import Chat from "./components/Chat/Chat";
import ChatPrivadoWrapper from "./components/Chat/ChatPrivadoWrapper";
import DashboardLayout from "./components/Layout/DashboardLayout";
import PublicRoute from "./components/Auth/PublicRoute";
import PrivateRoute from "./components/Auth/PrivateRoute";
import NotificacionesPage from "./pages/NotificacionesPage";
import Usuarios from "./components/Usuarios/Usuarios";
import BuscarUsuarios from "./components/Usuarios/BuscarUsuarios";
import Perfil from "./components/perfil/perfil";
import Baul from "./components/Baul/Baul";
import VideoFeed from "./components/Multimedia/VideoFeed";
import Gallery from "./components/Multimedia/Gallery";
import PerfilOtroUsuario from "./components/Usuarios/PerfilOtroUsuario";
import Configuraciones from "./components/Usuarios/Configuraciones";
import SettingsModal from "./components/UI/SettingsModal";
import NotFound from "./pages/NotFound";
import { ToastProvider } from "./context/ToastContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import { CallProvider } from "./context/CallContext";
import { SocketProvider } from "./context/SocketContext";
import { useAuth } from "./context/AuthContext";
import AdminRoute from "./components/Admin/AdminRoute";
import AdminLogin from "./components/Admin/AdminLogin";
import AdminDashboard from "./components/Admin/AdminDashboard";
import SessionExpiredModal from "./components/UI/SessionExpiredModal";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setSessionExpired(true);
    };

    window.addEventListener("session_expired", handleSessionExpired);
    return () => window.removeEventListener("session_expired", handleSessionExpired);
  }, []);

  const handleConfirmSessionExpired = () => {
    logout();
    setSessionExpired(false);
    navigate("/");
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Manejo del botón de "Atrás" físico (Triangulito en Android)
  useEffect(() => {
    const handleBackButton = async () => {
      // Si estamos en la raíz (Home o Usuarios) y no hay historial para volver lo minimizamos
      // Caso contrario, navegamos hacia atrás en el historial de React Router
      if (location.pathname === "/" || location.pathname === "/usuarios") {
        CapApp.minimizeApp();
      } else {
        navigate(-1);
      }
    };

    const backListener = CapApp.addListener("backButton", handleBackButton);

    return () => {
      backListener.then((listener) => listener.remove());
    };
  }, [location.pathname, navigate]);

  const isSettingsOpen = location.pathname === "/configuraciones";

  return (
    <ToastProvider navigate={navigate}>
      {!isOnline && (
        <div className="fixed top-0 left-0 w-full z-[9999] animate-in slide-in-from-top duration-500">
          <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-3 shadow-xl">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Modo Offline Detectado - El Universo está sincronizando localmente</span>
          </div>
        </div>
      )}
      {user?.status === "suspendido" && (
        <div className="fixed top-0 left-0 w-full z-[9999] animate-in slide-in-from-top duration-500">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xl border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                <ShieldAlert className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">Cuentas bajo suspensión administrativa</span>
                <span className="text-[7px] font-bold opacity-70 uppercase mt-0.5">Funcionalidad reducida activada</span>
              </div>
            </div>
            {user.suspension?.hasta && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[7px] font-black uppercase opacity-60">Expira en</span>
                <span className="text-[9px] font-bold">{new Date(user.suspension.hasta).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
      <NotificationsProvider>
        <SocketProvider>
          <CallProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginForm />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterForm />
                  </PublicRoute>
                }
              />

              <Route
                path="/chat"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <Chat />
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />
              <Route
                path="/chat/:id"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <ChatPrivadoWrapper />
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/notificaciones"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <NotificacionesPage />
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/usuarios"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <Usuarios />
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/usuarios/:id"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <PerfilOtroUsuario />
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/buscar"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <BuscarUsuarios />
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/videos"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <VideoFeed />
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/galeria"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <Gallery />
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/baul"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <Baul />
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/perfil"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <Perfil />
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />

              <Route
                path="/configuraciones"
                element={
                  <PrivateRoute>
                    <DashboardLayout>
                      <Chat />
                    </DashboardLayout>
                  </PrivateRoute>
                }
              />

              {/* Admin Console - Independent Flow */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route 
                path="/admin/dashboard" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />

              <Route path="*" element={<NotFound />} />
            </Routes>


            <SettingsModal
              isOpen={isSettingsOpen}
              onClose={() => navigate("/chat")}
            >
              <Configuraciones />
            </SettingsModal>

            {sessionExpired && (
              <SessionExpiredModal onConfirm={handleConfirmSessionExpired} />
            )}
          </CallProvider>
        </SocketProvider>
      </NotificationsProvider>
    </ToastProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
