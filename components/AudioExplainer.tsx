"use client";

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Sparkles } from "lucide-react";
import { VernacularTTS } from "@/lib/tts";

interface AudioExplainerProps {
  hindiSummary: string;
  language: "en" | "hi";
}

export const AudioExplainer: React.FC<AudioExplainerProps> = ({ hindiSummary, language }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // When summary changes (e.g. preset switch or reset), immediately cancel any playing audio!
  useEffect(() => {
    VernacularTTS.stop();
    setIsPlaying(false);

    return () => {
      VernacularTTS.stop();
    };
  }, [hindiSummary]);

  const handleTogglePlay = () => {
    // ALWAYS cancel any ongoing/queued speech first so voices never overlap
    VernacularTTS.stop();

    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const success = VernacularTTS.speakHindi(hindiSummary, () => {
        setIsPlaying(false);
      });
      if (!success) {
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-sky-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl mb-8 relative overflow-hidden border border-indigo-500/30">
      {/* Background Glow */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-4">
          {/* Audio Action Button */}
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer shrink-0 ${
              isPlaying
                ? "bg-rose-500 text-white shadow-rose-500/30 animate-pulse"
                : "bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/30"
            }`}
          >
            {isPlaying ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-sky-300 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                {language === "hi" ? "आवाज़ में सहायता (Vernacular Audio Assistant)" : "Voice Explainer (Vernacular Assistant)"}
              </span>
              {isPlaying && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold animate-pulse">
                  बोल रहा है...
                </span>
              )}
            </div>
            <h3 className="font-bold text-base sm:text-lg text-white mt-0.5">
              {language === "hi" ? "कागजी गलतियों और समाधान को हिंदी में सुनें" : "Listen to Audit Findings in Spoken Hindi"}
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {language === "hi"
                ? "कम पढ़े-लिखे परिवारों और मरीजों के लिए सरल हिंदी में समझाया गया विवरण।"
                : "Spoken remediation guide explaining what documents need fixing at the hospital counter."}
            </p>
          </div>
        </div>

        {/* Live Audio Frequency Bars */}
        <div className="flex items-center gap-1.5 self-end sm:self-center bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
          <div className={`w-1 bg-sky-400 rounded-full transition-all duration-300 ${isPlaying ? "h-6 animate-wave" : "h-2"}`}></div>
          <div className={`w-1 bg-sky-300 rounded-full transition-all duration-300 ${isPlaying ? "h-8 animate-wave delay-75" : "h-3"}`}></div>
          <div className={`w-1 bg-indigo-400 rounded-full transition-all duration-300 ${isPlaying ? "h-5 animate-wave delay-150" : "h-2"}`}></div>
          <div className={`w-1 bg-amber-400 rounded-full transition-all duration-300 ${isPlaying ? "h-7 animate-wave delay-100" : "h-3"}`}></div>
          <div className={`w-1 bg-sky-400 rounded-full transition-all duration-300 ${isPlaying ? "h-4 animate-wave delay-200" : "h-2"}`}></div>
          <span className="text-xs font-mono text-slate-300 ml-2 font-semibold">
            {isPlaying ? "Playing hi-IN" : "Ready"}
          </span>
        </div>
      </div>
    </div>
  );
};
