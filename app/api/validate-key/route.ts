import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10) {
      return NextResponse.json(
        { valid: false, error: "API key must be at least 10 characters long." },
        { status: 400 }
      );
    }

    const trimmed = apiKey.trim();

    // 1. CovexCode Event API Key (starts with bx-)
    if (trimmed.startsWith("bx-")) {
      const covexEndpoint = process.env.COVEXCODE_ENDPOINT || "https://llm.covexcode.com/event/v1";
      const checkRes = await fetch(`${covexEndpoint.replace(/\/+$/, "")}/models`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${trimmed}`
        }
      });

      if (!checkRes.ok) {
        const errText = await checkRes.text();
        return NextResponse.json(
          { valid: false, error: `CovexCode authentication failed (${checkRes.status}): ${errText}` },
          { status: 400 }
        );
      }

      const modelsData = await checkRes.json();
      return NextResponse.json({
        valid: true,
        engine: "covexcode",
        model: "deepseek-v4-flash",
        message: "CovexCode Event Key verified! DeepSeek-v4-Flash is active.",
        models: modelsData?.data?.map((m: any) => m.id) || ["deepseek-v4-flash"]
      });
    }

    // 2. Google Gemini API Key
    const genAI = new GoogleGenerativeAI(trimmed);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    // Quick verification ping
    const result = await model.generateContent("ping");
    const responseText = result.response.text();

    return NextResponse.json({
      valid: true,
      engine: "gemini",
      message: "Gemini API key is valid and ready for OCR analysis.",
      sampleResponse: responseText.slice(0, 30)
    });
  } catch (error: any) {
    console.error("[ClaimKavach AI] Key validation failed:", error?.message || error);
    return NextResponse.json(
      { 
        valid: false, 
        error: error?.message || "Invalid API key response." 
      },
      { status: 400 }
    );
  }
}
