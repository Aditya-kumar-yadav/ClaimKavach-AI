"use client";

import React, { useEffect } from "react";
import { Shield, Home } from "lucide-react";

export default function NotFound() {
  useEffect(() => {
    // Automatically redirect out of 404 to the main portal
    window.location.href = "/sign-in";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f1ec] via-[#f4f7f5] to-[#dbe9e1] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl border border-slate-200/90 flex flex-col items-center">
        
        {/* Shield Icon */}
        <div className="h-16 w-16 rounded-3xl bg-[#2d4a3e] text-white flex items-center justify-center shadow-lg shadow-[#2d4a3e]/25 mb-4 animate-pulse">
          <Shield className="h-8 w-8" />
        </div>

        <span className="text-sm font-extrabold text-slate-800 mb-1">
          Connecting to ClaimKavach AI...
        </span>

        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Redirecting you to the secure portal. If not redirected automatically, please click below.
        </p>

        <a
          href="/sign-in"
          className="w-full py-3 px-6 rounded-full bg-[#2d4a3e] hover:bg-[#223930] active:bg-[#182922] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-[#2d4a3e]/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="h-4 w-4" />
          <span>Access Claim Audit Portal</span>
        </a>
      </div>
    </div>
  );
}
