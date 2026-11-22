"use client";

import React from "react";
import { Shield, Languages, HeartHandshake, Key } from "lucide-react";

interface HeaderProps {
  language: "en" | "hi";
  setLanguage: (lang: "en" | "hi") => void;
  onOpenApiKeyModal?: () => void;
  hasCustomKey?: boolean;
  onSelectScenario?: (preset: "flawed" | "overbilled" | "waiting" | "roomrent" | "clean") => void;
  isLoading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  setLanguage,
  onOpenApiKeyModal,
  hasCustomKey = false,
  onSelectScenario,
  isLoading = false
}) => {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center space-x-3 shrink-0">
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
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
          {/* Pre-loaded Demo Scenarios Dropdown (Placed on Very Top to Save Space on Main Page) */}
          <div className="relative">
            <select
              disabled={isLoading}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value && onSelectScenario) {
                  onSelectScenario(e.target.value as any);
                  e.target.value = "";
                }
              }}
              className="text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 hover:border-sky-400 text-slate-800 focus:ring-2 focus:ring-sky-500/20 outline-none cursor-pointer transition-all shadow-2xs truncate max-w-[150px] xs:max-w-[185px] sm:max-w-none"
              title={language === "hi" ? "5 आईआरडीएआई केस में से चुनें (Hackathon Demo)" : "Select Pre-Loaded IRDAI Case (Hackathon Demo)"}
            >
              <option value="" disabled>
                {language === "hi" ? "🎯 टेस्ट केस (5 Cases)..." : "🎯 Demo Cases (5 Scenarios)..."}
              </option>
              <option value="flawed">🚨 1. Date Mismatch (28% Risk)</option>
              <option value="overbilled">⚠️ 2. PM-JAY Overbilling (48% Risk)</option>
              <option value="waiting">⏳ 3. 36-Mo Waiting Period (38% Risk)</option>
              <option value="roomrent">🏨 4. Room Rent 1% Cap (56% Risk)</option>
              <option value="clean">🛡️ 5. Clean Pass (100% Shield)</option>
            </select>
          </div>

          {/* EXCLUSIVE SINGLE GEMINI API KEY BUTTON AT THE TOP (For Judges & Evaluators) */}
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98 ${
              hasCustomKey
                ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900"
                : "bg-amber-50/90 hover:bg-amber-100 border-amber-300 text-amber-950"
            }`}
            title={language === "hi" ? "Google Gemini API की सेटिंग्स" : "Configure Google Gemini API Key"}
          >
            <Key className={`h-3.5 w-3.5 ${hasCustomKey ? "text-emerald-600" : "text-amber-600"}`} />
            <span className="font-extrabold hidden xs:inline">
              {hasCustomKey 
                ? (language === "hi" ? "Gemini Key: Active ✓" : "Gemini Key: Active ✓") 
                : (language === "hi" ? "🔑 Gemini Key" : "🔑 Gemini Key")}
            </span>
            <span className={`h-2 w-2 rounded-full shrink-0 ${hasCustomKey ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setLanguage("hi")}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                language === "hi"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Languages className="h-3 w-3 text-sky-600" />
              हिंदी
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                language === "en"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              EN
            </button>
          </div>

          {/* Hackathon Badge */}
          <div className="hidden xl:flex items-center space-x-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <HeartHandshake className="h-3.5 w-3.5 text-rose-500" />
            <span>Hack with Delhi 4.0</span>
          </div>
        </div>
      </div>
    </header>
  );
};
