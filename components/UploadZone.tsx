"use client";

import React, { useState } from "react";
import { Upload, FileText, Image as ImageIcon, Sparkles, Check, AlertCircle, Zap, ChevronUp, ChevronDown } from "lucide-react";
import { compressImageFile, CompressionResult } from "@/lib/image-compressor";
import { ExtractedClaim } from "@/types/claim";
import { DEMO_SCENARIO_LIST } from "@/lib/mock-data";

interface UploadZoneProps {
  onAnalyze: (
    billBase64?: string, 
    summaryBase64?: string, 
    preset?: "flawed" | "overbilled" | "waiting" | "roomrent" | "clean"
  ) => void;
  isLoading: boolean;
  language: "en" | "hi";
  activeClaim?: ExtractedClaim | null;
  onReset?: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ 
  onAnalyze, 
  isLoading, 
  language,
  activeClaim,
  onReset
}) => {
  const [billImage, setBillImage] = useState<string | null>(null);
  const [summaryImage, setSummaryImage] = useState<string | null>(null);
  const [billStats, setBillStats] = useState<CompressionResult | null>(null);
  const [summaryStats, setSummaryStats] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState<"bill" | "summary" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  // Auto-collapse when an audit is active
  React.useEffect(() => {
    if (activeClaim) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [activeClaim]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "bill" | "summary") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsCompressing(type);

    try {
      // Client-side canvas compression ensures payload stays < 1 MB even for 8-12 MB phone photos
      const result = await compressImageFile(file);
      if (type === "bill") {
        setBillImage(result.base64);
        setBillStats(result);
      } else {
        setSummaryImage(result.base64);
        setSummaryStats(result);
      }
    } catch (err: any) {
      console.error("Compression error:", err);
      setUploadError(err?.message || "Failed to process document");
    } finally {
      setIsCompressing(null);
    }
  };

  // Requirement 1: Once an audit is active, collapse into a slim 1-line bar
  if (activeClaim && isCollapsed) {
    return (
      <div className="glass-card rounded-2xl px-4 sm:px-6 py-3 mb-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/95 backdrop-blur-sm transition-all duration-300">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm min-w-0">
            <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">
              {language === "hi" ? "ऑडिट दस्तावेज़:" : "Auditing:"}
            </span>
            <span className="font-black text-slate-900 truncate">
              {activeClaim.patientName}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-xs font-bold text-slate-700">
              ₹{activeClaim.claimedTotal.toLocaleString("en-IN")}
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-slate-500 text-xs truncate max-w-[200px] hidden sm:inline">
              🏥 {activeClaim.hospitalName}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
          {/* Quick Scenario Dropdown Selector */}
          <div className="relative">
            <select
              disabled={isLoading}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onAnalyze(undefined, undefined, e.target.value as any);
                  e.target.value = "";
                }
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 shadow-2xs hover:border-sky-500 focus:ring-2 focus:ring-sky-500/20 cursor-pointer transition-all"
            >
              <option value="" disabled>
                {language === "hi" ? "⚡ अन्य डेमो केस चुनें (Dropdown)..." : "⚡ Switch Scenario Dropdown..."}
              </option>
              {DEMO_SCENARIO_LIST.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Upload className="h-3.5 w-3.5 text-slate-500" />
            <span>{language === "hi" ? "दस्तावेज़ बदलें" : "Change Document"}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 mb-8 border border-slate-200/80 shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-600" />
            {language === "hi"
              ? "दस्तावेज़ अपलोड करें या टेस्ट सैंपल चुनें"
              : "Upload Documents or Select Sample Claim"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {language === "hi"
              ? "अस्पताल का पक्का बिल एवं डिस्चार्ज समरी जोड़ें। एआई तुरंत आईआरडीएआई नियमों से मिलान करेगा।"
              : "Ingest hospital itemized bill & discharge summary for instantaneous compliance audit."}
          </p>
        </div>

        {/* 1-Click Demo Scenario Dropdown in Main Header */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">
              {language === "hi" ? "🎯 टेस्ट केस चुनें:" : "🎯 Pre-loaded Scenarios:"}
            </span>
            <select
              disabled={isLoading || isCompressing !== null}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onAnalyze(undefined, undefined, e.target.value as any);
                  e.target.value = "";
                }
              }}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-950 border border-sky-300 shadow-xs focus:ring-2 focus:ring-sky-500/30 cursor-pointer transition-all"
            >
              <option value="" disabled>
                {language === "hi" ? "5 आईआरडीएआई केस में से चुनें (Dropdown)..." : "Select from 5 IRDAI Cases (Dropdown)..."}
              </option>
              {DEMO_SCENARIO_LIST.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>

          {activeClaim && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer ml-1"
            >
              <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
              <span>{language === "hi" ? "समेटें (Collapse)" : "Collapse"}</span>
            </button>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Dual Upload Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Box 1: Hospital Bill */}
        <div className="relative border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-5 text-center transition-all bg-slate-50/50 hover:bg-sky-50/30 group">
          <input
            type="file"
            accept="image/*,application/pdf"
            disabled={isCompressing !== null || isLoading}
            onChange={(e) => handleFileUpload(e, "bill")}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex flex-col items-center">
            {isCompressing === "bill" ? (
              <div className="h-32 flex flex-col items-center justify-center">
                <div className="h-7 w-7 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-xs font-bold text-sky-700">
                  {language === "hi" ? "फोटो को कंप्रेस किया जा रहा है..." : "Compressing High-Res Photo for OCR..."}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  {language === "hi" ? "Vercel 4.5 MB सीमा के भीतर" : "Under Vercel 4.5 MB Limit"}
                </span>
              </div>
            ) : billImage ? (
              <div className="w-full h-32 rounded-xl overflow-hidden relative border border-slate-200 bg-white flex items-center justify-center">
                <img src={billImage} alt="Bill Preview" className="object-contain h-full w-full" />
                <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {language === "hi" ? "✓ अपलोड हो गया" : "✓ Uploaded"}
                </span>
                {billStats && billStats.reductionPercentage > 0 && (
                  <span className="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-xs text-emerald-300 text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5 text-amber-400" />
                    <span>{billStats.originalSizeKB}KB → {billStats.compressedSizeKB}KB (-{billStats.reductionPercentage}%)</span>
                  </span>
                )}
              </div>
            ) : (
              <>
                <div className="h-12 w-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-sm text-slate-800">
                  {language === "hi" ? "1. हॉस्पिटल का पक्का बिल" : "1. Hospital Itemized Bill"}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {language === "hi"
                    ? "फोटो या पीडीएफ अपलोड करें (ऑटो-कंप्रेशन चालू है)"
                    : "Upload printed or handwritten bill with itemized medicine/OT charges"}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Box 2: Discharge Summary */}
        <div className="relative border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-5 text-center transition-all bg-slate-50/50 hover:bg-indigo-50/30 group">
          <input
            type="file"
            accept="image/*,application/pdf"
            disabled={isCompressing !== null || isLoading}
            onChange={(e) => handleFileUpload(e, "summary")}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex flex-col items-center">
            {isCompressing === "summary" ? (
              <div className="h-32 flex flex-col items-center justify-center">
                <div className="h-7 w-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-xs font-bold text-indigo-700">
                  {language === "hi" ? "फोटो को कंप्रेस किया जा रहा है..." : "Compressing High-Res Photo for OCR..."}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  {language === "hi" ? "Vercel 4.5 MB सीमा के भीतर" : "Under Vercel 4.5 MB Limit"}
                </span>
              </div>
            ) : summaryImage ? (
              <div className="w-full h-32 rounded-xl overflow-hidden relative border border-slate-200 bg-white flex items-center justify-center">
                <img src={summaryImage} alt="Summary Preview" className="object-contain h-full w-full" />
                <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {language === "hi" ? "✓ अपलोड हो गया" : "✓ Uploaded"}
                </span>
                {summaryStats && summaryStats.reductionPercentage > 0 && (
                  <span className="absolute bottom-2 left-2 bg-slate-900/85 backdrop-blur-xs text-emerald-300 text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5 text-amber-400" />
                    <span>{summaryStats.originalSizeKB}KB → {summaryStats.compressedSizeKB}KB (-{summaryStats.reductionPercentage}%)</span>
                  </span>
                )}
              </div>
            ) : (
              <>
                <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-sm text-slate-800">
                  {language === "hi" ? "2. डिस्चार्ज समरी / डॉक्टर पर्चा" : "2. Discharge Summary / Doctor Note"}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {language === "hi"
                    ? "भर्ती एवं छुट्टी की तारीख, डॉक्टर के हस्ताक्षर एवं बीमारी का विवरण"
                    : "Admission & discharge dates, doctor sign/seal, diagnosis & clinical notes"}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <button
          type="button"
          disabled={isLoading || isCompressing !== null}
          onClick={() => onAnalyze(billImage || undefined, summaryImage || undefined)}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2.5 transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>
                {language === "hi" ? "दस्तावेज़ों का मिलान हो रहा है..." : "Extracting & Auditing with IRDAI Rules..."}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 text-amber-300" />
              <span>
                {language === "hi"
                  ? "क्लेम की जाँच करें (Pre-Adjudicate Claim)"
                  : "Run Pre-Flight Compliance Audit"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
