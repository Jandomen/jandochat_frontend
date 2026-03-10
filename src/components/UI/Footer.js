import React from "react";
import { MessageSquare } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-red-100 text-gray-400 py-6 text-center mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-center items-center gap-4">
        <div className="flex items-center gap-2 text-red-600 font-bold opacity-80">
          <MessageSquare className="w-5 h-5" />
          <span>JANDOCHAT</span>
        </div>
        <div className="hidden md:block w-px h-4 bg-gray-200"></div>
        <p className="text-xs tracking-wider uppercase">
          © {new Date().getFullYear()} Todos los derechos reservados
        </p>
      </div>
    </footer>
  );
}

