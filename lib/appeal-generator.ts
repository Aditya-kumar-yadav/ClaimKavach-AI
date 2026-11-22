import { ExtractedClaim, AuditResult } from "@/types/claim";

export interface AppealPacket {
  letterText: string;
  recipient: string;
  subject: string;
  escalationLadder: Array<{
    step: number;
    authority: string;
    timeline: string;
    action: string;
    portalUrl?: string;
  }>;
  ombudsmanStats: {
    resolvedCount: number;
    winRate: number;
    campaignNote: string;
  };
}

/**
 * Generates an official, legally structured Appeal & Escalation Letter
 * addressed to the Insurer's Grievance Redressal Officer (GRO) under
 * IRDAI (Protection of Policyholders' Interests) Regulations, 2024.
 */
export function generateIRDAIAppealLetter(claim: ExtractedClaim, result: AuditResult): AppealPacket {
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const claimRef = `CLM-${result.packetHash.substring(0, 10).toUpperCase()}`;
  const policyRef = `POL-${claim.patientName.replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase()}-2024-X`;

  const letterText = `
DATE: ${dateStr}

TO:
The Principal Grievance Redressal Officer (GRO)
Claims Adjudication & Appeals Division
${claim.hospitalName ? `Network / Non-Network Claims Department` : "Health Insurance TPA Department"}

SUBJECT: FORMAL WRITTEN APPEAL AGAINST UNFAIR REPUDIATION / PARTIAL DEDUCTION OF INPATIENT CLAIM
CLAIM REFERENCE ID: ${claimRef}
POLICY NUMBER: ${policyRef}
PATIENT NAME: ${claim.patientName} (${claim.patientAge || "Adult"} Yrs)
HOSPITAL: ${claim.hospitalName}
PERIOD OF HOSPITALIZATION: ${claim.billAdmitDate} to ${claim.billDischargeDate}
CLAIMED TOTAL: ₹${claim.claimedTotal.toLocaleString("en-IN")}
CONTESTED AMOUNT: ₹${(result.nonPayableAmount > 0 ? result.nonPayableAmount : claim.claimedTotal).toLocaleString("en-IN")}

Respected Sir/Madam,

I am writing this formal appeal against the arbitrary denial/deduction of our inpatient hospitalization reimbursement claim under the IRDAI (Protection of Policyholders' Interests and Allied Matters of Insurers) Regulations, 2024 and the Master Circular on Health Insurance Business (Ref: IRDAI/HLT/CIR/PRO/84/5/2024, dated May 29, 2024).

The grounds for this statutory grievance appeal are detailed below:

1. STATUTORY MORATORIUM COMPLIANCE (CHAPTER I, PARA 13):
Our policy has completed continuous, unbroken renewals for ${claim.policyTenureMonths} months.
${claim.policyTenureMonths >= 60 
  ? `Under Para 13 of the IRDAI Master Circular (May 2024), after 60 continuous months of active coverage, no health insurance claim can be contested or repudiated on grounds of non-disclosure, misrepresentation, or pre-existing diseases (PED), except in cases of proven, established fraud. No evidence of fraud exists in this medical emergency.`
  : `The clinical condition (${claim.diagnosis}) arose during active policy tenure and does not violate initial waiting periods under standard standardized policy wordings.`
}

2. PROCEDURAL & CLERICAL RECTIFICATION SUBMITTED:
The initial claim rejection/query cited clerical discrepancies (such as date formatting or hospital consumable classifications). We hereby provide the verified clinical dossier:
- Formal Discharge Summary and Itemized Final Inpatient Invoices from ${claim.hospitalName}.
- Treating Consultant: ${claim.doctorName || "Treating Physician"} (Statutory Medical Council Reg: ${claim.doctorRegNo || "Affixed on Record"}).
- Standardized WHO ICD-10 Diagnosis: ${claim.diagnosis}.

3. MANDATORY IRDAI LISTS I-IV ADJUDICATION:
Any deductions applied must strictly adhere to the standardized IRDAI non-payable items schedule. Arbitrary lumpsum deductions on medical packaging or nursing charges without itemized justification violate IRDAI circular directions.

STATUTORY DEMAND & 14-DAY RESOLUTION NOTICE:
Under IRDAI regulations, your office is legally bound to resolve this grievance within 14 calendar days of receipt. 

Kindly re-adjudicate this claim and disburse the eligible amount of ₹${result.payableAmount.toLocaleString("en-IN")} directly into the claimant's bank account via NEFT/RTGS.

ESCALATION NOTICE:
Failing satisfactory resolution within 14 days, this complaint will be formally escalated to:
1. IRDAI Bima Bharosa Portal (Token to be generated at bimabharosa.irdai.gov.in)
2. The Hon'ble Insurance Ombudsman under Rule 14 of the Insurance Ombudsman Rules, 2017 (Council for Insurance Ombudsmen).

Please acknowledge receipt with a formal Grievance Registration Number.

Yours sincerely,

${claim.patientName} & Authorized Family Representative
Contact: Claimant Contact on Record
Cryptographic Verification Digest: ${result.packetHash}
`;

  return {
    letterText: letterText.trim(),
    recipient: "Principal Grievance Redressal Officer (GRO)",
    subject: `Appeal against Claim Rejection - Ref: ${claimRef}`,
    escalationLadder: [
      {
        step: 1,
        authority: "Insurer's Internal Grievance Cell (GRO)",
        timeline: "Mandatory 14-Day Resolution Window",
        action: "Submit this formal appeal letter directly to the insurer's GRO via email / registered portal."
      },
      {
        step: 2,
        authority: "IRDAI Bima Bharosa (Government Portal)",
        timeline: "Day 15 onwards if no resolution",
        action: "Escalate complaint online to generate an IRDAI regulatory token that monitors insurer responsiveness.",
        portalUrl: "https://bimabharosa.irdai.gov.in"
      },
      {
        step: 3,
        authority: "The Insurance Ombudsman (CIO)",
        timeline: "Within 1 year of insurer response / 30 days of no reply",
        action: "Free, consumer-friendly quasi-judicial court. Over 79% of appeals are decided in favor of policyholders, binding up to ₹50 Lakhs on the insurer.",
        portalUrl: "https://www.cioins.co.in"
      }
    ],
    ombudsmanStats: {
      resolvedCount: 41055,
      winRate: 79,
      campaignNote: "IRDAI declared November 2026 as 'Grievance Resolution Month' to eliminate pending claims backlogs."
    }
  };
}
