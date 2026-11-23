// Infallible Vernacular Voice Synthesis Engine
// 1. Primary: Google Gemini Studio Flash TTS via Web Audio API (AudioContext)
// 2. Fallback: Browser Native Web Speech API with automatic language/voice mapping

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioCtx = new AudioContextClass();
      }
    }
    // Resume audio context inside synchronous user click event
    if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch (e) {
    console.warn("AudioContext initialization warning:", e);
    return null;
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Normalizes all currency symbols and representations into spoken words (रुपये in Hindi / rupees in English)
 * so speech synthesis engines NEVER pronounce "dollar" or "rupee dollar".
 */
export function normalizeCurrencyForSpeech(text: string, language: "hi" | "en" = "hi"): string {
  if (!text) return "";

  let cleaned = text;

  if (language === "hi") {
    cleaned = cleaned.replace(/₹\s*([0-9,]+)/g, (_, amt) => `${amt} रुपये`);
    cleaned = cleaned.replace(/Rs\.?\s*([0-9,]+)/gi, (_, amt) => `${amt} रुपये`);
    cleaned = cleaned.replace(/INR\s*([0-9,]+)/gi, (_, amt) => `${amt} रुपये`);
    cleaned = cleaned.replace(/\$\s*([0-9,]+)/g, (_, amt) => `${amt} रुपये`);
    cleaned = cleaned.replace(/₹/g, " रुपये ");
    cleaned = cleaned.replace(/\$/g, " ");
    cleaned = cleaned.replace(/\bdollars?\b/gi, "रुपये");
  } else {
    cleaned = cleaned.replace(/₹\s*([0-9,]+)/g, (_, amt) => `${amt} rupees`);
    cleaned = cleaned.replace(/Rs\.?\s*([0-9,]+)/gi, (_, amt) => `${amt} rupees`);
    cleaned = cleaned.replace(/INR\s*([0-9,]+)/gi, (_, amt) => `${amt} rupees`);
    cleaned = cleaned.replace(/\$\s*([0-9,]+)/g, (_, amt) => `${amt} rupees`);
    cleaned = cleaned.replace(/₹/g, " rupees ");
    cleaned = cleaned.replace(/\$/g, " ");
    cleaned = cleaned.replace(/\bdollars?\b/gi, "rupees");
  }

  return cleaned.replace(/\s+/g, " ").trim();
}

export class VernacularTTS {
  private static currentSource: AudioBufferSourceNode | null = null;
  private static currentAudio: HTMLAudioElement | null = null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static audioCache = new Map<string, ArrayBuffer>();

  /**
   * Must be called synchronously on user click to unlock browser audio autoplay
   */
  public static unlockAudio(): void {
    getAudioContext();
  }

  /**
   * Speak text via Gemini Neural Audio or Web Speech API
   */
  public static async speak(
    text: string,
    language: "hi" | "en" = "hi",
    englishFallbackText?: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<boolean> {
    this.stop();

    // Normalize text so currency is always pronounced in rupees (रुपये), never "dollar"
    const cleanText = normalizeCurrencyForSpeech(text, language);
    const cleanFallback = englishFallbackText ? normalizeCurrencyForSpeech(englishFallbackText, "en") : undefined;

    // Unlock Web Audio Context during this user interaction
    const ctx = getAudioContext();

    const cacheKey = `${language}:${cleanText.trim()}`;

    // 1. Try Gemini Flash Neural Studio Audio via /api/tts
    try {
      let arrayBuffer = this.audioCache.get(cacheKey);

      if (!arrayBuffer) {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleanText, language })
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.success && data?.audioBase64) {
            arrayBuffer = base64ToArrayBuffer(data.audioBase64);
            this.audioCache.set(cacheKey, arrayBuffer);
          }
        }
      }

      if (arrayBuffer && ctx) {
        // Decode audio data using unlocked AudioContext (bypasses Autoplay policy timeouts)
        // Slice the buffer because decodeAudioData detaches the arrayBuffer
        const bufferCopy = arrayBuffer.slice(0);
        const audioBuffer = await ctx.decodeAudioData(bufferCopy);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        source.onended = () => {
          this.currentSource = null;
          if (onEnd) onEnd();
        };

        this.currentSource = source;
        if (onStart) onStart();

        source.start(0);
        return true;
      }
    } catch (err) {
      console.warn("Web Audio playback failed, attempting fallback:", err);
    }

    // 2. Reliable Fallback: Browser Web Speech API
    return this.speakWebSpeech(text, language, englishFallbackText, onStart, onEnd);
  }

  /**
   * Web Speech API fallback with voice detection
   */
  public static speakWebSpeech(
    text: string,
    language: "hi" | "en" = "hi",
    englishFallbackText?: string,
    onStart?: () => void,
    onEnd?: () => void
  ): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onEnd) onEnd();
      return false;
    }

    const synth = window.speechSynthesis;

    try {
      if (synth.paused) {
        synth.resume();
      }

      synth.cancel();

      setTimeout(() => {
        try {
          const voices = synth.getVoices();
          const hasHindiVoice = voices.some(
            v => v.lang.includes("hi") || v.name.toLowerCase().includes("hindi")
          );

          // Always normalize currency to spoken words (रुपये / rupees)
          const cleanText = normalizeCurrencyForSpeech(text, language);
          const cleanFallback = englishFallbackText ? normalizeCurrencyForSpeech(englishFallbackText, "en") : undefined;

          // If Windows has no Hindi voice installed, speak the English summary using the Indian English voice
          // This ensures sound ALWAYS comes out of the speakers!
          let textToSpeak = cleanText;
          let langCode = "hi-IN";

          if (language === "hi") {
            if (hasHindiVoice) {
              langCode = "hi-IN";
            } else {
              // Fallback to English summary with Indian accent voice so sound actually plays
              textToSpeak = cleanFallback || "Attention! Please check your hospital bill for admission date mismatch and missing doctor registration seal.";
              langCode = "en-IN";
            }
          } else {
            langCode = "en-IN";
            textToSpeak = cleanFallback || cleanText;
          }

          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.rate = 0.95;
          utterance.pitch = 1.0;
          utterance.lang = langCode;

          // Select matching voice
          const selectedVoice = voices.find(
            v => (langCode === "hi-IN" ? (v.lang.includes("hi") || v.name.includes("Hindi")) : (v.lang.includes("en-IN") || v.name.includes("India") || v.name.includes("Heera") || v.name.includes("Ravi")))
          ) || voices.find(v => v.lang.startsWith("en"));

          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }

          utterance.onstart = () => {
            if (onStart) onStart();
          };

          utterance.onend = () => {
            VernacularTTS.currentUtterance = null;
            if (onEnd) onEnd();
          };

          utterance.onerror = (e) => {
            console.warn("Utterance error:", e);
            VernacularTTS.currentUtterance = null;
            if (onEnd) onEnd();
          };

          this.currentUtterance = utterance;
          (window as any)._claimKavachActiveUtterance = utterance;

          synth.speak(utterance);
        } catch (innerErr) {
          console.error("Web Speech execution error:", innerErr);
          if (onEnd) onEnd();
        }
      }, 50);

      return true;
    } catch (err) {
      console.error("Speech synthesis failed:", err);
      if (onEnd) onEnd();
      return false;
    }
  }

  public static stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {}
      this.currentSource = null;
    }

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
      this.currentSource !== null ||
      this.currentAudio !== null ||
      (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.speaking)
    );
  }
}
