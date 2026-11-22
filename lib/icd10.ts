import commonICD10 from "./icd10-common.json";

export interface ICD10Match {
  code: string;
  name: string;
  category: string;
  confidence: "EXACT" | "FUZZY" | "FALLBACK";
}

/**
 * Deterministically maps colloquial clinical diagnoses to standardized ICD-10-CM codes.
 * Conforms to WHO / National Health Authority (NHA) diagnostic standards.
 */
export function lookupICD10(diagnosisText?: string): ICD10Match | null {
  if (!diagnosisText || diagnosisText.trim().length < 3) {
    return null;
  }

  const normalized = diagnosisText.toLowerCase();

  // 1. Direct code search if text already includes an ICD-10 format (e.g. "K35.8")
  const codeMatch = normalized.match(/[a-z][0-9]{2}(\.[0-9]{1,2})?/);
  if (codeMatch) {
    const existing = commonICD10.find(i => i.code.toLowerCase() === codeMatch[0]);
    if (existing) {
      return { code: existing.code, name: existing.name, category: existing.category, confidence: "EXACT" };
    }
  }

  // 2. Keyword & phrase matching against curated Indian hospitalization catalog
  for (const item of commonICD10) {
    for (const kw of item.keywords) {
      if (normalized.includes(kw)) {
        return {
          code: item.code,
          name: item.name,
          category: item.category,
          confidence: "EXACT"
        };
      }
    }
  }

  // 3. Substring matching against the formal name
  for (const item of commonICD10) {
    if (normalized.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(normalized)) {
      return {
        code: item.code,
        name: item.name,
        category: item.category,
        confidence: "FUZZY"
      };
    }
  }

  // Fallback generic inpatient evaluation code
  return {
    code: "Z03.89",
    name: "Encounter for observation for other suspected diseases and conditions",
    category: "General Observation",
    confidence: "FALLBACK"
  };
}
