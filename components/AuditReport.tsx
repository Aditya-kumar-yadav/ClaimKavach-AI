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
  X,
  Sparkles,
  Gavel,
  TrendingUp,
  Scale,
  Activity,
  MessageSquare,
  ShieldAlert
} from "lucide-react";
import { ExtractedClaim, AuditResult } from "@/types/claim";
import { generateNHCXClaimBundle } from "@/lib/nhcx-fhir";
import { generateIRDAIAppealLetter } from "@/lib/appeal-generator";

interface AuditReportProps {
  claim: ExtractedClaim;
  result: AuditResult;
  language: "en" | "hi";
  onPrint: () => void;
}

export const AuditReport: React.FC<AuditReportProps> = ({ claim, result, language, onPrint }) => {
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({
    DATE_MISMATCH: true,
    IRDAI_NON_PAYABLE_DETECTED: true
  });
  const [showLineItems, setShowLineItems] = useState(false);
  const [showNHCXModal, setShowNHCXModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedAppeal, setCopiedAppeal] = useState(false);
  const [copiedIssueId, setCopiedIssueId] = useState<string | null>(null);

  // Interactive Fix-It Simulator State (Cause-and-Effect on stage)
  const [fixedIssueIds, setFixedIssueIds] = useState<Set<string>>(new Set());

  const nhcxBundle = generateNHCXClaimBundle(claim, result);
  const jsonString = JSON.stringify(nhcxBundle, null, 2);
  const appealPacket = generateIRDAIAppealLetter(claim, result);

  const toggleIssue = (id: string) => {
    setExpandedIssues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle Fix for an issue (Interactive Simulator)
  const toggleFixIssue = (id: string) => {
    setFixedIssueIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Dynamically calculate live simulated score
  const { simulatedScore, simulatedRisk, moneyProtected } = useMemo(() => {
    let score = result.approvalScore;
    
    fixedIssueIds.forEach(id => {
      if (id.includes("DATE")) score += 35;
      else if (id.includes("DOC_SEAL")) score += 25;
      else if (id.includes("DIAGNOSIS")) score += 30;
      else if (id.includes("NON_PAYABLE")) score += 15;
      else if (id.includes("ROOM_RENT")) score += 15;
      else if (id.includes("WAITING_PERIOD")) score += 30;
      else score += 15;
    });

    const finalScore = Math.min(100, Math.max(12, score));
    const finalRisk: "GREEN" | "YELLOW" | "RED" =
      finalScore >= 80 ? "GREEN" : finalScore >= 60 ? "YELLOW" : "RED";

    const protectedAmt = fixedIssueIds.size > 0 ? claim.claimedTotal : 0;

    return {
      simulatedScore: finalScore,
      simulatedRisk: finalRisk,
      moneyProtected: protectedAmt
    };
  }, [fixedIssueIds, result.approvalScore, claim.claimedTotal]);

  // Trigger celebratory confetti when all critical issues are fixed
  React.useEffect(() => {
    if (fixedIssueIds.size > 0 && simulatedScore >= 85) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5 }
      });
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
    a.download = `IRDAI-APPEAL-LETTER-${claim.patientName.replace(/\s+/g, "_")}.txt`;
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
    <div className="space-y-6">
      {/* Top Banner: Decision & Approval Probability with Interactive Fix-It Simulator */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-md transition-all duration-500">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          {/* Patient & Hospital Info */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                Patient Dossier
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Admit: {claim.billAdmitDate} → Discharge: {claim.billDischargeDate}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                NHCX FHIR R4 Ready
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                Tenure: {claim.policyTenureMonths || 24} Months
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                Sum Insured: ₹{(claim.policySumInsured || 500000).toLocaleString("en-IN")}
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {claim.patientName} {claim.patientAge ? `(${claim.patientAge} Yrs)` : ""}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
              🏥 {claim.hospitalName}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-xs text-slate-500">
                🩺 <strong className="text-slate-700">Diagnosis:</strong> {claim.diagnosis}
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

              {fixedIssueIds.size > 0 && (
                <span className="text-[11px] font-semibold text-emerald-600 block mt-0.5">
                  🛡️ ₹{claim.claimedTotal.toLocaleString("en-IN")} Saved from Rejection
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
            <span className="text-[11px] text-slate-400">From itemized hospital invoice</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
            <span className="text-xs font-semibold text-emerald-800">
              {language === "hi" ? "स्वीकार्य अनुमान (Payable)" : "Estimated Payable Amount"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
              ₹{result.payableAmount.toLocaleString("en-IN")}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Eligible for 100% insurer reimbursement</span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200">
            <span className="text-xs font-semibold text-rose-800">
              {language === "hi" ? "गैर-मान्य कटौती (Deductions)" : "Non-Payable Deductions"}
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-700 mt-1">
              ₹{result.nonPayableAmount.toLocaleString("en-IN")}
            </div>
            <span className="text-[11px] text-rose-600 font-medium">IRDAI Lists I-IV non-payable items</span>
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
                    Cashless Everywhere & PM-JAY Benchmark Sanity Check
                  </span>
                  {result.pmjayBenchmark.isOverbilled && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                      ⚠️ {result.pmjayBenchmark.ratio}x Above National Benchmark
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Procedure: {result.pmjayBenchmark.procedure}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  National PM-JAY / HBP Benchmark: <strong>₹{result.pmjayBenchmark.benchmarkRate.toLocaleString("en-IN")}</strong> | Hospital Billed: <strong>₹{result.pmjayBenchmark.hospitalBilled.toLocaleString("en-IN")}</strong>
                </p>
              </div>
            </div>

            <div className="text-xs font-semibold text-sky-800 bg-white/80 px-3 py-1.5 rounded-lg border border-sky-200 shrink-0 self-start sm:self-auto">
              ✓ Cashless Everywhere Eligible
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

          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold self-start sm:self-auto">
            {result.issues.length} {result.issues.length === 1 ? "Issue Flagged" : "Issues Flagged"}
          </span>
        </div>

        {result.issues.length === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-emerald-800">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-bold text-base">Zero Rejection Risks Detected</h4>
            <p className="text-xs text-emerald-600 mt-1">
              All dates, doctor signatures, and IRDAI package items are 100% compliant.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {result.issues.map((issue) => {
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
                              ? "✓ Corrected at Desk" 
                              : issue.severity === "RED" 
                              ? "Critical Rejection Risk" 
                              : "Deduction Alert"}
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
                        <span>{isFixed ? "Fixed ✓" : "Mark as Fixed"}</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => toggleIssue(issue.id)}
                        className="text-slate-400 p-1"
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
                        <span className="text-emerald-600 font-bold text-xs mt-0.5">💡 FIX:</span>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">
                          {language === "hi" ? issue.fixHi : issue.fixEn}
                        </p>
                      </div>

                      {/* Feature 3: 1-Click WhatsApp / Hospital Billing Desk Correction Request */}
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                            {language === "hi"
                              ? "अस्पताल बिलिंग काउंटर सुधार पत्र (Ready-to-Send)"
                              : "Hospital Billing Desk Fix Message"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                          {/* Exact WhatsApp Message from DhananjayBhosale template */}
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(
                              `नमस्ते, हमारे डिस्चार्ज समरी (${claim.summaryAdmitDate}) और बिल (${claim.billAdmitDate}) में भर्ती की तारीख अलग है और डॉक्टर की मोहर (${claim.doctorRegNo || "NMC Reg No."}) नहीं है। कृपया इसे ठीक करके नया बिल दें ताकि इंश्योरेंस क्लेम पास हो सके। मरीज: ${claim.patientName}।`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <span>WhatsApp to Hospital</span>
                          </a>

                          {/* Copy Request Letter Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const msg =
                                language === "hi"
                                  ? (issue.billingDeskMsgHi || issue.billingDeskMsgEn || "")
                                  : (issue.billingDeskMsgEn || issue.billingDeskMsgHi || "");
                              navigator.clipboard.writeText(msg);
                              setCopiedIssueId(issue.id);
                              setTimeout(() => setCopiedIssueId(null), 2000);
                            }}
                            className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                          >
                            {copiedIssueId === issue.id ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Copied Letter!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy Letter</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
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
            {showLineItems ? "Hide Line Items" : "View All Line Items"}
            {showLineItems ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {showLineItems && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
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
                          Deducted
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Payable
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

      {/* Triple Action Master Bar (NHCX JSON + IRDAI Appeal Generator + Print Dossier) */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-md flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Hash className="h-4 w-4 text-sky-600" />
            <span>SHA-256 Digest:</span>
            <span className="text-slate-800 font-semibold truncate max-w-[200px] sm:max-w-xs">
              {result.packetHash}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Interoperable with <strong>NHA NHCX</strong>, <strong>ABDM HCX FHIR R4</strong> & <strong>IRDAI Bima Bharosa</strong></span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Feature 1: 1-Click "Fight Back" Appeal Generator */}
          <button
            type="button"
            onClick={() => setShowAppealModal(true)}
            className="flex-1 sm:flex-initial px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Gavel className="h-4 w-4 text-amber-200" />
            <span>Fight Back: Generate IRDAI Appeal</span>
          </button>

          {/* Export NHCX JSON Button */}
          <button
            type="button"
            onClick={() => setShowNHCXModal(true)}
            className="flex-1 sm:flex-initial px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Code2 className="h-4 w-4 text-emerald-200" />
            <span>Export NHCX FHIR JSON</span>
          </button>

          {/* Print Dossier Button */}
          <button
            type="button"
            onClick={onPrint}
            className="flex-1 sm:flex-initial px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-sky-400" />
            <span>Print Claim Dossier</span>
          </button>
        </div>
      </div>

      {/* Feature 1: IRDAI Appeal & Ombudsman Escalation Modal */}
      {showAppealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-amber-500/30 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                  <Gavel className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm sm:text-base text-white">
                      IRDAI Formal Appeal & Ombudsman Escalation Dossier
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                      79% Win Rate
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Mandatory 14-day GRO resolution window under IRDAI Regulations (May 2024 overhaul)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAppealModal(false)}
                className="h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Campaign Callout Banner (The Stage Flex) */}
            <div className="px-5 py-3 bg-amber-950/40 border-b border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-200">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  <strong>November 2026:</strong> IRDAI Grievance Resolution Month • <strong>41,055 complaints resolved</strong> in FY26 (79% decided in favor of policyholders).
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAppeal}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedAppeal ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedAppeal ? "Copied!" : "Copy Letter"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAppeal}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .txt</span>
                </button>
              </div>
            </div>

            {/* 3-Step Escalation Pathway Display */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Statutory 3-Step Escalation Ladder
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {appealPacket.escalationLadder.map(step => (
                  <div key={step.step} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
                      <span>Step {step.step}: {step.authority}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      ⏱️ {step.timeline}
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {step.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Formatted Legal Letter Content */}
            <div className="flex-1 overflow-auto p-4 sm:p-5 bg-slate-950 font-mono text-[11px] sm:text-xs text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-amber-500 selection:text-black">
              {appealPacket.letterText}
            </div>

            {/* Modal Footer Note */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 text-center text-[11px] text-slate-400">
              ⚖️ This letter incorporates IRDAI Master Circular (May 2024) Para 13 statutory citations and triggers a mandatory 14-day regulatory timer for the insurer's GRO.
            </div>
          </div>
        </div>
      )}

      {/* NHCX / ABDM FHIR JSON Inspector Modal */}
      {showNHCXModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Code2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                    NHA NHCX / ABDM Claim Bundle (FHIR Release 4)
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      Official Specs
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
            <div className="px-5 py-2.5 bg-slate-800/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-300 font-mono text-[11px]">
                Bundle ID: <strong className="text-emerald-400">{nhcxBundle.id}</strong> (5 FHIR Resources)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJSON}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copied!" : "Copy JSON"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .json Bundle</span>
                </button>
              </div>
            </div>

            {/* Modal JSON Viewer */}
            <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-[11px] sm:text-xs text-emerald-300 leading-relaxed">
              <pre>{jsonString}</pre>
            </div>

            {/* Modal Footer Note */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 text-center text-[11px] text-slate-400">
              💡 <strong>Judge Flex:</strong> This FHIR Bundle contains <code className="text-slate-200">Patient</code> (ABHA ID), <code className="text-slate-200">Organization</code> (Hospital ROHIN Reg), <code className="text-slate-200">Claim</code>, and <code className="text-slate-200">ClaimResponse</code> (IRDAI Pre-adjudication) conforming to India's National Health Claims Exchange.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
