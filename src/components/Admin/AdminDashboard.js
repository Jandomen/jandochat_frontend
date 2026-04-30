import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    getAdminMetrics, logoutAdmin, searchById, suspendUser,
    getReports, handleReport, deleteUser,
    getAdminAds, createAdminAd, deleteAdminAd, toggleAdminAdStatus,
    updateAdminAd, deletePostAdmin
} from "../../api/admin";
import {
    Users, Newspaper, Play, Image as ImageIcon, TrendingUp,
    LogOut, Loader2, BarChart3, Heart, Eye,
    Search, ShieldX, CheckCircle, Flag, AlertTriangle, X,
    Trash2, Activity, Mail, Megaphone, Plus, Pause, Play as PlayIcon,
    ImagePlus, Globe, Edit3
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import Footer from "../UI/Footer";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [reports, setReports] = useState([]);
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchId, setSearchId] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [showAdForm, setShowAdForm] = useState(false);

    const [adData, setAdData] = useState({
        empresa: "", fotoPerfil: "", contenido: "",
        mediaUrl: "", mediaTipo: "imagen", permitirComentarios: true,
        expiraEn: "", webUrl: ""
    });
    const [editingAdId, setEditingAdId] = useState(null);
    const [creatingAd, setCreatingAd] = useState(false);

    const navigate = useNavigate();
    const { error, success } = useToast();
    const { t } = useLanguage();
    const admin = JSON.parse(localStorage.getItem('adminData') || '{}');

    const initialize = useCallback(async () => {
        try {
            const [metrics, reportList, adList] = await Promise.all([
                getAdminMetrics(),
                getReports(),
                getAdminAds()
            ]);
            setData(metrics);
            setReports(reportList);
            setAds(adList);
        } catch (err) {
            error(t('bunker_connection_failed'));
            navigate("/admin");
        } finally {
            setLoading(false);
        }
    }, [error, navigate, t]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    const handleSearch = async (e, forcedId = null) => {
        if (e) e.preventDefault();
        const query = forcedId || searchId;
        if (!query || query.trim() === "") return;

        try {
            const result = await searchById(query.trim());
            setSearchResult(result);
            if (forcedId) setSearchId(forcedId);
        } catch (err) {
            error(t('object_not_found'));
            setSearchResult(null);
        }
    };

    const handleAdminAction = async (userId, action, value = null) => {
        try {
            if (action === 'suspend' || action === 'reactivate') {
                const status = action === 'reactivate' ? 'activo' : 'suspendido';
                let payload = { status };

                if (action === 'suspend') {
                    const motivo = window.prompt(t('sanction_reason'), "Incumplimiento de normas de convivencia");
                    const dias = window.prompt(t('sanction_duration_days'), "1");

                    if (motivo === null) return;
                    payload.motivo = motivo;

                    if (dias && parseInt(dias) > 0) {
                        const expirationDate = new Date();
                        expirationDate.setDate(expirationDate.getDate() + parseInt(dias));
                        payload.hasta = expirationDate;
                    }
                }

                await suspendUser(userId, payload);
                success(`${t('execution_success')} ${status === 'activo' ? t('reactivate') : t('suspend')}`);
            } else if (action === 'delete') {
                if (window.confirm(t('confirm_delete_permanently'))) {
                    await deleteUser(userId);
                    success(t('user_purged_success'));
                    setSearchResult(null);
                }
            }

            if (searchResult) {
                handleSearch();
            }
            initialize();
        } catch (err) {
            error(t('execution_error'));
        }
    };

    const resolveReport = async (id, status) => {
        try {
            await handleReport(id, status);
            success(t('report_status_updated'));
            initialize();
        } catch (err) {
            error(t('resolve_report_error'));
        }
    };

    const handleAdSubmit = async (e) => {
        e.preventDefault();
        if (!adData.empresa || !adData.contenido) return error(t('complete_required_fields'));

        setCreatingAd(true);
        try {
            const media = adData.mediaUrl ? [{ url: adData.mediaUrl, tipo: adData.mediaTipo }] : [];
            const payload = { ...adData, media };

            if (editingAdId) {
                await updateAdminAd(editingAdId, payload);
                success(t('campaign_updated'));
            } else {
                await createAdminAd(payload);
                success(t('campaign_activated'));
            }

            setShowAdForm(false);
            setEditingAdId(null);
            setAdData({ empresa: "", fotoPerfil: "", contenido: "", mediaUrl: "", mediaTipo: "imagen", permitirComentarios: true, expiraEn: "", webUrl: "" });
            initialize();
        } catch (err) {
            error(t('campaign_process_error'));
        } finally {
            setCreatingAd(false);
        }
    };

    const handleEditAd = (ad) => {
        setAdData({
            empresa: ad.empresa,
            fotoPerfil: ad.fotoPerfil,
            contenido: ad.contenido,
            mediaUrl: ad.media?.[0]?.url || "",
            mediaTipo: ad.media?.[0]?.tipo || "imagen",
            permitirComentarios: ad.permitirComentarios,
            expiraEn: ad.expiraEn ? new Date(ad.expiraEn).toISOString().split('T')[0] : "",
            webUrl: ad.webUrl || ""
        });
        setEditingAdId(ad._id);
        setShowAdForm(true);
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    const handlePostAction = async (postId, action) => {
        if (!window.confirm(`${t('audit_action_confirm')} [${action}]`)) return;
        try {
            if (action === 'delete') {
                await deletePostAdmin(postId);
                success(t('post_purged'));
            }
            setSearchResult(null);
            initialize();
        } catch (err) {
            error(t('audit_action_error'));
        }
    };

    const handleDeleteAd = async (id) => {
        if (!window.confirm(t('campaign_retire_confirm'))) return;
        try {
            await deleteAdminAd(id);
            success(t('campaign_retired'));
            initialize();
        } catch (err) {
            error(t('campaign_process_error'));
        }
    };

    const handleToggleAd = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'activo' ? 'pausado' : 'activo';
            await toggleAdminAdStatus(id, newStatus);
            success(`${t('ads_label')} ${newStatus === 'activo' ? t('reactivate') : t('pause_label')}`);
            initialize();
        } catch (err) {
            error(t('campaign_status_error'));
        }
    };

    const handleLogout = () => {
        logoutAdmin();
        navigate("/admin");
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
            <Loader2 className="w-16 h-16 text-red-600 animate-spin mb-6" />
            <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[10px] text-center animate-pulse">{t('bunker_sync')}</p>
        </div>
    );

    const StatCard = ({ icon: Icon, label, value, color }) => (
        <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-16 h-16 ${color} opacity-[0.03] rounded-full -mr-8 -mt-8`}></div>
            <div className={`p-3 sm:p-4 rounded-2xl ${color} bg-opacity-10 mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tighter">{value}</h2>
            <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">{label}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans select-none overflow-x-hidden">
            {/* Executive Top Bar */}
            <header className="bg-gradient-to-r from-red-950 via-red-900 to-red-800 text-white flex justify-between items-center px-4 sm:px-8 py-2 shadow-2xl z-[100] border-b border-white/10 h-14 sm:h-20 fixed top-0 w-full backdrop-blur-md">
                {/* Unified Corporate Logo */}
                <div className="flex items-center gap-0 group select-none relative" onClick={() => navigate("/usuarios")} style={{ cursor: 'pointer' }}>
                    <div className="absolute inset-0 bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {"JANDOCHAT".split("").map((letter, index) => (
                        <span
                            key={index}
                            className="text-[14px] sm:text-2xl font-black bg-gradient-to-b from-white via-red-100 to-red-400 bg-clip-text text-transparent hover:scale-110 transition-all cursor-pointer inline-block transform-gpu tracking-tighter sm:tracking-normal"
                        >
                            {letter}
                        </span>
                    ))}
                    <div className="ml-3 px-2 py-0.5 bg-white/20 rounded-md border border-white/30 hidden sm:block">
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/90">{t('admin_console')}</span>
                    </div>
                </div>

                {/* Omni-Search Admin */}
                <form onSubmit={handleSearch} className="flex-1 max-w-[120px] sm:max-w-md mx-2 sm:mx-8 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 group-focus-within:text-white transition-colors" />
                    <input
                        type="text"
                        placeholder={t('id_auditor_placeholder')}
                        className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-white/10 border border-white/20 rounded-xl text-[10px] sm:text-sm font-bold text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-red-500/50 focus:bg-white/15 transition-all"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                    />
                </form>

                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-400">{t('bunker_active_status')}</span>
                        <span className="text-[11px] font-bold text-white/80">{admin?.nombre || t('administrator_fallback')}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 sm:p-3 bg-white text-red-900 rounded-xl sm:rounded-2xl hover:bg-red-50 transition-all active:scale-90 shadow-xl"
                        title={t('disconnect_bunker')}
                    >
                        <LogOut className="w-4 h-4 sm:w-5 sm:h-5 font-black" />
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 pt-20 sm:pt-28 pb-10 sm:pb-20">


                {searchResult && (
                    <div className="mb-10 animate-in fade-in zoom-in duration-300">
                        <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl border-4 border-red-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                            <button onClick={() => setSearchResult(null)} className="absolute top-3 right-3 z-10 p-1.5 bg-gray-50 rounded-full text-gray-400 hover:text-red-600 transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex items-center gap-2 mb-4 relative z-10">
                                <Search className="w-4 h-4 text-red-600" />
                                <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-tighter text-gray-400">{t('executive_audit')}</h3>
                            </div>

                            <div className="flex flex-col gap-4 relative z-10">
                                {searchResult.type === 'usuario' ? (
                                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                                        <img src={searchResult.data.fotoPerfil || "/assets/perfil-default.jpg"} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-lg border-2 border-white" alt="" />
                                        <div className="flex-1 text-center sm:text-left">
                                            <h4 className="text-lg sm:text-xl font-black text-gray-900 leading-none">{searchResult.data.nombre}</h4>
                                            <p className="text-[9px] sm:text-[11px] text-gray-400 font-bold mt-1 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-2">
                                                <Mail className="w-2.5 h-2.5" /> {searchResult.data.email}
                                            </p>
                                            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-1.5 items-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase border ${searchResult.data.status === 'activo' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                    {searchResult.data.status}
                                                </span>
                                                <span className="px-2 py-0.5 bg-gray-50 text-gray-300 border border-gray-100 rounded-full text-[7px] font-black uppercase">ID: {searchResult.data._id}</span>

                                                <div className="flex gap-1 mt-2 sm:mt-0 sm:ml-2">
                                                    {searchResult.data.status === 'activo' ? (
                                                        <button
                                                            onClick={() => handleAdminAction(searchResult.data._id, "suspend")}
                                                            className="px-2 py-1 bg-orange-500 text-white rounded-md font-black uppercase text-[7px] tracking-widest hover:bg-orange-600 transition-all flex items-center gap-1 shadow-sm"
                                                        >
                                                            <ShieldX className="w-2.5 h-2.5" /> {t('suspend')}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAdminAction(searchResult.data._id, "reactivate")}
                                                            className="px-2 py-1 bg-green-500 text-white rounded-md font-black uppercase text-[7px] tracking-widest hover:bg-green-600 transition-all flex items-center gap-1 shadow-sm"
                                                        >
                                                            <CheckCircle className="w-2.5 h-2.5" /> {t('reactivate')}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleAdminAction(searchResult.data._id, "delete")}
                                                        className="px-2 py-1 bg-red-600 text-white rounded-md font-black uppercase text-[7px] tracking-widest hover:bg-red-700 transition-all flex items-center gap-1 shadow-sm"
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5" /> {t('purge')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                ) : searchResult.type === 'usuarios_multi' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {searchResult.data.map(user => (
                                            <div key={user._id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3 hover:border-red-200 transition-all group">
                                                <img src={user.fotoPerfil || "/assets/perfil-default.jpg"} className="w-10 h-10 rounded-lg object-cover shadow-sm" alt="" />
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-[11px] font-black text-gray-900 truncate uppercase">{user.nombre}</h5>
                                                    <p className="text-[8px] text-gray-400 font-bold truncate uppercase">{user.email}</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSearchResult({ type: 'usuario', data: user });
                                                    }}
                                                    className="p-1.5 bg-white rounded-lg text-gray-400 hover:text-red-600 shadow-sm transition-all"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                                        {searchResult.data.media?.[0] && (
                                            <div className="w-full sm:w-32 h-32 rounded-2xl overflow-hidden bg-black shadow-lg">
                                                {searchResult.data.media[0].tipo === 'video' ? (
                                                    <div className="w-full h-full flex items-center justify-center"><Play className="w-8 h-8 text-white" /></div>
                                                ) : (
                                                    <img src={searchResult.data.media[0].url} className="w-full h-full object-cover" alt="" />
                                                )}
                                            </div>
                                        )}
                                        <div className="flex-1 w-full">
                                            <h4 className="text-sm font-black text-gray-900 leading-none uppercase tracking-tighter">Archivo ID: {searchResult.data._id}</h4>
                                            <p className="text-[11px] text-gray-600 mt-1.5 font-bold italic line-clamp-2">"{searchResult.data.contenido}"</p>

                                            <div className="mt-3 p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <img src={searchResult.data.usuario?.fotoPerfil} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="" />
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-gray-900 leading-none">@{searchResult.data.usuario?.nombre}</p>
                                                        <p className="text-[7px] font-bold text-gray-300">{t('sender_label')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => handleAdminAction(searchResult.data.usuario?._id, "suspend")}
                                                        className="px-2.5 py-1.5 bg-orange-500 text-white rounded-lg text-[7px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center gap-1"
                                                    >
                                                        <ShieldX className="w-3 h-3" /> {t('suspend')}
                                                    </button>
                                                    <button
                                                        onClick={() => handlePostAction(searchResult.data._id, "delete")}
                                                        className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-[7px] font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-1"
                                                    >
                                                        <Trash2 className="w-3 h-3" /> {t('purge')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}


                <div className="mb-10 sm:mb-20">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <Megaphone className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                            <h4 className="text-lg sm:text-3xl font-black text-gray-900 tracking-tighter uppercase italic">{t('ads_and_notices')}</h4>
                        </div>
                        <button
                            onClick={() => setShowAdForm(!showAdForm)}
                            className="w-full sm:w-auto px-6 py-3 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl"
                        >
                            {showAdForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {showAdForm ? t('cancel') : t('deploy_campaign')}
                        </button>
                    </div>

                    {showAdForm && (
                        <div className="mb-10 animate-in slide-in-from-top-4 duration-300">
                            <form onSubmit={handleAdSubmit} className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl border border-orange-100 flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{t('company_issuer')}</label>
                                        <input
                                            type="text"
                                            placeholder={t('company_placeholder')}
                                            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                                            value={adData.empresa}
                                            onChange={(e) => setAdData({ ...adData, empresa: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{t('avatar_url_optional')}</label>
                                        <input
                                            type="text"
                                            placeholder={t('avatar_placeholder')}
                                            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                                            value={adData.fotoPerfil}
                                            onChange={(e) => setAdData({ ...adData, fotoPerfil: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{t('content_message')}</label>
                                    <textarea
                                        placeholder={t('ad_content_placeholder')}
                                        rows="4"
                                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-[2rem] text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none resize-none"
                                        value={adData.contenido}
                                        onChange={(e) => setAdData({ ...adData, contenido: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{t('media_url')}</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder={t('media_url_placeholder')}
                                                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                                                value={adData.mediaUrl}
                                                onChange={(e) => setAdData({ ...adData, mediaUrl: e.target.value })}
                                            />
                                            <ImagePlus className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{t('media_type')}</label>
                                        <select
                                            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-black uppercase focus:ring-2 focus:ring-orange-500 transition-all outline-none appearance-none"
                                            value={adData.mediaTipo}
                                            onChange={(e) => setAdData({ ...adData, mediaTipo: e.target.value })}
                                        >
                                            <option value="imagen">{t('image_label')}</option>
                                            <option value="video">{t('video_label')}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{t('expiration_date')}</label>
                                        <input
                                            type="date"
                                            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                                            value={adData.expiraEn}
                                            onChange={(e) => setAdData({ ...adData, expiraEn: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{t('redirect_link')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('web_url_placeholder')}
                                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                                        value={adData.webUrl}
                                        onChange={(e) => setAdData({ ...adData, webUrl: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center gap-4 px-2">
                                    <input
                                        type="checkbox"
                                        id="allowCom"
                                        className="w-5 h-5 rounded-lg border-gray-100 text-orange-600 focus:ring-orange-500 transition-all cursor-pointer"
                                        checked={adData.permitirComentarios}
                                        onChange={(e) => setAdData({ ...adData, permitirComentarios: e.target.checked })}
                                    />
                                    <label htmlFor="allowCom" className="text-xs font-black uppercase text-gray-600 tracking-tighter cursor-pointer select-none">{t('allow_comments_ad')}</label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={creatingAd}
                                    className="w-full py-5 bg-orange-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-orange-700 transition-all shadow-2xl shadow-orange-200 disabled:opacity-50 active:scale-95"
                                >
                                    {creatingAd ? t('deploying_network') : t('activate_campaign')}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ads.length === 0 ? (
                            <div className="col-span-full p-20 bg-white rounded-[3rem] text-center border border-dashed border-gray-100">
                                <Megaphone className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                                <p className="text-xs font-black text-gray-300 uppercase tracking-[0.3em]">{t('zero_campaigns')}</p>
                            </div>
                        ) : (
                            ads.map(ad => (
                                <div key={ad._id} className={`bg-white rounded-[2.5rem] shadow-xl border overflow-hidden transition-all hover:scale-[1.01] flex flex-col ${ad.status === 'pausado' ? 'grayscale opacity-75' : ''}`}>
                                    <div className="p-5 flex items-center justify-between border-b border-gray-50">
                                        <div className="flex items-center gap-3">
                                            <img src={ad.fotoPerfil || "/assets/company-default.png"} className="w-10 h-10 rounded-full border border-gray-100 object-cover" alt="" />
                                            <div>
                                                <h6 className="text-[11px] font-black text-gray-900 uppercase leading-none">{ad.empresa}</h6>
                                                <span className={`text-[7px] font-black uppercase tracking-tighter ${ad.status === 'activo' ? 'text-green-500' : 'text-orange-500'}`}>{ad.status}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEditAd(ad)}
                                                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                                                title={t('edit_campaign')}
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleAd(ad._id, ad.status)}
                                                className={`p-2 rounded-xl transition-all ${ad.status === 'activo' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                            >
                                                {ad.status === 'activo' ? <Pause className="w-3.5 h-3.5" /> : <PlayIcon className="w-3.5 h-3.5" />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAd(ad._id)}
                                                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-black"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1">
                                        <p className="text-[10px] text-gray-600 font-bold line-clamp-3 leading-relaxed italic">"{ad.contenido}"</p>
                                        {ad.media?.[0] && (
                                            <div className="mt-4 rounded-2xl overflow-hidden shadow-md relative group">
                                                {ad.media[0].tipo === 'video' ? (
                                                    <div className="aspect-video bg-black flex items-center justify-center text-white text-[8px] font-black uppercase tracking-widest"><PlayIcon className="w-6 h-6 mb-2" /> {t('video_ad_label')}</div>
                                                ) : (
                                                    <img src={ad.media[0].url} className="w-full h-40 object-cover" alt="" />
                                                )}
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                    <span className="text-white text-[8px] font-black uppercase tracking-widest">{t('campaign_view_label')}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-5 py-4 bg-gray-50 flex items-center justify-between text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                                        <div className="flex gap-3">
                                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ad.vistas || 0}</span>
                                            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {ad.clics || 0}</span>
                                            {ad.expiraEn && (
                                                <span className="flex items-center gap-1 text-red-400"><X className="w-3 h-3" /> {t('expiration_date')}: {new Date(ad.expiraEn).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                        <Globe className="w-3 h-3" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-6 sm:mb-10">
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                    <h3 className="text-xl sm:text-5xl font-black text-gray-900 tracking-tighter uppercase italic">{t('master_metrics')}</h3>
                </div>


                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4 mb-10 sm:mb-16">
                    <StatCard icon={Activity} label={t('active')} value={data?.stats?.active || 0} color="bg-orange-500" />
                    <StatCard icon={Users} label={t('citizens')} value={data?.stats?.users} color="bg-blue-600" />
                    <StatCard icon={Megaphone} label={t('ads_label')} value={data?.stats?.ads || 0} color="bg-orange-600" />
                    <StatCard icon={Newspaper} label={t('posts_label')} value={data?.stats?.posts} color="bg-red-600" />
                    <StatCard icon={Play} label={t('videos_label')} value={data?.stats?.videos} color="bg-purple-600" />
                    <StatCard icon={ImageIcon} label={t('photos_label')} value={data?.stats?.photos} color="bg-green-600" />
                </div>


                <div className="mb-10 sm:mb-20">
                    <div className="flex items-center gap-3 mb-6">
                        <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
                        <h4 className="text-lg sm:text-3xl font-black text-gray-900 tracking-tighter uppercase italic">{t('activity_detection')}</h4>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {data?.recentActive?.length === 0 ? (
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">{t('network_silence')}</p>
                        ) : (
                            data?.recentActive?.map(user => (
                                <div key={user._id} className="relative group cursor-pointer" onClick={() => {
                                    setSearchResult({ type: 'usuario', data: user });
                                }}>
                                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-xl overflow-hidden group-hover:scale-110 transition-all duration-300">
                                        <img src={user.fotoPerfil || "/assets/perfil-default.jpg"} className="w-full h-full object-cover" alt="" title={user.nombre} />
                                    </div>
                                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                    <div className="absolute top-0 left-0 w-full h-full rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Search className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>


                <div className="mb-10 sm:mb-20">
                    <div className="flex items-center gap-3 mb-6">
                        <Flag className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                        <h4 className="text-lg sm:text-3xl font-black text-gray-900 tracking-tighter uppercase italic">{t('reports_bunker')}</h4>
                        <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[9px] font-black uppercase animate-pulse">{reports.filter(r => r.status === 'pendiente').length} {t('pending_label')}</span>
                    </div>

                    <div className="space-y-4">
                        {reports.length === 0 ? (
                            <div className="p-8 bg-white rounded-[2rem] text-center border border-dashed border-gray-200">
                                <CheckCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('zero_conflicts')}</p>
                            </div>
                        ) : (
                            reports.filter(r => r.status === 'pendiente').map(report => (
                                <div key={report._id} className="bg-white p-3 sm:p-4 rounded-2xl shadow-lg border-l-[4px] border-red-600 flex flex-col sm:flex-row items-center gap-3 sm:gap-6 group">
                                    <div className="flex -space-x-2">
                                        <img src={report.emisor?.fotoPerfil} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" title={`De: ${report.emisor?.nombre}`} alt="" />
                                        <AlertTriangle className="w-8 h-8 p-1.5 bg-red-50 text-red-600 rounded-full border-2 border-white shadow-sm" />
                                    </div>
                                    <div className="flex-1 text-center sm:text-left min-w-0">
                                        <p className="text-[8px] font-black text-red-600 uppercase tracking-[0.1em] mb-0.5">{t('reason_label')}: {report.motivo}</p>
                                        <h5 className="text-[11px] sm:text-xs font-black text-gray-900 line-clamp-1 italic">"{report.detalles || t('no_details')}"</h5>
                                        <p className="text-[7px] text-gray-300 mt-0.5 uppercase font-bold truncate">{t('post_col')}: {report.post?._id || t('user_alert')}</p>
                                    </div>
                                    <div className="flex gap-1.5 w-full sm:w-auto">
                                        <button
                                            onClick={() => resolveReport(report._id, "ignorado")}
                                            className="flex-1 sm:flex-none px-3 py-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition-all font-black text-[8px] uppercase tracking-tighter"
                                        >
                                            {t('ignore')}
                                        </button>
                                        <button
                                            onClick={() => resolveReport(report._id, "accion_tomada")}
                                            className="flex-1 sm:flex-none px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-black text-[8px] uppercase tracking-tighter shadow-md shadow-red-100"
                                        >
                                            {t('resolve')}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>


                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
                        <h4 className="text-lg sm:text-3xl font-black text-gray-900 tracking-tighter uppercase italic">{t('viral_success_archive')}</h4>
                    </div>

                    <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-gray-50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px] sm:min-w-[auto]">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('post_col')}</th>
                                        <th className="hidden sm:table-cell px-6 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">{t('audience_col')}</th>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">{t('success_col')}</th>
                                        <th className="px-6 py-6 text-right pr-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {data?.ranking?.map((post, idx) => (
                                        <tr key={post._id} className="hover:bg-red-50/20 transition-colors group">
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-lg font-black text-gray-200 italic">0{idx + 1}</span>
                                                    <div className="flex items-center gap-3">
                                                        {post.media?.[0] && (
                                                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl overflow-hidden shadow-md">
                                                                {post.media[0].tipo === 'video' ? (
                                                                    <div className="w-full h-full bg-black flex items-center justify-center"><Play className="w-4 h-4 text-white" /></div>
                                                                ) : (
                                                                    <img src={post.media[0].url} className="w-full h-full object-cover" alt="" />
                                                                )}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-[10px] sm:text-sm font-black text-gray-900 leading-none truncate max-w-[100px] sm:max-w-[200px] uppercase">@{post.usuario?.nombre}</p>
                                                            <p className="text-[8px] sm:text-[10px] text-gray-400 mt-1 line-clamp-1">{post.contenido}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden sm:table-cell px-6 py-6 text-center">
                                                <div className="flex items-center justify-center gap-1 text-red-600">
                                                    <Eye className="w-3 h-3" />
                                                    <span className="text-sm font-black tracking-tighter">{post.vistas || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex items-center justify-center gap-1 text-blue-600">
                                                    <Heart className="w-3 h-3" />
                                                    <span className="text-sm font-black tracking-tighter">{post.reacciones?.length || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right pr-8">
                                                <button
                                                    onClick={() => handleSearch(null, post._id)}
                                                    className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:bg-red-600 hover:text-white transition-all group/btn shadow-sm"
                                                    title={t('audit_post_title')}
                                                >
                                                    <Search className="w-3 h-3 text-red-600 group-hover:text-white" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
