import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractedClaim, ExtractedClaimSchema } from "@/types/claim";
import { 
  FLAWED_DEMO_CLAIM, 
  CLEAN_DEMO_CLAIM, 
  OVERBILLED_PMJAY_CLAIM, 
  WAITING_PERIOD_CLAIM, 
  ROOM_RENT_CAPPING_CLAIM 
} from "./mock-data";

// High-speed, high-quota models tested for Gemini Vision Multimodal Extraction
const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-flash-lite-latest"
];

function parseBase64File(dataUrl: string): { mimeType: string; data: string } {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex !== -1 && dataUrl.startsWith("data:")) {
    const meta = dataUrl.substring(0, commaIndex);
    const mimeMatch = meta.match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1].trim() : "image/jpeg";
    const data = dataUrl.substring(commaIndex + 1).replace(/\s+/g, "");
    return { mimeType, data };
  }
  return {
    mimeType: "image/jpeg",
    data: dataUrl.replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "")
  };
}

export async function extractWithGemini(
  billBase64?: string,
  summaryBase64?: string,
  forcePreset?: string,
  customApiKey?: string
): Promise<ExtractedClaim> {
  // If explicitly requested preset, return verified test dataset
  if (forcePreset === "flawed") return FLAWED_DEMO_CLAIM;
  if (forcePreset === "clean") return CLEAN_DEMO_CLAIM;
  if (forcePreset === "overbilled") return OVERBILLED_PMJAY_CLAIM;
  if (forcePreset === "waiting") return WAITING_PERIOD_CLAIM;
  if (forcePreset === "roomrent") return ROOM_RENT_CAPPING_CLAIM;

  // Determine active API Key (custom key passed from user/judge in UI takes highest precedence)
  const apiKey = (customApiKey && customApiKey.trim().length > 0)
    ? customApiKey.trim()
    : process.env.GEMINI_API_KEY;

  // If no files uploaded at all, return default demo claim
  if (!billBase64 && !summaryBase64) {
    return FLAWED_DEMO_CLAIM;
  }

  // If user uploaded custom documents but no valid API key is present:
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY" || apiKey.length < 15) {
    throw new Error(
      "NO_API_KEY: Please provide a free Google AI Studio Gemini API key via the 'API Key' button in the header to audit custom hospital documents live."
    );
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
    const parsed = parseBase64File(billBase64);
    parts.push({
      inlineData: {
        mimeType: parsed.mimeType,
        data: parsed.data
      }
    });
  }

  if (summaryBase64) {
    const parsed = parseBase64File(summaryBase64);
    parts.push({
      inlineData: {
        mimeType: parsed.mimeType,
        data: parsed.data
      }
    });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`[ClaimKavach AI] Attempting Gemini OCR extraction with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Enforce a 12-second per-model timeout so congested models fail over rapidly
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: ${modelName} took longer than 12s`)), 12000)
      );
      const response = await Promise.race([model.generateContent(parts), timeoutPromise]);
      const text = response.response.text().trim();

      // Robust JSON extraction: look for the first JSON object in text
      let jsonStr = text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsedJson = JSON.parse(jsonStr);

      // If dates are missing between bill and summary, cross-fill them
      if (!parsedJson.summaryAdmitDate && parsedJson.billAdmitDate) {
        parsedJson.summaryAdmitDate = parsedJson.billAdmitDate;
      }
      if (!parsedJson.summaryDischargeDate && parsedJson.billDischargeDate) {
        parsedJson.summaryDischargeDate = parsedJson.billDischargeDate;
      }
      if (!parsedJson.billAdmitDate && parsedJson.summaryAdmitDate) {
        parsedJson.billAdmitDate = parsedJson.summaryAdmitDate;
      }
      if (!parsedJson.billDischargeDate && parsedJson.summaryDischargeDate) {
        parsedJson.billDischargeDate = parsedJson.summaryDischargeDate;
      }

      const validated = ExtractedClaimSchema.parse(parsedJson);
      console.log(`[ClaimKavach AI] OCR extraction successful with ${modelName} for patient: ${validated.patientName}`);
      return validated;
    } catch (err: any) {
      lastError = err;
      console.warn(`[ClaimKavach AI] Model ${modelName} failed or unavailable:`, err?.message || err);
      // If error is an invalid API key, no need to retry other models with the same broken key
      if (err?.message?.includes("API_KEY_INVALID") || err?.message?.includes("API key not valid")) {
        throw new Error("INVALID_API_KEY: The provided Google Gemini API key is invalid or unauthorized.");
      }
    }
  }

  // If all live models failed and user provided an image, surface the error so user can input their free key
  const errMsg = lastError?.message || "Failed to extract claim data from document";
  if (errMsg.includes("Resource has been exhausted") || errMsg.includes("429") || errMsg.includes("Quota")) {
    throw new Error("GEMINI_QUOTA_EXCEEDED: The shared Gemini API quota has been exhausted. Please enter your personal free key via the 'API Key' button in the header.");
  }

  throw new Error(`EXTRACTION_FAILED: ${errMsg}. Please check your API key or document quality.`);
}
