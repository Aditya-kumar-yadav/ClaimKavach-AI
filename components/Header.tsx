"use client";

import React from "react";
import Link from "next/link";
import { Shield, Languages, User } from "lucide-react";
import { SignedIn, SignedOut, UserButton, useUser, ClerkLoading, ClerkLoaded } from "@clerk/nextjs";

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
  const { user } = useUser();

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

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
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

          {/* User Profile Icon / Auth (Displays Name & Email on Profile) */}
          <div className="flex items-center shrink-0">
            {/* Instant Skeleton while Clerk JS initializes - eliminates waiting delay */}
            <ClerkLoading>
              <div className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-2xl bg-white border border-slate-200/90 shadow-2xs animate-pulse">
                <div className="h-8 w-8 rounded-full bg-slate-200 ring-2 ring-slate-100 shrink-0" />
                <div className="hidden xs:flex flex-col gap-1 w-20">
                  <div className="h-2.5 bg-slate-200 rounded-sm w-16" />
                  <div className="h-2 bg-slate-100 rounded-sm w-12" />
                </div>
              </div>
            </ClerkLoading>

            <ClerkLoaded>
              <SignedIn>
                <div className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                  <UserButton 
                    afterSignOutUrl="/sign-in"
                    userProfileMode="modal"
                    appearance={{
                      elements: {
                        modalCloseButton: "right-6 top-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-900 shadow-xs transition-all flex items-center justify-center z-50 cursor-pointer",
                        userButtonAvatarBox: "h-8 w-8 ring-2 ring-sky-500/30 hover:ring-sky-500 transition-all",
                        userButtonPopoverCard: "shadow-2xl rounded-2xl border border-slate-200/90 overflow-hidden font-sans",
                        userButtonPopoverFooter: "!hidden",
                        userPreviewMainIdentifier: "font-extrabold text-slate-900 text-sm",
                        userPreviewSecondaryIdentifier: "text-xs text-slate-500 font-medium",
                        userButtonPopoverActionButton: "hover:bg-slate-50 transition-colors font-semibold text-slate-700 text-xs py-2.5",
                        userButtonPopoverActionButtonIcon: "text-sky-600",
                      }
                    }}
                  />
                  <div className="hidden xs:flex flex-col text-left leading-none">
                    <span className="text-xs font-black text-slate-900 max-w-[130px] truncate">
                      {user?.fullName || (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : (user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "User"))}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold max-w-[130px] truncate mt-0.5">
                      {user?.primaryEmailAddress?.emailAddress || "Verified"}
                    </span>
                  </div>
                </div>
              </SignedIn>
              <SignedOut>
                <Link
                  href="/sign-in"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 border border-slate-300 hover:border-sky-400 text-slate-700 hover:text-sky-700 transition-all shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer"
                  title={language === "hi" ? "उपयोगकर्ता प्रोफ़ाइल / लॉगिन" : "User Profile / Log In"}
                >
                  <div className="h-5 w-5 rounded-full bg-sky-100 flex items-center justify-center text-sky-700">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="hidden xs:inline">{language === "hi" ? "प्रोफ़ाइल" : "Profile"}</span>
                </Link>
              </SignedOut>
            </ClerkLoaded>
          </div>
        </div>
      </div>
    </header>
  );
};
