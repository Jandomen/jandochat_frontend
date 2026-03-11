import { Link } from "react-router-dom";
import { LogIn, UserPlus } from "lucide-react";

export default function Home() {

  return (
    <div className="flex min-h-screen bg-[#8b0000] bg-opacity-95 text-white overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="container mx-auto px-4 flex flex-col justify-center items-center text-center z-10">
        <div className="flex flex-wrap justify-center items-center gap-0.5 sm:gap-1.5 md:gap-2 mb-4 sm:mb-8 md:mb-12 select-none px-2">
          {"JANDOCHAT".split("").map((letter, index) => (
            <span
              key={index}
              className="text-xl sm:text-5xl md:text-8xl font-black text-white hover:scale-125 hover:-translate-y-2 hover:text-yellow-300 transition-all duration-700 cursor-pointer inline-block transform-gpu"
              style={{ 
                transitionDelay: `${index * 40}ms`,
                textShadow: "0 0 10px rgba(255,255,255,0.4), 0 0 20px rgba(220,38,38,0.2), 0 4px 10px rgba(0,0,0,0.3)"
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        <p className="text-[11px] sm:text-xl md:text-2xl mb-6 sm:mb-12 text-red-100 opacity-90 font-medium tracking-wider max-w-[280px] sm:max-w-xl">
          Conecta con el mundo en tiempo real con <span className="font-bold border-b-2 border-yellow-400">Jandochat</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 w-full max-w-[220px] sm:max-w-lg px-2">
          <Link
            to="/login"
            className="flex items-center justify-center gap-1.5 bg-white text-red-700 hover:bg-red-50 font-black py-2 sm:py-5 px-4 sm:px-10 rounded-lg sm:rounded-3xl shadow-[0_10px_20px_rgba(0,0,0,0.3)] transition-all duration-300 transform hover:-translate-y-1 active:scale-95 group text-[9px] sm:text-xs md:text-sm uppercase tracking-widest"
          >
            <LogIn className="w-3.5 h-3.5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
            <span>Entrar</span>
          </Link>

          <Link
            to="/register"
            className="flex items-center justify-center gap-1.5 bg-transparent border-[1.5px] border-white hover:bg-white hover:text-red-700 text-white font-black py-2 sm:py-5 px-4 sm:px-10 rounded-lg sm:rounded-3xl shadow-[0_10px_20px_rgba(200,0,0,0.1)] transition-all duration-300 transform hover:-translate-y-1 active:scale-95 group text-[9px] sm:text-xs md:text-sm uppercase tracking-widest"
          >
            <UserPlus className="w-3.5 h-3.5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
            <span>Registro</span>
          </Link>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-4 sm:bottom-10 text-red-200 text-[8px] sm:text-xs opacity-70 uppercase tracking-widest font-black">
          Created by <span className="font-black text-white">JANDOSOFT</span> © 2026
        </div>
      </div>
    </div>
  );
}

