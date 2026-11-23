"use client";

import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function UserProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f1ec] via-[#f4f7f5] to-[#dbe9e1] py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-4xl mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-white/90 hover:bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Claim Audit Dashboard</span>
        </Link>
      </div>

      <div className="w-full max-w-4xl flex justify-center">
        <UserProfile path="/user-profile" routing="path" />
      </div>
    </div>
  );
}
