import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export default function LanguageSelector() {
  const { language, setLanguage, translations } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const flags = {
    es: "🇪🇸", en: "🇺🇸", fr: "🇫🇷", ko: "🇰🇷", zh: "🇨🇳", 
    ja: "🇯🇵", ru: "🇷🇺", ar: "🇪🇬", no: "🇳🇴", sv: "🇸🇪", 
    'pt-BR': "🇧🇷", is: "🇮🇸", tr: "🇹🇷", de: "🇩🇪", hi: "🇮🇳",
    id: "🇮🇩", it: "🇮🇹", bn: "🇧🇩", vi: "🇻🇳", ur: "🇵🇰", pl: "🇵🇱", fa: "🇮🇷"
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLangName = translations[language][`lang_${language.split('-')[0]}`] || language.toUpperCase();

  return (
    <div className="fixed top-4 right-4 z-[100]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl transition-all duration-300 group"
      >
        <span className="text-lg leading-none">{flags[language]}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap">
          {currentLangName}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/60 group-hover:text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-44 bg-[#1a1a1a]/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-200 origin-top-right">
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar py-1.5">
            {Object.keys(translations).map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLanguage(l);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors ${
                  language === l ? "bg-white/5 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                <span className="text-lg leading-none">{flags[l]}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {translations[language][`lang_${l.split('-')[0]}`] || l.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
