"use client";

import React from "react";
import { Shield, CheckCircle2, AlertTriangle, Hash, Calendar, Hospital, UserCheck } from "lucide-react";
import { ExtractedClaim, AuditResult } from "@/types/claim";

interface ClaimPacketPrintProps {
  claim: ExtractedClaim;
  result: AuditResult;
}

export const ClaimPacketPrint: React.FC<ClaimPacketPrintProps> = ({ claim, result }) => {
  return (
    <div className="print-only p-8 bg-white text-black font-sans leading-relaxed">
      {/* Dossier Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              ClaimKavach Pre-Adjudication Dossier
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Pre-Flight Compliance Audit Certificate under IRDAI Master Circular & PM-JAY Norms
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">Evaluation Timestamp</span>
          <span className="text-xs font-bold text-slate-900" suppressHydrationWarning>{new Date(result.evaluatedAt).toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Patient & Hospital Metadata Grid */}
      <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-4 mb-6 text-xs">
        <div>
          <p className="text-slate-500">Patient Name & Age:</p>
          <p className="font-bold text-sm text-slate-900">{claim.patientName} ({claim.patientAge || "N/A"} Yrs)</p>
          <p className="text-slate-500 mt-2">Clinical Diagnosis:</p>
          <p className="font-bold text-slate-900">{claim.diagnosis}</p>
          <p className="text-slate-500 mt-2">Procedure / Surgery:</p>
          <p className="font-bold text-slate-900">{claim.procedureName || "Inpatient Medical Management"}</p>
        </div>
        <div>
          <p className="text-slate-500">Treating Healthcare Facility:</p>
          <p className="font-bold text-sm text-slate-900">{claim.hospitalName}</p>
          <p className="text-slate-500 mt-2">Hospital Bill Dates:</p>
          <p className="font-bold text-slate-900">{claim.billAdmitDate} to {claim.billDischargeDate}</p>
          <p className="text-slate-500 mt-2">Discharge Summary Dates:</p>
          <p className={`font-bold ${claim.billAdmitDate !== claim.summaryAdmitDate ? "text-red-700 underline" : "text-slate-900"}`}>
            {claim.summaryAdmitDate} to {claim.summaryDischargeDate}
          </p>
        </div>
      </div>

      {/* Adjudication Summary Box */}
      <div className="border border-slate-300 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-sm uppercase tracking-wide text-slate-900 border-b border-slate-200 pb-2 mb-3">
          Statutory Financial Adjudication
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-2 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Claimed</span>
            <div className="text-lg font-black text-slate-900">₹{result.claimedTotal.toLocaleString("en-IN")}</div>
          </div>
          <div className="p-2 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] text-emerald-700 uppercase font-semibold">Payable Under Policy</span>
            <div className="text-lg font-black text-emerald-800">₹{result.payableAmount.toLocaleString("en-IN")}</div>
          </div>
          <div className="p-2 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] text-rose-700 uppercase font-semibold">Non-Payable Deductions</span>
            <div className="text-lg font-black text-rose-800">₹{result.nonPayableAmount.toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      {/* Audit Findings Table */}
      <div className="mb-6">
        <h3 className="font-bold text-sm uppercase tracking-wide text-slate-900 mb-2">
          Flagged Discrepancies & IRDAI Non-Payables
        </h3>
        {result.issues.length === 0 ? (
          <p className="text-xs text-emerald-800 italic">No statutory discrepancies detected. Recommended for instant straight-through processing.</p>
        ) : (
          <table className="w-full text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold text-left">
                <th className="border border-slate-300 p-2">Severity</th>
                <th className="border border-slate-300 p-2">Rule Reference</th>
                <th className="border border-slate-300 p-2">Finding</th>
                <th className="border border-slate-300 p-2">Required Action</th>
              </tr>
            </thead>
            <tbody>
              {result.issues.map((issue) => (
                <tr key={issue.id} className="align-top">
                  <td className="border border-slate-300 p-2 font-bold">
                    {issue.severity === "RED" ? "[CRITICAL REJECTION]" : "[DEDUCTION]"}
                  </td>
                  <td className="border border-slate-300 p-2 font-mono text-[10px]">{issue.ruleRef}</td>
                  <td className="border border-slate-300 p-2">{issue.titleEn}</td>
                  <td className="border border-slate-300 p-2 font-medium">{issue.fixEn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Cryptographic Seal & Verification */}
      <div className="border-t-2 border-slate-900 pt-4 mt-8 flex justify-between items-center text-[10px]">
        <div>
          <p className="font-mono text-slate-600 font-bold">SHA-256 Verification Hash:</p>
          <p className="font-mono text-slate-900 font-extrabold">{result.packetHash}</p>
        </div>
        <div className="text-right">
          <p className="font-bold uppercase text-slate-900">ClaimKavach Deterministic Engine</p>
          <p className="text-slate-500">Hack with Delhi 4.0 | Track 1</p>
        </div>
      </div>
    </div>
  );
};
