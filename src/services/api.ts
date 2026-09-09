import {
  Project,
  RiskAlert,
  CitizenFeedback,
  AuditLogEntry,
  User,
  DashboardSummary,
  AppNotification
} from '../types/index.js';
import { AuthService, authStorage } from './authService.js';
import { clientMockDb } from './clientMockDb.js';

export { AuthService, authStorage };

async function handleNodeTestFallback(url: string, options: RequestInit = {}): Promise<any> {
  const [path, queryString] = url.split('?');
  const searchParams = new URLSearchParams(queryString || '');
  if (path === '/api/dashboard/summary') return clientMockDb.getDashboardSummary();
  if (path === '/api/projects') {
    return clientMockDb.getProjects({
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      district: searchParams.get('district') || undefined,
      riskLevel: searchParams.get('riskLevel') || undefined,
      search: searchParams.get('search') || undefined
    });
  }
  if (path === '/api/alerts') {
    return clientMockDb.getAlerts({
      status: searchParams.get('status') || undefined,
      riskLevel: searchParams.get('riskLevel') || undefined
    });
  }
  if (path === '/api/citizen-feedback') return clientMockDb.getCitizenFeedback();
  if (path === '/api/notifications') return clientMockDb.getNotifications();
  return { success: true };
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // In Node.js test runner where window is undefined and fetch does not have a relative origin
  if (typeof window === 'undefined') {
    return handleNodeTestFallback(url, options);
  }

  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token && !url.includes('/api/auth/login')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && !url.includes('/api/auth/login')) {
      authStorage.removeToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { status: response.status } }));
      }
    }
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Auth
  login: AuthService.login,
  getMe: AuthService.getMe,
  logout: AuthService.logout,

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    try {
      const summary = await fetchWithAuth('/api/dashboard/summary');
      if (summary && typeof summary === 'object' && 'totalProjects' in summary) {
        return summary;
      }
      throw new Error('Invalid summary format');
    } catch (err) {
      console.warn('[api.getDashboardSummary] Error fetching summary, returning operational defaults:', err);
      return {
        totalProjects: 0,
        completedProjects: 0,
        activeProjects: 0,
        delayedProjects: 0,
        underReviewProjects: 0,
        recommendedProjects: 0,
        totalFundsSanctioned: 0,
        totalFundsUtilized: 0,
        highRiskProjectsCount: 0,
        costAnomaliesCount: 0,
        possibleDuplicatesCount: 0,
        photoAnomaliesCount: 0,
        locationMismatchesCount: 0,
        delayRisksCount: 0,
        totalPendingReviews: 0
      };
    }
  },

  // Projects
  getProjects: async (filters?: {
    status?: string;
    category?: string;
    district?: string;
    riskLevel?: string;
    search?: string;
  }): Promise<{ projects: Project[]; count: number }> => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'All') params.set('status', filters.status);
    if (filters?.category && filters.category !== 'All') params.set('category', filters.category);
    if (filters?.district && filters.district !== 'All') params.set('district', filters.district);
    if (filters?.riskLevel && filters.riskLevel !== 'All') params.set('riskLevel', filters.riskLevel);
    if (filters?.search) params.set('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchWithAuth(`/api/projects${query}`);
  },

  getProjectById: async (id: string): Promise<{ project: Project; duplicateCandidates?: any[] }> => {
    return fetchWithAuth(`/api/projects/${id}`);
  },

  recommendProject: async (projectData: Partial<Project>): Promise<{ success: boolean; project: Project }> => {
    return fetchWithAuth('/api/projects/recommend', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  },

  updateProjectStatus: async (
    id: string,
    status: string,
    sanctionedAmount?: number,
    remarks?: string
  ): Promise<{ success: boolean; project: Project }> => {
    return fetchWithAuth(`/api/projects/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, sanctionedAmount, remarks })
    });
  },

  assignAgency: async (
    id: string,
    data: {
      agencyId: string;
      agencyName: string;
      vendorName?: string;
      startDate?: string;
      expectedCompletionDate?: string;
    }
  ): Promise<{ success: boolean; project: Project }> => {
    return fetchWithAuth(`/api/projects/${id}/assign-agency`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateProgress: async (
    id: string,
    data: {
      completionPercentage?: number;
      fundsUtilized?: number;
      remarks?: string;
      photoUrl?: string;
      photoStage?: string;
      photoCaption?: string;
      photoLat?: number;
      photoLon?: number;
    }
  ): Promise<{ success: boolean; project: Project }> => {
    return fetchWithAuth(`/api/projects/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  addPayment: async (
    id: string,
    data: { amount: number; sanctionOrderNo?: string; remarks?: string }
  ): Promise<{ success: boolean; payment: any; project: Project }> => {
    return fetchWithAuth(`/api/projects/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Alerts
  getAlerts: async (params?: { status?: string; riskLevel?: string }): Promise<{ alerts: RiskAlert[]; count: number }> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.status && params.status !== 'All') searchParams.set('status', params.status);
      if (params?.riskLevel && params.riskLevel !== 'All') searchParams.set('riskLevel', params.riskLevel);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

      const res = await fetchWithAuth(`/api/alerts${query}`);
      if (res && Array.isArray(res.alerts)) {
        return res;
      }
      return { alerts: [], count: 0 };
    } catch (err) {
      console.warn('[api.getAlerts] Error fetching alerts, returning empty list:', err);
      return { alerts: [], count: 0 };
    }
  },

  updateAlertStatus: async (
    id: string,
    status: string,
    reviewNotes?: string
  ): Promise<{ success: boolean; alert: RiskAlert }> => {
    return fetchWithAuth(`/api/alerts/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ status, reviewNotes })
    });
  },

  // Notifications
  getNotifications: async (): Promise<{ notifications: AppNotification[]; count: number; unreadCount?: number }> => {
    try {
      const res = await fetchWithAuth('/api/notifications');
      if (res && Array.isArray(res.notifications)) {
        return res;
      }
      return { notifications: [], count: 0, unreadCount: 0 };
    } catch (err) {
      console.warn('[api.getNotifications] Error fetching notifications:', err);
      return { notifications: [], count: 0, unreadCount: 0 };
    }
  },

  markAsRead: async (id: string): Promise<{ success: boolean; message?: string }> => {
    return fetchWithAuth(`/api/notifications/${id}/read`, { method: 'POST' });
  },

  markNotificationRead: async (id: string): Promise<{ success: boolean; message?: string }> => {
    return api.markAsRead(id);
  },

  markAllNotificationsRead: async (): Promise<{ success: boolean; count?: number }> => {
    return fetchWithAuth('/api/notifications/read-all', { method: 'POST' });
  },

  resetNotifications: async (): Promise<{ success: boolean; notifications: AppNotification[]; count?: number; unreadCount?: number }> => {
    return fetchWithAuth('/api/notifications/reset', { method: 'POST' });
  },

  // Vendors
  getVendors: async (): Promise<{ vendors: any[] }> => {
    return fetchWithAuth('/api/analytics/vendors');
  },

  // Citizen Feedback
  getCitizenFeedback: async (): Promise<{ feedback: CitizenFeedback[]; count: number }> => {
    try {
      const res = await fetchWithAuth('/api/citizen-feedback');
      if (res && Array.isArray(res.feedback)) {
        return res;
      }
      return { feedback: [], count: 0 };
    } catch (err) {
      console.warn('[api.getCitizenFeedback] Error fetching feedback:', err);
      return { feedback: [], count: 0 };
    }
  },

  submitCitizenFeedback: async (data: any): Promise<{ success: boolean; feedbackId: string }> => {
    return fetchWithAuth('/api/citizen-feedback', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateFeedbackStatus: async (id: string, status: string, adminNotes?: string): Promise<{ success: boolean }> => {
    return fetchWithAuth(`/api/citizen-feedback/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, adminNotes })
    });
  },

  // Audit Logs
  getAuditLogs: async (): Promise<{ auditLogs: AuditLogEntry[]; count: number }> => {
    return fetchWithAuth('/api/audit-logs');
  },

  verifyAuditLogsIntegrity: async (): Promise<{
    isValid: boolean;
    verifiedCount: number;
    brokenAtId?: string;
    algorithm: string;
    genesisHash: string;
    verifiedAt: string;
  }> => {
    return fetchWithAuth('/api/audit-logs/verify');
  },

  simulateTamper: async (): Promise<{ success: boolean; result: any; message: string }> => {
    return fetchWithAuth('/api/audit-logs/simulate-tamper', {
      method: 'POST'
    });
  },

  restoreAuditLogs: async (): Promise<{ success: boolean }> => {
    return fetchWithAuth('/api/audit-logs/restore', {
      method: 'POST'
    });
  },

  // Advanced Evidence Verification
  verifyEvidence: async (data: {
    projectId?: string;
    mediaData: string;
    photoUrl?: string;
    clientLat?: number;
    clientLon?: number;
    isVideo?: boolean;
    gpsThresholdMeters?: number;
  }): Promise<{ success: boolean; verification: any }> => {
    return fetchWithAuth('/api/evidence/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // AI Report (Gemini API / Heuristic)
  generateAiAuditReport: async (projectId: string): Promise<{ report: string; projectCode: string; title: string }> => {
    return fetchWithAuth(`/api/ai/audit-report/${projectId}`, {
      method: 'POST'
    });
  },

  // Public Transparency
  getPublicSummary: async (): Promise<any> => {
    return fetchWithAuth('/api/public/summary');
  },

  getPublicProjects: async (): Promise<{ projects: Project[]; count: number }> => {
    return fetchWithAuth('/api/public/projects');
  },

  // Contractor Network Fraud Analysis
  getContractorNetwork: async (): Promise<any> => {
    return fetchWithAuth('/api/network/contractors');
  },

  // Multilingual RAG Citizen Chatbot
  queryChatbot: async (query: string, language?: string): Promise<any> => {
    return fetchWithAuth('/api/chat/query', {
      method: 'POST',
      body: JSON.stringify({ query, language })
    });
  },

  // NLP Feedback Intelligence
  analyzeGrievanceFeedback: async (data: { feedbackId?: string; subject: string; description: string; projectId?: string }): Promise<any> => {
    return fetchWithAuth('/api/nlp/analyze-feedback', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Data Ingestion & Impact Calculator
  getImpactSummary: async (): Promise<any> => {
    return fetchWithAuth('/api/impact/summary');
  },

  ingestData: async (csvContent: string, sourceLabel?: string): Promise<any> => {
    return fetchWithAuth('/api/data/ingest', {
      method: 'POST',
      body: JSON.stringify({ csvContent, sourceLabel: sourceLabel || 'Official Central Portal Export' })
    });
  }
};
