import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let apiKey: string | null = null;
    try {
      const body = await req.json();
      apiKey = body?.apiKey;
    } catch {
      // Body empty or optional
    }

    const covexEndpoint = process.env.COVEXCODE_ENDPOINT || "https://llm.covexcode.com/event/v1";
    const targetKey = (apiKey && typeof apiKey === "string" && apiKey.trim().length > 5)
      ? apiKey.trim()
      : (process.env.COVEXCODE_API_KEY || "bx-live-b0393ac6e1340e5786d607bc6f5211c6");

    // 1. CovexCode Event API Key Check (starts with bx- or system default)
    if (targetKey.startsWith("bx-")) {
      const startTime = Date.now();
      const checkRes = await fetch(`${covexEndpoint.replace(/\/+$/, "")}/models`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${targetKey}`
        }
      });
      const latencyMs = Date.now() - startTime;

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
        endpoint: covexEndpoint,
        latencyMs,
        tokenAllowance: "100,000,000 Tokens (5 Team Candidates Active) + 5 Web Accounts",
        teamKeys: [
          { label: "Candidate 1 (Teammate)", key: "bx-live-e05b279d...", sector: "Hackathon Event (20M)" },
          { label: "Candidate 2 (Teammate)", key: "bx-live-b0393ac6...", sector: "Hackathon Event (20M)" },
          { label: "Candidate 3 (Teammate)", key: "bx-live-3a34b070...", sector: "Hackathon Event (20M)" },
          { label: "Candidate 4 (Teammate)", key: "bx-live-47a60f8c...", sector: "Hackathon Event (20M)" },
          { label: "Candidate 5 (Teammate)", key: "bx-live-e3ad305b...", sector: "Hackathon Event (20M)" },
          { label: "Teammate 1 (Web)", key: "bx-live-9ee9d61f...", sector: "Web Dashboard ($10)" },
          { label: "Teammate 2 (Web)", key: "bx-live-bdf0f799...", sector: "Web Dashboard ($10)" },
          { label: "Teammate 3 (Web)", key: "bx-live-c5b177b5...", sector: "Web Dashboard ($10)" },
          { label: "User / Lead (Web)", key: "bx-live-c5a034ef...", sector: "Web Dashboard ($10)" },
          { label: "Teammate 5 (Web)", key: "bx-live-01709486...", sector: "Web Dashboard ($10)" }
        ],
        message: "CovexCode 10-Key Super Pool (DeepSeek-v4-Flash) is live & authenticated! 200 OK.",
        models: modelsData?.data?.map((m: any) => m.id) || ["deepseek-v4-flash"]
      });
    }

    // 2. Google Gemini Fallback if explicitly passed
    const genAI = new GoogleGenerativeAI(targetKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
    const startTime = Date.now();
    const result = await model.generateContent("ping");
    const latencyMs = Date.now() - startTime;
    const responseText = result.response.text();

    return NextResponse.json({
      valid: true,
      engine: "gemini",
      latencyMs,
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

export async function GET() {
  const req = new NextRequest("http://localhost/api/validate-key", { method: "POST" });
  return POST(req);
}
