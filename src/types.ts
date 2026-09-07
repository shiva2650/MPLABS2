export type UserRole = 'MP' | 'ADMIN' | 'AGENCY' | 'PUBLIC';

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  constituency?: string;
  state?: string;
  district?: string;
  agencyId?: string;
  agencyName?: string;
  house?: 'Lok Sabha' | 'Rajya Sabha';
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

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SectorCategory =
  | 'Drinking Water Facility'
  | 'Education & School Infrastructure'
  | 'Sanitation & Public Health'
  | 'Roads, Pathways & Bridges'
  | 'Community Infrastructure'
  | 'Irrigation & Flood Control'
  | 'Electricity & Non-Conventional Energy'
  | 'Sports & Youth Development';

export interface ExifMetadata {
  hasExif: boolean;
  gpsLat?: number;
  gpsLng?: number;
  dateTimeOriginal?: string;
  make?: string;
  model?: string;
  software?: string;
}

export interface PhotoVerificationResult {
  status: 'Verified' | 'Location Mismatch' | 'Unverifiable' | 'Suspicious';
  distanceMeters?: number;
  flagReasons: string[];
  softwareFlagged?: boolean;
  duplicatePhotoDetected?: boolean;
  pHash?: string;
  reverseGeocode?: string;
}

export interface ProjectPhoto {
  id: string;
  projectId: string;
  url: string;
  caption: string;
  stage: 'Pre-Execution' | 'During Execution' | 'Post-Completion';
  uploadedAt: string;
  uploadedBy: string;
  uploadedByRole: UserRole;
  exif: ExifMetadata;
  verification: PhotoVerificationResult;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  type:
    | 'Recommendation Letter'
    | 'Sanction Order'
    | 'Technical Feasibility'
    | 'Agency Work Order'
    | 'Contractor Agreement'
    | 'Bill & Voucher'
    | 'Completion Certificate';
  fileUrl: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  accessRoles: UserRole[];
}

export interface ProjectPayment {
  id: string;
  projectId: string;
  voucherNo: string;
  amountLakhs: number;
  date: string;
  milestone: string;
  recipientVendor: string;
  approvedBy: string;
  status: 'Requested' | 'Approved' | 'Disbursed' | 'Under Review';
}

export interface TimelineStage {
  stage:
    | 'Recommendation'
    | 'Feasibility Check'
    | 'Sanction'
    | 'Agency Assignment'
    | 'Execution'
    | 'Payment'
    | 'Completion';
  date?: string;
  completed: boolean;
  notes?: string;
  actor?: string;
}

export interface CostAnomalyAnalysis {
  isAnomaly: boolean;
  categoryMeanLakhs: number;
  categoryStdDevLakhs: number;
  zScore: number;
  reason: string;
  benchmarkThresholdLakhs: number;
}

export interface DuplicateMatchAnalysis {
  isPossibleDuplicate: boolean;
  matchedProjectId?: string;
  matchedTitle?: string;
  similarityPercent?: number;
  reason?: string;
}

export interface DelayPredictionAnalysis {
  classification: 'On Track' | 'At Risk' | 'Delayed';
  confidencePercent: number;
  delayDaysMin: number;
  delayDaysMax: number;
  reason: string;
  modelType: 'Historical Heuristic + Regression Baseline (Synthetic/Trained on MPLADS norm data)';
}

export interface Project {
  id: string;
  workCode: string;
  title: string;
  description: string;
  sector: SectorCategory;
  state: string;
  district: string;
  constituency: string;
  house: 'Lok Sabha' | 'Rajya Sabha';
  mpId: string;
  mpName: string;
  financialYear: string;
  tenure: string;

  estimatedCostLakhs: number;
  sanctionedCostLakhs: number;
  expenditureLakhs: number;
  balanceLakhs: number;

  status: ProjectStatus;
  progressPercentage: number;

  recommendationDate: string;
  sanctionDate?: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;

  implementingAgencyId?: string;
  implementingAgencyName?: string;
  vendorId?: string;
  vendorName?: string;

  coordinates: {
    lat: number;
    lng: number;
  };
  locationName: string;

  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  riskReasons: string[];

  timeline: TimelineStage[];
  photos: ProjectPhoto[];
  documents: ProjectDocument[];
  payments: ProjectPayment[];

  costAnomaly?: CostAnomalyAnalysis;
  duplicateMatch?: DuplicateMatchAnalysis;
  delayPrediction?: DelayPredictionAnalysis;

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
  | 'Under Review'
  | 'Valid'
  | 'False Positive'
  | 'Needs More Info'
  | 'Escalated';

export interface AlertReviewHistory {
  id: string;
  timestamp: string;
  reviewedBy: string;
  role: UserRole;
  previousStatus: AlertStatus;
  newStatus: AlertStatus;
  remarks: string;
}

export interface AnomalyAlert {
  id: string;
  projectId: string;
  projectTitle: string;
  workCode: string;
  state: string;
  district: string;
  mpName: string;
  type: AlertType;
  riskLevel: RiskLevel;
  reason: string;
  createdAt: string;
  status: AlertStatus;
  assignedOfficer?: string;
  reviewHistory: AlertReviewHistory[];
}

export interface CitizenFeedback {
  id: string;
  projectId: string;
  projectTitle: string;
  workCode: string;
  state: string;
  district: string;
  citizenName: string;
  citizenContact: string; // Sanitized on public view
  issueType:
    | 'incomplete_work'
    | 'wrong_location'
    | 'asset_not_found'
    | 'damaged_asset'
    | 'quality_issue'
    | 'other';
  comments: string;
  photoUrl?: string;
  submittedAt: string;
  status: 'Submitted' | 'Under Investigation' | 'Action Taken' | 'Dismissed';
  officialRemarks?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  projectId?: string;
  projectTitle?: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  ipAddress: string;
}

export interface VendorAnalyticsSummary {
  vendorId: string;
  vendorName: string;
  projectCount: number;
  totalValueLakhs: number;
  completedCount: number;
  ongoingCount: number;
  delayedCount: number;
  highRiskCount: number;
  completionRatePercent: number;
  delayRatePercent: number;
  avgCompletionTimeDays: number;
}
