import React, { useState } from "react";
import { loginUsuario } from "../../api/auth";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Footer from "../UI/Footer";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import LanguageSelector from "../UI/LanguageSelector";

export default function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      // Clear any potential stale session before starting new login process
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      
      const response = await loginUsuario(form);
      // loginUsuario already saved token to localStorage in api/auth.js
      // and response already includes user object, so we don't need obtenerPerfil() here
      await login(response.token, response.user);
      navigate("/chat");
    } catch (error) {
      setErrorMsg(error.msg || t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 relative overflow-hidden">
      <LanguageSelector />
      {/* Background blobs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-red-100 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-red-100 rounded-full blur-3xl opacity-30"></div>

      <main className="flex flex-1 items-center justify-center px-4 z-10 py-4 sm:py-0">
        <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl sm:rounded-[2rem] overflow-hidden border border-red-50">
          <div className="bg-red-600 p-4 sm:p-8 text-center text-white">
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">{t('welcome_back')}</h2>
            <p className="text-red-100 mt-1 sm:mt-2 text-[10px] sm:text-base opacity-90">{t('login_subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-3 sm:space-y-6">
            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-2 sm:p-3 rounded-r-lg text-[10px] sm:text-sm">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1 sm:space-y-2">
              <label className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest px-1">{t('email_label')}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder={t('email_placeholder')}
                  className="block w-full pl-9 sm:pl-11 pr-4 py-2.5 sm:py-4 bg-gray-50 border-transparent rounded-xl sm:rounded-2xl text-xs sm:text-base focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <label className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest px-1">{t('password_label')}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                </div>
                <input
                  type={mostrarPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="block w-full pl-9 sm:pl-11 pr-10 sm:pr-12 py-2.5 sm:py-4 bg-gray-50 border-transparent rounded-xl sm:rounded-2xl text-xs sm:text-base focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-red-500"
                >
                  {mostrarPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl text-white font-bold shadow-lg shadow-red-200 transition-all active:scale-95 text-xs sm:text-base ${loading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
                }`}
            >
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
              {loading ? t('logging_in') : t('login_btn')}
            </button>

            <div className="pt-2 sm:pt-4 text-center">
              <span className="text-[10px] sm:text-sm text-gray-500">{t('no_account')} </span>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-[10px] sm:text-sm font-black text-red-600 hover:text-red-700 underline underline-offset-4 uppercase tracking-tighter"
              >
                {t('register_now')}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}