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
import { apiUrl, isStaticDeployment } from './apiConfig.js';
import { clientMockDb } from './clientMockDb.js';

export { AuthService, authStorage };

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token && !url.includes('/api/auth/login')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(apiUrl(url), { ...options, headers });
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
    if (isStaticDeployment()) return clientMockDb.getDashboardSummary();
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
    if (isStaticDeployment()) return clientMockDb.getProjects(filters || {});
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
    if (isStaticDeployment()) {
      const project = await clientMockDb.getProjectById(id);
      return { project, duplicateCandidates: [] };
    }
    return fetchWithAuth(`/api/projects/${id}`);
  },

  recommendProject: async (projectData: Partial<Project>): Promise<{ success: boolean; project: Project }> => {
    if (isStaticDeployment()) {
      const res = await clientMockDb.recommendProject(projectData as any);
      return { success: true, project: res.project };
    }
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
    if (isStaticDeployment()) {
      const res = await clientMockDb.updateProjectStatus(id, { status: status as any, sanctionedAmount, remarks });
      return { success: true, project: res.project };
    }
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
    if (isStaticDeployment()) {
      const res = await clientMockDb.assignAgency(id, {
        agencyId: data.agencyId,
        agencyName: data.agencyName,
        expectedCompletionDate: data.expectedCompletionDate || ''
      });
      return { success: true, project: res.project };
    }
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
    if (isStaticDeployment()) {
      const res = await clientMockDb.updateProgress(id, {
        completionPercentage: Number(data.completionPercentage ?? 0),
        photoUrl: data.photoUrl,
        caption: data.photoCaption,
        stage: (data.photoStage as any) || 'during'
      });
      return { success: true, project: res.project };
    }
    return fetchWithAuth(`/api/projects/${id}/progress`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  addPayment: async (
    id: string,
    data: { amount: number; sanctionOrderNo?: string; remarks?: string }
  ): Promise<{ success: boolean; payment: any; project: Project }> => {
    if (isStaticDeployment()) {
      const current = await clientMockDb.getProjectById(id);
      const installmentNo = Number((current.payments?.length || 0) + 1);
      const res = await clientMockDb.addPayment(id, {
        installmentNo,
        amount: Number(data.amount || 0),
        sanctionOrderNo: data.sanctionOrderNo || 'STATIC-DEMO'
      });
      return { success: true, payment: res.project.payments[res.project.payments.length - 1], project: res.project };
    }
    return fetchWithAuth(`/api/projects/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Alerts
  getAlerts: async (params?: { status?: string; riskLevel?: string }): Promise<{ alerts: RiskAlert[]; count: number }> => {
    if (isStaticDeployment()) return clientMockDb.getAlerts(params || {});
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
    if (isStaticDeployment()) {
      const res = await clientMockDb.actionAlert(id, { action: status, notes: reviewNotes });
      return { success: true, alert: res.alert };
    }
    return fetchWithAuth(`/api/alerts/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ status, reviewNotes })
    });
  },

  // Notifications
  getNotifications: async (): Promise<{ notifications: AppNotification[]; count: number; unreadCount?: number }> => {
    if (isStaticDeployment()) return clientMockDb.getNotifications();
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
    if (isStaticDeployment()) return clientMockDb.markAsRead(id);
    return fetchWithAuth(`/api/notifications/${id}/read`, { method: 'POST' });
  },

  markNotificationRead: async (id: string): Promise<{ success: boolean; message?: string }> => {
    return api.markAsRead(id);
  },

  markAllNotificationsRead: async (): Promise<{ success: boolean; count?: number }> => {
    if (isStaticDeployment()) return clientMockDb.markAllNotificationsRead();
    return fetchWithAuth('/api/notifications/read-all', { method: 'POST' });
  },

  resetNotifications: async (): Promise<{ success: boolean; notifications: AppNotification[]; count?: number; unreadCount?: number }> => {
    if (isStaticDeployment()) return clientMockDb.resetNotifications();
    return fetchWithAuth('/api/notifications/reset', { method: 'POST' });
  },

  // Vendors
  getVendors: async (): Promise<{ vendors: any[] }> => {
    if (isStaticDeployment()) {
      const projects = (await clientMockDb.getProjects()).projects;
      const map = new Map<string, any>();
      projects.forEach(p => {
        const name = p.vendorName || 'Unassigned';
        const existing = map.get(name) || { vendorName: name, projectCount: 0, totalValue: 0, delayedCount: 0, highRiskCount: 0 };
        existing.projectCount += 1;
        existing.totalValue += Number(p.sanctionedAmount || 0);
        if (p.status === 'Delayed') existing.delayedCount += 1;
        if ((p.riskAnalysis?.overallScore || 0) > 60) existing.highRiskCount += 1;
        map.set(name, existing);
      });
      return { vendors: Array.from(map.values()) };
    }
    return fetchWithAuth('/api/analytics/vendors');
  },

  // Citizen Feedback
  getCitizenFeedback: async (): Promise<{ feedback: CitizenFeedback[]; count: number }> => {
    if (isStaticDeployment()) return clientMockDb.getCitizenFeedback();
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
    if (isStaticDeployment()) {
      const res = await clientMockDb.submitCitizenFeedback(data);
      return { success: true, feedbackId: res.feedback.id };
    }
    return fetchWithAuth('/api/citizen-feedback', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateFeedbackStatus: async (id: string, status: string, adminNotes?: string): Promise<{ success: boolean }> => {
    if (isStaticDeployment()) { await clientMockDb.updateFeedbackStatus(id, status as any, adminNotes); return { success: true }; }
    return fetchWithAuth(`/api/citizen-feedback/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, adminNotes })
    });
  },

  // Audit Logs
  getAuditLogs: async (): Promise<{ auditLogs: AuditLogEntry[]; count: number }> => {
    if (isStaticDeployment()) { const res = await clientMockDb.getAuditLogs(); return { auditLogs: res.logs, count: res.count }; }
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
    if (isStaticDeployment()) {
      const res = await clientMockDb.getAuditLogs();
      return { isValid: true, verifiedCount: res.logs.length, algorithm: 'SHA-256 chain', genesisHash: 'GENESIS_MPLADS_AUDIT_BLOCK_000000', verifiedAt: new Date().toISOString() };
    }
    return fetchWithAuth('/api/audit-logs/verify');
  },

  simulateTamper: async (): Promise<{ success: boolean; result: any; message: string }> => {
    if (isStaticDeployment()) {
      return { success: true, result: { simulated: true }, message: 'Static demo mode: tamper simulation is local-only.' };
    }
    return fetchWithAuth('/api/audit-logs/simulate-tamper', {
      method: 'POST'
    });
  },

  restoreAuditLogs: async (): Promise<{ success: boolean }> => {
    if (isStaticDeployment()) return { success: true };
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
    if (isStaticDeployment()) {
      if (!data.projectId) throw new Error('Project ID is required for static verification.');
      const project = await clientMockDb.getProjectById(data.projectId);
      return { success: true, verification: { status: 'VERIFIED', confidence: 75, projectId: project.id, message: 'Demo-mode evidence check completed against the selected project.' } };
    }
    return fetchWithAuth('/api/evidence/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // AI Report (Gemini API / Heuristic)
  generateAiAuditReport: async (projectId: string): Promise<{ report: string; projectCode: string; title: string }> => {
    if (isStaticDeployment()) {
      const report = await clientMockDb.generateAiAuditReport(projectId);
      return { report: JSON.stringify(report, null, 2), projectCode: report.projectCode, title: report.title };
    }
    return fetchWithAuth(`/api/ai/audit-report/${projectId}`, {
      method: 'POST'
    });
  },

  // Public Transparency
  getPublicSummary: async (): Promise<any> => {
    if (isStaticDeployment()) return clientMockDb.getPublicSummary();
    return fetchWithAuth('/api/public/summary');
  },

  getPublicProjects: async (): Promise<{ projects: Project[]; count: number }> => {
    if (isStaticDeployment()) return clientMockDb.getPublicProjects();
    return fetchWithAuth('/api/public/projects');
  },

  // Contractor Network Fraud Analysis
  getContractorNetwork: async (): Promise<any> => {
    if (isStaticDeployment()) {
      const projects = (await clientMockDb.getProjects()).projects;
      const byVendor = new Map<string, any>();
      projects.forEach(p => {
        const name = p.vendorName || 'Unassigned';
        const e = byVendor.get(name) || { contractorName: name, projects: 0, totalValue: 0, districts: new Set<string>() };
        e.projects += 1; e.totalValue += Number(p.sanctionedAmount || 0); e.districts.add(p.district); byVendor.set(name, e);
      });
      return { contractors: Array.from(byVendor.values()).map((e: any) => ({ ...e, districts: Array.from(e.districts) })) };
    }
    return fetchWithAuth('/api/network/contractors');
  },

  // Multilingual RAG Citizen Chatbot
  queryChatbot: async (query: string, language?: string): Promise<any> => {
    if (isStaticDeployment()) {
      const { projects } = await clientMockDb.getProjects();
      const q = query.toLowerCase();
      let matched = projects;
      if (q.includes('delay')) matched = projects.filter(p => p.status === 'Delayed');
      else if (q.includes('risk')) matched = projects.filter(p => (p.riskAnalysis?.overallScore || 0) > 60);
      else if (q.includes('completed')) matched = projects.filter(p => p.status === 'Completed');
      const top = matched.slice(0, 5);
      const response = top.length
        ? top.map(p => `${p.projectCode}: ${p.title} — ${p.status}, risk ${p.riskAnalysis.overallScore}/100, progress ${p.completionPercentage}%`).join('\n')
        : (language === 'hi' ? 'कोई संबंधित परियोजना नहीं मिली।' : 'No matching projects found.');
      return { answer: language === 'hi' ? `स्थैतिक प्रदर्शन मोड में उपलब्ध डेटा के आधार पर:\n${response}` : `Based on the available static demo data:\n${response}`, projects: top, staticMode: true };
    }
    return fetchWithAuth('/api/chat/query', {
      method: 'POST',
      body: JSON.stringify({ query, language })
    });
  },

  // NLP Feedback Intelligence
  analyzeGrievanceFeedback: async (data: { feedbackId?: string; subject: string; description: string; projectId?: string }): Promise<any> => {
    if (isStaticDeployment()) {
      const text = `${data.subject} ${data.description}`.toLowerCase();
      const category = text.includes('quality') ? 'Poor Quality' : text.includes('delay') ? 'Delayed Work' : 'General Grievance';
      return { success: true, category, sentiment: 'neutral', priority: text.includes('urgent') || text.includes('danger') ? 'high' : 'normal', staticMode: true };
    }
    return fetchWithAuth('/api/nlp/analyze-feedback', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Data Ingestion & Impact Calculator
  getImpactSummary: async (): Promise<any> => {
    if (isStaticDeployment()) {
      const summary = await clientMockDb.getPublicSummary();
      return { ...summary, staticMode: true };
    }
    return fetchWithAuth('/api/impact/summary');
  },

  ingestData: async (csvContent: string, sourceLabel?: string): Promise<any> => {
    if (isStaticDeployment()) {
      const rows = csvContent.split(/\r?\n/).filter(Boolean).length - 1;
      return { success: true, importedRows: Math.max(0, rows), sourceLabel: sourceLabel || 'Static demo import', staticMode: true };
    }
    return fetchWithAuth('/api/data/ingest', {
      method: 'POST',
      body: JSON.stringify({ csvContent, sourceLabel: sourceLabel || 'Official Central Portal Export' })
    });
  }
};
