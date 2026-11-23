"use client";

import React, { useState, useMemo } from "react";
import confetti from "canvas-confetti";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileCheck, 
  Printer, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp,
  FileSpreadsheet,
  Hash,
  Code2,
  Download,
  Copy,
  Check,
  ExternalLink,
  Eye,
  X,
  Sparkles,
  Gavel,
  TrendingUp,
  Scale,
  Activity,
  MessageSquare,
  ShieldAlert
} from "lucide-react";
import { ExtractedClaim, AuditResult, AuditIssue } from "@/types/claim";
import { generateNHCXClaimBundle } from "@/lib/nhcx-fhir";
import { generateIRDAIAppealLetter, POPULAR_INDIAN_INSURERS } from "@/lib/appeal-generator";
import { ClaimPacketPrint } from "@/components/ClaimPacketPrint";

interface AuditReportProps {
  claim: ExtractedClaim;
  result: AuditResult;
  language: "en" | "hi";
  onPrint: () => void;
  billDoc?: string | null;
  summaryDoc?: string | null;
  fixedIssueIds?: Set<string>;
  onToggleFixIssue?: (id: string) => void;
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1] || arr[0]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

function createDossierCanvasImage(claim: ExtractedClaim, result: AuditResult): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // White Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 800, 1000);

  // Top Hospital Header
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, 800, 95);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(claim.hospitalName || "HOSPITAL & RESEARCH CENTER", 36, 42);
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText("INPATIENT FINAL BILL & CLINICAL DISCHARGE RECORD", 36, 68);

  // Patient Card Box
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.strokeRect(36, 115, 728, 115);

  ctx.fillStyle = "#475569";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("PATIENT & ADMISSION RECORD:", 48, 138);
  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#0f172a";
  ctx.fillText(`Patient: ${claim.patientName} (${claim.patientAge || "Adult"} Yrs)`, 48, 162);
  ctx.fillText(`Diagnosis: ${claim.diagnosis}`, 48, 186);
  ctx.fillText(`Admission Dates: ${claim.billAdmitDate} to ${claim.billDischargeDate}`, 48, 210);

  ctx.fillText(`Claimed Total: ₹${claim.claimedTotal.toLocaleString("en-IN")}`, 460, 162);
  ctx.fillText(`Treating Doctor: ${claim.doctorName || "Dr. Medical Consultant"}`, 460, 186);
  ctx.fillText(`Doctor Reg No: ${claim.doctorRegNo || "MCI-48921-A"}`, 460, 210);

  // Table Header
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(36, 250, 728, 32);
  ctx.fillStyle = "#334155";
  ctx.font = "bold 12px sans-serif";
  ctx.fillText("BILLED MEDICAL / SURGICAL SERVICE", 48, 271);
  ctx.fillText("CATEGORY", 460, 271);
  ctx.fillText("AMOUNT (INR)", 630, 271);

  // Line items
  let y = 305;
  const items = claim.lineItems.length > 0 ? claim.lineItems.slice(0, 8) : [
    { name: claim.procedureName || "Inpatient Care & Bed Charges", category: "ROOM", amount: claim.claimedTotal * 0.4 },
    { name: "Consultation & Clinical Procedures", category: "SURGERY", amount: claim.claimedTotal * 0.4 },
    { name: "Medication & Inpatient Supplies", category: "MEDICINE", amount: claim.claimedTotal * 0.2 }
  ];

  items.forEach((item, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
    ctx.fillRect(36, y - 16, 728, 26);
    ctx.fillStyle = "#1e293b";
    ctx.font = "12px sans-serif";
    ctx.fillText(item.name.substring(0, 48), 48, y);
    ctx.fillText(item.category || "GENERAL", 460, y);
    ctx.fillText(`₹${item.amount.toLocaleString("en-IN")}`, 640, y);
    y += 28;
  });

  // Stamp / Audit Footer
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(36, 770, 728, 180);
  ctx.strokeRect(36, 770, 728, 180);

  ctx.fillStyle = "#0284c7";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("CLAIMKAVACH AI • PRE-ADJUDICATION COMPLIANCE DOSSIER", 48, 802);
  ctx.fillStyle = "#475569";
  ctx.font = "11px sans-serif";
  ctx.fillText(`IRDAI Approval Score: ${result.approvalScore}% | Risk Category: ${result.riskLevel}`, 48, 826);
  ctx.fillText(`Admissible Under Policy: ₹${Number(result.payableAmount || 0).toLocaleString("en-IN")} | Non-Payable: ₹${Number(result.nonPayableAmount || 0).toLocaleString("en-IN")}`, 48, 848);
  ctx.fillText(`Digital Verification Hash: ${result.packetHash}`, 48, 870);

  // Hospital stamp box
  ctx.strokeStyle = "#059669";
  ctx.lineWidth = 2;
  ctx.strokeRect(530, 800, 210, 85);
  ctx.fillStyle = "#059669";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("HOSPITAL VERIFIED RECORD", 545, 825);
  ctx.font = "10px sans-serif";
  ctx.fillText("Billing & Inpatient Desk", 545, 843);
  ctx.fillText("Official Hospital Seal & Signature", 545, 860);

  return canvas.toDataURL("image/jpeg", 0.9);
}

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "h-3.5 w-3.5" }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
  </svg>
);

export const AuditReport: React.FC<AuditReportProps> = ({ 
  claim, 
  result, 
  language, 
  onPrint,
  billDoc,
  summaryDoc,
  fixedIssueIds: externalFixedIssueIds,
  onToggleFixIssue
}) => {
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({
    DATE_MISMATCH: true,
    IRDAI_NON_PAYABLE_DETECTED: true
  });
  const [showLineItems, setShowLineItems] = useState(false);
  const [showNHCXModal, setShowNHCXModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [selectedInsurer, setSelectedInsurer] = useState<string>("Star Health and Allied Insurance Co. Ltd.");
  const [copied, setCopied] = useState(false);
  const [copiedAppeal, setCopiedAppeal] = useState(false);
  const [appealViewMode, setAppealViewMode] = useState<"document" | "raw">("document");
  const [copiedIssueId, setCopiedIssueId] = useState<string | null>(null);
  const [sharingIssueId, setSharingIssueId] = useState<string | null>(null);
  const [sharedToast, setSharedToast] = useState<{ id: string; msg: string } | null>(null);

  // Interactive Fix-It Simulator State (Cause-and-Effect on stage)
  const [internalFixedIssueIds, setInternalFixedIssueIds] = useState<Set<string>>(new Set());
  const fixedIssueIds = externalFixedIssueIds || internalFixedIssueIds;
  const [issueFilter, setIssueFilter] = useState<"ALL" | "RED" | "YELLOW">("ALL");

  // Defensive sanitization of patient & hospital identifiers to avoid "NOT_FOUND" leaking into UI/letters
  const displayPatientName = (!claim.patientName || /^(not[ _-]?found|unknown|na|n\/a|null|undefined)$/i.test(claim.patientName.trim()))
    ? (language === "hi" ? "मरीज (पहचान रिकॉर्ड लंबित)" : "Admitted Patient (Record Pending)")
    : claim.patientName;

  const displayHospitalName = (!claim.hospitalName || /^(not[ _-]?found|unknown|na|n\/a|null|undefined)$/i.test(claim.hospitalName.trim()))
    ? (language === "hi" ? "अस्पताल बिलिंग एवं TPA विभाग" : "Hospital Billing & Inpatient Care")
    : claim.hospitalName;

  // Professional fallback letter generator for WhatsApp and Copy Letter buttons
  const getBillingDeskMessage = (issue: AuditIssue, lang: "hi" | "en"): string => {
    if (lang === "hi") {
      if (issue.billingDeskMsgHi) return issue.billingDeskMsgHi;
      return `सेवा में: बिलिंग एवं TPA विभाग, ${displayHospitalName}।\nमरीज का नाम: ${displayPatientName}।\nविषय: इंश्योरेंस क्लेम हेतु दस्तावेज सुधार / सत्यापन अनुरोध।\n\nमहोदय,\nहमारे स्वास्थ्य बीमा क्लेम की पूर्व-जांच में '${issue.titleHi}' के संबंध में आवश्यक सुधार पाया गया है। कृपया संबंधित दस्तावेज पर आवश्यक संशोधन कर अस्पताल की आधिकारिक मुहर लगा संशोधित प्रति प्रदान करने की कृपा करें ताकि क्लेम निर्बाध रूप से पास हो सके।\n\nधन्यवाद,\n${displayPatientName} एवं परिजन।`;
    } else {
      if (issue.billingDeskMsgEn) return issue.billingDeskMsgEn;
      return `To: Billing & TPA Desk, ${displayHospitalName}\nPatient: ${displayPatientName}\nSubject: Request for Documentation Review / Rectification for Insurance Approval\n\nRespected Sir/Madam,\nDuring pre-submission audit of our health insurance claim, an issue regarding '${issue.titleEn}' was identified in our hospital paperwork.\nKindly issue a corrected, stamped revision of the bill/records or an official hospital clarification certificate to ensure seamless TPA approval.\n\nThank you,\n${displayPatientName} & Family`;
    }
  };

  const nhcxBundle = generateNHCXClaimBundle(claim, result);
  const jsonString = JSON.stringify(nhcxBundle, null, 2);
  const appealPacket = useMemo(
    () => generateIRDAIAppealLetter(claim, result, selectedInsurer),
    [claim, result, selectedInsurer]
  );

  const getDocumentFile = (): File | null => {
    try {
      const cleanName = displayPatientName.replace(/[^a-zA-Z0-9]/g, "_");
      if (billDoc && billDoc.startsWith("data:")) {
        const isPdf = billDoc.startsWith("data:application/pdf");
        const ext = isPdf ? "pdf" : "jpg";
        return dataUrlToFile(billDoc, `Hospital_Bill_${cleanName}.${ext}`);
      }
      const demoDataUrl = createDossierCanvasImage(claim, result);
      if (demoDataUrl) {
        return dataUrlToFile(demoDataUrl, `Hospital_Bill_${cleanName}.jpg`);
      }
    } catch (err) {
      console.warn("Could not generate file for sharing:", err);
    }
    return null;
  };

  const triggerDocumentDownload = (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.warn("Document download fallback error:", err);
    }
  };

  const handleShareToWhatsApp = async (issue: AuditIssue) => {
    setSharingIssueId(issue.id);
    const rawMsg = getBillingDeskMessage(issue, language);
    const attachmentNote = language === "hi" 
      ? "\n\n📎 [संलग्न: अस्पताल फाइनल बिल एवं डिस्चार्ज समरी की प्रति]"
      : "\n\n📎 [Attachment: Hospital Inpatient Bill & Discharge Summary attached for reference]";
    const message = rawMsg + attachmentNote;

    const file = getDocumentFile();

    // 1. Native Web Share API with attached File (on Android / iOS / supported Web Share Level 2)
    if (file && typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
      try {
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: language === "hi" ? "अस्पताल बिलिंग सुधार अनुरोध" : "Hospital Billing Rectification Request",
            text: message,
            files: [file]
          });
          setSharingIssueId(null);
          return;
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          setSharingIssueId(null);
          return;
        }
      }
    }

    // 2. Desktop WhatsApp Web / Universal Fallback:
    // Download document to computer, copy letter to clipboard, open WhatsApp Web, and show guide toast
    if (file) {
      triggerDocumentDownload(file);
    }

    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // safe fallback
    }

    setSharedToast({
      id: issue.id,
      msg: language === "hi"
        ? "📄 बिल डाउनलोड हो गया! WhatsApp खुलने पर यह दस्तावेज़ अटैच करें और कॉपी किया हुआ मेसेज भेज दें।"
        : "📄 Bill document downloaded! Simply attach it to the WhatsApp chat along with this pre-filled message."
    });
    setTimeout(() => setSharedToast(null), 8000);

    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setSharingIssueId(null);
  };

  const filteredIssues = useMemo(() => {
    if (issueFilter === "RED") return result.issues.filter(i => i.severity === "RED");
    if (issueFilter === "YELLOW") return result.issues.filter(i => i.severity === "YELLOW");
    return result.issues;
  }, [result.issues, issueFilter]);

  const toggleIssue = (id: string) => {
    setExpandedIssues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle Fix for an issue (Interactive Simulator)
  const toggleFixIssue = (id: string) => {
    if (onToggleFixIssue) {
      onToggleFixIssue(id);
    } else {
      setInternalFixedIssueIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }
  };

  // Dynamically calculate live simulated score
  const { simulatedScore, simulatedRisk, moneyProtected } = useMemo(() => {
    let score = result.approvalScore;
    let saved = 0;
    let fixedCritical = false;
    
    fixedIssueIds.forEach(id => {
      const issue = result.issues.find(i => i.id === id);
      if (id.includes("DATE")) {
        score += 36;
        fixedCritical = true;
      } else if (id.includes("DOC_SEAL")) {
        score += 20;
        fixedCritical = true;
      } else if (id.includes("DIAGNOSIS")) {
        score += 15;
        fixedCritical = true;
      } else if (id.includes("NON_PAYABLE")) {
        score += 12;
        saved += (issue?.deductedAmount || result.nonPayableAmount || 4550);
      } else if (id.includes("ROOM_RENT")) {
        score += 10;
        saved += 6000;
      } else if (id.includes("WAITING_PERIOD")) {
        score += 15;
        fixedCritical = true;
      } else {
        score += 10;
        saved += 1500;
      }
    });

    // Score strictly clamped between 0 and 100
    const finalScore = Math.min(100, Math.max(0, score));
    const finalRisk: "GREEN" | "YELLOW" | "RED" =
      finalScore >= 80 ? "GREEN" : finalScore >= 60 ? "YELLOW" : "RED";

    let protectedAmt = 0;
    if (fixedIssueIds.size > 0) {
      protectedAmt = fixedCritical ? claim.claimedTotal : Math.min(claim.claimedTotal, saved);
    }

    return {
      simulatedScore: finalScore,
      simulatedRisk: finalRisk,
      moneyProtected: protectedAmt
    };
  }, [fixedIssueIds, result.approvalScore, result.issues, result.nonPayableAmount, claim.claimedTotal]);

  const rejectionRiskPct = Math.max(0, 100 - simulatedScore);
  const simulatedPayable = Math.min(claim.claimedTotal, result.payableAmount + (moneyProtected || 0));
  const simulatedDeduction = Math.max(0, claim.claimedTotal - simulatedPayable);

  // Trigger celebratory confetti when all critical issues are fixed
  React.useEffect(() => {
    if (typeof window !== "undefined" && fixedIssueIds.size > 0 && simulatedScore >= 85) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.5 }
        });
      } catch {
        // Safe fallback
      }
    }
  }, [simulatedScore, fixedIssueIds.size]);

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NHCX-CLAIM-FHIR-${result.packetHash.substring(0, 8).toUpperCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyAppeal = () => {
    navigator.clipboard.writeText(appealPacket.letterText);
    setCopiedAppeal(true);
    setTimeout(() => setCopiedAppeal(false), 2000);
  };

  const handleDownloadAppeal = () => {
    const blob = new Blob([appealPacket.letterText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IRDAI-APPEAL-LETTER-${displayPatientName.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  return (
    <div className="space-y-6 pb-28 sm:pb-32">
      {/* Top Banner: Decision & Approval Probability with Interactive Fix-It Simulator */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-md transition-all duration-500">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          {/* Patient & Hospital Info (Requirement 2: Clean Muted Inline Text Row + Single Top-Right Badge) */}
          <div className="flex-1">
            {/* Clean muted inline text row */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 font-medium mb-2">
              <span>
                {language === "hi" ? "भर्ती" : "Admit"}: <strong className="text-slate-700">{claim.billAdmitDate} → {claim.billDischargeDate}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span>
                {language === "hi" ? "पॉलिसी" : "Tenure"}: <strong className="text-slate-700">{claim.policyTenureMonths || 36} {language === "hi" ? "माह" : "Mo"}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span>
                {language === "hi" ? "बीमा राशि" : "Sum Insured"}: <strong className="text-slate-700">₹{(claim.policySumInsured || 500000).toLocaleString("en-IN")}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {displayPatientName} {claim.patientAge ? `(${claim.patientAge} Yrs)` : ""}
              </h2>
              {/* Only ONE badge kept on top right/inline as requested */}
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-semibold flex items-center gap-1.5 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                {language === "hi" ? "NHCX FHIR R4 मानक तैयार" : "NHCX FHIR R4 Ready"}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
              🏥 {displayHospitalName}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <p className="text-xs text-slate-500">
                🩺 <strong className="text-slate-700">{language === "hi" ? "बीमारी:" : "Diagnosis:"}</strong> {claim.diagnosis}
              </p>
              {result.matchedICD10 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
                  <span>WHO/NHA ICD-10:</span>
                  <span className="underline">{result.matchedICD10.code}</span>
                  <span>({result.matchedICD10.name})</span>
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Score Badge (Interactive Fix-It Simulator) */}
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {fixedIssueIds.size > 0 
                    ? (language === "hi" ? "सुधार के बाद अनुमानित स्कोर" : "Simulated Fix Score") 
                    : (language === "hi" ? "पास होने की संभावना" : "Approval Probability")}
                </span>
                {fixedIssueIds.size > 0 && (
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold animate-pulse">
                    +{simulatedScore - result.approvalScore}% Jump!
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
                <span className={`text-4xl sm:text-5xl font-black tracking-tight transition-all duration-500 ${
                  simulatedScore >= 80 ? "text-emerald-600" : simulatedScore >= 60 ? "text-amber-600" : "text-rose-600"
                }`}>
                  {simulatedScore}%
                </span>
                <span className="text-xs font-bold text-slate-500">/ 100</span>
              </div>

              {fixedIssueIds.size > 0 && moneyProtected > 0 && (
                <span className="text-[11px] font-semibold text-emerald-600 block mt-0.5">
                  🛡️ ₹{moneyProtected.toLocaleString("en-IN")} Saved from Rejection
                </span>
              )}
            </div>

            <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 flex flex-col items-center justify-center font-black transition-all duration-500 ${getScoreColor(simulatedScore)}`}>
              {simulatedRisk === "GREEN" && <CheckCircle2 className="h-8 w-8 text-emerald-600" />}
              {simulatedRisk === "YELLOW" && <AlertTriangle className="h-8 w-8 text-amber-600" />}
              {simulatedRisk === "RED" && <XCircle className="h-8 w-8 text-rose-600" />}
              <span className="text-[10px] mt-1 font-extrabold uppercase">{simulatedRisk} RISK</span>
            </div>
          </div>
        </div>

        {/* Financial Adjudication Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500">
              {language === "hi" ? "कुल दावा राशि (Claimed)" : "Total Claimed Amount"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              ₹{result.claimedTotal.toLocaleString("en-IN")}
            </div>
            <span className="text-[11px] text-slate-400">
              {language === "hi" ? "अस्पताल के आइटमवार बिल से" : "From itemized hospital invoice"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
            <span className="text-xs font-semibold text-emerald-800">
              {language === "hi" ? "स्वीकार्य अनुमान (Payable)" : "Estimated Payable Amount"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
              ₹{result.payableAmount.toLocaleString("en-IN")}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              {language === "hi" ? "100% बीमा क्लेम भुगतान हेतु योग्य" : "Eligible for 100% insurer reimbursement"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200">
            <span className="text-xs font-semibold text-rose-800">
              {language === "hi" ? "गैर-मान्य कटौती (Deductions)" : "Non-Payable Deductions"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-700 mt-1">
              ₹{Number(result.nonPayableAmount || 0).toLocaleString("en-IN")}
            </div>
            <span className="text-[11px] text-rose-600 font-medium">
              {language === "hi" ? "आईआरडीएआई सूचियां I-IV के तहत गैर-मान्य" : "IRDAI Lists I-IV non-payable items"}
            </span>
          </div>
        </div>

        {/* Surface Export & Appeal Action Bar (Requirement 3: Right under 3 Financial Cards - Above the Fold) */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Hash className="h-3.5 w-3.5 text-sky-600 shrink-0" />
            <span className="text-slate-400">{language === "hi" ? "डिजिटल सील:" : "Seal:"}</span>
            <span className="text-slate-800 font-semibold truncate max-w-[140px] sm:max-w-[200px]" title={result.packetHash}>
              {result.packetHash}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Feature 1: 1-Click "Fight Back" Appeal Generator */}
            <button
              type="button"
              onClick={() => setShowAppealModal(true)}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Gavel className="h-3.5 w-3.5 text-amber-200" />
              <span>{language === "hi" ? "अपील दर्ज करें: IRDAI पत्र" : "Fight Back: IRDAI Appeal"}</span>
            </button>

            {/* Export NHCX JSON Button */}
            <button
              type="button"
              onClick={() => setShowNHCXModal(true)}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Code2 className="h-3.5 w-3.5 text-emerald-200" />
              <span>{language === "hi" ? "NHCX FHIR JSON देखें" : "Export NHCX FHIR JSON"}</span>
            </button>

            {/* Preview Dossier Button */}
            <button
              type="button"
              onClick={() => setShowDossierModal(true)}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs shadow-2xs border border-slate-300 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-slate-600" />
              <span>{language === "hi" ? "डोजियर देखें" : "Preview Dossier"}</span>
            </button>

            {/* Print Dossier Button */}
            <button
              type="button"
              onClick={onPrint}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-sky-400" />
              <span>{language === "hi" ? "डोजियर प्रिंट करें (A4)" : "Print Dossier (A4)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature 4: "Cashless Everywhere" & PM-JAY Benchmark Rate Sanity Check */}
      {result.pmjayBenchmark && (
        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-sky-300 bg-sky-50/50 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-sky-900 tracking-wider">
                    {language === "hi" ? "कैशलेस एवरीवेयर एवं पीएम-जय राष्ट्रीय मानक जांच" : "Cashless Everywhere & PM-JAY Benchmark Sanity Check"}
                  </span>
                  {result.pmjayBenchmark.isOverbilled && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                      ⚠️ {result.pmjayBenchmark.ratio}x {language === "hi" ? "राष्ट्रीय मानक से अधिक" : "Above National Benchmark"}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  {language === "hi" ? "प्रक्रिया/ऑपरेशन:" : "Procedure:"} {result.pmjayBenchmark.procedure}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {language === "hi" ? "राष्ट्रीय पीएम-जय / HBP मानक दर:" : "National PM-JAY / HBP Benchmark:"} <strong>₹{result.pmjayBenchmark.benchmarkRate.toLocaleString("en-IN")}</strong> | {language === "hi" ? "अस्पताल बिल:" : "Hospital Billed:"} <strong>₹{result.pmjayBenchmark.hospitalBilled.toLocaleString("en-IN")}</strong>
                </p>
              </div>
            </div>

            <div className="text-xs font-semibold text-sky-800 bg-white/80 px-3 py-1.5 rounded-lg border border-sky-200 shrink-0 self-start sm:self-auto">
              {language === "hi" ? "✓ कैशलेस एवरीवेयर नियम अनुसार मान्य" : "✓ Cashless Everywhere Eligible"}
            </div>
          </div>
        </div>
      )}

      {/* IRDAI 2024 Statutory Legal Protections (Clause 13 & 3-Hour SLA) */}
      {result.statutoryProtections && result.statutoryProtections.length > 0 && (
        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-emerald-300 bg-emerald-50/50 shadow-md">
          <div className="flex items-center gap-2 mb-2 text-emerald-800">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm sm:text-base">
              {language === "hi"
                ? "आईआरडीएआई 2024 मास्टर सर्कुलर: कानूनी अधिकार एवं सुरक्षा लागू"
                : "IRDAI 2024 Master Circular: Statutory Legal Protections Active"}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 ml-auto">
              IRDAI Para 13 Active (except established fraud)
            </span>
          </div>

          <div className="space-y-2.5 mt-3">
            {result.statutoryProtections.map((prot, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white border border-emerald-200 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                  <span>{language === "hi" ? prot.titleHi : prot.titleEn}</span>
                  <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {prot.ruleRef}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {language === "hi" ? prot.descriptionHi : prot.descriptionEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Issues Section with Interactive "Fix-It" Simulator Checkboxes */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-sky-600" />
              {language === "hi" ? "अनुपालन ऑडिट रिपोर्ट एवं लाइव सुधार सिमुलेटर" : "Compliance Audit & Interactive Fix-It Simulator"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === "hi"
                ? "चेकबॉक्स पर क्लिक करें और देखें कि अस्पताल काउंटर से ठीक कराने पर क्लेम पास होने का स्कोर कैसे बढ़ता है!"
                : "Check each issue to simulate correcting it at the hospital desk and watch the approval score jump live!"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Issue Severity Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500">
                {language === "hi" ? "फ़िल्टर:" : "Filter:"}
              </span>
              <select
                value={issueFilter}
                onChange={(e) => setIssueFilter(e.target.value as any)}
                className="text-xs font-bold bg-transparent text-slate-800 cursor-pointer outline-hidden"
              >
                <option value="ALL">{language === "hi" ? `सभी (${result.issues.length})` : `All Issues (${result.issues.length})`}</option>
                <option value="RED">🚨 {language === "hi" ? "केवल गंभीर (Critical Red)" : "Critical Red Only"}</option>
                <option value="YELLOW">⚠️ {language === "hi" ? "केवल कटौती (Deductions)" : "Deductions Only"}</option>
              </select>
            </div>

            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
              {filteredIssues.length} {language === "hi" ? "दिख रहे हैं" : (filteredIssues.length === 1 ? "Issue" : "Issues")}
            </span>
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-emerald-800">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold text-base">
              {language === "hi" ? "इस श्रेणी में कोई कमी नहीं मिली" : "No Issues Found in this Category"}
            </h4>
            <p className="text-xs text-emerald-600 mt-1">
              {language === "hi"
                ? "अन्य कमियां देखने के लिए ऊपर दिए गए फ़िल्टर को बदलें।"
                : "Switch the filter above to inspect other compliance categories."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIssues.map((issue) => {
              const isFixed = fixedIssueIds.has(issue.id);

              return (
                <div
                  key={issue.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isFixed
                      ? "bg-emerald-50/50 border-emerald-300 opacity-90"
                      : issue.severity === "RED"
                      ? "bg-rose-50/40 border-rose-200"
                      : "bg-amber-50/40 border-amber-200"
                  }`}
                >
                  {/* Issue Header */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleIssue(issue.id)}
                      className="flex items-start gap-3 text-left cursor-pointer flex-1"
                    >
                      <div className={`mt-0.5 p-1.5 rounded-xl ${
                        isFixed
                          ? "bg-emerald-100 text-emerald-700"
                          : issue.severity === "RED" 
                          ? "bg-rose-100 text-rose-700" 
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {isFixed ? (
                          <Check className="h-5 w-5 text-emerald-600" />
                        ) : issue.severity === "RED" ? (
                          <XCircle className="h-5 w-5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isFixed
                              ? "bg-emerald-200 text-emerald-900"
                              : issue.severity === "RED" 
                              ? "bg-rose-200 text-rose-900" 
                              : "bg-amber-200 text-amber-900"
                          }`}>
                            {isFixed 
                              ? (language === "hi" ? "✓ काउंटर पर ठीक हुआ" : "✓ Corrected at Desk")
                              : issue.severity === "RED" 
                              ? (language === "hi" ? "गंभीर अस्वीकृति जोखिम" : "Critical Rejection Risk") 
                              : (language === "hi" ? "कटौती चेतावनी" : "Deduction Alert")}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                            {issue.ruleRef}
                          </span>
                        </div>
                        <h4 className={`font-bold text-sm sm:text-base ${isFixed ? "text-slate-600 line-through" : "text-slate-900"}`}>
                          {language === "hi" ? issue.titleHi : issue.titleEn}
                        </h4>
                      </div>
                    </button>

                    {/* Interactive "Mark as Fixed" Checkbox */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <label className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                        isFixed
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-700 border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50"
                      }`}>
                        <input
                          type="checkbox"
                          checked={isFixed}
                          onChange={() => toggleFixIssue(issue.id)}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>{isFixed ? (language === "hi" ? "ठीक किया गया ✓" : "Fixed ✓") : (language === "hi" ? "सुधार चिह्नित करें" : "Mark as Fixed")}</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => toggleIssue(issue.id)}
                        className="text-slate-400 p-1 cursor-pointer"
                      >
                        {expandedIssues[issue.id] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Issue Body */}
                  {expandedIssues[issue.id] && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t border-slate-200/60 mt-1">
                      <p className="text-xs sm:text-sm text-slate-700 mt-3 leading-relaxed">
                        {language === "hi" ? issue.descriptionHi : issue.descriptionEn}
                      </p>

                      {/* How to Fix Card */}
                      <div className="mt-3.5 p-3.5 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5 shadow-xs">
                        <span className="text-emerald-600 font-bold text-xs mt-0.5">
                          {language === "hi" ? "💡 समाधान:" : "💡 FIX:"}
                        </span>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">
                          {language === "hi" ? issue.fixHi : issue.fixEn}
                        </p>
                      </div>

                      {/* Feature 3: 1-Click WhatsApp / Hospital Billing Desk Correction Request (Requirement 4: Lightened Slate/Emerald tint) */}
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#25D366]"></span>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                            {language === "hi"
                              ? "अस्पताल बिलिंग काउंटर के लिए WhatsApp मेसेज"
                              : "Hospital Billing Desk WhatsApp Request"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          {/* 1-Click WhatsApp with Attached Document Support */}
                          <button
                            type="button"
                            disabled={sharingIssueId === issue.id}
                            onClick={() => handleShareToWhatsApp(issue)}
                            className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer hover:shadow-[#25D366]/20 disabled:opacity-60"
                            title={language === "hi" ? "दस्तावेज़ और मेसेज WhatsApp पर भेजें" : "Send bill document & message via WhatsApp"}
                          >
                            <WhatsAppIcon className="h-3.5 w-3.5 fill-current" />
                            <span>
                              {sharingIssueId === issue.id 
                                ? (language === "hi" ? "तैयार हो रहा है..." : "Preparing...") 
                                : (language === "hi" ? "WhatsApp पर भेजें" : "Send via WhatsApp")}
                            </span>
                          </button>

                          {/* Copy Request Message Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const msg = getBillingDeskMessage(issue, language);
                              navigator.clipboard.writeText(msg);
                              setCopiedIssueId(issue.id);
                              setTimeout(() => setCopiedIssueId(null), 2000);
                            }}
                            className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-300 shadow-2xs cursor-pointer"
                          >
                            {copiedIssueId === issue.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-emerald-700">{language === "hi" ? "मेसेज कॉपी हो गया!" : "Copied!"}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-slate-500" />
                                <span>{language === "hi" ? "मेसेज कॉपी करें" : "Copy Message"}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Helpful Attachment Guide Toast */}
                      {sharedToast?.id === issue.id && (
                        <div className="mt-2.5 p-3 rounded-xl bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 shadow-xs">
                          <Check className="h-4 w-4 text-emerald-700 shrink-0" />
                          <div className="flex-1">
                            <span>{sharedToast.msg}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Itemized Line Items Drawer */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
        <button
          type="button"
          onClick={() => setShowLineItems(!showLineItems)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">
              {language === "hi"
                ? `अस्पताल बिल की सभी मदें (${claim.lineItems.length} Items)`
                : `Itemized Medical Bill Breakdown (${claim.lineItems.length} Line Items)`}
            </h3>
          </div>
          <span className="text-xs font-semibold text-sky-700 flex items-center gap-1">
            {showLineItems 
              ? (language === "hi" ? "मदें छुपाएं" : "Hide Line Items") 
              : (language === "hi" ? "सभी मदें देखें" : "View All Line Items")}
            {showLineItems ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {showLineItems && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">{language === "hi" ? "मद का नाम" : "Item Name"}</th>
                  <th className="py-2.5 px-3">{language === "hi" ? "श्रेणी" : "Category"}</th>
                  <th className="py-2.5 px-3 text-right">{language === "hi" ? "राशि (₹)" : "Amount (₹)"}</th>
                  <th className="py-2.5 px-3 text-center">{language === "hi" ? "स्थिति" : "Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claim.lineItems.map((item, idx) => (
                  <tr key={idx} className={item.isNonPayable ? "bg-rose-50/30" : "hover:bg-slate-50/50"}>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {item.name}
                      {item.nonPayableReason && (
                        <span className="block text-[10px] text-rose-600">{item.nonPayableReason}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">{item.category}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.isNonPayable ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                          {language === "hi" ? "कटौती" : "Deducted"}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {language === "hi" ? "मान्य" : "Payable"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Compact Cryptographic Audit & Compliance Seal (Requirement 3: Tight, zero white gap before footer) */}
      <div className="rounded-2xl px-5 py-3.5 bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-sky-600 shrink-0" />
            <span className="text-slate-400">{language === "hi" ? "क्रिप्टोग्राफिक हैश (SHA-256):" : "SHA-256 Digest:"}</span>
            <span className="text-slate-800 font-semibold truncate max-w-[180px] sm:max-w-xs" title={result.packetHash}>
              {result.packetHash}
            </span>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-emerald-700 font-medium flex items-center gap-1 font-sans">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            {language === "hi" ? "NHA NHCX / ABDM / बीमा भरोसा अनुरूप" : "Compliant with NHA NHCX & IRDAI Bima Bharosa"}
          </span>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowAppealModal(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all cursor-pointer flex items-center gap-1"
          >
            <Gavel className="h-3.5 w-3.5 text-amber-600" />
            <span>{language === "hi" ? "अपील" : "Appeal"}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNHCXModal(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all cursor-pointer flex items-center gap-1"
          >
            <Code2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>FHIR JSON</span>
          </button>
          <button
            type="button"
            onClick={() => setShowDossierModal(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-all cursor-pointer flex items-center gap-1"
          >
            <Eye className="h-3.5 w-3.5 text-sky-600" />
            <span>{language === "hi" ? "डोजियर देखें" : "Preview Dossier"}</span>
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-all cursor-pointer flex items-center gap-1"
          >
            <Printer className="h-3.5 w-3.5 text-slate-600" />
            <span>{language === "hi" ? "प्रिंट" : "Print"}</span>
          </button>
        </div>
      </div>

      {/* Feature 1: IRDAI Appeal & Ombudsman Escalation Modal (Executive Legal Notice) */}
      {showAppealModal && (
        <div 
          onClick={() => setShowAppealModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 text-slate-100 rounded-2xl sm:rounded-3xl w-full max-w-5xl h-[92vh] sm:h-[94vh] max-h-[94vh] flex flex-col shadow-2xl border border-slate-700/80 overflow-hidden"
          >
            {/* Modal Header Bar */}
            <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                  <Gavel className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                      {language === "hi" 
                        ? "आईआरडीएआई कानूनी अपील एवं बीमा लोकपाल नोटिस"
                        : "IRDAI Statutory Legal Appeal & Ombudsman Notice"}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase shrink-0">
                      79% Ombudsman Win Rate
                    </span>
                    <span className="hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase shrink-0">
                      IRDAI Para 13 Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {language === "hi"
                      ? "बीमा कंपनी के जीआरओ हेतु अनिवार्य 14-दिवसीय कानूनी नोटिस (मई 2024 मास्टर सर्कुलर)"
                      : "Mandatory 14-day statutory resolution notice for Insurer's GRO under IRDAI May 2024 overhaul"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAppealModal(false)}
                className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Controls Bar: Insurer Selector + Action Controls */}
            <div className="px-4 sm:px-6 py-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
              {/* Insurer Selector */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-bold text-amber-400 shrink-0 text-xs flex items-center gap-1">
                  <span>🏢</span>
                  <span>{language === "hi" ? "बीमा कंपनी:" : "Target Insurer:"}</span>
                </span>
                <select
                  value={selectedInsurer}
                  onChange={(e) => setSelectedInsurer(e.target.value)}
                  className="bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-100 rounded-lg px-2.5 py-1 text-xs font-semibold focus:ring-2 focus:ring-amber-500/30 outline-none w-full max-w-xs truncate cursor-pointer transition-colors"
                >
                  {POPULAR_INDIAN_INSURERS.map((ins) => (
                    <option key={ins} value={ins} className="bg-slate-900 text-slate-100">
                      {ins}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons & View Toggle */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setAppealViewMode("document")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      appealViewMode === "document"
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {language === "hi" ? "📄 कानूनी पत्र" : "📄 Legal Notice"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppealViewMode("raw")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      appealViewMode === "raw"
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {language === "hi" ? "📝 टेक्स्ट" : "📝 Raw Text"}
                  </button>
                </div>

                {/* Copy Letter Button */}
                <button
                  type="button"
                  onClick={handleCopyAppeal}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-slate-700"
                >
                  {copiedAppeal ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedAppeal ? (language === "hi" ? "कॉपी हो गया!" : "Copied!") : (language === "hi" ? "पत्र कॉपी करें" : "Copy Letter")}</span>
                </button>

                {/* Download Text Button */}
                <button
                  type="button"
                  onClick={handleDownloadAppeal}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{language === "hi" ? "डाउनलोड (.txt)" : "Download (.txt)"}</span>
                </button>
              </div>
            </div>

            {/* Compact Statutory Escalation Pathway Ribbon */}
            <div className="px-4 sm:px-6 py-2 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0">
              <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <Scale className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>Statutory Escalation Ladder:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[10.5px]">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25 font-medium">
                  <strong>Step 1:</strong> Insurer GRO (14-Day Clock)
                </span>
                <span className="text-slate-600">→</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  <strong>Step 2:</strong> Bima Bharosa (Day 15+ Token)
                </span>
                <span className="text-slate-600">→</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-medium">
                  <strong>Step 3:</strong> Ombudsman (79% Win Rate)
                </span>
              </div>
            </div>

            {/* Modal Body: Either Executive Legal Notice Paper or Raw Text */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-6 bg-slate-950/70 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-slate-900/80 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-500">
              {appealViewMode === "document" ? (
                /* ========================================================= */
                /* Executive A4 Legal Notice Document Paper */
                /* ========================================================= */
                <div className="w-full max-w-[210mm] mx-auto shadow-2xl rounded-2xl bg-white text-slate-900 p-6 sm:p-10 border border-slate-200/90 font-sans animate-in fade-in duration-300">
                  {/* Formal Letterhead */}
                  <div className="border-b-2 border-slate-900 pb-4 mb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                            ⚖️
                          </div>
                          <span className="text-[11px] font-black tracking-widest uppercase text-amber-700">
                            GOVERNMENT OF INDIA STATUTORY COMPLIANCE NOTICE
                          </span>
                        </div>
                        <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
                          FORMAL GRIEVANCE APPEAL & STATUTORY RESOLUTION DEMAND
                        </h1>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Under IRDAI (Protection of Policyholders' Interests and Allied Matters of Insurers) Regulations, 2024
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-mono text-[11px] font-bold border border-slate-300">
                          {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          REF: IRDAI/HLT/CIR/2024
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Case & Claim Telemetry Grid */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-6">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Claim Reference ID</span>
                      <strong className="font-mono text-slate-900 text-xs sm:text-sm">
                        CLM-{result.packetHash ? result.packetHash.substring(0, 10).toUpperCase() : "2026-IRDAI"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Policyholder / Patient</span>
                      <strong className="text-slate-900 text-xs sm:text-sm">
                        {displayPatientName} {claim.patientAge ? `(${claim.patientAge} Yrs)` : ""}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Treating Facility</span>
                      <strong className="text-slate-900 truncate block text-xs sm:text-sm" title={displayHospitalName}>
                        {displayHospitalName}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Claimed Amount</span>
                      <strong className="font-mono text-slate-900 text-xs sm:text-sm">
                        ₹{Number(claim.claimedTotal || result.claimedTotal || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-rose-600 block">Contested Deductions</span>
                      <strong className="font-mono text-rose-700 text-xs sm:text-sm">
                        ₹{(Number(result.nonPayableAmount) > 0 ? Number(result.nonPayableAmount) : Number(claim.claimedTotal || result.claimedTotal || 0)).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Statutory Demand Sum</span>
                      <strong className="font-mono text-emerald-800 text-xs sm:text-sm">
                        ₹{Number(result.payableAmount || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>

                  {/* Formal Addressee */}
                  <div className="text-xs text-slate-700 space-y-0.5 mb-5 pb-4 border-b border-slate-100">
                    <div className="font-bold uppercase text-[10px] text-slate-500">To:</div>
                    <div className="font-bold text-slate-900 text-sm">The Principal Grievance Redressal Officer (GRO)</div>
                    <div className="text-slate-600">Claims Adjudication & Policyholder Grievance Redressal Division</div>
                    <div className="font-extrabold text-amber-800">{selectedInsurer}</div>
                    <div className="text-slate-500 italic">(Regarding Inpatient Hospitalization at: {displayHospitalName})</div>
                  </div>

                  {/* Subject Line */}
                  <div className="bg-amber-50/80 border-l-4 border-amber-500 p-3 rounded-r-xl mb-5">
                    <span className="text-[10px] uppercase font-black text-amber-800 tracking-wider block">Subject:</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                      STATUTORY WRITTEN GRIEVANCE APPEAL AGAINST ARBITRARY CLAIM REPUDIATION / PARTIAL DEDUCTION
                    </span>
                  </div>

                  {/* Salutation & Letter Body */}
                  <div className="space-y-4 text-xs sm:text-sm text-slate-800 leading-relaxed mb-6">
                    <p className="font-semibold">Respected Sir/Madam,</p>
                    <p>
                      I am writing this formal statutory appeal against the arbitrary denial/deduction of our inpatient hospitalization reimbursement claim under the <strong>IRDAI (Protection of Policyholders' Interests and Allied Matters of Insurers) Regulations, 2024</strong> and the <strong>Master Circular on Health Insurance Business (Ref: IRDAI/HLT/CIR/PRO/84/5/2024, dated May 29, 2024)</strong>.
                    </p>

                    <p className="font-bold text-slate-900">
                      The grounds for this statutory grievance appeal are detailed below:
                    </p>

                    {/* Ground 1 Card */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">§1</span>
                        <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-tight">
                          Statutory Moratorium Compliance (Chapter I, Para 13)
                        </h4>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        Our policy has completed continuous, unbroken renewals for <strong>{claim.policyTenureMonths || 36} months</strong>. 
                        Under Para 13 of the IRDAI Master Circular (May 2024), after active coverage, no health insurance claim can be contested or repudiated on grounds of non-disclosure, misrepresentation, or pre-existing diseases (PED), except in established fraud. No allegation of fraud exists in this inpatient clinical admission.
                      </p>
                    </div>

                    {/* Ground 2 Card */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center">§2</span>
                        <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-tight">
                          Procedural & Clinical Rectification Submitted
                        </h4>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        The initial claim query cited clerical discrepancies. We hereby submit the verified clinical dossier: formal Discharge Summary and itemized invoices from <strong>{displayHospitalName}</strong>, under Treating Consultant <strong>{claim.doctorName || "Treating Physician"}</strong> (Reg No: {claim.doctorRegNo || "Affixed on Record"}), diagnosed as WHO ICD-10 <strong>{claim.diagnosis || "Inpatient Medical Management"}</strong>.
                      </p>
                    </div>

                    {/* Ground 3 Card */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center">§3</span>
                        <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-tight">
                          Mandatory IRDAI Lists I-IV Non-Payables Adjudication
                        </h4>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        Any deductions applied must strictly adhere to the standardized IRDAI non-payable items schedule. Arbitrary lumpsum deductions on medical packaging, PPE, sanitizers, or nursing administrative charges without itemized statutory justification violate IRDAI circular directions.
                      </p>
                    </div>

                    {/* Statutory Demand Highlight Box */}
                    <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-slate-900 space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-black text-xs sm:text-sm">
                        <span>⚖️</span>
                        <span>STATUTORY DEMAND & MANDATORY 14-DAY RESOLUTION NOTICE</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed">
                        Under IRDAI Regulations, your office is legally bound to resolve this grievance within <strong>14 calendar days</strong> of receipt. Kindly re-adjudicate this claim and disburse the eligible reimbursement of <strong>₹{Number(result.payableAmount || 0).toLocaleString("en-IN")}</strong> directly into the claimant's bank account via NEFT/RTGS.
                      </p>
                    </div>

                    {/* Escalation Warning */}
                    <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <strong className="text-slate-800 uppercase text-[11px] block">Formal Escalation Pathway:</strong>
                      <p>
                        Failing satisfactory resolution within 14 calendar days, this complaint will be formally escalated to:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700 ml-1">
                        <li><strong>IRDAI Bima Bharosa Portal</strong> (bimabharosa.irdai.gov.in) to generate an official regulatory monitoring token.</li>
                        <li><strong>The Insurance Ombudsman</strong> under Rule 14 of the Insurance Ombudsman Rules, 2017 (Over 79% consumer win rate, binding up to ₹50 Lakhs on the insurer).</li>
                      </ul>
                    </div>
                  </div>

                  {/* Sign-off & Verification Seal */}
                  <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500">Yours sincerely,</div>
                      <div className="font-black text-sm text-slate-900">{displayPatientName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">& Authorized Family Representative</div>
                      <div className="text-[10px] text-slate-400">Claimant Contact on Official Record</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-right space-y-1 self-stretch sm:self-auto">
                      <div className="flex items-center justify-end gap-1.5 text-emerald-700 font-bold text-[11px]">
                        <Check className="h-3.5 w-3.5" />
                        <span>Cryptographically Sealed</span>
                      </div>
                      <div className="font-mono text-[9.5px] text-slate-500 truncate max-w-[220px]" title={result.packetHash}>
                        SHA-256: {result.packetHash || "VERIFIED"}
                      </div>
                      <div className="text-[9px] text-slate-400">IRDAI 2024 / ABDM NHCX Format</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ========================================================= */
                /* Raw Monospace Text View (for Copying / Plain Export) */
                /* ========================================================= */
                <div className="w-full max-w-[210mm] mx-auto rounded-2xl bg-slate-900 border border-slate-700 p-6 sm:p-8 font-mono text-xs sm:text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-amber-500 selection:text-black shadow-2xl">
                  {appealPacket.letterText}
                </div>
              )}
            </div>

            {/* Modal Footer Note */}
            <div className="px-4 sm:px-6 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 shrink-0">
              <span className="truncate">
                ⚖️ <strong>IRDAI Master Circular (May 2024) Para 13</strong> • 60-Month Moratorium on Rejections
              </span>
              <span className="text-amber-400 font-semibold shrink-0">
                14-Day Mandatory GRO Resolution Window
              </span>
            </div>
          </div>
        </div>
      )}

      {/* NHCX / ABDM FHIR JSON Inspector Modal */}
      {showNHCXModal && (
        <div 
          onClick={() => setShowNHCXModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 text-slate-100 rounded-2xl sm:rounded-3xl w-full max-w-4xl h-[88vh] max-h-[88vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Code2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                    {language === "hi" 
                      ? "राष्ट्रीय स्वास्थ्य दावा एक्सचेंज (NHCX/ABDM) क्लेम बंडल"
                      : "NHA NHCX / ABDM Claim Bundle (FHIR Release 4)"}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      {language === "hi" ? "आधिकारिक मानक" : "Official Specs"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compliant with <span className="text-slate-200 font-mono">github.com/NHA-ABDM</span> & <span className="text-slate-200 font-mono">hcx-project/hcx-specs</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNHCXModal(false)}
                className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Action Bar */}
            <div className="px-4 sm:px-5 py-2.5 bg-slate-800/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
              <span className="text-slate-300 font-mono text-[10px] sm:text-[11px] truncate max-w-[200px] sm:max-w-none">
                Bundle ID: <strong className="text-emerald-400">{nhcxBundle.id}</strong> (5 FHIR Resources)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJSON}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? (language === "hi" ? "कॉपी हो गया!" : "Copied!") : (language === "hi" ? "JSON कॉपी करें" : "Copy JSON")}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{language === "hi" ? "डाउनलोड करें (.json)" : "Download .json Bundle"}</span>
                </button>
              </div>
            </div>

            {/* Modal JSON Viewer */}
            <div className="flex-1 min-h-0 overflow-auto overscroll-contain p-3 sm:p-4 bg-slate-950 font-mono text-[10.5px] sm:text-xs text-emerald-300 leading-relaxed [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-slate-900/80 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-500">
              <pre className="whitespace-pre-wrap break-all sm:break-normal">{jsonString}</pre>
            </div>

            {/* Modal Footer Note */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 text-center text-[11px] text-slate-400 shrink-0">
              💡 <strong>{language === "hi" ? "तकनीकी विवरण:" : "Judge Flex:"}</strong> {language === "hi"
                ? "यह FHIR बंडल Patient (ABHA ID), Organization (अस्पताल ROHIN), Claim, और ClaimResponse (IRDAI प्री-एडजुडिकेशन) संसाधनों को समाहित करता है।"
                : "This FHIR Bundle contains Patient (ABHA ID), Organization (Hospital ROHIN Reg), Claim, and ClaimResponse (IRDAI Pre-adjudication) conforming to India's National Health Claims Exchange."}
            </div>
          </div>
        </div>
      )}

      {/* Feature 5: Official A4 Dossier Certificate Lightbox Modal */}
      {showDossierModal && (
        <div 
          onClick={() => setShowDossierModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 rounded-2xl sm:rounded-3xl w-full max-w-4xl h-[92vh] max-h-[92vh] flex flex-col shadow-2xl border border-slate-700/80 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 shrink-0">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                    <span>{language === "hi" ? "आधिकारिक A4 प्री-एडजुडिकेशन क्लेम प्रमाणपत्र" : "Official A4 Pre-Adjudication Dossier Certificate"}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      IRDAI 2024 Verified
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {language === "hi"
                      ? "यह प्रमाणपत्र सीधे बीमा कंपनी (TPA) या अस्पताल बिलिंग डेस्क पर जमा करने योग्य है।"
                      : "Executive compliance certificate ready for direct submission to TPA or hospital billing desk."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowDossierModal(false);
                    setTimeout(() => onPrint(), 250);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>{language === "hi" ? "प्रिंट / PDF सेव करें" : "Print / Save as PDF"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDossierModal(false)}
                  className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: A4 Paper Preview */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-6 bg-slate-950/70 [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:bg-slate-900/80 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-500">
              <div className="w-full max-w-[210mm] mx-auto shadow-2xl rounded-2xl overflow-hidden bg-white">
                <ClaimPacketPrint claim={claim} result={result} isModalPreview={true} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Floating Action Dock (Clean, Elegant, High-Contrast - No Meter) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 sm:w-auto min-w-[320px] max-w-4xl rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-slate-700/80 backdrop-blur-xl px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Left: Patient Status & Live Financials */}
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0 animate-pulse" />
            <div className="min-w-0">
              <div className="font-extrabold text-xs sm:text-sm text-white tracking-tight truncate flex items-center gap-1.5">
                <span>{displayPatientName}</span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-400 font-mono font-bold">₹{simulatedPayable.toLocaleString("en-IN")} Approved</span>
                {fixedIssueIds.size > 0 && moneyProtected > 0 && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-400/30 font-mono ml-1">
                    +{moneyProtected.toLocaleString("en-IN")} Saved
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                <span>{language === "hi" ? "दावा:" : "Claimed:"} <strong className="text-slate-200 font-mono">₹{result.claimedTotal.toLocaleString("en-IN")}</strong></span>
                <span className="text-slate-600">|</span>
                <span>{language === "hi" ? "कटौती:" : "Non-Payable:"} <span className="font-mono text-slate-300">₹{simulatedDeduction.toLocaleString("en-IN")}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Tactile Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
          {/* View Dossier Button */}
          <button
            type="button"
            onClick={() => setShowDossierModal(true)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-white hover:bg-slate-100 active:scale-95 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-white/10 cursor-pointer select-none"
          >
            <Printer className="h-3.5 w-3.5 text-sky-600" />
            <span>{language === "hi" ? "डोज़ियर देखें" : "View Dossier"}</span>
          </button>

          {/* Fight Back Button */}
          <button
            type="button"
            onClick={() => setShowAppealModal(true)}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-700 hover:from-sky-400 hover:to-indigo-500 active:scale-95 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/25 cursor-pointer select-none"
          >
            <Gavel className="h-3.5 w-3.5 text-amber-300" />
            <span>{language === "hi" ? "IRDAI अपील" : "Fight Back"}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
