import fs from 'fs';
import path from 'path';
import { Project, RiskAlert, CitizenFeedback, AuditLogEntry, User } from '../src/types/index.js';
import {
  sha256Hex,
  users,
  initialProjects,
  initialAlerts,
  initialCitizenFeedback,
  initialAuditLogs,
  initialInspections,
  initialNotifications,
  initialVendors
} from '../src/data/mockData.js';

export {
  sha256Hex,
  users,
  initialProjects,
  initialAlerts,
  initialCitizenFeedback,
  initialAuditLogs,
  initialInspections,
  initialNotifications,
  initialVendors
};

export class DataStore {
  projects: Project[] = JSON.parse(JSON.stringify(initialProjects));
  alerts: RiskAlert[] = JSON.parse(JSON.stringify(initialAlerts));
  citizenFeedback: CitizenFeedback[] = JSON.parse(JSON.stringify(initialCitizenFeedback));
  auditLogs: AuditLogEntry[] = JSON.parse(JSON.stringify(initialAuditLogs));
  users: (User & { passwordHash: string; salt?: string })[] = JSON.parse(JSON.stringify(users));
  notifications: any[] = JSON.parse(JSON.stringify(initialNotifications));
  inspections: any[] = JSON.parse(JSON.stringify(initialInspections));
  vendors: any[] = JSON.parse(JSON.stringify(initialVendors));
  aiInteractions: any[] = [];

  private dbFilePath: string = path.resolve(process.cwd(), 'data', 'mplads_store.json');

  constructor() {
    const loaded = this.loadFromDisk();
    if (!loaded) {
      this.flushToDisk();
    }
  }

  public flushToDisk(): void {
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const payload = {
        users: this.users,
        projects: this.projects,
        alerts: this.alerts,
        citizenFeedback: this.citizenFeedback,
        auditLogs: this.auditLogs,
        notifications: this.notifications,
        inspections: this.inspections,
        vendors: this.vendors,
        aiInteractions: this.aiInteractions,
        latestLogHash: this.latestLogHash,
        lastSavedAt: new Date().toISOString()
      };
      const tmpPath = `${this.dbFilePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
      fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.dbFilePath);
    } catch (err) {
      console.error('[DataStore] Failed to write atomic snapshot to disk:', err);
    }
  }

  public loadFromDisk(): boolean {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.projects && Array.isArray(parsed.projects) && parsed.projects.length > 0) {
          this.projects = parsed.projects;
        }
        if (parsed.users && Array.isArray(parsed.users) && parsed.users.length > 0) {
          this.users = parsed.users;
        }
        if (parsed.alerts && Array.isArray(parsed.alerts)) {
          this.alerts = parsed.alerts;
        }
        if (parsed.citizenFeedback && Array.isArray(parsed.citizenFeedback)) {
          this.citizenFeedback = parsed.citizenFeedback;
        }
        if (parsed.auditLogs && Array.isArray(parsed.auditLogs)) {
          this.auditLogs = parsed.auditLogs;
        }
        if (parsed.notifications && Array.isArray(parsed.notifications)) {
          this.notifications = parsed.notifications;
        }
        if (parsed.inspections && Array.isArray(parsed.inspections)) {
          this.inspections = parsed.inspections;
        }
        if (parsed.vendors && Array.isArray(parsed.vendors)) {
          this.vendors = parsed.vendors;
        }
        if (parsed.aiInteractions && Array.isArray(parsed.aiInteractions)) {
          this.aiInteractions = parsed.aiInteractions;
        }
        if (parsed.latestLogHash) {
          this.latestLogHash = parsed.latestLogHash;
        }
        return true;
      }
    } catch (err) {
      console.error('[DataStore] Error loading persistent file, preserving defaults:', err);
    }
    return false;
  }

  private seedInitialInspections() {
    this.inspections = [
      {
        id: 'INSP-2024-001',
        projectId: 'PRJ-2024-001',
        projectTitle: 'Construction of Multipurpose Community Hall at Amberpet',
        scheduledDate: '2024-09-15',
        completedDate: '2024-09-15',
        inspectorName: 'Er. S. Venkat Reddy',
        inspectorDesignation: 'Executive Engineer, TSUDA',
        status: 'Completed',
        findings: 'Plinth level completed. Brick masonry in progress. Material testing report verified.',
        riskObservations: 'Work pace is slightly behind milestone schedule due to supply of TMT steel.',
        photos: [
          {
            id: 'insp_ph_01',
            url: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=60',
            caption: 'Site inspection - column framework'
          }
        ]
      },
      {
        id: 'INSP-2024-002',
        projectId: 'PRJ-2024-006',
        projectTitle: 'Construction of Primary Health Sub-Centre at Bowenpally',
        scheduledDate: '2024-11-10',
        completedDate: '2024-11-12',
        inspectorName: 'Dr. Ananya Sharma, IAS',
        inspectorDesignation: 'District Magistrate',
        status: 'Completed',
        findings: 'High risk detected. Ground floor slab curing incomplete. Contractor issued show-cause notice.',
        riskObservations: 'Critical delay probability identified at 92%. Joint audit with PRED initiated.',
        photos: []
      }
    ];
  }

  private seedInitialNotifications() {
    this.notifications = [
      {
        id: 'NOTIF-001',
        userId: 'ADMIN001',
        targetRole: 'ADMIN',
        title: 'New High-Risk Project Alert',
        message: 'Cost anomaly alert ALT-101 generated on Amberpet Community Hall requires your review.',
        type: 'ALERT',
        read: false,
        createdAt: '2025-01-10T09:00:00Z',
        link: '/alerts'
      },
      {
        id: 'NOTIF-002',
        userId: 'MP001',
        targetRole: 'MP',
        title: 'Milestone Disbursal Approved',
        message: 'First installment of ₹14.4 Lakh disbursed for Solar LED High-Mast Street Lights.',
        type: 'FINANCE',
        read: false,
        createdAt: '2025-01-15T14:30:00Z',
        link: '/projects/PRJ-2024-003'
      },
      {
        id: 'NOTIF-003',
        userId: 'AGENCY001',
        targetRole: 'AGENCY',
        title: 'Inspection Directive Issued',
        message: 'District Authority directed site inspection for Amberpet civil works.',
        type: 'INSPECTION',
        read: true,
        createdAt: '2025-01-18T11:20:00Z',
        link: '/inspections'
      }
    ];
  }

  private seedInitialVendors() {
    this.vendors = [
      {
        id: 'VEND-001',
        name: 'Deccan Infrastructure & Builders Ltd',
        panMasked: 'AABCD****F',
        gstinMasked: '36AABCD****F1Z5',
        activeProjectsCount: 3,
        totalSanctionedValue: 7200000,
        riskScore: 24,
        complianceRating: 'A',
        blacklisted: false
      },
      {
        id: 'VEND-002',
        name: 'Surya Green Power Enterprises',
        panMasked: 'AAGCS****E',
        gstinMasked: '36AAGCS****E1Z8',
        activeProjectsCount: 2,
        totalSanctionedValue: 4800000,
        riskScore: 12,
        complianceRating: 'A+',
        blacklisted: false
      },
      {
        id: 'VEND-003',
        name: 'Apex Healthinfra Corp',
        panMasked: 'AACAQ****T',
        gstinMasked: '36AACAQ****T1Z2',
        activeProjectsCount: 4,
        totalSanctionedValue: 12400000,
        riskScore: 68,
        complianceRating: 'B-',
        blacklisted: false
      }
    ];
  }

  private seedInitialAlerts() {
    this.alerts = [
      {
        id: 'ALT-101',
        projectId: 'PRJ-2024-001',
        projectCode: 'MPLADS-HYD-2024-001',
        projectTitle: 'Construction of Multipurpose Community Hall at Amberpet',
        district: 'Hyderabad',
        mpName: 'Shri Rajesh Kumar',
        agencyName: 'TSUDA - Hyderabad Zone',
        alertType: 'Cost Anomaly',
        riskLevel: 'HIGH',
        reason: 'Project cost (₹48.0L) is 113% higher than standard category benchmark (₹18-25L) for identical plinth area.',
        technicalDetails: 'Standard CPWD Schedule of Rates plinth rate is ₹2,200/sqft. Billed rate indicates ₹4,700/sqft.',
        createdAt: '2024-03-05T10:00:00Z',
        status: 'Under Review',
        assignedOfficer: 'Dr. Ananya Sharma, IAS'
      },
      {
        id: 'ALT-102',
        projectId: 'PRJ-2024-002',
        projectCode: 'MPLADS-HYD-2024-002',
        projectTitle: 'Community Welfare Center & Library at Amberpet Ward-12',
        district: 'Hyderabad',
        mpName: 'Shri Rajesh Kumar',
        agencyName: 'TSUDA - Hyderabad Zone',
        alertType: 'Possible Duplicate',
        riskLevel: 'HIGH',
        reason: 'High spatial and functional proximity to sanctioned Project PRJ-2024-001. Distance: 430m, Similarity: 87%.',
        technicalDetails: 'Both assets serve identical Ward 14 catchment. Recommendation dates are separated by 85 days.',
        createdAt: '2024-05-18T14:30:00Z',
        status: 'New',
        assignedOfficer: 'District Planning Officer'
      },
      {
        id: 'ALT-103',
        projectId: 'PRJ-2024-004',
        projectCode: 'MPLADS-HYD-2024-004',
        projectTitle: 'Purified RO Drinking Water Treatment Plant at Sanathnagar',
        district: 'Hyderabad',
        mpName: 'Shri Rajesh Kumar',
        agencyName: 'TSUDA - Hyderabad Zone',
        alertType: 'Photo Anomaly',
        riskLevel: 'HIGH',
        reason: 'Image perceptual hashing detected 94% visual overlap with archived project photo from 2022.',
        technicalDetails: 'Image hash matches PRJ-ARCHIVE-2022-881. EXIF original timestamp stripped.',
        createdAt: '2024-09-22T09:15:00Z',
        status: 'Escalated',
        assignedOfficer: 'Vigilance Officer, Hyderabad'
      },
      {
        id: 'ALT-104',
        projectId: 'PRJ-2024-005',
        projectCode: 'MPLADS-HYD-2024-005',
        projectTitle: 'Upgradation of Government Primary School into Model Smart School',
        district: 'Hyderabad',
        mpName: 'Shri Rajesh Kumar',
        agencyName: 'PRED Secunderabad',
        alertType: 'Location Mismatch',
        riskLevel: 'HIGH',
        reason: 'Uploaded progress photo geotag is 8.4 km away from sanctioned project location coordinates.',
        technicalDetails: 'Target coordinates: 17.4411 N, 78.5015 E. EXIF photo coordinates: 17.5142 N, 78.4320 E (Quthbullapur).',
        createdAt: '2024-08-15T16:00:00Z',
        status: 'Under Review',
        assignedOfficer: 'Superintending Engineer PRED'
      },
      {
        id: 'ALT-105',
        projectId: 'PRJ-2024-006',
        projectCode: 'MPLADS-HYD-2024-006',
        projectTitle: 'Construction of Primary Health Sub-Centre at Bowenpally',
        district: 'Hyderabad',
        mpName: 'Shri Rajesh Kumar',
        agencyName: 'TSUDA - Hyderabad Zone',
        alertType: 'Delay Risk',
        riskLevel: 'HIGH',
        reason: 'Project overdue by 105 days with only 35% physical completion. Delay probability calculated at 92%.',
        technicalDetails: 'Execution velocity is 2.4%/month. At current run-rate, completion projected for November 2026.',
        createdAt: '2024-11-20T11:45:00Z',
        status: 'New',
        assignedOfficer: 'District Planning Officer'
      },
      {
        id: 'ALT-106',
        projectId: 'PRJ-2024-016',
        projectCode: 'MPLADS-HYD-2024-016',
        projectTitle: 'Construction of Over-Head Water Reservoir (OHSR) at Medchal Borders',
        district: 'Hyderabad',
        mpName: 'Shri Rajesh Kumar',
        agencyName: 'TSUDA - Hyderabad Zone',
        alertType: 'High Risk',
        riskLevel: 'CRITICAL',
        reason: 'Severe milestone stall and vendor capacity saturation. Contractor managing 5 active works simultaneously.',
        technicalDetails: 'Cumulative risk index calculated at 74/100.',
        createdAt: '2025-01-10T12:00:00Z',
        status: 'Under Review',
        assignedOfficer: 'Dr. Ananya Sharma, IAS'
      }
    ];
  }

  private seedInitialFeedback() {
    this.citizenFeedback = [
      {
        id: 'FB-001',
        projectId: 'PRJ-2024-001',
        projectTitle: 'Construction of Multipurpose Community Hall at Amberpet',
        projectCode: 'MPLADS-HYD-2024-001',
        district: 'Hyderabad',
        citizenName: 'K. Venkateshwar Rao',
        citizenContactMasked: '+91 98480*****',
        issueType: 'Incomplete Work',
        description: 'Civil construction has been completely halted for the past 2 months. Building material is lying exposed in rain.',
        photoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?w=800&auto=format&fit=crop&q=60',
        latitude: 17.3984,
        longitude: 78.5202,
        submittedAt: '2025-01-14T11:20:00Z',
        status: 'Under Review',
        adminNotes: 'Field Engineer directed to inspect reason for work stoppage.'
      },
      {
        id: 'FB-002',
        projectId: 'PRJ-2024-003',
        projectTitle: 'Installation of 50 Solar LED High-Mast Street Lights at Musheerabad',
        projectCode: 'MPLADS-HYD-2024-003',
        district: 'Hyderabad',
        citizenName: 'Syed Moizuddin',
        citizenContactMasked: '+91 99890*****',
        issueType: 'Damaged Asset',
        description: 'Two solar street lights near Bholakpur crossroads are flickering after recent heavy winds.',
        submittedAt: '2025-02-02T16:40:00Z',
        status: 'Verified',
        adminNotes: 'Vendor Surya Green Power dispatched maintenance electrician.'
      }
    ];
  }

  private seedInitialAuditLogs() {
    this.auditLogs = [
      {
        id: 'LOG-001',
        userId: 'MP001',
        userName: 'Shri Rajesh Kumar (MP)',
        userRole: 'MP',
        action: 'SUBMIT_RECOMMENDATION',
        targetEntity: 'Project',
        targetId: 'PRJ-2024-019',
        timestamp: '2024-08-01T10:00:00Z',
        previousValue: 'None',
        newValue: 'Recommended: Pediatric Dialysis Unit (₹65.0 Lakh)',
        ipAddressMasked: '10.24.18.***'
      },
      {
        id: 'LOG-002',
        userId: 'ADMIN001',
        userName: 'Dr. Ananya Sharma, IAS (DM)',
        userRole: 'ADMIN',
        action: 'SANCTION_PROJECT',
        targetEntity: 'Project',
        targetId: 'PRJ-2024-020',
        timestamp: '2024-07-28T15:30:00Z',
        previousValue: 'Status: Recommended',
        newValue: 'Status: Sanctioned (Amount: ₹36,00,000)',
        ipAddressMasked: '10.14.02.***'
      },
      {
        id: 'LOG-003',
        userId: 'AGENCY001',
        userName: 'TSUDA - Hyderabad Zone',
        userRole: 'AGENCY',
        action: 'UPDATE_PROGRESS',
        targetEntity: 'Project',
        targetId: 'PRJ-2024-001',
        timestamp: '2024-09-12T14:20:00Z',
        previousValue: 'Completion: 45%',
        newValue: 'Completion: 55%',
        ipAddressMasked: '10.50.88.***'
      },
      {
        id: 'LOG-004',
        userId: 'ADMIN001',
        userName: 'Dr. Ananya Sharma, IAS (DM)',
        userRole: 'ADMIN',
        action: 'ALERT_STATUS_UPDATE',
        targetEntity: 'RiskAlert',
        targetId: 'ALT-101',
        timestamp: '2024-10-01T09:40:00Z',
        previousValue: 'Status: New',
        newValue: 'Status: Under Review (Cost inquiry initiated)',
        ipAddressMasked: '10.14.02.***'
      }
    ];
  }

  // --- Strict RBAC Query Helpers ---

  getProjectsForUser(user: User | null): Project[] {
    if (!user || user.role === 'PUBLIC') {
      // Public sanitized projection
      return this.projects.map(p => this.sanitizeProjectForPublic(p));
    }

    if (user.role === 'MP') {
      // MPs see their own constituency projects
      return this.projects.filter(p => p.mpId === user.userId || p.constituency === user.constituency);
    }

    if (user.role === 'ADMIN') {
      // Admins see projects within their jurisdiction
      return this.projects.filter(p => p.district === user.district || !user.district);
    }

    if (user.role === 'AGENCY') {
      // Implementing Agencies ONLY see projects assigned to their specific agencyId
      return this.projects.filter(p => p.implementingAgencyId === user.agencyId);
    }

    return [];
  }

  getProjectByIdForUser(id: string, user: User | null): Project | null {
    const project = this.projects.find(p => p.id === id || p.projectCode === id);
    if (!project) return null;

    if (!user || user.role === 'PUBLIC') {
      return this.sanitizeProjectForPublic(project);
    }

    if (user.role === 'MP') {
      if (project.mpId !== user.userId && project.constituency !== user.constituency) {
        return null; // Reject access to other MP's projects
      }
      return project;
    }

    if (user.role === 'AGENCY') {
      if (project.implementingAgencyId !== user.agencyId) {
        return null; // Reject access to other agencies' projects
      }
      return project;
    }

    if (user.role === 'ADMIN') {
      if (user.district && project.district !== user.district) {
        return null; // Reject outside jurisdiction
      }
      return project;
    }

    return project;
  }

  // Public sanitation rule
  sanitizeProjectForPublic(p: Project): Project {
    return {
      ...p,
      vendorPanMasked: 'CONFIDENTIAL',
      documents: p.documents.filter(d => !d.isConfidential && (d.type === 'Sanction Order' || d.type === 'Completion Certificate')),
      riskAnalysis: {
        overallScore: p.riskAnalysis.overallScore,
        riskLevel: p.riskAnalysis.riskLevel,
        lastEvaluatedAt: p.riskAnalysis.lastEvaluatedAt,
        costAnomalyScore: 0,
        duplicateProbability: 0,
        photoAnomalyScore: 0,
        locationMismatch: false,
        delayProbability: p.riskAnalysis.delayProbability,
        reasons: ['Public view: High-level milestone metrics are monitored in accordance with MoSPI guidelines.'],
        recommendations: [],
        disclaimer: 'Notice: Operational indicators are subject to official field verification.'
      },
      payments: p.payments.map(pay => ({
        id: pay.id,
        installmentNo: pay.installmentNo,
        amount: pay.amount,
        sanctionOrderNo: pay.sanctionOrderNo,
        paidAt: pay.paidAt,
        status: pay.status,
        beneficiaryAgency: p.implementingAgencyName
      }))
    };
  }

  private latestLogHash: string = 'GENESIS_MPLADS_AUDIT_BLOCK_000000';

  addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'entryHash' | 'prevHash'>): AuditLogEntry {
    const id = `LOG-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 900 + 100)}`;
    const timestamp = new Date().toISOString();
    const prevHash = this.latestLogHash;

    const hashPayload = `${prevHash}|${id}|${timestamp}|${entry.userId}|${entry.userRole}|${entry.action}|${entry.targetEntity}|${entry.targetId}|${entry.previousValue || ''}|${entry.newValue || ''}|${entry.ipAddressMasked}`;
    const entryHash = sha256Hex(hashPayload);

    const log: AuditLogEntry = {
      ...entry,
      id,
      timestamp,
      prevHash,
      entryHash
    };

    this.latestLogHash = entryHash;
    this.auditLogs.unshift(log);
    this.flushToDisk();
    return log;
  }

  // --- Persistence & CRUD helper methods ---
  getUserByUserId(userId: string) {
    return this.users.find(u => u.userId.toUpperCase() === userId.toUpperCase()) || null;
  }

  getProjectById(id: string): Project | null {
    return this.projects.find(p => p.id === id || p.projectCode === id) || null;
  }

  addProject(p: Project): Project {
    this.projects.unshift(p);
    this.flushToDisk();
    return p;
  }

  updateProject(id: string, update: Partial<Project>): Project | null {
    const idx = this.projects.findIndex(p => p.id === id || p.projectCode === id);
    if (idx === -1) return null;
    this.projects[idx] = { ...this.projects[idx], ...update };
    this.flushToDisk();
    return this.projects[idx];
  }

  addPayment(projectId: string, payment: any): boolean {
    const project = this.getProjectById(projectId);
    if (!project) return false;
    if (!project.payments) project.payments = [];
    project.payments.unshift(payment);
    project.fundsUtilized = (project.fundsUtilized || 0) + Number(payment.amount || 0);
    this.flushToDisk();
    return true;
  }

  getFeedbackById(id: string): CitizenFeedback | null {
    return this.citizenFeedback.find(f => f.id === id) || null;
  }

  submitFeedback(fb: CitizenFeedback): CitizenFeedback {
    this.citizenFeedback.unshift(fb);
    this.flushToDisk();
    return fb;
  }

  updateFeedback(id: string, update: Partial<CitizenFeedback>): CitizenFeedback | null {
    const idx = this.citizenFeedback.findIndex(f => f.id === id);
    if (idx === -1) return null;
    this.citizenFeedback[idx] = { ...this.citizenFeedback[idx], ...update };
    this.flushToDisk();
    return this.citizenFeedback[idx];
  }

  getNotificationsForUser(user: User): any[] {
    const isTargetForUser = (n: any) => {
      // 1. Direct assignment to specific user
      if (n.userId && n.userId === user.userId) return true;
      // 2. Targeted to user's specific statutory role
      if (n.targetRole) {
        if (n.targetRole === 'ALL') return true;
        if (n.targetRole === user.role) return true;
        if ((user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (n.targetRole === 'ADMIN' || n.targetRole === 'SUPER_ADMIN')) return true;
        return false;
      }
      // 3. Fallback for unassigned system items (Admin visibility only)
      return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    };

    const userNotifs = this.notifications.filter(isTargetForUser);

    // Compute user-specific read status without mutating or sharing global state
    return userNotifs.map(n => {
      const isReadByUser = Boolean(
        (Array.isArray(n.readBy) && n.readBy.includes(user.userId)) ||
        (n.userId === user.userId && n.read)
      );
      return {
        ...n,
        read: isReadByUser
      };
    });
  }

  getNotificationById(id: string): any | null {
    return this.notifications.find(n => n.id === id) || null;
  }

  markNotificationRead(id: string, user: User): boolean {
    const notif = this.notifications.find(n => n.id === id);
    if (!notif) return false;

    // Verify statutory authorization
    const isAuthorized =
      notif.userId === user.userId ||
      notif.targetRole === user.role ||
      notif.targetRole === 'ALL' ||
      user.role === 'ADMIN' ||
      user.role === 'SUPER_ADMIN';

    if (!isAuthorized) {
      return false;
    }

    if (!Array.isArray(notif.readBy)) {
      notif.readBy = [];
    }
    if (!notif.readBy.includes(user.userId)) {
      notif.readBy.push(user.userId);
    }
    if (!notif.userId || notif.userId === user.userId) {
      notif.read = true;
    }

    this.flushToDisk();
    return true;
  }

  markAsRead(id: string, user: User): boolean {
    return this.markNotificationRead(id, user);
  }

  markAllNotificationsRead(user: User): number {
    let count = 0;
    const userNotifs = this.getNotificationsForUser(user);
    const userNotifIds = new Set(userNotifs.map(n => n.id));

    this.notifications.forEach(n => {
      if (userNotifIds.has(n.id)) {
        if (!Array.isArray(n.readBy)) n.readBy = [];
        const wasRead = n.readBy.includes(user.userId) || (n.userId === user.userId && n.read);
        if (!wasRead) {
          n.readBy.push(user.userId);
          if (!n.userId || n.userId === user.userId) {
            n.read = true;
          }
          count++;
        }
      }
    });

    this.flushToDisk();
    return count;
  }

  resetNotifications(user?: User): any[] {
    this.notifications = JSON.parse(JSON.stringify(initialNotifications));
    this.notifications.forEach(n => {
      n.read = false;
      n.readBy = [];
    });
    this.flushToDisk();
    return user ? this.getNotificationsForUser(user) : this.notifications;
  }

  addNotification(notif: any): any {
    this.notifications.unshift(notif);
    this.flushToDisk();
    return notif;
  }

  getInspections(user?: User): any[] {
    if (!user || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return this.inspections;
    }
    if (user.role === 'MP') {
      const allowedProjectIds = new Set(this.projects.filter(p => p.mpId === user.userId || p.constituency === user.constituency).map(p => p.id));
      return this.inspections.filter(i => allowedProjectIds.has(i.projectId));
    }
    if (user.role === 'AGENCY') {
      const allowedProjectIds = new Set(this.projects.filter(p => p.implementingAgencyId === user.agencyId).map(p => p.id));
      return this.inspections.filter(i => allowedProjectIds.has(i.projectId));
    }
    return [];
  }

  addInspection(insp: any): any {
    this.inspections.unshift(insp);
    this.flushToDisk();
    return insp;
  }

  updateInspection(id: string, update: any): any | null {
    const idx = this.inspections.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.inspections[idx] = { ...this.inspections[idx], ...update };
    this.flushToDisk();
    return this.inspections[idx];
  }

  getVendors(user?: User): any[] {
    if (!user || user.role === 'PUBLIC') {
      return this.vendors.map(v => ({
        id: v.id,
        name: v.name,
        activeProjectsCount: v.activeProjectsCount,
        complianceRating: v.complianceRating,
        panMasked: 'CONFIDENTIAL',
        gstinMasked: 'CONFIDENTIAL'
      }));
    }
    return this.vendors;
  }

  addAiInteraction(interaction: any): any {
    this.aiInteractions.unshift(interaction);
    if (this.aiInteractions.length > 500) {
      this.aiInteractions.pop();
    }
    this.flushToDisk();
    return interaction;
  }

  getAiInteractions(user?: User): any[] {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return [];
    }
    return this.aiInteractions;
  }

  verifyAuditLogIntegrity(): { isValid: boolean; verifiedCount: number; brokenAtId?: string } {
    const logsChronological = [...this.auditLogs].reverse();
    let prev = 'GENESIS_MPLADS_AUDIT_BLOCK_000000';

    for (const log of logsChronological) {
      if (log.prevHash && log.prevHash !== prev) {
        return { isValid: false, verifiedCount: logsChronological.indexOf(log), brokenAtId: log.id };
      }
      if (log.entryHash) {
        const hashPayload = `${log.prevHash || prev}|${log.id}|${log.timestamp}|${log.userId}|${log.userRole}|${log.action}|${log.targetEntity}|${log.targetId}|${log.previousValue || ''}|${log.newValue || ''}|${log.ipAddressMasked}`;
        const recomputed = sha256Hex(hashPayload);
        if (recomputed !== log.entryHash) {
          return { isValid: false, verifiedCount: logsChronological.indexOf(log), brokenAtId: log.id };
        }
        prev = log.entryHash;
      }
    }
    return { isValid: true, verifiedCount: this.auditLogs.length };
  }

  // Backup snapshot for restoring after hackathon tamper simulation
  private backupLogsSnapshot: AuditLogEntry[] | null = null;

  simulateTamperAuditLog(targetId?: string): { tamperedLogId: string; modifiedField: string; originalValue: string; maliciousValue: string } {
    if (!this.backupLogsSnapshot) {
      this.backupLogsSnapshot = JSON.parse(JSON.stringify(this.auditLogs));
    }

    // Pick record to maliciously alter (e.g. index 2 or 3)
    const target = targetId
      ? this.auditLogs.find(l => l.id === targetId)
      : (this.auditLogs[Math.min(3, this.auditLogs.length - 1)] || this.auditLogs[0]);

    if (!target) {
      throw new Error('No audit log available to tamper with.');
    }

    const originalValue = target.newValue || target.action;
    const maliciousValue = 'UNAUTHORIZED_ALTERATION: Status fraudulently marked Approved & Funds Released';
    
    // Intentionally mutate content WITHOUT recalculating hash or prevHash to prove cryptographic detection
    target.newValue = maliciousValue;

    return {
      tamperedLogId: target.id,
      modifiedField: 'newValue',
      originalValue,
      maliciousValue
    };
  }

  restoreAuditLogChain(): { restoredCount: number; message: string } {
    if (this.backupLogsSnapshot) {
      this.auditLogs = JSON.parse(JSON.stringify(this.backupLogsSnapshot));
      this.backupLogsSnapshot = null;
      return { restoredCount: this.auditLogs.length, message: 'Audit log chain restored to pristine cryptographic state.' };
    }
    return { restoredCount: this.auditLogs.length, message: 'Audit chain already in verified state.' };
  }
}

export const db = new DataStore();
