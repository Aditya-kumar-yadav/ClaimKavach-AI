// Vernacular Voice Synthesis Engine using Browser Native Web Speech API

export class VernacularTTS {
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  private static getSynth(): SpeechSynthesis | null {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      return window.speechSynthesis;
    }
    return null;
  }

  public static speakHindi(text: string, onEnd?: () => void): boolean {
    const synth = this.getSynth();
    if (!synth) {
      console.warn("Web Speech API not supported in this browser");
      return false;
    }

    // Always stop and cancel first to guarantee no two voices talk over each other
    this.stop();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "hi-IN";
      utterance.rate = 0.95; // Slightly slower for crisp Hindi clarity
      utterance.pitch = 1.0;

      // Pick a natural Hindi voice if available
      const voices = synth.getVoices();
      const hindiVoice = voices.find(
        v => v.lang.includes("hi") || v.name.toLowerCase().includes("hindi") || v.name.includes("India")
      );
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }

      utterance.onend = () => {
        VernacularTTS.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        VernacularTTS.currentUtterance = null;
        if (onEnd) onEnd();
      };

      this.currentUtterance = utterance;
      synth.speak(utterance);
      return true;
    } catch (err) {
      console.error("Speech synthesis failed:", err);
      this.currentUtterance = null;
      return false;
    }
  }

  public static stop(): void {
    const synth = this.getSynth();
    if (synth) {
      try {
        synth.cancel();
      } catch (e) {
        // Safe ignore
      }
      this.currentUtterance = null;
    }
  }

  public static isSpeaking(): boolean {
    const synth = this.getSynth();
    return synth ? synth.speaking : false;
  }
}
