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
}

export const Header: React.FC<HeaderProps> = ({
  language,
  setLanguage,
  onOpenApiKeyModal,
  hasCustomKey = false,
  onSelectScenario,
  isLoading = false
}) => {
  const { user } = useUser();

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
