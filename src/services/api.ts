import {
  Project,
  RiskAlert,
  CitizenFeedback,
  AuditLogEntry,
  User,
  DashboardSummary,
  DuplicateProjectCandidate,
  MLModelMetadata,
  DataQualityReport,
  NotificationLog,
  ProjectStatus
} from '../types/index.js';
import { AuthService, authStorage } from './authService.js';
import { clientMockDb } from './clientMockDb.js';

export { AuthService, authStorage };

const isStaticDeployment = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname.endsWith('github.io') ||
    window.location.hostname.includes('githubpreview.dev') ||
    window.location.protocol === 'file:' ||
    (window as any).__FORCE_STATIC_MOCK__ === true
  );
};

async function handleFallbackRoute(url: string, options: RequestInit = {}): Promise<any> {
  const method = (options.method || 'GET').toUpperCase();
  const parsedBody = options.body ? JSON.parse(options.body as string) : {};
  const [path, queryString] = url.split('?');
  const searchParams = new URLSearchParams(queryString || '');

  if (path === '/api/dashboard/summary') {
    return clientMockDb.getDashboardSummary();
  }
  if (path === '/api/projects') {
    return clientMockDb.getProjects({
      status: searchParams.get('status') || undefined,
      category: searchParams.get('category') || undefined,
      district: searchParams.get('district') || undefined,
      riskLevel: searchParams.get('riskLevel') || undefined,
      search: searchParams.get('search') || undefined
    });
  }
  if (path === '/api/projects/recommend') {
    return clientMockDb.recommendProject(parsedBody);
  }

  const transitionMatch = path.match(/^\/api\/projects\/([^/]+)\/transition$/);
  if (transitionMatch) {
    return clientMockDb.transitionProject(transitionMatch[1], parsedBody);
  }

  const statusMatch = path.match(/^\/api\/projects\/([^/]+)\/status$/);
  if (statusMatch) {
    return clientMockDb.updateProjectStatus(statusMatch[1], parsedBody);
  }
  const assignMatch = path.match(/^\/api\/projects\/([^/]+)\/assign-agency$/);
  if (assignMatch) {
    return clientMockDb.assignAgency(assignMatch[1], parsedBody);
  }
  const progressMatch = path.match(/^\/api\/projects\/([^/]+)\/progress$/);
  if (progressMatch) {
    return clientMockDb.updateProgress(progressMatch[1], parsedBody);
  }
  const paymentsMatch = path.match(/^\/api\/projects\/([^/]+)\/payments$/);
  if (paymentsMatch) {
    return clientMockDb.addPayment(paymentsMatch[1], parsedBody);
  }

  // Real Duplicate Candidates returned in project detail
  const projectDetailMatch = path.match(/^\/api\/projects\/([^/]+)$/);
  if (projectDetailMatch) {
    return clientMockDb.getProjectWithDuplicates(projectDetailMatch[1]);
  }

  if (path === '/api/alerts') {
    return clientMockDb.getAlerts({
      status: searchParams.get('status') || undefined,
      riskLevel: searchParams.get('riskLevel') || undefined
    });
  }
  const alertActionMatch = path.match(/^\/api\/alerts\/([^/]+)\/action$/);
  if (alertActionMatch) {
    return clientMockDb.actionAlert(alertActionMatch[1], parsedBody);
  }

  if (path === '/api/ml/model-status') {
    return clientMockDb.getMLModelStatus();
  }
  if (path === '/api/ml/retrain') {
    return clientMockDb.retrainMLModel();
  }

  if (path === '/api/citizen-feedback') {
    if (method === 'POST') {
      return clientMockDb.submitCitizenFeedback(parsedBody);
    }
    return clientMockDb.getCitizenFeedback();
  }
  const feedbackStatusMatch = path.match(/^\/api\/citizen-feedback\/([^/]+)\/status$/);
  if (feedbackStatusMatch) {
    return clientMockDb.updateFeedbackStatus(feedbackStatusMatch[1], parsedBody.status, parsedBody.adminNotes);
  }

  if (path === '/api/data/quality-reports') {
    return clientMockDb.getDataQualityReports();
  }
  if (path === '/api/data/sync') {
    return clientMockDb.syncGovernmentData();
  }
  if (path === '/api/data/ingest') {
    return clientMockDb.ingestCsvData(parsedBody.csvContent, parsedBody.sourceLabel);
  }
  if (path === '/api/impact/summary') {
    return clientMockDb.getImpactSummary();
  }

  if (path === '/api/notifications') {
    return clientMockDb.getNotifications();
  }
  if (path === '/api/notifications/test') {
    return clientMockDb.dispatchTestNotification();
  }
  if (path === '/api/analytics/vendors') {
    const network = await clientMockDb.getContractorNetwork();
    return {
      vendors: (network.vendorReports || []).map((v: any) => ({
        name: v.vendorName,
        totalProjects: v.totalProjects,
        totalValueCr: v.totalSanctionedCr,
        completionRate: v.completionRate,
        riskExposureRating: v.riskLevel,
      }))
    };
  }

  if (path === '/api/audit-logs/verify') {
    return clientMockDb.verifyAuditLogs();
  }
  if (path === '/api/audit-logs/simulate-tamper') {
    return clientMockDb.simulateTamper();
  }
  if (path === '/api/audit-logs/restore') {
    return clientMockDb.restoreAuditLogs();
  }
  if (path === '/api/audit-logs') {
    const logsData = await clientMockDb.getAuditLogs();
    return { auditLogs: logsData.logs, count: logsData.count };
  }

  if (path === '/api/network/contractors') {
    return clientMockDb.getContractorNetwork();
  }
  if (path === '/api/evidence/verify') {
    return clientMockDb.verifyEvidence(parsedBody);
  }

  const satMatch = path.match(/^\/api\/satellite\/([^/]+)$/);
  if (satMatch) {
    return clientMockDb.getSatelliteObservation(satMatch[1]);
  }
  const satVerifyMatch = path.match(/^\/api\/satellite\/verify\/([^/]+)$/);
  if (satVerifyMatch) {
    return clientMockDb.getSatelliteObservation(satVerifyMatch[1]);
  }

  const aiReportMatch = path.match(/^\/api\/ai\/audit-report\/([^/]+)$/);
  if (aiReportMatch) {
    return clientMockDb.generateAiAuditReport(aiReportMatch[1]);
  }

  if (path === '/api/chat/query') {
    return clientMockDb.queryChatbot(parsedBody.query || '');
  }
  if (path === '/api/nlp/analyze-feedback') {
    return clientMockDb.analyzeGrievanceFeedback(parsedBody);
  }

  if (path === '/api/public/summary') {
    return clientMockDb.getPublicSummary();
  }
  if (path === '/api/public/projects') {
    return clientMockDb.getPublicProjects();
  }

  throw new Error(`Endpoint ${url} not found`);
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  if (isStaticDeployment()) {
    return handleFallbackRoute(url, options);
  }
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };
  if (token && !url.includes('/api/auth/login')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      if (response.status === 404 || response.status === 502 || response.status === 503) {
        return await handleFallbackRoute(url, options);
      }
      if (response.status === 401 && !url.includes('/api/auth/login')) {
        authStorage.removeToken();
      }
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    return response.json();
  } catch {
    try {
      return await handleFallbackRoute(url, options);
    } catch (err: any) {
      throw err;
    }
  }
}

export const api = {
  login: AuthService.login,
  getMe: AuthService.getMe,
  logout: AuthService.logout,

  getDashboardSummary: async (): Promise<DashboardSummary> => {
    return fetchWithAuth('/api/dashboard/summary');
  },

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

  // Returns project AND real duplicate candidates across MPs/constituencies
  getProjectById: async (id: string): Promise<{ project: Project; duplicateCandidates: DuplicateProjectCandidate[] }> => {
    return fetchWithAuth(`/api/projects/${id}`);
  },

  recommendProject: async (projectData: Partial<Project>): Promise<{ success: boolean; project: Project }> => {
    return fetchWithAuth('/api/projects/recommend', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  },

  // Multi-Authority Approval Transition
  transitionProject: async (
    id: string,
    data: {
      targetStatus: ProjectStatus;
      sanctionedAmount?: number;
      statutoryRemarks?: string;
      dtecClearanceRef?: string;
    }
  ): Promise<{ success: boolean; project: Project; record: any; message: string }> => {
    return fetchWithAuth(`/api/projects/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify(data)
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

  getAlerts: async (): Promise<{ alerts: RiskAlert[]; count: number }> => {
    return fetchWithAuth('/api/alerts');
  },

  // Alert Review Action - feeds back into ML Model
  updateAlertStatus: async (
    id: string,
    status: string,
    reviewNotes?: string
  ): Promise<{ success: boolean; alert: RiskAlert; mlModelStatus?: MLModelMetadata; message: string }> => {
    return fetchWithAuth(`/api/alerts/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ status, reviewNotes })
    });
  },

  // Machine Learning Model
  getMLModelStatus: async (): Promise<{ metadata: MLModelMetadata; feedbackCount: number; recentFeedback: any[] }> => {
    return fetchWithAuth('/api/ml/model-status');
  },

  retrainMLModel: async (): Promise<{ success: boolean; metadata: MLModelMetadata; message: string }> => {
    return fetchWithAuth('/api/ml/retrain', { method: 'POST' });
  },

  // Citizen Feedback
  getCitizenFeedback: async (): Promise<{ feedback: CitizenFeedback[]; count: number }> => {
    return fetchWithAuth('/api/citizen-feedback');
  },

  submitCitizenFeedback: async (data: any): Promise<{ success: boolean; feedbackId: string; trackingNumber: string; routedQueue: string; slaDeadlineDays: number }> => {
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

  // Data Quality Reports & Connector
  getDataQualityReports: async (): Promise<{ reports: DataQualityReport[]; count: number }> => {
    return fetchWithAuth('/api/data/quality-reports');
  },

  syncGovernmentData: async (): Promise<{ success: boolean; syncResult: any; message: string }> => {
    return fetchWithAuth('/api/data/sync', { method: 'POST' });
  },

  ingestData: async (csvContent: string, sourceLabel?: string): Promise<{ success: boolean; qualityReport: DataQualityReport; importedCount: number }> => {
    return fetchWithAuth('/api/data/ingest', {
      method: 'POST',
      body: JSON.stringify({ csvContent, sourceLabel })
    });
  },

  getImpactSummary: async (): Promise<any> => {
    return fetchWithAuth('/api/impact/summary');
  },

  // Notifications
  getNotifications: async (): Promise<{ notifications: NotificationLog[]; count: number }> => {
    return fetchWithAuth('/api/notifications');
  },

  dispatchTestNotification: async (): Promise<{ success: boolean; logs: NotificationLog[]; message: string }> => {
    return fetchWithAuth('/api/notifications/test', { method: 'POST' });
  },

  getVendors: async (): Promise<{ vendors: any[] }> => {
    return fetchWithAuth('/api/analytics/vendors');
  },

  getContractorNetwork: async (): Promise<any> => {
    return fetchWithAuth('/api/network/contractors');
  },

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

  simulateTamper: async (): Promise<any> => {
    return fetchWithAuth('/api/audit-logs/simulate-tamper', { method: 'POST' });
  },

  restoreAuditLogs: async (): Promise<any> => {
    return fetchWithAuth('/api/audit-logs/restore', { method: 'POST' });
  },

  verifyEvidence: async (data: any): Promise<any> => {
    return fetchWithAuth('/api/evidence/verify', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  generateAiAuditReport: async (projectId: string): Promise<{ report: string; projectCode: string; title: string }> => {
    return fetchWithAuth(`/api/ai/audit-report/${projectId}`, { method: 'POST' });
  },

  getSatelliteObservation: async (projectId: string): Promise<{ observation: any }> => {
    return fetchWithAuth(`/api/satellite/${projectId}`);
  },

  verifySatellite: async (projectId: string, options?: any): Promise<{ success: boolean; observation: any }> => {
    return fetchWithAuth(`/api/satellite/verify/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(options || {})
    });
  },

  queryChatbot: async (query: string): Promise<any> => {
    return fetchWithAuth('/api/chat/query', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  },

  analyzeGrievanceFeedback: async (data: any): Promise<any> => {
    return fetchWithAuth('/api/nlp/analyze-feedback', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getPublicSummary: async (): Promise<any> => {
    return fetchWithAuth('/api/public/summary');
  },

  getPublicProjects: async (): Promise<{ projects: Project[]; count: number }> => {
    return fetchWithAuth('/api/public/projects');
  }
};
