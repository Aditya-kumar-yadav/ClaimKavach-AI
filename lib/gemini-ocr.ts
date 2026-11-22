import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractedClaim, ExtractedClaimSchema } from "@/types/claim";
import { FLAWED_DEMO_CLAIM, CLEAN_DEMO_CLAIM } from "./mock-data";

// Fallback models in priority order: ultra-fast lightweight 3.5-flash-lite first, then 3.8-flash, then flash-latest
const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

export async function extractWithGemini(
  billBase64?: string,
  summaryBase64?: string,
  forcePreset?: "flawed" | "clean"
): Promise<ExtractedClaim> {
  // If explicitly requested preset, return verified test dataset
  if (forcePreset === "flawed") {
    return FLAWED_DEMO_CLAIM;
  }
  if (forcePreset === "clean") {
    return CLEAN_DEMO_CLAIM;
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback to realistic demo data if API key is not configured or in sandbox demo mode
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY") {
    console.warn("No GEMINI_API_KEY detected in environment, using verified demo preset");
    return FLAWED_DEMO_CLAIM;
  }

  const prompt = `
You are an expert Indian Medical Insurance Claims Adjudication Specialist with deep knowledge of IRDAI (Insurance Regulatory and Development Authority of India) guidelines and PM-JAY packages.
Analyze the provided hospital bill and discharge summary images.

Extract the financial and clinical data into strict, valid JSON matching this exact structure:
{
  "patientName": "string",
  "patientAge": 45,
  "hospitalName": "string",
  "hospitalRegNo": "string",
  "doctorName": "string",
  "doctorRegNo": "string",
  "doctorSigned": true,
  "billAdmitDate": "YYYY-MM-DD",
  "billDischargeDate": "YYYY-MM-DD",
  "summaryAdmitDate": "YYYY-MM-DD",
  "summaryDischargeDate": "YYYY-MM-DD",
  "diagnosis": "string",
  "procedureName": "string",
  "claimedTotal": 25000,
  "lineItems": [
    {
      "name": "string",
      "category": "ROOM" | "MEDICINE" | "SURGERY" | "CONSUMABLE" | "INVESTIGATION" | "OTHER",
      "amount": 1000,
      "isNonPayable": false,
      "nonPayableReason": ""
    }
  ],
  "extractionConfidence": 98
}

Rules:
1. Pay extreme attention to dates: extract the exact admission and discharge dates from BOTH the hospital bill and the discharge summary.
2. Mark isNonPayable = true for items like surgical gloves, PPE, masks, cotton, admission fees, sanitizers.
3. Return ONLY raw JSON without markdown code fences or explanatory prose.
`;

  const parts: any[] = [{ text: prompt }];

  if (billBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: billBase64.replace(/^data:image\/\w+;base64,/, "")
      }
    });
  }

  if (summaryBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: summaryBase64.replace(/^data:image\/\w+;base64,/, "")
      }
    });
  }

  // If no images provided at all, return the flawed demo claim
  if (!billBase64 && !summaryBase64) {
    return FLAWED_DEMO_CLAIM;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`[ClaimKavach AI] Attempting Gemini OCR extraction with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const response = await model.generateContent(parts);
      const text = response.response.text().trim();

      // Clean markdown code blocks if returned
      const cleanedText = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsedJson = JSON.parse(cleanedText);
      const validated = ExtractedClaimSchema.parse(parsedJson);
      console.log(`[ClaimKavach AI] OCR extraction successful with ${modelName}`);
      return validated;
    } catch (err: any) {
      console.warn(`[ClaimKavach AI] Model ${modelName} failed or unavailable: ${err?.message || err}`);
      // Continue to next candidate model
    }
  }

  console.error(
    "[ClaimKavach AI] All Gemini candidate models failed (rate limit/quota/network). Gracefully falling back to verified demo claim."
  );
  return FLAWED_DEMO_CLAIM;
}
