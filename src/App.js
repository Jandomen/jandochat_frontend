import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
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
import PerfilOtroUsuario from "./components/Usuarios/PerfilOtroUsuario";
import Configuraciones from "./components/Usuarios/Configuraciones";
import SettingsModal from "./components/UI/SettingsModal";
import NotFound from "./pages/NotFound";
import { ToastProvider } from "./context/ToastContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import { CallProvider } from "./context/CallContext";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const isSettingsOpen = location.pathname === "/configuraciones";

  return (
    <ToastProvider navigate={navigate}>
      <NotificationsProvider>
        <CallProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* ... other routes ... */}
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

            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Settings Modal - se renderiza como portal */}
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => navigate("/chat")}
          >
            <Configuraciones />
          </SettingsModal>
        </CallProvider>
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
