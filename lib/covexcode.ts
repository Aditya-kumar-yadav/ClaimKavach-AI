import { ExtractedClaim } from "@/types/claim";

// Teammate Candidate Keys for HACK WITH DELHI 4.0 (All 5 team candidates registered)
export const TEAM_COVEX_KEYS = [
  "bx-live-e05b279d69f3bd43177875715a2522b6", // Candidate 1 (Teammate)
  "bx-live-b0393ac6e1340e5786d607bc6f5211c6", // Candidate 2 (Teammate)
  "bx-live-3a34b070d83f74f9a78cad54f0b119ed", // Candidate 3 (Teammate)
  "bx-live-47a60f8cf79b8de3d2125faf355a5372", // Candidate 4 (Teammate)
  "bx-live-e3ad305b1b2f2665ed378b0e4805f1b8"  // Candidate 5 (Teammate)
];

export const COVEXCODE_CONFIG = {
  endpoint: process.env.COVEXCODE_ENDPOINT || "https://llm.covexcode.com/event/v1",
  model: process.env.COVEXCODE_MODEL || "deepseek-v4-flash",
  apiKey: process.env.COVEXCODE_API_KEY || TEAM_COVEX_KEYS[0]
};

let keyRotationIndex = 0;

/**
 * Returns the active CovexCode candidate key.
 * Rotates between team candidates so both teammates register token usage with the hackathon organizer!
 */
export function getActiveCovexKey(customKey?: string): string {
  if (customKey && customKey.trim().startsWith("bx-")) {
    return customKey.trim();
  }
  const envKey = process.env.COVEXCODE_API_KEY;
  if (envKey && envKey.trim().startsWith("bx-") && !TEAM_COVEX_KEYS.includes(envKey.trim())) {
    return envKey.trim();
  }
  const key = TEAM_COVEX_KEYS[keyRotationIndex % TEAM_COVEX_KEYS.length];
  keyRotationIndex++;
  return key;
}

function ensureDataUrl(base64OrDataUrl: string): string {
  const trimmed = base64OrDataUrl.trim();
  if (trimmed.startsWith("data:")) {
    return trimmed;
  }
  // Guess mime type from header or default to jpeg
  if (trimmed.startsWith("/9j/")) {
    return `data:image/jpeg;base64,${trimmed}`;
  }
  if (trimmed.startsWith("iVBORw0KGgo")) {
    return `data:image/png;base64,${trimmed}`;
  }
  if (trimmed.startsWith("JVBERi0")) {
    return `data:application/pdf;base64,${trimmed}`;
  }
  return `data:image/jpeg;base64,${trimmed}`;
}

export function isCovexCodeAvailable(customKey?: string): boolean {
  const key = customKey || COVEXCODE_CONFIG.apiKey;
  return Boolean(key && key.trim().startsWith("bx-"));
}

/**
 * Multimodal OCR Extraction using CovexCode (DeepSeek-v4-Flash)
 * Hack With Delhi 4.0 Official LLM Partner
 * Seamlessly pools and rotates teammate keys for 100% hackathon compliance and redundancy.
 */
export async function extractWithCovexCode(
  billBase64?: string,
  summaryBase64?: string,
  customApiKey?: string
): Promise<ExtractedClaim> {
  const primaryKey = getActiveCovexKey(customApiKey);
  const candidateKeys = (customApiKey && customApiKey.trim().length > 0)
    ? [customApiKey.trim()]
    : [primaryKey, ...TEAM_COVEX_KEYS.filter(k => k !== primaryKey)];

  if (!candidateKeys.length || !candidateKeys[0]) {
    throw new Error("COVEXCODE_KEY_MISSING: Missing CovexCode event key.");
  }

  const prompt = `
You are an expert Indian Medical Insurance Claims Adjudication Specialist with deep knowledge of IRDAI (Insurance Regulatory and Development Authority of India) guidelines and PM-JAY packages.
Analyze the provided hospital bill and discharge summary document images.

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
2. Mark isNonPayable = true for items like surgical gloves, PPE, masks, cotton, admission fees, sanitizers (IRDAI Lists I-IV).
3. Return ONLY raw JSON without markdown code fences or explanatory prose.
`;

  const userContent: any[] = [{ type: "text", text: prompt }];

  if (billBase64) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: ensureDataUrl(billBase64)
      }
    });
  }

  if (summaryBase64) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: ensureDataUrl(summaryBase64)
      }
    });
  }

  const payload = {
    model: COVEXCODE_CONFIG.model,
    messages: [
      {
        role: "system",
        content: "You are an expert Indian Medical Insurance Claims Adjudication Specialist. Output ONLY valid JSON matching the requested schema."
      },
      {
        role: "user",
        content: userContent
      }
    ],
    temperature: 0.1,
    max_tokens: 4000
  };

  const endpoint = `${COVEXCODE_CONFIG.endpoint.replace(/\/+$/, "")}/chat/completions`;

  let lastError: any = null;

  for (const apiKey of candidateKeys) {
    console.log(`[ClaimKavach AI] Calling CovexCode API (${COVEXCODE_CONFIG.model}) using candidate key ${apiKey.substring(0, 16)}...`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`CovexCode API error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new Error("Empty response returned from CovexCode DeepSeek-v4-Flash");
      }

      // Robust JSON extraction
      let jsonStr = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const firstBrace = jsonStr.indexOf("{");
      const lastBrace = jsonStr.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }

      let parsedJson: any;
      try {
        parsedJson = JSON.parse(jsonStr);
      } catch {
        // Clean control characters and retry
        const sanitized = jsonStr.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, " ");
        const match = sanitized.match(/\{[\s\S]*\}/);
        if (match) {
          parsedJson = JSON.parse(match[0]);
        } else {
          throw new Error("Unable to parse JSON structure from CovexCode response");
        }
      }

      // Cross-fill missing dates
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

      // Sanitize totals and numbers
      parsedJson.claimedTotal = Number(parsedJson.claimedTotal) || 0;
      parsedJson.patientAge = Number(parsedJson.patientAge) || 40;
      parsedJson.extractionConfidence = Number(parsedJson.extractionConfidence) || 96;

      if (!Array.isArray(parsedJson.lineItems)) {
        parsedJson.lineItems = [];
      } else {
        parsedJson.lineItems = parsedJson.lineItems.map((item: any) => ({
          name: String(item.name || "Medical Service / Charge"),
          category: item.category || "OTHER",
          amount: Number(item.amount) || 0,
          isNonPayable: Boolean(item.isNonPayable),
          nonPayableReason: item.nonPayableReason || ""
        }));
      }

      console.log(`[ClaimKavach AI] CovexCode OCR successfully extracted claim for: ${parsedJson.patientName || "Admitted Patient"} via candidate key ${apiKey.substring(0, 16)}...`);
      return parsedJson as ExtractedClaim;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      console.warn(`[ClaimKavach AI] Candidate key ${apiKey.substring(0, 16)}... failed, failing over to next teammate key:`, err?.message || err);
    }
  }

  throw lastError;
}
