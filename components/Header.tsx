"use client";

import React from "react";
import { Shield, Sparkles, Languages, CheckCircle2, HeartHandshake } from "lucide-react";

interface HeaderProps {
  language: "en" | "hi";
  setLanguage: (lang: "en" | "hi") => void;
}

export const Header: React.FC<HeaderProps> = ({ language, setLanguage }) => {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                ClaimKavach <span className="text-sky-600 font-black">AI</span>
              </span>
              <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                PM-JAY & IRDAI Aligned
              </span>
            </div>
            <p className="hidden xs:block text-[11px] sm:text-xs text-slate-500 font-medium truncate max-w-[200px] sm:max-w-none">
              {language === "hi"
                ? "माइक्रो-इंश्योरेंस क्लेम प्री-एडजुडिकेशन एवं दस्तावेज़ अनुपालन प्रणाली"
                : "Deterministic Pre-Adjudication & Compliance Engine for Bharat"}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setLanguage("hi")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                language === "hi"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Languages className="h-3.5 w-3.5 text-sky-600" />
              हिंदी
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                language === "en"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              English
            </button>
          </div>

          {/* Hackathon Badge */}
          <div className="hidden md:flex items-center space-x-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <HeartHandshake className="h-3.5 w-3.5 text-rose-500" />
            <span>Hack with Delhi 4.0</span>
          </div>
        </div>
      </div>
    </header>
  );
};
