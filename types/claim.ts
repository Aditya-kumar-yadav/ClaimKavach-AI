import { z } from "zod";

export const LineItemSchema = z.object({
  name: z.string(),
  category: z.enum(["ROOM", "MEDICINE", "SURGERY", "CONSUMABLE", "INVESTIGATION", "OTHER"]),
  amount: z.number().nonnegative(),
  isNonPayable: z.boolean().default(false),
  nonPayableReason: z.string().optional()
});

export type LineItem = z.infer<typeof LineItemSchema>;

export const ExtractedClaimSchema = z.object({
  patientName: z.string(),
  patientAge: z.number().optional(),
  hospitalName: z.string(),
  hospitalRegNo: z.string().optional(),
  doctorName: z.string().optional(),
  doctorRegNo: z.string().optional(),
  doctorSigned: z.boolean(),
  billAdmitDate: z.string(),         // YYYY-MM-DD
  billDischargeDate: z.string(),     // YYYY-MM-DD
  summaryAdmitDate: z.string(),      // YYYY-MM-DD
  summaryDischargeDate: z.string(),  // YYYY-MM-DD
  diagnosis: z.string(),
  procedureName: z.string().optional(),
  lineItems: z.array(LineItemSchema),
  claimedTotal: z.number().positive(),
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
  ruleRef: string; // e.g., "DATE_MISMATCH", "IRDAI-LIST-I", "IRDAI-2024-MORATORIUM"
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  fixEn: string;
  fixHi: string;
  deductedAmount?: number;
}

export interface AuditResult {
  approvalScore: number; // 0 to 100
  riskLevel: "GREEN" | "YELLOW" | "RED";
  claimedTotal: number;
  payableAmount: number;
  nonPayableAmount: number;
  issues: AuditIssue[];
  statutoryProtections: StatutoryProtection[];
  passedChecksCount: number;
  totalChecksCount: number;
  packetHash: string; // SHA-256 Digest
  evaluatedAt: string; // ISO Timestamp
}
