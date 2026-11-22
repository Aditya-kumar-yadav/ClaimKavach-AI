import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractedClaim, ExtractedClaimSchema } from "@/types/claim";
import { FLAWED_DEMO_CLAIM, CLEAN_DEMO_CLAIM } from "./mock-data";

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
    console.warn("No GEMINI_API_KEY detected in .env.local, using production demo preset");
    return FLAWED_DEMO_CLAIM;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
3. Return ONLY raw JSON without markdown code fences.
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

    const response = await model.generateContent(parts);
    const text = response.response.text().trim();
    const cleanedText = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");

    const parsedJson = JSON.parse(cleanedText);
    const validated = ExtractedClaimSchema.parse(parsedJson);
    return validated;
  } catch (error) {
    console.error("Gemini Vision extraction failed, defaulting to verified demo claim:", error);
    return FLAWED_DEMO_CLAIM;
  }
}
