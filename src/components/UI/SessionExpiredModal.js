import React, { useEffect } from "react";
import { ShieldAlert, LogIn } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function SessionExpiredModal({ onConfirm }) {
    const { t } = useLanguage();

    useEffect(() => {
        const timer = setTimeout(() => {
            onConfirm();
        }, 4000);
        return () => clearTimeout(timer);
    }, [onConfirm]);

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-red-950/40 backdrop-blur-md animate-in fade-in duration-500"></div>
            
            <div className="relative bg-white rounded-[2.5rem] p-8 sm:p-12 max-w-sm w-full shadow-2xl border border-red-100 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-600/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-600/10 rounded-full blur-3xl"></div>

                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                        <ShieldAlert className="w-10 h-10 text-red-600 animate-pulse" />
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter mb-2">{t('session_expired_title')}</h2>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-8 leading-relaxed">
                        {t('session_expired_desc')}
                    </p>

                    <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden mb-8">
                        <div className="h-full bg-red-600 animate-progress origin-left"></div>
                    </div>

                    <button 
                        onClick={onConfirm}
                        className="flex items-center justify-center gap-3 w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all hover:bg-red-700"
                    >
                        <LogIn className="w-4 h-4" />
                        {t('reconnect_now')}
                    </button>
                    
                    <p className="mt-4 text-[9px] font-black text-gray-300 uppercase tracking-widest">{t('redirecting_auto')}</p>
                </div>
            </div>
        </div>
    );
}
