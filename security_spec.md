# Security Specification: MPLADS AI Integrity & Monitoring System

## 1. Data Invariants
1. **Role-Based Access Boundaries**:
   - **MPs (`role: 'mp'`)**: Can only recommend works and view projects, funds, and alerts within their own constituency/state. Cannot alter administrative approvals or agency billing records.
   - **Administrators / District Authorities (`role: 'admin'`)**: Can approve/reject recommendations, sanction funds, assign implementing agencies, evaluate AI anomaly alerts, escalate risks, and generate reports within their jurisdiction.
   - **Implementing Agencies (`role: 'agency'`)**: Can only view assigned projects, update physical milestone progress (0–100%), submit measurement book entries/bills, and upload geo-tagged site inspection photos. Cannot alter sanctions or MP recommendations.
   - **Public / Citizens**: Can view non-sensitive project statistics, search works, view GIS maps, and submit feedback/grievances. Cannot access internal risk reasoning, PII, vendor sensitive details, or system audit logs.

2. **Audit Log Immutability**:
   - The `/auditLogs` collection is strictly append-only. No role, including Admin, can modify or delete existing audit entries.

3. **Photo & GPS Integrity Verification**:
   - All uploaded site inspection photos undergo server-side EXIF extraction (GPS latitude/longitude, timestamp, camera make/model, and software tag).
   - Images with missing/stripped EXIF are flagged as **Unverifiable**.
   - Images showing AI generation or photo editing software signatures are flagged as **Photo Anomaly**.
   - Geo-coordinates are checked against project registered coordinates via the Haversine distance formula; deviation > 500m is flagged as **Location Mismatch**.
   - Perceptual image hashing detects duplicate/recycled photos across projects.

4. **AI Decision Support Guardrail**:
   - All AI metrics (Risk Score 0-100, Cost Anomaly, Delay Risk, Duplicate Project Detection) are explicitly labeled as **decision-support indicators requiring human review** and never as automated determinations of fraud.
