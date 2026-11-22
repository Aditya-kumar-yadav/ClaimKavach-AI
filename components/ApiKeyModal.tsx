"use client";

import React, { useState, useEffect } from "react";
import { Key, Check, AlertCircle, X, ExternalLink, Sparkles, Loader2, Eye, EyeOff, RotateCcw } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "en" | "hi";
  onKeyUpdated?: (key: string | null) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  language,
  onKeyUpdated
}) => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [hasCustomKey, setHasCustomKey] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("claimkavach_gemini_api_key");
      if (stored) {
        setApiKey(stored);
        setHasCustomKey(true);
      } else {
        setApiKey("");
        setHasCustomKey(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleValidateAndSave = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setStatusMessage({
        type: "error",
        text: language === "hi" ? "कृपया एक मान्य जेमिनी एपीआई की (API Key) दर्ज करें।" : "Please enter a valid Gemini API key."
      });
      return;
    }

    setIsValidating(true);
    setStatusMessage(null);

    try {
      // Validate via internal Next.js API endpoint first
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed })
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        localStorage.setItem("claimkavach_gemini_api_key", trimmed);
        setHasCustomKey(true);
        setStatusMessage({
          type: "success",
          text: language === "hi" 
            ? "✓ एपीआई की सफलतापूर्वक सत्यापित और सुरक्षित हो गई! अब आप लाइव क्लेम टेस्ट कर सकते हैं।" 
            : "✓ Gemini API key verified & saved! Live OCR extraction is now active."
        });
        if (onKeyUpdated) onKeyUpdated(trimmed);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        // Fallback: Check if client direct fetch to Google works
        try {
          const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmed}`);
          const directData = await directRes.json();
          if (directRes.ok && directData.models && directData.models.length > 0) {
            localStorage.setItem("claimkavach_gemini_api_key", trimmed);
            setHasCustomKey(true);
            setStatusMessage({
              type: "success",
              text: language === "hi" 
                ? "✓ एपीआई की सुरक्षित हो गई!" 
                : "✓ Key saved successfully!"
            });
            if (onKeyUpdated) onKeyUpdated(trimmed);
            setTimeout(() => {
              onClose();
            }, 1200);
            return;
          }
        } catch {
          // Ignore secondary failure
        }

        const errMsg = data.error || "Invalid API key response from Google AI Studio";
        setStatusMessage({
          type: "error",
          text: `${language === "hi" ? "अमान्य की:" : "Validation Error:"} ${errMsg}`
        });
      }
    } catch (err: any) {
      // Network issue: save anyway so user is not blocked
      localStorage.setItem("claimkavach_gemini_api_key", trimmed);
      setHasCustomKey(true);
      setStatusMessage({
        type: "success",
        text: language === "hi" ? "✓ की सुरक्षित हो गई!" : "✓ Key saved successfully!"
      });
      if (onKeyUpdated) onKeyUpdated(trimmed);
      setTimeout(() => {
        onClose();
      }, 1200);
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem("claimkavach_gemini_api_key");
    setApiKey("");
    setHasCustomKey(false);
    setStatusMessage({
      type: "info",
      text: language === "hi" 
        ? "कस्टम एपीआई की हटा दी गई है।" 
        : "Custom API key removed. Reverted to system default."
    });
    if (onKeyUpdated) onKeyUpdated(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
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
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/25 shrink-0">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-900">
              {language === "hi" ? "Google Gemini API की सेटिंग्स" : "Google Gemini API Key Settings"}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {language === "hi"
                ? "हैकाथॉन मूल्यांकन के लिए अपनी निजी नि:शुल्क की जोड़ें"
                : "Plug in your free Google AI Studio key for live OCR evaluation"}
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200 text-xs text-slate-700 mb-5 leading-relaxed">
          <p className="font-semibold text-sky-950 flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-sky-600" />
            {language === "hi" ? "हैकाथॉन जूरी एवं लाइव मूल्यांकन हेतु:" : "For Judges & Hackathon Evaluators:"}
          </p>
          <span>
            {language === "hi"
              ? "अपनी Google AI Studio की डालकर किसी भी अस्पताल बिल और डिस्चार्ज समरी का लाइव टेस्ट करें। यह सीधे ब्राउज़र में सुरक्षित रहता है।"
              : "Paste your free personal Gemini API key below to audit any uploaded hospital bill live with Google Gemini. Key is stored locally in your browser."}
          </span>
        </div>

        {/* Key Input */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-bold text-slate-700 block">
            {language === "hi" ? "Gemini API Key (AIzaSy...):" : "Gemini API Key (starts with AIzaSy...):"}
          </label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full text-xs font-mono font-medium px-3.5 py-2.5 pr-20 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-hidden transition-all text-slate-900"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
              title={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className={`p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
            statusMessage.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
              : statusMessage.type === "error"
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-slate-100 text-slate-700 border border-slate-200"
          }`}>
            {statusMessage.type === "success" && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
            {statusMessage.type === "error" && <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {hasCustomKey && (
            <button
              type="button"
              onClick={handleClearKey}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{language === "hi" ? "की हटाएं" : "Remove Key"}</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              {language === "hi" ? "बंद करें" : "Close"}
            </button>

            <button
              type="button"
              disabled={isValidating || !apiKey.trim()}
              onClick={handleValidateAndSave}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-sky-600/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{language === "hi" ? "जांच हो रही है..." : "Validating..."}</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{language === "hi" ? "सत्यापित कर सुरक्षित करें" : "Save & Activate"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Free Key Helper Link */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>{language === "hi" ? "नि:शुल्क की प्राप्त करें (10 सेकंड):" : "Get a 100% free Gemini key (no credit card):"}</span>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 underline underline-offset-2"
          >
            <span>aistudio.google.com</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
