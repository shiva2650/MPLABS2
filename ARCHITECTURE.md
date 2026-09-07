# MPLADS AI Integrity & Monitoring System: Architecture & eSAKSHI Overlay Model

## Executive Summary
The **MPLADS AI Integrity & Monitoring System** is an enterprise verification overlay engineered to sit directly atop the Ministry of Statistics and Programme Implementation's (MoSPI) **eSAKSHI** portal (mplads.mospi.gov.in) and open government data platforms (data.gov.in).

This system introduces an automated **Intelligence, Forensic & Multi-Authority Assurance Layer** that independently audits developmental claims, predicts project delays, calculates cost-overrun risks, identifies duplicate works, and enforces strict statutory role boundaries before public treasury funds are disbursed.

---

## High-Level System Architecture

```
                      DATA INGESTION & OGD CONNECTORS
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
data.gov.in Open Data Puller                            eSAKSHI REST / Webhook
 (Resource API / Batch CSV)                           (Live Sanction Event Feed)
         │                                                       │
         └───────────────────────────┬───────────────────────────┘
                                     ▼
                Defensive Rupee & GPS Parsing Engine
                  - Cr/Lakh/Comma Normalization
                  - Coordinate Swapping & Imputation
                  - Persisted Data Quality Report (% GPS)
                                     │
                                     ▼
                  PERSISTENT TAMPER-PROOF STORAGE
               (SQLite / PostgreSQL + SHA-256 Chaining)
             - Blocks: entryHash = H(prevHash | payload)
             - Survives restarts, reloads, crashes
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
 REAL ML ANOMALY            MULTI-FACTOR DUPLICATE        PREDICTIVE DELAY &
 DETECTION ENGINE               WORK MATCHER             COST-OVERRUN FORECAST
- Trainable Isolation      - Haversine Proximity         - S-curve velocity regression
  Forest & Tree Boosting   - Lexical Specification Sim   - CPWD Cost Escalation
- Online Feedback Loop     - Overlapping Sanction Window - Confidence intervals
  (False Positive/Confirm) - Cross-MP & Constituency       (e.g., 85% conf, ±14d)
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     ▼
                 MULTI-AUTHORITY STATUTORY APPROVAL CHAIN
         MP (Recommend) ──> District Authority (Sanction ≤ ₹50L)
                                     │
                                     ▼ (> ₹50L or Inter-district)
                            State Nodal Authority
                                     │
                                     ▼ (Special / Mega schemes)
                           Central MoSPI Ministry
                                     │
                                     ▼
             MULTI-CHANNEL TRANSACTIONAL ALERTING & NOTIFICATIONS
            - Transactional Email (SMTP / SendGrid)
            - National SMS Gateway (CDAC Mobile Seva / Twilio)
            - Webhook Dispatch to District Command Rooms
                                     │
                                     ▼
                SATELLITE CROSS-VERIFICATION & CITIZEN PIPELINE
        - Copernicus Sentinel-2 MSI / Google Earth Engine
        - Real Multi-Temporal Spectral Analysis (B04, B08 NDVI)
        - Durable Citizen Grievance Redressal (District/State/Ministry)
```

---

## 9 Implemented Tender Capabilities

### 1. Real ML-Based Anomaly / Fraud Detection
- **Architecture**: Replaces heuristic rules with a trainable Isolation Forest ensemble (`server/mlAnomalyModel.ts`) trained on multi-dimensional project vectors:
  - `cost_to_benchmark_ratio` (Z-score against empirical category/state cohort)
  - `disbursement_progress_gap` (Fund utilization ratio exceeding physical execution completion)
  - `schedule_overrun_ratio` & `execution_velocity_gap` (trailing expected daily progress rate)
  - `vendor_district_concentration` & `vendor_rapid_fire_burst` (cartel and saturation indicators)
  - `spatial_proximity_risk` & `photo_integrity_risk`
- **Feedback Retraining Loop**:
  - When vigilance officers adjudicate an alert in `AlertActionModal.tsx` as *False Positive* or *Confirmed Anomaly*, the label is recorded in the persistent ledger.
  - The model adjusts tree partition weights and threshold sensitivities in real time (`retrain()`), reporting updated Precision, Recall, F1, and ROC-AUC metrics via `/api/ml/model-status`.

### 2. Live Data Ingestion from eSAKSHI / data.gov.in
- **Connector**: Scheduled background synchronization in `server/dataIngestion.ts` connecting to `data.gov.in` OGD API and `eSAKSHI` webhook listener (`/api/data/webhook/esakshi`).
- **Defensive Parsers**:
  - `parseIndianCurrency`: Standardizes strings like `₹ 48,00,000`, `48.5 Lakhs`, `4.8 Cr`, `25,00,000/-`, and scientific notation into exact integer INR values.
  - `parseGpsCoordinates`: Detects inverted latitude/longitude, bounds violations outside India, and Null Island (0,0) spoofing. Automatically imputes district centroids while preserving audit flags.
- **Data Quality Report Persistence**:
  - Evaluates `% GPS Completeness`, `% Sanction Date Completeness`, `% Vendor PAN Completeness`, and `% Cost Format Validity`.
  - Persists full report records into the database with overall data quality scoring (`/api/data/quality-reports`).

### 3. Duplicate Work Detection
- **Multi-Factor Matching Logic** (`server/duplicateDetection.ts`):
  - **Geospatial Corridor**: Haversine distance (< 500m high alarm, < 1500m moderate buffer).
  - **Specification Similarity**: Combined token Jaccard similarity and n-gram overlap on work title and description.
  - **Overlapping Sanction Windows**: Flags works sanctioned within 365 days of each other.
  - **Cross-MP / Cross-Constituency Detection**: Catches inter-constituency double-dipping where different MPs fund overlapping civic infrastructure.
- **UI Integration**: Surfaced in `ProjectModal.tsx` under the AI Risk tab and Duplicate Candidates section.

### 4. Predictive Delay & Cost-Overrun Forecasting
- **Time-Series Milestone Progression** (`server/forecastingService.ts`):
  - Models historical execution velocities using S-curve progression curves (Initiation, Accelerated Execution, Final Certification).
  - Predicts remaining completion days and contractual deadline slippage with calibrated confidence intervals (e.g. `85% confidence, ±14 days`).
- **CPWD Cost Escalation Regression**:
  - Implements standard Central Public Works Department (CPWD) escalation modeling: accounts for duration overrun, material inflation rates, and fund-disbursement disparities.
  - Forecasts `projectedCostOverrunAmount`, `projectedFinalCost`, and risk level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

### 5. Persistent, Tamper-Proof Storage
- **Storage Layer** (`server/persistentDb.ts`):
  - Backed by persistent SQLite storage (`data/mplads_vault.db`) and WAL atomic journal writes (`data/mplads_vault.json`).
  - Stores projects, alerts, citizen feedback, audit logs, quality reports, and ML feedback so all data survives restarts and browser refreshes.
- **Cryptographic SHA-256 Hash Chaining**:
  - Every administrative mutation forms a cryptographic block chained to the previous block's SHA-256 signature:
    `entryHash = SHA256(prevHash | id | timestamp | actor | action | target | values)`
  - Includes `/api/audit-logs/verify` to validate ledger integrity from the genesis block, plus tamper simulation and restoration endpoints.

### 6. Multi-Authority Approval Workflow
- **Statutory Approval Chain** (`server/approvalWorkflow.ts`):
  - Strict state transitions:
    `Draft` ──> `Recommended` (MP)
            ──> `Feasibility Review` (District Authority)
            ──> `Sanctioned` (District Authority for works ≤ ₹50 Lakhs)
            ──> `Forwarded To State` (District Authority for works > ₹50L or inter-district)
            ──> `State Approved` (State Nodal Authority)
            ──> `Forwarded To Ministry` (State Nodal Authority)
            ──> `Ministry Approved` (Central MoSPI Ministry)
            ──> `Assigned` ──> `Ongoing` ──> `Completed` / `Rejected`
  - **RBAC Enforcement**: The backend verifies user roles before allowing any state change, rejecting unauthorized transitions with `403 Forbidden` and logging audit entries.

### 7. Live GIS / Satellite Imagery Integration
- **Earth Observation Service** (`server/satelliteVerification.ts`):
  - Real integration with Sentinel Hub Process API & Google Earth Engine.
  - Fetches multi-temporal Sentinel-2 MSI spectral bands (B04 Red, B08 NIR, B03 Green, B02 Blue) for baseline (T0) vs completion (T1).
  - Computes real mathematical NDVI ($NDVI = \frac{B08 - B04}{B08 + B04}$) and structural pixel difference.
  - Transparent fallback reporting: logs data provider, cloud coverage, and spatial resolution limits (10m ground sampling distance).

### 8. Durable Citizen Feedback Pipeline
- **Grievance Triage & Persistence** (`server/feedbackService.ts`):
  - Persists submissions from `CitizenFeedbackModal.tsx` directly to the database.
  - Automatically routes complaints to the appropriate queue:
    - **Ministry Vigilance Queue**: Financial corruption, ghost assets, or projects > ₹50L (7-day SLA).
    - **State Nodal Queue**: Inter-district disputes or works ₹25L–₹50L (10-day SLA).
    - **District Queue**: Local workmanship defects, minor delays (15-day SLA).
  - Generates unique tracking numbers (e.g. `MPLADS-GRV-2025-MIN-001`) and masks citizen mobile numbers for whistleblower protection.

### 9. Notifications & Alerting
- **Multi-Channel Dispatcher** (`server/notificationService.ts`):
  - **Transactional Email**: Formatted official MoSPI vigilance bulletins via SMTP or SendGrid.
  - **SMS Gateway**: Priority SMS alerts via CDAC Mobile Seva / NIC Gateway / Twilio for High & Critical anomalies.
  - **Webhooks**: Real-time push to command room dashboards.
  - Dispatches notifications on high-risk detections, approval transitions, and critical citizen grievances; persists delivery logs in `notifications_log`.

---

## Environment Variables & Configuration

| Variable | Purpose | Required For |
|---|---|---|
| `JWT_SECRET` | Cryptographic signing secret for administrative session tokens | Core Authentication |
| `GEMINI_API_KEY` | Google Gemini AI key for in-depth technical audit briefs | AI Audit Briefs |
| `DATA_GOV_IN_API_KEY` | Open Government Data (data.gov.in) API key | Live OGD Puller |
| `DATA_GOV_IN_RESOURCE_ID` | Dataset resource UID on data.gov.in | Live OGD Puller |
| `ESAKSHI_API_URL` | Endpoint for MoSPI eSAKSHI portal REST services | Live eSAKSHI Connector |
| `ESAKSHI_API_TOKEN` | Bearer token or mTLS credential for eSAKSHI integration | Live eSAKSHI Connector |
| `SENTINEL_HUB_CLIENT_ID` | Sentinel Hub OAuth2 Client ID (Copernicus Data Space) | Live Satellite Passes |
| `SENTINEL_HUB_CLIENT_SECRET` | Sentinel Hub OAuth2 Client Secret | Live Satellite Passes |
| `GEE_SERVICE_ACCOUNT_KEY` | Google Earth Engine service account credentials | Earth Engine Analytics |
| `SMTP_HOST` / `SMTP_PASS` | Transactional email gateway credentials | Live Email Delivery |
| `SMS_GATEWAY_API_KEY` | CDAC Mobile Seva / NIC SMS Gateway key | Live SMS Dispatch |
| `SQLITE_DB_PATH` | Path to persistent database file | Persistent Storage |

---

## Government Data Access Dependencies (What Requires Live Gov Credentials)
1. **eSAKSHI Live Webhooks**: Real-time push of sanction orders requires VPN access to the NIC government network (NICNET) and an authorized mTLS client certificate issued by MoSPI.
2. **data.gov.in API**: Production querying of national datasets requires an active API key registered on the OGD platform.
3. **CDAC Mobile Seva SMS Gateway**: SMS delivery using official government headers (`MOSPIN`) requires TRAI-approved template registration and CDAC credentials.
4. **Copernicus Sentinel Hub**: Production commercial multi-spectral satellite imagery at high request volumes requires an active Copernicus Data Space account.

*Note: All 9 features operate autonomously in calibrated demonstration mode with realistic public datasets and fallbacks when external government credentials are not provided.*
