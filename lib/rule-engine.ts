import { ExtractedClaim, AuditResult, AuditIssue, StatutoryProtection } from "@/types/claim";
import policyRules from "./policy-rules.json";
import crypto from "crypto";

export function evaluateClaim(claim: ExtractedClaim): AuditResult {
  const issues: AuditIssue[] = [];
  const statutoryProtections: StatutoryProtection[] = [];
  let scoreDeduction = 0;
  let nonPayableAmount = 0;
  let totalChecksCount = 0;
  let passedChecksCount = 0;

  // =========================================================================
  // 1. Cross-Document Date Integrity Check (CRITICAL RED)
  // =========================================================================
  totalChecksCount++;
  if (
    claim.billAdmitDate !== claim.summaryAdmitDate ||
    claim.billDischargeDate !== claim.summaryDischargeDate
  ) {
    issues.push({
      id: "DATE_MISMATCH",
      severity: "RED",
      ruleRef: "IRDAI-DOC-INTEGRITY-01",
      titleEn: "Admission / Discharge Date Mismatch Across Documents",
      titleHi: "दस्तावेज़ों में भर्ती / डिस्चार्ज की तारीख अलग-अलग है",
      descriptionEn: `Hospital bill states admission as ${claim.billAdmitDate} and discharge as ${claim.billDischargeDate}, but the discharge summary records admission on ${claim.summaryAdmitDate} and discharge on ${claim.summaryDischargeDate}. Insurers flag this discrepancy as potential document tampering or clerical conflict, leading to 100% rejection.`,
      descriptionHi: `अस्पताल के बिल में भर्ती की तारीख ${claim.billAdmitDate} है, जबकि डिस्चार्ज समरी में ${claim.summaryAdmitDate} दर्ज है। बीमा कंपनी इसे डेटा विसंगति मानकर क्लेम तुरंत निरस्त कर देती है।`,
      fixEn: "Request the hospital billing desk to issue an updated, stamped bill or revised discharge summary matching the exact registered dates before submission.",
      fixHi: "अस्पताल के बिलिंग काउंटर से कहें कि वे दोनों कागजों पर एक ही सही तारीख दर्ज करके अस्पताल की मुहर लगाकर दें।"
    });
    scoreDeduction += 35;
  } else {
    passedChecksCount++;
  }

  // =========================================================================
  // 2. Doctor Signature & Registration Integrity Check (RED)
  // =========================================================================
  totalChecksCount++;
  if (!claim.doctorSigned || !claim.doctorRegNo || claim.doctorRegNo.trim() === "") {
    issues.push({
      id: "DOC_SEAL_MISSING",
      severity: "RED",
      ruleRef: "IRDAI-STATUTORY-REG-03",
      titleEn: "Missing Treating Doctor Registration Number or Signature",
      titleHi: "डॉक्टर का रजिस्ट्रेशन नंबर या हस्ताक्षर गायब है",
      descriptionEn: `Treating doctor signature verification flag is false or medical council registration number is missing on the claim documents. IRDAI circular requires verifiable statutory registration (MCI / State Medical Council).`,
      descriptionHi: `डिस्चार्ज पेपर पर इलाज करने वाले डॉक्टर का मेडिकल काउंसिल रजिस्ट्रेशन नंबर या आधिकारिक हस्ताक्षर नहीं है। सरकारी और निजी बीमा नियमों के तहत यह अनिवार्य है।`,
      fixEn: "Ensure treating physician signs the discharge summary and affixes their official seal containing their State Medical Council registration number.",
      fixHi: "इलाज करने वाले डॉक्टर से डिस्चार्ज समरी पर हस्ताक्षर और रजिस्ट्रेशन नंबर वाली आधिकारिक मुहर लगवाएं।"
    });
    scoreDeduction += 25;
  } else {
    passedChecksCount++;
  }

  // =========================================================================
  // 3. Clinical Diagnosis Presence Check (RED)
  // =========================================================================
  totalChecksCount++;
  if (!claim.diagnosis || claim.diagnosis.trim().length < 3) {
    issues.push({
      id: "DIAGNOSIS_MISSING",
      severity: "RED",
      ruleRef: "IRDAI-CLINICAL-01",
      titleEn: "Deficient Clinical Diagnosis or ICD-10 Specification",
      titleHi: "सटीक बीमारी का नाम (Diagnosis) दर्ज नहीं है",
      descriptionEn: "Discharge paperwork lacks a definitive clinical diagnosis or standard diagnostic mapping, preventing claims triage teams from approving medical necessity.",
      descriptionHi: "कागजों में बीमारी का स्पष्ट चिकित्सकीय नाम नहीं लिखा है, जिससे बीमा कंपनी मेडिकल आवश्यकता को खारिज कर सकती है।",
      fixEn: "Ask the hospital to explicitly state primary diagnosis and ICD-10 code in the final summary.",
      fixHi: "अस्पताल से कहें कि वह अंतिम समरी में बीमारी का पूरा चिकित्सकीय नाम स्पष्ट रूप से लिखे।"
    });
    scoreDeduction += 30;
  } else {
    passedChecksCount++;
  }

  // =========================================================================
  // 4. IRDAI 2024 Master Circular: 5-Year (60-Month) Moratorium Clause
  // =========================================================================
  totalChecksCount++;
  const moratoriumMonths = policyRules.irdai_2024_master_circular.moratorium_period_months;
  if (claim.policyTenureMonths >= moratoriumMonths) {
    statutoryProtections.push({
      ruleRef: "IRDAI-2024-MC-CLAUSE-8.1",
      titleEn: "Statutory 60-Month Moratorium Protection Active",
      titleHi: "आईआरडीएआई 2024 5-वर्षीय मोरेटोरियम सुरक्षा लागू",
      descriptionEn: `Policy has been continuously active for ${claim.policyTenureMonths} months (>= 60 months). Under IRDAI 2024 Master Circular Clause 8.1, the insurer is legally prohibited from contesting or denying this claim on grounds of pre-existing disease (PED) or non-disclosure.`,
      descriptionHi: `आपकी पॉलिसी लगातार ${claim.policyTenureMonths} महीनों से सक्रिय है। आईआरडीएआई 2024 नियमों के अनुसार 60 महीने बाद बीमा कंपनी पुरानी बीमारी (PED) का बहाना बनाकर क्लेम रिजेक्ट नहीं कर सकती।`,
      status: "PROTECTED"
    });
    passedChecksCount++;
  } else if (claim.pedQueryRaised) {
    issues.push({
      id: "PED_MORATORIUM_NOT_MET",
      severity: "YELLOW",
      ruleRef: "IRDAI-2024-PED-TENURE",
      titleEn: "Policy Under 60 Months: Pre-Existing Disease Scrutiny Risk",
      titleHi: "पॉलिसी 5 साल पुरानी नहीं है: पुरानी बीमारी की जांच का जोखिम",
      descriptionEn: `Policy tenure is ${claim.policyTenureMonths} months (< 60 months). Insurer has raised a Pre-Existing Disease (PED) query. Ensure full prior prescription and consultation history is attached.`,
      descriptionHi: `पॉलिसी को 60 महीने पूरे नहीं हुए हैं। बीमा कंपनी पुरानी बीमारी का रिकॉर्ड मांग सकती है, अतः पहले के सभी डॉक्टर पर्चे साथ लगाएं।`,
      fixEn: "Attach first-consultation prescription confirming symptom onset occurred after policy inception.",
      fixHi: "पहली जांच का पर्चा साथ लगाएं जिससे साबित हो कि बीमारी पॉलिसी लेने के बाद शुरू हुई थी।"
    });
    scoreDeduction += 15;
  }

  // =========================================================================
  // 5. IRDAI 2024 Specific Waiting Periods Check
  // =========================================================================
  const procedureOrDiagnosis = `${claim.procedureName || ""} ${claim.diagnosis}`.toLowerCase();
  const waitingRules = policyRules.irdai_2024_master_circular.specific_waiting_periods;
  
  for (const [procKey, requiredMonths] of Object.entries(waitingRules)) {
    if (procedureOrDiagnosis.includes(procKey)) {
      totalChecksCount++;
      if (claim.policyTenureMonths < requiredMonths) {
        issues.push({
          id: `WAITING_PERIOD_${procKey.toUpperCase()}`,
          severity: "RED",
          ruleRef: "IRDAI-2024-WAITING-PERIOD",
          titleEn: `Statutory Waiting Period Violation: ${procKey.toUpperCase()} Requires ${requiredMonths} Months`,
          titleHi: `अनिवार्य वेटिंग पीरियड नियम: ${procKey} के लिए ${requiredMonths} महीने की पॉलिसी जरूरी है`,
          descriptionEn: `Under IRDAI 2024 standardized policy wording, ${procKey} is subject to a mandatory ${requiredMonths}-month waiting period. Current continuous tenure is only ${claim.policyTenureMonths} months.`,
          descriptionHi: `आईआरडीएआई नियमों के तहत ${procKey} के इलाज पर ${requiredMonths} महीने का वेटिंग पीरियड होता है, जबकि आपकी पॉलिसी अभी ${claim.policyTenureMonths} महीने पुरानी है।`,
          fixEn: "Verify if this policy was ported from a prior insurer; if ported, submit prior continuity certificates to claim waiting period credit.",
          fixHi: "यदि यह पॉलिसी किसी पुरानी कंपनी से पोर्ट करवाई गई थी, तो पुरानी पॉलिसी का पोर्टेबिलिटी सर्टिफिकेट साथ लगाएं।"
        });
        scoreDeduction += 30;
      } else {
        passedChecksCount++;
      }
      break;
    }
  }

  // =========================================================================
  // 6. IRDAI 2024 Proportional Room Rent Capping Deduction
  // =========================================================================
  const eligibleRoomCap = claim.roomRentCapPerDay || (claim.policySumInsured * 0.01); // 1% of Sum Insured
  if (claim.roomRentPerDay && claim.roomRentPerDay > eligibleRoomCap) {
    totalChecksCount++;
    const excessPerDay = claim.roomRentPerDay - eligibleRoomCap;
    // Calculate 3 days proportional deduction on room rent
    const roomDeduction = excessPerDay * 3;
    nonPayableAmount += roomDeduction;

    issues.push({
      id: "ROOM_RENT_CAPPING_EXCEEDED",
      severity: "YELLOW",
      ruleRef: "IRDAI-2024-ROOM-CAPPING-CLAUSE",
      titleEn: `Proportional Room Rent Capping Deduction: ₹${roomDeduction.toLocaleString("en-IN")}`,
      titleHi: `रूम रेंट कैपिंग कटौती: ₹${roomDeduction.toLocaleString("en-IN")} की आनुपातिक कटौती`,
      descriptionEn: `Your policy caps room rent at 1% of Sum Insured (₹${eligibleRoomCap.toLocaleString("en-IN")}/day), but an executive room of ₹${claim.roomRentPerDay.toLocaleString("en-IN")}/day was selected. Under IRDAI 2024 guidelines, excess room charges and associated doctor fees are deducted proportionally.`,
      descriptionHi: `आपकी पॉलिसी में कमरे का किराया ₹${eligibleRoomCap.toLocaleString("en-IN")}/दिन निर्धारित है, लेकिन अस्पताल में ₹${claim.roomRentPerDay.toLocaleString("en-IN")}/दिन का कमरा लिया गया। आईआरडीएआई नियमों के अनुसार यह अंतर क्लेम से काटा जाएगा।`,
      fixEn: "Be aware of proportional deduction. For future planned admissions, opt for twin-sharing or standard rooms within the 1% cap.",
      fixHi: "इस अंतर राशि का भुगतान स्वयं करना होगा। आगे से अस्पताल में पॉलिसी की सीमा के भीतर वाला कमरा ही चुनें।",
      deductedAmount: roomDeduction
    });
    scoreDeduction += 15;
  }

  // =========================================================================
  // 7. IRDAI Non-Payable Consumables Check (Lists I - IV)
  // =========================================================================
  const list1Regex = new RegExp(policyRules.lists.list1_excluded_items.items.join("|"), "i");
  const list2Regex = new RegExp(policyRules.lists.list2_subsumed_room.items.join("|"), "i");
  const list3Regex = new RegExp(policyRules.lists.list3_subsumed_procedure.items.join("|"), "i");
  const list4Regex = new RegExp(policyRules.lists.list4_subsumed_treatment.items.join("|"), "i");

  const nonPayableItemsFound: { name: string; amount: number; reason: string; ruleRef: string }[] = [];

  for (const item of claim.lineItems) {
    totalChecksCount++;
    const itemName = item.name.toLowerCase();

    let isMatch = false;
    let reasonEn = "";
    let reasonHi = "";
    let ruleRef = "";

    if (list1Regex.test(itemName)) {
      isMatch = true;
      ruleRef = "IRDAI-LIST-I";
      reasonEn = "Excluded Non-Payable Item (Gloves/Masks/Sanitizer/Toiletries under IRDAI Guidelines)";
      reasonHi = "आईआरडीएआई सूची-1 के तहत ग्लव्स, मास्क और सैनिटाइजर के पैसे बीमा में कवर नहीं होते";
    } else if (list2Regex.test(itemName)) {
      isMatch = true;
      ruleRef = "IRDAI-LIST-II";
      reasonEn = "Subsumed into Room Rent (Admission Kit / Housekeeping cannot be billed separately)";
      reasonHi = "रूम रेंट में शामिल खर्च - एडमिशन किट या हाउसकीपिंग का अलग बिल मान्य नहीं है";
    } else if (list3Regex.test(itemName)) {
      isMatch = true;
      ruleRef = "IRDAI-LIST-III";
      reasonEn = "Subsumed into OT / Procedure Package (Gauze / Cotton / Surgical Drapes)";
      reasonHi = "ऑपरेशन पैकेज में शामिल - गॉज, कॉटन और सर्जिकल टेप अलग से देय नहीं हैं";
    } else if (list4Regex.test(itemName)) {
      isMatch = true;
      ruleRef = "IRDAI-LIST-IV";
      reasonEn = "Subsumed into Inpatient Care (Registration fees / Disinfectants included in nursing)";
      reasonHi = "इनपेशेंट केयर में शामिल - रजिस्ट्रेशन चार्ज या डिसइन्फेक्टेंट अलग से देय नहीं हैं";
    }

    if (isMatch || item.isNonPayable) {
      nonPayableAmount += item.amount;
      nonPayableItemsFound.push({
        name: item.name,
        amount: item.amount,
        reason: reasonEn,
        ruleRef
      });
      scoreDeduction += 5;
    } else {
      passedChecksCount++;
    }
  }

  if (nonPayableItemsFound.length > 0) {
    const totalDeducted = nonPayableItemsFound.reduce((acc, curr) => acc + curr.amount, 0);
    const itemNamesList = nonPayableItemsFound.map(i => `${i.name} (₹${i.amount.toLocaleString("en-IN")})`).join(", ");

    issues.push({
      id: "IRDAI_NON_PAYABLE_DETECTED",
      severity: "YELLOW",
      ruleRef: "IRDAI-MASTER-CIRCULAR-CONSUMABLES",
      titleEn: `₹${totalDeducted.toLocaleString("en-IN")} in Non-Payable Consumables Identified`,
      titleHi: `₹${totalDeducted.toLocaleString("en-IN")} के गैर-मान्य (Non-Payable) आइटम बिल में शामिल हैं`,
      descriptionEn: `The bill contains items prohibited under IRDAI Non-Payable Lists I-IV: ${itemNamesList}. Insurers will deduct these amounts before reimbursing.`,
      descriptionHi: `अस्पताल के बिल में ऐसी चीजें शामिल हैं जिनका पैसा बीमा कंपनी नहीं देती: ${itemNamesList}। यह राशि आपके क्लेम से काट ली जाएगी।`,
      fixEn: "Deduct non-payable items from the primary claim request and submit as out-of-pocket, or request an itemized billing revision to avoid adjudicator delay.",
      fixHi: "इन गैर-मान्य खर्चों को अलग करके क्लेम सबमिट करें ताकि बीमा कंपनी इसे लेकर आपत्ति दर्ज न करे।",
      deductedAmount: totalDeducted
    });
  }

  // Calculate final score clamped between 10 and 100
  const approvalScore = Math.max(12, Math.min(100, 100 - scoreDeduction));
  const riskLevel: "GREEN" | "YELLOW" | "RED" =
    approvalScore >= 80 ? "GREEN" : approvalScore >= 60 ? "YELLOW" : "RED";

  const payableAmount = Math.max(0, claim.claimedTotal - nonPayableAmount);

  // Generate SHA-256 Digest for Tamper-Evident Dossier
  const evaluatedAt = new Date().toISOString();
  const rawPayload = JSON.stringify({
    patientName: claim.patientName,
    claimedTotal: claim.claimedTotal,
    payableAmount,
    nonPayableAmount,
    approvalScore,
    riskLevel,
    evaluatedAt
  });
  const packetHash = crypto.createHash("sha256").update(rawPayload).digest("hex");

  return {
    approvalScore,
    riskLevel,
    claimedTotal: claim.claimedTotal,
    payableAmount,
    nonPayableAmount,
    issues,
    statutoryProtections,
    passedChecksCount,
    totalChecksCount,
    packetHash,
    evaluatedAt
  };
}
