"use client";

import React, { useState } from "react";
import { Upload, FileText, Image as ImageIcon, Sparkles, Check, AlertCircle, Zap } from "lucide-react";
import { compressImageFile, CompressionResult } from "@/lib/image-compressor";

interface UploadZoneProps {
  onAnalyze: (billBase64?: string, summaryBase64?: string, preset?: "flawed" | "clean") => void;
  isLoading: boolean;
  language: "en" | "hi";
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onAnalyze, isLoading, language }) => {
  const [billImage, setBillImage] = useState<string | null>(null);
  const [summaryImage, setSummaryImage] = useState<string | null>(null);
  const [billStats, setBillStats] = useState<CompressionResult | null>(null);
  const [summaryStats, setSummaryStats] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState<"bill" | "summary" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

        {/* 1-Click Demo Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isLoading || isCompressing !== null}
            onClick={() => onAnalyze(undefined, undefined, "flawed")}
            className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            {language === "hi" ? "सैंपल: खारिज होने वाला क्लेम" : "Preset: Flawed Claim (28% Rejection Risk)"}
          </button>
          <button
            type="button"
            disabled={isLoading || isCompressing !== null}
            onClick={() => onAnalyze(undefined, undefined, "clean")}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            {language === "hi" ? "सैंपल: मान्य क्लेम (100%)" : "Preset: Clean Validated Claim (100%)"}
          </button>
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
