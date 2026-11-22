import { ExtractedClaim } from "@/types/claim";

export const FLAWED_DEMO_CLAIM: ExtractedClaim = {
  patientName: "Rameshwar Prasad Yadav",
  patientAge: 48,
  hospitalName: "LifeCare Multispeciality & Research Center, New Delhi",
  hospitalRegNo: "DL-HOSP-2023-8894",
  doctorName: "Dr. A. K. Sharma (General Surgeon)",
  doctorRegNo: "", // Missing Reg No -> Red Flag
  doctorSigned: false, // Missing Signature -> Red Flag
  billAdmitDate: "2026-11-12",
  billDischargeDate: "2026-11-15",
  summaryAdmitDate: "2026-11-13", // Mismatched Date! (12 vs 13) -> Critical Red Flag
  summaryDischargeDate: "2026-11-15",
  diagnosis: "Acute Appendicitis with Localized Peritonitis",
  procedureName: "Laparoscopic Appendectomy",
  claimedTotal: 34850,
  extractionConfidence: 98,
  lineItems: [
    { name: "Hospital Bed & Nursing Charges (3 Days)", category: "ROOM", amount: 9000, isNonPayable: false },
    { name: "Laparoscopic Appendectomy Surgical Package", category: "SURGERY", amount: 16500, isNonPayable: false },
    { name: "IV Fluids, Antibiotics & Post-Op Medications", category: "MEDICINE", amount: 4800, isNonPayable: false },
    { name: "Surgical Gloves & Latex Exam Gloves (8 Pairs)", category: "CONSUMABLE", amount: 1200, isNonPayable: true, nonPayableReason: "Prohibited under IRDAI List I (Consumables)" },
    { name: "N95 Surgical Masks & PPE Care Kit", category: "CONSUMABLE", amount: 850, isNonPayable: true, nonPayableReason: "Prohibited under IRDAI List I" },
    { name: "Admission Patient Hygiene & Welcome Kit", category: "CONSUMABLE", amount: 650, isNonPayable: true, nonPayableReason: "Subsumed into Room Rent (IRDAI List II)" },
    { name: "Surgical Gauze, Dressing Cotton & Micropore Tape", category: "CONSUMABLE", amount: 950, isNonPayable: true, nonPayableReason: "Subsumed into Procedure Package (IRDAI List III)" },
    { name: "Hospital File Registration & Documentation Charges", category: "OTHER", amount: 900, isNonPayable: true, nonPayableReason: "Subsumed into Treatment Charges (IRDAI List IV)" }
  ]
};

export const CLEAN_DEMO_CLAIM: ExtractedClaim = {
  patientName: "Sunita Devi",
  patientAge: 39,
  hospitalName: "Metro Heart & General Hospital, Rohini, Delhi",
  hospitalRegNo: "DL-HOSP-2021-4412",
  doctorName: "Dr. Meenakshi Sundaram (MS, MCh)",
  doctorRegNo: "MCI-DL-49201",
  doctorSigned: true,
  billAdmitDate: "2026-11-10",
  billDischargeDate: "2026-11-12",
  summaryAdmitDate: "2026-11-10",
  summaryDischargeDate: "2026-11-12",
  diagnosis: "Unilateral Inguinal Hernia",
  procedureName: "Open Hernioplasty with Mesh",
  claimedTotal: 23500,
  extractionConfidence: 99,
  lineItems: [
    { name: "Inpatient Room Rent (Semi-Private 2 Days)", category: "ROOM", amount: 6000, isNonPayable: false },
    { name: "Hernioplasty Procedure & OT Charges", category: "SURGERY", amount: 13500, isNonPayable: false },
    { name: "Anesthesia & Inpatient Medicines", category: "MEDICINE", amount: 4000, isNonPayable: false }
  ]
};
