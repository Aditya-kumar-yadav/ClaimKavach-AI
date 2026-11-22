"use client";

import React, { useState, useRef } from "react";
import { 
  FileText, 
  Sparkles, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Eye, 
  RefreshCw, 
  Info, 
  CheckCircle2, 
  FileCheck2, 
  ChevronUp, 
  X 
} from "lucide-react";
import { compressImageFile } from "@/lib/image-compressor";
import { ExtractedClaim } from "@/types/claim";
import { DEMO_SCENARIO_LIST } from "@/lib/mock-data";

interface UploadedDoc {
  name: string;
  sizeKB: number;
  compressedSizeKB: number;
  reductionPercentage: number;
  ext: string;
  isPdf: boolean;
  base64: string;
}

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
  externalError?: string | null;
  onClearError?: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ 
  onAnalyze, 
  isLoading, 
  language,
  activeClaim,
  onReset,
  externalError,
  onClearError
}) => {
  const [billDoc, setBillDoc] = useState<UploadedDoc | null>(null);
  const [summaryDoc, setSummaryDoc] = useState<UploadedDoc | null>(null);
  const [isCompressing, setIsCompressing] = useState<"bill" | "summary" | null>(null);
  const [dragOverBox, setDragOverBox] = useState<"bill" | "summary" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [previewDoc, setPreviewDoc] = useState<UploadedDoc | null>(null);

  const billInputRef = useRef<HTMLInputElement | null>(null);
  const summaryInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-collapse when an audit is active, reset if cleared
  React.useEffect(() => {
    if (activeClaim) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
      setBillDoc(null);
      setSummaryDoc(null);
      if (billInputRef.current) billInputRef.current.value = "";
      if (summaryInputRef.current) summaryInputRef.current.value = "";
    }
  }, [activeClaim]);

  const handleRemoveFile = (type: "bill" | "summary") => {
    if (type === "bill") {
      setBillDoc(null);
      if (billInputRef.current) billInputRef.current.value = "";
    } else {
      setSummaryDoc(null);
      if (summaryInputRef.current) summaryInputRef.current.value = "";
    }
    if (onClearError) onClearError();
  };

  const processFile = async (file: File, type: "bill" | "summary") => {
    setUploadError(null);
    if (onClearError) onClearError();
    setIsCompressing(type);

    try {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const result = await compressImageFile(file);
      const ext = file.name.split(".").pop()?.toLowerCase() || (isPdf ? "pdf" : "jpg");

      const docData: UploadedDoc = {
        name: file.name,
        sizeKB: result.originalSizeKB,
        compressedSizeKB: result.compressedSizeKB,
        reductionPercentage: result.reductionPercentage,
        ext,
        isPdf,
        base64: result.base64
      };

      if (type === "bill") {
        setBillDoc(docData);
      } else {
        setSummaryDoc(docData);
      }
    } catch (err: any) {
      console.error("Compression error:", err);
      setUploadError(err?.message || "Failed to process document");
    } finally {
      setIsCompressing(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: "bill" | "summary") => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, type);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetType: "bill" | "summary") => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverBox(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    if (files.length >= 2) {
      // Intelligently assign 2 dropped files to both boxes
      processFile(files[0], "bill");
      processFile(files[1], "summary");
    } else {
      processFile(files[0], targetType);
    }
  };

  const formatFileSize = (kb: number) => {
    if (kb >= 1024) {
      return `${(kb / 1024).toFixed(2)} MB`;
    }
    return `${kb} KB`;
  };

  const activeError = externalError || uploadError;
  const isKeyError = activeError && (
    activeError.includes("NO_API_KEY") || 
    activeError.includes("INVALID_API_KEY") || 
    activeError.includes("GEMINI_QUOTA_EXCEEDED") ||
    activeError.includes("API_KEY") ||
    activeError.includes("API key")
  );

  // Once an audit is active, collapse into a slim 1-line bar
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

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>{language === "hi" ? "दस्तावेज़ बदलें" : "Change Document"}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 mb-8 border border-slate-200/90 shadow-sm relative">
      {/* ======================================================== */}
      {/* Header & 1-Click Pre-Loaded Scenarios (Clean Pills, No Dropdown!) */}
      {/* ======================================================== */}
      <div className="mb-6 pb-6 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileCheck2 className="h-6 w-6 text-sky-600" />
              {language === "hi"
                ? "दस्तावेज़ अपलोड करें या टेस्ट केस चुनें"
                : "Upload Documents or Select Sample Claim"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {language === "hi"
                ? "अस्पताल का पक्का बिल एवं डिस्चार्ज समरी जोड़ें, या नीचे 1-क्लिक में प्री-लोडेड केस टेस्ट करें।"
                : "Drag & drop your hospital bill, or test instantly with 5 pre-loaded IRDAI scenarios below."}
            </p>
          </div>

          {activeClaim && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
              <span>{language === "hi" ? "समेटें (Collapse)" : "Collapse"}</span>
            </button>
          )}
        </div>

        {/* 5 One-Click Scenario Cards Strip (Hackathon-Ready) */}
        <div className="bg-slate-50/80 rounded-2xl p-3 sm:p-4 border border-slate-200/80">
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {language === "hi" ? "त्वरित हैकाथॉन टेस्ट केस (1-Click Evaluation Demos):" : "1-Click Hackathon Scenarios (No Upload Required):"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {DEMO_SCENARIO_LIST.map((sc) => (
              <button
                key={sc.id}
                type="button"
                disabled={isLoading}
                onClick={() => onAnalyze(undefined, undefined, sc.id)}
                className="px-3 py-2.5 rounded-xl bg-white hover:bg-sky-50/60 border border-slate-200 hover:border-sky-300 text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs active:scale-98 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-md ${sc.badgeColor}`}>
                    {sc.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 group-hover:text-sky-600 font-bold transition-colors">
                    Run ⚡
                  </span>
                </div>
                <p className="font-extrabold text-xs text-slate-800 group-hover:text-sky-950 truncate">
                  {sc.id === "flawed" && "🚨 Date Mismatch"}
                  {sc.id === "overbilled" && "⚠️ PM-JAY Overbill"}
                  {sc.id === "waiting" && "⏳ 36-Mo Waiting"}
                  {sc.id === "roomrent" && "🏨 Room Rent Cap"}
                  {sc.id === "clean" && "🛡️ Clean Pass"}
                </p>
                <span className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                  {sc.patientName.split("(")[0].trim()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prominent API Key / Extraction Error Notice */}
      {activeError && (
        <div className={`mb-6 p-4 rounded-2xl border text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200 ${
          isKeyError 
            ? "bg-amber-50 border-amber-300 text-amber-950 shadow-2xs" 
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${isKeyError ? "text-amber-600" : "text-rose-600"}`} />
          <div className="flex-1">
            <p className="font-bold text-[13px] mb-0.5">
              {isKeyError 
                ? (language === "hi" ? "Google Gemini API की आवश्यक है" : "Google Gemini API Key Required") 
                : (language === "hi" ? "दस्तावेज़ विश्लेषण में त्रुटि" : "Extraction Error")}
            </p>
            <p className="text-xs leading-relaxed opacity-90">
              {isKeyError
                ? (language === "hi"
                    ? "कस्टम अस्पताल बिल का लाइव एआई विश्लेषण करने के लिए, कृपया स्क्रीन के शीर्ष (Header) पर दिए गए 'Gemini Key' बटन पर क्लिक करके अपनी Google AI Studio की जोड़ें।"
                    : "To audit your custom hospital document with live Google Gemini OCR, please configure your free Gemini API key using the button at the top header.")
                : activeError}
            </p>
          </div>
        </div>
      )}

      {/* Dual Upload Columns Styled Like Modern SaaS Wireframe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-7">
        
        {/* ======================================================== */}
        {/* Box 1: Hospital Itemized Bill */}
        {/* ======================================================== */}
        <div className="flex flex-col">
          {/* Box Header */}
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              {language === "hi" ? "1. अस्पताल का पक्का बिल" : "1. Hospital Itemized Bill"}
            </span>
            {billDoc && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {language === "hi" ? "दस्तावेज़ तैयार है" : "Ready for Audit"}
              </span>
            )}
          </div>

          <input
            ref={billInputRef}
            type="file"
            accept="image/*,application/pdf"
            disabled={isCompressing !== null || isLoading}
            onChange={(e) => handleInputChange(e, "bill")}
            className="hidden"
          />

          {isCompressing === "bill" ? (
            <div className="h-44 rounded-2xl border-2 border-dashed border-sky-400 bg-sky-50/50 flex flex-col items-center justify-center p-6 transition-all">
              <div className="h-8 w-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mb-2.5"></div>
              <span className="text-xs font-bold text-sky-800">
                {language === "hi" ? "दस्तावेज़ तैयार किया जा रहा है..." : "Processing & Optimizing Document..."}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 font-mono">
                {language === "hi" ? "क्लाइंट-साइड कम्प्रेशन चालू है" : "Auto-optimizing for AI OCR"}
              </span>
            </div>
          ) : billDoc ? (
            /* Uploaded State - Reference Wireframe Card */
            <div className="space-y-2.5">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3.5 transition-all hover:border-slate-300">
                {/* File Thumbnail / Icon */}
                <div 
                  onClick={() => setPreviewDoc(billDoc)}
                  className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  title="Click to preview"
                >
                  {billDoc.isPdf ? (
                    <FileText className="h-5 w-5 text-rose-500" />
                  ) : (
                    <img src={billDoc.base64} alt={billDoc.name} className="h-full w-full object-cover" />
                  )}
                </div>

                {/* File Metadata */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-bold text-xs sm:text-sm text-slate-900 truncate" title={billDoc.name}>
                    {billDoc.name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium flex items-center gap-1.5">
                    <span className="font-mono uppercase font-semibold text-slate-500">.{billDoc.ext}</span>
                    <span>•</span>
                    <span>{formatFileSize(billDoc.sizeKB)}</span>
                    {billDoc.reductionPercentage > 0 && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-mono">
                        -{billDoc.reductionPercentage}%
                      </span>
                    )}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(billDoc)}
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    title={language === "hi" ? "देखें (Preview)" : "Preview Document"}
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveFile("bill")}
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    title={language === "hi" ? "हटाएं (Delete)" : "Remove Document"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Full-Width Secondary Action Button matching Image 2 */}
              <button
                type="button"
                onClick={() => billInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200/60"
              >
                <RefreshCw className="h-3 w-3 text-slate-400" />
                <span>{language === "hi" ? "दूसरा बिल चुनें (Replace file)" : "Replace or choose another file"}</span>
              </button>
            </div>
          ) : (
            /* Empty Drop Zone matching Reference Image 2 */
            <div
              onClick={() => billInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverBox("bill");
              }}
              onDragLeave={() => setDragOverBox(null)}
              onDrop={(e) => handleDrop(e, "bill")}
              className={`h-44 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center group ${
                dragOverBox === "bill"
                  ? "border-sky-500 bg-sky-50/70 ring-4 ring-sky-500/15 scale-[1.01]"
                  : "border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50/80"
              }`}
            >
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border-2 border-slate-700 text-slate-800 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:border-sky-600 group-hover:text-sky-600 transition-all bg-white shadow-2xs">
                <Plus className="h-5 w-5 stroke-[2.5]" />
              </div>
              <p className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-sky-950 transition-colors">
                {language === "hi" ? "फ़ाइल ड्रैग करें या चुनने के लिए क्लिक करें" : "Drag & Drop or click to choose files"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1 font-medium">
                <Info className="h-3 w-3 text-slate-400" />
                <span>{language === "hi" ? "PDF, PNG, JPG • अधिकतम 10 MB" : "PDF, PNG, JPG • Max file size: 10 MB"}</span>
              </p>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* Box 2: Discharge Summary / Doctor Note */}
        {/* ======================================================== */}
        <div className="flex flex-col">
          {/* Box Header */}
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              {language === "hi" ? "2. डिस्चार्ज समरी / डॉक्टर पर्चा" : "2. Discharge Summary / Doctor Note"}
            </span>
            {summaryDoc && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {language === "hi" ? "दस्तावेज़ तैयार है" : "Ready for Audit"}
              </span>
            )}
          </div>

          <input
            ref={summaryInputRef}
            type="file"
            accept="image/*,application/pdf"
            disabled={isCompressing !== null || isLoading}
            onChange={(e) => handleInputChange(e, "summary")}
            className="hidden"
          />

          {isCompressing === "summary" ? (
            <div className="h-44 rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50/50 flex flex-col items-center justify-center p-6 transition-all">
              <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2.5"></div>
              <span className="text-xs font-bold text-indigo-800">
                {language === "hi" ? "दस्तावेज़ तैयार किया जा रहा है..." : "Processing & Optimizing Document..."}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 font-mono">
                {language === "hi" ? "क्लाइंट-साइड कम्प्रेशन चालू है" : "Auto-optimizing for AI OCR"}
              </span>
            </div>
          ) : summaryDoc ? (
            /* Uploaded State - Reference Wireframe Card */
            <div className="space-y-2.5">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3.5 transition-all hover:border-slate-300">
                {/* File Thumbnail / Icon */}
                <div 
                  onClick={() => setPreviewDoc(summaryDoc)}
                  className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  title="Click to preview"
                >
                  {summaryDoc.isPdf ? (
                    <FileText className="h-5 w-5 text-rose-500" />
                  ) : (
                    <img src={summaryDoc.base64} alt={summaryDoc.name} className="h-full w-full object-cover" />
                  )}
                </div>

                {/* File Metadata */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-bold text-xs sm:text-sm text-slate-900 truncate" title={summaryDoc.name}>
                    {summaryDoc.name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium flex items-center gap-1.5">
                    <span className="font-mono uppercase font-semibold text-slate-500">.{summaryDoc.ext}</span>
                    <span>•</span>
                    <span>{formatFileSize(summaryDoc.sizeKB)}</span>
                    {summaryDoc.reductionPercentage > 0 && (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-mono">
                        -{summaryDoc.reductionPercentage}%
                      </span>
                    )}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(summaryDoc)}
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    title={language === "hi" ? "देखें (Preview)" : "Preview Document"}
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveFile("summary")}
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    title={language === "hi" ? "हटाएं (Delete)" : "Remove Document"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Full-Width Secondary Action Button matching Image 2 */}
              <button
                type="button"
                onClick={() => summaryInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200/60"
              >
                <RefreshCw className="h-3 w-3 text-slate-400" />
                <span>{language === "hi" ? "दूसरी समरी चुनें (Replace file)" : "Replace or choose another file"}</span>
              </button>
            </div>
          ) : (
            /* Empty Drop Zone matching Reference Image 2 */
            <div
              onClick={() => summaryInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverBox("summary");
              }}
              onDragLeave={() => setDragOverBox(null)}
              onDrop={(e) => handleDrop(e, "summary")}
              className={`h-44 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center group ${
                dragOverBox === "summary"
                  ? "border-indigo-500 bg-indigo-50/70 ring-4 ring-indigo-500/15 scale-[1.01]"
                  : "border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50/80"
              }`}
            >
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full border-2 border-slate-700 text-slate-800 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:border-indigo-600 group-hover:text-indigo-600 transition-all bg-white shadow-2xs">
                <Plus className="h-5 w-5 stroke-[2.5]" />
              </div>
              <p className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-indigo-950 transition-colors">
                {language === "hi" ? "फ़ाइल ड्रैग करें या चुनने के लिए क्लिक करें" : "Drag & Drop or click to choose files"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1 font-medium">
                <Info className="h-3 w-3 text-slate-400" />
                <span>{language === "hi" ? "PDF, PNG, JPG • अधिकतम 10 MB" : "PDF, PNG, JPG • Max file size: 10 MB"}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Audit Trigger Button */}
      <div className="flex justify-center">
        <button
          type="button"
          disabled={isLoading || isCompressing !== null}
          onClick={() => onAnalyze(billDoc?.base64, summaryDoc?.base64)}
          className="w-full sm:w-auto px-9 py-3.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2.5 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
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
                  ? "क्लेम की जाँच करें (Run Pre-Flight Audit)"
                  : "Run Pre-Flight Compliance Audit"}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Lightbox Document Preview Modal */}
      {previewDoc && (
        <div 
          onClick={() => setPreviewDoc(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-5 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-5 w-5 text-sky-600 shrink-0" />
                <h3 className="font-bold text-sm text-slate-900 truncate">{previewDoc.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-50 rounded-2xl mt-3 min-h-[300px]">
              {previewDoc.isPdf ? (
                <iframe 
                  src={previewDoc.base64} 
                  title={previewDoc.name} 
                  className="w-full h-[60vh] rounded-xl border border-slate-200"
                />
              ) : (
                <img 
                  src={previewDoc.base64} 
                  alt={previewDoc.name} 
                  className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-xs" 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
