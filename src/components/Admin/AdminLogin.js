import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../api/admin";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, Loader2, Rocket } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminLogin() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const navigate = useNavigate();
    const { success, error } = useToast();
    const { t } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await loginAdmin(form);
            success(t('admin_access_granted'));
            navigate("/admin/dashboard");
        } catch (err) {
            error(err.response?.data?.msg || t('admin_auth_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">

            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -ml-48 -mb-48 animate-pulse"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-black/50">
                    <div className="flex flex-col items-center mb-10">
                        <div className="p-4 bg-red-600 rounded-3xl shadow-xl shadow-red-600/20 mb-6 group hover:rotate-12 transition-transform duration-500">
                            <ShieldCheck className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tighter uppercase text-center">{t('admin_console')}</h1>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mt-2">{t('control_tower')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">{t('command_email')}</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-5 bg-white/5 border-transparent rounded-2xl text-white font-bold outline-none ring-2 ring-transparent focus:ring-red-600/50 focus:bg-white/10 transition-all placeholder:text-gray-600"
                                    placeholder="admin@jandochat.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">{t('security_key')}</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-red-500 transition-colors" />
                                <input
                                    type={showPass ? "text" : "password"}
                                    required
                                    className="w-full pl-12 pr-12 py-5 bg-white/5 border-transparent rounded-2xl text-white font-bold outline-none ring-2 ring-transparent focus:ring-red-600/50 focus:bg-white/10 transition-all placeholder:text-gray-600"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-[0.3em] text-xs rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>{t('enter_bunker')} <Rocket className="w-4 h-4" /></>}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest leading-loose">{t('authorized_only_desc')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
