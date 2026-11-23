"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Shield, 
  ChevronDown, 
  CalendarX2, 
  AlertCircle, 
  Clock, 
  Building2, 
  ShieldCheck,
  LogOut,
  User
} from "lucide-react";
import { SignedIn, SignedOut, UserButton, useUser, useClerk, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    router.prefetch("/sign-in");
  }, [router]);

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
    setIsOpen(false);
    if (onSelectScenario) {
      onSelectScenario(scenario.id);
    }
  };

  const handleFastSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut({ redirectUrl: "/sign-in" });
    } catch {
      window.location.assign("/sign-in");
    }
  };

  return (
    <header className="sticky top-0 z-40 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 relative">
        {/* Left: Brand Link - Redirects to Home */}
        <div className="flex items-center shrink-0">
          <Link
            href="/"
            onClick={() => {
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

            {/* Apple Liquid Glass Dropdown Menu */}
            {isOpen && (
              <div className="absolute top-[calc(100%+8px)] left-0 sm:left-1/2 sm:-translate-x-1/2 w-[280px] sm:w-[310px] rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                  <span>{language === "hi" ? "आईआरडीएआई केस चुनें" : "Select IRDAI Case"}</span>
                  <span className="text-slate-400 font-mono">5 Presets</span>
                </div>

                <div className="py-1 space-y-0.5">
                  {DEMO_SCENARIOS.map((sc) => {
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => handleSelect(sc)}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between gap-2 group cursor-pointer"
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
        </div>

        {/* Right: Language Toggle & User Auth */}
        <div className="flex items-center gap-2 shrink-0">
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

          {/* User Auth Profile (Gracefully mounted for authenticated sessions) */}
          <ClerkLoaded>
            <SignedIn>
              <div className="flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-full bg-white/70 hover:bg-white border border-slate-200/90 shadow-2xs transition-all">
                <UserButton 
                  afterSignOutUrl="/sign-in"
                  userProfileMode="modal"
                  appearance={{
                    elements: {
                      modalCloseButton: "right-6 top-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-900 shadow-xs transition-all flex items-center justify-center z-50 cursor-pointer",
                      userButtonAvatarBox: "h-7 w-7 ring-2 ring-sky-500/30 hover:ring-sky-500 transition-all",
                      userButtonPopoverCard: "shadow-2xl rounded-2xl border border-slate-200/90 overflow-hidden font-sans",
                      userButtonPopoverFooter: "!hidden",
                      userPreviewMainIdentifier: "font-extrabold text-slate-900 text-sm",
                      userPreviewSecondaryIdentifier: "text-xs text-slate-500 font-medium",
                      userButtonPopoverActionButton: "hover:bg-slate-50 transition-colors font-semibold text-slate-700 text-xs py-2.5",
                      userButtonPopoverActionButtonIcon: "text-sky-600",
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleFastSignOut}
                  disabled={isSigningOut}
                  className="h-6 w-6 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80 shrink-0"
                  title={language === "hi" ? "लॉग आउट करें (Sign Out)" : "Instant Log Out"}
                >
                  {isSigningOut ? (
                    <div className="h-3 w-3 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut className="h-3 w-3" />
                  )}
                </button>
              </div>
            </SignedIn>
          </ClerkLoaded>
        </div>
      </div>
    </header>
  );
};
