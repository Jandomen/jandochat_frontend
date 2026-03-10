import React, { useState } from "react";
import { ShieldAlert, KeyRound } from "lucide-react";

const ConfirmDeleteModal = ({ onClose, onConfirm, loading, error }) => {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-red-100 flex flex-col animate-in zoom-in-95 duration-300">
        <div className="bg-red-600 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <ShieldAlert className="w-16 h-16 text-white mx-auto mb-4 relative z-10 animate-pulse" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter relative z-10">
            ¡Zona de Peligro!
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <p className="text-gray-500 font-bold text-sm text-center leading-relaxed">
            Estás a punto de eliminar tu cuenta permanentemente. <br />
            <span className="text-red-600 font-black">Esta acción no se puede deshacer.</span>
          </p>

          <div className="relative group">
            <KeyRound className="absolute left-4 top-4 w-5 h-5 text-gray-300 group-focus-within:text-red-500 transition-colors" />
            <input
              type="password"
              required
              className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none transition-all font-bold placeholder:text-gray-300 text-sm"
              placeholder="Tu contraseña para confirmar"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase text-center tracking-widest border border-red-100">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Eliminando..." : "Eliminar Cuenta del Sistema"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 bg-gray-100 text-gray-400 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-200 transition-all font-black"
            >
              Me he arrepentido, cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
