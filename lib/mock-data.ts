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
  diagnosis: "Acute Appendicitis with Complicated Inguinal Hernia",
  procedureName: "Laparoscopic Appendectomy & Inguinal Hernia Repair",
  claimedTotal: 38850,
  extractionConfidence: 98,

  // IRDAI 2024 Statutory Policy Parameters
  policyTenureMonths: 14, // < 24 months -> Triggers Statutory Hernia Waiting Period Violation!
  policySumInsured: 300000,
  roomRentPerDay: 5000, // Actual ₹5,000 vs Eligible 1% Cap ₹3,000 -> Triggers Room Rent Deduction!
  roomRentCapPerDay: 3000,
  pedQueryRaised: true, // Triggers PED query warning (< 60 months)

  lineItems: [
    { name: "Hospital Bed & Nursing Charges (3 Days @ ₹5,000/day)", category: "ROOM", amount: 15000, isNonPayable: false },
    { name: "Laparoscopic Appendectomy & Hernia OT Package", category: "SURGERY", amount: 14500, isNonPayable: false },
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
  diagnosis: "Acute Calculus Cholecystitis",
  procedureName: "Laparoscopic Cholecystectomy",
  claimedTotal: 23500,
  extractionConfidence: 99,

  // IRDAI 2024 Statutory Policy Parameters
  policyTenureMonths: 68, // > 60 months -> Activates 5-Year Moratorium Legal Protection!
  policySumInsured: 500000,
  roomRentPerDay: 3000, // Within 1% Cap (₹5,000) -> 0 Deductions!
  roomRentCapPerDay: 5000,
  pedQueryRaised: false,

  lineItems: [
    { name: "Inpatient Room Rent (Semi-Private 2 Days @ ₹3,000/day)", category: "ROOM", amount: 6000, isNonPayable: false },
    { name: "Laparoscopic Cholecystectomy OT & Surgeon Charges", category: "SURGERY", amount: 13500, isNonPayable: false },
    { name: "Anesthesia & Inpatient Medicines", category: "MEDICINE", amount: 4000, isNonPayable: false }
  ]
};
