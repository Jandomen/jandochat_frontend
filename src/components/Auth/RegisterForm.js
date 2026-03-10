import React, { useState } from "react";
import { registrarUsuario } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import Footer from "../UI/Footer";
import { User, Mail, Lock, Eye, EyeOff, UserPlus } from "lucide-react";

export default function RegisterForm() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.password.trim()) {
      setErrorMsg("Por favor completa todos los campos.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      await registrarUsuario(form);
      navigate("/login");
    } catch (error) {
      setErrorMsg(error.msg || "Error al registrar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 -ml-20 -mt-20 w-80 h-80 bg-red-100 rounded-full blur-3xl opacity-30"></div>

      <main className="flex flex-1 items-center justify-center px-4 z-10">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-[2rem] overflow-hidden border border-red-50">
          <div className="bg-red-600 p-8 text-center text-white">
            <h2 className="text-3xl font-extrabold tracking-tight">Crea tu cuenta</h2>
            <p className="text-red-100 mt-2">Únete a la comunidad Jandochat</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-lg text-sm">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Usuario</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Tu nombre de usuario"
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="ejemplo@correo.com"
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Contraseña</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                </div>
                <input
                  type={mostrarPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-12 py-3 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500"
                >
                  {mostrarPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold shadow-lg shadow-red-200 transition-all active:scale-95 mt-4 ${loading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
                }`}
            >
              <UserPlus className="w-5 h-5" />
              {loading ? "Registrando..." : "Crear cuenta"}
            </button>

            <div className="pt-4 text-center">
              <span className="text-sm text-gray-500">¿Ya tienes cuenta? </span>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm font-bold text-red-600 hover:text-red-700 underline underline-offset-4"
              >
                Inicia sesión
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

