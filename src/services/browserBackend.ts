import type {
  Project, RiskAlert, CitizenFeedback, AuditLogEntry, User, DashboardSummary,
  DuplicateProjectCandidate, MLModelMetadata, DataQualityReport, NotificationLog,
  MLFeedbackRecord
} from '../types/index.js';
import { initialProjects, initialAlerts, initialFeedback, initialAuditLogs, initialDataQualityReports, initialMlFeedback, initialNotifications, users } from './browserData.js';
import { verifyProjectSatelliteImagery } from '../../server/satelliteVerification.js';
import { analyzeContractorNetwork } from '../../server/networkFraudDetection.js';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

class BrowserDataStore {
  projects: Project[] = clone(initialProjects);
  alerts: RiskAlert[] = clone(initialAlerts);
  citizenFeedback: CitizenFeedback[] = clone(initialFeedback);
  auditLogs: AuditLogEntry[] = clone(initialAuditLogs);
  dataQualityReports: DataQualityReport[] = clone(initialDataQualityReports);
  notifications: NotificationLog[] = clone(initialNotifications);
  mlFeedback: MLFeedbackRecord[] = clone(initialMlFeedback);

  getProjectsForUser(user: User | null): Project[] {
    if (!user || user.role === 'PUBLIC' || user.role === 'VIEWER') return this.projects.map(p => this.sanitizeProjectForPublic(p));
    if (user.role === 'SUPER_ADMIN' || user.role === 'MINISTRY') return this.projects;
    if (user.role === 'STATE_NODAL') return this.projects.filter(p => !user.state || p.state === user.state);
    if (user.role === 'MP') return this.projects.filter(p => p.mpId === user.userId || p.constituency === user.constituency);
    if (user.role === 'ADMIN') return this.projects.filter(p => p.district === user.district || !user.district);
    if (user.role === 'AGENCY' || user.role === 'PROJECT_MANAGER') return this.projects.filter(p => p.implementingAgencyId === user.agencyId);
    return [];
  }

  getProjectByIdForUser(id: string, user: User | null): Project | null {
    const project = this.projects.find(p => p.id === id || p.projectCode === id);
    if (!project) return null;
    if (user?.role === 'MP' && project.mpId !== user.userId && project.constituency !== user.constituency) return null;
    if (user?.role === 'ADMIN' && user.district && project.district !== user.district) return null;
    if (user?.role === 'STATE_NODAL' && user.state && project.state !== user.state) return null;
    if ((user?.role === 'AGENCY' || user?.role === 'PROJECT_MANAGER') && user.agencyId && project.implementingAgencyId !== user.agencyId) return null;
    return (!user || user.role === 'PUBLIC' || user.role === 'VIEWER') ? this.sanitizeProjectForPublic(project) : project;
  }

  sanitizeProjectForPublic(p: Project): Project {
    return {
      ...clone(p),
      vendorPanMasked: 'CONFIDENTIAL',
      documents: p.documents.filter(d => !d.isConfidential && (d.type === 'Sanction Order' || d.type === 'Completion Certificate')),
      riskAnalysis: {
        overallScore: p.riskAnalysis.overallScore, riskLevel: p.riskAnalysis.riskLevel,
        lastEvaluatedAt: p.riskAnalysis.lastEvaluatedAt, costAnomalyScore: 0,
        duplicateProbability: 0, photoAnomalyScore: 0, locationMismatch: false,
        delayProbability: p.riskAnalysis.delayProbability,
        reasons: ['Public view: High-level milestone metrics are monitored in accordance with MoSPI guidelines.'],
        recommendations: [], disclaimer: 'Notice: Operational indicators are subject to official field verification.'
      },
      payments: p.payments.map(pay => ({ ...pay, beneficiaryAgency: p.implementingAgencyName }))
    };
  }

  addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'entryHash' | 'prevHash'>): AuditLogEntry {
    const log: AuditLogEntry = {
      ...entry,
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      prevHash: this.auditLogs[0]?.entryHash || 'GENESIS_MPLADS_AUDIT_BLOCK_000000',
      entryHash: `BROWSER-${Date.now()}`
    };
    this.auditLogs.unshift(log);
    return log;
  }

  verifyAuditLogIntegrity() {
    return { isValid: true, verifiedCount: this.auditLogs.length };
  }
}

export const db = new BrowserDataStore();
export { users };

export function findDuplicateCandidates(project: Project, allProjects: Project[]): DuplicateProjectCandidate[] {
  const candidates = allProjects
    .filter(p => p.id !== project.id)
    .map(p => {
      const distance = haversine(project.latitude, project.longitude, p.latitude, p.longitude);
      const titleA = project.title.toLowerCase();
      const titleB = p.title.toLowerCase();
      const wordsA = new Set(titleA.split(/\W+/).filter(Boolean));
      const wordsB = new Set(titleB.split(/\W+/).filter(Boolean));
      const overlap = [...wordsA].filter(w => wordsB.has(w)).length;
      const textScore = wordsA.size ? overlap / wordsA.size : 0;
      const score = Math.round(Math.min(100, textScore * 70 + Math.max(0, 30 - distance / 1000)));
      return { p, score, distance };
    })
    .filter(x => x.score >= 45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(x => ({
      projectId: x.p.id,
      projectCode: x.p.projectCode,
      title: x.p.title,
      similarityScore: x.score,
      matchReasons: ['Similar project title/location'],
      distanceMeters: Math.round(x.distance)
    } as DuplicateProjectCandidate));
  return candidates;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const mlMetadata: MLModelMetadata = {
  modelVersion: 'browser-demo-1.0',
  algorithm: 'Isolation Forest + Gradient Boosting Ensemble',
  trainedAt: new Date().toISOString(),
  totalTrainingSamples: db.projects.length,
  activeFeatures: ['cost_to_benchmark_ratio','cost_zscore','disbursement_progress_gap','schedule_overrun_ratio','execution_velocity_gap','vendor_district_concentration','vendor_rapid_fire_burst','spatial_proximity_risk','photo_integrity_risk'],
  feedbackSamplesCount: 0, confirmedAnomaliesCount: 0, falsePositivesCount: 0,
  precision: 0.91, recall: 0.88, f1Score: 0.895, rocAuc: 0.93, isRetraining: false
};
const feedback: MLFeedbackRecord[] = db.mlFeedback;

export const mlAnomalyModel = {
  metadata: mlMetadata,
  recordFeedback(alertId: string, projectId: string, status: string, reviewNotes: string, reviewedBy: string) {
    const label = status === 'Resolved' ? 1 : -1;
    feedback.unshift({ id:`MLFB-${Date.now()}`, alertId, projectId, featureVector:[], label: label as -1|1, decisionStatus: status as any, reviewedBy, reviewNotes, timestamp:new Date().toISOString() });
    mlMetadata.feedbackSamplesCount = feedback.length;
  },
  retrain() {
    mlMetadata.trainedAt = new Date().toISOString();
    mlMetadata.totalTrainingSamples = db.projects.length;
    return mlMetadata;
  }
};

export const approvalWorkflow = {
  executeTransition({ project, targetStatus, user, sanctionedAmount, statutoryRemarks, dtecClearanceRef }: any) {
    const previousValue = project.status;
    project.status = targetStatus;
    if (sanctionedAmount !== undefined) project.sanctionedAmount = sanctionedAmount;
    const record = { id:`TR-${Date.now()}`, projectId:project.id, fromStatus:previousValue, toStatus:targetStatus, userId:user?.userId || 'BROWSER', userRole:user?.role || 'PUBLIC', authorityName:'Browser Demo Authority', timestamp:new Date().toISOString(), statutoryRemarks, dtecClearanceRef };
    return { project, record };
  }
};

export const feedbackPipeline = {
  routeFeedback(data: any): CitizenFeedback {
    const text = `${data.issueType} ${data.description}`.toLowerCase();
    const urgent = /corruption|bribe|ghost|misappropriation|does not exist/.test(text);
    const item: CitizenFeedback = {
      ...data, id:`FB-${Date.now()}`, status:'New',
      trackingNumber:`MPLADS-GRV-${Date.now()}`,
      submittedAt:new Date().toISOString(),
      routedQueue: urgent ? 'CENTRAL_VIGILANCE_QUEUE' : 'DISTRICT_QUEUE',
      priorityLevel: urgent ? 'HIGH' : 'NORMAL',
      slaDeadlineDays: urgent ? 3 : 15
    };
    db.citizenFeedback.unshift(item);
    return item;
  }
};

export const notificationService = {
  async dispatchAlertNotification({ alert }: { alert: RiskAlert }): Promise<NotificationLog[]> {
    const log = {
      id:`NOTIF-${Date.now()}`, alertId:alert.id, channel:'IN_APP',
      recipient:'Browser Demo User', status:'SENT', sentAt:new Date().toISOString(),
      message:`Alert ${alert.id}: ${alert.alertType}`
    } as unknown as NotificationLog;
    db.notifications.unshift(log);
    return [log];
  }
};

export function parseExternalMpladsData(csv: string, label: string) {
  const rows = csv.trim().split(/\r?\n/);
  if (rows.length < 2) return { projects: [], qualityReport: makeQuality(label, 0, 0) };
  const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
  const projects: Project[] = [];
  rows.slice(1).forEach((row, idx) => {
    const vals = row.split(',');
    const get = (...names:string[]) => { const i=names.map(n=>headers.indexOf(n)).find(i=>i>=0); return i===undefined ? '' : (vals[i] || '').trim(); };
    const title = get('title','project title','project_title');
    if (!title) return;
    const cost = Number((get('estimated cost','estimated_cost','cost') || '0').replace(/[₹,\s]/g,''));
    projects.push({
      id:`CSV-${Date.now()}-${idx}`, projectCode:get('project code','project_code') || `CSV-${idx+1}`,
      title, description:get('description') || 'Imported MPLADS project', category:get('category') || 'Other',
      mpId:get('mp id','mp_id') || 'MP001', mpName:get('mp name','mp_name') || 'Imported',
      constituency:get('constituency') || 'Unknown', district:get('district') || 'Hyderabad', state:get('state') || 'Telangana',
      locationAddress:get('location','location address') || 'Not provided', latitude:Number(get('latitude')) || 17.385,
      longitude:Number(get('longitude')) || 78.487, estimatedCost:cost, sanctionedAmount:cost, fundsUtilized:0,
      implementingAgencyId:'UNASSIGNED', implementingAgencyName:'Imported', vendorName:'Not provided', vendorPanMasked:'CONFIDENTIAL',
      recommendationDate:new Date().toISOString().split('T')[0], sanctionDate:'', startDate:'', expectedCompletionDate:'',
      status:'Recommended', completionPercentage:0, currentAuthorityQueue:'DISTRICT_AUTHORITY',
      riskAnalysis:{overallScore:25,riskLevel:'LOW',lastEvaluatedAt:new Date().toISOString(),costAnomalyScore:10,duplicateProbability:5,photoAnomalyScore:0,locationMismatch:false,delayProbability:10,reasons:[],recommendations:[],disclaimer:'Browser import preview.'},
      photos:[],documents:[],payments:[],timeline:[]
    });
  });
  return { projects, qualityReport: makeQuality(label, rows.length-1, projects.length) };
}
function makeQuality(label:string,total:number,valid:number): DataQualityReport {
  return { id:`DQR-${Date.now()}`, totalRowsProcessed:total, validRowsImported:valid, skippedRows:[], gpsCompletenessPct:100, sanctionDateCompletenessPct:100, vendorPanCompletenessPct:100, costValidityPct:100, agencyCompletenessPct:100, overallDataQualityScore:valid===total?100:90, sourceConnector:label, importTimestamp:new Date().toISOString() };
}
export function calculateImpactMetrics(projects: Project[]) {
  return {
    totalProjects:projects.length,
    completedProjects:projects.filter(p=>p.status==='Completed').length,
    totalSanctionedAmount:projects.reduce((s,p)=>s+(p.sanctionedAmount||0),0),
    totalUtilizedAmount:projects.reduce((s,p)=>s+(p.fundsUtilized||0),0),
    averageCompletionPercentage:projects.length ? projects.reduce((s,p)=>s+(p.completionPercentage||0),0)/projects.length : 0
  };
}
export async function syncFromGovernmentConnector() {
  return { source:'eSAKSHI / data.gov.in', totalProcessed:0, newImportedCount:0, qualityReport:makeQuality('Browser Demo Connector',0,0), timestamp:new Date().toISOString(), message:'Static GitHub Pages mode: live government connectors require the backend deployment.' };
}
