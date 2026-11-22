import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// In-memory cache for instantaneous playback of common phrases and demo presets
const audioCache = new Map<string, { audioBase64: string; mimeType: string }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body?.text;
    const language = body?.language || "hi";

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text for speech synthesis" }, { status: 400 });
    }

    const cacheKey = `${language}:${text.trim()}`;
    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey)!;
      return NextResponse.json({ success: true, ...cached, cached: true });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
    }

    // Pass the clean text directly without any "Speak the following" prompt wrapper!
    // The TTS model speaks whatever string is passed in the part.
    const cleanSpeechText = text.trim();

    // Target Google Gemini Studio-Quality Flash TTS models (Flash-Lite first for maximum speed and quota)
    const models = ["gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts", "gemini-3.1-flash-tts-preview"];
    let lastError: any = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: cleanSpeechText }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Kore" }
                }
              }
            }
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`Model ${model} TTS returned ${res.status}:`, errText.slice(0, 150));
          lastError = errText;
          continue;
        }

        const data = await res.json();
        const candidate = data?.candidates?.[0];
        const part = candidate?.content?.parts?.[0];

        if (part?.inlineData?.data) {
          const payload = {
            audioBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || "audio/wav"
          };

          // Cache for instant future replays
          audioCache.set(cacheKey, payload);
          return NextResponse.json({ success: true, ...payload, cached: false });
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`TTS error with model ${model}:`, err?.message);
      }
    }

    return NextResponse.json({ 
      error: "All TTS models failed", 
      details: String(lastError) 
    }, { status: 502 });

  } catch (error: any) {
    console.error("TTS endpoint failure:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
