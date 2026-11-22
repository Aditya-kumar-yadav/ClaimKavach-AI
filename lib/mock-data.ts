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

export const OVERBILLED_PMJAY_CLAIM: ExtractedClaim = {
  patientName: "Priya Sharma",
  patientAge: 32,
  hospitalName: "Apex Super Speciality Hospital, Bengaluru",
  hospitalRegNo: "KA-HOSP-2022-4419",
  doctorName: "Dr. K. S. Venkatesh (MD Medicine)",
  doctorRegNo: "KMC-BLR-88319",
  doctorSigned: true,
  billAdmitDate: "2026-11-05",
  billDischargeDate: "2026-11-09",
  summaryAdmitDate: "2026-11-05",
  summaryDischargeDate: "2026-11-09",
  diagnosis: "Severe Dengue Fever with Thrombocytopenia",
  procedureName: "Dengue Treatment",
  claimedTotal: 45000,
  extractionConfidence: 97,

  policyTenureMonths: 28,
  policySumInsured: 400000,
  roomRentPerDay: 4000,
  roomRentCapPerDay: 4000,
  pedQueryRaised: false,

  lineItems: [
    { name: "Inpatient Bed & General Nursing (4 Days @ ₹4,000/day)", category: "ROOM", amount: 16000, isNonPayable: false },
    { name: "Single Donor Platelet (SDP) Transfusion & ICU Monitoring", category: "MEDICINE", amount: 18500, isNonPayable: false },
    { name: "Pathology CBC, NS1 Antigen & Daily Platelet Count", category: "INVESTIGATION", amount: 4800, isNonPayable: false },
    { name: "Disposable Examination Gloves & Syringes (20 Sets)", category: "CONSUMABLE", amount: 1850, isNonPayable: true, nonPayableReason: "Prohibited under IRDAI List I (Consumables)" },
    { name: "Patient Sanity Thermometer & Welcome Towel Set", category: "CONSUMABLE", amount: 1450, isNonPayable: true, nonPayableReason: "Subsumed into Bed Charges (IRDAI List II)" },
    { name: "Digital Discharge Card & Administrative Printing Fee", category: "OTHER", amount: 1200, isNonPayable: true, nonPayableReason: "Subsumed under IRDAI List IV" }
  ]
};

export const WAITING_PERIOD_CLAIM: ExtractedClaim = {
  patientName: "Rajesh Kumar Gupta",
  patientAge: 56,
  hospitalName: "Fortis Escorts Hospital, Gurugram",
  hospitalRegNo: "HR-HOSP-2021-1044",
  doctorName: "Dr. Sandeep Oberoi (MS Ortho)",
  doctorRegNo: "DMC-DL-51204",
  doctorSigned: true,
  billAdmitDate: "2026-11-08",
  billDischargeDate: "2026-11-12",
  summaryAdmitDate: "2026-11-08",
  summaryDischargeDate: "2026-11-12",
  diagnosis: "Severe Osteoarthritis Grade IV (Bilateral Knee)",
  procedureName: "Total Knee Replacement",
  claimedTotal: 62000,
  extractionConfidence: 99,

  // IRDAI 2024 Rule: Joint Replacement has statutory 36-month waiting period!
  policyTenureMonths: 18, // < 36 months -> Direct statutory rejection risk!
  policySumInsured: 500000,
  roomRentPerDay: 5000,
  roomRentCapPerDay: 5000,
  pedQueryRaised: true,

  lineItems: [
    { name: "Room & Nursing Charges (4 Days @ ₹5,000/day)", category: "ROOM", amount: 20000, isNonPayable: false },
    { name: "Orthopedic Surgical OT Package & Anesthesia", category: "SURGERY", amount: 28000, isNonPayable: false },
    { name: "Post-Operative Physiotherapy & Antibiotics", category: "MEDICINE", amount: 8500, isNonPayable: false },
    { name: "Orthopedic Knee Support Braces & Elastic Crepe Bandages", category: "CONSUMABLE", amount: 2800, isNonPayable: true, nonPayableReason: "Subsumed into Surgical Package (IRDAI List III)" },
    { name: "Hospital Registration & Record Maintenance Fee", category: "OTHER", amount: 1500, isNonPayable: true, nonPayableReason: "Subsumed under IRDAI List IV" }
  ]
};

export const ROOM_RENT_CAPPING_CLAIM: ExtractedClaim = {
  patientName: "Amit Vikram Verma",
  patientAge: 42,
  hospitalName: "Lilavati Hospital & Research Centre, Mumbai",
  hospitalRegNo: "MH-HOSP-2020-7712",
  doctorName: "Dr. Rajeshwar Kulkarni (MCh Urology)",
  doctorRegNo: "MMC-MUM-99120",
  doctorSigned: true,
  billAdmitDate: "2026-11-14",
  billDischargeDate: "2026-11-16",
  summaryAdmitDate: "2026-11-14",
  summaryDischargeDate: "2026-11-16",
  diagnosis: "Obstructive Ureteric Calculus with Hydronephrosis",
  procedureName: "Cystoscopy with URS & Laser Lithotripsy",
  claimedTotal: 52000,
  extractionConfidence: 98,

  policyTenureMonths: 48,
  policySumInsured: 250000,
  // 1% of Sum Insured = ₹2,500/day cap! Actual billed: ₹8,000/day -> Massive Proportionate Cut!
  roomRentPerDay: 8000,
  roomRentCapPerDay: 2500,
  pedQueryRaised: false,

  lineItems: [
    { name: "Deluxe Private Suite Room Rent (2 Days @ ₹8,000/day)", category: "ROOM", amount: 16000, isNonPayable: false },
    { name: "Laser Lithotripsy & URS Endoscopy OT Package", category: "SURGERY", amount: 24000, isNonPayable: false },
    { name: "Pre-Operative CT KUB & Renal Function Tests", category: "INVESTIGATION", amount: 6200, isNonPayable: false },
    { name: "Post-Op Pain Management & IV Fluids", category: "MEDICINE", amount: 3100, isNonPayable: false },
    { name: "Surgical Sterile Drapes & Laser Eye Glasses (Disposable)", category: "CONSUMABLE", amount: 1600, isNonPayable: true, nonPayableReason: "Prohibited under IRDAI List I" },
    { name: "Hospital Medical Record Archiving & Admin Fee", category: "OTHER", amount: 1100, isNonPayable: true, nonPayableReason: "Subsumed under IRDAI List IV" }
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

export interface DemoScenarioItem {
  id: "flawed" | "overbilled" | "waiting" | "roomrent" | "clean";
  name: string;
  patientName: string;
  hospital: string;
  score: number;
  badge: string;
  badgeColor: string;
  claim: ExtractedClaim;
}

export const DEMO_SCENARIO_LIST: DemoScenarioItem[] = [
  {
    id: "flawed",
    name: "1. Date Mismatch & Missing Doctor Seal (28% Rejection)",
    patientName: "Rameshwar Prasad Yadav (₹38,850)",
    hospital: "LifeCare Hospital Delhi",
    score: 28,
    badge: "28% RED",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    claim: FLAWED_DEMO_CLAIM
  },
  {
    id: "overbilled",
    name: "2. PM-JAY 3x Overbilling & Consumables (48% Risk)",
    patientName: "Priya Sharma (₹45,000)",
    hospital: "Apex Super Speciality Bengaluru",
    score: 48,
    badge: "48% YELLOW",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    claim: OVERBILLED_PMJAY_CLAIM
  },
  {
    id: "waiting",
    name: "3. 36-Month Joint Replacement Waiting Period (38% Risk)",
    patientName: "Rajesh Kumar Gupta (₹62,000)",
    hospital: "Fortis Escorts Gurugram",
    score: 38,
    badge: "38% RED",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    claim: WAITING_PERIOD_CLAIM
  },
  {
    id: "roomrent",
    name: "4. Deluxe Room Rent 1% Proportionate Cap (56% Risk)",
    patientName: "Amit Vikram Verma (₹52,000)",
    hospital: "Lilavati Hospital Mumbai",
    score: 56,
    badge: "56% YELLOW",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    claim: ROOM_RENT_CAPPING_CLAIM
  },
  {
    id: "clean",
    name: "5. 100% Validated Pass (60-Mo Moratorium Shield)",
    patientName: "Sunita Devi (₹23,500)",
    hospital: "Metro Heart Hospital Delhi",
    score: 100,
    badge: "100% GREEN",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    claim: CLEAN_DEMO_CLAIM
  }
];
