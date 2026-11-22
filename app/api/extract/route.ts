import { NextRequest, NextResponse } from "next/server";
import { extractWithGemini } from "@/lib/gemini-ocr";

// Allow up to 30 seconds for Gemini Multimodal OCR on slow connections
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { billBase64, summaryBase64, preset } = body;

    const extractedData = await extractWithGemini(billBase64, summaryBase64, preset);
    return NextResponse.json(extractedData);
  } catch (error: any) {
    console.error("API /api/extract Error:", error);
    return NextResponse.json(
      { error: "Failed to extract claim documents", details: error.message },
      { status: 500 }
    );
  }
}
