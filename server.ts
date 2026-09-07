import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

import { db } from './src/backend/security/persistence.ts';
import {
  authenticateUser,
  requireAuth,
  optionalAuth,
  requireRoles,
  requireProjectAccess
} from './src/backend/security/auth.ts';
import {
  toPublicProjectDTO,
  toMPProjectDTO,
  toAgencyProjectDTO,
  toAdminProjectDTO,
  toPublicGrievanceTrackingDTO,
  toScopedGrievanceDTO,
  toScopedVendorDTO
} from './src/backend/security/dto.ts';
import {
  evaluateCostAnomaly,
  detectDuplicateProject,
  predictProjectDelay,
  calculateRiskScore,
  computeVendorAnalytics
} from './src/backend/services/aiAnomalyService.ts';
import { verifyUploadedPhoto } from './src/backend/services/photoVerificationService.ts';
import { recordAuditLog, getAuditLogs } from './src/backend/services/auditService.ts';
import { createSampleExifJpeg } from './src/backend/utils/sampleImages.ts';
import { processAiAssistantQuery } from './src/backend/services/aiAssistantService.ts';
import {
  Project,
  Alert,
  CitizenFeedback,
  User,
  ProjectInspection,
  ProjectDocument,
  SystemNotification,
  ProjectTimelineEvent
} from './src/types/index.ts';

const PORT = 3000;
const app = express();

// Server-side Google GenAI client (lazy initialization)
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Helper: build default timeline events for a project
function generateDefaultTimeline(proj: Project, inspections: ProjectInspection[]): ProjectTimelineEvent[] {
  const events: ProjectTimelineEvent[] = [
    {
      id: `tl_${proj.id}_1`,
      stage: 'Recommended',
      date: proj.recommendedDate || '2023-06-15',
      actor: proj.mpName,
      actorRole: 'mp',
      notes: `Formally recommended for sanction under MPLADS by Member of Parliament ${proj.mpName}.`
    }
  ];

  if (proj.sanctionDate) {
    events.push({
      id: `tl_${proj.id}_2`,
      stage: 'Approved',
      date: proj.sanctionDate,
      actor: 'District Authority / Collector',
      actorRole: 'admin',
      notes: `Administrative & Technical approval granted. Sanction order issued for ₹${((proj.sanctionedCost || proj.estimatedCost) / 100000).toFixed(1)} Lakhs.`
    });
  }

  if (proj.agencyAssignedDate || proj.agencyId) {
    events.push({
      id: `tl_${proj.id}_3`,
      stage: 'Work Started',
      date: proj.agencyAssignedDate || proj.sanctionDate || '2023-09-01',
      actor: proj.agencyName || 'Executing Agency',
      actorRole: 'agency',
      notes: `Work order awarded to ${proj.vendorName || 'Contractor'}. Site mobilization and layout verification commenced.`
    });
  }

  if (proj.completionPercentage > 0) {
    events.push({
      id: `tl_${proj.id}_4`,
      stage: 'In Progress',
      date: proj.updatedAt?.split('T')[0] || '2024-01-15',
      actor: proj.agencyName || 'Executing Agency',
      actorRole: 'agency',
      notes: `Physical execution reached ${proj.completionPercentage}%. Measurement book entries updated.`
    });
  }

  const projInspections = inspections.filter((i) => i.projectId === proj.id && i.status === 'Completed');
  if (projInspections.length > 0) {
    const latest = projInspections[0];
    events.push({
      id: `tl_${proj.id}_5`,
      stage: 'Inspection',
      date: latest.inspectionDate || '2024-02-12',
      actor: latest.inspectingOfficer,
      actorRole: 'admin',
      notes: `Statutory field inspection completed. Outcome: ${latest.result}. ${latest.observations.substring(0, 100)}...`
    });
  }

  if (proj.status === 'Completed' || proj.actualCompletionDate) {
    events.push({
      id: `tl_${proj.id}_6`,
      stage: 'Completed',
      date: proj.actualCompletionDate || '2024-01-20',
      actor: 'District Monitoring Cell',
      actorRole: 'admin',
      notes: 'Final completion certificate submitted. Asset commissioned and dedicated to the public.'
    });
  }

  return events;
}

// Recalculate AI metrics across all projects
export function refreshAllAiMetrics(): void {
  const currentProjects = db.getProjects();
  const currentDocs = db.getDocuments();
  const currentInspections = db.getInspections();
  const currentFeedback = db.getFeedback();

  const updatedProjects = currentProjects.map((proj) => {
    const costAnomaly = evaluateCostAnomaly(proj, currentProjects);
    const duplicateFlag = detectDuplicateProject(proj, currentProjects);
    const delayPrediction = predictProjectDelay(proj);

    const docs = currentDocs.filter((d) => d.projectId === proj.id);
    const insp = currentInspections.filter((i) => i.projectId === proj.id);
    const openGrievances = currentFeedback.filter(
      (f) => f.projectId === proj.id && f.status !== 'Resolved' && f.status !== 'Dismissed'
    ).length;

    const completedInsp = insp.find((i) => i.status === 'Completed');
    const latestInspResult = completedInsp ? completedInsp.result : undefined;

    const hasMissingDocs =
      proj.status !== 'Recommended' &&
      !docs.some((d) => d.documentType === 'Sanction Order' || d.documentType === 'Administrative Approval');

    const updated: Project = {
      ...proj,
      costAnomaly,
      duplicateFlag,
      delayPrediction,
      documents: docs,
      inspections: insp,
      timeline: proj.timeline && proj.timeline.length > 0 ? proj.timeline : generateDefaultTimeline(proj, insp)
    };

    const { score, level, reason, reasons } = calculateRiskScore(updated, {
      unresolvedGrievanceCount: openGrievances,
      inspectionResult: latestInspResult,
      hasMissingDocuments: hasMissingDocs,
      vendorDelayHistory: proj.delayPrediction?.status === 'Delayed'
    });

    return {
      ...updated,
      riskScore: score,
      riskLevel: level,
      riskReason: reason,
      riskReasons: reasons
    };
  });

  db.setProjects(updatedProjects);
}

// Initial AI metrics refresh
refreshAllAiMetrics();

// Express Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Multer memory storage for photo verification
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 }
});

// ==========================================
// API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    system: 'MPLADS AI Integrity & Monitoring System',
    securityEngine: 'PBKDF2-RBAC-Active',
    storageMode: 'Persistent JSON Store',
    timestamp: new Date().toISOString()
  });
});

// ------------------------------------------
// 1. Authentication Endpoints
// ------------------------------------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    res.status(400).json({ error: 'User ID and password are required.' });
    return;
  }

  const result = authenticateUser(String(userId), String(password));
  if (!result) {
    // Log failed login attempt
    recordAuditLog({
      projectId: 'SYSTEM_AUTH',
      workId: 'LOGIN_GATEWAY',
      action: 'FAILED_AUTHENTICATION_ATTEMPT',
      actorId: String(userId),
      actorName: 'Unknown Caller',
      actorRole: 'citizen',
      fieldChanged: 'passwordHash',
      previousValue: 'N/A',
      newValue: 'REJECTED: Invalid credentials',
      ipAddress: req.ip
    });

    res.status(401).json({
      error: 'Invalid credentials. Please verify your official User ID and password.'
    });
    return;
  }

  // Record successful login
  recordAuditLog({
    projectId: 'SYSTEM_AUTH',
    workId: 'LOGIN_GATEWAY',
    action: 'USER_AUTHENTICATED',
    actorId: result.user.userId,
    actorName: result.user.name,
    actorRole: result.user.role,
    fieldChanged: 'sessionToken',
    previousValue: 'None',
    newValue: 'Active Session Issued',
    ipAddress: req.ip
  });

  res.json(result);
});

app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  // Return sanitized user profile without secrets
  const safeUser: User = {
    id: user.id,
    userId: user.userId,
    name: user.name,
    role: user.role,
    email: user.email,
    state: user.state,
    district: user.district,
    constituency: user.constituency,
    house: user.house,
    agencyId: user.agencyId,
    agencyName: user.agencyName,
    designation: user.designation
  };
  res.json({ user: safeUser });
});

app.post('/api/auth/logout', optionalAuth, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    db.revokeSession(token);
  }
  res.json({ success: true });
});

// ------------------------------------------
// 2. Public Analytics & eSAKSHI Stats
// ------------------------------------------
app.get('/api/stats/public', (req: Request, res: Response) => {
  const projects = db.getProjects();
  const totalAllocated = 50000000 * 543;
  const worksRecommended = projects.length;
  const worksSanctioned = projects.filter((p) =>
    ['Sanctioned', 'Assigned', 'Ongoing', 'Delayed', 'Completed'].includes(p.status)
  ).length;
  const worksCompleted = projects.filter((p) => p.status === 'Completed').length;
  const totalExpenditure = projects.reduce((acc, p) => acc + (p.utilizedCost || 0), 0);
  const sanctionedExpenditure = projects.reduce((acc, p) => acc + (p.sanctionedCost || 0), 0);

  res.json({
    allocatedLimit: totalAllocated,
    worksRecommended,
    worksSanctioned,
    worksCompleted,
    worksOngoing: projects.filter((p) => p.status === 'Ongoing' || p.status === 'Delayed').length,
    totalExpenditure,
    sanctionedExpenditure,
    updatedAt: new Date().toISOString()
  });
});

app.get('/api/stats/mps', (req: Request, res: Response) => {
  const projects = db.getProjects();
  const mpMap = new Map<string, any>();

  projects.forEach((p) => {
    if (!mpMap.has(p.mpId)) {
      mpMap.set(p.mpId, {
        mpId: p.mpId,
        mpName: p.mpName,
        house: p.house,
        state: p.state,
        constituency: p.constituency,
        allocatedAmount: 50000000,
        recommendedAmount: 0,
        sanctionedAmount: 0,
        utilizedAmount: 0,
        worksRecommended: 0,
        worksSanctioned: 0,
        worksCompleted: 0
      });
    }

    const rec = mpMap.get(p.mpId);
    rec.recommendedAmount += p.estimatedCost;
    rec.sanctionedAmount += p.sanctionedCost;
    rec.utilizedAmount += p.utilizedCost;
    rec.worksRecommended += 1;
    if (['Sanctioned', 'Assigned', 'Ongoing', 'Delayed', 'Completed'].includes(p.status)) {
      rec.worksSanctioned += 1;
    }
    if (p.status === 'Completed') {
      rec.worksCompleted += 1;
    }
  });

  res.json({ mps: Array.from(mpMap.values()) });
});

// ------------------------------------------
// 3. Project Management API (Strictly Scoped by Role & Jurisdiction)
// ------------------------------------------
app.get('/api/projects', optionalAuth, (req: Request, res: Response) => {
  const user = req.user;
  const {
    state,
    district,
    constituency,
    category,
    status,
    riskLevel,
    house,
    financialYear,
    search
  } = req.query;

  let allProjects = db.getProjects();

  // Role-Based Jurisdiction Boundaries:
  if (user) {
    if (user.role === 'mp') {
      // MP is strictly isolated to their own constituency / mpId
      const userConst = (user.constituency || '').toLowerCase();
      allProjects = allProjects.filter(
        (p) => p.mpId === user.userId || p.constituency.toLowerCase().includes(userConst)
      );
    } else if (user.role === 'agency') {
      // Agency is strictly isolated to works assigned to their agency
      const agencyName = (user.agencyName || '').toLowerCase();
      allProjects = allProjects.filter(
        (p) =>
          (Boolean(user.agencyId) && p.agencyId === user.agencyId) ||
          (Boolean(agencyName) && p.agencyName.toLowerCase().includes(agencyName))
      );
    } else if (user.role === 'admin') {
      // Central admins see all; District admins see only their district
      if (user.jurisdictionLevel === 'district' && user.district && user.district !== 'All Districts') {
        allProjects = allProjects.filter(
          (p) => p.district.toLowerCase() === user.district!.toLowerCase()
        );
      }
    }
  }

  // Filter params
  let filtered = allProjects;

  if (state && state !== 'All') {
    filtered = filtered.filter((p) => p.state.toLowerCase() === String(state).toLowerCase());
  }
  if (district && district !== 'All') {
    filtered = filtered.filter((p) => p.district.toLowerCase() === String(district).toLowerCase());
  }
  if (constituency && constituency !== 'All') {
    filtered = filtered.filter((p) => p.constituency.toLowerCase() === String(constituency).toLowerCase());
  }
  if (category && category !== 'All') {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (status && status !== 'All') {
    filtered = filtered.filter((p) => p.status === status);
  }
  if (riskLevel && riskLevel !== 'All') {
    filtered = filtered.filter((p) => p.riskLevel === riskLevel);
  }
  if (house && house !== 'All') {
    filtered = filtered.filter((p) => p.house === house);
  }
  if (financialYear && financialYear !== 'All') {
    filtered = filtered.filter((p) => p.financialYear === financialYear);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.workId.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.mpName.toLowerCase().includes(q) ||
        p.constituency.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.agencyName.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q)
    );
  }

  // DTO transformation based on role
  if (!user || user.role === 'citizen') {
    // Public safe view: strip internal risk indicators, anomaly weights, unverified photos
    const publicList = filtered.map(toPublicProjectDTO);
    res.json({ projects: publicList });
    return;
  }

  if (user.role === 'mp') {
    const mpList = filtered.map(toMPProjectDTO);
    res.json({ projects: mpList });
    return;
  }

  if (user.role === 'agency') {
    const agencyList = filtered.map(toAgencyProjectDTO);
    res.json({ projects: agencyList });
    return;
  }

  // Admin view
  const adminList = filtered.map(toAdminProjectDTO);
  res.json({ projects: adminList });
});

app.get('/api/projects/:id', optionalAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const project = db.getProjectById(id);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const user = req.user;

  // Unauthenticated Public view
  if (!user || user.role === 'citizen') {
    res.json({ project: toPublicProjectDTO(project) });
    return;
  }

  // MP: strictly isolated to own constituency
  if (user.role === 'mp') {
    const isOwner =
      project.mpId === user.userId ||
      project.constituency.toLowerCase() === (user.constituency || '').toLowerCase();
    if (!isOwner) {
      res.status(403).json({
        error: `Access Denied: MPs can only view works in their constituency (${user.constituency}). Cross-constituency access is prohibited.`
      });
      return;
    }
    res.json({ project: toMPProjectDTO(project) });
    return;
  }

  // Agency: strictly isolated to assigned works
  if (user.role === 'agency') {
    const isAssigned =
      (Boolean(user.agencyId) && project.agencyId === user.agencyId) ||
      (Boolean(user.agencyName) && project.agencyName.toLowerCase().includes(user.agencyName.toLowerCase()));
    if (!isAssigned) {
      res.status(403).json({
        error: `Access Denied: Implementing Agency can only view details of assigned works.`
      });
      return;
    }
    res.json({ project: toAgencyProjectDTO(project) });
    return;
  }

  // Admin
  if (user.role === 'admin') {
    if (user.jurisdictionLevel === 'district' && user.district && user.district !== 'All Districts') {
      if (project.district.toLowerCase() !== user.district.toLowerCase()) {
        res.status(403).json({
          error: `Access Denied: District Magistrate/Authority can only view works within ${user.district}.`
        });
        return;
      }
    }
    res.json({ project: toAdminProjectDTO(project) });
    return;
  }

  res.json({ project: toPublicProjectDTO(project) });
});

// MP Recommend New Work (Server-enforced constituency and MP ID)
app.post('/api/projects', requireAuth, requireRoles('mp', 'admin'), (req: Request, res: Response) => {
  const user = req.user!;
  const { title, description, category, estimatedCost, latitude, longitude, locationAddress } = req.body;

  if (!title || !category || !estimatedCost) {
    res.status(400).json({ error: 'Title, category, and estimated cost are mandatory fields.' });
    return;
  }

  const allProjects = db.getProjects();
  const count = allProjects.length + 1;
  const stateCode = user.state ? user.state.substring(0, 2).toUpperCase() : 'TS';
  const distCode = user.district ? user.district.substring(0, 3).toUpperCase() : 'KRM';
  const workId = `MPLADS/2024-25/${stateCode}/${distCode}/0${count}`;

  // Server sets identity parameters strictly from the authenticated token
  const newProject: Project = {
    id: `proj_${Date.now()}`,
    workId,
    title: String(title).trim(),
    description: String(description || '').trim(),
    category,
    sector: 'Community Infrastructure',
    house: user.house || 'Lok Sabha',
    mpId: user.userId,
    mpName: user.name,
    state: user.state || 'Telangana',
    district: user.district || 'Karimnagar',
    constituency: user.constituency || 'Karimnagar',
    financialYear: '2024-2025',
    estimatedCost: Number(estimatedCost),
    sanctionedCost: 0,
    utilizedCost: 0,
    status: 'Recommended',
    latitude: Number(latitude) || 18.5000,
    longitude: Number(longitude) || 79.1500,
    locationAddress: String(locationAddress || `${user.district}, ${user.state}`).trim(),
    agencyId: '',
    agencyName: 'Unassigned',
    vendorName: 'Unassigned',
    recommendedDate: new Date().toISOString().split('T')[0],
    completionPercentage: 0,
    riskScore: 15,
    riskLevel: 'Low',
    riskReason: 'Newly recommended project pending administrative feasibility check.',
    photos: [],
    payments: [],
    progressLogs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addProject(newProject);
  refreshAllAiMetrics();

  recordAuditLog({
    projectId: newProject.id,
    workId: newProject.workId,
    action: 'New Work Recommended',
    actorId: user.userId,
    actorName: user.name,
    actorRole: user.role,
    fieldChanged: 'status',
    previousValue: 'None',
    newValue: 'Recommended',
    ipAddress: req.ip
  });

  res.status(201).json({ project: newProject });
});

// Admin Approve / Sanction / Assign Agency
app.put(
  '/api/projects/:id/status',
  requireAuth,
  requireRoles('admin'),
  requireProjectAccess('id'),
  (req: Request, res: Response) => {
    const user = req.user!;
    const project = req.targetProject!;
    const { status, sanctionedCost, agencyId, agencyName, vendorName } = req.body;
    const previousStatus = project.status;

    const updated = db.updateProject(project.id, (p) => {
      if (status) p.status = status;
      if (sanctionedCost !== undefined) p.sanctionedCost = Number(sanctionedCost);
      if (agencyId) p.agencyId = agencyId;
      if (agencyName) p.agencyName = agencyName;
      if (vendorName) p.vendorName = vendorName;
      if (status === 'Sanctioned' && !p.sanctionDate) {
        p.sanctionDate = new Date().toISOString().split('T')[0];
        p.expectedCompletionDate = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
      }
    });

    refreshAllAiMetrics();

    recordAuditLog({
      projectId: project.id,
      workId: project.workId,
      action: `Project Status Changed to ${status}`,
      actorId: user.userId,
      actorName: user.name,
      actorRole: 'admin',
      fieldChanged: 'status',
      previousValue: previousStatus,
      newValue: status,
      ipAddress: req.ip
    });

    res.json({ project: updated });
  }
);

// Implementing Agency Update Milestone Progress (with strict ownership check)
app.put(
  '/api/projects/:id/progress',
  requireAuth,
  requireRoles('agency', 'admin'),
  requireProjectAccess('id'),
  (req: Request, res: Response) => {
    const user = req.user!;
    const project = req.targetProject!;
    const { percentage, description } = req.body;
    const prevPct = project.completionPercentage;
    const numPct = Math.min(100, Math.max(0, Number(percentage)));

    const updated = db.updateProject(project.id, (p) => {
      p.completionPercentage = numPct;
      if (numPct === 100) {
        p.status = 'Completed';
        p.actualCompletionDate = new Date().toISOString().split('T')[0];
      } else if (p.status === 'Sanctioned' || p.status === 'Assigned') {
        p.status = 'Ongoing';
      }

      p.progressLogs.push({
        id: `pr_${Date.now()}`,
        percentage: numPct,
        description: String(description || 'Physical progress update recorded in Measurement Book (MB)').trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: user.userId
      });
    });

    refreshAllAiMetrics();

    recordAuditLog({
      projectId: project.id,
      workId: project.workId,
      action: 'Milestone Progress Updated',
      actorId: user.userId,
      actorName: user.name,
      actorRole: user.role,
      fieldChanged: 'completionPercentage',
      previousValue: `${prevPct}%`,
      newValue: `${numPct}%`,
      ipAddress: req.ip
    });

    res.json({ project: updated });
  }
);

// Agency Record Expenditure
app.put(
  '/api/projects/:id/expenditure',
  requireAuth,
  requireRoles('agency', 'admin'),
  requireProjectAccess('id'),
  (req: Request, res: Response) => {
    const user = req.user!;
    const project = req.targetProject!;
    const { amount, installmentNo, sanctionOrderNo } = req.body;
    const numAmount = Number(amount);
    const prevUtilized = project.utilizedCost;

    const updated = db.updateProject(project.id, (p) => {
      p.utilizedCost += numAmount;
      p.payments.push({
        id: `pay_${Date.now()}`,
        installmentNo: Number(installmentNo || p.payments.length + 1),
        amount: numAmount,
        sanctionOrderNo: sanctionOrderNo || `MPLADS/${new Date().getFullYear()}/SO-${Math.floor(100 + Math.random() * 900)}`,
        date: new Date().toISOString().split('T')[0],
        status: 'Released',
        utilizationCertSubmitted: true
      });
    });

    refreshAllAiMetrics();

    recordAuditLog({
      projectId: project.id,
      workId: project.workId,
      action: 'Expenditure / Payment Recorded',
      actorId: user.userId,
      actorName: user.name,
      actorRole: user.role,
      fieldChanged: 'utilizedCost',
      previousValue: `₹${prevUtilized.toLocaleString()}`,
      newValue: `₹${(updated?.utilizedCost || prevUtilized + numAmount).toLocaleString()}`,
      ipAddress: req.ip
    });

    res.json({ project: updated });
  }
);

// ------------------------------------------
// 4. Photo Verification API
// ------------------------------------------
app.post(
  '/api/verify/photo',
  requireAuth,
  requireRoles('agency', 'admin'),
  upload.single('photo'),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      const { projectId, stage, notes } = req.body;
      let fileBuffer: Buffer | null = null;

      if (req.file) {
        fileBuffer = req.file.buffer;
      } else if (req.body.imageBase64) {
        const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
        fileBuffer = Buffer.from(base64Data, 'base64');
      }

      if (!fileBuffer) {
        res.status(400).json({ error: 'No image file or base64 payload provided.' });
        return;
      }

      const allProjects = db.getProjects();
      const targetProject = allProjects.find((p) => p.id === projectId) || allProjects[0];

      // Verify agency assignment on photo submission
      if (user.role === 'agency') {
        const isAssigned =
          (Boolean(user.agencyId) && targetProject.agencyId === user.agencyId) ||
          (Boolean(user.agencyName) && targetProject.agencyName.toLowerCase().includes(user.agencyName.toLowerCase()));

        if (!isAssigned) {
          res.status(403).json({
            error: `Access Denied: Work is assigned to '${targetProject.agencyName}'. You cannot submit photos for another agency's work.`
          });
          return;
        }
      }

      const verificationResult = await verifyUploadedPhoto(fileBuffer, targetProject, allProjects);

      const newPhoto = {
        id: `ph_${Date.now()}`,
        url: req.body.photoUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=800',
        stage: (stage as any) || 'During-Work',
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.userId,
        fileName: req.file ? req.file.originalname : 'site_inspection_photo.jpg',
        exifStatus: verificationResult.status,
        exifGps: verificationResult.extractedCoordinates || undefined,
        distanceMeters: verificationResult.distanceMeters ?? undefined,
        device: `${verificationResult.cameraMake || ''} ${verificationResult.cameraModel || ''}`.trim() || undefined,
        software: verificationResult.software || undefined,
        pHash: verificationResult.perceptualHash,
        notes: notes || verificationResult.reasons.join(' | ')
      };

      db.updateProject(targetProject.id, (p) => {
        p.photos.push(newPhoto);
      });

      // If location mismatch or suspicious, generate a high-priority alert
      if (verificationResult.status === 'Mismatch' || verificationResult.status === 'Suspicious') {
        const newAlert: Alert = {
          id: `alt_${Date.now()}`,
          projectId: targetProject.id,
          workId: targetProject.workId,
          projectTitle: targetProject.title,
          state: targetProject.state,
          district: targetProject.district,
          type: verificationResult.status === 'Mismatch' ? 'Location Mismatch' : 'Photo Anomaly',
          riskLevel: 'Critical',
          reason: verificationResult.reasons[0] || 'Inspection photo flagged by AI integrity engine.',
          evidence: `Extracted coordinates: ${verificationResult.extractedCoordinates ? `${verificationResult.extractedCoordinates.lat.toFixed(4)}°N, ${verificationResult.extractedCoordinates.lng.toFixed(4)}°E` : 'None'}. Distance: ${verificationResult.distanceMeters ?? 'N/A'}m. Software: ${verificationResult.software || 'None'}.`,
          status: 'Open',
          assignedOfficer: 'District Authority',
          createdAt: new Date().toISOString()
        };
        db.addAlert(newAlert);
      }

      refreshAllAiMetrics();

      recordAuditLog({
        projectId: targetProject.id,
        workId: targetProject.workId,
        action: `Site Photo Uploaded (${verificationResult.status})`,
        actorId: user.userId,
        actorName: user.name,
        actorRole: user.role,
        fieldChanged: 'photos',
        previousValue: 'Photo Added',
        newValue: `Status: ${verificationResult.status}, Dist: ${verificationResult.distanceMeters ?? 'N/A'}m`,
        ipAddress: req.ip
      });

      res.json({ verification: verificationResult });
    } catch (err: any) {
      console.error('Error during photo verification:', err);
      res.status(500).json({ error: 'Failed to process photo verification', details: err.message });
    }
  }
);

// Pre-generated Interactive Verification Testing Samples
app.get('/api/verify/test-samples', async (req: Request, res: Response) => {
  const allProjects = db.getProjects();
  const targetProject = allProjects[0];

  const passingJpeg = createSampleExifJpeg({
    lat: 18.5721,
    lng: 79.1315,
    make: 'Samsung',
    model: 'SM-T575 Galaxy Tab Active3',
    software: 'OpenCamera 1.51',
    hasExif: true
  });
  const passingResult = await verifyUploadedPhoto(passingJpeg, targetProject, allProjects);

  const mismatchJpeg = createSampleExifJpeg({
    lat: 18.6025,
    lng: 79.1610,
    make: 'Apple',
    model: 'iPhone 12',
    software: 'Adobe Photoshop 24.2 (Macintosh)',
    hasExif: true
  });
  const mismatchResult = await verifyUploadedPhoto(mismatchJpeg, targetProject, allProjects);

  const strippedJpeg = createSampleExifJpeg({ hasExif: false });
  const strippedResult = await verifyUploadedPhoto(strippedJpeg, targetProject, allProjects);

  res.json({
    targetProject: {
      id: targetProject.id,
      workId: targetProject.workId,
      title: targetProject.title,
      latitude: targetProject.latitude,
      longitude: targetProject.longitude
    },
    samples: [
      {
        id: 'sample_pass',
        name: 'Authentic On-Site Inspection (Passing)',
        description: 'Captured with Govt-issued Samsung Tablet 45m from registered water tank site, original OpenCamera firmware.',
        result: passingResult
      },
      {
        id: 'sample_mismatch',
        name: 'Location Mismatch & Software Edit (Failing)',
        description: 'Captured 3,420m away from registered site with Adobe Photoshop metadata fingerprint.',
        result: mismatchResult
      },
      {
        id: 'sample_stripped',
        name: 'Stripped EXIF Metadata (Unverifiable)',
        description: 'All camera and GPS tags stripped from header payload; flagged as Unverifiable per Section 6 Guidelines.',
        result: strippedResult
      }
    ]
  });
});

// ------------------------------------------
// 5. Alerts & Human Review Workflow (Scoped)
// ------------------------------------------
app.get('/api/alerts', requireAuth, requireRoles('admin', 'mp'), (req: Request, res: Response) => {
  const user = req.user!;
  let alerts = db.getAlerts();
  const allProjects = db.getProjects();

  if (user.role === 'mp') {
    const userConst = (user.constituency || '').toLowerCase();
    const mpProjectIds = new Set(
      allProjects
        .filter((p) => p.mpId === user.userId || p.constituency.toLowerCase().includes(userConst))
        .map((p) => p.id)
    );
    alerts = alerts.filter((a) => mpProjectIds.has(a.projectId));
  } else if (user.role === 'admin' && user.jurisdictionLevel === 'district' && user.district && user.district !== 'All Districts') {
    const distProjectIds = new Set(
      allProjects
        .filter((p) => p.district.toLowerCase() === user.district!.toLowerCase())
        .map((p) => p.id)
    );
    alerts = alerts.filter((a) => distProjectIds.has(a.projectId));
  }

  res.json({ alerts });
});

app.put('/api/alerts/:id/review', requireAuth, requireRoles('admin'), (req: Request, res: Response) => {
  const user = req.user!;
  const alert = db.getAlertById(req.params.id);
  if (!alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  const { status, reviewNotes } = req.body;
  const previousStatus = alert.status;

  const updated = db.updateAlert(alert.id, (a) => {
    a.status = status;
    if (reviewNotes) a.reviewNotes = reviewNotes;
    a.reviewedBy = user.userId;
    a.reviewedAt = new Date().toISOString();
  });

  recordAuditLog({
    projectId: alert.projectId,
    workId: alert.workId,
    action: `AI Alert Reviewed: ${status}`,
    actorId: user.userId,
    actorName: user.name,
    actorRole: 'admin',
    fieldChanged: 'alertStatus',
    previousValue: previousStatus,
    newValue: `${status} - Note: ${reviewNotes || ''}`,
    ipAddress: req.ip
  });

  res.json({ alert: updated });
});

// ------------------------------------------
// 6. Vendor & Agency Analytics (Scoped DTOs)
// ------------------------------------------
app.get('/api/analytics/vendors', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const projects = db.getProjects();
  const alerts = db.getAlerts();
  const rawAnalytics = computeVendorAnalytics(projects, alerts);
  const scopedAnalytics = rawAnalytics.map((v) => toScopedVendorDTO(v, user));
  res.json({ vendors: scopedAnalytics });
});

app.get('/api/analytics/vendors/:name', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const projects = db.getProjects();
  const alerts = db.getAlerts();
  const rawAnalytics = computeVendorAnalytics(projects, alerts);
  const target = rawAnalytics.find(
    (v) => v.vendorName.toLowerCase() === decodeURIComponent(req.params.name).toLowerCase()
  );
  if (!target) {
    res.status(404).json({ error: 'Vendor not found' });
    return;
  }
  res.json({ vendor: toScopedVendorDTO(target, user) });
});

// ------------------------------------------
// 7. Citizen Grievances & Feedback API (PII Protected)
// ------------------------------------------
// Internal feedback list (Restricted to authenticated personnel)
app.get('/api/feedback', requireAuth, requireRoles('admin', 'mp', 'agency'), (req: Request, res: Response) => {
  const user = req.user!;
  const { projectId } = req.query;
  let list = db.getFeedback();
  const allProjects = db.getProjects();

  if (projectId) {
    list = list.filter((f) => f.projectId === projectId);
  }

  if (user.role === 'mp') {
    const userConst = (user.constituency || '').toLowerCase();
    const mpProjectIds = new Set(
      allProjects
        .filter((p) => p.mpId === user.userId || p.constituency.toLowerCase().includes(userConst))
        .map((p) => p.id)
    );
    list = list.filter((f) => mpProjectIds.has(f.projectId));
  } else if (user.role === 'agency') {
    const agencyProjectIds = new Set(
      allProjects
        .filter((p) => p.agencyId === user.agencyId || p.agencyName === user.agencyName)
        .map((p) => p.id)
    );
    list = list.filter((f) => agencyProjectIds.has(f.projectId));
  }

  // Sanitize PII
  const scoped = list.map((f) => toScopedGrievanceDTO(f, user));
  res.json({ feedback: scoped });
});

// Public single tracking endpoint (Zero PII leak)
app.get('/api/feedback/track/:grievanceId', (req: Request, res: Response) => {
  const { grievanceId } = req.params;
  const cleanId = String(grievanceId).trim().toUpperCase();

  const grievance = db.getFeedbackById(cleanId);
  if (!grievance) {
    res.status(404).json({ error: `No grievance found with tracking reference "${cleanId}".` });
    return;
  }

  const project = db.getProjectById(grievance.projectId);

  res.json({
    grievance: toPublicGrievanceTrackingDTO(grievance),
    project: project
      ? {
          workId: project.workId,
          title: project.title,
          category: project.category,
          status: project.status,
          state: project.state,
          district: project.district,
          mpName: project.mpName
        }
      : undefined
  });
});

// Public Grievance Submission
app.post('/api/feedback', (req: Request, res: Response) => {
  const { projectId, issueType, citizenName, contactEmail, contactPhone, comments, photoUrl } = req.body;

  if (!projectId || !issueType || !comments) {
    res.status(400).json({ error: 'Project ID, issue type, and grievance comments are required.' });
    return;
  }

  const project = db.getProjectById(projectId);
  if (!project) {
    res.status(404).json({ error: 'Referenced MPLADS work not found.' });
    return;
  }

  const count = db.getFeedback().length + 1;
  const grievanceId = `GRV-2025-${String(count).padStart(5, '0')}`;

  const newFeedback: CitizenFeedback = {
    id: `fb_${Date.now()}`,
    grievanceId,
    projectId: project.id,
    workId: project.workId,
    projectTitle: project.title,
    issueType,
    citizenName: String(citizenName || 'Concerned Citizen').trim(),
    contactEmail: contactEmail ? String(contactEmail).trim() : undefined,
    contactPhone: contactPhone ? String(contactPhone).trim() : undefined,
    comments: String(comments).trim(),
    photoUrl: photoUrl || undefined,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  db.addFeedback(newFeedback);
  refreshAllAiMetrics();

  recordAuditLog({
    projectId: project.id,
    workId: project.workId,
    action: `Citizen Grievance Registered (${issueType})`,
    actorId: 'CITIZEN_PUBLIC',
    actorName: newFeedback.citizenName,
    actorRole: 'citizen',
    fieldChanged: 'grievance',
    previousValue: 'None',
    newValue: `ID: ${grievanceId}, Type: ${issueType}`,
    ipAddress: req.ip
  });

  // Return public tracking DTO with unique reference ID
  res.status(201).json({
    feedback: toPublicGrievanceTrackingDTO(newFeedback),
    grievanceId,
    message: `Your grievance has been formally registered under Tracking Reference ${grievanceId}.`
  });
});

app.put('/api/feedback/:id/status', requireAuth, requireRoles('admin'), (req: Request, res: Response) => {
  const user = req.user!;
  const item = db.getFeedbackById(req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Grievance record not found.' });
    return;
  }

  const { status, assignedOfficer, investigationRemarks, actionTaken } = req.body;

  const updated = db.updateFeedback(item.id, (f) => {
    if (status) f.status = status;
    if (assignedOfficer) f.assignedOfficer = assignedOfficer;
    if (investigationRemarks) f.investigationRemarks = investigationRemarks;
    if (actionTaken) f.actionTaken = actionTaken;
    if (status === 'Resolved') f.resolvedAt = new Date().toISOString();
  });

  refreshAllAiMetrics();

  recordAuditLog({
    projectId: item.projectId,
    workId: item.workId,
    action: `Grievance Status Updated (${status})`,
    actorId: user.userId,
    actorName: user.name,
    actorRole: user.role,
    fieldChanged: 'grievanceStatus',
    previousValue: item.status,
    newValue: `Status: ${status}, Action: ${actionTaken || 'None'}`,
    ipAddress: req.ip
  });

  res.json({ feedback: updated });
});

// ------------------------------------------
// 8. Immutable Audit Logs (Admin Access Only)
// ------------------------------------------
app.get('/api/audit-logs', requireAuth, requireRoles('admin'), (req: Request, res: Response) => {
  const user = req.user!;
  const { projectId } = req.query;
  let logs = db.getAuditLogs(projectId as string | undefined);

  // If district admin, scope logs to their district projects
  if (user.jurisdictionLevel === 'district' && user.district && user.district !== 'All Districts') {
    const allProjects = db.getProjects();
    const distProjectIds = new Set(
      allProjects
        .filter((p) => p.district.toLowerCase() === user.district!.toLowerCase())
        .map((p) => p.id)
    );
    logs = logs.filter((l) => distProjectIds.has(l.projectId) || l.projectId === 'SYSTEM_AUTH');
  }

  res.json({ logs });
});

// ------------------------------------------
// 9. Site Inspections Endpoints (Scoped)
// ------------------------------------------
app.get('/api/inspections', requireAuth, requireRoles('admin', 'mp', 'agency'), (req: Request, res: Response) => {
  const user = req.user!;
  const { projectId } = req.query;
  let inspections = db.getInspections();
  const allProjects = db.getProjects();

  if (projectId) {
    inspections = inspections.filter((i) => i.projectId === projectId);
  }

  if (user.role === 'mp') {
    const userConst = (user.constituency || '').toLowerCase();
    const mpProjects = new Set(
      allProjects
        .filter((p) => p.mpId === user.userId || p.constituency.toLowerCase().includes(userConst))
        .map((p) => p.id)
    );
    inspections = inspections.filter((i) => mpProjects.has(i.projectId));
  } else if (user.role === 'agency') {
    const agencyProjects = new Set(
      allProjects.filter((p) => p.agencyId === user.agencyId || p.agencyName === user.agencyName).map((p) => p.id)
    );
    inspections = inspections.filter((i) => agencyProjects.has(i.projectId));
  }

  res.json({ inspections });
});

app.post('/api/inspections', requireAuth, requireRoles('admin', 'mp'), (req: Request, res: Response) => {
  const user = req.user!;
  const { projectId, scheduledDate, inspectingOfficer, officerDesignation } = req.body;

  const project = db.getProjectById(projectId);
  if (!project) {
    res.status(404).json({ error: 'Referenced work not found.' });
    return;
  }

  // If MP, enforce constituency jurisdiction
  if (user.role === 'mp') {
    const isOwner =
      project.mpId === user.userId ||
      project.constituency.toLowerCase() === (user.constituency || '').toLowerCase();
    if (!isOwner) {
      res.status(403).json({ error: 'Cannot schedule inspection outside your MP constituency jurisdiction.' });
      return;
    }
  }

  const newInspection: ProjectInspection = {
    id: `insp_${Date.now()}`,
    projectId: project.id,
    workId: project.workId,
    projectTitle: project.title,
    district: project.district,
    state: project.state,
    inspectingOfficer: inspectingOfficer || 'Assistant Executive Engineer',
    officerDesignation: officerDesignation || 'Quality Control Monitor',
    scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
    status: 'Scheduled',
    result: 'Pending',
    checklist: [
      { item: 'Site location verification against approved DPR geo-coordinates', status: 'N/A' },
      { item: 'Civil construction physical stage & structural safety', status: 'N/A' },
      { item: 'Material quality testing certificates compliance', status: 'N/A' },
      { item: 'Measurement Book (MB) physical entries alignment', status: 'N/A' },
      { item: 'Citizen safety measures & signage installation', status: 'N/A' }
    ],
    observations: 'Inspection scheduled by Authority for milestone quality audit.',
    recommendations: 'Conduct full physical cross-verification with approved drawings.',
    photos: []
  };

  db.addInspection(newInspection);
  refreshAllAiMetrics();

  recordAuditLog({
    projectId: project.id,
    workId: project.workId,
    action: 'Site Inspection Scheduled',
    actorId: user.userId,
    actorName: user.name,
    actorRole: user.role,
    fieldChanged: 'inspections',
    previousValue: 'None',
    newValue: `Scheduled for ${newInspection.scheduledDate} by ${newInspection.inspectingOfficer}`,
    ipAddress: req.ip
  });

  res.status(201).json({ inspection: newInspection });
});

app.put('/api/inspections/:id', requireAuth, requireRoles('admin'), (req: Request, res: Response) => {
  const user = req.user!;
  const inspection = db.getInspectionById(req.params.id);
  if (!inspection) {
    res.status(404).json({ error: 'Inspection record not found.' });
    return;
  }

  const { result, observations, recommendations, checklist, photos, complianceNotes } = req.body;

  const updated = db.updateInspection(inspection.id, (i) => {
    if (result) i.result = result;
    if (observations) i.observations = observations;
    if (recommendations) i.recommendations = recommendations;
    if (complianceNotes) i.complianceNotes = complianceNotes;
    if (Array.isArray(checklist)) i.checklist = checklist;
    if (Array.isArray(photos)) i.photos = photos;
    i.status = 'Completed';
    i.inspectionDate = new Date().toISOString().split('T')[0];
    i.recordedAt = new Date().toISOString();
  });

  refreshAllAiMetrics();

  recordAuditLog({
    projectId: inspection.projectId,
    workId: inspection.workId,
    action: 'Site Inspection Findings Recorded',
    actorId: user.userId,
    actorName: user.name,
    actorRole: user.role,
    fieldChanged: 'inspectionResult',
    previousValue: 'Pending',
    newValue: `Result: ${result}, Observations: ${String(observations || '').substring(0, 60)}...`,
    ipAddress: req.ip
  });

  res.json({ inspection: updated });
});

// ------------------------------------------
// 10. Project Documents Endpoints (Scoped)
// ------------------------------------------
app.get(
  '/api/projects/:id/documents',
  requireAuth,
  requireRoles('admin', 'mp', 'agency'),
  requireProjectAccess('id'),
  (req: Request, res: Response) => {
    const project = req.targetProject!;
    const docs = db.getDocuments().filter((d) => d.projectId === project.id);
    res.json({ documents: docs });
  }
);

app.post(
  '/api/projects/:id/documents',
  requireAuth,
  requireRoles('admin', 'mp', 'agency'),
  requireProjectAccess('id'),
  (req: Request, res: Response) => {
    const user = req.user!;
    const project = req.targetProject!;
    const { documentType, title, fileName, fileUrl, fileSize, notes } = req.body;

    if (!documentType || !title) {
      res.status(400).json({ error: 'Document type and title are required.' });
      return;
    }

    const newDoc: ProjectDocument = {
      id: `doc_${Date.now()}`,
      projectId: project.id,
      workId: project.workId,
      documentType,
      title: String(title).trim(),
      fileUrl: fileUrl || `/documents/${encodeURIComponent(fileName || 'statutory_doc.pdf')}`,
      fileName: fileName || `${documentType.replace(/\s+/g, '_')}.pdf`,
      fileSize: fileSize || '1.5 MB',
      uploadedBy: user.userId,
      uploadedRole: user.role,
      uploadedAt: new Date().toISOString(),
      verificationStatus: user.role === 'admin' ? 'Verified' : 'Pending',
      verifiedBy: user.role === 'admin' ? user.userId : undefined,
      verifiedAt: user.role === 'admin' ? new Date().toISOString() : undefined,
      notes: notes || undefined
    };

    db.addDocument(newDoc);
    refreshAllAiMetrics();

    recordAuditLog({
      projectId: project.id,
      workId: project.workId,
      action: `Document Uploaded (${documentType})`,
      actorId: user.userId,
      actorName: user.name,
      actorRole: user.role,
      fieldChanged: 'documents',
      previousValue: 'None',
      newValue: `${newDoc.documentType}: ${newDoc.title}`,
      ipAddress: req.ip
    });

    res.status(201).json({ document: newDoc });
  }
);

app.put('/api/documents/:id/verify', requireAuth, requireRoles('admin'), (req: Request, res: Response) => {
  const user = req.user!;
  const doc = db.getDocumentById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document not found.' });
    return;
  }

  const { verificationStatus, notes } = req.body;

  const updated = db.updateDocument(doc.id, (d) => {
    if (verificationStatus) d.verificationStatus = verificationStatus;
    if (notes) d.notes = notes;
    d.verifiedBy = user.userId;
    d.verifiedAt = new Date().toISOString();
  });

  refreshAllAiMetrics();

  recordAuditLog({
    projectId: doc.projectId,
    workId: doc.workId,
    action: `Document Verification Updated (${verificationStatus})`,
    actorId: user.userId,
    actorName: user.name,
    actorRole: user.role,
    fieldChanged: 'documentVerificationStatus',
    previousValue: doc.verificationStatus,
    newValue: verificationStatus,
    ipAddress: req.ip
  });

  res.json({ document: updated });
});

// ------------------------------------------
// 11. System Notifications (User-Scoped)
// ------------------------------------------
app.get('/api/notifications', optionalAuth, (req: Request, res: Response) => {
  const user = req.user;
  const allNotifs = db.getNotifications();

  if (!user) {
    // Public receives only general system announcements
    const publicNotifs = allNotifs.filter((n) => n.targetRole === 'citizen' || !n.targetRole);
    res.json({ notifications: publicNotifs });
    return;
  }

  // Scoped notifications: Admin sees all, MP/Agency see notifications targeted to their role or userId
  const userNotifs = allNotifs.filter(
    (n) =>
      user.role === 'admin' ||
      n.targetRole === user.role ||
      n.targetUserId === user.userId ||
      !n.targetRole
  );

  res.json({ notifications: userNotifs });
});

app.put('/api/notifications/:id/read', optionalAuth, (req: Request, res: Response) => {
  db.markNotificationRead(req.params.id);
  res.json({ success: true });
});

app.put('/api/notifications/read-all', optionalAuth, (req: Request, res: Response) => {
  db.markAllNotificationsRead();
  res.json({ success: true });
});

// ------------------------------------------
// 12. AI Monitoring Assistant (Authoritative Scoped Grounding)
// ------------------------------------------
app.post('/api/ai/assistant', optionalAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({ error: 'Inquiry query string is required.' });
      return;
    }

    const ai = getAiClient();
    const result = await processAiAssistantQuery(
      query,
      user,
      {
        projects: db.getProjects(),
        alerts: db.getAlerts(),
        feedback: db.getFeedback(),
        inspections: db.getInspections(),
        documents: db.getDocuments()
      },
      ai
    );

    res.json(result);
  } catch (err: any) {
    console.warn('[AI Assistant Exception]:', err?.message || 'Unknown processing error');
    res.status(500).json({
      error: 'Failed to process AI assistant inquiry',
      details: err?.message || 'Internal server error'
    });
  }
});

// ------------------------------------------
// 13. Reports API
// ------------------------------------------
app.get('/api/reports/:type', optionalAuth, (req: Request, res: Response) => {
  const { type } = req.params;
  const user = req.user;
  const projects = db.getProjects();
  const alerts = db.getAlerts();

  let reportData: any = {};
  if (type === 'project' || type === 'financial') {
    reportData = {
      title: 'MPLADS Financial & Physical Progress Report',
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || 'Public Officer',
      totalProjects: projects.length,
      totalSanctioned: projects.reduce((sum, p) => sum + p.sanctionedCost, 0),
      totalUtilized: projects.reduce((sum, p) => sum + p.utilizedCost, 0),
      projects: projects.map((p) => ({
        workId: p.workId,
        title: p.title,
        state: p.state,
        district: p.district,
        mpName: p.mpName,
        category: p.category,
        sanctionedCost: p.sanctionedCost,
        utilizedCost: p.utilizedCost,
        status: p.status,
        completionPercentage: `${p.completionPercentage}%`,
        riskLevel: p.riskLevel
      }))
    };
  } else if (type === 'risk') {
    reportData = {
      title: 'MPLADS AI Risk & Integrity Exceptions Report',
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || 'Admin',
      highRiskCount: projects.filter((p) => p.riskLevel === 'High' || p.riskLevel === 'Critical').length,
      alerts
    };
  } else {
    reportData = {
      title: 'MPLADS Comprehensive Executive Summary',
      generatedAt: new Date().toISOString(),
      projectsCount: projects.length,
      alertsCount: alerts.length
    };
  }

  res.json({ report: reportData });
});

// Vite Middleware for Dev and SPA Static Fallback for Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MPLADS Integrity System running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
