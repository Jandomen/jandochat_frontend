import React from "react";
import { Link } from "react-router-dom";
import Footer from "../components/UI/Footer";
import { useLanguage } from "../context/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <>
    <div className="min-h-screen flex flex-col justify-center items-center text-center bg-gray-100 px-4">
      <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
      <p className="text-2xl mb-2">{t('not_found_title')}</p>
      <p className="mb-6 text-gray-600">
        {t('not_found_desc')}
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        {t('back_to_profile')}
      </Link>
    </div>
    <Footer/>
    </>
  );
}
