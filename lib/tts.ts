// Vernacular Voice Synthesis Engine using Browser Native Web Speech API

export class VernacularTTS {
  private static synth: SpeechSynthesis | null = null;
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

    // Cancel any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.95; // Slightly slower for crisp clarity
    utterance.pitch = 1.0;

    // Pick a natural Hindi voice if available
    const voices = synth.getVoices();
    const hindiVoice = voices.find(
      v => v.lang.includes("hi") || v.name.toLowerCase().includes("hindi") || v.name.includes("India")
    );
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    this.currentUtterance = utterance;
    synth.speak(utterance);
    return true;
  }

  public static stop(): void {
    const synth = this.getSynth();
    if (synth) {
      synth.cancel();
      this.currentUtterance = null;
    }
  }

  public static isSpeaking(): boolean {
    const synth = this.getSynth();
    return synth ? synth.speaking : false;
  }
}
