"use client";

import React from "react";
import { ExtractedClaim, AuditResult } from "@/types/claim";

interface ClaimPacketPrintProps {
  claim: ExtractedClaim;
  result: AuditResult;
}

export const ClaimPacketPrint: React.FC<ClaimPacketPrintProps> = ({ claim, result }) => {
  return (
    <div className="print-only p-4 sm:p-6 bg-white text-black font-sans leading-tight text-[11px] max-w-[210mm] mx-auto">
      {/* Dossier Header */}
      <div className="border-b-2 border-slate-900 pb-2.5 mb-3 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
            ClaimKavach Pre-Adjudication Dossier
          </h1>
          <p className="text-[10px] text-slate-600 mt-0.5">
            Pre-Flight Compliance Audit Certificate under IRDAI Master Circular (May 2024) & PM-JAY Norms
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[9px] font-mono text-slate-500 uppercase block">Evaluation Timestamp</span>
          <span className="text-[10px] font-bold text-slate-900" suppressHydrationWarning>
            {new Date(result.evaluatedAt).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Patient & Hospital Metadata Grid */}
      <div className="grid grid-cols-2 gap-3 border border-slate-300 rounded-lg p-3 mb-3 text-[10.5px]">
        <div>
          <p className="text-slate-500 text-[10px]">Patient Name & Age:</p>
          <p className="font-bold text-xs text-slate-900">{claim.patientName} ({claim.patientAge || "N/A"} Yrs)</p>
          <p className="text-slate-500 text-[10px] mt-1.5">Clinical Diagnosis:</p>
          <p className="font-bold text-slate-900">{claim.diagnosis}</p>
          <p className="text-slate-500 text-[10px] mt-1.5">Procedure / Surgery:</p>
          <p className="font-bold text-slate-900">{claim.procedureName || "Inpatient Medical Management"}</p>
        </div>
        <div>
          <p className="text-slate-500 text-[10px]">Treating Healthcare Facility:</p>
          <p className="font-bold text-xs text-slate-900">{claim.hospitalName}</p>
          <p className="text-slate-500 text-[10px] mt-1.5">Hospital Bill Dates:</p>
          <p className="font-bold text-slate-900">{claim.billAdmitDate} to {claim.billDischargeDate}</p>
          <p className="text-slate-500 text-[10px] mt-1.5">Discharge Summary Dates:</p>
          <p className={`font-bold ${claim.billAdmitDate !== claim.summaryAdmitDate ? "text-red-700 underline" : "text-slate-900"}`}>
            {claim.summaryAdmitDate} to {claim.summaryDischargeDate}
          </p>
        </div>
      </div>

      {/* Adjudication Summary Box */}
      <div className="border border-slate-300 rounded-lg p-2.5 mb-3">
        <h3 className="font-bold text-[11px] uppercase tracking-wide text-slate-900 border-b border-slate-200 pb-1 mb-2 flex items-center justify-between">
          <span>Statutory Financial Adjudication</span>
          <span className="text-[10px] font-mono text-slate-600">
            Approval Probability: <strong>{result.approvalScore}% ({result.riskLevel} Risk)</strong>
          </span>
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
            <span className="text-[9px] text-slate-500 uppercase font-semibold block">Total Claimed</span>
            <div className="text-base font-black text-slate-900">₹{result.claimedTotal.toLocaleString("en-IN")}</div>
          </div>
          <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
            <span className="text-[9px] text-emerald-700 uppercase font-semibold block">Payable Under Policy</span>
            <div className="text-base font-black text-emerald-800">₹{result.payableAmount.toLocaleString("en-IN")}</div>
          </div>
          <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
            <span className="text-[9px] text-rose-700 uppercase font-semibold block">Non-Payable Deductions</span>
            <div className="text-base font-black text-rose-800">₹{result.nonPayableAmount.toLocaleString("en-IN")}</div>
          </div>
        </div>
      </div>

      {/* Audit Findings Table */}
      <div className="mb-3">
        <h3 className="font-bold text-[11px] uppercase tracking-wide text-slate-900 mb-1.5">
          Flagged Discrepancies & IRDAI Non-Payables ({result.issues.length} Items)
        </h3>
        {result.issues.length === 0 ? (
          <p className="text-[10px] text-emerald-800 italic p-2 bg-emerald-50 rounded border border-emerald-200">
            Zero statutory discrepancies detected. Documents are 100% compliant and ready for straight-through processing.
          </p>
        ) : (
          <table className="w-full text-[10px] border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold text-left">
                <th className="border border-slate-300 p-1.5 w-24">Severity</th>
                <th className="border border-slate-300 p-1.5 w-32">Rule Reference</th>
                <th className="border border-slate-300 p-1.5">Audit Finding</th>
                <th className="border border-slate-300 p-1.5">Required Action at Desk</th>
              </tr>
            </thead>
            <tbody>
              {result.issues.map((issue) => (
                <tr key={issue.id} className="align-top">
                  <td className="border border-slate-300 p-1.5 font-bold">
                    {issue.severity === "RED" ? (
                      <span className="text-red-700">[CRITICAL RISK]</span>
                    ) : (
                      <span className="text-amber-700">[DEDUCTION]</span>
                    )}
                  </td>
                  <td className="border border-slate-300 p-1.5 font-mono text-[9px]">{issue.ruleRef}</td>
                  <td className="border border-slate-300 p-1.5 font-medium">{issue.titleEn}</td>
                  <td className="border border-slate-300 p-1.5 text-slate-700">{issue.fixEn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* IRDAI Statutory Protections Note */}
      <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[9.5px] text-slate-700 mb-3">
        <strong>Statutory Legal Protections:</strong> Subject to IRDAI Master Circular (May 29, 2024) Chapter I, Para 13 (60-Month Moratorium on Non-Disclosure, except established fraud) and Mandatory 3-Hour Discharge SLA.
      </div>

      {/* Cryptographic Seal & Verification Footer */}
      <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-end text-[9.5px]">
        <div className="max-w-[70%]">
          <p className="font-mono text-slate-600 font-bold text-[9px]">SHA-256 Tamper-Evident Hash Digest:</p>
          <p className="font-mono text-slate-900 font-extrabold text-[8.5px] break-all leading-none mt-0.5" suppressHydrationWarning>
            {result.packetHash}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold uppercase text-slate-900 text-[10px]">ClaimKavach Deterministic Engine</p>
          <p className="text-slate-500 text-[9px]">Hack with Delhi 4.0 | Track 1</p>
        </div>
      </div>
    </div>
  );
};
