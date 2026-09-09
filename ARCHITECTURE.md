# MPLADS AI Integrity & Monitoring System: Architecture & Data Overlay Model

## Executive Summary

The **MPLADS AI Integrity & Monitoring System** is engineered not to replace existing governmental workflows, but to operate as a **non-invasive, high-precision verification overlay** sitting directly atop official Ministry of Statistics and Programme Implementation (MoSPI) portals (mplads.mospi.gov.in) and open data platforms (data.gov.in).

While central governmental registries serve as the administrative system of record for sanction orders, milestone approvals, and fund disbursements, our architecture introduces an automated **Intelligence & Forensic Assurance Layer** that independently audits claims before funds are disbursed.

---

## High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA INGESTION ADAPTER                          │
│   Official API / CSV Exports │  data.gov.in Datasets  │  Citizen Portals │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Defensive Parsing & Quality Audit
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                INTEGRITY ENGINE & MULTI-LAYER AUDIT                    │
├────────────────────────────────────────┬───────────────────────────────┤
│          Graph Network Fraud           │     Multi-Layer Evidence      │
│          Collusion Detection           │        Forensics & ELA        │
│          - Concentration Z-score       │     - Perceptual hashing for  │
│            analysis                    │       duplicate project pics  │
│          - Rapid-fire award burst      │     - EXIF GPS vs sanctioned  │
│            tracking                    │       geographical bounds     │
│          - Shell company match         │     - Multimodal vision       │
│          - Louvain clustering          │       forensics & metadata    │
└────────────────────────────────────────┴──────────────┬────────────────┘
                                                        │
                                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│             CRYPTOGRAPHIC HASH-CHAIN AUDIT LAYER                       │
│  - SHA-256 Chained Blocks: entryHash = H(prevHash | entry | timestamp) │
│  - Tamper-evident ledger of all administrative & algorithmic decisions │
│  - Live Verification API (/api/audit-logs/verify)                      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│              EXECUTIVE DASHBOARD & CITIZEN RAG ASSISTANT               │
│  - Impact Metrics Calculator (₹ Cr flagged, recovery savings target)   │
│  - Interactive Graph-based Contractor Collusion Visualizer             │
│  - Multilingual NLP Chatbot (English, Hindi, Telugu, Tamil)            │
│  - Role-Based Security Enforcement (RBAC)                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Non-Invasive Overlay Integration Strategy

1. **Zero Workflow Friction**:
   Implementing agencies, District Authorities (DMs/DCs), and MPs continue submitting proposals and sanctions through their standard administrative portals. Our ingestion adapter ingests periodic batch exports or webhook feeds.
2. **Defensive Data Ingestion**:
   Tolerates missing fields, varied Indian Rupee formatting (Crores, Lakhs, commas), and uncalibrated GPS strings. Produces a real-time **Data Quality Report** (e.g. *94.2% GPS completeness*) as a built-in transparency metric.
3. **Pluggable Verification Pipeline**:
   The verification layers (Graph collusion analysis, Photo forensics, Spatial validation) run asynchronously, flagging anomalies for Vigilance review without halting legitimate work sanctions.
4. **Actionable Impact Deliverables**:
   Computes verified potential savings (disparity between funds disbursed vs verified forensic completion) so authorities have concrete numbers for audits.
