"use client";

import React from "react";
import { Check, Sparkles, Scan, Scale, ShieldCheck, Lock } from "lucide-react";

interface ProcessingPipelineProps {
  currentStep: 1 | 2 | 3;
  language: "en" | "hi";
}

export const ProcessingPipeline: React.FC<ProcessingPipelineProps> = ({ currentStep, language }) => {
  const steps = [
    {
      step: 1,
      icon: Scan,
      titleEn: "Multimodal Gemini Vision OCR",
      titleHi: "मल्टीमॉडल जेमिनी विजन ओसीआर",
      descEn: "Extracting itemized bill line items & cross-document discharge dates...",
      descHi: "अस्पताल बिल की मदें एवं दोनों कागजों से भर्ती/डिस्चार्ज तारीखों का निष्कर्षण..."
    },
    {
      step: 2,
      icon: Scale,
      titleEn: "IRDAI 2024 Statutory Rule Engine",
      titleHi: "आईआरडीएआई 2024 वैधानिक नियम ऑडिट",
      descEn: "Auditing against May 2024 Master Circular, Para 13 Moratorium & Lists I–IV...",
      descHi: "मास्टर सर्कुलर (मई 2024), पैरा 13 मोरेटोरियम और सूचियां I-IV से लाइव मिलान..."
    },
    {
      step: 3,
      icon: Lock,
      titleEn: "NHCX FHIR R4 & SHA-256 Seal",
      titleHi: "NHCX FHIR R4 एवं SHA-256 डिजिटल सील",
      descEn: "Compiling NHA-ABDM FHIR Bundle & signing with tamper-evident digest...",
      descHi: "एनएचसीएक्स एफएचआईआर आर4 बंडल तैयार कर डिजिटल हैश सील से प्रमाणित किया जा रहा है..."
    }
  ];

  const progressPercent = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8 mb-8 border border-sky-300/80 bg-white/95 shadow-xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {/* Background Accent Shimmer */}
      <div className="absolute -right-16 -top-16 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-16 -bottom-16 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md shadow-sky-600/30 shrink-0">
            <Sparkles className="h-5 w-5 text-amber-300 animate-spin" style={{ animationDuration: "3s" }} />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
              {language === "hi"
                ? "3-चरणीय प्री-एडजुडिकेशन पाइपलाइन सक्रिय है"
                : "3-Stage Pre-Adjudication Pipeline Active"}
            </h3>
            <p className="text-xs text-slate-500">
              {language === "hi"
                ? "दस्तावेज़ों का सत्यापन किया जा रहा है (Zero-Hallucination Adjudication)"
                : "Real-time deterministic adjudication & digital public infrastructure compilation"}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
          Stage {currentStep} / 3
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-100 h-2 rounded-full mb-6 overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-sky-500 via-indigo-600 to-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* 3 Stepped Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {steps.map((s) => {
          const isDone = currentStep > s.step;
          const isCurrent = currentStep === s.step;
          const Icon = s.icon;

          return (
            <div
              key={s.step}
              className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 relative ${
                isDone
                  ? "bg-emerald-50/70 border-emerald-300 shadow-xs"
                  : isCurrent
                  ? "bg-sky-50/80 border-sky-400 shadow-md ring-2 ring-sky-400/30"
                  : "bg-slate-50/50 border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                    isDone
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isCurrent
                      ? "bg-sky-600 text-white shadow-md shadow-sky-600/30 animate-bounce"
                      : "bg-slate-200 text-slate-500"
                  }`}
                  style={{ animationDuration: "2s" }}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {isDone ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    <span>{language === "hi" ? "सत्यापित ✓" : "Verified ✓"}</span>
                  </span>
                ) : isCurrent ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-200 text-sky-900 border border-sky-300 animate-pulse flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-600 animate-ping"></span>
                    <span>{language === "hi" ? "प्रक्रिया में..." : "Processing..."}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400">
                    Step {s.step}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                {language === "hi" ? s.titleHi : s.titleEn}
              </h4>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                {language === "hi" ? s.descHi : s.descEn}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
