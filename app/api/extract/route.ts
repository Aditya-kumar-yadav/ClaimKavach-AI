import { NextRequest, NextResponse } from "next/server";
import { extractWithGemini } from "@/lib/gemini-ocr";

// Allow up to 35 seconds for Gemini Multimodal OCR on mobile / slow connections
export const maxDuration = 35;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customHeaderKey = req.headers.get("x-gemini-key");
    const { billBase64, summaryBase64, preset, customApiKey } = body;
    const keyToUse = customHeaderKey || customApiKey;

    const extractedData = await extractWithGemini(billBase64, summaryBase64, preset, keyToUse);
    return NextResponse.json(extractedData);
  } catch (error: any) {
    console.error("[ClaimKavach AI] API /api/extract Error:", error?.message || error);
    
    const message = error?.message || "Failed to process claim document";
    const isApiKeyError = 
      message.includes("NO_API_KEY") || 
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
