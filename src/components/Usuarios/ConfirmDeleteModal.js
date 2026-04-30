import React, { useState } from "react";
import { ShieldAlert, KeyRound } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const ConfirmDeleteModal = ({ onClose, onConfirm, loading, error }) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [verificationText, setVerificationText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (verificationText !== t('delete_word_confirm')) return;
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300 p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[320px] overflow-hidden border border-red-50 flex flex-col animate-in zoom-in-95 duration-300">
        <div className="bg-red-600 p-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <ShieldAlert className="w-8 h-8 text-white mx-auto mb-2 relative z-10" />
          <h2 className="text-xs font-black text-white uppercase tracking-widest relative z-10">
            {t('critical_danger_zone')}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
             <p className="text-red-600 font-bold text-[8px] text-center leading-tight uppercase tracking-widest">
              {t('delete_account_warning')}
            </p>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-300" />
              <input
                type="password"
                required
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-red-100 outline-none transition-all font-bold placeholder:text-gray-300 text-[10px]"
                placeholder={t('confirm_password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="relative">
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-red-100 outline-none transition-all font-black text-center placeholder:text-gray-300 text-[10px] uppercase"
                placeholder={t('type_delete_to_confirm')}
                value={verificationText}
                onChange={(e) => setVerificationText(e.target.value.toUpperCase())}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                className="w-3 h-3 rounded border-gray-300 text-red-600 focus:ring-red-500"
                checked={confirmCheckbox}
                onChange={(e) => setConfirmCheckbox(e.target.checked)}
              />
              <span className="text-[7px] font-black uppercase text-gray-400 group-hover:text-red-500 transition-colors">
                {t('understand_irreversible')}
              </span>
            </label>
          </div>

          {error && (
            <div className="p-2 bg-red-50 text-red-600 rounded-lg text-[8px] font-black uppercase text-center tracking-widest border border-red-100">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading || !password || verificationText !== t('delete_word_confirm') || !confirmCheckbox}
              className="w-full py-3 bg-red-600 text-white font-black uppercase tracking-widest text-[9px] rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
            >
              {loading ? t('deleting') : t('delete_my_account_now')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[8px] rounded-xl hover:bg-gray-100 transition-all"
            >
              {t('cancel_and_return')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
