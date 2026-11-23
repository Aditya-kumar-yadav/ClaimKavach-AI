"use client";

import React, { useState, useEffect } from "react";
import { Mic, Square, Sparkles, Loader2, Volume2 } from "lucide-react";
import { VernacularTTS } from "@/lib/tts";

interface AudioExplainerProps {
  hindiSummary: string;
  englishSummary?: string;
  language: "en" | "hi";
  pendingIssueCount?: number;
}

export const AudioExplainer: React.FC<AudioExplainerProps> = ({ 
  hindiSummary, 
  englishSummary,
  language,
  pendingIssueCount
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeVoiceLang, setActiveVoiceLang] = useState<"hi" | "en">(language);

  // Sync with global language toggle
  useEffect(() => {
    setActiveVoiceLang(language);
  }, [language]);

  // When summary changes (e.g. preset switch or reset), immediately cancel any playing audio!
  useEffect(() => {
    VernacularTTS.stop();
    setIsPlaying(false);
    setIsLoading(false);

    return () => {
      VernacularTTS.stop();
    };
  }, [hindiSummary, englishSummary]);

  const handleTogglePlay = async () => {
    // Synchronously unlock browser audio context on user gesture
    VernacularTTS.unlockAudio();

    if (isPlaying || isLoading) {
      VernacularTTS.stop();
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    const textToSpeak = activeVoiceLang === "hi" 
      ? hindiSummary 
      : (englishSummary || hindiSummary);

    setIsLoading(true);

    const success = await VernacularTTS.speak(
      textToSpeak,
      activeVoiceLang,
      englishSummary,
      () => {
        setIsLoading(false);
        setIsPlaying(true);
      },
      () => {
        setIsLoading(false);
        setIsPlaying(false);
      }
    );

    if (!success) {
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const handleLanguageSwitch = (lang: "hi" | "en") => {
    VernacularTTS.stop();
    setIsPlaying(false);
    setIsLoading(false);
    setActiveVoiceLang(lang);
  };

  // Left & Right Waveform heights matching the reference image
  const leftWaveHeights = [14, 24, 16, 44, 22, 36, 20, 28];
  const rightWaveHeights = [28, 20, 36, 22, 44, 16, 24, 14];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden transition-all">
      {/* Soft Ambient Radial Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/60 via-white to-sky-50/40 pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-sky-100/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-emerald-100/30 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center">
        
        {/* Top Header Controls: Accessible Badge + Big Language Buttons */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="h-8 px-3 rounded-full bg-sky-50 border border-sky-200/80 text-sky-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-sky-600 animate-pulse" />
              <span>
                {activeVoiceLang === "hi" ? "आवाज़ में सहायता (Voice Assistant)" : "Vernacular Voice Assistant"}
              </span>
            </span>

            {pendingIssueCount !== undefined && (
              <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border shadow-2xs ${
                pendingIssueCount === 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              }`}>
                {pendingIssueCount === 0
                  ? (activeVoiceLang === "hi" ? "✓ 0 कमियां बाकी (100% फिट)" : "✓ All Issues Fixed")
                  : (activeVoiceLang === "hi" ? `⚠️ ${pendingIssueCount} कमियों का सारांश` : `⚠️ ${pendingIssueCount} Pending Issues`)}
              </span>
            )}
          </div>

          {/* Large, Easy-to-Tap Language Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => handleLanguageSwitch("hi")}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeVoiceLang === "hi"
                  ? "bg-white text-sky-700 shadow-sm shadow-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🇮🇳</span>
              <span>हिन्दी</span>
            </button>
            <button
              type="button"
              onClick={() => handleLanguageSwitch("en")}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeVoiceLang === "en"
                  ? "bg-white text-sky-700 shadow-sm shadow-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🇬🇧</span>
              <span>English</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Main Waveform & Big Circular Tactile Mic Button Stage    */}
        {/* ======================================================== */}
        <div className="w-full max-w-xl my-3 flex items-center justify-center gap-2 sm:gap-3 py-2">
          
          {/* Left Waveform Bars */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {leftWaveHeights.map((h, i) => (
              <div
                key={`left-wave-${i}`}
                style={{
                  height: `${h}px`,
                  animationDelay: `${i * 0.12}s`,
                }}
                className={`w-1.5 sm:w-2 rounded-full transition-all duration-300 ${
                  isPlaying
                    ? "bg-sky-500 animate-wave shadow-xs shadow-sky-400/40"
                    : isLoading
                    ? "bg-amber-400 animate-pulse"
                    : "bg-slate-200 hover:bg-slate-300"
                }`}
              />
            ))}
          </div>

          {/* Central Prominent Tactile Mic Button (Matching Reference Image) */}
          <div className="relative mx-2 sm:mx-4 shrink-0">
            {/* Animated Halo Rings when playing */}
            {isPlaying && (
              <>
                <div className="absolute -inset-3 rounded-full bg-sky-400/20 animate-ping pointer-events-none" />
                <div className="absolute -inset-1.5 rounded-full bg-sky-500/30 animate-pulse pointer-events-none" />
              </>
            )}

            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? "Stop voice explanation" : "Play voice explanation in Hindi"}
              className={`relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-[0_12px_32px_rgba(15,23,42,0.12)] active:scale-95 cursor-pointer border-2 ${
                isPlaying
                  ? "bg-rose-500 hover:bg-rose-600 border-rose-400 text-white shadow-rose-500/30 ring-4 ring-rose-500/20"
                  : isLoading
                  ? "bg-amber-500 hover:bg-amber-600 border-amber-400 text-white shadow-amber-500/30"
                  : "bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800 hover:border-sky-400 hover:text-sky-600 hover:shadow-[0_16px_36px_rgba(2,132,199,0.22)] hover:scale-105"
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-8 w-8 sm:h-9 sm:w-9 animate-spin text-white" />
              ) : isPlaying ? (
                <Square className="h-7 w-7 sm:h-8 sm:w-8 fill-current text-white" />
              ) : (
                <Mic className="h-9 w-9 sm:h-10 sm:w-10 stroke-[2.2] transition-transform" />
              )}
            </button>
          </div>

          {/* Right Waveform Bars */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {rightWaveHeights.map((h, i) => (
              <div
                key={`right-wave-${i}`}
                style={{
                  height: `${h}px`,
                  animationDelay: `${i * 0.12 + 0.1}s`,
                }}
                className={`w-1.5 sm:w-2 rounded-full transition-all duration-300 ${
                  isPlaying
                    ? "bg-sky-500 animate-wave shadow-xs shadow-sky-400/40"
                    : isLoading
                    ? "bg-amber-400 animate-pulse"
                    : "bg-slate-200 hover:bg-slate-300"
                }`}
              />
            ))}
          </div>

        </div>

        {/* ======================================================== */}
        {/* Clear, Big, Readable Prompt for All Users                */}
        {/* ======================================================== */}
        <div className="mt-3 max-w-lg">
          {isPlaying ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 font-extrabold text-xs sm:text-sm animate-pulse mb-1">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span>
                {activeVoiceLang === "hi"
                  ? "🔊 आवाज़ चालू है... रोकने के लिए बटन दबाएं"
                  : "🔊 Speaking... Tap button to Stop"}
              </span>
            </div>
          ) : isLoading ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs sm:text-sm animate-pulse mb-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
              <span>
                {activeVoiceLang === "hi"
                  ? "आवाज़ तैयार हो रही है, कृपया प्रतीक्षा करें..."
                  : "Synthesizing voice audio, please wait..."}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleTogglePlay}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 font-black text-xs sm:text-sm transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98 mb-1 group"
            >
              <Volume2 className="h-4 w-4 text-sky-600 group-hover:scale-110 transition-transform" />
              <span>
                {activeVoiceLang === "hi"
                  ? "👆 यहाँ दबाएं और हिंदी में पूरी बात सुनें"
                  : "👆 Tap here to listen in English"}
              </span>
            </button>
          )}

          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-relaxed">
            {activeVoiceLang === "hi"
              ? "कम पढ़े-लिखे मरीजों व परिजनों के लिए: अस्पताल के बिल में क्या कमी है, उसे सीधे अपनी भाषा में बोलकर समझें।"
              : "Designed for accessible care: spoken guidance explaining what exact hospital corrections are needed."}
          </p>
        </div>

      </div>
    </div>
  );
};
