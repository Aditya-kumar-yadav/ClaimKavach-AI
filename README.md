# 🛡️ ClaimKavach AI (क्लेमकवच)
> **Deterministic Micro-Insurance Claim Pre-Adjudication & Compliance Engine for Bharat**  
> *Built for Hack with Delhi 4.0 | Track 1: FinTech & Financial Inclusion*

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![IRDAI & PM-JAY](https://img.shields.io/badge/Statutory%20Compliance-IRDAI%20Lists%20I--IV-success)](https://irdai.gov.in/)
[![NHA NHCX / ABDM](https://img.shields.io/badge/DPI%20Ready-NHA%20NHCX%20FHIR%20R4-emerald)](https://github.com/NHA-ABDM)

---

## 📌 Problem Brief & Significance

In India, low-income households, gig workers, and rural families under schemes like **Ayushman Bharat (PM-JAY)**, **ESIC**, and micro-health insurance face a **30%–45% claim rejection or abandonment rate**. 

Crucially, over **80% of these rejections are not caused by fraud**, but by preventable paperwork errors:
1. **Cross-Document Date Conflicts:** Admission or discharge dates on handwritten hospital bills do not match the discharge summary.
2. **Prohibited Consumables:** Hospitals bill non-payable items (gloves, PPE kits, sanitizers, thermometer covers) prohibited under statutory IRDAI Non-Payable Lists (I–IV).
3. **Missing Statutory Seals:** Missing treating-doctor registration numbers or signatures.
4. **Linguistic Barriers:** Claimants receive rejection letters written in complex legal English and cannot understand what needs fixing.

---

## 💡 The Solution: ClaimKavach AI

**ClaimKavach AI** is a web-based micro-insurance pre-adjudication engine that catches these errors *before* claims are submitted to insurers:

* 📄 **Multimodal OCR Ingestion:** Scans printed and handwritten hospital bills + discharge summaries (powered by Google Gemini 2.5 Flash Vision with zero-downtime offline fallbacks).
* ⚖️ **Deterministic Compliance Rule Engine:** Pure mathematical validation against IRDAI Lists I–IV and PM-JAY package rates (zero hallucinated math).
* 🇮🇳 **Official NHA-ABDM / NHCX Integration (Digital Public Infrastructure):** Generates an official HL7 FHIR Release 4 Claim Bundle strictly adhering to **National Health Claims Exchange (NHCX)** and **Swasth Alliance HCX** specifications.
* 🎙️ **Vernacular Voice Explainer:** Speaks out loud in fluent Hindi (`hi-IN`) explaining exactly what errors exist and how to get them fixed at the hospital billing counter.
* 🔒 **SHA-256 Tamper-Evident Dossier:** Generates an official, print-ready A4 claim summary with a cryptographic integrity hash for direct insurer adjudication.

---

## 🏗️ Architecture & Technical Stack

```
[Client Layer: Next.js 14 App Router + Tailwind CSS + Framer Motion]
  ├── Dual Ingestion Zone (Hospital Bill + Discharge Summary)
  ├── 1-Click Sandbox Presets (Flawed Claim vs. Clean Claim)
  ├── Vernacular Audio Controller (Web Speech API hi-IN)
  ├── Official NHCX FHIR Bundle Inspector & JSON Downloader
  └── Print Dossier (@media print with SHA-256 Digest)
          │
          ▼
[API Layer: Next.js Route Handlers (TypeScript)]
  ├── POST /api/extract (Gemini Vision OCR -> Zod Schema Validation)
  └── POST /api/validate (Deterministic Rule Engine -> Audit Result)
```

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) + TypeScript | High performance, server actions, zero-CORS monorepo. |
| **Styling** | Tailwind CSS + Lucide Icons | Mobile-first, glassmorphism UI for Indian field workers. |
| **DPI Interoperability** | NHA NHCX / ABDM FHIR R4 Bundle | Official Indian health claim data exchange specification (`github.com/NHA-ABDM`). |
| **Schema Validation** | Zod | Guarantees strict JSON boundary between OCR and rule engine. |
| **Multimodal Vision** | Google Gemini 2.5 Flash | High-accuracy handwriting & tabular extraction with sample fallbacks. |
| **Voice Synthesis** | Native Web Speech API (`hi-IN`) | Zero latency, in-browser vernacular speech without external API limits. |
| **Integrity** | Node.js Crypto (SHA-256) | Tamper-evident cryptographic seal on every validated claim packet. |

---

## 🚀 Quickstart & Local Installation

### Prerequisites
* Node.js v18+ or v20+
* npm or pnpm

### 1. Clone & Install Dependencies
```bash
git clone <YOUR_REPO_URL>
cd claimkavach-ai
npm install
```

### 2. Environment Configuration (Optional)
```bash
cp .env.example .env.local
```
Add your Gemini API Key if you want live camera OCR (otherwise the app automatically uses built-in realistic demo bill presets):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 How to Rehearse the 60-Second Demo (The Judge Walkthrough)

1. **Step 1:** Open the app and click **"सैंपल: खारिज होने वाला क्लेम (Preset: Flawed Claim)"**.
2. **Step 2:** Click **"क्लेम की जाँच करें (Pre-Adjudicate Claim)"**.
3. **Step 3:** Watch the **Approval Probability Meter** drop to **28% (CRITICAL RED)**.
   * Point out the **Date Mismatch** alert (Admit 12 Nov on Bill vs. 13 Nov on Summary).
   * Point out the **₹4,550 in Non-Payable Deductions** (Surgical gloves & admission kit under IRDAI Lists I & II).
4. **Step 4:** Click the **Voice Button** and hear the app explain the fix aloud in spoken Hindi:
   > *"अस्पताल के बिल में भर्ती की तारीख गलत है। बिलिंग काउंटर से तारीख ठीक करवाएं..."*
5. **Step 5 (The Big DPI Flex):** Click **"Export NHCX-Ready JSON (FHIR Bundle)"**:
   * Show the judges the live **HL7 FHIR Bundle** with `Patient`, `Organization`, `Claim`, and `ClaimResponse` conforming to NHA-ABDM specs.
   * Click **"Copy JSON"** or **"Download .json Bundle"**.
6. **Step 6:** Click **"Print Insurer Claim Dossier"** to view the official A4 dossier with the SHA-256 cryptographic seal.
7. **Step 7:** Click **"सैंपल: मान्य क्लेम (Clean Validated Claim)"** and see the green approval screen with confetti celebration!

---

## 📜 Submission Alignment (Hack with Delhi 4.0)

* **Track:** Track 1: FinTech and Financial Inclusion
* **Demographic Impact:** Protects rural patients and unorganized gig workers from catastrophic out-of-pocket medical debt.
* **Adoption Pathway:** Direct national integration with **Ayushman Bharat Digital Mission (ABDM)**, **National Health Claims Exchange (NHCX)**, and third-party administrators (TPAs).
