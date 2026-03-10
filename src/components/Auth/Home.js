import { Link } from "react-router-dom";
import { LogIn, UserPlus, Heart } from "lucide-react";

export default function Home() {
  const letters = [
    { src: "/Letras/icons8-j-50.png", alt: "J" },
    { src: "/Letras/icons8-a-50.png", alt: "A" },
    { src: "/Letras/icons8-n-50.png", alt: "N" },
    { src: "/Letras/icons8-d-50.png", alt: "D" },
    { src: "/Letras/icons8-o-50.png", alt: "O" },
    { src: "/Letras/icons8-c-50.png", alt: "C" },
    { src: "/Letras/icons8-h-50.png", alt: "H" },
    { src: "/Letras/icons8-a-50.png", alt: "A" },
    { src: "/Letras/icons8-t-50.png", alt: "T" },
  ];

  return (
    <div className="flex min-h-screen bg-[#8b0000] bg-opacity-95 text-white overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="container mx-auto px-4 flex flex-col justify-center items-center text-center z-10">
        {/* Animated Logo with Images */}
        <div className="flex flex-wrap justify-center items-center gap-1 mb-12 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
          {letters.map((letter, index) => (
            <img
              key={index}
              src={letter.src}
              alt={letter.alt}
              className="w-12 h-12 sm:w-16 sm:h-16 transform transition-all duration-500 hover:scale-125 hover:-translate-y-2 cursor-pointer filter brightness-0 invert"
              style={{ transitionDelay: `${index * 50}ms` }}
            />
          ))}
        </div>

        <p className="text-xl sm:text-2xl mb-12 text-red-100 opacity-90 font-medium tracking-wide max-w-lg">
          Conecta con el mundo en tiempo real con <span className="font-bold border-b-2 border-yellow-400">Jandochat</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md px-4">
          <Link
            to="/login"
            className="flex items-center justify-center gap-3 bg-white text-red-700 hover:bg-red-50 font-bold py-4 px-8 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.3)] transition-all duration-300 transform hover:-translate-y-1 active:scale-95 group"
          >
            <LogIn className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <span>Iniciar Sesión</span>
          </Link>

          <Link
            to="/register"
            className="flex items-center justify-center gap-3 bg-transparent border-2 border-white hover:bg-white hover:text-red-700 text-white font-bold py-4 px-8 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all duration-300 transform hover:-translate-y-1 active:scale-95 group"
          >
            <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span>Registrarse</span>
          </Link>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-8 text-red-200 text-sm flex items-center gap-2 opacity-60">
          Hecho con <Heart className="w-4 h-4 fill-current text-white animate-pulse" /> por Alejandro
        </div>
      </div>
    </div>
  );
}

