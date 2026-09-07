export type UserRole =
  | 'MP'
  | 'ADMIN'
  | 'STATE_NODAL'
  | 'MINISTRY'
  | 'SUPER_ADMIN'
  | 'AGENCY'
  | 'PUBLIC'
  | 'PROJECT_MANAGER'
  | 'VIEWER';

export interface User {
  id: string;
  userId: string;
  name: string;
  role: UserRole;
  designation: string;
  constituency?: string;
  district?: string;
  state?: string;
  agencyId?: string;
  agencyName?: string;
  email?: string;
  phone?: string;
}

export type ProjectStatus =
  | 'Draft'
  | 'Recommended'
  | 'Under Review'
  | 'Feasibility Review'
  | 'Forwarded To State'
  | 'State Approved'
  | 'Forwarded To Ministry'
  | 'Ministry Approved'
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
  | 'Location Mismatch'
  | 'Vendor Cartelization'
  | 'Cost Overrun Risk';

export type AlertStatus =
  | 'New'
  | 'Under Review'
  | 'False Positive'
  | 'Confirmed Anomaly'
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
  gpsDistanceMeters?: number;
  isGpsVerified?: boolean;
  cameraMakeModel?: string;
  cameraModel?: string;
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

export interface MLModelMetadata {
  modelVersion: string;
  algorithm: 'Isolation Forest + Gradient Boosting Ensemble';
  trainedAt: string;
  totalTrainingSamples: number;
  activeFeatures: string[];
  feedbackSamplesCount: number;
  confirmedAnomaliesCount: number;
  falsePositivesCount: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  isRetraining: boolean;
}

export interface MLFeedbackRecord {
  id: string;
  alertId: string;
  projectId: string;
  featureVector: number[];
  label: -1 | 1; // -1 = False Positive, +1 = Confirmed Anomaly
  decisionStatus: AlertStatus;
  reviewedBy: string;
  reviewNotes: string;
  timestamp: string;
}

export interface CostOverrunForecast {
  overrunProbability: number; // 0 - 100%
  projectedCostOverrunAmount: number; // in INR
  projectedCostOverrunLakhs: number;
  projectedFinalCost: number; // in INR
  projectedFinalCostLakhs: number;
  overrunRiskLevel: RiskLevel;
  primaryDrivers: string[];
}

export interface DelayMetrics {
  delayDays: number;
  confidenceScore: number; // e.g. 85%
  marginOfErrorDays: number; // e.g. 14 days
  confidenceInterval: string; // e.g. "85% confidence, ± 14 days"
  confidenceIntervalString?: string;
  modelTrainingStatus: string;
  forecastedCompletionDate?: string;
  dailyVelocityPct?: number;
  scheduledVelocityPct?: number;
  velocityVariancePct?: number;
  costOverrunForecast?: CostOverrunForecast;
  holdoutValidation?: {
    precision: number;
    recall: number;
    f1Score: number;
    accuracy: number;
    sampleSize: number;
    datasetSplit?: string;
    status?: string;
  };
}

export interface CostBaseline {
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
  mlAnomalyProbability?: number;
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
  reasons: string[];
  recommendations: string[];
  disclaimer: string;
  costBaseline?: CostBaseline;
  delayMetrics?: DelayMetrics;
  mlInferenceDetails?: {
    modelType: string;
    isolationScore: number;
    featureContributions: Record<string, number>;
    retrainedFromFeedbackCount: number;
  };
}

export interface ApprovalTransitionRecord {
  id: string;
  projectId: string;
  fromStatus: ProjectStatus;
  toStatus: ProjectStatus;
  transitionedByUserId: string;
  transitionedByRole: UserRole;
  transitionedByName: string;
  authorityLevel: 'MP' | 'DISTRICT_AUTHORITY' | 'STATE_NODAL_AUTHORITY' | 'CENTRAL_MINISTRY';
  sanctionedAmount?: number;
  statutoryRemarks?: string;
  dtecClearanceRef?: string;
  timestamp: string;
}

export interface Project {
  id: string;
  projectCode: string;
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
  isGpsImputed?: boolean;
  estimatedCost: number; // in INR
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
  currentAuthorityQueue?: 'MP' | 'DISTRICT_AUTHORITY' | 'STATE_NODAL_AUTHORITY' | 'CENTRAL_MINISTRY' | 'AGENCY_EXECUTION' | 'COMPLETED';
  riskAnalysis: AiRiskAnalysis;
  photos: ProjectPhoto[];
  documents: ProjectDocument[];
  payments: ProjectPayment[];
  approvalHistory?: ApprovalTransitionRecord[];
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
  notificationDispatched?: boolean;
  notificationChannels?: ('EMAIL' | 'SMS' | 'PUSH')[];
  mlScore?: number;
}

export interface DuplicateProjectCandidate {
  primaryProject: Project;
  candidateProject: Project;
  similarityScore: number; // 0 - 100%
  distanceMeters: number;
  matchingFactors: string[];
  sanctionDateDeltaDays?: number;
  isCrossConstituency?: boolean;
  isCrossMp?: boolean;
  overlappingSanctionWindow?: boolean;
}

export type GrievanceQueue = 'DISTRICT_QUEUE' | 'STATE_QUEUE' | 'MINISTRY_VIGILANCE_QUEUE';

export interface CitizenFeedback {
  id: string;
  trackingNumber?: string;
  projectId: string;
  projectTitle: string;
  projectCode: string;
  district: string;
  state?: string;
  citizenName: string;
  citizenContactMasked?: string;
  issueType: 'Incomplete Work' | 'Incorrect Location' | 'Project Not Found' | 'Damaged Asset' | 'Poor Quality' | 'Other' | 'Substandard Material Quality' | 'Suspected Financial Misappropriation / Incomplete Work' | 'Unexplained Delay in Execution';
  description: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  submittedAt: string;
  status: 'New' | 'Under Review' | 'Verified' | 'Resolved' | 'Rejected';
  routedQueue?: GrievanceQueue;
  priorityLevel?: 'NORMAL' | 'HIGH' | 'VIGILANCE_URGENT';
  slaDeadlineDays?: number;
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

export interface DataQualityReport {
  id: string;
  totalRowsProcessed: number;
  validRowsImported: number;
  skippedRows: { rowIndex: number; reason: string }[];
  gpsCompletenessPct: number;
  sanctionDateCompletenessPct: number;
  vendorPanCompletenessPct: number;
  costValidityPct: number;
  agencyCompletenessPct: number;
  overallDataQualityScore: number; // 0 - 100
  sourceConnector: 'eSAKSHI Webhook' | 'data.gov.in Puller' | 'eSAKSHI Public Export' | 'Manual CSV Overlay';
  importTimestamp: string;
}

export interface NotificationLog {
  id: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH';
  recipient: string;
  recipientRole: UserRole;
  subject: string;
  message: string;
  status: 'DELIVERED' | 'QUEUED' | 'FAILED';
  relatedEntityId: string;
  relatedEntityType: 'Project' | 'RiskAlert' | 'CitizenFeedback';
  dispatchedAt: string;
  gatewayResponseId?: string;
  error?: string;
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
  notificationsDispatchedToday?: number;
  mlModelAccuracyPct?: number;
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
