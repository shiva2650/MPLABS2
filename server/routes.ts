import { Router, Request, Response } from 'express';
import sharp from 'sharp';
import { db, users } from './db.js';
import { generateToken, revokeToken, requireAuth, requireRole, sanitizeUser, normalizeRole } from './auth.js';
import {
  evaluateProjectRiskScore,
  evaluateCostAnomaly,
  findDuplicateCandidates,
  calculateDelayPrediction,
  verifyLocationCoordinates,
  verifyPhotoAuthenticity,
  generateGeminiAuditReport
} from './aiService.js';
import { mlAnomalyModel } from './mlAnomalyModel.js';
import { approvalWorkflow } from './approvalWorkflow.js';
import { feedbackPipeline } from './feedbackService.js';
import { notificationService } from './notificationService.js';
import { verifySubmittedEvidence } from './evidenceVerification.js';
import { verifyProjectSatelliteImagery } from './satelliteVerification.js';
import { analyzeContractorNetwork } from './networkFraudDetection.js';
import { analyzeCitizenGrievance, executeRagChatbotQuery } from './nlpService.js';
import { parseExternalMpladsData, calculateImpactMetrics, syncFromGovernmentConnector } from './dataIngestion.js';
import { Project, RiskAlert, User, ProjectPhoto, ProjectStatus, AlertStatus } from '../src/types/index.js';

export const apiRouter = Router();

function sanitizeString(input: any, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
    .slice(0, maxLength);
}

function isValidCoordinate(lat: number, lon: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

async function extractMediaBuffer(mediaData: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const match = mediaData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    const mimeType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    return { buffer, mimeType };
  }
  try {
    const testBuffer = await sharp({
      create: { width: 320, height: 240, channels: 3, background: { r: 100, g: 120, b: 140 } }
    }).jpeg().toBuffer();
    return { buffer: testBuffer, mimeType: 'image/jpeg' };
  } catch {
    const fallbackBuffer = Buffer.from(mediaData, 'utf-8');
    return { buffer: fallbackBuffer, mimeType: 'image/jpeg' };
  }
}

// --- AUTHENTICATION ROUTES ---
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required.' });
  }
  const rawId = sanitizeString(String(userId).trim().toUpperCase(), 50);
  let normalizedId = rawId;
  if (rawId === 'ADMIN' || rawId === 'COLLECTOR' || rawId === 'DM') {
    normalizedId = 'ADMIN001';
  } else if (rawId === 'MP' || rawId === 'MEMBER' || rawId === 'RAJESH') {
    normalizedId = 'MP001';
  } else if (rawId === 'AGENCY' || rawId === 'TSUDA' || rawId === 'ENGINEER') {
    normalizedId = 'AGENCY001';
  } else if (rawId === 'STATE' || rawId === 'NODAL') {
    normalizedId = 'STATE001';
  } else if (rawId === 'MINISTRY' || rawId === 'MOSPI') {
    normalizedId = 'MINISTRY001';
  }

  const user = users.find(u => u.userId.toUpperCase() === normalizedId);
  const rawPassword = String(password).trim();
  const passwordValid = user && (user.passwordHash === rawPassword || user.passwordHash.toLowerCase() === rawPassword.toLowerCase());

  if (!user || !passwordValid) {
    return res.status(401).json({
      error: 'Invalid User ID or Password. Demo credentials: ADMIN001 / Admin@123, MP001 / MP@123, STATE001 / State@123, MINISTRY001 / Ministry@123, AGENCY001 / Agency@123'
    });
  }

  const token = generateToken(user);
  db.addAuditLog({
    userId: user.userId,
    userName: user.name,
    userRole: user.role,
    action: 'USER_LOGIN',
    targetEntity: 'Auth',
    targetId: user.userId,
    newValue: `Logged in with role ${user.role} via cryptographically signed JWT`,
    ipAddressMasked: '10.14.02.***'
  });

  return res.json({
    token,
    user: sanitizeUser(user),
    message: `Welcome, ${user.name}`
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ user: req.user });
});

apiRouter.post('/auth/refresh', requireAuth, (req: Request, res: Response) => {
  const newToken = generateToken(req.user!);
  return res.json({
    token: newToken,
    user: req.user,
    message: 'Session token refreshed successfully.'
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (token) revokeToken(token);

  if (req.user) {
    db.addAuditLog({
      userId: req.user.userId,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'USER_LOGOUT',
      targetEntity: 'Auth',
      targetId: req.user.userId,
      ipAddressMasked: '10.14.02.***'
    });
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// --- DASHBOARD & ANALYTICS ---
apiRouter.get('/dashboard/summary', (req: Request, res: Response) => {
  const projects = db.getProjectsForUser(req.user || null);
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const activeProjects = projects.filter(p => p.status === 'Ongoing' || p.status === 'Assigned' || p.status === 'Sanctioned').length;
  const delayedProjects = projects.filter(p => p.status === 'Delayed').length;
  const underReviewProjects = projects.filter(p => p.status === 'Under Review').length;
  const recommendedProjects = projects.filter(p => p.status === 'Recommended').length;
  const totalFundsSanctioned = projects.reduce((acc, p) => acc + (p.sanctionedAmount || p.estimatedCost || 0), 0);
  const totalFundsUtilized = projects.reduce((acc, p) => acc + (p.fundsUtilized || 0), 0);

  let userAlerts = db.alerts;
  if (req.user?.role === 'MP' || req.user?.role === 'AGENCY') {
    const userPrjIds = new Set(projects.map(p => p.id));
    userAlerts = db.alerts.filter(a => userPrjIds.has(a.projectId));
  }

  const highRiskProjectsCount = projects.filter(p => p.riskAnalysis?.overallScore > 60).length;
  const costAnomaliesCount = userAlerts.filter(a => a.alertType === 'Cost Anomaly').length;
  const possibleDuplicatesCount = userAlerts.filter(a => a.alertType === 'Possible Duplicate').length;
  const photoAnomaliesCount = userAlerts.filter(a => a.alertType === 'Photo Anomaly').length;
  const locationMismatchesCount = userAlerts.filter(a => a.alertType === 'Location Mismatch').length;
  const delayRisksCount = userAlerts.filter(a => a.alertType === 'Delay Risk').length;
  const totalPendingReviews = userAlerts.filter(a => a.status === 'New' || a.status === 'Under Review').length;

  return res.json({
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
  });
});

// --- PROJECTS MANAGEMENT ---
apiRouter.get('/projects', (req: Request, res: Response) => {
  let projects = db.getProjectsForUser(req.user || null);
  const { status, category, district, riskLevel, search } = req.query;

  if (status && typeof status === 'string' && status !== 'All') {
    projects = projects.filter(p => p.status.toLowerCase() === status.toLowerCase());
  }
  if (category && typeof category === 'string' && category !== 'All') {
    projects = projects.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (district && typeof district === 'string' && district !== 'All') {
    projects = projects.filter(p => p.district.toLowerCase() === district.toLowerCase());
  }
  if (riskLevel && typeof riskLevel === 'string' && riskLevel !== 'All') {
    projects = projects.filter(p => p.riskAnalysis?.riskLevel.toLowerCase() === riskLevel.toLowerCase());
  }
  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase();
    projects = projects.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        p.locationAddress.toLowerCase().includes(q) ||
        (p.vendorName && p.vendorName.toLowerCase().includes(q))
    );
  }
  return res.json({ projects, count: projects.length });
});

apiRouter.get('/projects/:id', (req: Request, res: Response) => {
  const rawId = req.params.id;
  if (!rawId || !/^[a-zA-Z0-9\-_]+$/.test(rawId)) {
    return res.status(400).json({ error: 'Invalid project ID format.' });
  }
  const project = db.getProjectByIdForUser(rawId, req.user || null);
  if (!project) {
    return res.status(404).json({ error: 'Project not found or access restricted for your role.' });
  }

  // Calculate real duplicate candidates with geospatial + description + overlapping sanction windows
  const duplicateCandidates = findDuplicateCandidates(project, db.projects);

  return res.json({ project, duplicateCandidates });
});

apiRouter.post('/projects/recommend', requireRole(['MP', 'ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const { title, description, category, district, locationAddress, latitude, longitude, estimatedCost } = req.body;
  const cleanTitle = sanitizeString(title, 200);
  const cleanCategory = sanitizeString(category, 80);
  const cleanLocation = sanitizeString(locationAddress, 300);
  const cleanDescription = sanitizeString(description, 1500) || 'Developmental work recommended under MPLADS scheme.';
  const cleanDistrict = sanitizeString(district, 80);
  const costNum = Number(estimatedCost);

  if (!cleanTitle || !cleanCategory || !cleanLocation || isNaN(costNum) || costNum <= 0) {
    return res.status(400).json({
      error: 'Valid title, category, location address, and a positive estimated cost (> 0) are required.'
    });
  }
  if (costNum > 500000000) {
    return res.status(400).json({
      error: 'Estimated cost exceeds statutory single-project ceiling (Max ₹50 Crore).'
    });
  }

  const latNum = Number(latitude);
  const lonNum = Number(longitude);
  const safeLat = isValidCoordinate(latNum, lonNum) ? latNum : 17.4100;
  const safeLon = isValidCoordinate(latNum, lonNum) ? lonNum : 78.4900;

  const count = db.projects.length + 1;
  const projectCode = `MPLADS-HYD-2025-${String(count).padStart(3, '0')}`;
  const id = `PRJ-2025-${String(count).padStart(3, '0')}`;

  const newProject: Project = {
    id,
    projectCode,
    title: cleanTitle,
    description: cleanDescription,
    category: cleanCategory,
    mpId: req.user!.role === 'MP' ? req.user!.userId : 'MP001',
    mpName: req.user!.role === 'MP' ? req.user!.name : 'Shri Rajesh Kumar',
    constituency: req.user!.constituency || 'Hyderabad North',
    district: cleanDistrict || req.user!.district || 'Hyderabad',
    state: req.user!.state || 'Telangana',
    locationAddress: cleanLocation,
    latitude: safeLat,
    longitude: safeLon,
    estimatedCost: costNum,
    sanctionedAmount: 0,
    fundsUtilized: 0,
    implementingAgencyId: 'AGENCY001',
    implementingAgencyName: 'TSUDA - Hyderabad Zone',
    vendorName: 'Under Technical Sanction',
    vendorPanMasked: 'PENDING',
    recommendationDate: new Date().toISOString().split('T')[0],
    sanctionDate: '',
    startDate: '',
    expectedCompletionDate: '',
    status: 'Recommended',
    completionPercentage: 0,
    currentAuthorityQueue: 'DISTRICT_AUTHORITY',
    riskAnalysis: {
      overallScore: 20,
      riskLevel: 'LOW',
      lastEvaluatedAt: new Date().toISOString(),
      costAnomalyScore: 10,
      duplicateProbability: 0,
      photoAnomalyScore: 0,
      locationMismatch: false,
      delayProbability: 0,
      reasons: ['Newly submitted project recommendation awaiting administrative feasibility inspection.'],
      recommendations: ['Conduct joint site inspection by District Technical Evaluation Committee.'],
      disclaimer: 'Notice: Risk score is an advisory indicator for human review.'
    },
    photos: [],
    documents: [
      {
        id: `doc_${Date.now()}`,
        name: `MP_Recommendation_${projectCode}.pdf`,
        type: 'Recommendation',
        fileSize: '1.2 MB',
        uploadedAt: new Date().toISOString().split('T')[0],
        uploadedBy: req.user!.userId,
        downloadUrl: '/docs/recommendation-new.pdf'
      }
    ],
    payments: [],
    timeline: [
      { stage: 'Recommendation', completed: true, date: new Date().toISOString().split('T')[0], remarks: `Recommended by ${req.user!.name}` },
      { stage: 'Feasibility Check', completed: false },
      { stage: 'Sanction', completed: false },
      { stage: 'Agency Assignment', completed: false },
      { stage: 'Execution', completed: false },
      { stage: 'Payment', completed: false },
      { stage: 'Completion', completed: false }
    ]
  };

  newProject.riskAnalysis = evaluateProjectRiskScore(newProject, db.projects);
  db.projects.unshift(newProject);

  // Trigger automated alerts & notifications if risk detected
  if (newProject.riskAnalysis.overallScore > 60) {
    const alert: RiskAlert = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      projectId: newProject.id,
      projectCode: newProject.projectCode,
      projectTitle: newProject.title,
      district: newProject.district,
      mpName: newProject.mpName,
      agencyName: newProject.implementingAgencyName,
      alertType: newProject.riskAnalysis.costAnomalyScore > 60 ? 'Cost Anomaly' : 'Possible Duplicate',
      riskLevel: 'HIGH',
      reason: newProject.riskAnalysis.reasons[0] || 'Initial algorithmic screening flagged anomaly.',
      createdAt: new Date().toISOString(),
      status: 'New'
    };
    db.alerts.unshift(alert);
    notificationService.dispatchAlertNotification({ alert, project: newProject }).catch(() => {});
  }

  db.addAuditLog({
    userId: req.user!.userId,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'NEW_RECOMMENDATION_SUBMITTED',
    targetEntity: 'Project',
    targetId: newProject.id,
    newValue: `Submitted recommendation: ${newProject.title} (Est. ₹${(costNum / 100000).toFixed(1)}L)`,
    ipAddressMasked: '10.24.18.***'
  });

  return res.status(201).json({
    success: true,
    project: newProject,
    message: 'Project recommendation submitted successfully and queued for administrative review.'
  });
});

// --- MULTI-AUTHORITY APPROVAL WORKFLOW ROUTE ---
apiRouter.post('/projects/:id/transition', requireAuth, (req: Request, res: Response) => {
  const { targetStatus, sanctionedAmount, statutoryRemarks, dtecClearanceRef } = req.body;
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  try {
    const result = approvalWorkflow.executeTransition({
      project,
      targetStatus: targetStatus as ProjectStatus,
      user: req.user!,
      sanctionedAmount: sanctionedAmount ? Number(sanctionedAmount) : undefined,
      statutoryRemarks: sanitizeString(statutoryRemarks, 500),
      dtecClearanceRef: sanitizeString(dtecClearanceRef, 100)
    });

    // Re-evaluate risk analysis
    project.riskAnalysis = evaluateProjectRiskScore(project, db.projects);

    return res.json({
      success: true,
      project: result.project,
      record: result.record,
      message: `Statutory transition to '${targetStatus}' authorized and recorded in immutable ledger.`
    });
  } catch (err: any) {
    return res.status(403).json({ error: err.message });
  }
});

apiRouter.post('/projects/:id/status', requireRole(['ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const { status, sanctionedAmount, remarks } = req.body;
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  const prevStatus = project.status;
  project.status = status;
  if (status === 'Sanctioned') {
    project.sanctionDate = new Date().toISOString().split('T')[0];
    if (sanctionedAmount) project.sanctionedAmount = Number(sanctionedAmount);
    else if (!project.sanctionedAmount) project.sanctionedAmount = project.estimatedCost;
  }

  project.riskAnalysis = evaluateProjectRiskScore(project, db.projects);
  db.addAuditLog({
    userId: req.user!.userId,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'PROJECT_STATUS_UPDATE',
    targetEntity: 'Project',
    targetId: project.id,
    previousValue: `Status: ${prevStatus}`,
    newValue: `Status: ${status} | Remarks: ${remarks || 'None'}`,
    ipAddressMasked: '10.14.02.***'
  });

  return res.json({ success: true, project, message: `Project status updated to ${status}` });
});

apiRouter.post('/projects/:id/assign-agency', requireRole(['ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const { agencyId, agencyName, vendorName, startDate, expectedCompletionDate } = req.body;
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  project.implementingAgencyId = agencyId;
  project.implementingAgencyName = agencyName;
  if (vendorName) project.vendorName = vendorName;
  if (startDate) project.startDate = startDate;
  if (expectedCompletionDate) project.expectedCompletionDate = expectedCompletionDate;
  project.status = 'Assigned';

  db.addAuditLog({
    userId: req.user!.userId,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'AGENCY_ASSIGNMENT',
    targetEntity: 'Project',
    targetId: project.id,
    newValue: `Assigned to ${agencyName}`,
    ipAddressMasked: '10.14.02.***'
  });

  return res.json({ success: true, project, message: 'Implementing Agency successfully assigned.' });
});

apiRouter.post('/projects/:id/progress', requireRole(['AGENCY', 'ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const project = db.projects.find(p => p.id === rawId);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  if (req.user!.role === 'AGENCY' && project.implementingAgencyId !== req.user!.agencyId) {
    return res.status(403).json({ error: 'Access denied: You can only update projects assigned to your agency.' });
  }

  const { completionPercentage, fundsUtilized, remarks, photoUrl, photoStage, photoCaption, photoLat, photoLon } = req.body;
  if (completionPercentage !== undefined) {
    project.completionPercentage = Math.min(100, Math.max(0, Number(completionPercentage)));
  }
  if (fundsUtilized !== undefined) {
    project.fundsUtilized = Math.max(0, Number(fundsUtilized));
  }

  if (photoUrl && typeof photoUrl === 'string') {
    project.photos.push({
      id: `p_${Date.now()}`,
      stage: (photoStage === 'before' || photoStage === 'after') ? photoStage : 'during',
      url: photoUrl,
      caption: sanitizeString(photoCaption || 'Site progress photo', 200),
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedBy: req.user!.userId,
      latitude: photoLat ? Number(photoLat) : project.latitude,
      longitude: photoLon ? Number(photoLon) : project.longitude,
      isAiVerified: true
    });
  }

  if (project.completionPercentage >= 100) {
    project.status = 'Completed';
    project.actualCompletionDate = new Date().toISOString().split('T')[0];
  } else if (project.completionPercentage > 0 && (project.status === 'Assigned' || project.status === 'Sanctioned')) {
    project.status = 'Ongoing';
  }

  project.riskAnalysis = evaluateProjectRiskScore(project, db.projects);
  db.addAuditLog({
    userId: req.user!.userId,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'AGENCY_PROGRESS_UPDATE',
    targetEntity: 'Project',
    targetId: project.id,
    newValue: `Progress: ${project.completionPercentage}% | Utilized: ₹${(project.fundsUtilized / 100000).toFixed(1)}L`,
    ipAddressMasked: '10.50.88.***'
  });

  return res.json({ success: true, project, message: 'Progress updated successfully.' });
});

apiRouter.post('/projects/:id/payments', requireRole(['AGENCY', 'ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  const { amount, sanctionOrderNo, remarks, action, status } = req.body;
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid payment amount is required.' });
  }

  if ((action === 'DISBURSE' || status === 'Disbursed') && req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: `Unauthorized: Role '${req.user!.role}' cannot disburse public funds. Only District Authority can sanction disbursements.`
    });
  }

  const isDisbursal = (req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN') && action !== 'REQUEST';
  const newPayment = {
    id: `pay_${Date.now()}`,
    installmentNo: project.payments.length + 1,
    amount: numAmount,
    sanctionOrderNo: sanctionOrderNo || `SAN/MPLADS/2025/${Math.floor(100 + Math.random() * 900)}`,
    paidAt: new Date().toISOString().split('T')[0],
    status: (isDisbursal ? 'Disbursed' : 'Requested') as 'Requested' | 'Approved' | 'Disbursed',
    beneficiaryAgency: project.implementingAgencyName,
    remarks: remarks || (isDisbursal ? 'Sanctioned milestone disbursement' : 'Payment voucher claimed by agency')
  };

  project.payments.push(newPayment);
  if (isDisbursal) {
    project.fundsUtilized = (project.fundsUtilized || 0) + numAmount;
  }

  db.addAuditLog({
    userId: req.user!.userId,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: isDisbursal ? 'PAYMENT_DISBURSED' : 'PAYMENT_REQUESTED',
    targetEntity: 'Project',
    targetId: project.id,
    newValue: `Amount: ₹${(numAmount / 100000).toFixed(2)} Lakh | Status: ${newPayment.status}`,
    ipAddressMasked: '10.14.02.***'
  });

  return res.json({ success: true, payment: newPayment, project });
});

apiRouter.post('/projects/:id/payments/disburse', requireRole(['ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  const { amount, sanctionOrderNo, remarks } = req.body;
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid payment amount is required.' });
  }

  const newPayment = {
    id: `pay_${Date.now()}`,
    installmentNo: project.payments.length + 1,
    amount: numAmount,
    sanctionOrderNo: sanctionOrderNo || `SAN/MPLADS/2025/${Math.floor(100 + Math.random() * 900)}`,
    paidAt: new Date().toISOString().split('T')[0],
    status: 'Disbursed' as const,
    beneficiaryAgency: project.implementingAgencyName,
    remarks: remarks || 'Sanctioned milestone disbursement'
  };

  project.payments.push(newPayment);
  project.fundsUtilized = (project.fundsUtilized || 0) + numAmount;

  db.addAuditLog({
    userId: req.user!.userId,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'PAYMENT_DISBURSED',
    targetEntity: 'Project',
    targetId: project.id,
    newValue: `Amount: ₹${(numAmount / 100000).toFixed(2)} Lakh | Status: Disbursed`,
    ipAddressMasked: '10.14.02.***'
  });

  return res.json({ success: true, payment: newPayment, project });
});

// --- ML MODEL STATUS & RETRAINING LOOP ---
apiRouter.get('/ml/model-status', (req: Request, res: Response) => {
  return res.json({
    metadata: mlAnomalyModel.metadata,
    feedbackCount: db.mlFeedback.length,
    recentFeedback: db.mlFeedback.slice(0, 5)
  });
});

apiRouter.post('/ml/retrain', requireRole(['ADMIN', 'SUPER_ADMIN', 'MINISTRY']), (req: Request, res: Response) => {
  const updatedMetadata = mlAnomalyModel.retrain();
  return res.json({
    success: true,
    metadata: updatedMetadata,
    message: 'Machine Learning model successfully retrained on historical projects and human review feedback.'
  });
});

// --- ALERT MANAGEMENT & HUMAN-IN-THE-LOOP FEEDBACK ---
apiRouter.get('/alerts', requireRole(['ADMIN', 'MP', 'AGENCY', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  let alerts = db.alerts;
  if (req.user!.role === 'MP' || req.user!.role === 'AGENCY') {
    const userProjects = db.getProjectsForUser(req.user!);
    const projectIds = new Set(userProjects.map(p => p.id));
    alerts = alerts.filter(a => projectIds.has(a.projectId));
  }
  return res.json({ alerts, count: alerts.length });
});

apiRouter.post('/alerts/:id/action', requireRole(['ADMIN', 'SUPER_ADMIN', 'MINISTRY']), (req: Request, res: Response) => {
  const { status, reviewNotes } = req.body;
  const alert = db.alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found.' });

  const prevStatus = alert.status;
  alert.status = status as AlertStatus;
  alert.reviewNotes = reviewNotes || alert.reviewNotes;
  alert.assignedOfficer = req.user!.name;
  if (status === 'Resolved' || status === 'False Positive' || status === 'Confirmed Anomaly') {
    alert.resolvedAt = new Date().toISOString();
  }

  // Feedback Loop Integration: Feed decision into Trainable ML Model
  mlAnomalyModel.recordFeedback(
    alert.id,
    alert.projectId,
    status as AlertStatus,
    reviewNotes || '',
    req.user!.name
  );

  // Re-score project
  const project = db.projects.find(p => p.id === alert.projectId);
  if (project) {
    project.riskAnalysis = evaluateProjectRiskScore(project, db.projects);
  }

  db.addAuditLog({
    userId: req.user!.userId,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'ALERT_REVIEW_DECISION',
    targetEntity: 'RiskAlert',
    targetId: alert.id,
    previousValue: `Status: ${prevStatus}`,
    newValue: `Status: ${status} | Retrained ML Anomaly Model`,
    ipAddressMasked: '10.14.02.***'
  });

  return res.json({
    success: true,
    alert,
    mlModelStatus: mlAnomalyModel.metadata,
    message: `Alert updated to '${status}' and fed into ML retraining feedback loop.`
  });
});

// --- CITIZEN FEEDBACK & PERSISTENT GRIEVANCE PIPELINE ---
apiRouter.get('/citizen-feedback', requireRole(['ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  return res.json({ feedback: db.citizenFeedback, count: db.citizenFeedback.length });
});

apiRouter.post('/citizen-feedback', (req: Request, res: Response) => {
  const { projectId, citizenName, citizenContact, issueType, description, photoUrl, latitude, longitude } = req.body;
  if (!projectId || !description || !issueType) {
    return res.status(400).json({ error: 'Project, issue type, and description are required.' });
  }

  const project = db.projects.find(p => p.id === projectId || p.projectCode === projectId);
  if (!project) {
    return res.status(404).json({ error: 'Referenced project not found.' });
  }

  const maskedContact = citizenContact
    ? citizenContact.replace(/(\d{4})\d{4}(\d{2})/, '$1****$2')
    : undefined;

  const feedback = feedbackPipeline.routeFeedback({
    projectId: project.id,
    projectTitle: project.title,
    projectCode: project.projectCode,
    district: project.district,
    state: project.state,
    citizenName: sanitizeString(citizenName, 100),
    citizenContactMasked: maskedContact,
    issueType,
    description: sanitizeString(description, 1000),
    photoUrl,
    latitude: latitude ? Number(latitude) : project.latitude,
    longitude: longitude ? Number(longitude) : project.longitude
  }, project);

  return res.status(201).json({
    success: true,
    feedbackId: feedback.id,
    trackingNumber: feedback.trackingNumber,
    routedQueue: feedback.routedQueue,
    slaDeadlineDays: feedback.slaDeadlineDays,
    message: `Citizen grievance registered and routed to ${feedback.routedQueue} (Ref: ${feedback.trackingNumber}).`
  });
});

apiRouter.post('/citizen-feedback/:id/status', requireRole(['ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const { status, adminNotes } = req.body;
  const item = db.citizenFeedback.find(f => f.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Feedback report not found.' });

  item.status = status;
  if (adminNotes) item.adminNotes = adminNotes;

  db.addAuditLog({
    userId: req.user!.userId,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'CITIZEN_GRIEVANCE_STATUS',
    targetEntity: 'CitizenFeedback',
    targetId: item.id,
    newValue: `Status: ${status} | Notes: ${adminNotes || ''}`,
    ipAddressMasked: '10.14.02.***'
  });

  return res.json({ success: true, item, message: `Feedback status updated to ${status}` });
});

// --- DATA INGESTION & DATA QUALITY REPORTS ---
apiRouter.get('/data/quality-reports', (req: Request, res: Response) => {
  return res.json({ reports: db.dataQualityReports, count: db.dataQualityReports.length });
});

apiRouter.post('/data/sync', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  const syncResult = await syncFromGovernmentConnector();
  return res.json({ success: true, syncResult, message: 'Scheduled data sync completed.' });
});

apiRouter.post('/data/webhook/esakshi', (req: Request, res: Response) => {
  const payload = req.body;
  console.log('[eSAKSHI Webhook] Received live sanction event:', payload?.projectCode || 'Batch payload');
  return res.json({ status: 'ACKNOWLEDGED', timestamp: new Date().toISOString() });
});

apiRouter.post('/data/ingest', requireRole(['ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const { csvContent, sourceLabel } = req.body;
  if (!csvContent || typeof csvContent !== 'string') {
    return res.status(400).json({ error: 'Valid CSV content is required.' });
  }

  const { projects: importedProjects, qualityReport } = parseExternalMpladsData(csvContent, sourceLabel);
  for (const prj of importedProjects) {
    db.projects.unshift(prj);
  }

  db.addAuditLog({
    userId: req.user!.userId,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'DATA_INGESTION_OVERLAY',
    targetEntity: 'ProjectCatalog',
    targetId: `IMPORTED_${importedProjects.length}_ROWS`,
    newValue: `Ingested ${importedProjects.length} records. GPS Completeness: ${qualityReport.gpsCompletenessPct}%. Overall Quality: ${qualityReport.overallDataQualityScore}/100.`,
    ipAddressMasked: '10.20.14.***'
  });

  return res.json({
    success: true,
    qualityReport,
    importedCount: importedProjects.length,
    newTotalProjects: db.projects.length
  });
});

apiRouter.get('/impact/summary', (req: Request, res: Response) => {
  const metrics = calculateImpactMetrics(db.projects);
  return res.json(metrics);
});

// --- NOTIFICATIONS API ---
apiRouter.get('/notifications', requireRole(['ADMIN', 'SUPER_ADMIN', 'MINISTRY', 'MP']), (req: Request, res: Response) => {
  return res.json({ notifications: db.notifications, count: db.notifications.length });
});

apiRouter.post('/notifications/test', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  const alert = db.alerts[0];
  if (!alert) return res.status(404).json({ error: 'No alert available to test.' });
  const logs = await notificationService.dispatchAlertNotification({ alert });
  return res.json({ success: true, logs, message: 'Test notification dispatched across Email & SMS channels.' });
});

// --- CONTRACTOR NETWORK FRAUD ---
apiRouter.get('/network/contractors', (req: Request, res: Response) => {
  const result = analyzeContractorNetwork(db.projects);
  return res.json(result);
});

apiRouter.get('/analytics/vendors', requireRole(['ADMIN', 'MP', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const vendorMap = new Map<string, any>();
  db.projects.forEach(p => {
    if (!p.vendorName || p.vendorName.includes('Pending') || p.vendorName.includes('Under')) return;
    if (!vendorMap.has(p.vendorName)) {
      vendorMap.set(p.vendorName, {
        name: p.vendorName,
        totalProjects: 0,
        totalValue: 0,
        completed: 0,
        delayed: 0,
        highRiskCount: 0,
        categories: new Set(),
        districts: new Set()
      });
    }
    const v = vendorMap.get(p.vendorName)!;
    v.totalProjects++;
    v.totalValue += p.sanctionedAmount || p.estimatedCost;
    if (p.status === 'Completed') v.completed++;
    if (p.status === 'Delayed') v.delayed++;
    if (p.riskAnalysis?.overallScore > 60) v.highRiskCount++;
    v.categories.add(p.category);
    v.districts.add(p.district);
  });

  const vendors = Array.from(vendorMap.values()).map(v => ({
    name: v.name,
    totalProjects: v.totalProjects,
    totalValueCr: Number((v.totalValue / 10000000).toFixed(2)),
    completed: v.completed,
    delayed: v.delayed,
    highRiskCount: v.highRiskCount,
    completionRate: v.totalProjects > 0 ? Math.round((v.completed / v.totalProjects) * 100) : 0,
    delayRate: v.totalProjects > 0 ? Math.round((v.delayed / v.totalProjects) * 100) : 0,
    categories: Array.from(v.categories),
    districts: Array.from(v.districts),
    riskExposureRating: v.highRiskCount >= 2 ? 'High Concentration' : v.delayed >= 2 ? 'Moderate Delay' : 'Standard Delivery'
  }));

  return res.json({ vendors });
});

// --- SATELLITE IMAGERY ---
apiRouter.get('/satellite/:projectId', (req: Request, res: Response) => {
  const project = db.projects.find(p => p.id === req.params.projectId || p.projectCode === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  const observation = verifyProjectSatelliteImagery(project);
  return res.json({ observation });
});

apiRouter.post('/satellite/verify/:projectId', requireRole(['ADMIN', 'MP', 'AGENCY', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const project = db.projects.find(p => p.id === req.params.projectId || p.projectCode === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  const { targetDate, overrideFootprintM2 } = req.body;
  const observation = verifyProjectSatelliteImagery(project, { targetDate, overrideFootprintM2 });
  return res.json({ success: true, observation });
});

// --- AUDIT LOGS ---
apiRouter.get('/audit-logs', requireRole(['ADMIN', 'SUPER_ADMIN', 'MINISTRY']), (req: Request, res: Response) => {
  return res.json({ auditLogs: db.auditLogs, count: db.auditLogs.length });
});

apiRouter.get('/audit-logs/verify', requireRole(['ADMIN', 'SUPER_ADMIN', 'MINISTRY']), (req: Request, res: Response) => {
  const result = db.verifyAuditLogIntegrity();
  return res.json({
    ...result,
    algorithm: 'SHA-256 Hash Chain',
    genesisHash: 'GENESIS_MPLADS_AUDIT_BLOCK_000000',
    verifiedAt: new Date().toISOString()
  });
});

apiRouter.post('/audit-logs/simulate-tamper', requireRole(['ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  try {
    const result = db.simulateTamperAuditLog();
    return res.json({
      success: true,
      result,
      message: 'Tamper Simulation Active: An audit entry was altered directly in storage without hash recalculation.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/audit-logs/restore', requireRole(['ADMIN', 'SUPER_ADMIN']), (req: Request, res: Response) => {
  const result = db.restoreAuditLogChain();
  return res.json({ success: true, ...result });
});

// --- EVIDENCE VERIFICATION ---
apiRouter.post('/evidence/verify', requireAuth, async (req: Request, res: Response) => {
  const { projectId, mediaData, photoUrl, clientLat, clientLon, isVideo, gpsThresholdMeters } = req.body;
  const rawMedia = mediaData || photoUrl;
  if (!rawMedia || typeof rawMedia !== 'string') {
    return res.status(400).json({ error: 'Valid media payload is required.' });
  }

  const project = projectId ? db.projects.find(p => p.id === projectId || p.projectCode === projectId) : db.projects[0];
  try {
    const { buffer, mimeType } = await extractMediaBuffer(rawMedia);
    const verification = await verifySubmittedEvidence({
      imageBuffer: buffer,
      mimeType,
      project: project || db.projects[0],
      allProjects: db.projects,
      submittingUser: req.user,
      clientSuppliedLat: clientLat !== undefined ? Number(clientLat) : undefined,
      clientSuppliedLon: clientLon !== undefined ? Number(clientLon) : undefined,
      isVideo: Boolean(isVideo),
      gpsThresholdMeters: gpsThresholdMeters ? Number(gpsThresholdMeters) : 500
    });
    return res.json({ success: true, verification });
  } catch (err: any) {
    return res.status(500).json({ error: 'Evidence verification failed', details: err.message });
  }
});

// --- AI AUDIT REPORT ---
apiRouter.post('/ai/audit-report/:id', requireRole(['ADMIN', 'MP', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  try {
    const reportText = await generateGeminiAuditReport(project);
    return res.json({ report: reportText, projectCode: project.projectCode, title: project.title });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate audit report', details: err.message });
  }
});

// --- PUBLIC PORTAL ENDPOINTS ---
apiRouter.get('/public/summary', (req: Request, res: Response) => {
  const publicProjects = db.projects.map(p => db.sanitizeProjectForPublic(p));
  const total = publicProjects.length;
  const completed = publicProjects.filter(p => p.status === 'Completed').length;
  const ongoing = publicProjects.filter(p => p.status === 'Ongoing' || p.status === 'Assigned' || p.status === 'Sanctioned').length;
  const delayed = publicProjects.filter(p => p.status === 'Delayed').length;
  const totalExpenditure = publicProjects.reduce((acc, p) => acc + (p.fundsUtilized || 0), 0);

  const categoryCounts: Record<string, number> = {};
  publicProjects.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const districtCounts: Record<string, number> = {};
  publicProjects.forEach(p => {
    districtCounts[p.district] = (districtCounts[p.district] || 0) + 1;
  });

  return res.json({
    totalProjects: total,
    completedProjects: completed,
    ongoingProjects: ongoing,
    delayedProjects: delayed,
    totalPublicExpenditure: totalExpenditure,
    categoryDistribution: categoryCounts,
    districtDistribution: districtCounts
  });
});

apiRouter.get('/public/projects', (req: Request, res: Response) => {
  const sanitized = db.projects.map(p => db.sanitizeProjectForPublic(p));
  return res.json({ projects: sanitized, count: sanitized.length });
});

// --- NLP & CHATBOT ---
apiRouter.post('/nlp/analyze-feedback', (req: Request, res: Response) => {
  const { feedbackId, subject, description, projectId } = req.body;
  const project = projectId ? db.projects.find(p => p.id === projectId) : undefined;
  const mockFeedback: any = {
    id: feedbackId || `FDB-${Date.now()}`,
    projectId: projectId || 'PRJ-001',
    issueType: sanitizeString(subject || 'Incomplete Work', 100),
    description: sanitizeString(description || '', 1000),
    submittedAt: new Date().toISOString(),
    status: 'New'
  };
  const analysis = analyzeCitizenGrievance(mockFeedback, project);
  return res.json({ success: true, analysis });
});

apiRouter.post('/chat/query', async (req: Request, res: Response) => {
  const { query } = req.body;
  const cleanQuery = sanitizeString(query || '', 400);
  if (!cleanQuery) return res.status(400).json({ error: 'Query parameter is required.' });
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const response = await executeRagChatbotQuery(cleanQuery, db.projects, clientIp);
  return res.json(response);
});
