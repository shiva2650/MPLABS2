import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import {
  DEMO_USERS,
  INITIAL_PROJECTS,
  INITIAL_ALERTS,
  INITIAL_CITIZEN_FEEDBACK
} from './src/backend/data/seedData.ts';
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
import { Project, Alert, CitizenFeedback, User } from './src/types/index.ts';

const PORT = 3000;
const app = express();

// In-memory operational data stores initialized with realistic data
let projectsStore: Project[] = JSON.parse(JSON.stringify(INITIAL_PROJECTS));
let alertsStore: Alert[] = JSON.parse(JSON.stringify(INITIAL_ALERTS));
let feedbackStore: CitizenFeedback[] = JSON.parse(JSON.stringify(INITIAL_CITIZEN_FEEDBACK));

// Recalculate AI indicators across all projects at boot
function refreshAllAiMetrics() {
  projectsStore = projectsStore.map((proj) => {
    const costAnomaly = evaluateCostAnomaly(proj, projectsStore);
    const duplicateFlag = detectDuplicateProject(proj, projectsStore);
    const delayPrediction = predictProjectDelay(proj);
    const updated = {
      ...proj,
      costAnomaly,
      duplicateFlag,
      delayPrediction
    };
    const { score, level, reason } = calculateRiskScore(updated);
    return {
      ...updated,
      riskScore: score,
      riskLevel: level,
      riskReason: reason
    };
  });
}

refreshAllAiMetrics();

// Express Middlewares
app.use(cors());
// Input validation & payload size limits to guard against Denial of Service
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Multer in-memory storage for photo uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 } // 12 MB max photo upload
});

// Simple Session Token Simulation for Role-Based Access Control
const activeSessions = new Map<string, User>();

// Pre-seed demo sessions
DEMO_USERS.forEach((u) => {
  activeSessions.set(`token_${u.userId}`, u);
});

// Authentication extraction middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = activeSessions.get(token);
    if (user) {
      (req as any).user = user;
    }
  }
  next();
}

app.use(authMiddleware);

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'MPLADS AI Integrity & Monitoring System',
    timestamp: new Date().toISOString()
  });
});

// 1. Authentication Endpoints
app.post('/api/auth/login', (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required.' });
  }

  const user = DEMO_USERS.find(
    (u) => u.userId.toUpperCase() === String(userId).trim().toUpperCase() && u.passwordHash === password
  );

  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials. Demo accounts: MP001/MP@123, ADMIN001/Admin@123, AGENCY001/Agency@123'
    });
  }

  const token = `token_${user.userId}_${Date.now()}`;
  activeSessions.set(token, user);

  // Return user without password
  const { passwordHash, ...safeUser } = user;
  res.json({
    token,
    user: safeUser
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    activeSessions.delete(authHeader.substring(7));
  }
  res.json({ success: true });
});

// 2. Public Analytics & eSAKSHI Stats
app.get('/api/stats/public', (req, res) => {
  const totalAllocated = 50000000 * 543; // 5 Cr per MP limit
  const worksRecommended = projectsStore.length;
  const worksSanctioned = projectsStore.filter((p) =>
    ['Sanctioned', 'Assigned', 'Ongoing', 'Delayed', 'Completed'].includes(p.status)
  ).length;
  const worksCompleted = projectsStore.filter((p) => p.status === 'Completed').length;
  const totalExpenditure = projectsStore.reduce((acc, p) => acc + (p.utilizedCost || 0), 0);
  const sanctionedExpenditure = projectsStore.reduce((acc, p) => acc + (p.sanctionedCost || 0), 0);

  res.json({
    allocatedLimit: totalAllocated,
    worksRecommended,
    worksSanctioned,
    worksCompleted,
    worksOngoing: projectsStore.filter((p) => p.status === 'Ongoing' || p.status === 'Delayed').length,
    totalExpenditure,
    sanctionedExpenditure,
    updatedAt: new Date().toISOString()
  });
});

// MP Data Table for Public Portal
app.get('/api/stats/mps', (req, res) => {
  const mpMap = new Map<string, any>();

  projectsStore.forEach((p) => {
    if (!mpMap.has(p.mpId)) {
      mpMap.set(p.mpId, {
        mpId: p.mpId,
        mpName: p.mpName,
        house: p.house,
        state: p.state,
        constituency: p.constituency,
        allocatedAmount: 50000000, // 5 Cr baseline limit
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

// 3. Project Management API
app.get('/api/projects', (req, res) => {
  const user = (req as any).user as User | undefined;
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

  let filtered = [...projectsStore];

  // Role-based filtering: MP only views own constituency
  if (user && user.role === 'mp') {
    filtered = filtered.filter((p) => p.mpId === user.userId || p.constituency === user.constituency);
  }
  // Agency only views assigned projects
  if (user && user.role === 'agency') {
    filtered = filtered.filter(
      (p) => p.agencyId === user.agencyId || p.agencyName === user.agencyName || user.userId === 'AGENCY001'
    );
  }

  // Public safe filtering
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

  // If public request (no authenticated session), strip internal administrative notes & private logs
  if (!user) {
    const publicProjects = filtered.map((p) => ({
      id: p.id,
      workId: p.workId,
      title: p.title,
      description: p.description,
      category: p.category,
      sector: p.sector,
      house: p.house,
      mpName: p.mpName,
      state: p.state,
      district: p.district,
      constituency: p.constituency,
      financialYear: p.financialYear,
      estimatedCost: p.estimatedCost,
      sanctionedCost: p.sanctionedCost,
      utilizedCost: p.utilizedCost,
      status: p.status,
      latitude: p.latitude,
      longitude: p.longitude,
      locationAddress: p.locationAddress,
      agencyName: p.agencyName,
      completionPercentage: p.completionPercentage,
      riskLevel: p.riskLevel,
      photos: p.photos.filter((ph) => ph.exifStatus === 'Verified')
    }));
    return res.json({ projects: publicProjects });
  }

  res.json({ projects: filtered });
});

app.get('/api/projects/:id', (req, res) => {
  const project = projectsStore.find((p) => p.id === req.params.id || p.workId === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const user = (req as any).user as User | undefined;
  // If user is MP, enforce constituency isolation
  if (user && user.role === 'mp' && project.mpId !== user.userId && project.constituency !== user.constituency) {
    return res.status(403).json({ error: 'Access restricted: MPs can only view their own constituency data.' });
  }

  res.json({ project });
});

// MP Recommend New Work
app.post('/api/projects', (req, res) => {
  const user = (req as any).user as User | undefined;
  if (!user || (user.role !== 'mp' && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Only Members of Parliament or Administrators can recommend works.' });
  }

  const { title, description, category, estimatedCost, latitude, longitude, locationAddress } = req.body;
  if (!title || !category || !estimatedCost) {
    return res.status(400).json({ error: 'Title, category, and estimated cost are mandatory.' });
  }

  const count = projectsStore.length + 1;
  const stateCode = user.state ? user.state.substring(0, 2).toUpperCase() : 'TS';
  const distCode = user.district ? user.district.substring(0, 3).toUpperCase() : 'KRM';
  const workId = `MPLADS/2024-25/${stateCode}/${distCode}/0${count}`;

  const newProject: Project = {
    id: `proj_${Date.now()}`,
    workId,
    title: String(title).trim(),
    description: String(description || '').trim(),
    category,
    sector: 'Community Infrastructure',
    house: (user as any).house || 'Lok Sabha',
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

  projectsStore.unshift(newProject);
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
    newValue: 'Recommended'
  });

  res.status(201).json({ project: newProject });
});

// Admin Approve / Sanction / Assign Agency
app.put('/api/projects/:id/status', (req, res) => {
  const user = (req as any).user as User | undefined;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: Only District Authorities / Administrators can alter sanction status.' });
  }

  const project = projectsStore.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { status, sanctionedCost, agencyId, agencyName, vendorName, notes } = req.body;
  const previousStatus = project.status;

  if (status) project.status = status;
  if (sanctionedCost !== undefined) project.sanctionedCost = Number(sanctionedCost);
  if (agencyId) project.agencyId = agencyId;
  if (agencyName) project.agencyName = agencyName;
  if (vendorName) project.vendorName = vendorName;
  if (status === 'Sanctioned' && !project.sanctionDate) {
    project.sanctionDate = new Date().toISOString().split('T')[0];
    project.expectedCompletionDate = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
  }
  project.updatedAt = new Date().toISOString();

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

  res.json({ project });
});

// Implementing Agency Update Milestone Progress
app.put('/api/projects/:id/progress', (req, res) => {
  const user = (req as any).user as User | undefined;
  if (!user || (user.role !== 'agency' && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Unauthorized: Only Implementing Agencies or Admins can record milestone progress.' });
  }

  const project = projectsStore.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { percentage, description } = req.body;
  const prevPct = project.completionPercentage;
  project.completionPercentage = Math.min(100, Math.max(0, Number(percentage)));

  if (project.completionPercentage === 100) {
    project.status = 'Completed';
    project.actualCompletionDate = new Date().toISOString().split('T')[0];
  } else if (project.status === 'Sanctioned' || project.status === 'Assigned') {
    project.status = 'Ongoing';
  }

  project.progressLogs.push({
    id: `pr_${Date.now()}`,
    percentage: project.completionPercentage,
    description: String(description || 'Physical progress update recorded in Measurement Book (MB)').trim(),
    updatedAt: new Date().toISOString(),
    updatedBy: user.userId
  });

  project.updatedAt = new Date().toISOString();
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
    newValue: `${project.completionPercentage}%`,
    ipAddress: req.ip
  });

  res.json({ project });
});

// Agency Record Expenditure
app.put('/api/projects/:id/expenditure', (req, res) => {
  const user = (req as any).user as User | undefined;
  if (!user || (user.role !== 'agency' && user.role !== 'admin')) {
    return res.status(403).json({ error: 'Unauthorized: Only Implementing Agencies or Admins can record expenditures.' });
  }

  const project = projectsStore.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { amount, installmentNo, sanctionOrderNo } = req.body;
  const numAmount = Number(amount);
  const prevUtilized = project.utilizedCost;
  project.utilizedCost += numAmount;

  project.payments.push({
    id: `pay_${Date.now()}`,
    installmentNo: Number(installmentNo || project.payments.length + 1),
    amount: numAmount,
    sanctionOrderNo: sanctionOrderNo || `MPLADS/${new Date().getFullYear()}/SO-${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().split('T')[0],
    status: 'Released',
    utilizationCertSubmitted: true
  });

  project.updatedAt = new Date().toISOString();
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
    newValue: `₹${project.utilizedCost.toLocaleString()}`,
    ipAddress: req.ip
  });

  res.json({ project });
});

// 4. Photo Verification API (Real Server-side EXIF, GPS Distance, Software Tagging, and pHash)
app.post('/api/verify/photo', upload.single('photo'), async (req, res) => {
  try {
    const { projectId, stage, notes } = req.body;
    let fileBuffer: Buffer | null = null;

    if (req.file) {
      fileBuffer = req.file.buffer;
    } else if (req.body.imageBase64) {
      const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: 'No image file or base64 payload provided.' });
    }

    const targetProject = projectsStore.find((p) => p.id === projectId) || projectsStore[0];
    const verificationResult = await verifyUploadedPhoto(fileBuffer, targetProject, projectsStore);

    // If request has authenticated user, optionally attach to project photo gallery
    const user = (req as any).user as User | undefined;
    if (user && (user.role === 'agency' || user.role === 'admin')) {
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

      targetProject.photos.push(newPhoto);

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
        alertsStore.unshift(newAlert);
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
        previousValue: 'Previous Count: ' + (targetProject.photos.length - 1),
        newValue: `Status: ${verificationResult.status}, Dist: ${verificationResult.distanceMeters ?? 'N/A'}m`
      });
    }

    res.json({ verification: verificationResult });
  } catch (err: any) {
    console.error('Error during photo verification:', err);
    res.status(500).json({ error: 'Failed to process photo verification', details: err.message });
  }
});

// Pre-generated Real Sample Uploads Endpoint for 1-Click Interactive Verification Testing
app.get('/api/verify/test-samples', async (req, res) => {
  const targetProject = projectsStore[0]; // proj_001 (Gangadhara, 18.5724, 79.1312)

  // Sample 1: Passing (Verified) - taken ~45m from site
  const passingJpeg = createSampleExifJpeg({
    lat: 18.5721,
    lng: 79.1315,
    make: 'Samsung',
    model: 'SM-T575 Galaxy Tab Active3',
    software: 'OpenCamera 1.51',
    hasExif: true
  });
  const passingResult = await verifyUploadedPhoto(passingJpeg, targetProject, projectsStore);

  // Sample 2: Failing (Location Mismatch) - taken 3.4km away with Photoshop edit
  const mismatchJpeg = createSampleExifJpeg({
    lat: 18.6025,
    lng: 79.1610,
    make: 'Apple',
    model: 'iPhone 12',
    software: 'Adobe Photoshop 24.2 (Macintosh)',
    hasExif: true
  });
  const mismatchResult = await verifyUploadedPhoto(mismatchJpeg, targetProject, projectsStore);

  // Sample 3: Failing (Unverifiable - Stripped EXIF)
  const strippedJpeg = createSampleExifJpeg({ hasExif: false });
  const strippedResult = await verifyUploadedPhoto(strippedJpeg, targetProject, projectsStore);

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

// 5. Alerts & Human Review Workflow
app.get('/api/alerts', (req, res) => {
  const user = (req as any).user as User | undefined;
  let filtered = [...alertsStore];

  if (user && user.role === 'mp') {
    filtered = filtered.filter((a) => {
      const proj = projectsStore.find((p) => p.id === a.projectId);
      return proj && (proj.mpId === user.userId || proj.constituency === user.constituency);
    });
  }

  res.json({ alerts: filtered });
});

app.put('/api/alerts/:id/review', (req, res) => {
  const user = (req as any).user as User | undefined;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: Only District Authorities / Admins can review alerts.' });
  }

  const alert = alertsStore.find((a) => a.id === req.params.id);
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  const { status, reviewNotes } = req.body;
  const previousStatus = alert.status;
  alert.status = status;
  alert.reviewNotes = reviewNotes || alert.reviewNotes;
  alert.reviewedBy = user.userId;
  alert.reviewedAt = new Date().toISOString();

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

  res.json({ alert });
});

// 6. Vendor & Agency Analytics
app.get('/api/analytics/vendors', (req, res) => {
  const analytics = computeVendorAnalytics(projectsStore, alertsStore);
  res.json({ vendors: analytics });
});

app.get('/api/analytics/vendors/:name', (req, res) => {
  const analytics = computeVendorAnalytics(projectsStore, alertsStore);
  const target = analytics.find(
    (v) => v.vendorName.toLowerCase() === decodeURIComponent(req.params.name).toLowerCase()
  );
  if (!target) {
    return res.status(404).json({ error: 'Vendor not found' });
  }
  res.json({ vendor: target });
});

// 7. Citizen Grievance & Feedback API
app.get('/api/feedback', (req, res) => {
  const { projectId } = req.query;
  if (projectId) {
    return res.json({ feedback: feedbackStore.filter((f) => f.projectId === projectId) });
  }
  res.json({ feedback: feedbackStore });
});

app.post('/api/feedback', (req, res) => {
  const { projectId, issueType, citizenName, contactEmail, comments, photoUrl } = req.body;

  if (!projectId || !issueType || !comments) {
    return res.status(400).json({ error: 'Project, issue type, and comments are required.' });
  }

  const project = projectsStore.find((p) => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: 'Referenced project not found.' });
  }

  const newFeedback: CitizenFeedback = {
    id: `fb_${Date.now()}`,
    projectId,
    workId: project.workId,
    projectTitle: project.title,
    issueType,
    citizenName: String(citizenName || 'Anonymous Citizen').trim(),
    contactEmail: contactEmail ? String(contactEmail).trim() : undefined,
    comments: String(comments).trim(),
    photoUrl: photoUrl || undefined,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  feedbackStore.unshift(newFeedback);

  recordAuditLog({
    projectId: project.id,
    workId: project.workId,
    action: `Citizen Feedback Submitted (${issueType})`,
    actorId: 'CITIZEN_PUBLIC',
    actorName: newFeedback.citizenName,
    actorRole: 'citizen',
    fieldChanged: 'citizenFeedback',
    previousValue: 'None',
    newValue: `Issue: ${issueType}, Comment: ${newFeedback.comments.substring(0, 60)}...`
  });

  res.status(201).json({ feedback: newFeedback });
});

// 8. Audit Logs (Admin Access)
app.get('/api/audit-logs', (req, res) => {
  const user = (req as any).user as User | undefined;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized: Audit trail is restricted to District Authorities.' });
  }
  const { projectId } = req.query;
  res.json({ logs: getAuditLogs(projectId as string | undefined) });
});

// 9. Structured Reports API
app.get('/api/reports/:type', (req, res) => {
  const { type } = req.params;
  const user = (req as any).user as User | undefined;

  let reportData: any = {};
  if (type === 'project' || type === 'financial') {
    reportData = {
      title: 'MPLADS Financial & Physical Progress Report',
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name || 'Public Officer',
      totalProjects: projectsStore.length,
      totalSanctioned: projectsStore.reduce((sum, p) => sum + p.sanctionedCost, 0),
      totalUtilized: projectsStore.reduce((sum, p) => sum + p.utilizedCost, 0),
      projects: projectsStore.map((p) => ({
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
      highRiskCount: projectsStore.filter((p) => p.riskLevel === 'High' || p.riskLevel === 'Critical').length,
      alerts: alertsStore
    };
  } else {
    reportData = {
      title: 'MPLADS Comprehensive Executive Summary',
      generatedAt: new Date().toISOString(),
      projectsCount: projectsStore.length,
      alertsCount: alertsStore.length
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
