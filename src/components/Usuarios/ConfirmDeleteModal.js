import React, { useState } from "react";

const ConfirmDeleteModal = ({ onClose, onConfirm, loading }) => {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Confirmar eliminación
        </h2>
        <p className="text-gray-600 mb-4 text-sm">
          Ingresa tu contraseña para confirmar la eliminación de tu cuenta. Esta acción no se puede deshacer.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            required
            className="w-full p-2 border border-gray-300 rounded mb-4"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
