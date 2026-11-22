"use client";

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Sparkles, Loader2, Languages } from "lucide-react";
import { VernacularTTS } from "@/lib/tts";

interface AudioExplainerProps {
  hindiSummary: string;
  englishSummary?: string;
  language: "en" | "hi";
}

export const AudioExplainer: React.FC<AudioExplainerProps> = ({ 
  hindiSummary, 
  englishSummary,
  language 
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

  return (
    <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-sky-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl mb-6 relative overflow-hidden border border-indigo-500/30">
      {/* Ambient Radial Glow */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-4">
          {/* Main Audio Trigger Button */}
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={isLoading && false}
            className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer shrink-0 ${
              isPlaying
                ? "bg-rose-500 text-white shadow-rose-500/40 animate-pulse"
                : isLoading
                ? "bg-amber-500 text-white shadow-amber-500/40"
                : "bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/30 hover:scale-105"
            }`}
            title={isPlaying ? "Click to stop" : "Click to play voice explanation"}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : isPlaying ? (
              <VolumeX className="h-6 w-6 text-white" />
            ) : (
              <Volume2 className="h-6 w-6 text-white" />
            )}
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-sky-300 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>
                  {activeVoiceLang === "hi" 
                    ? "आवाज़ में सहायता (Gemini Neural Voice Assistant)" 
                    : "Voice Explainer (Gemini Neural Voice Assistant)"}
                </span>
              </span>

              {isPlaying && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold animate-pulse">
                  {activeVoiceLang === "hi" ? "बोल रहा है..." : "Speaking..."}
                </span>
              )}
              {isLoading && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold animate-pulse">
                  {activeVoiceLang === "hi" ? "आवाज तैयार हो रही है..." : "Synthesizing AI Audio..."}
                </span>
              )}
            </div>

            <h3 className="font-bold text-base sm:text-lg text-white mt-0.5">
              {activeVoiceLang === "hi"
                ? "कागजी गलतियों और समाधान को बोलकर सुनें"
                : "Listen to Audit Findings in Reassuring Voice"}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
              {activeVoiceLang === "hi"
                ? "कम पढ़े-लिखे परिवारों के लिए सरल हिंदी में समझाया गया विवरण। अस्पताल काउंटर पर क्या ठीक कराना है।"
                : "Spoken remediation guide explaining what exact documents need fixing at the hospital desk."}
            </p>
          </div>
        </div>

        {/* Right Section: Language Toggle & Audio Equalizer */}
        <div className="flex flex-wrap sm:flex-col items-end gap-2.5 self-end sm:self-center">
          {/* Dual Language Switcher */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleLanguageSwitch("hi")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeVoiceLang === "hi" 
                  ? "bg-sky-500 text-white shadow-xs" 
                  : "text-slate-300 hover:text-white"
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => handleLanguageSwitch("en")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeVoiceLang === "en" 
                  ? "bg-sky-500 text-white shadow-xs" 
                  : "text-slate-300 hover:text-white"
              }`}
            >
              English
            </button>
          </div>

          {/* Equalizer Frequency Bars */}
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
            <div className={`w-1 bg-sky-400 rounded-full transition-all duration-300 ${isPlaying ? "h-5 animate-wave" : "h-2"}`}></div>
            <div className={`w-1 bg-sky-300 rounded-full transition-all duration-300 ${isPlaying ? "h-7 animate-wave delay-75" : "h-3"}`}></div>
            <div className={`w-1 bg-indigo-400 rounded-full transition-all duration-300 ${isPlaying ? "h-4 animate-wave delay-150" : "h-2"}`}></div>
            <div className={`w-1 bg-amber-400 rounded-full transition-all duration-300 ${isPlaying ? "h-6 animate-wave delay-100" : "h-3"}`}></div>
            <div className={`w-1 bg-sky-400 rounded-full transition-all duration-300 ${isPlaying ? "h-3 animate-wave delay-200" : "h-2"}`}></div>
            <span className="text-[11px] font-mono text-slate-300 ml-1.5 font-semibold">
              {isPlaying ? "Playing AI Audio" : isLoading ? "Loading" : "Studio Voice Ready"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
