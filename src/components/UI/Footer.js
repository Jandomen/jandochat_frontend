import React from "react";
import { MessageSquare } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-red-100 text-gray-400 py-2 sm:py-6 text-center mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-center items-center gap-1 sm:gap-4">
        <div className="flex items-center gap-1 sm:gap-2 text-red-600 font-bold opacity-80 scale-75 sm:scale-100">
          <MessageSquare className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-base">JANDOCHAT</span>
        </div>
        <div className="hidden md:block w-px h-4 bg-gray-200"></div>
        <p className="text-[8px] sm:text-xs tracking-tight uppercase opacity-60">
          © {new Date().getFullYear()} JANDOSOFT
        </p>
      </div>
    </footer>
  );
}

