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

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

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
  
  // Financials (in Rupees, typically displayed in Lakhs: 1 Lakh = 100,000 INR)
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
  
  // AI Decision-Support Metrics
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  riskReason: string;
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
  
  createdAt: string;
  updatedAt: string;
}

export type AlertType =
  | 'High Risk'
  | 'Cost Anomaly'
  | 'Delay Risk'
  | 'Possible Duplicate'
  | 'Photo Anomaly'
  | 'Location Mismatch';

export type AlertStatus =
  | 'Open'
  | 'Under Review'
  | 'Valid'
  | 'False Positive'
  | 'Needs More Info'
  | 'Escalated';

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
  | 'other';

export interface CitizenFeedback {
  id: string;
  projectId: string;
  workId: string;
  projectTitle: string;
  issueType: IssueType;
  citizenName: string;
  contactEmail?: string;
  comments: string;
  photoUrl?: string;
  photoVerification?: {
    status: 'Verified' | 'Mismatch' | 'Unverifiable';
    distanceMeters?: number;
  };
  status: 'Pending' | 'Under Investigation' | 'Resolved' | 'Dismissed';
  createdAt: string;
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
