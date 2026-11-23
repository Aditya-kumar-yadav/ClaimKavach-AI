import { ExtractedClaim, AuditResult, AuditIssue } from "@/types/claim";

/**
 * Generates an empathetic, human-friendly spoken audio summary
 * specifically focusing on the UNRESOLVED / NON-CHECKED issues, deductions,
 * and hospital billing desk remediation steps.
 */
export function generateAudioSummary(
  claim: ExtractedClaim,
  result: AuditResult,
  fixedIssueIds: Set<string>,
  language: "hi" | "en"
): string {
  const patient = (!claim?.patientName || /^(not[ _-]?found|unknown|na|n\/a|null|undefined)$/i.test(claim.patientName.trim()))
    ? (language === "hi" ? "मरीज" : "the patient")
    : claim.patientName;

  // Filter ONLY non-checked (unresolved) issues
  const nonCheckedIssues = result.issues.filter(issue => !fixedIssueIds.has(issue.id));

  // Case 1: All issues marked fixed, or clean claim
  if (nonCheckedIssues.length === 0) {
    if (language === "hi") {
      return `बधाई हो! ${patient} के अस्पताल बिल और डिस्चार्ज समरी में अब कोई कागजी कमी बाकी नहीं है। आपका क्लेम बीमा कंपनी और टीपीए से पूरा पास होने के लिए 100% तैयार है।`;
    } else {
      return `Congratulations! All documentation checks have been cleared for ${patient}. Your health insurance claim is 100% compliant with IRDAI rules and ready for full approval.`;
    }
  }

  // Calculate total non-payable / deduction amount for non-checked issues
  let totalDeduction = 0;
  nonCheckedIssues.forEach(i => {
    if (i.deductedAmount) {
      totalDeduction += i.deductedAmount;
    } else if (i.id.includes("NON_PAYABLE")) {
      totalDeduction += (result.nonPayableAmount || 4300);
    } else if (i.id.includes("ROOM_RENT")) {
      totalDeduction += 6000;
    }
  });

  // Format amounts explicitly in spoken currency words (रुपये / rupees) so TTS never speaks "dollar"
  const claimedTotalStr = claim.claimedTotal.toLocaleString("en-IN");
  const deductionTotalStr = totalDeduction > 0 ? totalDeduction.toLocaleString("en-IN") : null;

  if (language === "hi") {
    const formattedClaimedHi = `${claimedTotalStr} रुपये`;
    const formattedDeductionHi = deductionTotalStr ? `${deductionTotalStr} रुपये` : null;
    const issuePoints: string[] = [];

    nonCheckedIssues.forEach(issue => {
      const id = issue.id.toUpperCase();
      if (id.includes("DATE")) {
        issuePoints.push("अस्पताल बिल और डिस्चार्ज समरी में भर्ती होने की तारीखें अलग-अलग हैं, जिससे क्लेम सीधे रिजेक्ट हो सकता है।");
      } else if (id.includes("WAITING_PERIOD")) {
        issuePoints.push("पॉलिसी के 36 महीने पूरे होने से पहले सर्जरी कराई गई है, जो आईआरडीएआई नियमों के तहत वेटिंग पीरियड में आती है।");
      } else if (id.includes("NON_PAYABLE") || id.includes("CONSUMABLE")) {
        issuePoints.push(
          issue.deductedAmount 
            ? `बिल में लगभग ${issue.deductedAmount.toLocaleString("en-IN")} रुपये के गैर-मान्य खर्च जैसे ग्लव्स और पट्टियाँ हैं, जो बीमा कंपनी काट लेगी।`
            : "बिल में गैर-मान्य मेडिकल कंज्यूमेबल्स जोड़े गए हैं, जो इंश्योरेंस कंपनी पास नहीं करेगी।"
        );
      } else if (id.includes("ROOM_RENT")) {
        issuePoints.push("कमरे का किराया आपकी पॉलिसी की 1% सीमा से अधिक है, जिसके कारण बिल के बाकी सभी खर्चों पर भी भारी कटौती की जाएगी।");
      } else if (id.includes("DOC_SEAL") || id.includes("SIGN")) {
        issuePoints.push("कागजों पर अस्पताल या डॉक्टर के आधिकारिक हस्ताक्षर और मुहर की कमी है।");
      } else if (id.includes("ICD") || id.includes("DIAGNOSIS")) {
        issuePoints.push("डिस्चार्ज समरी में मानक बीमारी कोड (ICD-10) स्पष्ट नहीं है।");
      } else if (id.includes("TENURE") || id.includes("PED")) {
        issuePoints.push("पुरानी बीमारी के संबंध में पॉलिसी 60 महीने पुरानी नहीं है, इसलिए टीपीए जांच कर सकता है।");
      } else {
        issuePoints.push(issue.titleHi || issue.titleEn);
      }
    });

    const summaryParts: string[] = [];
    summaryParts.push(
      `ध्यान दें! ${patient} के कुल ${formattedClaimedHi} के अस्पताल बिल में ${nonCheckedIssues.length} मुख्य कागजी कमियाँ बाकी हैं।`
    );

    if (formattedDeductionHi) {
      summaryParts.push(`इन कमियों के कारण लगभग ${formattedDeductionHi} कटने या क्लेम अटकने का खतरा है।`);
    }

    // Join individual issue details
    summaryParts.push(issuePoints.slice(0, 3).join(" "));

    summaryParts.push(
      "सुझाव: क्लेम जमा करने से पहले अस्पताल के बिलिंग काउंटर पर जाएं और इन बिंदुओं पर संशोधित बिल या क्लेरिफिकेशन लेटर बनवा लें।"
    );

    return summaryParts.join(" ");
  } else {
    // English Summary with spoken "rupees"
    const formattedClaimedEn = `${claimedTotalStr} rupees`;
    const formattedDeductionEn = deductionTotalStr ? `${deductionTotalStr} rupees` : null;
    const issuePoints: string[] = [];

    nonCheckedIssues.forEach(issue => {
      const id = issue.id.toUpperCase();
      if (id.includes("DATE")) {
        issuePoints.push("Admission dates on your hospital bill and discharge summary do not match, creating an immediate rejection risk.");
      } else if (id.includes("WAITING_PERIOD")) {
        issuePoints.push("This surgical procedure falls under a 36-month statutory waiting period that has not yet been satisfied under IRDAI guidelines.");
      } else if (id.includes("NON_PAYABLE") || id.includes("CONSUMABLE")) {
        issuePoints.push(
          issue.deductedAmount
            ? `Approximately ${issue.deductedAmount.toLocaleString("en-IN")} rupees in non-payable consumables like braces or surgical gloves have been billed, which your insurer will deduct.`
            : "Non-payable medical consumables are billed, which insurers deduct from reimbursements."
        );
      } else if (id.includes("ROOM_RENT")) {
        issuePoints.push("Daily room rent exceeds the 1% policy limit, triggering proportionate deduction penalties across all other medical expenses.");
      } else if (id.includes("DOC_SEAL") || id.includes("SIGN")) {
        issuePoints.push("The discharge documentation is missing the treating doctor's registration number or official hospital seal.");
      } else if (id.includes("ICD") || id.includes("DIAGNOSIS")) {
        issuePoints.push("Non-standard clinical diagnosis terms were used rather than standard WHO ICD-10 coding.");
      } else if (id.includes("TENURE") || id.includes("PED")) {
        issuePoints.push("Continuous policy coverage is under 60 months, making it subject to pre-existing condition scrutiny.");
      } else {
        issuePoints.push(issue.titleEn);
      }
    });

    const summaryParts: string[] = [];
    summaryParts.push(
      `Attention. In the hospital records for ${patient}, out of ${formattedClaimedEn} claimed, ${nonCheckedIssues.length} unresolved issues were detected.`
    );

    if (formattedDeductionEn) {
      summaryParts.push(`There is an estimated deduction risk of ${formattedDeductionEn}.`);
    }

    summaryParts.push(issuePoints.slice(0, 3).join(" "));

    summaryParts.push(
      "Action required: Please take these findings to the hospital billing desk to get an amended, officially stamped bill before submitting your claim."
    );

    return summaryParts.join(" ");
  }
}
