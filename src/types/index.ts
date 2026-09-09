export type UserRole = 'MP' | 'ADMIN' | 'AGENCY' | 'PUBLIC' | 'SUPER_ADMIN' | 'PROJECT_MANAGER' | 'VIEWER';

export interface User {
  id: string;
  userId: string;
  name: string;
  role: UserRole;
  designation: string;
  constituency?: string;
  district?: string;
  agencyId?: string;
  agencyName?: string;
  email?: string;
  phone?: string;
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

export type AlertType =
  | 'High Risk'
  | 'Cost Anomaly'
  | 'Delay Risk'
  | 'Possible Duplicate'
  | 'Photo Anomaly'
  | 'Location Mismatch';

export type AlertStatus =
  | 'New'
  | 'Under Review'
  | 'False Positive'
  | 'Escalated'
  | 'Resolved';

export interface ProjectPhoto {
  id: string;
  stage: 'before' | 'during' | 'after';
  url: string;
  caption: string;
  uploadedAt: string;
  uploadedBy: string;
  latitude?: number;
  longitude?: number;
  isAiVerified: boolean;
  aiVerificationNotes?: string;
  similarityAlert?: boolean;
  perceptualHash?: string;
  exifTimestamp?: string;
  verificationStatus?: 'VERIFIED' | 'UNVERIFIABLE' | 'LOCATION_MISMATCH' | 'DUPLICATE_REUSE' | 'PENDING';
  distanceFromSiteMeters?: number;
  gpsDistanceMeters?: number; // alias for distanceFromSiteMeters
  isGpsVerified?: boolean;
  cameraMakeModel?: string;
  cameraModel?: string; // alias for cameraMakeModel
  duplicateMatchDetails?: {
    matchedProjectId: string;
    matchedProjectCode: string;
    matchedPhotoId: string;
    similarityPercentage: number;
    hammingDistance?: number;
  };
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'Recommendation' | 'Sanction Order' | 'Bill' | 'Payment Voucher' | 'Completion Certificate' | 'Other';
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  downloadUrl: string;
  isConfidential?: boolean;
}

export interface ProjectPayment {
  id: string;
  installmentNo: number;
  amount: number; // in INR
  sanctionOrderNo: string;
  paidAt: string;
  status: 'Requested' | 'Approved' | 'Disbursed';
  beneficiaryAgency: string;
  remarks?: string;
}

export interface AiRiskAnalysis {
  overallScore: number; // 0-100
  riskLevel: RiskLevel;
  lastEvaluatedAt: string;
  costAnomalyScore: number; // 0-100
  duplicateProbability: number; // 0-100
  photoAnomalyScore: number; // 0-100
  locationMismatch: boolean;
  delayProbability: number; // 0-100
  delayRiskScore?: number; // alias for delayProbability
  duplicateRiskScore?: number; // alias for duplicateProbability
  photoReuseScore?: number; // alias for photoAnomalyScore
  reasons: string[];
  recommendations: string[];
  disclaimer: string;
  // Rigorous statistical baseline & confidence metrics (Areas 1 & 3)
  costBaseline?: {
    mean: number;
    cohortMean?: number;
    stdDev: number;
    cohortStdDev?: number;
    zScore: number;
    cohortSize: number;
    category: string;
    state: string;
    zThreshold: number;
    isAnomaly: boolean;
    reason: string;
  };
  delayMetrics?: {
    delayDays: number;
    confidenceScore: number; // e.g. 78%
    marginOfErrorDays: number; // e.g. 14 days
    confidenceInterval: string; // "78% confidence, ± 14 days"
    confidenceIntervalString?: string; // alias
    modelTrainingStatus: string; // "Model trained on synthetic data — validation pending"
    holdoutValidation?: {
      precision: number;
      recall: number;
      f1Score: number;
      accuracy: number;
      sampleSize: number;
    };
  };
}

export interface Project {
  id: string;
  projectCode: string;
  workId?: string; // alias for projectCode
  title: string;
  description: string;
  category: string;
  mpId: string;
  mpName: string;
  constituency: string;
  district: string;
  state: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  estimatedCost: number; // in INR (e.g., 2500000 = 25 Lakh)
  sanctionedAmount: number;
  fundsUtilized: number;
  implementingAgencyId: string;
  implementingAgencyName: string;
  vendorName: string;
  vendorPanMasked: string;
  recommendationDate: string;
  sanctionDate: string;
  startDate: string;
  expectedCompletionDate: string;
  actualCompletionDate?: string;
  status: ProjectStatus;
  completionPercentage: number;
  riskAnalysis: AiRiskAnalysis;
  photos: ProjectPhoto[];
  documents: ProjectDocument[];
  payments: ProjectPayment[];
  timeline: {
    stage: string;
    completed: boolean;
    date?: string;
    remarks?: string;
  }[];
}

export interface RiskAlert {
  id: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  district: string;
  mpName: string;
  agencyName: string;
  alertType: AlertType;
  riskLevel: RiskLevel;
  reason: string;
  technicalDetails?: string;
  createdAt: string;
  status: AlertStatus;
  assignedOfficer?: string;
  reviewNotes?: string;
  resolvedAt?: string;
}

export interface DuplicateProjectCandidate {
  primaryProject: Project;
  candidateProject: Project;
  similarityScore: number; // 0 - 100%
  distanceMeters: number;
  matchingFactors: string[];
}

export interface CitizenFeedback {
  id: string;
  projectId: string;
  projectTitle: string;
  projectCode: string;
  district: string;
  citizenName: string;
  citizenContactMasked?: string;
  issueType: 'Incomplete Work' | 'Incorrect Location' | 'Project Not Found' | 'Damaged Asset' | 'Poor Quality' | 'Other';
  description: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  submittedAt: string;
  status: 'New' | 'Under Review' | 'Verified' | 'Resolved' | 'Rejected';
  adminNotes?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  targetEntity: string;
  targetId: string;
  timestamp: string;
  previousValue?: string;
  newValue?: string;
  ipAddressMasked: string;
  entryHash?: string;
  prevHash?: string;
}

export interface EvidenceAuditFlag {
  category: 'PHOTO' | 'VIDEO' | 'GPS' | 'CONTENT' | 'METADATA';
  code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  reason: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface EvidenceVerificationResult {
  integrityScore: number;
  isApproved: boolean;
  requiresManualReview: boolean;
  flags: EvidenceAuditFlag[];
  exifData: {
    hasExif: boolean;
    latitude?: number;
    longitude?: number;
    timestamp?: string;
    cameraMake?: string;
    cameraModel?: string;
    software?: string;
    isStrippedOrMissing: boolean;
  };
  perceptualHash: {
    aHash: string;
    dHash: string;
    duplicateMatch?: {
      matchedProjectId: string;
      matchedPhotoId: string;
      hammingDistance: number;
    };
  };
  tamperAnalysis: {
    isTampered: boolean;
    elaVariance: number;
    noiseInconsistencyScore: number;
    editingSoftwareDetected?: string;
  };
  gpsVerification: {
    distanceFromSiteMeters: number;
    isWithinThreshold: boolean;
    isSpoofedPattern: boolean;
    isWithinConstituency: boolean;
    calculatedTravelSpeedKmh?: number;
    isImpossibleTravel?: boolean;
  };
  contentVerification: {
    categoryMatches: boolean;
    detectedInfrastructureType: string;
    isAiGenerated: boolean;
    aiConfidence: number;
    analysisNotes: string;
  };
}

export interface DashboardSummary {
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  delayedProjects: number;
  underReviewProjects: number;
  recommendedProjects: number;
  totalFundsSanctioned: number;
  totalFundsUtilized: number;
  highRiskProjectsCount: number;
  costAnomaliesCount: number;
  possibleDuplicatesCount: number;
  photoAnomaliesCount: number;
  locationMismatchesCount: number;
  delayRisksCount: number;
  totalPendingReviews: number;
}

export const CATEGORY_COST_BENCHMARKS: Record<string, { min: number; max: number; typical: number; unitDescription: string }> = {
  'Community Infrastructure': { min: 1500000, max: 2500000, typical: 2000000, unitDescription: 'Standard plinth community center (2000-3000 sq ft)' },
  'Drinking Water & Sanitation': { min: 1200000, max: 2000000, typical: 1600000, unitDescription: '2000 LPH RO water filtration plant or OHSR unit' },
  'Education & Schools': { min: 1800000, max: 3000000, typical: 2400000, unitDescription: 'Govt high school modernization & digital classroom package' },
  'Renewable Energy': { min: 2500000, max: 4000000, typical: 3200000, unitDescription: '50-100 high-mast solar LED poles or 50kWp rooftop solar' },
  'Healthcare & Wellness': { min: 2500000, max: 4500000, typical: 3500000, unitDescription: 'Primary health sub-centre or mobile ambulance life support unit' },
  'Roads, Bridges & Pathways': { min: 1500000, max: 2800000, typical: 2200000, unitDescription: 'Cement concrete road with cover drains (approx. 500m)' },
  'Child & Women Welfare': { min: 1000000, max: 1800000, typical: 1400000, unitDescription: 'Anganwadi building or SHG training facility' },
  'Skill Development & IT': { min: 1500000, max: 2500000, typical: 2000000, unitDescription: '40-terminal IT computer lab with UPS & networking' },
  'Public Safety & Security': { min: 3000000, max: 5000000, typical: 4000000, unitDescription: '100+ CCTV camera network and control room integration' },
  'Sports & Recreation': { min: 1200000, max: 2200000, typical: 1700000, unitDescription: 'Open outdoor gym with 12 equipment pedestals & walking track' }
};

export interface AppNotification {
  id: string;
  userId?: string;
  targetRole?: UserRole | 'ALL';
  title: string;
  message: string;
  type: 'ALERT' | 'FINANCE' | 'INSPECTION' | 'SYSTEM' | 'RECOMMENDATION';
  read: boolean;
  readBy?: string[];
  createdAt: string;
  link?: string;
}

