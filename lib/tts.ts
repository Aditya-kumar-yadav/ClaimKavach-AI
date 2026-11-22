// Vernacular Voice Synthesis Engine:
// 1. Primary: Google Gemini Studio-Quality Flash TTS via /api/tts (Neural WAV audio)
// 2. Fallback: Browser Native Web Speech API (with Chromium cancel/pause/voice fixes)

export class VernacularTTS {
  private static currentAudio: HTMLAudioElement | null = null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static audioCache = new Map<string, string>();

  /**
   * Speak text in Hindi or Indian English with zero-fail fallback
   */
  public static async speak(
    text: string,
    language: "hi" | "en" = "hi",
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<boolean> {
    this.stop();

    // 1. Try Gemini Studio-Quality Flash TTS
    try {
      if (onStart) onStart();

      const cacheKey = `${language}:${text.trim()}`;
      let audioDataUrl = this.audioCache.get(cacheKey);

      if (!audioDataUrl) {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language })
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.success && data?.audioBase64) {
            audioDataUrl = `data:${data.mimeType || "audio/wav"};base64,${data.audioBase64}`;
            this.audioCache.set(cacheKey, audioDataUrl);
          }
        }
      }

      if (audioDataUrl) {
        const audio = new Audio(audioDataUrl);
        this.currentAudio = audio;

        audio.onended = () => {
          this.currentAudio = null;
          if (onEnd) onEnd();
        };

        audio.onerror = (e) => {
          console.warn("Audio element playback failed, falling back to Web Speech:", e);
          this.currentAudio = null;
          this.speakWebSpeech(text, language, onEnd);
        };

        await audio.play();
        return true;
      }
    } catch (err) {
      console.warn("Gemini TTS API call failed, falling back to browser Web Speech:", err);
    }

    // 2. Reliable Fallback: Native Browser Web Speech API
    return this.speakWebSpeech(text, language, onEnd);
  }

  /**
   * Web Speech API fallback with all Chromium quirks fixed
   */
  public static speakWebSpeech(
    text: string,
    language: "hi" | "en" = "hi",
    onEnd?: () => void
  ): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onEnd) onEnd();
      return false;
    }

    const synth = window.speechSynthesis;

    try {
      // Fix Chromium paused/stuck state
      if (synth.paused) {
        synth.resume();
      }

      // Chromium Bug Fix: NEVER call synth.cancel() and synth.speak() synchronously!
      // Must allow Chromium's IPC thread 60ms to complete the cancellation
      synth.cancel();

      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.95;
          utterance.pitch = 1.0;

          const voices = synth.getVoices();

          if (language === "hi") {
            const hindiVoice = voices.find(
              v => v.lang.includes("hi") || v.name.toLowerCase().includes("hindi")
            );
            if (hindiVoice) {
              utterance.voice = hindiVoice;
              utterance.lang = "hi-IN";
            } else {
              // If OS has no Hindi voice (common on standard English Windows installations),
              // use Indian English voice (Heera / Ravi / Indian) so audio doesn't fail silently
              const indianVoice = voices.find(
                v => v.lang.includes("en-IN") || v.name.includes("India") || v.name.includes("Heera") || v.name.includes("Ravi")
              );
              if (indianVoice) {
                utterance.voice = indianVoice;
              }
              utterance.lang = "en-IN";
            }
          } else {
            utterance.lang = "en-IN";
            const indianVoice = voices.find(
              v => v.lang.includes("en-IN") || v.name.includes("India") || v.name.includes("Heera") || v.name.includes("Ravi")
            );
            if (indianVoice) {
              utterance.voice = indianVoice;
            }
          }

          utterance.onend = () => {
            VernacularTTS.currentUtterance = null;
            if (onEnd) onEnd();
          };

          utterance.onerror = (e) => {
            console.warn("Web Speech utterance error:", e);
            VernacularTTS.currentUtterance = null;
            if (onEnd) onEnd();
          };

          this.currentUtterance = utterance;
          // Retain strong reference on window to prevent Chromium GC bug
          (window as any)._claimKavachActiveUtterance = utterance;

          synth.speak(utterance);
        } catch (innerErr) {
          console.error("Web Speech execution error:", innerErr);
          if (onEnd) onEnd();
        }
      }, 60);

      return true;
    } catch (err) {
      console.error("Speech synthesis failed:", err);
      if (onEnd) onEnd();
      return false;
    }
  }

  public static stop(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    this.currentUtterance = null;
  }

  public static isSpeaking(): boolean {
    return (
      this.currentAudio !== null ||
      (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.speaking)
    );
  }
}
