"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e9f1ed]">
      <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl shadow-lg border border-slate-200">
        <div className="h-8 w-8 border-3 border-[#2d4a3e] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-700">Completing secure sign-in...</span>
      </div>
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/"
        signUpForceRedirectUrl="/"
      />
    </div>
  );
}
