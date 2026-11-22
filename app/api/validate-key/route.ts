import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 15) {
      return NextResponse.json(
        { valid: false, error: "API key must be at least 15 characters long." },
        { status: 400 }
      );
    }

    const trimmed = apiKey.trim();
    const genAI = new GoogleGenerativeAI(trimmed);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

    // Quick verification ping
    const result = await model.generateContent("ping");
    const responseText = result.response.text();

    return NextResponse.json({
      valid: true,
      message: "API key is valid and ready for OCR analysis.",
      sampleResponse: responseText.slice(0, 30)
    });
  } catch (error: any) {
    console.error("[ClaimKavach AI] Key validation failed:", error?.message || error);
    return NextResponse.json(
      { 
        valid: false, 
        error: error?.message || "Invalid API key response from Google AI Studio." 
      },
      { status: 400 }
    );
  }
}
