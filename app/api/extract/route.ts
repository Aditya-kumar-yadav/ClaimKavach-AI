import { NextRequest, NextResponse } from "next/server";
import { extractWithGemini } from "@/lib/gemini-ocr";
import { extractWithCovexCode, isCovexCodeAvailable } from "@/lib/covexcode";
import { 
  FLAWED_DEMO_CLAIM, 
  CLEAN_DEMO_CLAIM, 
  OVERBILLED_PMJAY_CLAIM, 
  WAITING_PERIOD_CLAIM, 
  ROOM_RENT_CAPPING_CLAIM 
} from "@/lib/mock-data";

// Allow up to 35 seconds for Multimodal OCR on mobile / slow connections
export const maxDuration = 35;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customHeaderGeminiKey = req.headers.get("x-gemini-key");
    const customHeaderCovexKey = req.headers.get("x-covexcode-key");
    const { billBase64, summaryBase64, preset, customApiKey, engine } = body;

    // Check presets first
    if (preset === "flawed") return NextResponse.json(FLAWED_DEMO_CLAIM);
    if (preset === "clean") return NextResponse.json(CLEAN_DEMO_CLAIM);
    if (preset === "overbilled") return NextResponse.json(OVERBILLED_PMJAY_CLAIM);
    if (preset === "waiting") return NextResponse.json(WAITING_PERIOD_CLAIM);
    if (preset === "roomrent") return NextResponse.json(ROOM_RENT_CAPPING_CLAIM);

    const covexKey = customHeaderCovexKey || (customApiKey?.startsWith("bx-") ? customApiKey : undefined);
    const geminiKey = customHeaderGeminiKey || (!customApiKey?.startsWith("bx-") ? customApiKey : undefined);

    // Primary Engine: CovexCode (DeepSeek-v4-Flash) - Official Hack With Delhi 4.0 Sponsor
    if (engine !== "gemini" && (covexKey || isCovexCodeAvailable())) {
      try {
        console.log("[ClaimKavach AI] Routing document extraction to CovexCode (DeepSeek-v4-Flash)...");
        const covexResult = await extractWithCovexCode(billBase64, summaryBase64, covexKey);
        return NextResponse.json({ ...covexResult, _engine: "CovexCode (DeepSeek-v4-Flash)" });
      } catch (covexErr: any) {
        console.warn("[ClaimKavach AI] CovexCode encountered an error, attempting Gemini failover:", covexErr?.message || covexErr);
        // Failover to Gemini if configured
        if (geminiKey || process.env.GEMINI_API_KEY) {
          const geminiResult = await extractWithGemini(billBase64, summaryBase64, undefined, geminiKey);
          return NextResponse.json({ ...geminiResult, _engine: "Gemini Vision (Failover)" });
        }
        throw covexErr;
      }
    }

    // Secondary Engine: Google Gemini Vision
    const extractedData = await extractWithGemini(billBase64, summaryBase64, preset, geminiKey);
    return NextResponse.json({ ...extractedData, _engine: "Google Gemini Vision" });
  } catch (error: any) {
    console.error("[ClaimKavach AI] API /api/extract Error:", error?.message || error);
    
    const message = error?.message || "Failed to process claim document";
    const isApiKeyError = 
      message.includes("NO_API_KEY") || 
      message.includes("COVEXCODE_KEY_MISSING") ||
      message.includes("INVALID_API_KEY") || 
      message.includes("GEMINI_QUOTA_EXCEEDED") ||
      message.includes("API_KEY_INVALID") ||
      message.includes("API key not valid");

    return NextResponse.json(
      { 
        error: message, 
        isApiKeyError,
        details: message 
      },
      { status: 400 }
    );
  }
}
