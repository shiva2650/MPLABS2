import { db, users } from '../../server/db.js';
import { Project, RiskAlert, CitizenFeedback, AuditLogEntry, User, DashboardSummary, DuplicateProjectCandidate, MLModelMetadata, DataQualityReport, NotificationLog } from '../types/index.js';
import { authStorage } from './authService.js';
import { findDuplicateCandidates } from '../../server/aiService.js';
import { mlAnomalyModel } from '../../server/mlAnomalyModel.js';
import { approvalWorkflow } from '../../server/approvalWorkflow.js';
import { feedbackPipeline } from '../../server/feedbackService.js';
import { notificationService } from '../../server/notificationService.js';
import { verifyProjectSatelliteImagery } from '../../server/satelliteVerification.js';
import { analyzeContractorNetwork } from '../../server/networkFraudDetection.js';
import { parseExternalMpladsData, calculateImpactMetrics, syncFromGovernmentConnector } from '../../server/dataIngestion.js';

export class ClientMockDbService {
  getCurrentUser(): User | null {
    return authStorage.getUser();
  }

  async login(userId: string, password: string): Promise<{ token: string; user: User; message: string }> {
    const rawId = String(userId).trim().toUpperCase();
    let normalizedId = rawId;
    if (rawId === 'ADMIN' || rawId === 'COLLECTOR' || rawId === 'DM') normalizedId = 'ADMIN001';
    else if (rawId === 'MP' || rawId === 'MEMBER') normalizedId = 'MP001';
    else if (rawId === 'AGENCY' || rawId === 'TSUDA') normalizedId = 'AGENCY001';
    else if (rawId === 'STATE' || rawId === 'NODAL') normalizedId = 'STATE001';
    else if (rawId === 'MINISTRY') normalizedId = 'MINISTRY001';

    const user = users.find(u => u.userId.toUpperCase() === normalizedId);
    const rawPassword = String(password).trim();
    const passwordValid = user && (
      user.passwordHash === rawPassword ||
      user.passwordHash.toLowerCase() === rawPassword.toLowerCase()
    );

    if (!user || !passwordValid) {
      throw new Error('Invalid credentials');
    }

    const token = `mplads_static_token_${user.userId.toLowerCase()}_${Date.now()}`;
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
      agencyName: user.agencyName
    };

    authStorage.setToken(token);
    authStorage.setUser(safeUser);
    db.addAuditLog({
      userId: user.userId,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      targetEntity: 'Auth',
      targetId: user.userId,
      ipAddressMasked: '10.14.02.***'
    });

    return { token, user: safeUser, message: `Welcome, ${user.name}` };
  }

  async getMe(): Promise<{ user: User }> {
    const user = authStorage.getUser();
    if (!user) throw new Error('No active session');
    return { user };
  }

  async logout(): Promise<void> {
    const user = authStorage.getUser();
    if (user) {
      db.addAuditLog({
        userId: user.userId,
        userName: user.name,
        userRole: user.role,
        action: 'USER_LOGOUT',
        targetEntity: 'Auth',
        targetId: user.userId,
        ipAddressMasked: '10.14.02.***'
      });
    }
    authStorage.removeToken();
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const user = this.getCurrentUser();
    const projects = db.getProjectsForUser(user);
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const activeProjects = projects.filter(p => p.status === 'Ongoing' || p.status === 'Assigned' || p.status === 'Sanctioned').length;
    const delayedProjects = projects.filter(p => p.status === 'Delayed').length;
    const underReviewProjects = projects.filter(p => p.status === 'Under Review').length;
    const recommendedProjects = projects.filter(p => p.status === 'Recommended').length;
    const totalFundsSanctioned = projects.reduce((acc, p) => acc + (p.sanctionedAmount || p.estimatedCost || 0), 0);
    const totalFundsUtilized = projects.reduce((acc, p) => acc + (p.fundsUtilized || 0), 0);

    let userAlerts = db.alerts;
    if (user?.role === 'MP' || user?.role === 'AGENCY') {
      const userPrjIds = new Set(projects.map(p => p.id));
      userAlerts = db.alerts.filter(a => userPrjIds.has(a.projectId));
    }

    const highRiskProjectsCount = projects.filter(p => (p.riskAnalysis?.overallScore || 0) > 60).length;
    const costAnomaliesCount = userAlerts.filter(a => a.alertType === 'Cost Anomaly').length;
    const possibleDuplicatesCount = userAlerts.filter(a => a.alertType === 'Possible Duplicate').length;
    const photoAnomaliesCount = userAlerts.filter(a => a.alertType === 'Photo Anomaly').length;
    const locationMismatchesCount = userAlerts.filter(a => a.alertType === 'Location Mismatch').length;
    const delayRisksCount = userAlerts.filter(a => a.alertType === 'Delay Risk').length;
    const totalPendingReviews = userAlerts.filter(a => a.status === 'New' || a.status === 'Under Review').length;

    return {
      totalProjects,
      completedProjects,
      activeProjects,
      delayedProjects,
      underReviewProjects,
      recommendedProjects,
      totalFundsSanctioned,
      totalFundsUtilized,
      highRiskProjectsCount,
      costAnomaliesCount,
      possibleDuplicatesCount,
      photoAnomaliesCount,
      locationMismatchesCount,
      delayRisksCount,
      totalPendingReviews,
      notificationsDispatchedToday: db.notifications.length,
      mlModelAccuracyPct: Math.round(mlAnomalyModel.metadata.f1Score * 100)
    };
  }

  async getProjects(params: any = {}): Promise<{ projects: Project[]; count: number }> {
    const user = this.getCurrentUser();
    let projects = db.getProjectsForUser(user);
    if (params.status && params.status !== 'All') projects = projects.filter(p => p.status === params.status);
    if (params.category && params.category !== 'All') projects = projects.filter(p => p.category === params.category);
    if (params.district && params.district !== 'All') projects = projects.filter(p => p.district === params.district);
    if (params.riskLevel && params.riskLevel !== 'All') projects = projects.filter(p => p.riskAnalysis?.riskLevel === params.riskLevel);
    if (params.search) {
      const q = params.search.toLowerCase();
      projects = projects.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        p.locationAddress.toLowerCase().includes(q)
      );
    }
    return { projects, count: projects.length };
  }

  // Real duplicate matching across MPs/constituencies returned here
  async getProjectWithDuplicates(id: string): Promise<{ project: Project; duplicateCandidates: DuplicateProjectCandidate[] }> {
    const user = this.getCurrentUser();
    const project = db.getProjectByIdForUser(id, user);
    if (!project) throw new Error('Project not found');
    const duplicateCandidates = findDuplicateCandidates(project, db.projects);
    return { project, duplicateCandidates };
  }

  async getProjectById(id: string): Promise<Project> {
    const user = this.getCurrentUser();
    const project = db.getProjectByIdForUser(id, user);
    if (!project) throw new Error('Project not found');
    return project;
  }

  async recommendProject(data: any): Promise<{ project: Project; message: string }> {
    const user = this.getCurrentUser();
    const id = `PRJ-2025-${String(db.projects.length + 1).padStart(3, '0')}`;
    const code = `MPLADS-HYD-2025-${String(db.projects.length + 1).padStart(3, '0')}`;
    const cost = Number(data.estimatedCost || 2000000);

    const project: Project = {
      id,
      projectCode: code,
      title: data.title,
      description: data.description || 'Recommended public developmental work.',
      category: data.category,
      mpId: user?.userId || 'MP001',
      mpName: user?.name || 'Shri Rajesh Kumar',
      constituency: user?.constituency || 'Hyderabad North',
      district: data.district || user?.district || 'Hyderabad',
      state: data.state || 'Telangana',
      locationAddress: data.locationAddress,
      latitude: Number(data.latitude || 17.4120),
      longitude: Number(data.longitude || 78.4890),
      estimatedCost: cost,
      sanctionedAmount: 0,
      fundsUtilized: 0,
      implementingAgencyId: 'UNASSIGNED',
      implementingAgencyName: 'Pending Agency Selection',
      vendorName: 'Under Sanction Scrutiny',
      vendorPanMasked: 'PENDING',
      recommendationDate: new Date().toISOString().split('T')[0],
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
        disclaimer: 'Notice: Algorithmic assessment is advisory.'
      },
      photos: [],
      documents: [],
      payments: [],
      timeline: [
        { stage: 'Recommendation', completed: true, date: new Date().toISOString().split('T')[0] },
        { stage: 'Feasibility Check', completed: false },
        { stage: 'Sanction', completed: false },
        { stage: 'Agency Assignment', completed: false },
        { stage: 'Execution', completed: false },
        { stage: 'Completion', completed: false }
      ]
    };

    db.projects.unshift(project);
    db.addAuditLog({
      userId: user?.userId || 'MP001',
      userName: user?.name || 'MP',
      userRole: user?.role || 'MP',
      action: 'SUBMIT_RECOMMENDATION',
      targetEntity: 'Project',
      targetId: id,
      newValue: `Recommended: ${project.title} (₹${(cost / 100000).toFixed(1)}L)`,
      ipAddressMasked: '10.14.02.***'
    });
    return { project, message: 'Recommendation logged successfully.' };
  }

  async transitionProject(id: string, data: any): Promise<any> {
    const user = this.getCurrentUser();
    const project = db.projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    const result = approvalWorkflow.executeTransition({
      project,
      targetStatus: data.targetStatus,
      user: user || users[3],
      sanctionedAmount: data.sanctionedAmount ? Number(data.sanctionedAmount) : undefined,
      statutoryRemarks: data.statutoryRemarks,
      dtecClearanceRef: data.dtecClearanceRef
    });
    return { success: true, project: result.project, record: result.record, message: `Transitioned to ${data.targetStatus}` };
  }

  async updateProjectStatus(id: string, data: any): Promise<any> {
    const project = db.projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    project.status = data.status;
    if (data.sanctionedAmount) project.sanctionedAmount = Number(data.sanctionedAmount);
    return { project, message: `Status updated to ${data.status}` };
  }

  async assignAgency(id: string, data: any): Promise<any> {
    const project = db.projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    project.implementingAgencyId = data.agencyId;
    project.implementingAgencyName = data.agencyName;
    project.status = 'Assigned';
    return { project, message: 'Agency assigned.' };
  }

  async updateProgress(id: string, data: any): Promise<any> {
    const project = db.projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    project.completionPercentage = Number(data.completionPercentage || 0);
    if (data.fundsUtilized) project.fundsUtilized = Number(data.fundsUtilized);
    if (project.completionPercentage >= 100) project.status = 'Completed';
    return { project, message: 'Progress recorded.' };
  }

  async addPayment(id: string, data: any): Promise<any> {
    const project = db.projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');
    const amount = Number(data.amount);
    project.fundsUtilized += amount;
    const payment = {
      id: `pay_${Date.now()}`,
      installmentNo: project.payments.length + 1,
      amount,
      sanctionOrderNo: data.sanctionOrderNo || 'SAN/2025/DEMO',
      paidAt: new Date().toISOString().split('T')[0],
      status: 'Disbursed' as const,
      beneficiaryAgency: project.implementingAgencyName
    };
    project.payments.push(payment);
    return { project, payment, message: 'Payment recorded.' };
  }

  async getAlerts(params: any = {}): Promise<{ alerts: RiskAlert[]; count: number }> {
    return { alerts: db.alerts, count: db.alerts.length };
  }

  async actionAlert(id: string, data: any): Promise<any> {
    const alert = db.alerts.find(a => a.id === id);
    if (!alert) throw new Error('Alert not found');
    alert.status = data.status || 'Resolved';
    alert.reviewNotes = data.reviewNotes || data.notes;
    alert.resolvedAt = new Date().toISOString();

    // Feedback loop hook
    mlAnomalyModel.recordFeedback(
      alert.id,
      alert.projectId,
      alert.status,
      alert.reviewNotes || '',
      'Authorized Auditor'
    );

    return { alert, message: `Alert marked as ${alert.status} and fed into ML retraining model.` };
  }

  async getMLModelStatus(): Promise<{ metadata: MLModelMetadata; feedbackCount: number; recentFeedback: any[] }> {
    return {
      metadata: mlAnomalyModel.metadata,
      feedbackCount: db.mlFeedback.length,
      recentFeedback: db.mlFeedback.slice(0, 5)
    };
  }

  async retrainMLModel(): Promise<{ success: boolean; metadata: MLModelMetadata; message: string }> {
    const updated = mlAnomalyModel.retrain();
    return { success: true, metadata: updated, message: 'Model retrained on feedback.' };
  }

  async getCitizenFeedback(): Promise<{ feedback: CitizenFeedback[]; count: number }> {
    return { feedback: db.citizenFeedback, count: db.citizenFeedback.length };
  }

  async submitCitizenFeedback(data: any): Promise<any> {
    const project = db.projects.find(p => p.id === data.projectId);
    const feedback = feedbackPipeline.routeFeedback({
      projectId: data.projectId,
      projectTitle: project?.title || 'MPLADS Community Asset',
      projectCode: project?.projectCode || 'MPLADS-REF',
      district: project?.district || 'Hyderabad',
      citizenName: data.citizenName || 'Concerned Citizen',
      issueType: data.issueType || 'Incomplete Work',
      description: data.description || 'Citizen feedback'
    }, project);

    return {
      success: true,
      feedbackId: feedback.id,
      trackingNumber: feedback.trackingNumber,
      routedQueue: feedback.routedQueue,
      slaDeadlineDays: feedback.slaDeadlineDays
    };
  }

  async updateFeedbackStatus(id: string, status: any, adminNotes?: string): Promise<any> {
    const item = db.citizenFeedback.find(f => f.id === id);
    if (!item) throw new Error('Feedback not found');
    item.status = status;
    if (adminNotes) item.adminNotes = adminNotes;
    return { success: true, feedback: item };
  }

  async getDataQualityReports(): Promise<{ reports: DataQualityReport[]; count: number }> {
    return { reports: db.dataQualityReports, count: db.dataQualityReports.length };
  }

  async syncGovernmentData(): Promise<any> {
    return syncFromGovernmentConnector();
  }

  async ingestCsvData(csv: string, label?: string): Promise<any> {
    const { projects: imported, qualityReport } = parseExternalMpladsData(csv, label || 'Manual CSV Upload');
    for (const p of imported) db.projects.unshift(p);
    return { success: true, qualityReport, importedCount: imported.length };
  }

  async getImpactSummary(): Promise<any> {
    return calculateImpactMetrics(db.projects);
  }

  async getNotifications(): Promise<{ notifications: NotificationLog[]; count: number }> {
    return { notifications: db.notifications, count: db.notifications.length };
  }

  async dispatchTestNotification(): Promise<any> {
    const alert = db.alerts[0];
    const logs = await notificationService.dispatchAlertNotification({ alert });
    return { success: true, logs };
  }

  async getContractorNetwork(): Promise<any> {
    return analyzeContractorNetwork(db.projects);
  }

  async getSatelliteObservation(projectId: string): Promise<any> {
    const project = db.projects.find(p => p.id === projectId || p.projectCode === projectId) || db.projects[0];
    const observation = verifyProjectSatelliteImagery(project);
    return { observation };
  }

  async getAuditLogs(): Promise<{ logs: AuditLogEntry[]; count: number }> {
    return { logs: db.auditLogs, count: db.auditLogs.length };
  }

  async verifyAuditLogs(): Promise<any> {
    return db.verifyAuditLogIntegrity();
  }

  async generateAiAuditReport(projectId: string): Promise<any> {
    const p = db.projects.find(x => x.id === projectId) || db.projects[0];
    return {
      report: `
# MPLADS TECHNICAL INTEGRITY BRIEF: ${p.projectCode}
- Project: ${p.title}
- Sanctioned: ₹${((p.sanctionedAmount || p.estimatedCost) / 100000).toFixed(1)} Lakh
- Physical Progress: ${p.completionPercentage}%
- AI Risk Score: ${p.riskAnalysis?.overallScore}/100 (${p.riskAnalysis?.riskLevel})
- Observed Indicators: ${p.riskAnalysis?.reasons?.join('; ')}
- Directives: Conduct joint inspection of physical assets before releasing further tranches.
`,
      projectCode: p.projectCode,
      title: p.title
    };
  }

  async getPublicSummary(): Promise<any> {
    return {
      totalProjects: db.projects.length,
      completedProjects: db.projects.filter(p => p.status === 'Completed').length,
      activeProjects: db.projects.filter(p => p.status === 'Ongoing' || p.status === 'Sanctioned').length,
      totalFundsSanctioned: db.projects.reduce((acc, p) => acc + (p.sanctionedAmount || p.estimatedCost || 0), 0),
      totalFundsUtilized: db.projects.reduce((acc, p) => acc + (p.fundsUtilized || 0), 0)
    };
  }

  async getPublicProjects(): Promise<{ projects: Project[]; count: number }> {
    return { projects: db.projects.map(p => db.sanitizeProjectForPublic(p)), count: db.projects.length };
  }
}

export const clientMockDb = new ClientMockDbService();
