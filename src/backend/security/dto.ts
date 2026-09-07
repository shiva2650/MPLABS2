import {
  Project,
  Alert,
  CitizenFeedback,
  VendorAnalytics,
  ProjectInspection,
  ProjectDocument,
  User,
  ProjectPhoto,
  ProjectPayment,
  MilestoneProgress,
  ProjectTimelineEvent
} from '../../types/index.ts';

// 1. PUBLIC PROJECT DTO
export interface PublicProjectDTO {
  id: string;
  workId: string;
  title: string;
  description: string;
  category: string;
  sector: string;
  house: string;
  mpName: string;
  state: string;
  district: string;
  constituency: string;
  financialYear: string;
  estimatedCost: number;
  sanctionedCost: number;
  utilizedCost: number;
  status: string;
  latitude: number;
  longitude: number;
  locationAddress: string;
  agencyName: string;
  completionPercentage: number;
  riskLevel: string; // High-level categorical label only
  recommendedDate: string;
  sanctionDate?: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  photos: {
    id: string;
    url: string;
    stage: string;
    uploadedAt: string;
    exifStatus?: string;
  }[];
  timeline?: ProjectTimelineEvent[];
}

export function toPublicProjectDTO(p: Project): PublicProjectDTO {
  return {
    id: p.id,
    workId: p.workId,
    title: p.title,
    description: p.description,
    category: p.category,
    sector: p.sector,
    house: p.house,
    mpName: p.mpName,
    state: p.state,
    district: p.district,
    constituency: p.constituency,
    financialYear: p.financialYear,
    estimatedCost: p.estimatedCost,
    sanctionedCost: p.sanctionedCost,
    utilizedCost: p.utilizedCost,
    status: p.status,
    latitude: p.latitude,
    longitude: p.longitude,
    locationAddress: p.locationAddress,
    agencyName: p.agencyName,
    completionPercentage: p.completionPercentage,
    riskLevel: p.riskLevel,
    recommendedDate: p.recommendedDate,
    sanctionDate: p.sanctionDate,
    expectedCompletionDate: p.expectedCompletionDate,
    actualCompletionDate: p.actualCompletionDate,
    // Only verified photos are visible to the public
    photos: (p.photos || [])
      .filter((ph) => ph.exifStatus === 'Verified')
      .map((ph) => ({
        id: ph.id,
        url: ph.url,
        stage: ph.stage,
        uploadedAt: ph.uploadedAt,
        exifStatus: ph.exifStatus
      })),
    timeline: p.timeline || []
  };
}

// 2. MP PROJECT DTO (Constituency-Scoped)
export interface MPProjectDTO extends Project {
  // Retains full project details for the MP's constituency
}

export function toMPProjectDTO(p: Project): MPProjectDTO {
  return {
    ...p,
    // Ensure timeline is present
    timeline: p.timeline || []
  };
}

// 3. AGENCY PROJECT DTO (Assigned-Scoped)
export interface AgencyProjectDTO extends Project {
  // Retains execution, payments, progress, inspections for the assigned agency
}

export function toAgencyProjectDTO(p: Project): AgencyProjectDTO {
  return {
    ...p,
    timeline: p.timeline || []
  };
}

// 4. ADMIN PROJECT DTO (Full Administrative Oversight)
export type AdminProjectDTO = Project;

export function toAdminProjectDTO(p: Project): AdminProjectDTO {
  return p;
}

// 5. CITIZEN GRIEVANCE DTOs
export interface PublicGrievanceTrackingDTO {
  id: string;
  grievanceId: string;
  workId: string;
  projectTitle: string;
  issueType: string;
  status: string;
  actionTaken?: string;
  createdAt: string;
  resolvedAt?: string;
}

export function toPublicGrievanceTrackingDTO(f: CitizenFeedback): PublicGrievanceTrackingDTO {
  return {
    id: f.id,
    grievanceId: f.grievanceId || f.id,
    workId: f.workId,
    projectTitle: f.projectTitle,
    issueType: f.issueType,
    status: f.status,
    actionTaken: f.actionTaken,
    createdAt: f.createdAt,
    resolvedAt: f.resolvedAt
  };
}

// Internal grievance DTO with PII masked if viewer is not Admin
export interface ScopedGrievanceDTO extends CitizenFeedback {}

export function toScopedGrievanceDTO(f: CitizenFeedback, user: User): ScopedGrievanceDTO {
  if (user.role === 'admin') {
    return f;
  }
  // For MP or Agency, mask direct phone and email to prevent PII harvesting
  return {
    ...f,
    contactEmail: f.contactEmail ? maskEmail(f.contactEmail) : undefined,
    contactPhone: f.contactPhone ? maskPhone(f.contactPhone) : undefined
  };
}

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***@nic.in';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length <= 2 ? `${name[0]}*` : `${name.slice(0, 2)}***${name.slice(-1)}`;
  return `${maskedName}@${domain}`;
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return '******';
  return `******${phone.slice(-4)}`;
}

// 6. SCOPED VENDOR ANALYTICS DTO
export function toScopedVendorDTO(v: VendorAnalytics, user?: User): VendorAnalytics {
  if (!user || user.role === 'citizen') {
    // Basic public aggregation
    return {
      vendorName: v.vendorName,
      agencyName: v.agencyName,
      sectors: v.sectors,
      totalProjects: v.totalProjects,
      activeProjects: v.activeProjects,
      completedProjects: v.completedProjects,
      delayedProjects: v.delayedProjects,
      highRiskProjects: v.highRiskProjects,
      totalValue: v.totalValue,
      utilizedValue: v.utilizedValue,
      completionRate: v.completionRate,
      delayRate: v.delayRate,
      avgCompletionDelayDays: v.avgCompletionDelayDays,
      avgCompletionDays: v.avgCompletionDays,
      avgRiskScore: v.avgRiskScore,
      riskLevel: v.riskLevel,
      suitabilityStatus: v.suitabilityStatus,
      suitabilityReason: v.suitabilityReason,
      aiRiskHistory: [], // Strip internal risk flags from public
      projects: v.projects.map((p) => ({
        ...p,
        riskScore: 0 // Hide internal risk scores
      }))
    };
  }

  if (user.role === 'agency') {
    // Agency only sees projects linked to their agency
    return {
      ...v,
      projects: v.projects.filter((p) => p.agencyName === user.agencyName || user.userId === 'AGENCY001')
    };
  }

  // Admin and MP get full authorized analytics
  return v;
}
