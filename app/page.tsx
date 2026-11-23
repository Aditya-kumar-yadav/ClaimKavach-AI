"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Header } from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";
import { AuditReport } from "@/components/AuditReport";
import { AudioExplainer } from "@/components/AudioExplainer";
import { ClaimPacketPrint } from "@/components/ClaimPacketPrint";
import { ProcessingPipeline } from "@/components/ProcessingPipeline";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { ExtractedClaim, ExtractedClaimSchema, AuditResult } from "@/types/claim";
import { 
  FLAWED_DEMO_CLAIM, 
  CLEAN_DEMO_CLAIM, 
  OVERBILLED_PMJAY_CLAIM, 
  WAITING_PERIOD_CLAIM, 
  ROOM_RENT_CAPPING_CLAIM 
} from "@/lib/mock-data";
import { VernacularTTS } from "@/lib/tts";
import { generateAudioSummary } from "@/lib/audio-summary";
import { Sparkles } from "lucide-react";

export default function Home() {
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [isLoading, setIsLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState<1 | 2 | 3 | null>(null);
  const [claim, setClaim] = useState<ExtractedClaim | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [billDoc, setBillDoc] = useState<string | null>(null);
  const [summaryDoc, setSummaryDoc] = useState<string | null>(null);
  const [fixedIssueIds, setFixedIssueIds] = useState<Set<string>>(new Set());

  // Custom Gemini API Key State for Hackathon Evaluators
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("claimkavach_gemini_api_key");
      setHasCustomKey(!!(stored && stored.trim().length > 10));
    }
  }, []);

  const handleReset = () => {
    VernacularTTS.stop();
    setProcessingStep(null);
    setClaim(null);
    setResult(null);
    setBillDoc(null);
    setSummaryDoc(null);
    setExtractionError(null);
    setFixedIssueIds(new Set());
  };

  const handleToggleFixIssue = (id: string) => {
    setFixedIssueIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAnalyze = async (
    billBase64?: string,
    summaryBase64?: string,
    preset?: "flawed" | "overbilled" | "waiting" | "roomrent" | "clean"
  ) => {
    // Immediately stop any playing audio when switching presets or re-analyzing
    VernacularTTS.stop();
    setIsLoading(true);
    setExtractionError(null);
    setClaim(null);
    setResult(null);
    setBillDoc(billBase64 || null);
    setSummaryDoc(summaryBase64 || null);
    setFixedIssueIds(new Set());

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Step 1: Multimodal Gemini Vision Ingestion & OCR
      setProcessingStep(1);

      let extracted: ExtractedClaim;

      if (preset === "flawed") {
        await sleep(350);
        extracted = FLAWED_DEMO_CLAIM;
      } else if (preset === "overbilled") {
        await sleep(350);
        extracted = OVERBILLED_PMJAY_CLAIM;
      } else if (preset === "waiting") {
        await sleep(350);
        extracted = WAITING_PERIOD_CLAIM;
      } else if (preset === "roomrent") {
        await sleep(350);
        extracted = ROOM_RENT_CAPPING_CLAIM;
      } else if (preset === "clean") {
        await sleep(350);
        extracted = CLEAN_DEMO_CLAIM;
      } else {
        const storedKey = typeof window !== "undefined" ? localStorage.getItem("claimkavach_gemini_api_key") : null;
        
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(storedKey ? { "x-gemini-key": storedKey } : {})
          },
          body: JSON.stringify({ 
            billBase64, 
            summaryBase64,
            customApiKey: storedKey || undefined
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || data.details || "Failed to process document with Gemini OCR");
        }

        extracted = ExtractedClaimSchema.parse(data);
      }

      // Step 2: Deterministic Adjudication against IRDAI 2024 Master Circular
      setProcessingStep(2);
      await sleep(500);

      const validateRes = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extracted)
      });
      const auditResult: AuditResult = await validateRes.json();

      // Step 3: Compiling NHCX FHIR R4 Bundle & SHA-256 Digital Seal
      setProcessingStep(3);
      await sleep(450);

      setClaim(extracted);
      setResult(auditResult);

      if (auditResult.riskLevel === "GREEN") {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {
          // safe ignore
        }
      }
    } catch (err: any) {
      console.error("Analysis failed:", err);
      const errMsg = err?.message || "Failed to analyze document";
      
      // If error is related to API Key or Quota, surface it directly to user with 1-click key modal
      if (
        errMsg.includes("NO_API_KEY") || 
        errMsg.includes("INVALID_API_KEY") || 
        errMsg.includes("GEMINI_QUOTA_EXCEEDED") ||
        errMsg.includes("API key not valid") ||
        errMsg.includes("API_KEY_INVALID")
      ) {
        setExtractionError(
          language === "hi"
            ? "कस्टम अस्पताल बिल का विश्लेषण करने के लिए Google Gemini API Key दर्ज करें (हेडर में 'API की जोड़ें' बटन पर क्लिक करें या नीचे बटन दबाएं)।"
            : "To audit your custom hospital document with live Google Gemini OCR, please provide a free Gemini API key (click 'Add API Key' above)."
        );
        setIsLoading(false);
        setProcessingStep(null);
        return;
      }

      // If document was uploaded but general OCR error occurred
      setExtractionError(errMsg);
    } finally {
      setIsLoading(false);
      setProcessingStep(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Unresolved (non-checked) issues count
  const nonCheckedCount = result 
    ? result.issues.filter(i => !fixedIssueIds.has(i.id)).length 
    : 0;

  // Build intelligent audio summary focusing on non-checked deductions & billing desk fixes
  const getHindiAudioSummary = (): string => {
    if (!claim || !result) return "";
    return generateAudioSummary(claim, result, fixedIssueIds, "hi");
  };

  const getEnglishAudioSummary = (): string => {
    if (!claim || !result) return "";
    return generateAudioSummary(claim, result, fixedIssueIds, "en");
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-sky-500 selection:text-white relative">
      {/* Fixed Fullscreen Background Image - Zero-Lag High-Performance Ambient Wave */}
      <div className="bg-wave-container no-print" aria-hidden="true">
        <picture>
          <source srcSet="/images/hero-wave-bg.webp" type="image/webp" />
          <img
            src="/images/hero-wave-bg.jpg"
            alt=""
            className="bg-wave-image"
            loading="eager"
            decoding="async"
          />
        </picture>
      </div>

      {/* Interactive Screen Layout */}
      <div className="no-print flex-1 flex flex-col relative z-10">
        <Header 
          language={language} 
          setLanguage={setLanguage} 
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          hasCustomKey={hasCustomKey}
          onSelectScenario={(preset) => handleAnalyze(undefined, undefined, preset)}
          isLoading={isLoading}
          onResetHome={handleReset}
        />

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
          {/* Hero Banner - Matches exact layout and typography */}
          {!(claim || isLoading) && (
            <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 animate-in fade-in duration-300">
              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black text-slate-950 tracking-[-0.025em] leading-[1.12]">
                {language === "hi" ? (
                  "कागजी गलतियों से क्लेम रिजेक्ट होने से बचाएं"
                ) : (
                  <>
                    Stop Micro-Insurance Rejections <br className="hidden sm:inline" />
                    Before They Happen
                  </>
                )}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 font-medium mt-3.5 max-w-2xl mx-auto leading-relaxed">
                {language === "hi"
                  ? "आयुष्मान भारत (PM-JAY) एवं गिग वर्कर्स के लिए अस्पताल बिलों का लाइव ऑडिट। तारीखों का मिलान, गैर-मान्य आइटम की कटौती और बोलकर हिंदी में समाधान।"
                  : "Multimodal OCR reads handwritten hospital bills, checks IRDAI non-payable items, identifies date discrepancies, and outputs a SHA-256 verified dossier."}
              </p>
            </div>
          )}

          {/* Document Ingestion Zone - Auto-Collapses to 1-line bar when audit is active */}
          <UploadZone
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            language={language}
            activeClaim={claim}
            onReset={handleReset}
            externalError={extractionError}
            onClearError={() => setExtractionError(null)}
          />

          {/* Stepped 3-Stage Deterministic Pipeline Visualizer */}
          {processingStep !== null && (
            <ProcessingPipeline currentStep={processingStep} language={language} />
          )}

          {/* Results View */}
          {claim && result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Vernacular Audio Explainer Card */}
              <div className="mb-6">
                <AudioExplainer
                  hindiSummary={getHindiAudioSummary()}
                  englishSummary={getEnglishAudioSummary()}
                  language={language}
                  pendingIssueCount={nonCheckedCount}
                />
              </div>

              {/* Complete Audit Report View */}
              <AuditReport
                claim={claim}
                result={result}
                language={language}
                onPrint={handlePrint}
                billDoc={billDoc}
                summaryDoc={summaryDoc}
                fixedIssueIds={fixedIssueIds}
                onToggleFixIssue={handleToggleFixIssue}
              />
            </div>
          )}
        </main>
      </div>

      {/* Official A4 Dossier for Physical Printing (Hidden on screen) */}
      {claim && result && (
        <ClaimPacketPrint claim={claim} result={result} />
      )}

      {/* Custom Gemini API Key Modal for Hackathon Judges */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        language={language}
        onKeyUpdated={(k) => setHasCustomKey(!!(k && k.trim().length > 10))}
      />
    </div>
  );
}
