import { ExtractedClaim } from "@/types/claim";

export interface CandidateKeyInfo {
  key: string;
  endpoint: string;
  label: string;
  sector: "event" | "web";
}

// -----------------------------------------------------------------------------
// 1. Sector 1: Hackathon Event Keys (20,000,000 tokens each on /event/v1)
// -----------------------------------------------------------------------------
export const EVENT_COVEX_KEYS: CandidateKeyInfo[] = [
  { key: "bx-live-e05b279d69f3bd43177875715a2522b6", endpoint: "https://llm.covexcode.com/event/v1", label: "Candidate 1 (Teammate 3)", sector: "event" },
  { key: "bx-live-b0393ac6e1340e5786d607bc6f5211c6", endpoint: "https://llm.covexcode.com/event/v1", label: "Candidate 2 (Teammate 2)", sector: "event" },
  { key: "bx-live-3a34b070d83f74f9a78cad54f0b119ed", endpoint: "https://llm.covexcode.com/event/v1", label: "Candidate 3 (Teammate 1)", sector: "event" },
  { key: "bx-live-47a60f8cf79b8de3d2125faf355a5372", endpoint: "https://llm.covexcode.com/event/v1", label: "Candidate 4 (Teammate 4)", sector: "event" },
  { key: "bx-live-e3ad305b1b2f2665ed378b0e4805f1b8", endpoint: "https://llm.covexcode.com/event/v1", label: "Candidate 5 (Teammate 5)", sector: "event" }
];

// -----------------------------------------------------------------------------
// 2. Sector 2: Signed-in Web Keys (Dashboard spend meters on /v1)
// -----------------------------------------------------------------------------
export const WEB_COVEX_KEYS: CandidateKeyInfo[] = [
  { key: "bx-live-9ee9d61fb2c6fa7467ea9478b095a73e", endpoint: "https://llm.covexcode.com/v1", label: "Teammate 1 Web", sector: "web" },
  { key: "bx-live-bdf0f7993c7e40edf56f2c03b6f42192", endpoint: "https://llm.covexcode.com/v1", label: "Teammate 2 Web", sector: "web" },
  { key: "bx-live-c5b177b549d4c45847d4cf6f780b480a", endpoint: "https://llm.covexcode.com/v1", label: "Teammate 3 Web", sector: "web" },
  { key: "bx-live-c5a034ef3d61bb0736fcd3778a27b7bb", endpoint: "https://llm.covexcode.com/v1", label: "Lead Web (YRAJ15927)", sector: "web" },
  { key: "bx-live-01709486810d74a901f0192f7542305e", endpoint: "https://llm.covexcode.com/v1", label: "Teammate 5 Web", sector: "web" }
];

// Unified 10-Key Super Pool
export const ALL_COVEX_CANDIDATES: CandidateKeyInfo[] = [
  ...EVENT_COVEX_KEYS,
  ...WEB_COVEX_KEYS
];

export const TEAM_COVEX_KEYS = EVENT_COVEX_KEYS.map(c => c.key);

export const COVEXCODE_CONFIG = {
  endpoint: process.env.COVEXCODE_ENDPOINT || "https://llm.covexcode.com/event/v1",
  model: process.env.COVEXCODE_MODEL || "deepseek-v4-flash",
  apiKey: process.env.COVEXCODE_API_KEY || TEAM_COVEX_KEYS[0]
};

let keyRotationIndex = 0;

/**
 * Automatically maps any key to its corresponding endpoint gateway.
 * Event keys -> /event/v1 (20M tokens meter)
 * Web keys   -> /v1       (Web dashboard spend meter)
 */
export function resolveEndpointForKey(key: string): string {
  const match = ALL_COVEX_CANDIDATES.find(c => c.key.trim() === key.trim());
  if (match) return match.endpoint;
  if (EVENT_COVEX_KEYS.some(c => c.key.trim() === key.trim())) {
    return "https://llm.covexcode.com/event/v1";
  }
  return "https://llm.covexcode.com/v1";
}

/**
 * Returns the next active candidate key across the pool.
 */
export function getActiveCovexKey(customKey?: string): CandidateKeyInfo {
  if (customKey && customKey.trim().startsWith("bx-")) {
    const k = customKey.trim();
    return {
      key: k,
      endpoint: resolveEndpointForKey(k),
      label: "Custom API Key",
      sector: resolveEndpointForKey(k).includes("event") ? "event" : "web"
    };
  }
  const candidate = ALL_COVEX_CANDIDATES[keyRotationIndex % ALL_COVEX_CANDIDATES.length];
  keyRotationIndex++;
  return candidate;
}

function ensureDataUrl(base64OrDataUrl: string): string {
  const trimmed = base64OrDataUrl.trim();
  if (trimmed.startsWith("data:")) {
    return trimmed;
  }
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

// -----------------------------------------------------------------------------
// In-Memory Fast Cache for Instant Repeated Audits (< 5ms response time)
// -----------------------------------------------------------------------------
const ocrCache = new Map<string, { claim: ExtractedClaim; timestamp: number }>();
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes

function createDocHash(doc1?: string, doc2?: string): string {
  const s1 = doc1 ? doc1.substring(0, 120) + doc1.slice(-120) + doc1.length : "";
  const s2 = doc2 ? doc2.substring(0, 120) + doc2.slice(-120) + doc2.length : "";
  return `${s1}:::${s2}`;
}

/**
 * Multimodal OCR Extraction using CovexCode (DeepSeek-v4-Flash)
 * Hack With Delhi 4.0 Official LLM Partner
 * Pools all 10 candidate keys across both sectors for ultra-fast throughput and high reliability.
 */
export async function extractWithCovexCode(
  billBase64?: string,
  summaryBase64?: string,
  customApiKey?: string
): Promise<ExtractedClaim> {
  // Check instant memory cache first
  const cacheKey = createDocHash(billBase64, summaryBase64);
  if (cacheKey && ocrCache.has(cacheKey)) {
    const cached = ocrCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log("[ClaimKavach AI] Instant Cache HIT: Document extracted in < 2ms");
      return cached.claim;
    }
    ocrCache.delete(cacheKey);
  }

  const primaryCandidate = getActiveCovexKey(customApiKey);
  const candidatePool: CandidateKeyInfo[] = (customApiKey && customApiKey.trim().length > 0)
    ? [primaryCandidate]
    : [primaryCandidate, ...ALL_COVEX_CANDIDATES.filter(c => c.key !== primaryCandidate.key)];

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
1. Extract exact admission and discharge dates from BOTH documents.
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
    temperature: 0.05,
    max_tokens: 2200
  };

  let lastError: any = null;

  for (const candidate of candidatePool) {
    const targetEndpoint = `${candidate.endpoint.replace(/\/+$/, "")}/chat/completions`;
    console.log(`[ClaimKavach AI] Calling CovexCode API (${COVEXCODE_CONFIG.model}) via ${candidate.label} (${candidate.key.substring(0, 16)}...) -> ${candidate.endpoint}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // Fast 12s timeout for high-speed responsiveness

    try {
      const res = await fetch(targetEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${candidate.key}`
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

      const finalClaim = parsedJson as ExtractedClaim;

      // Save to memory cache for instant future audits
      if (cacheKey) {
        ocrCache.set(cacheKey, { claim: finalClaim, timestamp: Date.now() });
      }

      console.log(`[ClaimKavach AI] CovexCode OCR successfully extracted claim for: ${finalClaim.patientName || "Admitted Patient"} via ${candidate.label}`);
      return finalClaim;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      console.warn(`[ClaimKavach AI] Candidate ${candidate.label} failed, failing over to next pooled key:`, err?.message || err);
    }
  }

  throw lastError;
}
