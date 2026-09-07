import fs from 'fs';
import path from 'path';
import {
  Project,
  Alert,
  CitizenFeedback,
  User,
  ProjectInspection,
  ProjectDocument,
  SystemNotification,
  AuditLogEntry
} from '../../types/index.ts';
import {
  DEMO_USERS,
  INITIAL_PROJECTS,
  INITIAL_ALERTS,
  INITIAL_CITIZEN_FEEDBACK,
  INITIAL_AUDIT_LOGS
} from '../data/seedData.ts';
import {
  INITIAL_INSPECTIONS,
  INITIAL_DOCUMENTS,
  INITIAL_NOTIFICATIONS
} from '../data/seedInspectionsAndDocuments.ts';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('[Persistence] Could not create data directory:', err);
  }
}

function getFilePath(name: string): string {
  return path.join(DATA_DIR, `${name}.json`);
}

function loadOrSeed<T>(filename: string, defaultData: T): T {
  const filePath = getFilePath(filename);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn(`[Persistence] Error reading ${filename}, falling back to initial seed:`, err);
  }

  // File doesn't exist or is corrupt, write default data
  try {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[Persistence] Error saving seed to ${filename}:`, err);
  }
  return defaultData;
}

function saveToFile<T>(filename: string, data: T): void {
  const filePath = getFilePath(filename);
  const tempPath = `${filePath}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.warn(`[Persistence] Failed to atomically save ${filename}:`, err);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (fallbackErr) {
      console.error(`[Persistence] Fallback save failed for ${filename}:`, fallbackErr);
    }
  }
}

// Expanded verified government users
export interface StoredUser extends User {
  passwordHash: string;
  salt: string;
  isActive: boolean;
  jurisdictionLevel?: 'national' | 'district' | 'constituency';
}

// Pre-compute secure hashes for standard demo users
import crypto from 'crypto';

export function hashPasswordWithSalt(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function createStoredUsers(): StoredUser[] {
  const baseUsers: (StoredUser)[] = [
    {
      id: 'usr_mp_001',
      userId: 'MP001',
      salt: 'salt_mp_001_secure',
      passwordHash: hashPasswordWithSalt('MP@123', 'salt_mp_001_secure'),
      name: 'Shri Rajesh Kumar Sharma',
      role: 'mp',
      email: 'rajesh.sharma.mp@sansad.nic.in',
      state: 'Telangana',
      district: 'Karimnagar',
      constituency: 'Karimnagar',
      house: 'Lok Sabha',
      designation: 'Member of Parliament (Lok Sabha)',
      isActive: true,
      jurisdictionLevel: 'constituency'
    },
    {
      id: 'usr_mp_var',
      userId: 'MP_VAR_01',
      salt: 'salt_mp_var_secure',
      passwordHash: hashPasswordWithSalt('MP@123', 'salt_mp_var_secure'),
      name: 'Shri Narendra Damodardas Modi',
      role: 'mp',
      email: 'pm.mp.varanasi@sansad.nic.in',
      state: 'Uttar Pradesh',
      district: 'Varanasi',
      constituency: 'Varanasi',
      house: 'Lok Sabha',
      designation: 'Member of Parliament (Lok Sabha)',
      isActive: true,
      jurisdictionLevel: 'constituency'
    },
    {
      id: 'usr_mp_blr',
      userId: 'MP_BLR_01',
      salt: 'salt_mp_blr_secure',
      passwordHash: hashPasswordWithSalt('MP@123', 'salt_mp_blr_secure'),
      name: 'Shri Tejasvi Surya',
      role: 'mp',
      email: 'tejasvi.surya.mp@sansad.nic.in',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      constituency: 'Bangalore South',
      house: 'Lok Sabha',
      designation: 'Member of Parliament (Lok Sabha)',
      isActive: true,
      jurisdictionLevel: 'constituency'
    },
    {
      id: 'usr_admin_001',
      userId: 'ADMIN001',
      salt: 'salt_admin_001_secure',
      passwordHash: hashPasswordWithSalt('Admin@123', 'salt_admin_001_secure'),
      name: 'Dr. Anand K. Verma, IAS',
      role: 'admin',
      email: 'collector.karimnagar@nic.in',
      state: 'Telangana',
      district: 'Karimnagar',
      designation: 'District Magistrate & District Authority',
      isActive: true,
      jurisdictionLevel: 'district'
    },
    {
      id: 'usr_admin_nat',
      userId: 'ADMIN_NAT',
      salt: 'salt_admin_nat_secure',
      passwordHash: hashPasswordWithSalt('Admin@123', 'salt_admin_nat_secure'),
      name: 'Smt. Alka Tiwari, IAS',
      role: 'admin',
      email: 'addl.sec.mospi@nic.in',
      state: 'National',
      district: 'All Districts',
      designation: 'Additional Secretary, MoSPI (National Nodal Officer)',
      isActive: true,
      jurisdictionLevel: 'national'
    },
    {
      id: 'usr_agency_001',
      userId: 'AGENCY001',
      salt: 'salt_agency_001_secure',
      passwordHash: hashPasswordWithSalt('Agency@123', 'salt_agency_001_secure'),
      name: 'Executive Engineer, PWD Rural Works',
      role: 'agency',
      email: 'ee.pwd.karimnagar@telangana.gov.in',
      agencyId: 'AG_PWD_01',
      agencyName: 'Public Works Department (PWD Rural Division)',
      state: 'Telangana',
      district: 'Karimnagar',
      designation: 'Nodal Implementing Agency',
      isActive: true,
      jurisdictionLevel: 'district'
    },
    {
      id: 'usr_agency_pr',
      userId: 'AGENCY_PR',
      salt: 'salt_agency_pr_secure',
      passwordHash: hashPasswordWithSalt('Agency@123', 'salt_agency_pr_secure'),
      name: 'Superintending Engineer, Panchayati Raj',
      role: 'agency',
      email: 'se.pr.karimnagar@telangana.gov.in',
      agencyId: 'AG_PR_02',
      agencyName: 'Panchayati Raj Engineering Department',
      state: 'Telangana',
      district: 'Karimnagar',
      designation: 'Rural Infrastructure Implementing Agency',
      isActive: true,
      jurisdictionLevel: 'district'
    },
    {
      id: 'usr_agency_up',
      userId: 'AGENCY_UP',
      salt: 'salt_agency_up_secure',
      passwordHash: hashPasswordWithSalt('Agency@123', 'salt_agency_up_secure'),
      name: 'General Manager, UP State Construction Corp',
      role: 'agency',
      email: 'gm.upsic.varanasi@up.gov.in',
      agencyId: 'AG_UP_PWD',
      agencyName: 'UP State Construction & Infrastructure Development Corp (UPSIC)',
      state: 'Uttar Pradesh',
      district: 'Varanasi',
      designation: 'Executing Agency',
      isActive: true,
      jurisdictionLevel: 'district'
    }
  ];

  return baseUsers;
}

// Persistent Storage Singleton
class PersistenceStore {
  private users: StoredUser[];
  private projects: Project[];
  private alerts: Alert[];
  private feedback: CitizenFeedback[];
  private inspections: ProjectInspection[];
  private documents: ProjectDocument[];
  private notifications: SystemNotification[];
  private auditLogs: AuditLogEntry[];
  private sessions: Map<string, { userId: string; expiresAt: number }>;

  constructor() {
    this.users = loadOrSeed<StoredUser[]>('users', createStoredUsers());
    this.projects = loadOrSeed<Project[]>('projects', INITIAL_PROJECTS);
    this.alerts = loadOrSeed<Alert[]>('alerts', INITIAL_ALERTS);
    this.feedback = loadOrSeed<CitizenFeedback[]>('feedback', INITIAL_CITIZEN_FEEDBACK);
    this.inspections = loadOrSeed<ProjectInspection[]>('inspections', INITIAL_INSPECTIONS);
    this.documents = loadOrSeed<ProjectDocument[]>('documents', INITIAL_DOCUMENTS);
    this.notifications = loadOrSeed<SystemNotification[]>('notifications', INITIAL_NOTIFICATIONS);
    this.auditLogs = loadOrSeed<AuditLogEntry[]>('audit_logs', INITIAL_AUDIT_LOGS);

    const rawSessions = loadOrSeed<Record<string, { userId: string; expiresAt: number }>>('sessions', {});
    this.sessions = new Map(Object.entries(rawSessions));

    // Clean up expired sessions on startup
    const now = Date.now();
    for (const [token, sess] of this.sessions.entries()) {
      if (sess.expiresAt < now) {
        this.sessions.delete(token);
      }
    }
    this.persistSessions();
  }

  // --- Session Management ---
  createSession(token: string, userId: string, ttlMs = 24 * 60 * 60 * 1000): void {
    this.sessions.set(token, {
      userId,
      expiresAt: Date.now() + ttlMs
    });
    this.persistSessions();
  }

  getSession(token: string): StoredUser | null {
    const sess = this.sessions.get(token);
    if (!sess) return null;
    if (sess.expiresAt < Date.now()) {
      this.sessions.delete(token);
      this.persistSessions();
      return null;
    }
    const user = this.users.find((u) => u.userId === sess.userId && u.isActive);
    return user || null;
  }

  revokeSession(token: string): void {
    if (this.sessions.has(token)) {
      this.sessions.delete(token);
      this.persistSessions();
    }
  }

  private persistSessions(): void {
    const obj: Record<string, { userId: string; expiresAt: number }> = {};
    for (const [k, v] of this.sessions.entries()) {
      obj[k] = v;
    }
    saveToFile('sessions', obj);
  }

  // --- Users ---
  getUsers(): StoredUser[] {
    return [...this.users];
  }

  getUserByUserId(userId: string): StoredUser | undefined {
    return this.users.find((u) => u.userId.toUpperCase() === userId.trim().toUpperCase());
  }

  // --- Projects ---
  getProjects(): Project[] {
    return [...this.projects];
  }

  getProjectById(id: string): Project | undefined {
    return this.projects.find((p) => p.id === id || p.workId === id);
  }

  addProject(project: Project): void {
    this.projects.unshift(project);
    saveToFile('projects', this.projects);
  }

  updateProject(id: string, updater: (proj: Project) => void): Project | null {
    const proj = this.projects.find((p) => p.id === id || p.workId === id);
    if (!proj) return null;
    updater(proj);
    proj.updatedAt = new Date().toISOString();
    saveToFile('projects', this.projects);
    return proj;
  }

  setProjects(projects: Project[]): void {
    this.projects = projects;
    saveToFile('projects', this.projects);
  }

  // --- Alerts ---
  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  getAlertById(id: string): Alert | undefined {
    return this.alerts.find((a) => a.id === id);
  }

  addAlert(alert: Alert): void {
    this.alerts.unshift(alert);
    saveToFile('alerts', this.alerts);
  }

  updateAlert(id: string, updater: (alert: Alert) => void): Alert | null {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return null;
    updater(alert);
    saveToFile('alerts', this.alerts);
    return alert;
  }

  // --- Citizen Feedback ---
  getFeedback(): CitizenFeedback[] {
    return [...this.feedback];
  }

  getFeedbackById(id: string): CitizenFeedback | undefined {
    return this.feedback.find((f) => f.id === id || (f.grievanceId && f.grievanceId.toUpperCase() === id.toUpperCase()));
  }

  addFeedback(feedback: CitizenFeedback): void {
    this.feedback.unshift(feedback);
    saveToFile('feedback', this.feedback);
  }

  updateFeedback(id: string, updater: (fb: CitizenFeedback) => void): CitizenFeedback | null {
    const item = this.feedback.find((f) => f.id === id || (f.grievanceId && f.grievanceId.toUpperCase() === id.toUpperCase()));
    if (!item) return null;
    updater(item);
    saveToFile('feedback', this.feedback);
    return item;
  }

  // --- Inspections ---
  getInspections(): ProjectInspection[] {
    return [...this.inspections];
  }

  getInspectionById(id: string): ProjectInspection | undefined {
    return this.inspections.find((i) => i.id === id);
  }

  addInspection(inspection: ProjectInspection): void {
    this.inspections.unshift(inspection);
    saveToFile('inspections', this.inspections);
  }

  updateInspection(id: string, updater: (insp: ProjectInspection) => void): ProjectInspection | null {
    const insp = this.inspections.find((i) => i.id === id);
    if (!insp) return null;
    updater(insp);
    saveToFile('inspections', this.inspections);
    return insp;
  }

  // --- Documents ---
  getDocuments(): ProjectDocument[] {
    return [...this.documents];
  }

  getDocumentById(id: string): ProjectDocument | undefined {
    return this.documents.find((d) => d.id === id);
  }

  addDocument(document: ProjectDocument): void {
    this.documents.unshift(document);
    saveToFile('documents', this.documents);
  }

  updateDocument(id: string, updater: (doc: ProjectDocument) => void): ProjectDocument | null {
    const doc = this.documents.find((d) => d.id === id);
    if (!doc) return null;
    updater(doc);
    saveToFile('documents', this.documents);
    return doc;
  }

  // --- Notifications ---
  getNotifications(): SystemNotification[] {
    return [...this.notifications];
  }

  addNotification(notification: SystemNotification): void {
    this.notifications.unshift(notification);
    saveToFile('notifications', this.notifications);
  }

  markNotificationRead(id: string): boolean {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      saveToFile('notifications', this.notifications);
      return true;
    }
    return false;
  }

  markAllNotificationsRead(): void {
    this.notifications.forEach((n) => {
      n.isRead = true;
    });
    saveToFile('notifications', this.notifications);
  }

  // --- Audit Logs (STRICTLY APPEND-ONLY) ---
  getAuditLogs(projectId?: string): AuditLogEntry[] {
    if (projectId) {
      return this.auditLogs.filter((l) => l.projectId === projectId);
    }
    return [...this.auditLogs];
  }

  appendAuditLog(entry: AuditLogEntry): void {
    this.auditLogs.unshift(entry);
    saveToFile('audit_logs', this.auditLogs);
  }
}

export const db = new PersistenceStore();
