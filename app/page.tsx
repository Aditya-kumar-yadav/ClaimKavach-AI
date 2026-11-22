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
  ROOM_RENT_CAPPING_CLAIM,
  DEMO_SCENARIO_LIST 
} from "@/lib/mock-data";
import { evaluateClaim } from "@/lib/rule-engine";
import { VernacularTTS } from "@/lib/tts";
import { ShieldCheck, Sparkles, AlertCircle, FileCheck2, ArrowRight, RotateCcw } from "lucide-react";

export default function Home() {
  const [language, setLanguage] = useState<"en" | "hi">("hi");
  const [isLoading, setIsLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState<1 | 2 | 3 | null>(null);
  const [claim, setClaim] = useState<ExtractedClaim | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [billDoc, setBillDoc] = useState<string | null>(null);
  const [summaryDoc, setSummaryDoc] = useState<string | null>(null);

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

  // Build audio summary in Hindi from issues
  const getHindiAudioSummary = (): string => {
    if (!result || result.issues.length === 0) {
      return "बधाई हो। आपके अस्पताल बिल और डिस्चार्ज समरी में कोई कागजी कमी नहीं पाई गई है। आपका क्लेम बीमा कंपनी से पास होने के लिए पूरी तरह तैयार है।";
    }

    const patient = (!claim?.patientName || /^(not[ _-]?found|unknown|na|n\/a|null|undefined)$/i.test(claim.patientName.trim()))
      ? "मरीज"
      : claim.patientName;
    const topIssues = result.issues.slice(0, 2).map(i => i.titleHi).join(", और ");
    return `ध्यान दें! ${patient} के अस्पताल कागजों में ${topIssues} पाया गया है। बीमा क्लेम रिजेक्ट होने से बचाने के लिए इसे तुरंत अस्पताल के बिलिंग काउंटर से ठीक करवा लें।`;
  };

  // Build audio summary in English from issues
  const getEnglishAudioSummary = (): string => {
    if (!result || result.issues.length === 0) {
      return "Congratulations. No compliance issues were detected in your hospital bill and discharge summary. Your claim is 100% ready for insurance approval.";
    }

    const patient = (!claim?.patientName || /^(not[ _-]?found|unknown|na|n\/a|null|undefined)$/i.test(claim.patientName.trim()))
      ? "the patient"
      : claim.patientName;
    const topIssues = result.issues.slice(0, 2).map(i => i.titleEn).join(", and ");
    return `Attention! In hospital records for ${patient}, ${topIssues} were detected. Please have these rectified at the hospital billing desk to prevent claim rejection.`;
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Interactive Screen Layout */}
      <div className="no-print flex-1 flex flex-col">
        <Header 
          language={language} 
          setLanguage={setLanguage} 
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          hasCustomKey={hasCustomKey}
        />

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
          {/* Hero Banner */}
          <div className={`text-center max-w-3xl mx-auto transition-all duration-300 ${claim ? "mb-4" : "mb-10"}`}>
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
              {/* Reset & Switch Preset Bar */}
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-bold text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 px-3.5 py-1.5 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{language === "hi" ? "नया ऑडिट शुरू करें (Reset)" : "Reset & Clear Audit"}</span>
                </button>
              </div>

              {/* Vernacular Audio Explainer Card */}
              <div className="mb-6">
                <AudioExplainer
                  hindiSummary={getHindiAudioSummary()}
                  englishSummary={getEnglishAudioSummary()}
                  language={language}
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
