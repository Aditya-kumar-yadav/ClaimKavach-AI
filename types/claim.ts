import { z } from "zod";

export const LineItemSchema = z.object({
  name: z.string().default("Medical Service Charge"),
  category: z.enum(["ROOM", "MEDICINE", "SURGERY", "CONSUMABLE", "INVESTIGATION", "OTHER"]).default("OTHER"),
  amount: z.number().nonnegative().default(0),
  isNonPayable: z.boolean().default(false),
  nonPayableReason: z.string().optional()
});

export type LineItem = z.infer<typeof LineItemSchema>;

export const ExtractedClaimSchema = z.object({
  patientName: z.string().default("Admitted Patient"),
  patientAge: z.number().optional(),
  hospitalName: z.string().default("Hospital & Research Center"),
  hospitalRegNo: z.string().optional().default(""),
  doctorName: z.string().optional().default(""),
  doctorRegNo: z.string().optional().default(""),
  doctorSigned: z.boolean().default(false),
  billAdmitDate: z.string().default("2026-11-12"),
  billDischargeDate: z.string().default("2026-11-15"),
  summaryAdmitDate: z.string().default("2026-11-12"),
  summaryDischargeDate: z.string().default("2026-11-15"),
  diagnosis: z.string().default("Clinical Inpatient Treatment"),
  icd10Code: z.string().optional(),
  icd10Name: z.string().optional(),
  procedureName: z.string().optional(),
  lineItems: z.array(LineItemSchema).default([]),
  claimedTotal: z.number().nonnegative().default(25000),
  extractionConfidence: z.number().min(0).max(100).default(96),
  
  // IRDAI 2024 Master Circular Statutory Policy Fields
  policyTenureMonths: z.number().default(24),
  policySumInsured: z.number().default(500000),
  roomRentPerDay: z.number().optional(),
  roomRentCapPerDay: z.number().optional(),
  pedQueryRaised: z.boolean().default(false)
});

export type ExtractedClaim = z.infer<typeof ExtractedClaimSchema>;

export interface StatutoryProtection {
  ruleRef: string;
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  status: "PROTECTED" | "VIOLATION" | "DEDUCTION";
}

export interface AuditIssue {
  id: string;
  severity: "RED" | "YELLOW";
  ruleRef: string;
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  fixEn: string;
  fixHi: string;
  deductedAmount?: number;
  billingDeskMsgEn?: string;
  billingDeskMsgHi?: string;
}

export interface AuditResult {
  approvalScore: number;
  riskLevel: "GREEN" | "YELLOW" | "RED";
  claimedTotal: number;
  payableAmount: number;
  nonPayableAmount: number;
  issues: AuditIssue[];
  statutoryProtections: StatutoryProtection[];
  matchedICD10?: {
    code: string;
    name: string;
    category: string;
  };
  pmjayBenchmark?: {
    procedure: string;
    benchmarkRate: number;
    hospitalBilled: number;
    ratio: number;
    isOverbilled: boolean;
  };
  passedChecksCount: number;
  totalChecksCount: number;
  packetHash: string;
  evaluatedAt: string;
}
