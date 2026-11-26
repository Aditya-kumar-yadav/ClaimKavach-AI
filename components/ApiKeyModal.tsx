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
      const stored = localStorage.getItem("claimkavach_covex_api_key") || localStorage.getItem("claimkavach_gemini_api_key");
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
        text: language === "hi" ? "कृपया एक मान्य एपीआई की (API Key) दर्ज करें।" : "Please enter a valid API key."
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
        if (trimmed.startsWith("bx-")) {
          localStorage.setItem("claimkavach_covex_api_key", trimmed);
          localStorage.removeItem("claimkavach_gemini_api_key");
        } else {
          localStorage.setItem("claimkavach_gemini_api_key", trimmed);
        }
        setHasCustomKey(true);
        setStatusMessage({
          type: "success",
          text: language === "hi" 
            ? "✓ एपीआई की सफलतापूर्वक सत्यापित और सुरक्षित हो गई! अब आप लाइव क्लेम टेस्ट कर सकते हैं।" 
            : `✓ ${data.engine === "covexcode" ? "CovexCode (DeepSeek-v4-Flash)" : "API"} key verified & saved! Live OCR extraction is now active.`
        });
        if (onKeyUpdated) onKeyUpdated(trimmed);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        const errMsg = data.error || "Invalid API key response.";
        setStatusMessage({
          type: "error",
          text: `${language === "hi" ? "अमान्य की:" : "Validation Error:"} ${errMsg}`
        });
      }
    } catch (err: any) {
      // Network issue: save anyway so user is not blocked
      if (trimmed.startsWith("bx-")) {
        localStorage.setItem("claimkavach_covex_api_key", trimmed);
      } else {
        localStorage.setItem("claimkavach_gemini_api_key", trimmed);
      }
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
    localStorage.removeItem("claimkavach_covex_api_key");
    localStorage.removeItem("claimkavach_gemini_api_key");
    setApiKey("");
    setHasCustomKey(false);
    setStatusMessage({
      type: "info",
      text: language === "hi" 
        ? "कस्टम एपीआई की हटा दी गई है।" 
        : "Custom API key removed. Reverted to CovexCode system default."
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
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-900">
              {language === "hi" ? "AI इंजन सेटिंग्स (CovexCode & Gemini)" : "AI Engine Settings (CovexCode & Gemini)"}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {language === "hi"
                ? "हैकाथॉन मूल्यांकन के लिए CovexCode (DeepSeek-v4-Flash) सक्रिय है"
                : "Powered by CovexCode (DeepSeek-v4-Flash) for Hack With Delhi 4.0"}
            </p>
          </div>
        </div>

        {/* CovexCode Active Partner Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/90 text-xs text-slate-800 mb-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-extrabold text-violet-950">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-600 animate-pulse"></span>
              <span>CovexCode (DeepSeek-v4-Flash)</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-violet-200/80 text-violet-900 font-mono text-[10px] font-bold">
              Event Sponsor Active
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            <strong>Hackathon Allowance:</strong> 20,000,000 tokens pre-configured on endpoint <code className="bg-white/90 px-1 py-0.5 rounded text-violet-800 font-mono">llm.covexcode.com/event/v1</code>. Live document OCR is fully active.
          </p>
        </div>

        {/* Info Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 mb-4 leading-relaxed">
          <p className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            {language === "hi" ? "जूरी एवं लाइव मूल्यांकन हेतु वैकल्पिक की:" : "Custom Key Override (Optional for Judges):"}
          </p>
          <span>
            {language === "hi"
              ? "यदि आप अपनी व्यक्तिगत CovexCode (bx-...) या Google Gemini (AIza...) की से टेस्ट करना चाहते हैं, तो नीचे दर्ज करें।"
              : "Paste your personal CovexCode key (bx-...) or Google Gemini key (AIza...) below to override the system key."}
          </span>
        </div>

        {/* Key Input */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-bold text-slate-700 block">
            {language === "hi" ? "API Key (CovexCode bx-... या Gemini AIza...):" : "API Key (CovexCode bx-... or Gemini AIza...):"}
          </label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="bx-live-... or AIzaSy..."
              className="w-full text-xs font-mono font-medium px-3.5 py-2.5 pr-20 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-hidden transition-all text-slate-900"
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
