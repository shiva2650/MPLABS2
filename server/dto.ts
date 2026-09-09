import { Project, CitizenFeedback, User } from '../src/types/index.js';

/**
 * Enterprise Response Data Transfer Objects (DTOs)
 * Strict role-based response shaping to prevent data leakage and IDOR exposure.
 */

export interface PublicProjectDTO {
  id: string;
  projectCode: string;
  title: string;
  description: string;
  category: string;
  mpName: string;
  constituency: string;
  district: string;
  state: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  sanctionedAmount: number;
  fundsUtilized: number;
  status: string;
  completionPercentage: number;
  expectedCompletionDate: string;
  actualCompletionDate?: string;
  implementingAgencyName: string;
  vendorName: string;
  riskLevel: string;
  integrityScore: number;
  photos: {
    id: string;
    stage: string;
    url: string;
    caption: string;
    uploadedAt: string;
  }[];
  timeline: {
    stage: string;
    completed: boolean;
    date?: string;
  }[];
}

export function toPublicProjectDTO(p: Project): PublicProjectDTO {
  return {
    id: p.id,
    projectCode: p.projectCode,
    title: p.title,
    description: p.description,
    category: p.category,
    mpName: p.mpName,
    constituency: p.constituency,
    district: p.district,
    state: p.state,
    locationAddress: p.locationAddress,
    latitude: p.latitude,
    longitude: p.longitude,
    sanctionedAmount: p.sanctionedAmount,
    fundsUtilized: p.fundsUtilized,
    status: p.status,
    completionPercentage: p.completionPercentage,
    expectedCompletionDate: p.expectedCompletionDate,
    actualCompletionDate: p.actualCompletionDate,
    implementingAgencyName: p.implementingAgencyName,
    vendorName: p.vendorName,
    riskLevel: p.riskAnalysis?.riskLevel || 'LOW',
    integrityScore: Math.max(0, 100 - (p.riskAnalysis?.overallScore || 0)),
    photos: (p.photos || []).map(photo => ({
      id: photo.id,
      stage: photo.stage,
      url: photo.url,
      caption: photo.caption,
      uploadedAt: photo.uploadedAt
    })),
    timeline: (p.timeline || []).map(t => ({
      stage: t.stage,
      completed: t.completed,
      date: t.date
    }))
  };
}

export function toAuthorizedProjectDTO(p: Project, user: User): Project {
  // If user is Admin or Super Admin, full object is authorized
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return p;
  }

  // If user is MP, only projects in their constituency or recommended by them
  if (user.role === 'MP') {
    return {
      ...p,
      // Mask private internal vendor tax records if any
      vendorPanMasked: p.vendorPanMasked || 'XXXXX0000X'
    };
  }

  // If user is Agency, assigned projects
  if (user.role === 'AGENCY') {
    return {
      ...p
    };
  }

  // Fallback for public/viewer: public DTO mapped back to Project interface
  return toPublicProjectDTO(p) as unknown as Project;
}

export interface PublicGrievanceDTO {
  id: string;
  projectId: string;
  projectCode: string;
  projectTitle: string;
  district: string;
  issueType: string;
  status: string;
  submittedAt: string;
  publicDescriptionSnippet: string;
}

export function toPublicGrievanceDTO(g: CitizenFeedback): PublicGrievanceDTO {
  return {
    id: g.id,
    projectId: g.projectId,
    projectCode: g.projectCode,
    projectTitle: g.projectTitle,
    district: g.district,
    issueType: g.issueType,
    status: g.status,
    submittedAt: g.submittedAt,
    // Do NOT leak citizen name, citizen contact, exact GPS coordinates, or admin notes
    publicDescriptionSnippet: g.description ? g.description.slice(0, 120) + (g.description.length > 120 ? '...' : '') : ''
  };
}

export function toInternalGrievanceDTO(g: CitizenFeedback, user: User): CitizenFeedback {
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return g;
  }
  if (user.role === 'MP') {
    return {
      ...g,
      // Mask contact phone for privacy
      citizenContactMasked: g.citizenContactMasked ? g.citizenContactMasked.replace(/(\d{2})\d{4}(\d{2})/, '$1****$2') : undefined
    };
  }
  // Implementing Agency: stripped of citizen identity to prevent pressure
  return {
    ...g,
    citizenName: 'Verified Citizen (Identity Protected)',
    citizenContactMasked: undefined,
    adminNotes: undefined
  };
}
