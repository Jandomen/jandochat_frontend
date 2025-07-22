import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/UI/Footer";

export default function NotFound() {
  return (
    <>
    <div className="min-h-screen flex flex-col justify-center items-center text-center bg-gray-100 px-4">
      <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
      <p className="text-2xl mb-2">Página no encontrada</p>
      <p className="mb-6 text-gray-600">
        La URL que ingresaste no existe o fue movida.
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Volver al inicio
      </Link>
    </div>
    <Footer/>
    </>
  );
}
