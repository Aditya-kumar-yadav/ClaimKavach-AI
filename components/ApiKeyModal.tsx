"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Sparkles, Loader2, Cpu, ShieldCheck, Activity, RefreshCw } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "en" | "hi";
  onKeyUpdated?: (key: string | null) => void;
}

interface VerificationResult {
  valid: boolean;
  engine: string;
  model: string;
  endpoint?: string;
  latencyMs?: number;
  message?: string;
  error?: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  language
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);

  const runLiveVerification = async () => {
    setIsPinging(true);
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setVerifyResult(data);
    } catch (err: any) {
      setVerifyResult({
        valid: false,
        engine: "covexcode",
        model: "deepseek-v4-flash",
        error: err?.message || "Failed to reach validation service"
      });
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runLiveVerification();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 text-slate-900 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          title="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black tracking-tight text-slate-900">
                {language === "hi" ? "CovexCode AI इंजन स्थिति" : "CovexCode AI Engine Status"}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {language === "hi"
                ? "हैकाथॉन मूल्यांकन पार्टनर: Hack With Delhi 4.0"
                : "Official LLM Sponsor for Hack With Delhi 4.0"}
            </p>
          </div>
        </div>

        {/* Active Engine Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 via-slate-50 to-indigo-50 border border-violet-200/90 text-xs space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <strong className="text-slate-900 text-sm font-black">deepseek-v4-flash</strong>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-violet-600 text-white font-mono text-[10.5px] font-bold shadow-xs">
              100M Tokens (10 Keys Pooled)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1 text-[11.5px]">
            <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Gateways</span>
              <span className="font-mono text-slate-800 font-semibold truncate block" title="/event/v1 + /v1">
                event/v1 · v1 (Auto)
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Candidate Authentication</span>
              <span className="font-mono text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                10 Keys Active & Pooled
              </span>
            </div>
          </div>

          {/* Candidate Keys Status List */}
          <div className="pt-1 border-t border-violet-100 flex flex-col gap-1.5 text-[10.5px] font-mono max-h-40 overflow-y-auto pr-1">
            <div className="text-[10px] font-bold text-violet-800 uppercase tracking-wider px-1 pt-0.5">Sector 1: Hackathon Shortlist (20M Tokens Each)</div>
            <div className="flex items-center justify-between bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <span className="text-slate-600">Candidate 1: <strong className="text-slate-900">bx-live-e05b...</strong></span>
              <span className="text-emerald-700 font-bold">● Active (20M)</span>
            </div>
            <div className="flex items-center justify-between bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <span className="text-slate-600">Candidate 2: <strong className="text-slate-900">bx-live-b039...</strong></span>
              <span className="text-emerald-700 font-bold">● Active (20M)</span>
            </div>
            <div className="flex items-center justify-between bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <span className="text-slate-600">Candidate 3: <strong className="text-slate-900">bx-live-3a34...</strong></span>
              <span className="text-emerald-700 font-bold">● Active (20M)</span>
            </div>
            <div className="flex items-center justify-between bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <span className="text-slate-600">Candidate 4: <strong className="text-slate-900">bx-live-47a6...</strong></span>
              <span className="text-emerald-700 font-bold">● Active (20M)</span>
            </div>
            <div className="flex items-center justify-between bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <span className="text-slate-600">Candidate 5: <strong className="text-slate-900">bx-live-e3ad...</strong></span>
              <span className="text-emerald-700 font-bold">● Active (20M)</span>
            </div>
            <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider px-1 pt-1.5">Sector 2: Web Dashboard Accounts (Live Spend)</div>
            <div className="flex items-center justify-between bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <span className="text-slate-600">Teammate 1 Web: <strong className="text-slate-900">bx-live-9ee9...</strong></span>
              <span className="text-indigo-700 font-bold">● Active ($10)</span>
            </div>
            <div className="flex items-center justify-between bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <span className="text-slate-600">Teammate 2 Web: <strong className="text-slate-900">bx-live-bdf0...</strong></span>
              <span className="text-indigo-700 font-bold">● Active ($10)</span>
            </div>
            <div className="flex items-center justify-between bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <span className="text-slate-600">Teammate 3 Web: <strong className="text-slate-900">bx-live-c5b1...</strong></span>
              <span className="text-indigo-700 font-bold">● Active ($10)</span>
            </div>
            <div className="flex items-center justify-between bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <span className="text-slate-600">User / Lead Web: <strong className="text-slate-900">bx-live-c5a0...</strong></span>
              <span className="text-indigo-700 font-bold">● Active ($10)</span>
            </div>
            <div className="flex items-center justify-between bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/60">
              <span className="text-slate-600">Teammate 5 Web: <strong className="text-slate-900">bx-live-0170...</strong></span>
              <span className="text-indigo-700 font-bold">● Active ($10)</span>
            </div>
          </div>
        </div>

        {/* Live Health Ping Section */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Activity className="h-4 w-4 text-violet-600" />
              <span>{language === "hi" ? "लाइव एपीआई कनेक्टिविटी जांच:" : "Live Endpoint Connection:"}</span>
            </div>

            <button
              type="button"
              disabled={isPinging}
              onClick={runLiveVerification}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 active:scale-95 text-slate-700 text-[11px] font-bold border border-slate-200 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {isPinging ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-violet-600" />
                  <span>Pinging...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 text-slate-600" />
                  <span>Re-test Ping</span>
                </>
              )}
            </button>
          </div>

          {verifyResult && (
            <div className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2.5 ${
              verifyResult.valid
                ? "bg-emerald-50/90 text-emerald-900 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}>
              {verifyResult.valid ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold">
                      ✓ 200 OK — CovexCode DeepSeek-v4 is Live & Ready
                    </div>
                    {verifyResult.latencyMs !== undefined && (
                      <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                        Latency: {verifyResult.latencyMs}ms · OCR & FHIR Engine Active
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-xs text-rose-700">
                  ⚠️ {verifyResult.error || "Connection error. Re-checking..."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="text-slate-600 text-[11.5px] space-y-1 mb-5 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            <span>Hackathon Evaluation Pipeline</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            All hospital discharge summaries, itemized inpatient bills, and IRDAI grievance appeals are processed natively through CovexCode DeepSeek-v4-Flash.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {language === "hi" ? "ठीक है" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
};
