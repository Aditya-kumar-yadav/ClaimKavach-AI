"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { AuditReport } from "@/components/AuditReport";
import { AudioExplainer } from "@/components/AudioExplainer";
import { ClaimPacketPrint } from "@/components/ClaimPacketPrint";
import { ExtractedClaim, AuditResult } from "@/types/claim";
import { FLAWED_DEMO_CLAIM, CLEAN_DEMO_CLAIM } from "@/lib/mock-data";
import { evaluateClaim } from "@/lib/rule-engine";
import { ShieldCheck, Sparkles, AlertCircle, FileCheck2, ArrowRight } from "lucide-react";

export default function Home() {
  const [language, setLanguage] = useState<"en" | "hi">("hi");
  const [isLoading, setIsLoading] = useState(false);
  const [claim, setClaim] = useState<ExtractedClaim | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  const handleAnalyze = async (
    billBase64?: string,
    summaryBase64?: string,
    preset?: "flawed" | "clean"
  ) => {
    setIsLoading(true);

    try {
      let extracted: ExtractedClaim;

      if (preset === "flawed") {
        extracted = FLAWED_DEMO_CLAIM;
      } else if (preset === "clean") {
        extracted = CLEAN_DEMO_CLAIM;
      } else {
        // Call /api/extract
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ billBase64, summaryBase64 })
        });
        extracted = await res.json();
      }

      // Perform validation via /api/validate or direct deterministic engine
      const validateRes = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extracted)
      });
      const auditResult: AuditResult = await validateRes.json();

      setClaim(extracted);
      setResult(auditResult);

      if (auditResult.riskLevel === "GREEN") {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error("Analysis failed, using fallback preset:", err);
      const fallback = FLAWED_DEMO_CLAIM;
      setClaim(fallback);
      setResult(evaluateClaim(fallback));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Build audio summary in Hindi from issues
  const getHindiAudioSummary = (): string => {
    if (!result || result.issues.length === 0) {
      return "बधाई हो। आपके अस्पताल बिल और डिस्चार्ज समरी में कोई भी गलती नहीं मिली है। आपका क्लेम बीमा कंपनी से पास होने के लिए पूरी तरह तैयार है।";
    }

    const fixes = result.issues.map(i => i.fixHi).join("। इसके अलावा, ");
    return `सावधान! आपके क्लेम में कुल ${result.issues.length} जरूरी गलतियां पाई गई हैं, जिनकी वजह से क्लेम रिजेक्ट हो सकता है। कृपया ध्यान दें: ${fixes}। इसे ठीक करने के बाद ही क्लेम सबमिट करें।`;
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Interactive Screen Layout */}
      <div className="no-print flex-1 flex flex-col">
        <Header language={language} setLanguage={setLanguage} />

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {/* Hero Banner */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold mb-3 border border-sky-200">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              <span>
                {language === "hi"
                  ? "भारत का पहला एआई क्लेम प्री-वैलिडेशन इंजन"
                  : "India's 1st Pre-Adjudication Engine for Micro-Insurance"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              {language === "hi" ? (
                <>
                  कागजी गलतियों से <span className="text-rose-600 underline decoration-rose-300">क्लेम रिजेक्ट</span> होने से बचाएं
                </>
              ) : (
                <>
                  Stop Micro-Insurance Rejections <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
                    Before They Happen
                  </span>
                </>
              )}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-3 max-w-2xl mx-auto leading-relaxed">
              {language === "hi"
                ? "आयुष्मान भारत (PM-JAY) एवं गिग वर्कर्स के लिए अस्पताल बिलों का लाइव ऑडिट। तारीखों का मिलान, गैर-मान्य आइटम की कटौती और बोलकर हिंदी में समाधान।"
                : "Multimodal OCR reads handwritten hospital bills, checks IRDAI non-payable items, identifies date discrepancies, and outputs a SHA-256 verified dossier."}
            </p>
          </div>

          {/* Document Ingestion Zone */}
          <UploadZone
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            language={language}
          />

          {/* Results View */}
          {claim && result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Spoken Hindi Explainer Banner */}
              <AudioExplainer
                hindiSummary={getHindiAudioSummary()}
                language={language}
              />

              {/* Main Pre-Flight Compliance Audit Report */}
              <AuditReport
                claim={claim}
                result={result}
                language={language}
                onPrint={handlePrint}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white/50 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              ClaimKavach AI • Built for <strong>Hack with Delhi 4.0</strong> (Track 1: FinTech & Financial Inclusion)
            </p>
            <p className="font-mono text-[11px] text-slate-400">
              Aligned with IRDAI Master Circular & Ayushman Bharat (ABDM/PM-JAY)
            </p>
          </div>
        </footer>
      </div>

      {/* Official Print Dossier View */}
      {claim && result && (
        <ClaimPacketPrint claim={claim} result={result} />
      )}
    </div>
  );
}
