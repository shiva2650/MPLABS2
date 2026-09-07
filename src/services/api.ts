import {
  Project,
  UserProfile,
  AnomalyAlert,
  CitizenFeedback,
  AuditLogEntry,
  VendorAnalyticsSummary,
} from '../types';

const TOKEN_KEY = 'mplads_auth_token';
const USER_KEY = 'mplads_auth_user';

export class ApiService {
  private static getHeaders(): HeadersInit {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Auth Methods
  static getCurrentUser(): UserProfile | null {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  static async login(userId: string, password: string): Promise<UserProfile> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Invalid credentials');
    }

    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  static async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Public portal stats
  static async getPublicSummaryStats(): Promise<{
    allocatedLimitLakhs: number;
    worksRecommended: number;
    worksSanctioned: number;
    worksCompleted: number;
    worksOngoing: number;
    totalSanctionedCostLakhs: number;
    totalExpenditureLakhs: number;
    utilizationRatePercent: number;
  }> {
    const res = await fetch('/api/public/summary-stats');
    if (!res.ok) throw new Error('Failed to fetch summary stats');
    return res.json();
  }

  static async getMPSummary(house?: string, state?: string, search?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (house) params.append('house', house);
    if (state) params.append('state', state);
    if (search) params.append('search', search);

    const res = await fetch(`/api/public/mp-summary?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch MP summary');
    const json = await res.json();
    return json.data || [];
  }

  // Projects
  static async getProjects(filters: Record<string, string> = {}): Promise<Project[]> {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(filters)) {
      if (val && val !== 'ALL') params.append(key, val);
    }

    const res = await fetch(`/api/projects?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    const json = await res.json();
    return json.projects || [];
  }

  static async getProjectById(id: string): Promise<Project> {
    const res = await fetch(`/api/projects/${id}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch project details');
    const json = await res.json();
    return json.project;
  }

  static async recommendWork(payload: Partial<Project>): Promise<Project> {
    const res = await fetch('/api/projects/recommend', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to recommend work' }));
      throw new Error(err.error);
    }
    const json = await res.json();
    return json.project;
  }

  static async sanctionProject(
    id: string,
    action: 'APPROVE' | 'REJECT',
    sanctionedCostLakhs?: number,
    remarks?: string
  ): Promise<Project> {
    const res = await fetch(`/api/projects/${id}/sanction`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action, sanctionedCostLakhs, remarks }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Action failed' }));
      throw new Error(err.error);
    }
    const json = await res.json();
    return json.project;
  }

  static async assignAgency(
    id: string,
    agencyId: string,
    agencyName: string,
    vendorName?: string
  ): Promise<Project> {
    const res = await fetch(`/api/projects/${id}/assign-agency`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ agencyId, agencyName, vendorName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Agency assignment failed' }));
      throw new Error(err.error);
    }
    const json = await res.json();
    return json.project;
  }

  static async updateProgress(
    id: string,
    progressPercentage: number,
    stageNotes?: string,
    expenditureAdditionLakhs?: number
  ): Promise<Project> {
    const res = await fetch(`/api/projects/${id}/progress`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ progressPercentage, stageNotes, expenditureAdditionLakhs }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update progress' }));
      throw new Error(err.error);
    }
    const json = await res.json();
    return json.project;
  }

  static async uploadPhoto(
    projectId: string,
    file: File,
    caption: string,
    stage: string,
    simulationOverride?: string
  ): Promise<any> {
    const token = localStorage.getItem(TOKEN_KEY);
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('caption', caption);
    formData.append('stage', stage);
    if (simulationOverride) {
      formData.append('simulationOverride', simulationOverride);
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/projects/${projectId}/upload-photo`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Photo upload failed' }));
      throw new Error(err.error);
    }

    return res.json();
  }

  // Alerts & Review
  static async getAlerts(filters: Record<string, string> = {}): Promise<AnomalyAlert[]> {
    try {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) {
        if (v && v !== 'ALL') params.append(k, v);
      }

      const res = await fetch(`/api/alerts?${params.toString()}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        console.warn(`Alerts endpoint returned status ${res.status}`);
        return [];
      }
      const json = await res.json();
      return json.alerts || [];
    } catch (err) {
      console.warn('Failed to fetch alerts, returning fallback:', err);
      return [];
    }
  }

  static async reviewAlert(
    alertId: string,
    newStatus: string,
    remarks: string,
    assignedOfficer?: string
  ): Promise<AnomalyAlert> {
    const res = await fetch(`/api/alerts/${alertId}/review`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ newStatus, remarks, assignedOfficer }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Alert review action failed' }));
      throw new Error(err.error);
    }
    const json = await res.json();
    return json.alert;
  }

  // Citizen Feedback
  static async getFeedback(projectId?: string): Promise<CitizenFeedback[]> {
    const url = projectId ? `/api/feedback?projectId=${projectId}` : '/api/feedback';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch feedback');
    const json = await res.json();
    return json.feedback || [];
  }

  static async submitFeedback(payload: Partial<CitizenFeedback>): Promise<CitizenFeedback> {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Submission failed' }));
      throw new Error(err.error);
    }
    const json = await res.json();
    return json.feedback;
  }

  // Vendors
  static async getVendorAnalytics(): Promise<VendorAnalyticsSummary[]> {
    const res = await fetch('/api/vendors/analytics', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch vendor analytics');
    const json = await res.json();
    return json.vendors || [];
  }

  // Audit logs
  static async getAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await fetch('/api/audit-logs', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    const json = await res.json();
    return json.logs || [];
  }

  // Automated Test Suite runner
  static async runVerificationTests(): Promise<any> {
    const res = await fetch('/api/test-verification');
    if (!res.ok) throw new Error('Failed to run verification tests');
    return res.json();
  }
}
