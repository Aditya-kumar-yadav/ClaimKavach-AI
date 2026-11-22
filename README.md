# 🛡️ ClaimKavach AI (क्लेमकवच)
> **Deterministic Micro-Insurance Claim Pre-Adjudication & Compliance Engine for Bharat**  
> *Built for Hack with Delhi 4.0 | Track 1: FinTech & Financial Inclusion*

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![IRDAI 2024 Master Circular](https://img.shields.io/badge/Statutory%20Rules-IRDAI%202024%20Master%20Circular-success)](https://irdai.gov.in/)
[![NHA NHCX / ABDM](https://img.shields.io/badge/DPI%20Ready-NHA%20NHCX%20FHIR%20R4-emerald)](https://github.com/NHA-ABDM)

---

## 📌 Problem Brief & Significance

In India, low-income households, gig workers, and rural families under schemes like **Ayushman Bharat (PM-JAY)**, **ESIC**, and micro-health insurance face a **30%–45% claim rejection or abandonment rate**. 

Crucially, over **80% of these rejections are not caused by fraud**, but by preventable paperwork errors and misunderstood statutory clauses:
1. **Cross-Document Date Conflicts:** Admission or discharge dates on handwritten hospital bills do not match the discharge summary.
2. **Prohibited Consumables:** Hospitals bill non-payable items (gloves, PPE kits, sanitizers, thermometer covers) prohibited under statutory IRDAI Non-Payable Lists (I–IV).
3. **Statutory 2024 Rules (Moratorium & Waiting Periods):** Claimants are unaware of the **5-Year (60-Month) Moratorium Rule (IRDAI Master Circular May 2024, Chapter I, Para 13)** where insurers cannot contest pre-existing diseases (except in cases of established fraud), or fall into **Proportional Room Rent Capping** traps.
4. **Missing Statutory Seals:** Missing treating-doctor registration numbers or signatures.
5. **Linguistic Barriers:** Claimants receive rejection letters written in complex legal English and cannot understand what needs fixing.

---

## 💡 The Solution: ClaimKavach AI

**ClaimKavach AI** is a web-based micro-insurance pre-adjudication engine that catches these errors *before* claims are submitted to insurers:

* 📄 **Multimodal OCR Ingestion:** Scans printed and handwritten hospital bills + discharge summaries (powered by Google Gemini 2.5 Flash Vision with zero-downtime offline fallbacks).
* ⚖️ **IRDAI 2024 Deterministic Compliance Engine:** Pure mathematical validation against IRDAI Lists I–IV, 60-Month Moratorium protections, statutory procedure waiting periods, and room-rent capping.
* 🇮🇳 **Official NHA-ABDM / NHCX Integration (Digital Public Infrastructure):** Generates an official HL7 FHIR Release 4 Claim Bundle strictly adhering to **National Health Claims Exchange (NHCX)** and **Swasth Alliance HCX** specifications.
* ⚡ **Interactive "Fix-It" Simulator:** Click "Mark as Fixed" on errors live on stage to see the score jump in real time from **28% RED → 64% YELLOW → 96% GREEN** with animated money saved counters!
* ⚖️ **1-Click "Fight Back" IRDAI Appeal Generator:** For claims rejected unfairly, auto-drafts a formal legal appeal to the insurer's GRO, citing May 2024 circulars, the mandatory 14-day window, and the 3-step escalation ladder (GRO → Bima Bharosa → Insurance Ombudsman, where 79% of appeals are won by policyholders).
* 🏥 **1-Click WhatsApp Hospital Billing Desk Rectification:** Auto-drafts polite, exact correction requests in Hindi/English to fix mismatched dates or missing doctor seals at the hospital counter.
* 📊 **Cashless Everywhere & PM-JAY Benchmark Check:** Checks hospital bills against national PM-JAY package benchmarks to detect private hospital overbilling.
* 🎙️ **Vernacular Voice Explainer:** Speaks out loud in fluent Hindi (`hi-IN`) explaining exactly what errors exist and how to get them fixed at the hospital billing counter.
* 🔒 **SHA-256 Tamper-Evident Dossier:** Generates an official, print-ready A4 claim summary with a cryptographic integrity hash for direct insurer adjudication.

---

## 🏛️ Real IRDAI 2024 Master Circular Rules Implemented

| Statutory Rule | IRDAI Reference | How ClaimKavach Enforces It |
| :--- | :--- | :--- |
| **5-Year Moratorium Clause** | Master Circular (May 2024), Para 13 | If policy tenure $\ge 60$ months, guarantees legal immunity against PED rejections (except established fraud). |
| **Procedure Waiting Periods** | Standardized Health Terms (2024) | Flags statutory waiting periods capped at 36 months (e.g. Inguinal Hernia 24 mos, Cataract 24 mos, Joint Replacement 36 mos). |
| **Room Rent Proportional Capping** | Schedule of Benefits (1% SI) | Calculates proportional deductions when room rent exceeds 1% of Sum Insured and notifies user. |
| **Non-Payable Consumables** | IRDAI Lists I–IV | Automatically audits and deducts non-payable items (gloves, masks, admission kits) from the payable total. |

---

## 🏗️ Architecture & Technical Stack

```
[Client Layer: Next.js 14 App Router + Tailwind CSS + Framer Motion]
  ├── Dual Ingestion Zone (Hospital Bill + Discharge Summary)
  ├── 1-Click Sandbox Presets (Flawed Claim vs. Clean Claim)
  ├── Statutory 2024 Protections Banner (Moratorium Para 13)
  ├── Vernacular Audio Controller (Web Speech API hi-IN)
  ├── Official NHCX FHIR Bundle Inspector & JSON Downloader
  └── Print Dossier (@media print with SHA-256 Digest)
          │
          ▼
[API Layer: Next.js Route Handlers (TypeScript)]
  ├── POST /api/extract (Gemini Vision OCR -> Zod Schema Validation)
  └── POST /api/validate (Deterministic Rule Engine -> Audit Result)
```

---

## 🚀 Quickstart & Local Installation

```bash
git clone <YOUR_REPO_URL>
cd claimkavach-ai
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 How to Rehearse the 60-Second Demo (The Judge Walkthrough)

1. **Step 1:** Open the app and click **"सैंपल: खारिज होने वाला क्लेम (Preset: Flawed Claim)"**.
2. **Step 2:** Click **"क्लेम की जाँच करें (Pre-Adjudicate Claim)"**.
3. **Step 3:** Watch the **Approval Probability Meter** drop to **28% (CRITICAL RED)**.
   * Point out the **Date Mismatch** alert (Admit 12 Nov on Bill vs. 13 Nov on Summary).
   * Point out the **Statutory Hernia Waiting Period Violation** (Policy is 14 months vs required 24 months under IRDAI 2024 rules).
   * Point out the **Proportional Room Rent Capping Deduction** (₹5,000/day room vs ₹3,000/day eligible 1% cap).
   * Point out the **Non-Payable Deductions** (Surgical gloves & admission kit under IRDAI Lists I–IV).
4. **Step 4:** Click the **Voice Button** and hear the app explain the fix aloud in spoken Hindi:
   > *"अस्पताल के बिल में भर्ती की तारीख गलत है। बिलिंग काउंटर से तारीख ठीक करवाएं..."*
5. **Step 5 (The DPI Flex):** Click **"Export NHCX-Ready JSON (FHIR Bundle)"**:
   * Show the judges the live **HL7 FHIR Bundle** conforming to NHA-ABDM specs.
6. **Step 6 (The Legal Protections Flex):** Click **"सैंपल: मान्य क्लेम (Clean Validated Claim)"**:
   * Show the green statutory badge: **"🛡️ IRDAI 2024 Moratorium Protected (Para 13)"**—policy active for 68 months, legally immune to PED rejections (except in cases of established fraud)!
7. **Step 7:** Click **"Print Insurer Claim Dossier"** to view the official A4 dossier with the SHA-256 cryptographic seal.
