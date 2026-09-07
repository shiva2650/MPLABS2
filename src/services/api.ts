import {
  Project,
  Alert,
  CitizenFeedback,
  AuditLogEntry,
  User,
  VendorAnalytics,
  PhotoVerificationResult,
  ProjectInspection,
  ProjectDocument,
  SystemNotification
} from '../types/index.ts';
import { INITIAL_NOTIFICATIONS } from '../backend/data/seedInspectionsAndDocuments.ts';

const TOKEN_KEY = 'mplads_auth_token';
const USER_KEY = 'mplads_auth_user';

// In-memory fallback if localStorage is unavailable or blocked in iframe sandbox
const memoryStore: Record<string, string> = {};

function safeStorageGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (err) {
    // Access denied or blocked in iframe
  }
  return memoryStore[key] || null;
}

function safeStorageSet(key: string, val: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, val);
    }
  } catch (err) {
    // Access denied or blocked in iframe
  }
  memoryStore[key] = val;
}

function safeStorageRemove(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    // Access denied or blocked in iframe
  }
  delete memoryStore[key];
}

export function getStoredToken(): string | null {
  return safeStorageGet(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const str = safeStorageGet(USER_KEY);
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function getHeaders(isJson = true) {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginUser(userId: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to authenticate');
  }

  safeStorageSet(TOKEN_KEY, data.token);
  safeStorageSet(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function logoutUser(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getHeaders()
      });
    } catch {
      // Ignore network errors on logout
    }
  }
  safeStorageRemove(TOKEN_KEY);
  safeStorageRemove(USER_KEY);
}

export async function fetchPublicStats(): Promise<{
  allocatedLimit: number;
  worksRecommended: number;
  worksSanctioned: number;
  worksCompleted: number;
  worksOngoing: number;
  totalExpenditure: number;
  sanctionedExpenditure: number;
  updatedAt: string;
}> {
  const res = await fetch('/api/stats/public');
  if (!res.ok) throw new Error('Failed to fetch public stats');
  return res.json();
}

export async function fetchMpStats(): Promise<any[]> {
  const res = await fetch('/api/stats/mps');
  if (!res.ok) throw new Error('Failed to fetch MP statistics');
  const data = await res.json();
  return data.mps || [];
}

export async function fetchProjects(filters?: Record<string, string>): Promise<Project[]> {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== 'All') params.append(k, v);
    });
  }

  const url = `/api/projects?${params.toString()}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch projects');
  const data = await res.json();
  return data.projects || [];
}

export async function fetchProjectById(id: string): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch project details');
  const data = await res.json();
  return data.project;
}

export async function recommendNewWork(payload: {
  title: string;
  description: string;
  category: string;
  estimatedCost: number;
  latitude: number;
  longitude: number;
  locationAddress: string;
}): Promise<Project> {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit recommendation');
  return data.project;
}

export async function updateProjectStatus(
  id: string,
  payload: {
    status: string;
    sanctionedCost?: number;
    agencyId?: string;
    agencyName?: string;
    vendorName?: string;
    notes?: string;
  }
): Promise<Project> {
  const res = await fetch(`/api/projects/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update project status');
  return data.project;
}

export async function updateProjectProgress(
  id: string,
  payload: { percentage: number; description: string }
): Promise<Project> {
  const res = await fetch(`/api/projects/${id}/progress`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update progress');
  return data.project;
}

export async function recordProjectExpenditure(
  id: string,
  payload: { amount: number; installmentNo?: number; sanctionOrderNo?: string }
): Promise<Project> {
  const res = await fetch(`/api/projects/${id}/expenditure`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to record expenditure');
  return data.project;
}

export async function verifyPhotoUpload(
  formDataOrBase64: FormData | { imageBase64: string; projectId: string; stage?: string; notes?: string }
): Promise<PhotoVerificationResult> {
  let res: globalThis.Response;
  if (formDataOrBase64 instanceof FormData) {
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    res = await fetch('/api/verify/photo', {
      method: 'POST',
      headers,
      body: formDataOrBase64
    });
  } else {
    res = await fetch('/api/verify/photo', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(formDataOrBase64)
    });
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Photo verification failed');
  return data.verification;
}

export async function fetchTestPhotoSamples(): Promise<{
  targetProject: { id: string; workId: string; title: string; latitude: number; longitude: number };
  samples: Array<{
    id: string;
    name: string;
    description: string;
    result: PhotoVerificationResult;
  }>;
}> {
  const res = await fetch('/api/verify/test-samples');
  if (!res.ok) throw new Error('Failed to fetch sample verification tests');
  return res.json();
}

export async function fetchAlerts(): Promise<Alert[]> {
  const token = getStoredToken();
  if (!token) return [];
  try {
    const res = await fetch('/api/alerts', { headers: getHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.alerts || [];
  } catch {
    return [];
  }
}

export async function reviewAlert(
  id: string,
  payload: { status: string; reviewNotes: string }
): Promise<Alert> {
  const res = await fetch(`/api/alerts/${id}/review`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update alert');
  return data.alert;
}

export async function fetchVendorAnalytics(): Promise<VendorAnalytics[]> {
  const token = getStoredToken();
  if (!token) return [];
  try {
    const res = await fetch('/api/analytics/vendors', { headers: getHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.vendors || [];
  } catch {
    return [];
  }
}

export async function fetchVendorByName(name: string): Promise<VendorAnalytics> {
  const res = await fetch(`/api/analytics/vendors/${encodeURIComponent(name)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch vendor details');
  const data = await res.json();
  return data.vendor;
}

export async function fetchFeedback(projectId?: string): Promise<CitizenFeedback[]> {
  const token = getStoredToken();
  if (!token) return [];
  try {
    const url = projectId ? `/api/feedback?projectId=${projectId}` : '/api/feedback';
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.feedback || [];
  } catch {
    return [];
  }
}

export async function submitCitizenFeedback(payload: {
  projectId: string;
  issueType: string;
  citizenName: string;
  contactEmail?: string;
  comments: string;
  photoUrl?: string;
}): Promise<CitizenFeedback> {
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit grievance');
  return data.feedback;
}

export async function fetchAuditLogs(projectId?: string): Promise<AuditLogEntry[]> {
  const url = projectId ? `/api/audit-logs?projectId=${projectId}` : '/api/audit-logs';
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  const data = await res.json();
  return data.logs || [];
}

export async function queryAiAssistant(query: string): Promise<{
  answer: string;
  sourceCount: number;
  role: string;
  suggestedFollowups?: string[];
}> {
  const res = await fetch('/api/ai/assistant', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'AI Assistant service unavailable');
  return data;
}

export async function fetchInspections(projectId?: string): Promise<ProjectInspection[]> {
  const url = projectId ? `/api/inspections?projectId=${projectId}` : '/api/inspections';
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch inspections');
  const data = await res.json();
  return data.inspections || [];
}

export async function scheduleInspection(payload: {
  projectId: string;
  scheduledDate: string;
  inspectingOfficer?: string;
  officerDesignation?: string;
}): Promise<ProjectInspection> {
  const res = await fetch('/api/inspections', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to schedule inspection');
  return data.inspection;
}

export async function recordInspectionFindings(
  id: string,
  payload: {
    result: string;
    observations: string;
    recommendations: string;
    checklist?: any[];
    photos?: string[];
    complianceNotes?: string;
  }
): Promise<ProjectInspection> {
  const res = await fetch(`/api/inspections/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to record inspection findings');
  return data.inspection;
}

export async function fetchProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
  const res = await fetch(`/api/projects/${projectId}/documents`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch documents');
  const data = await res.json();
  return data.documents || [];
}

export async function uploadProjectDocument(
  projectId: string,
  payload: {
    documentType: string;
    title: string;
    fileName?: string;
    fileUrl?: string;
    fileSize?: string;
    notes?: string;
  }
): Promise<ProjectDocument> {
  const res = await fetch(`/api/projects/${projectId}/documents`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload document');
  return data.document;
}

export async function verifyProjectDocument(
  id: string,
  payload: { verificationStatus: 'Verified' | 'Flagged' | 'Pending'; notes?: string }
): Promise<ProjectDocument> {
  const res = await fetch(`/api/documents/${id}/verify`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to verify document');
  return data.document;
}

export async function trackGrievance(grievanceId: string): Promise<{
  grievance: CitizenFeedback;
  project?: {
    workId: string;
    title: string;
    category: string;
    status: string;
    state: string;
    district: string;
    mpName: string;
  };
}> {
  const res = await fetch(`/api/feedback/track/${encodeURIComponent(grievanceId)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Grievance record not found');
  return data;
}

export async function updateGrievanceStatus(
  id: string,
  payload: {
    status: string;
    assignedOfficer?: string;
    investigationRemarks?: string;
    actionTaken?: string;
  }
): Promise<CitizenFeedback> {
  const res = await fetch(`/api/feedback/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update grievance status');
  return data.feedback;
}

export async function fetchNotifications(): Promise<SystemNotification[]> {
  const CACHE_KEY = 'mplads_cached_notifications';

  // Try fetching with auto-retry in case dev server is restarting or network glitched
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('/api/notifications', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list = data.notifications || [];
        safeStorageSet(CACHE_KEY, JSON.stringify(list));
        return list;
      }
    } catch {
      if (attempt === 0) {
        // Wait 400ms before retry
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }
  }

  // Gracefully fallback to cached notifications or initial seed
  const cached = safeStorageGet(CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  return INITIAL_NOTIFICATIONS;
}

export async function markNotificationRead(id: string): Promise<void> {
  const CACHE_KEY = 'mplads_cached_notifications';
  try {
    const cached = safeStorageGet(CACHE_KEY);
    if (cached) {
      try {
        const list = JSON.parse(cached);
        if (Array.isArray(list)) {
          const updated = list.map((n: SystemNotification) => (n.id === id ? { ...n, isRead: true } : n));
          safeStorageSet(CACHE_KEY, JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
    }
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT', headers: getHeaders() });
  } catch {
    // Graceful offline handling
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const CACHE_KEY = 'mplads_cached_notifications';
  try {
    const cached = safeStorageGet(CACHE_KEY);
    if (cached) {
      try {
        const list = JSON.parse(cached);
        if (Array.isArray(list)) {
          const updated = list.map((n: SystemNotification) => ({ ...n, isRead: true }));
          safeStorageSet(CACHE_KEY, JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
    }
    await fetch('/api/notifications/read-all', { method: 'PUT', headers: getHeaders() });
  } catch {
    // Graceful offline handling
  }
}

