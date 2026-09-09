import { Router, Request, Response } from 'express';
import sharp from 'sharp';
import { db, users } from './db.js';
import { generateToken, revokeToken, requireAuth, requireRole, sanitizeUser, verifyPassword, requireProjectAccess, requireGrievanceAccess, requireNotificationAccess, requireAuditAccess } from './auth.js';
import { toPublicProjectDTO, toAuthorizedProjectDTO, toPublicGrievanceDTO, toInternalGrievanceDTO } from './dto.js';
import {
  evaluateProjectRiskScore,
  evaluateCostAnomaly,
  findDuplicateCandidates,
  calculateDelayPrediction,
  verifyLocationCoordinates,
  verifyPhotoAuthenticity,
  generateGeminiAuditReport
} from './aiService.js';
import { verifySubmittedEvidence } from './evidenceVerification.js';
import { analyzeContractorNetwork } from './networkFraudDetection.js';
import { analyzeCitizenGrievance, executeRagChatbotQuery } from './nlpService.js';
import { parseExternalMpladsData, calculateImpactMetrics } from './dataIngestion.js';
import { Project, RiskAlert, User, ProjectPhoto } from '../src/types/index.js';

export const apiRouter = Router();

// --- INPUT SANITIZATION & SECURITY HELPERS ---

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
  // Support Base64 data URI (data:image/jpeg;base64,...)
  const match = mediaData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    const mimeType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    return { buffer, mimeType };
  }

  // If raw string or URL, synthesize a structured JPEG buffer via sharp for testing
  try {
    const testBuffer = await sharp({
      create: {
        width: 320,
        height: 240,
        channels: 3,
        background: { r: 100, g: 120, b: 140 }
      }
    })
      .jpeg()
      .toBuffer();
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
  }

  const user = db.users.find(u => u.userId.toUpperCase() === normalizedId) || users.find(u => u.userId.toUpperCase() === normalizedId);

  const rawPassword = String(password).trim();
  // Strictly enforce password matching against stored credential (salted PBKDF2 or plaintext fallback)
  const passwordValid = user && (
    (user.salt && verifyPassword(rawPassword, user.passwordHash, user.salt)) ||
    user.passwordHash === rawPassword
  );

  if (!user || !passwordValid) {
    return res.status(401).json({
      error: 'Invalid User ID or Password. Demo credentials: ADMIN001 / Admin@123, MP001 / MP@123, AGENCY001 / Agency@123'
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

// Refresh token endpoint: verifies current JWT validity and returns freshly signed token
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
  if (token) {
    revokeToken(token);
  }
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

  const totalFundsSanctioned = projects.reduce((acc, p) => acc + (p.sanctionedAmount || 0), 0);
  const totalFundsUtilized = projects.reduce((acc, p) => acc + (p.fundsUtilized || 0), 0);

  // Role-filtered alerts count
  let userAlerts = db.alerts;
  if (req.user?.role === 'MP') {
    const userPrjIds = new Set(projects.map(p => p.id));
    userAlerts = db.alerts.filter(a => userPrjIds.has(a.projectId));
  } else if (req.user?.role === 'AGENCY') {
    const userPrjIds = new Set(projects.map(p => p.id));
    userAlerts = db.alerts.filter(a => userPrjIds.has(a.projectId));
  }

  const highRiskProjectsCount = projects.filter(p => p.riskAnalysis.overallScore > 60).length;
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
    totalPendingReviews
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
    projects = projects.filter(p => p.riskAnalysis.riskLevel.toLowerCase() === riskLevel.toLowerCase());
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase();
    projects = projects.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        p.locationAddress.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q)
    );
  }

  return res.json({ projects, count: projects.length });
});

apiRouter.get('/projects/:id', (req: Request, res: Response) => {
  const rawId = req.params.id;
  if (!rawId || !/^[a-zA-Z0-9\-_]+$/.test(rawId) || rawId.length > 64) {
    return res.status(400).json({ error: 'Invalid project ID format.' });
  }

  const rawProject = db.getProjectById(rawId);
  if (!rawProject) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  // If public or unauthenticated, return sanitized public DTO
  if (!req.user || req.user.role === 'PUBLIC') {
    const publicProject = toPublicProjectDTO(rawProject);
    return res.json({ project: publicProject, duplicateCandidates: [] });
  }

  // Role jurisdiction check (ABAC)
  if (req.user.role === 'MP') {
    const isOwner = rawProject.mpId === req.user.userId;
    const isSameConstituency = req.user.constituency && rawProject.constituency.toLowerCase() === req.user.constituency.toLowerCase();
    if (!isOwner && !isSameConstituency) {
      return res.status(403).json({ error: 'Access denied: Project does not belong to your parliamentary constituency.' });
    }
  } else if (req.user.role === 'AGENCY') {
    if (rawProject.implementingAgencyId !== req.user.agencyId) {
      return res.status(403).json({ error: 'Access denied: Project is not assigned to your implementing agency.' });
    }
  } else if (req.user.role === 'ADMIN') {
    if (req.user.district && rawProject.district.toLowerCase() !== req.user.district.toLowerCase()) {
      return res.status(403).json({ error: 'Access denied: Project is outside your district administrative jurisdiction.' });
    }
  }

  const project = toAuthorizedProjectDTO(rawProject, req.user);
  let duplicateCandidates = [];
  if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'MP')) {
    duplicateCandidates = findDuplicateCandidates(project, db.projects);
  }

  return res.json({ project, duplicateCandidates });
});

// MP / Admin Recommends New Project
apiRouter.post('/projects/recommend', requireRole(['MP', 'ADMIN']), (req: Request, res: Response) => {
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
      error: 'Estimated cost exceeds maximum permissible allocation for single MPLADS work (Max ₹50 Crore).'
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
    state: 'Telangana',
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

  // Run AI Risk evaluation engine on new project
  const riskAnalysis = evaluateProjectRiskScore(newProject, db.projects);
  newProject.riskAnalysis = riskAnalysis;

  db.projects.unshift(newProject);

  // If high cost anomaly or duplicate detected, generate automatic alert
  if (riskAnalysis.costAnomalyScore > 60) {
    db.alerts.unshift({
      id: `ALT-${Date.now().toString().slice(-4)}`,
      projectId: newProject.id,
      projectCode: newProject.projectCode,
      projectTitle: newProject.title,
      district: newProject.district,
      mpName: newProject.mpName,
      agencyName: newProject.implementingAgencyName,
      alertType: 'Cost Anomaly',
      riskLevel: 'HIGH',
      reason: `Proposed cost ₹${(costNum / 100000).toFixed(1)}L exceeds standard benchmark.`,
      createdAt: new Date().toISOString(),
      status: 'New'
    });
  }

  const duplicates = findDuplicateCandidates(newProject, db.projects);
  if (duplicates.length > 0 && duplicates[0].similarityScore >= 75) {
    db.alerts.unshift({
      id: `ALT-${Date.now().toString().slice(-4)}`,
      projectId: newProject.id,
      projectCode: newProject.projectCode,
      projectTitle: newProject.title,
      district: newProject.district,
      mpName: newProject.mpName,
      agencyName: newProject.implementingAgencyName,
      alertType: 'Possible Duplicate',
      riskLevel: 'HIGH',
      reason: `Possible duplicate identified with ${duplicates[0].candidateProject.title} (${duplicates[0].similarityScore}% match, ${duplicates[0].distanceMeters}m away).`,
      createdAt: new Date().toISOString(),
      status: 'New'
    });
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

// Administrator Sanctions / Rejects / Updates Project Status
apiRouter.post('/projects/:id/status', requireRole(['ADMIN']), (req: Request, res: Response) => {
  const { status, sanctionedAmount, remarks } = req.body;
  const project = db.projects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const prevStatus = project.status;
  project.status = status;

  if (status === 'Sanctioned') {
    project.sanctionDate = new Date().toISOString().split('T')[0];
    if (sanctionedAmount) {
      project.sanctionedAmount = Number(sanctionedAmount);
    } else if (!project.sanctionedAmount) {
      project.sanctionedAmount = project.estimatedCost;
    }
    const sanctionStep = project.timeline.find(t => t.stage === 'Sanction');
    if (sanctionStep) {
      sanctionStep.completed = true;
      sanctionStep.date = project.sanctionDate;
      sanctionStep.remarks = remarks || `Sanctioned by District Collector ${req.user!.name}`;
    }
    const feasStep = project.timeline.find(t => t.stage === 'Feasibility Check');
    if (feasStep) {
      feasStep.completed = true;
      feasStep.date = project.sanctionDate;
    }
  }

  // Re-evaluate risk
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

// Administrator Assigns Implementing Agency
apiRouter.post('/projects/:id/assign-agency', requireRole(['ADMIN']), (req: Request, res: Response) => {
  const { agencyId, agencyName, vendorName, startDate, expectedCompletionDate } = req.body;
  const project = db.projects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  project.implementingAgencyId = agencyId;
  project.implementingAgencyName = agencyName;
  if (vendorName) project.vendorName = vendorName;
  if (startDate) project.startDate = startDate;
  if (expectedCompletionDate) project.expectedCompletionDate = expectedCompletionDate;
  project.status = 'Assigned';

  const assignStep = project.timeline.find(t => t.stage === 'Agency Assignment');
  if (assignStep) {
    assignStep.completed = true;
    assignStep.date = new Date().toISOString().split('T')[0];
    assignStep.remarks = `Assigned to ${agencyName}`;
  }

  db.addAuditLog({
    userId: req.user!.userId,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'AGENCY_ASSIGNMENT',
    targetEntity: 'Project',
    targetId: project.id,
    newValue: `Assigned to ${agencyName} (Target: ${expectedCompletionDate || 'N/A'})`,
    ipAddressMasked: '10.14.02.***'
  });

  return res.json({ success: true, project, message: `Implementing Agency successfully assigned.` });
});

// Implementing Agency Updates Progress & Submits Photos/Expenditure
apiRouter.post('/projects/:id/progress', requireRole(['AGENCY', 'ADMIN']), async (req: Request, res: Response) => {
  const rawId = req.params.id;
  if (!rawId || !/^[a-zA-Z0-9\-_]+$/.test(rawId)) {
    return res.status(400).json({ error: 'Invalid project ID format.' });
  }

  const project = db.projects.find(p => p.id === rawId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  // Verify agency authorization: Agencies cannot modify projects not assigned to them
  if (req.user!.role === 'AGENCY' && project.implementingAgencyId !== req.user!.agencyId) {
    return res.status(403).json({ error: 'Access denied: You can only update projects assigned to your agency.' });
  }

  const { completionPercentage, fundsUtilized, remarks, photoUrl, photoStage, photoCaption, photoLat, photoLon, isVideo } = req.body;

  const prevComp = project.completionPercentage;
  if (completionPercentage !== undefined) {
    const compNum = Number(completionPercentage);
    if (isNaN(compNum) || compNum < 0 || compNum > 100) {
      return res.status(400).json({ error: 'Completion percentage must be a valid number between 0 and 100.' });
    }
    project.completionPercentage = Math.min(100, Math.max(0, compNum));
  }

  if (fundsUtilized !== undefined) {
    const fundsNum = Number(fundsUtilized);
    if (isNaN(fundsNum) || fundsNum < 0) {
      return res.status(400).json({ error: 'Funds utilized must be a non-negative number.' });
    }
    project.fundsUtilized = fundsNum;
  }

  const cleanRemarks = sanitizeString(remarks, 1000);
  let evidenceReviewRequired = false;
  let evidenceVerificationDetails = null;

  // If photo or video attached, run full multi-layer evidence verification engine
  if (photoUrl && typeof photoUrl === 'string') {
    const stage = (photoStage === 'before' || photoStage === 'after') ? photoStage : 'during';
    const caption = sanitizeString(photoCaption || 'Site progress media evidence', 200);
    const lat = photoLat !== undefined ? Number(photoLat) : project.latitude;
    const lon = photoLon !== undefined ? Number(photoLon) : project.longitude;

    try {
      const media = await extractMediaBuffer(photoUrl);
      const verification = await verifySubmittedEvidence({
        imageBuffer: media.buffer,
        mimeType: media.mimeType,
        project,
        allProjects: db.projects,
        submittingUser: req.user,
        clientSuppliedLat: !isNaN(lat) ? lat : undefined,
        clientSuppliedLon: !isNaN(lon) ? lon : undefined,
        isVideo: Boolean(isVideo),
        reviewScoreThreshold: 70
      });

      evidenceVerificationDetails = verification;

      const newPhoto: ProjectPhoto = {
        id: `p_${Date.now()}`,
        stage: stage as 'before' | 'during' | 'after',
        url: photoUrl,
        caption,
        uploadedAt: new Date().toISOString().split('T')[0],
        uploadedBy: req.user!.userId,
        latitude: verification.exifData.latitude !== undefined ? verification.exifData.latitude : lat,
        longitude: verification.exifData.longitude !== undefined ? verification.exifData.longitude : lon,
        isAiVerified: verification.isApproved,
        aiVerificationNotes: `Integrity Score: ${verification.integrityScore}/100 | ${verification.contentVerification.analysisNotes}`,
        similarityAlert: !verification.isApproved
      };

      project.photos.push(newPhoto);

      if (verification.requiresManualReview) {
        evidenceReviewRequired = true;
      }

      // Automatically register alerts for HIGH/CRITICAL forensic flags
      for (const flag of verification.flags) {
        if (flag.severity === 'HIGH' || flag.severity === 'CRITICAL') {
          db.alerts.unshift({
            id: `ALT-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`,
            projectId: project.id,
            projectCode: project.projectCode,
            projectTitle: project.title,
            district: project.district,
            mpName: project.mpName,
            agencyName: project.implementingAgencyName,
            alertType: flag.category === 'GPS' ? 'Location Mismatch' : 'Photo Anomaly',
            riskLevel: flag.severity,
            reason: `${flag.title}: ${flag.reason} (Confidence: ${flag.confidence}%)`,
            createdAt: new Date().toISOString(),
            status: 'New'
          });
        }
      }
    } catch (verifErr: any) {
      console.error('Evidence verification encountered an error:', verifErr);
    }
  }

  // Handle stage completion rules with integrity safeguards
  if (project.completionPercentage >= 100) {
    if (evidenceReviewRequired) {
      // Hold completion in "Under Review" pending officer review
      project.status = 'Under Review';
      const compStep = project.timeline.find(t => t.stage === 'Completion');
      if (compStep) {
        compStep.completed = false;
        compStep.remarks = 'Work marked 100% complete but flagged by AI Evidence Verification. Held for manual vigilance review.';
      }
    } else {
      project.status = 'Completed';
      project.actualCompletionDate = new Date().toISOString().split('T')[0];
      const compStep = project.timeline.find(t => t.stage === 'Completion');
      if (compStep) {
        compStep.completed = true;
        compStep.date = project.actualCompletionDate;
        compStep.remarks = cleanRemarks || 'Work completed and certified by Executive Engineer.';
      }
    }
  } else if (project.completionPercentage > 0 && (project.status === 'Assigned' || project.status === 'Sanctioned')) {
    project.status = evidenceReviewRequired ? 'Under Review' : 'Ongoing';
    const execStep = project.timeline.find(t => t.stage === 'Execution');
    if (execStep) {
      execStep.completed = true;
      execStep.date = new Date().toISOString().split('T')[0];
    }
  }

  // Re-run AI Risk Analysis
  project.riskAnalysis = evaluateProjectRiskScore(project, db.projects);

  db.addAuditLog({
    userId: req.user!.userId,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'AGENCY_PROGRESS_UPDATE',
    targetEntity: 'Project',
    targetId: project.id,
    previousValue: `Progress: ${prevComp}%`,
    newValue: `Progress: ${project.completionPercentage}% | Status: ${project.status} | Utilized: ₹${(project.fundsUtilized / 100000).toFixed(1)}L`,
    ipAddressMasked: '10.50.88.***'
  });

  return res.json({
    success: true,
    project,
    evidenceVerification: evidenceVerificationDetails,
    message: evidenceReviewRequired
      ? 'Progress updated with integrity warnings: Evidence requires manual oversight before clearance.'
      : 'Project physical progress and financial expenditure updated.'
  });
});

// Payments - Request Voucher (Agency) or Disburse Funds (District Authority / Admin only)
apiRouter.post('/projects/:id/payments', requireRole(['AGENCY', 'ADMIN']), (req: Request, res: Response) => {
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  // Verify agency authorization: Agencies cannot request payments for projects not assigned to them
  if (req.user!.role === 'AGENCY' && project.implementingAgencyId !== req.user!.agencyId) {
    return res.status(403).json({ error: 'Access denied: You can only request payment vouchers for projects assigned to your agency.' });
  }

  const { amount, sanctionOrderNo, remarks, action, status } = req.body;
  const numAmount = Number(amount);

  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid payment amount is required.' });
  }

  // Statutory Guard: Only District Authority (ADMIN) can disburse funds
  if ((action === 'DISBURSE' || status === 'Disbursed') && req.user!.role !== 'ADMIN') {
    return res.status(403).json({
      error: `Unauthorized: Role '${req.user!.role}' cannot disburse public funds. Only District Authority (ADMIN) can sanction disbursements.`
    });
  }

  const isDisbursal = req.user!.role === 'ADMIN' && action !== 'REQUEST';

  // Statutory Financial Rule: Disbursal cannot exceed total sanctioned budget
  if (isDisbursal && (project.fundsUtilized || 0) + numAmount > project.sanctionedAmount) {
    return res.status(400).json({
      error: `Statutory financial restriction: Cumulative disbursements (₹${(((project.fundsUtilized || 0) + numAmount) / 100000).toFixed(2)}L) cannot exceed sanctioned budget (₹${(project.sanctionedAmount / 100000).toFixed(2)}L).`
    });
  }

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

// Dedicated Administrator Fund Disbursal Endpoint (Strictly ADMIN only)
apiRouter.post('/projects/:id/payments/disburse', requireRole(['ADMIN']), (req: Request, res: Response) => {
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  const { amount, sanctionOrderNo, remarks } = req.body;
  const numAmount = Number(amount);

  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid payment amount is required.' });
  }

  // Statutory Financial Rule: Disbursal cannot exceed total sanctioned budget
  if ((project.fundsUtilized || 0) + numAmount > project.sanctionedAmount) {
    return res.status(400).json({
      error: `Statutory financial restriction: Cumulative disbursements (₹${(((project.fundsUtilized || 0) + numAmount) / 100000).toFixed(2)}L) cannot exceed sanctioned budget (₹${(project.sanctionedAmount / 100000).toFixed(2)}L).`
    });
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

// --- ALERT MANAGEMENT & HUMAN REVIEW WORKFLOW ---

apiRouter.get('/alerts', requireRole(['ADMIN', 'MP', 'AGENCY']), (req: Request, res: Response) => {
  let alerts = db.alerts;

  if (req.user!.role === 'MP') {
    const mpProjects = db.getProjectsForUser(req.user!);
    const projectIds = new Set(mpProjects.map(p => p.id));
    alerts = alerts.filter(a => projectIds.has(a.projectId));
  } else if (req.user!.role === 'AGENCY') {
    const agencyProjects = db.getProjectsForUser(req.user!);
    const projectIds = new Set(agencyProjects.map(p => p.id));
    alerts = alerts.filter(a => projectIds.has(a.projectId));
  }

  return res.json({ alerts, count: alerts.length });
});

// Administrator marks alert: Under Review, False Positive, Escalated, Resolved
apiRouter.post('/alerts/:id/action', requireRole(['ADMIN']), (req: Request, res: Response) => {
  const { status, reviewNotes } = req.body;
  const alert = db.alerts.find(a => a.id === req.params.id);

  if (!alert) {
    return res.status(404).json({ error: 'Alert not found.' });
  }

  const prevStatus = alert.status;
  alert.status = status;
  alert.reviewNotes = reviewNotes || alert.reviewNotes;
  alert.assignedOfficer = req.user!.name;

  if (status === 'Resolved' || status === 'False Positive') {
    alert.resolvedAt = new Date().toISOString();
  }

  // If marked False Positive or Resolved, adjust corresponding project risk score
  const project = db.projects.find(p => p.id === alert.projectId);
  if (project) {
    if (status === 'False Positive') {
      project.riskAnalysis.overallScore = Math.max(12, project.riskAnalysis.overallScore - 20);
      if (project.riskAnalysis.overallScore <= 30) project.riskAnalysis.riskLevel = 'LOW';
      else if (project.riskAnalysis.overallScore <= 60) project.riskAnalysis.riskLevel = 'MEDIUM';
    }
  }

  db.addAuditLog({
    userId: req.user!.userId,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'ALERT_REVIEW_DECISION',
    targetEntity: 'RiskAlert',
    targetId: alert.id,
    previousValue: `Status: ${prevStatus}`,
    newValue: `Status: ${status} | Notes: ${reviewNotes || 'Administrative review recorded'}`,
    ipAddressMasked: '10.14.02.***'
  });

  return res.json({ success: true, alert, message: `Alert updated to '${status}'. Human review decision saved.` });
});

// --- CITIZEN FEEDBACK & GRIEVANCE REPORTING ---

apiRouter.get('/citizen-feedback', (req: Request, res: Response) => {
  const trackingId = (req.query.id || req.query.trackingNumber) as string;

  if (!req.user || req.user.role === 'PUBLIC') {
    if (trackingId) {
      const item = db.citizenFeedback.find(f => f.id.toUpperCase() === trackingId.toUpperCase());
      if (!item) {
        return res.status(404).json({ error: 'Grievance record not found with the specified tracking reference.' });
      }
      return res.json({ feedback: [toPublicGrievanceDTO(item)], count: 1 });
    }
    return res.status(401).json({
      error: 'Authentication required to list internal grievances. Public citizens can query specific status using ?id=FB-XXX'
    });
  }

  let list = db.citizenFeedback;
  if (req.user.role === 'MP') {
    const allowedProjectIds = new Set(
      db.projects
        .filter(p => p.mpId === req.user!.userId || p.constituency === req.user!.constituency)
        .map(p => p.id)
    );
    list = list.filter(f => allowedProjectIds.has(f.projectId));
  } else if (req.user.role === 'AGENCY') {
    const allowedProjectIds = new Set(
      db.projects
        .filter(p => p.implementingAgencyId === req.user!.agencyId)
        .map(p => p.id)
    );
    list = list.filter(f => allowedProjectIds.has(f.projectId));
  }

  return res.json({
    feedback: list.map(f => toInternalGrievanceDTO(f, req.user!)),
    count: list.length
  });
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

  const newFeedback = {
    id: `FB-${String(db.citizenFeedback.length + 1).padStart(3, '0')}`,
    projectId: project.id,
    projectTitle: project.title,
    projectCode: project.projectCode,
    district: project.district,
    citizenName: citizenName || 'Concerned Citizen',
    citizenContactMasked: maskedContact,
    issueType,
    description,
    photoUrl,
    latitude: latitude ? Number(latitude) : project.latitude,
    longitude: longitude ? Number(longitude) : project.longitude,
    submittedAt: new Date().toISOString(),
    status: 'New' as const
  };

  db.citizenFeedback.unshift(newFeedback);

  return res.status(201).json({
    success: true,
    feedbackId: newFeedback.id,
    message: 'Citizen feedback received successfully. Your grievance has been registered for administrative verification.'
  });
});

apiRouter.post('/citizen-feedback/:id/status', requireRole(['ADMIN']), (req: Request, res: Response) => {
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

// --- VENDOR / AGENCY RISK ANALYTICS ---

apiRouter.get('/analytics/vendors', requireRole(['ADMIN', 'MP']), (req: Request, res: Response) => {
  const vendorMap = new Map<string, {
    name: string;
    totalProjects: number;
    totalValue: number;
    completed: number;
    delayed: number;
    highRiskCount: number;
    categories: Set<string>;
    districts: Set<string>;
  }>();

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
    if (p.riskAnalysis.overallScore > 60) v.highRiskCount++;
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

// --- AUDIT LOGS (ADMIN ONLY) ---

apiRouter.get('/audit-logs', requireRole(['ADMIN']), (req: Request, res: Response) => {
  return res.json({ auditLogs: db.auditLogs, count: db.auditLogs.length });
});

// Verify cryptographic SHA-256 hash chaining of the audit log sequence
apiRouter.get('/audit-logs/verify', requireRole(['ADMIN']), (req: Request, res: Response) => {
  const result = db.verifyAuditLogIntegrity();
  return res.json({
    ...result,
    algorithm: 'SHA-256 Hash Chain',
    genesisHash: 'GENESIS_MPLADS_AUDIT_BLOCK_000000',
    verifiedAt: new Date().toISOString()
  });
});

// --- ADVANCED EVIDENCE INTEGRITY VERIFICATION (PHOTO / VIDEO / GPS / ELA / VISION) ---

apiRouter.post('/evidence/verify', requireAuth, async (req: Request, res: Response) => {
  const { projectId, mediaData, photoUrl, clientLat, clientLon, isVideo, gpsThresholdMeters } = req.body;

  const rawMedia = mediaData || photoUrl;
  if (!rawMedia || typeof rawMedia !== 'string') {
    return res.status(400).json({ error: 'Valid media payload (Base64 data URI or image URL) is required.' });
  }

  const project = projectId ? db.projects.find(p => p.id === projectId || p.projectCode === projectId) : undefined;
  if (projectId && !project) {
    return res.status(404).json({ error: 'Referenced project not found.' });
  }

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

    return res.json({
      success: true,
      verification
    });
  } catch (err: any) {
    console.error('Evidence verification endpoint error:', err);
    return res.status(500).json({ error: 'Evidence verification failed', details: err.message });
  }
});

// --- AI INTEGRITY AUDIT REPORT (GEMINI / ML HEURISTIC) ---

apiRouter.post('/ai/audit-report/:id', requireRole(['ADMIN', 'MP']), async (req: Request, res: Response) => {
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  try {
    const reportText = await generateGeminiAuditReport(project);
    return res.json({ report: reportText, projectCode: project.projectCode, title: project.title });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate audit report', details: err.message });
  }
});

// --- PUBLIC TRANSPARENCY ENDPOINTS (NO SENSITIVE DATA) ---

apiRouter.get('/public/summary', (req: Request, res: Response) => {
  const publicProjects = db.projects.map(p => db.sanitizeProjectForPublic(p));

  const total = publicProjects.length;
  const completed = publicProjects.filter(p => p.status === 'Completed').length;
  const ongoing = publicProjects.filter(p => p.status === 'Ongoing' || p.status === 'Assigned' || p.status === 'Sanctioned').length;
  const delayed = publicProjects.filter(p => p.status === 'Delayed').length;
  const totalExpenditure = publicProjects.reduce((acc, p) => acc + (p.fundsUtilized || 0), 0);

  // Group by category
  const categoryCounts: Record<string, number> = {};
  publicProjects.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  // Group by district
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

// --- CONTRACTOR / VENDOR NETWORK FRAUD DETECTION (GRAPH ANALYSIS) ---

apiRouter.get('/network/contractors', (req: Request, res: Response) => {
  const result = analyzeContractorNetwork(db.projects);
  return res.json(result);
});

// --- NLP CITIZEN GRIEVANCE INTELLIGENCE & MULTILINGUAL RAG CHATBOT ---

apiRouter.post('/nlp/analyze-feedback', (req: Request, res: Response) => {
  const { feedbackId, subject, description, projectId } = req.body;
  const project = projectId ? db.projects.find(p => p.id === projectId) : undefined;

  const mockFeedback: any = {
    id: feedbackId || `FDB-${Date.now()}`,
    projectId: projectId || 'PRJ-001',
    subject: sanitizeString(subject || '', 200),
    description: sanitizeString(description || '', 1000),
    submittedAt: new Date().toISOString(),
    status: 'New'
  };

  const analysis = analyzeCitizenGrievance(mockFeedback, project);

  // If grievance reports ghost asset or severe fraud, inject penalty into project risk
  if (project && analysis.integrityRiskPenalty > 0) {
    project.riskAnalysis.overallScore = Math.min(99, project.riskAnalysis.overallScore + analysis.integrityRiskPenalty);
    project.riskAnalysis.reasons.push(
      `Citizen Grievance Alert (${analysis.languageName}): ${analysis.themeLabels.join(', ')} (Penalty +${analysis.integrityRiskPenalty} pts)`
    );
  }

  return res.json({ success: true, analysis });
});

apiRouter.post('/chat/query', async (req: Request, res: Response) => {
  const { query, language } = req.body;
  const cleanQuery = sanitizeString(query || '', 400);
  if (!cleanQuery) {
    return res.status(400).json({ error: 'Query parameter is required.' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const response = await executeRagChatbotQuery(cleanQuery, db.projects, clientIp, language);
  return res.json(response);
});

// --- HACKATHON LIVE SECURITY DEMO & TAMPER SIMULATION ---

apiRouter.post('/audit-logs/simulate-tamper', requireRole(['ADMIN']), (req: Request, res: Response) => {
  try {
    const result = db.simulateTamperAuditLog();
    return res.json({
      success: true,
      result,
      message: 'Tamper Simulation Active: An audit entry was altered directly in memory without hash recalculation. Click Verify to demonstrate cryptographic detection.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/audit-logs/restore', requireRole(['ADMIN']), (req: Request, res: Response) => {
  const result = db.restoreAuditLogChain();
  return res.json({ success: true, ...result });
});

// --- DATA INGESTION & IMPACT METRICS CALCULATOR ---

apiRouter.get('/impact/summary', (req: Request, res: Response) => {
  const metrics = calculateImpactMetrics(db.projects);
  return res.json(metrics);
});

apiRouter.post('/data/ingest', requireRole(['ADMIN']), (req: Request, res: Response) => {
  const { csvContent, sourceLabel } = req.body;
  if (!csvContent || typeof csvContent !== 'string') {
    return res.status(400).json({ error: 'Valid CSV content is required.' });
  }

  const { projects: importedProjects, qualityReport } = parseExternalMpladsData(csvContent, sourceLabel);

  // Add imported projects to the data store
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

// --- NOTIFICATIONS (ROLE & USER SCOPED) ---

apiRouter.get('/notifications', requireAuth, (req: Request, res: Response) => {
  const notifications = db.getNotificationsForUser(req.user!);
  const unreadCount = notifications.filter(n => !n.read).length;
  return res.json({ notifications, count: notifications.length, unreadCount });
});

const handleMarkAsRead = (req: Request, res: Response) => {
  const notifId = req.params.id || req.body?.id || req.body?.notificationId;
  if (!notifId) {
    return res.status(400).json({ error: 'Notification ID is required.' });
  }
  const success = db.markNotificationRead(notifId, req.user!);
  if (!success) {
    return res.status(404).json({ error: 'Notification not found or access restricted.' });
  }
  const notif = db.getNotificationById(notifId);
  return res.json({
    success: true,
    message: 'Notification marked as read with backend persistence.',
    notification: notif
  });
};

apiRouter.post('/notifications/:id/read', requireAuth, requireNotificationAccess, handleMarkAsRead);
apiRouter.post('/notifications/:id/mark-as-read', requireAuth, requireNotificationAccess, handleMarkAsRead);
apiRouter.patch('/notifications/:id/read', requireAuth, requireNotificationAccess, handleMarkAsRead);
apiRouter.put('/notifications/:id/read', requireAuth, requireNotificationAccess, handleMarkAsRead);
apiRouter.post('/notifications/mark-as-read', requireAuth, requireNotificationAccess, handleMarkAsRead);

apiRouter.post('/notifications/read-all', requireAuth, (req: Request, res: Response) => {
  const count = db.markAllNotificationsRead(req.user!);
  return res.json({ success: true, count, message: 'All notifications marked as read.' });
});

apiRouter.post('/notifications/reset', requireAuth, (req: Request, res: Response) => {
  const notifications = db.resetNotifications(req.user!);
  const unreadCount = notifications.filter(n => !n.read).length;
  return res.json({
    success: true,
    notifications,
    count: notifications.length,
    unreadCount,
    message: 'Notifications successfully reset to initial baseline state.'
  });
});

// --- SITE INSPECTIONS (STATUTORY OVERSIGHT) ---

apiRouter.get('/inspections', (req: Request, res: Response) => {
  const inspections = db.getInspections(req.user);
  return res.json({ inspections, count: inspections.length });
});

apiRouter.post('/inspections', requireRole(['ADMIN', 'AGENCY']), (req: Request, res: Response) => {
  const { projectId, scheduledDate, completedDate, inspectorName, inspectorDesignation, findings, riskObservations, photos } = req.body;

  if (!projectId || !scheduledDate || !findings) {
    return res.status(400).json({ error: 'Project ID, scheduled date, and findings are required.' });
  }

  const project = db.getProjectById(projectId);
  if (!project) {
    return res.status(404).json({ error: 'Referenced project not found.' });
  }

  // Agency can only inspect projects assigned to it
  if (req.user!.role === 'AGENCY' && project.implementingAgencyId !== req.user!.agencyId) {
    return res.status(403).json({ error: 'Access denied: You can only file inspection reports for projects assigned to your agency.' });
  }

  const newInspection = {
    id: `INSP-${Date.now().toString().slice(-4)}`,
    projectId: project.id,
    projectTitle: project.title,
    scheduledDate,
    completedDate: completedDate || scheduledDate,
    inspectorName: sanitizeString(inspectorName || req.user!.name, 100),
    inspectorDesignation: sanitizeString(inspectorDesignation || req.user!.designation || 'Field Engineer', 100),
    status: completedDate ? 'Completed' : 'Scheduled',
    findings: sanitizeString(findings, 2000),
    riskObservations: sanitizeString(riskObservations || '', 1000),
    photos: Array.isArray(photos) ? photos : []
  };

  db.addInspection(newInspection);

  db.addAuditLog({
    userId: req.user!.userId,
    userName: req.user!.name,
    userRole: req.user!.role,
    action: 'SITE_INSPECTION_RECORDED',
    targetEntity: 'Inspection',
    targetId: newInspection.id,
    newValue: `Inspection recorded for ${project.projectCode} by ${newInspection.inspectorName}`,
    ipAddressMasked: '10.14.02.***'
  });

  return res.status(201).json({ success: true, inspection: newInspection });
});

// --- VENDOR REGISTRY & COMPLIANCE ---

apiRouter.get('/vendors', (req: Request, res: Response) => {
  const vendors = db.getVendors(req.user);
  return res.json({ vendors, count: vendors.length });
});

