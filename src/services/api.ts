import {
  Project,
  Alert,
  CitizenFeedback,
  AuditLogEntry,
  User,
  VendorAnalytics,
  PhotoVerificationResult
} from '../types/index.ts';

const TOKEN_KEY = 'mplads_auth_token';
const USER_KEY = 'mplads_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const str = localStorage.getItem(USER_KEY);
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

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
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
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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
  const res = await fetch('/api/alerts', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch integrity alerts');
  const data = await res.json();
  return data.alerts || [];
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
  const res = await fetch('/api/analytics/vendors', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch vendor analytics');
  const data = await res.json();
  return data.vendors || [];
}

export async function fetchVendorByName(name: string): Promise<VendorAnalytics> {
  const res = await fetch(`/api/analytics/vendors/${encodeURIComponent(name)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch vendor details');
  const data = await res.json();
  return data.vendor;
}

export async function fetchFeedback(projectId?: string): Promise<CitizenFeedback[]> {
  const url = projectId ? `/api/feedback?projectId=${projectId}` : '/api/feedback';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch citizen feedback');
  const data = await res.json();
  return data.feedback || [];
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
