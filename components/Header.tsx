"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Shield, 
  ChevronDown, 
  CalendarX2, 
  AlertCircle, 
  Clock, 
  Building2, 
  ShieldCheck 
} from "lucide-react";

// Crisp 4-point Google Gemini Sparkle SVG with official gradient
const GeminiSparkleIcon: React.FC<{ className?: string }> = ({ className = "h-3.5 w-3.5" }) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="gemini-sparkle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="50%" stopColor="#8AB4F8" />
        <stop offset="100%" stopColor="#9B72CB" />
      </linearGradient>
    </defs>
    <path
      d="M8 0C8 4.41828 4.41828 8 0 8C4.41828 8 8 11.5817 8 16C8 11.5817 11.5817 8 16 8C11.5817 8 8 4.41828 8 0Z"
      fill="url(#gemini-sparkle-gradient)"
    />
  </svg>
);

interface HeaderProps {
  language: "en" | "hi";
  setLanguage: (lang: "en" | "hi") => void;
  onOpenApiKeyModal?: () => void;
  hasCustomKey?: boolean;
  onSelectScenario?: (preset: "flawed" | "overbilled" | "waiting" | "roomrent" | "clean") => void;
  isLoading?: boolean;
  onResetHome?: () => void;
}

type ScenarioId = "flawed" | "overbilled" | "waiting" | "roomrent" | "clean";

interface ScenarioConfig {
  id: ScenarioId;
  titleEn: string;
  titleHi: string;
  riskBadge: string;
  riskBadgeHi: string;
  badgeStyle: string;
  iconBg: string;
  icon: React.ReactNode;
}

const DEMO_SCENARIOS: ScenarioConfig[] = [
  {
    id: "flawed",
    titleEn: "Date Mismatch",
    titleHi: "तारीखों में विसंगति",
    riskBadge: "28% Risk",
    riskBadgeHi: "28% जोखिम",
    badgeStyle: "bg-amber-50 text-amber-700 border-amber-200/90",
    iconBg: "bg-amber-100/80 text-amber-700 border-amber-200/70",
    icon: <CalendarX2 className="h-3.5 w-3.5" />
  },
  {
    id: "overbilled",
    titleEn: "PM-JAY Overbilling",
    titleHi: "PM-JAY अधिक बिलिंग",
    riskBadge: "48% Risk",
    riskBadgeHi: "48% जोखिम",
    badgeStyle: "bg-rose-50 text-rose-700 border-rose-200/90",
    iconBg: "bg-rose-100/80 text-rose-700 border-rose-200/70",
    icon: <AlertCircle className="h-3.5 w-3.5" />
  },
  {
    id: "waiting",
    titleEn: "36-Mo Waiting Period",
    titleHi: "36-माह वेटिंग पीरियड",
    riskBadge: "38% Risk",
    riskBadgeHi: "38% जोखिम",
    badgeStyle: "bg-amber-50 text-amber-700 border-amber-200/90",
    iconBg: "bg-amber-100/80 text-amber-700 border-amber-200/70",
    icon: <Clock className="h-3.5 w-3.5" />
  },
  {
    id: "roomrent",
    titleEn: "Room Rent 1% Cap",
    titleHi: "रूम रेंट 1% कैप",
    riskBadge: "56% Risk",
    riskBadgeHi: "56% जोखिम",
    badgeStyle: "bg-rose-50 text-rose-700 border-rose-200/90",
    iconBg: "bg-rose-100/80 text-rose-700 border-rose-200/70",
    icon: <Building2 className="h-3.5 w-3.5" />
  },
  {
    id: "clean",
    titleEn: "Clean Pass",
    titleHi: "क्लीन पास",
    riskBadge: "100% Shield",
    riskBadgeHi: "100% सुरक्षित",
    badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
    iconBg: "bg-emerald-100/80 text-emerald-700 border-emerald-200/70",
    icon: <ShieldCheck className="h-3.5 w-3.5" />
  }
];

export const Header: React.FC<HeaderProps> = ({
  language,
  setLanguage,
  onOpenApiKeyModal,
  hasCustomKey = false,
  onSelectScenario,
  isLoading = false,
  onResetHome
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (scenario: ScenarioConfig) => {
    setSelectedScenario(scenario.id);
    setIsOpen(false);
    if (onSelectScenario) {
      onSelectScenario(scenario.id);
    }
  };

  return (
    <header className="sticky top-0 z-40 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 relative">
        {/* Left: Brand Link - Redirects to Home */}
        <div className="flex items-center shrink-0">
          <Link
            href="/"
            onClick={(e) => {
              if (onResetHome) {
                onResetHome();
              }
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center space-x-2.5 sm:space-x-3 group cursor-pointer select-none"
            title={language === "hi" ? "होम पेज पर जाएं (Home)" : "Return to Home"}
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 group-hover:shadow-sky-500/30 transition-all duration-200">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <div className="flex items-center">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                  ClaimKavach <span className="text-sky-600 font-black">AI</span>
                </span>
              </div>
              <p className="hidden lg:block text-[11px] text-slate-500 font-medium truncate max-w-[280px]">
                {language === "hi"
                  ? "माइक्रो-इंश्योरेंस क्लेम प्री-एडजुडिकेशन प्रणाली"
                  : "Deterministic Pre-Adjudication Engine for Bharat"}
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Demo Cases Dropdown & Gemini API Key Button */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 md:absolute md:left-1/2 md:-translate-x-1/2">
          {/* Custom Liquid Glass Demo Scenarios Dropdown */}
          <div ref={dropdownRef} className="relative inline-flex items-center">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setIsOpen(!isOpen)}
              className="liquid-glass-pill gap-1.5 px-3 sm:px-3.5 text-xs font-bold cursor-pointer select-none"
              title={language === "hi" ? "5 आईआरडीएआई केस में से चुनें (Hackathon Demo)" : "Select Pre-Loaded IRDAI Case (Hackathon Demo)"}
              aria-haspopup="true"
              aria-expanded={isOpen}
            >
              <span className="text-slate-900 truncate max-w-[130px] xs:max-w-[170px] sm:max-w-none">
                {language === "hi" ? "🎯 टेस्ट केस (5 Cases)..." : "🎯 Demo Cases (5 Scenarios)..."}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-700 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Floating Solid White Menu Panel (100% Opaque - Centered Under Trigger) */}
            {isOpen && (
              <div 
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[290px] sm:w-[320px] rounded-[18px] p-2 bg-white border border-slate-200 shadow-[0_20px_45px_-10px_rgba(15,23,42,0.18),0_6px_18px_-2px_rgba(15,23,42,0.08)] z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                role="menu"
              >
                {/* Clean Menu Header */}
                <div className="px-3 py-1.5 mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 tracking-[0.06em] uppercase">
                    {language === "hi" ? "डेमो केस चुनें" : "Select a Demo Scenario"}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                    5 Cases
                  </span>
                </div>

                {/* Scenario Rows with Risk Badges */}
                <div className="space-y-1">
                  {DEMO_SCENARIOS.map((sc) => {
                    const isSelected = selectedScenario === sc.id;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => handleSelect(sc)}
                        className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl transition-all duration-150 text-left cursor-pointer group ${
                          isSelected 
                            ? "bg-sky-50/90 text-sky-950 border border-sky-200/70 shadow-2xs" 
                            : "hover:bg-slate-100/70 text-slate-800 border border-transparent"
                        }`}
                        role="menuitem"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${sc.iconBg}`}>
                            {sc.icon}
                          </div>
                          <span className="text-xs font-bold truncate">
                            {language === "hi" ? sc.titleHi : sc.titleEn}
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${sc.badgeStyle}`}>
                          {language === "hi" ? sc.riskBadgeHi : sc.riskBadge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Gemini API Key Button with 2 Visual States (Apple Liquid Glass) */}
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className={`liquid-glass-pill gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 text-xs font-bold cursor-pointer transition-all duration-300 ${
              hasCustomKey ? "" : "liquid-glass-gemini-attention"
            }`}
            title={
              hasCustomKey
                ? (language === "hi" 
                    ? "Google Gemini API Key सक्रिय है (बदलने के लिए क्लिक करें)" 
                    : "Google Gemini API key connected (click to edit)")
                : (language === "hi" 
                    ? "AI ऑडिट सक्षम करने के लिए अपनी Google Gemini API Key दर्ज करें" 
                    : "Enter your Google Gemini API key to enable AI audits")
            }
            aria-label={hasCustomKey ? "Gemini API Key Connected" : "Add Gemini API Key"}
          >
            <GeminiSparkleIcon className="h-3.5 w-3.5 shrink-0" />
            
            {hasCustomKey ? (
              <>
                <span className="font-extrabold text-slate-900 hidden sm:inline">
                  {language === "hi" ? "Gemini तैयार" : "Gemini Ready"}
                </span>
                <span className="font-extrabold text-slate-900 sm:hidden">
                  {language === "hi" ? "तैयार" : "Ready"}
                </span>
                <span className="h-2 w-2 rounded-full shrink-0 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"></span>
              </>
            ) : (
              <>
                <span className="font-extrabold text-slate-900 hidden sm:inline">
                  {language === "hi" ? "Gemini Key जोड़ें" : "Add Gemini Key"}
                </span>
                <span className="font-extrabold text-slate-900 sm:hidden">
                  Gemini Key
                </span>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]"></span>
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right: Language Toggle */}
        <div className="flex items-center shrink-0">
          <div className="liquid-glass-track">
            {/* Sliding Liquid Glass Indicator */}
            <div
              className="liquid-glass-thumb"
              style={{
                transform: language === "en" ? "translateX(0%)" : "translateX(100%)",
              }}
            />
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`relative z-10 px-2.5 sm:px-3 py-1 text-xs font-bold tracking-tight text-center transition-colors duration-200 cursor-pointer ${
                language === "en"
                  ? "text-slate-950 font-extrabold"
                  : "text-slate-500 hover:text-slate-800 font-semibold"
              }`}
              title="English"
              aria-label="Switch to English"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              className={`relative z-10 px-2.5 sm:px-3 py-1 text-xs font-bold tracking-tight text-center transition-colors duration-200 cursor-pointer ${
                language === "hi"
                  ? "text-slate-950 font-extrabold"
                  : "text-slate-500 hover:text-slate-800 font-semibold"
              }`}
              title="हिंदी"
              aria-label="हिंदी चुनें"
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
