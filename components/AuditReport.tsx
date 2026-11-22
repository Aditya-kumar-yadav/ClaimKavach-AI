"use client";

import React, { useState } from "react";
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
  Hash
} from "lucide-react";
import { ExtractedClaim, AuditResult } from "@/types/claim";

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

  const toggleIssue = (id: string) => {
    setExpandedIssues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Decision & Approval Probability */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          {/* Patient & Hospital Info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                Patient Dossier
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Admit: {claim.billAdmitDate} → Discharge: {claim.billDischargeDate}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {claim.patientName} {claim.patientAge ? `(${claim.patientAge} Yrs)` : ""}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
              🏥 {claim.hospitalName}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              🩺 <strong className="text-slate-700">Diagnosis:</strong> {claim.diagnosis}
            </p>
          </div>

          {/* Score Badge */}
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {language === "hi" ? "पास होने की संभावना" : "Approval Probability"}
              </span>
              <div className="flex items-baseline justify-end gap-1.5 mt-0.5">
                <span className={`text-4xl sm:text-5xl font-black tracking-tight ${
                  result.approvalScore >= 80 ? "text-emerald-600" : result.approvalScore >= 60 ? "text-amber-600" : "text-rose-600"
                }`}>
                  {result.approvalScore}%
                </span>
                <span className="text-xs font-bold text-slate-500">/ 100</span>
              </div>
            </div>

            <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 flex flex-col items-center justify-center font-black ${getScoreColor(result.approvalScore)}`}>
              {result.riskLevel === "GREEN" && <CheckCircle2 className="h-8 w-8 text-emerald-600" />}
              {result.riskLevel === "YELLOW" && <AlertTriangle className="h-8 w-8 text-amber-600" />}
              {result.riskLevel === "RED" && <XCircle className="h-8 w-8 text-rose-600" />}
              <span className="text-[10px] mt-1 font-extrabold uppercase">{result.riskLevel} RISK</span>
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

      {/* Audit Issues Section */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sky-600" />
            {language === "hi" ? "अनुपालन ऑडिट रिपोर्ट (Compliance Audit)" : "Pre-Flight Compliance Audit Findings"}
          </h3>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
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
            {result.issues.map((issue) => (
              <div
                key={issue.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  issue.severity === "RED"
                    ? "bg-rose-50/40 border-rose-200"
                    : "bg-amber-50/40 border-amber-200"
                }`}
              >
                {/* Issue Header */}
                <button
                  type="button"
                  onClick={() => toggleIssue(issue.id)}
                  className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-xl ${
                      issue.severity === "RED" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {issue.severity === "RED" ? (
                        <XCircle className="h-5 w-5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          issue.severity === "RED" ? "bg-rose-200 text-rose-900" : "bg-amber-200 text-amber-900"
                        }`}>
                          {issue.severity === "RED" ? "Critical Rejection Risk" : "Deduction Alert"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                          {issue.ruleRef}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900">
                        {language === "hi" ? issue.titleHi : issue.titleEn}
                      </h4>
                    </div>
                  </div>
                  <div className="text-slate-400 mt-1">
                    {expandedIssues[issue.id] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>

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
                  </div>
                )}
              </div>
            ))}
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

      {/* Insurer Submission & Cryptographic Stamp Footer */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Hash className="h-4 w-4 text-sky-600" />
            <span>SHA-256 Digest:</span>
            <span className="text-slate-800 font-semibold truncate max-w-[200px] sm:max-w-xs">
              {result.packetHash}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically sealed and tamper-evident for direct insurance adjudication.
          </p>
        </div>

        <button
          type="button"
          onClick={onPrint}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Printer className="h-4 w-4 text-sky-400" />
          <span>{language === "hi" ? "ऑफिशियल क्लेम डॉसियर प्रिंट करें" : "Print Insurer Claim Dossier"}</span>
        </button>
      </div>
    </div>
  );
};
