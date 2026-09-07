# MPLADS AI Integrity & Monitoring System

Government monitoring portal for the **Member of Parliament Local Area Development Scheme (MPLADS)** under the Ministry of Statistics and Programme Implementation (MoSPI), Government of India.

Designed as an **eSAKSHI Verification Overlay**, this system provides automated vigilance, machine learning anomaly detection, predictive delay/cost forecasting, multi-factor duplicate matching, satellite cross-verification, and multi-authority approval state enforcement.

---

## Key Features

1. **Trainable ML Anomaly Detection**: Isolation Forest & Decision Tree Ensemble scoring project risk across cost, progress velocity, and vendor concentration, with a continuous human-feedback retraining loop.
2. **eSAKSHI & data.gov.in Ingestion**: Scheduled connector with defensive parsing for Indian Rupee formats (`Cr`, `Lakh`, commas) and incomplete GPS fields, computing and persisting statutory Data Quality Reports.
3. **Real Duplicate Work Detection**: Matches works across MPs and constituencies using Haversine distance (< 500m), text specification similarity, and overlapping sanction windows.
4. **Predictive Delay & Cost-Overrun Forecasting**: S-curve time-series regression for completion trajectories + CPWD cost escalation forecasting.
5. **Persistent Tamper-Proof Storage**: Backed by persistent SQLite storage and a 256-bit SHA-256 cryptographic hash chain verifying administrative actions.
6. **Multi-Authority Approval Workflow**: Backend-enforced state machine: MP &rarr; District Authority &rarr; State Nodal Authority &rarr; Central MoSPI Ministry.
7. **Sentinel-2 Satellite Verification**: Copernicus Sentinel-2 MSI multi-temporal pass verification with real NDVI and structural edge change metrics.
8. **Durable Citizen Grievance Pipeline**: Persistent citizen feedback triaged into District, State, and Ministry Vigilance queues with tracking IDs and SLA deadlines.
9. **Multi-Channel Alerting**: Transactional Email (SMTP/SendGrid) and SMS (CDAC/Twilio) dispatch for high-risk vigilance alerts.

---

## Demonstration Credentials

| Role | User ID | Password | Jurisdiction |
|---|---|---|---|
| **District Authority (Collector)** | `ADMIN001` | `Admin@123` | Hyderabad District |
| **Member of Parliament** | `MP001` | `MP@123` | Hyderabad North (Lok Sabha) |
| **State Nodal Authority** | `STATE001` | `State@123` | Telangana State Planning |
| **Central MoSPI Ministry** | `MINISTRY001` | `Ministry@123` | MoSPI New Delhi |
| **Implementing Agency** | `AGENCY001` | `Agency@123` | TSUDA - Hyderabad Zone |

---

## Running the Project

### Prerequisites
- Node.js (v18+ or v20+)
- npm

### Installation & Launch
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suites (RBAC, ML Anomaly, Duplicates, Forecasting)
npm test

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
npm start
```

---

## Architecture & Design
For detailed technical documentation regarding the eSAKSHI overlay architecture, ML feature vectors, and government data access requirements, see [ARCHITECTURE.md](ARCHITECTURE.md).
