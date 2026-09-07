/**
 * Core Domain Types for MPLADS AI Integrity & Monitoring System
 */

export type UserRole = 'mp' | 'admin' | 'agency' | 'citizen';

export interface User {
  id: string;
  userId: string;
  name: string;
  role: UserRole;
  email: string;
  house?: HouseType;
  state?: string;
  district?: string;
  constituency?: string;
  agencyId?: string;
  agencyName?: string;
  designation?: string;
}

export type ProjectStatus =
  | 'Recommended'
  | 'Under Review'
  | 'Sanctioned'
  | 'Assigned'
  | 'Ongoing'
  | 'Delayed'
  | 'Completed'
  | 'Rejected';

export type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High' | 'Critical' | 'Medium';

export type HouseType = 'Lok Sabha' | 'Rajya Sabha';

export type ProjectCategory =
  | 'Drinking Water'
  | 'Education'
  | 'Health & Sanitation'
  | 'Roads & Bridges'
  | 'Community Halls'
  | 'Irrigation & Flood Control'
  | 'Renewable Energy'
  | 'Sports & Youth Development'
  | 'Other Public Utilities';

export type PhotoStage = 'Before-Work' | 'During-Work' | 'After-Completion' | 'Pre-Work' | 'Completed';

export interface MilestoneProgress {
  id: string;
  percentage: number;
  description: string;
  updatedAt: string;
  updatedBy: string;
  photoUrl?: string;
  verifiedGps?: boolean;
}

export interface ProjectPhoto {
  id: string;
  url: string;
  stage: 'Pre-Work' | 'During-Work' | 'Completed';
  uploadedAt: string;
  uploadedBy: string;
  fileName: string;
  exifStatus: 'Verified' | 'Mismatch' | 'Unverifiable' | 'Suspicious';
  exifGps?: { lat: number; lng: number };
  distanceMeters?: number;
  device?: string;
  software?: string;
  pHash?: string;
  notes?: string;
}

export interface ProjectPayment {
  id: string;
  installmentNo: number;
  amount: number; // in INR (Rupees)
  sanctionOrderNo: string;
  date: string;
  status: 'Released' | 'Pending' | 'Rejected';
  utilizationCertSubmitted: boolean;
}

export type DocumentType =
  | 'Sanction Order'
  | 'Work Order'
  | 'Administrative Approval'
  | 'Technical Approval'
  | 'Bill'
  | 'Inspection Report'
  | 'Completion Certificate'
  | 'Utilization Certificate';

export interface ProjectDocument {
  id: string;
  projectId: string;
  workId: string;
  documentType: DocumentType;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  uploadedBy: string;
  uploadedRole: UserRole;
  uploadedAt: string;
  verificationStatus: 'Pending' | 'Verified' | 'Flagged';
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export type InspectionResult = 'Satisfactory' | 'Minor Issues' | 'Major Issues' | 'Critical Issues' | 'Pending';

export interface InspectionChecklistItem {
  item: string;
  status: 'Pass' | 'Fail' | 'Partial' | 'N/A' | 'Satisfactory' | 'Issue';
  notes?: string;
}

export interface ProjectInspection {
  id: string;
  projectId: string;
  workId: string;
  projectTitle: string;
  district: string;
  state: string;
  inspectingOfficer: string;
  officerDesignation: string;
  scheduledDate: string;
  inspectionDate?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  result: InspectionResult;
  checklist: InspectionChecklistItem[];
  observations: string;
  recommendations: string;
  complianceNotes?: string;
  photos: string[];
  recordedAt?: string;
}

export type TimelineStage =
  | 'Proposed'
  | 'Recommended'
  | 'Approved'
  | 'Sanctioned'
  | 'Work Started'
  | 'In Progress'
  | 'Inspection'
  | 'Completed';

export interface ProjectTimelineEvent {
  id: string;
  stage: TimelineStage;
  date: string;
  actor: string;
  actorRole: string;
  notes: string;
}

export interface Project {
  id: string;
  workId: string;
  title: string;
  description: string;
  category: ProjectCategory;
  sector: string;
  house: HouseType;
  mpId: string;
  mpName: string;
  state: string;
  district: string;
  constituency: string;
  financialYear: string;
  
  // Financials (in Rupees)
  estimatedCost: number;
  sanctionedCost: number;
  utilizedCost: number;
  
  status: ProjectStatus;
  
  // Location & Execution
  latitude: number;
  longitude: number;
  locationAddress: string;
  agencyId: string;
  agencyName: string;
  vendorName: string;
  
  // Dates
  recommendedDate: string;
  sanctionDate?: string;
  agencyAssignedDate?: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  
  completionPercentage: number;
  
  // AI Decision-Support Metrics (Deterministic 0-100)
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  riskReason: string;
  riskReasons?: string[]; // Detailed individual risk factors
  costAnomaly?: {
    isAnomaly: boolean;
    zScore: number;
    baselineMean: number;
    baselineStdDev: number;
    reason: string;
  };
  delayPrediction?: {
    status: 'On Track' | 'At Risk' | 'Delayed';
    estimatedDelayDays: number;
    confidenceRange: string;
    modelType: string;
  };
  duplicateFlag?: {
    isSuspected: boolean;
    matchedProjectId?: string;
    similarityScore?: number;
    reason?: string;
  };

  photos: ProjectPhoto[];
  payments: ProjectPayment[];
  progressLogs: MilestoneProgress[];
  documents?: ProjectDocument[];
  inspections?: ProjectInspection[];
  timeline?: ProjectTimelineEvent[];
  
  createdAt: string;
  updatedAt: string;
}

export type AlertType =
  | 'High Risk'
  | 'Cost Anomaly'
  | 'Delay Risk'
  | 'Possible Duplicate'
  | 'Photo Anomaly'
  | 'Location Mismatch'
  | 'Financial Discrepancy'
  | 'Inspection Defect';

export type AlertStatus =
  | 'Open'
  | 'Under Review'
  | 'Valid'
  | 'False Positive'
  | 'Needs More Info'
  | 'Escalated'
  | 'Resolved';

export interface Alert {
  id: string;
  projectId: string;
  workId: string;
  projectTitle: string;
  state: string;
  district: string;
  type: AlertType;
  riskLevel: RiskLevel;
  reason: string;
  evidence: string;
  status: AlertStatus;
  assignedOfficer: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export type IssueType =
  | 'incomplete work'
  | 'wrong location'
  | 'asset not found'
  | 'damaged asset'
  | 'Substandard Construction Quality'
  | 'Financial Irregularity'
  | 'other';

export type GrievanceWorkflowStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'Investigation'
  | 'Under Investigation'
  | 'Action Taken'
  | 'Resolved'
  | 'Dismissed'
  | 'Pending';

export interface CitizenFeedback {
  id: string;
  grievanceId?: string; // e.g. MPLADS-GRV-2024-001042
  projectId: string;
  workId: string;
  projectTitle: string;
  issueType: IssueType;
  citizenName: string;
  contactEmail?: string;
  contactPhone?: string;
  comments: string;
  photoUrl?: string;
  photoVerification?: {
    status: 'Verified' | 'Mismatch' | 'Unverifiable';
    distanceMeters?: number;
  };
  assignedOfficer?: string;
  investigationRemarks?: string;
  actionTaken?: string;
  status: GrievanceWorkflowStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'high_risk' | 'delay' | 'financial_anomaly' | 'grievance' | 'inspection_due' | 'missing_document' | 'photo_failure';
  priority: 'Critical' | 'High' | 'Medium' | 'Info' | 'high' | 'medium' | 'info';
  projectId?: string;
  workId?: string;
  targetRole?: UserRole | 'citizen';
  targetUserId?: string;
  isRead: boolean;
  timestamp: string;
  createdAt?: string;
}

export interface AuditLogEntry {
  id: string;
  projectId: string;
  workId: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  fieldChanged: string;
  previousValue: string;
  newValue: string;
  timestamp: string;
  ipAddress?: string;
}

export interface PhotoVerificationResult {
  status: 'Verified' | 'Mismatch' | 'Unverifiable' | 'Suspicious';
  distanceMeters: number | null;
  thresholdMeters: number;
  extractedCoordinates: { lat: number; lng: number } | null;
  targetCoordinates: { lat: number; lng: number };
  timestamp: string | null;
  cameraMake: string | null;
  cameraModel: string | null;
  software: string | null;
  isEditedOrAiGenerated: boolean;
  perceptualHash: string;
  isDuplicateImage: boolean;
  duplicateMatchProjectId?: string;
  reasons: string[];
}

export interface VendorRiskEvent {
  id: string;
  projectId: string;
  workId: string;
  projectTitle: string;
  type: string;
  riskLevel: RiskLevel;
  date: string;
  description: string;
  evidence?: string;
  status: string;
}

export interface VendorProjectSummary {
  id: string;
  workId: string;
  title: string;
  category: string;
  agencyName?: string;
  status: ProjectStatus;
  sanctionedCost: number;
  utilizedCost: number;
  completionPercentage: number;
  delayDays: number;
  riskLevel: RiskLevel;
  riskScore: number;
  locationAddress: string;
}

export interface VendorAnalytics {
  vendorName: string;
  agencyName: string;
  secondaryAgencies?: string[];
  sectors: string[];
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  highRiskProjects: number;
  totalValue: number;
  utilizedValue: number;
  completionRate: number;
  delayRate: number;
  avgCompletionDelayDays: number; // average completion delay in days
  avgCompletionDays: number;
  avgRiskScore: number;
  riskLevel: RiskLevel;
  suitabilityStatus: 'Recommended' | 'Proceed with Caution' | 'High Risk / Review Required';
  suitabilityReason: string;
  aiRiskHistory: VendorRiskEvent[];
  projects: VendorProjectSummary[];
}
