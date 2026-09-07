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
  AlertStatus,
  RiskLevel,
  ProjectStatus,
} from '../types/index.js';
import { authStorage } from './authService.js';
import { demoUsers, demoProjects, demoAlerts, demoFeedback, demoAuditLogs } from './staticSeedData.js';

const STORAGE_KEY = 'mplads_static_demo_db_v3';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function textSimilarity(a: string, b: string): number {
  const tokenize = (value: string) =>
    new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
    );
  const aa = tokenize(a);
  const bb = tokenize(b);
  if (!aa.size || !bb.size) return 0;
  const intersection = [...aa].filter(word => bb.has(word)).length;
  const union = new Set([...aa, ...bb]).size;
  return Math.round((intersection / union) * 100);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function riskLevel(score: number): RiskLevel {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 35) return 'MEDIUM';
  return 'LOW';
}

function createQualityReport(projects: Project[], sourceConnector: DataQualityReport['sourceConnector'] = 'Manual CSV Overlay'): DataQualityReport {
  const total = projects.length;
  const gps = projects.filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)).length;
  const dates = projects.filter(p => Boolean(p.sanctionDate)).length;
  const pan = projects.filter(p => Boolean(p.vendorPanMasked && p.vendorPanMasked !== 'PENDING')).length;
  const costs = projects.filter(p => Number.isFinite(p.sanctionedAmount) && p.sanctionedAmount > 0).length;
  const agencies = projects.filter(p => Boolean(p.implementingAgencyId)).length;
  const pct = (n: number) => total ? Math.round((n / total) * 100) : 0;
  const overall = Math.round((pct(gps) + pct(dates) + pct(pan) + pct(costs) + pct(agencies)) / 5);
  return {
    id: `DQR-${Date.now()}`,
    totalRowsProcessed: total,
    validRowsImported: total,
    skippedRows: [],
    gpsCompletenessPct: pct(gps),
    sanctionDateCompletenessPct: pct(dates),
    vendorPanCompletenessPct: pct(pan),
    costValidityPct: pct(costs),
    agencyCompletenessPct: pct(agencies),
    overallDataQualityScore: overall,
    sourceConnector,
    importTimestamp: new Date().toISOString(),
  };
}

interface StaticState {
  projects: Project[];
  alerts: RiskAlert[];
  citizenFeedback: CitizenFeedback[];
  auditLogs: AuditLogEntry[];
  notifications: NotificationLog[];
  dataQualityReports: DataQualityReport[];
  mlFeedback: any[];
  model: MLModelMetadata;
}

function initialState(): StaticState {
  return {
    projects: clone(demoProjects),
    alerts: clone(demoAlerts),
    citizenFeedback: clone(demoFeedback),
    auditLogs: clone(demoAuditLogs),
    notifications: [],
    dataQualityReports: [createQualityReport(demoProjects, 'eSAKSHI Public Export')],
    mlFeedback: [],
    model: {
      modelVersion: 'static-demo-2.0',
      algorithm: 'Isolation Forest + Gradient Boosting Ensemble',
      trainedAt: new Date().toISOString(),
      totalTrainingSamples: 240,
      activeFeatures: ['cost_zscore', 'fund_utilization', 'completion_gap', 'delay_days', 'gps_distance', 'text_similarity', 'vendor_concentration'],
      feedbackSamplesCount: 0,
      confirmedAnomaliesCount: 0,
      falsePositivesCount: 0,
      precision: 0.875,
      recall: 0.84,
      f1Score: 0.857,
      rocAuc: 0.91,
      isRetraining: false,
    },
  };
}

class BrowserMockDatabase {
  private state: StaticState;

  constructor() {
    this.state = this.load();
  }

  private load(): StaticState {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved) as StaticState;
      } catch {
        // Fall back to seed data.
      }
    }
    return initialState();
  }

  private save(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // Browser storage may be unavailable; in-memory state still works.
      }
    }
  }

  get projects(): Project[] { return this.state.projects; }
  get alerts(): RiskAlert[] { return this.state.alerts; }
  get citizenFeedback(): CitizenFeedback[] { return this.state.citizenFeedback; }
  get auditLogs(): AuditLogEntry[] { return this.state.auditLogs; }
  get notifications(): NotificationLog[] { return this.state.notifications; }
  get dataQualityReports(): DataQualityReport[] { return this.state.dataQualityReports; }

  addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    this.state.auditLogs.unshift({
      ...entry,
      id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      entryHash: `demo-${Date.now().toString(16)}`,
    });
    this.save();
  }

  getProjectsForUser(user: User | null): Project[] {
    if (!user || user.role === 'PUBLIC' || user.role === 'VIEWER') return this.projects;
    if (user.role === 'MP') return this.projects.filter(p => p.mpId === user.userId || p.mpName === user.name || !p.mpId);
    if (user.role === 'AGENCY' || user.role === 'PROJECT_MANAGER') {
      return this.projects.filter(p => p.implementingAgencyId === user.agencyId || !p.implementingAgencyId);
    }
    if (user.role === 'ADMIN') return this.projects.filter(p => !user.district || p.district === user.district);
    if (user.role === 'STATE_NODAL') return this.projects.filter(p => !user.state || p.state === user.state);
    return this.projects;
  }

  getProject(id: string, user: User | null): Project | undefined {
    return this.getProjectsForUser(user).find(p => p.id === id || p.projectCode === id);
  }

  publicProject(project: Project): Project {
    const safe = clone(project);
    safe.vendorPanMasked = 'REDACTED';
    safe.documents = safe.documents.filter(doc => !doc.isConfidential);
    return safe;
  }

  verifyAuditLogIntegrity() {
    return {
      isValid: true,
      verifiedCount: this.auditLogs.length,
      algorithm: 'SHA-256 demo chain',
      genesisHash: 'MPLADS-GENESIS-DEMO',
      verifiedAt: new Date().toISOString(),
    };
  }

  reset(): void {
    this.state = initialState();
    this.save();
  }

  get model(): MLModelMetadata { return this.state.model; }
  get mlFeedback(): any[] { return this.state.mlFeedback; }

  recordFeedback(alert: RiskAlert, status: AlertStatus, notes: string): void {
    const label = status === 'False Positive' ? -1 : status === 'Confirmed Anomaly' ? 1 : 0;
    if (label === 0) return;
    this.state.mlFeedback.unshift({
      id: `FB-${Date.now()}`,
      alertId: alert.id,
      projectId: alert.projectId,
      label,
      decisionStatus: status,
      reviewedBy: 'Authorized Auditor',
      reviewNotes: notes,
      timestamp: new Date().toISOString(),
    });
    this.state.model.feedbackSamplesCount++;
    if (label === -1) this.state.model.falsePositivesCount++;
    if (label === 1) this.state.model.confirmedAnomaliesCount++;
    this.save();
  }

  retrain(): MLModelMetadata {
    this.state.model = {
      ...this.state.model,
      modelVersion: `static-demo-${Date.now()}`,
      trainedAt: new Date().toISOString(),
      isRetraining: false,
      precision: this.state.model.confirmedAnomaliesCount > 0 ? 0.88 : 0.875,
      recall: this.state.model.confirmedAnomaliesCount > 0 ? 0.85 : 0.84,
      f1Score: this.state.model.confirmedAnomaliesCount > 0 ? 0.865 : 0.857,
      rocAuc: 0.91,
    };
    this.save();
    return clone(this.state.model);
  }
}

const browserDb = new BrowserMockDatabase();

export class ClientMockDbService {
  getCurrentUser(): User | null { return authStorage.getUser(); }

  async login(userId: string, password: string) {
    const rawId = String(userId).trim().toUpperCase();
    const aliases: Record<string, string> = {
      ADMIN: 'ADMIN001', COLLECTOR: 'ADMIN001', DM: 'ADMIN001',
      MP: 'MP001', MEMBER: 'MP001', RAJESH: 'MP001',
      AGENCY: 'AGENCY001', TSUDA: 'AGENCY001', ENGINEER: 'AGENCY001',
      STATE: 'STATE001', NODAL: 'STATE001',
      MINISTRY: 'MINISTRY001', MOSPI: 'MINISTRY001',
    };
    const normalizedId = aliases[rawId] || rawId;
    const user = demoUsers.find(item => item.userId.toUpperCase() === normalizedId);
    const valid = user && String(user.passwordHash).toLowerCase() === String(password).trim().toLowerCase();
    if (!user || !valid) throw new Error('Invalid credentials');

    const safeUser: User = {
      id: user.id,
      userId: user.userId,
      name: user.name,
      role: user.role,
      designation: user.designation,
      constituency: user.constituency,
      district: user.district,
      state: user.state,
      email: user.email,
      phone: user.phone,
      agencyId: user.agencyId,
      agencyName: user.agencyName,
    };
    const token = `mplads_static_token_${user.userId.toLowerCase()}_${Date.now()}`;
    authStorage.setToken(token);
    authStorage.setUser(safeUser);
    browserDb.addAuditLog({
      userId: safeUser.userId,
      userName: safeUser.name,
      userRole: safeUser.role,
      action: 'USER_LOGIN',
      targetEntity: 'Auth',
      targetId: safeUser.userId,
      ipAddressMasked: 'STATIC-DEMO',
    });
    return { token, user: safeUser, message: `Welcome, ${safeUser.name}` };
  }

  async getMe() {
    const user = authStorage.getUser();
    if (!user) throw new Error('No active session');
    return { user };
  }

  async logout(): Promise<void> { authStorage.removeToken(); }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const projects = browserDb.getProjectsForUser(this.getCurrentUser());
    const alerts = browserDb.alerts.filter(a => projects.some(p => p.id === a.projectId));
    return {
      totalProjects: projects.length,
      completedProjects: projects.filter(p => p.status === 'Completed').length,
      activeProjects: projects.filter(p => ['Ongoing', 'Assigned', 'Sanctioned'].includes(p.status)).length,
      delayedProjects: projects.filter(p => p.status === 'Delayed').length,
      underReviewProjects: projects.filter(p => p.status === 'Under Review').length,
      recommendedProjects: projects.filter(p => p.status === 'Recommended').length,
      totalFundsSanctioned: projects.reduce((sum, p) => sum + (p.sanctionedAmount || p.estimatedCost || 0), 0),
      totalFundsUtilized: projects.reduce((sum, p) => sum + (p.fundsUtilized || 0), 0),
      highRiskProjectsCount: projects.filter(p => (p.riskAnalysis?.overallScore || 0) >= 60).length,
      costAnomaliesCount: alerts.filter(a => a.alertType === 'Cost Anomaly').length,
      possibleDuplicatesCount: alerts.filter(a => a.alertType === 'Possible Duplicate').length,
      photoAnomaliesCount: alerts.filter(a => a.alertType === 'Photo Anomaly').length,
      locationMismatchesCount: alerts.filter(a => a.alertType === 'Location Mismatch').length,
      delayRisksCount: alerts.filter(a => a.alertType === 'Delay Risk').length,
      totalPendingReviews: alerts.filter(a => a.status === 'New' || a.status === 'Under Review').length,
      notificationsDispatchedToday: browserDb.notifications.length,
      mlModelAccuracyPct: Math.round(browserDb.model.f1Score * 100),
    };
  }

  async getProjects(params: any = {}) {
    let projects = [...browserDb.getProjectsForUser(this.getCurrentUser())];
    if (params.status && params.status !== 'All') projects = projects.filter(p => p.status === params.status);
    if (params.category && params.category !== 'All') projects = projects.filter(p => p.category === params.category);
    if (params.district && params.district !== 'All') projects = projects.filter(p => p.district === params.district);
    if (params.riskLevel && params.riskLevel !== 'All') projects = projects.filter(p => p.riskAnalysis?.riskLevel === params.riskLevel);
    if (params.search) {
      const q = String(params.search).toLowerCase();
      projects = projects.filter(p => `${p.title} ${p.projectCode} ${p.locationAddress}`.toLowerCase().includes(q));
    }
    return { projects, count: projects.length };
  }

  async getProjectWithDuplicates(id: string) {
    const user = this.getCurrentUser();
    const project = browserDb.getProject(id, user);
    if (!project) throw new Error('Project not found');
    return { project, duplicateCandidates: this.findDuplicates(project) };
  }

  async getProjectById(id: string): Promise<Project> {
    const project = browserDb.getProject(id, this.getCurrentUser());
    if (!project) throw new Error('Project not found');
    return project;
  }

  private findDuplicates(project: Project): DuplicateProjectCandidate[] {
    return browserDb.projects
      .filter(other => other.id !== project.id)
      .map(other => {
        const distanceMeters = haversine(project.latitude, project.longitude, other.latitude, other.longitude);
        const title = textSimilarity(project.title, other.title);
        const description = textSimilarity(project.description, other.description);
        const text = Math.round(title * 0.7 + description * 0.3);
        const d1 = new Date(project.sanctionDate || project.recommendationDate).getTime();
        const d2 = new Date(other.sanctionDate || other.recommendationDate).getTime();
        const sanctionDateDeltaDays = Number.isFinite(d1) && Number.isFinite(d2) ? Math.round(Math.abs(d1 - d2) / 86400000) : 999;
        const overlappingSanctionWindow = sanctionDateDeltaDays <= 365;
        const isCrossMp = Boolean(project.mpName && other.mpName && project.mpName !== other.mpName);
        const isCrossConstituency = Boolean(project.constituency && other.constituency && project.constituency !== other.constituency);
        let similarityScore = text;
        if (distanceMeters < 250) similarityScore += 40;
        else if (distanceMeters < 600) similarityScore += 28;
        else if (distanceMeters < 1200) similarityScore += 18;
        else if (distanceMeters < 2500) similarityScore += 10;
        if (overlappingSanctionWindow && distanceMeters < 1500) similarityScore += 12;
        similarityScore = Math.min(99, similarityScore);
        return {
          primaryProject: project,
          candidateProject: other,
          similarityScore,
          distanceMeters,
          matchingFactors: [
            distanceMeters < 1500 ? `Proximity: ${distanceMeters}m` : '',
            text >= 40 ? `Specification overlap: ${text}%` : '',
            overlappingSanctionWindow ? `Sanction window overlap: ${sanctionDateDeltaDays} days` : '',
            isCrossMp ? 'Cross-MP allocation' : '',
            isCrossConstituency ? 'Cross-constituency' : '',
            project.category === other.category ? `Same category: ${project.category}` : '',
          ].filter(Boolean),
          sanctionDateDeltaDays,
          isCrossConstituency,
          isCrossMp,
          overlappingSanctionWindow,
        } as DuplicateProjectCandidate;
      })
      .filter(d => d.similarityScore >= 55 || (d.distanceMeters <= 450 && d.similarityScore >= 35))
      .sort((a, b) => b.similarityScore - a.similarityScore);
  }

  async recommendProject(data: any) {
    const user = this.getCurrentUser();
    const index = browserDb.projects.length + 1;
    const project: Project = {
      id: `PRJ-2026-${String(index).padStart(3, '0')}`,
      projectCode: `MPLADS-DEMO-2026-${String(index).padStart(3, '0')}`,
      title: String(data.title || 'New MPLADS Development Work'),
      description: String(data.description || 'Recommended public developmental work.'),
      category: String(data.category || 'Community Infrastructure'),
      mpId: user?.userId || 'MP001',
      mpName: user?.name || 'Demo MP',
      constituency: user?.constituency || 'Hyderabad North',
      district: String(data.district || user?.district || 'Hyderabad'),
      state: String(data.state || user?.state || 'Telangana'),
      locationAddress: String(data.locationAddress || 'Demo location'),
      latitude: Number(data.latitude ?? 17.412),
      longitude: Number(data.longitude ?? 78.489),
      estimatedCost: Number(data.estimatedCost || 2000000),
      sanctionedAmount: 0,
      fundsUtilized: 0,
      implementingAgencyId: 'UNASSIGNED',
      implementingAgencyName: 'Pending Agency Selection',
      vendorName: 'Under Sanction Scrutiny',
      vendorPanMasked: 'PENDING',
      recommendationDate: today(),
      sanctionDate: '',
      startDate: '',
      expectedCompletionDate: '',
      status: 'Recommended',
      completionPercentage: 0,
      currentAuthorityQueue: 'DISTRICT_AUTHORITY',
      riskAnalysis: {
        overallScore: 18,
        riskLevel: 'LOW',
        lastEvaluatedAt: new Date().toISOString(),
        costAnomalyScore: 10,
        duplicateProbability: 5,
        photoAnomalyScore: 0,
        locationMismatch: false,
        delayProbability: 10,
        reasons: ['Newly recommended work; preliminary checks passed.'],
        recommendations: ['Field technical scrutiny by DTEC required.'],
        disclaimer: 'Algorithmic assessment is advisory and requires human review.',
      },
      photos: [], documents: [], payments: [],
      timeline: [
        { stage: 'Recommendation', completed: true, date: today() },
        { stage: 'Feasibility Check', completed: false },
        { stage: 'Sanction', completed: false },
        { stage: 'Agency Assignment', completed: false },
        { stage: 'Execution', completed: false },
        { stage: 'Completion', completed: false },
      ],
    };
    browserDb.projects.unshift(project);
    browserDb.addAuditLog({ userId: user?.userId || 'MP001', userName: user?.name || 'Demo MP', userRole: user?.role || 'MP', action: 'SUBMIT_RECOMMENDATION', targetEntity: 'Project', targetId: project.id, ipAddressMasked: 'STATIC-DEMO' });
    return { project, message: 'Recommendation logged successfully.' };
  }

  async transitionProject(id: string, data: any) {
    const project = browserDb.projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    const user = this.getCurrentUser();
    const target = data.targetStatus as ProjectStatus;
    const allowed: Record<string, ProjectStatus[]> = {
      MP: ['Recommended'],
      ADMIN: ['Forwarded To State', 'Forwarded To Ministry', 'Sanctioned', 'Rejected'],
      STATE_NODAL: ['State Approved', 'Forwarded To Ministry', 'Rejected'],
      MINISTRY: ['Ministry Approved', 'Rejected'],
      AGENCY: ['Ongoing', 'Completed'],
    };
    if (!user || !allowed[user.role]?.includes(target)) throw new Error(`Role ${user?.role || 'PUBLIC'} is not authorized for ${target}`);
    const fromStatus = project.status;
    project.status = target;
    project.currentAuthorityQueue = target === 'State Approved' ? 'STATE_NODAL_AUTHORITY' : target === 'Ministry Approved' ? 'CENTRAL_MINISTRY' : target === 'Forwarded To State' ? 'STATE_NODAL_AUTHORITY' : target === 'Ongoing' ? 'AGENCY_EXECUTION' : project.currentAuthorityQueue;
    project.approvalHistory = project.approvalHistory || [];
    project.approvalHistory.push({ id: `TR-${Date.now()}`, projectId: project.id, fromStatus, toStatus: target, transitionedByUserId: user.userId, transitionedByRole: user.role, transitionedByName: user.name, authorityLevel: user.role === 'ADMIN' ? 'DISTRICT_AUTHORITY' : user.role === 'STATE_NODAL' ? 'STATE_NODAL_AUTHORITY' : user.role === 'MINISTRY' ? 'CENTRAL_MINISTRY' : 'MP', timestamp: new Date().toISOString(), statutoryRemarks: data.statutoryRemarks, sanctionedAmount: data.sanctionedAmount });
    browserDb.addAuditLog({ userId: user.userId, userName: user.name, userRole: user.role, action: 'PROJECT_TRANSITION', targetEntity: 'Project', targetId: project.id, ipAddressMasked: 'STATIC-DEMO', newValue: target });
    return { success: true, project, message: `Transitioned to ${target}` };
  }

  async updateProjectStatus(id: string, data: any) {
    const project = browserDb.projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    project.status = data.status;
    if (data.sanctionedAmount !== undefined) project.sanctionedAmount = Number(data.sanctionedAmount);
    return { project, message: `Status updated to ${data.status}` };
  }

  async assignAgency(id: string, data: any) {
    const project = browserDb.projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    project.implementingAgencyId = String(data.agencyId || 'AGENCY001');
    project.implementingAgencyName = String(data.agencyName || 'Demo Implementing Agency');
    project.status = 'Assigned';
    return { project, message: 'Agency assigned.' };
  }

  async updateProgress(id: string, data: any) {
    const project = browserDb.projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    project.completionPercentage = Math.max(0, Math.min(100, Number(data.completionPercentage || 0)));
    if (data.fundsUtilized !== undefined) project.fundsUtilized = Number(data.fundsUtilized);
    if (project.completionPercentage >= 100) project.status = 'Completed';
    else if (project.status === 'Assigned' || project.status === 'Sanctioned') project.status = 'Ongoing';
    return { project, message: 'Progress recorded.' };
  }

  async addPayment(id: string, data: any) {
    const project = browserDb.projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    const amount = Math.max(0, Number(data.amount || 0));
    project.fundsUtilized += amount;
    const payment = { id: `PAY-${Date.now()}`, installmentNo: project.payments.length + 1, amount, sanctionOrderNo: String(data.sanctionOrderNo || 'DEMO-SAN/2026/001'), paidAt: today(), status: 'Disbursed' as const, beneficiaryAgency: project.implementingAgencyName };
    project.payments.push(payment);
    return { project, payment, message: 'Payment recorded.' };
  }

  async getAlerts(params: any = {}) {
    let alerts = [...browserDb.alerts];
    if (params.status && params.status !== 'All') alerts = alerts.filter(a => a.status === params.status);
    if (params.riskLevel && params.riskLevel !== 'All') alerts = alerts.filter(a => a.riskLevel === params.riskLevel);
    return { alerts, count: alerts.length };
  }

  async actionAlert(id: string, data: any) {
    const alert = browserDb.alerts.find(a => a.id === id);
    if (!alert) throw new Error('Alert not found');
    alert.status = data.status || 'Resolved';
    alert.reviewNotes = data.reviewNotes || data.notes || '';
    alert.resolvedAt = new Date().toISOString();
    browserDb.recordFeedback(alert, alert.status, alert.reviewNotes || '');
    return { alert, message: `Alert marked as ${alert.status}.` };
  }

  async getMLModelStatus() {
    return { metadata: clone(browserDb.model), feedbackCount: browserDb.mlFeedback.length, recentFeedback: clone(browserDb.mlFeedback.slice(0, 5)) };
  }

  async retrainMLModel() {
    return { success: true, metadata: browserDb.retrain(), message: 'Demo model recalibrated on reviewer feedback.' };
  }

  async getCitizenFeedback() { return { feedback: browserDb.citizenFeedback, count: browserDb.citizenFeedback.length }; }

  async submitCitizenFeedback(data: any) {
    const project = browserDb.projects.find(p => p.id === data.projectId);
    const item: CitizenFeedback = {
      id: `CF-${Date.now()}`,
      trackingNumber: `MPLADS-CIT-${Date.now().toString().slice(-8)}`,
      projectId: String(data.projectId || ''),
      projectTitle: project?.title || 'MPLADS Community Asset',
      projectCode: project?.projectCode || 'MPLADS-REF',
      district: project?.district || 'Hyderabad',
      state: project?.state || 'Telangana',
      citizenName: String(data.citizenName || 'Concerned Citizen'),
      citizenContactMasked: 'REDACTED',
      issueType: data.issueType || 'Incomplete Work',
      description: String(data.description || 'Citizen feedback'),
      photoUrl: data.photoUrl,
      latitude: Number.isFinite(Number(data.latitude)) ? Number(data.latitude) : undefined,
      longitude: Number.isFinite(Number(data.longitude)) ? Number(data.longitude) : undefined,
      submittedAt: new Date().toISOString(),
      status: 'New',
      routedQueue: 'DISTRICT_QUEUE',
      priorityLevel: data.issueType === 'Suspected Financial Misappropriation / Incomplete Work' ? 'VIGILANCE_URGENT' : 'NORMAL',
      slaDeadlineDays: 15,
    };
    browserDb.citizenFeedback.unshift(item);
    browserDb.addAuditLog({ userId: 'PUBLIC', userName: item.citizenName, userRole: 'PUBLIC', action: 'CITIZEN_FEEDBACK_SUBMITTED', targetEntity: 'CitizenFeedback', targetId: item.id, ipAddressMasked: 'REDACTED' });
    return { success: true, feedbackId: item.id, trackingNumber: item.trackingNumber, routedQueue: item.routedQueue, slaDeadlineDays: item.slaDeadlineDays };
  }

  async updateFeedbackStatus(id: string, status: any, adminNotes?: string) {
    const item = browserDb.citizenFeedback.find(f => f.id === id);
    if (!item) throw new Error('Feedback not found');
    item.status = status;
    if (adminNotes) item.adminNotes = adminNotes;
    return { success: true, feedback: item };
  }

  async getDataQualityReports() { return { reports: browserDb.dataQualityReports, count: browserDb.dataQualityReports.length }; }

  async syncGovernmentData() {
    return { success: true, syncResult: { newImportedCount: 0, updatedCount: browserDb.projects.length, source: 'Demo government connector' }, message: 'Demo connector sync completed without external network access.' };
  }

  async ingestCsvData(csv: string, label = 'Manual CSV Overlay') {
    const lines = csv.trim().split(/\r?\n/).filter(Boolean);
    const imported: Project[] = [];
    const start = lines[0]?.split(',').map(v => v.trim().toLowerCase()) || [];
    const idx = (name: string) => start.findIndex(v => v.includes(name));
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(',').map(v => v.trim());
      const costRaw = cells[idx('sanctioned amount')] || cells[idx('estimated cost')] || '2000000';
      const cost = Number(costRaw.replace(/[^0-9.]/g, '')) * (costRaw.toLowerCase().includes('lakh') ? 100000 : 1);
      const title = cells[idx('title')] || `Imported MPLADS Work ${i}`;
      imported.push({
        id: `IMP-${Date.now()}-${i}`,
        projectCode: cells[idx('project code')] || `MPLADS-IMP-${Date.now()}-${i}`,
        title,
        description: 'Imported demonstration record',
        category: cells[idx('category')] || 'Community Infrastructure',
        mpId: 'MP001', mpName: cells[idx('mp name')] || 'Demo MP', constituency: 'Demo Constituency',
        district: cells[idx('district')] || 'Hyderabad', state: 'Telangana', locationAddress: 'Imported location',
        latitude: Number(cells[idx('latitude')]) || 17.412, longitude: Number(cells[idx('longitude')]) || 78.489,
        estimatedCost: cost || 2000000, sanctionedAmount: cost || 2000000, fundsUtilized: 0,
        implementingAgencyId: 'UNASSIGNED', implementingAgencyName: 'Pending Agency', vendorName: 'Imported Vendor', vendorPanMasked: 'REDACTED',
        recommendationDate: today(), sanctionDate: cells[idx('sanction date')] || today(), startDate: '', expectedCompletionDate: '',
        status: 'Recommended', completionPercentage: 0, riskAnalysis: { overallScore: 20, riskLevel: 'LOW', lastEvaluatedAt: new Date().toISOString(), costAnomalyScore: 10, duplicateProbability: 5, photoAnomalyScore: 0, locationMismatch: false, delayProbability: 10, reasons: ['Imported demo record'], recommendations: ['Verify source record'], disclaimer: 'Advisory demo indicator.' },
        photos: [], documents: [], payments: [], timeline: [],
      });
    }
    browserDb.projects.unshift(...imported);
    const report = createQualityReport(imported, label.includes('eSAKSHI') ? 'eSAKSHI Webhook' : 'Manual CSV Overlay');
    browserDb.dataQualityReports.unshift(report);
    return { success: true, qualityReport: report, importedCount: imported.length };
  }

  async getImpactSummary() {
    const flagged = browserDb.projects.filter(p => (p.riskAnalysis?.overallScore || 0) >= 60);
    const totalSanctioned = browserDb.projects.reduce((s, p) => s + (p.sanctionedAmount || p.estimatedCost || 0), 0);
    const flaggedAmount = flagged.reduce((s, p) => s + (p.sanctionedAmount || p.estimatedCost || 0), 0);
    const byDistrict = new Map<string, number>();
    flagged.forEach(p => byDistrict.set(p.district, (byDistrict.get(p.district) || 0) + 1));
    const highest = [...byDistrict.entries()].sort((a, b) => b[1] - a[1])[0];
    return { totalFlaggedAmountCr: Number((flaggedAmount / 1e7).toFixed(2)), estimatedPotentialSavingsCr: Number((flaggedAmount * 0.08 / 1e7).toFixed(2)), totalFlaggedProjects: flagged.length, flaggedPercentage: browserDb.projects.length ? Number((flagged.length / browserDb.projects.length * 100).toFixed(1)) : 0, highestRiskDistrict: { district: highest?.[0] || 'Hyderabad', flaggedCount: highest?.[1] || 0 }, totalLoadedProjects: browserDb.projects.length, totalSanctionedAmountCr: Number((totalSanctioned / 1e7).toFixed(2)) };
  }

  async getNotifications() { return { notifications: browserDb.notifications, count: browserDb.notifications.length }; }

  async dispatchTestNotification() {
    const alert = browserDb.alerts[0];
    if (!alert) return { success: false, logs: [] };
    const log: NotificationLog = { id: `NOT-${Date.now()}`, channel: 'PUSH', recipient: 'Demo Auditor', recipientRole: 'ADMIN', subject: `Risk alert ${alert.id}`, message: alert.reason, status: 'DELIVERED', relatedEntityId: alert.id, relatedEntityType: 'RiskAlert', dispatchedAt: new Date().toISOString() };
    browserDb.notifications.unshift(log);
    return { success: true, logs: [log], message: 'Demo notification dispatched.' };
  }

  async getContractorNetwork() {
    const groups = new Map<string, Project[]>();
    browserDb.projects.forEach(p => groups.set(p.vendorName, [...(groups.get(p.vendorName) || []), p]));
    const vendorReports = [...groups.entries()].map(([vendorName, projects]) => {
      const delayed = projects.filter(p => p.status === 'Delayed').length;
      const total = projects.reduce((s, p) => s + (p.sanctionedAmount || p.estimatedCost || 0), 0);
      const completionRate = projects.length ? Math.round(projects.filter(p => p.status === 'Completed').length / projects.length * 100) : 0;
      return { vendorName, totalProjects: projects.length, totalSanctionedCr: Number((total / 1e7).toFixed(2)), completionRate, riskLevel: delayed > 0 ? 'HIGH' : 'LOW', requiresHighPriorityAlert: delayed > 0, recommendation: delayed > 0 ? 'Review delivery concentration and milestone history.' : 'No immediate concentration alert.' };
    });
    return { vendorReports };
  }

  async getSatelliteObservation(projectId: string) {
    const p = browserDb.projects.find(x => x.id === projectId || x.projectCode === projectId) || browserDb.projects[0];
    return { observation: { projectId: p?.id, verdict: (p?.completionPercentage || 0) < 40 ? 'ANOMALY_DETECTED' : 'CONSISTENT', verdictReason: (p?.completionPercentage || 0) < 40 ? 'Low reported progress requires field verification.' : 'Demo multi-temporal evidence is consistent with reported progress.', confidenceScore: 0.82, baselineDate: p?.startDate || today(), evaluationDate: today(), beforeImageUrl: p?.photos?.find(x => x.stage === 'before')?.url || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900', afterImageUrl: p?.photos?.find(x => x.stage === 'during' || x.stage === 'after')?.url || 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=900' } };
  }

  async getAuditLogs() { return { logs: browserDb.auditLogs, count: browserDb.auditLogs.length }; }
  async verifyAuditLogs() { return browserDb.verifyAuditLogIntegrity(); }

  async simulateTamper() {
    return { success: true, simulated: true, message: 'Demo tamper event simulated. The static integrity ledger remains advisory.' };
  }

  async restoreAuditLogs() {
    return { success: true, message: 'Demo audit ledger restored to its last browser snapshot.' };
  }

  async verifyEvidence(data: any) {
    const hasMedia = Boolean(data?.mediaData || data?.photoUrl || data?.url);
    return {
      success: true,
      verdict: hasMedia ? 'REVIEW_REQUIRED' : 'UNVERIFIABLE',
      message: hasMedia
        ? 'Demo evidence checks completed. Human review is required before an integrity conclusion.'
        : 'No evidence payload supplied.',
      gps: data?.latitude !== undefined && data?.longitude !== undefined ? 'PRESENT' : 'MISSING',
      perceptualSimilarity: 'NOT_COMPUTED_IN_STATIC_DEMO',
      exif: 'NOT_COMPUTED_IN_STATIC_DEMO',
    };
  }

  async queryChatbot(query: string) {
    const q = String(query || '').toLowerCase();
    let answer = 'I can help you inspect MPLADS projects, risk alerts, funds, delays, duplicate-work indicators, GIS checks, citizen feedback and audit records.';
    if (q.includes('risk')) answer = 'Use AI Anomalies to review cost, duplicate, photo, location and delay indicators. A risk score is an advisory flag for human review, not a finding of fraud.';
    else if (q.includes('duplicate')) answer = 'Duplicate detection compares project text, location proximity, sanction-window overlap and cross-MP/constituency signals.';
    else if (q.includes('fund')) answer = 'Funds Ledger shows sanctioned and utilized amounts for the projects visible to the current role.';
    else if (q.includes('citizen') || q.includes('grievance')) answer = 'Citizens can submit a project-linked grievance without official credentials. The demo routes it to a district review queue.';
    return { answer, source: 'MPLADS static demonstration knowledge base' };
  }

  async analyzeGrievanceFeedback(data: any) {
    const text = `${data?.description || ''} ${data?.issueType || ''}`.toLowerCase();
    const urgent = text.includes('misappropriation') || text.includes('fraud') || text.includes('financial');
    return {
      category: urgent ? 'VIGILANCE_REVIEW' : 'FIELD_VERIFICATION',
      priority: urgent ? 'HIGH' : 'NORMAL',
      confidence: urgent ? 0.92 : 0.81,
      suggestedQueue: urgent ? 'MINISTRY_VIGILANCE_QUEUE' : 'DISTRICT_QUEUE',
      explanation: urgent ? 'Financial-integrity language detected; escalate for human vigilance review.' : 'Issue appears suitable for routine field verification.',
    };
  }

  async generateAiAuditReport(projectId: string) {
    const p = browserDb.projects.find(x => x.id === projectId || x.projectCode === projectId) || browserDb.projects[0];
    return { report: `# MPLADS TECHNICAL INTEGRITY BRIEF\n\nProject: ${p.title}\n\nProject Code: ${p.projectCode}\n\nSanctioned Amount: ₹${((p.sanctionedAmount || p.estimatedCost) / 100000).toFixed(1)} Lakh\n\nPhysical Progress: ${p.completionPercentage}%\n\nAI Risk Score: ${p.riskAnalysis?.overallScore}/100 (${p.riskAnalysis?.riskLevel})\n\nIndicators: ${p.riskAnalysis?.reasons?.join('; ') || 'No indicators recorded.'}\n\nDirective: Conduct human physical verification before any adverse administrative decision.`, projectCode: p.projectCode, title: p.title };
  }

  async getPublicSummary() {
    const p = browserDb.projects;
    return { totalProjects: p.length, completedProjects: p.filter(x => x.status === 'Completed').length, activeProjects: p.filter(x => ['Ongoing', 'Sanctioned'].includes(x.status)).length, totalFundsSanctioned: p.reduce((s, x) => s + (x.sanctionedAmount || x.estimatedCost || 0), 0), totalFundsUtilized: p.reduce((s, x) => s + (x.fundsUtilized || 0), 0) };
  }

  async getPublicProjects() { return { projects: browserDb.projects.map(p => browserDb.publicProject(p)), count: browserDb.projects.length }; }
}

export const clientMockDb = new ClientMockDbService();
