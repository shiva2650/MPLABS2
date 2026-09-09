import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './db.js';
import { User, UserRole } from '../src/types/index.js';
import { config } from './config.js';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * =========================================================================================
 * STATUTORY MPLADS ROLE-BASED ACCESS CONTROL (RBAC & ABAC) MATRIX
 * Mandated under MoSPI (Ministry of Statistics and Programme Implementation) Framework
 * =========================================================================================
 */

export const ROLE_ALIASES: Record<string, UserRole> = {
  SUPER_ADMIN: 'ADMIN',
  ADMIN: 'ADMIN',
  ADMINISTRATOR: 'ADMIN',
  MP: 'MP',
  MEMBER: 'MP',
  AGENCY: 'AGENCY',
  PROJECT_MANAGER: 'AGENCY',
  IMPLEMENTING_AGENCY: 'AGENCY',
  VIEWER: 'PUBLIC',
  CITIZEN: 'PUBLIC',
  PUBLIC: 'PUBLIC'
};

export function normalizeRole(roleStr?: string): UserRole {
  if (!roleStr) return 'PUBLIC';
  const upper = roleStr.toUpperCase().replace(/\s+/g, '_');
  return ROLE_ALIASES[upper] || 'PUBLIC';
}

// Cryptographic Password Hashing using PBKDF2 (SHA-256 with 100,000 iterations & salt)
export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
    const computedBuf = Buffer.from(computedHash, 'hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (computedBuf.length !== storedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(computedBuf, storedBuf);
  } catch {
    return false;
  }
}

// In-memory token revocation blocklist for logout & invalidation
const revokedTokens = new Set<string>();

export function generateToken(user: User): string {
  const safeRole = normalizeRole(user.role);
  const payload = {
    userId: user.userId,
    role: safeRole,
    name: user.name,
    district: user.district,
    constituency: user.constituency,
    agencyId: user.agencyId,
    jti: crypto.randomUUID()
  };

  return jwt.sign(payload, config.jwtSecret, { expiresIn: `${config.tokenExpiryHours}h` });
}

export function verifyToken(token: string): User | null {
  if (!token || revokedTokens.has(token)) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    if (!decoded || !decoded.userId) {
      return null;
    }

    const foundUser = db.getUserByUserId(decoded.userId);
    if (!foundUser) {
      // A validly signed token is not enough on its own; the user must still
      // exist in the current authoritative user store.
      return null;
    }
    return sanitizeUser(foundUser);
  } catch {
    return null;
  }
}

export function revokeToken(token: string) {
  if (token) {
    revokedTokens.add(token);
    // Auto-clean blocklist after 24h
    setTimeout(() => revokedTokens.delete(token), 24 * 60 * 60 * 1000);
  }
}

// Authentication middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    req.user = undefined;
    return next();
  }

  const user = verifyToken(token);
  if (!user) {
    req.user = undefined;
    return next();
  }

  req.user = user;
  next();
}

// Require authenticated user (any authorized non-public role)
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role === 'PUBLIC') {
    return res.status(401).json({ error: 'Authentication required to access this resource.' });
  }
  next();
}

// Role-based authorization middleware
export function requireRole(allowedRoles: (UserRole | string)[]) {
  const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication credentials required.' });
    }

    const userRole = normalizeRole(req.user.role);
    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' lacks sufficient privileges. Required: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

// Object-level authorization for projects (ABAC / IDOR defense)
export function requireProjectAccess(mode: 'read' | 'update' | 'sanction' | 'disburse' = 'read') {
  return (req: Request, res: Response, next: NextFunction) => {
    const projectId = req.params.id || req.body.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID required.' });
    }

    const project = db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Public read: allow (routes will sanitize with PublicProjectDTO)
    if (mode === 'read') {
      if (!req.user || req.user.role === 'PUBLIC') {
        return next();
      }
    } else {
      // Any mutation requires authenticated user
      if (!req.user || req.user.role === 'PUBLIC') {
        return res.status(401).json({ error: 'Authentication required.' });
      }
    }

    const user = req.user!;
    const userRole = normalizeRole(user.role);

    // ADMIN has jurisdiction within district or overarching authority
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      if (user.district && project.district.toLowerCase() !== user.district.toLowerCase()) {
        return res.status(403).json({ error: 'Access denied: Project is outside your district jurisdiction.' });
      }
      return next();
    }

    // MP permissions
    if (userRole === 'MP') {
      if (mode === 'sanction' || mode === 'disburse') {
        return res.status(403).json({ error: 'Statutory Violation: Members of Parliament cannot sanction projects or disburse funds.' });
      }
      // Must match MP or Constituency
      const isOwner = project.mpId === user.userId;
      const isSameConstituency = user.constituency && project.constituency.toLowerCase() === user.constituency.toLowerCase();
      if (!isOwner && !isSameConstituency) {
        return res.status(403).json({ error: 'Access denied: Project does not belong to your constituency.' });
      }
      return next();
    }

    // AGENCY permissions
    if (userRole === 'AGENCY') {
      if (mode === 'sanction' || mode === 'disburse') {
        return res.status(403).json({ error: 'Statutory Violation: Implementing Agencies cannot self-sanction or self-disburse.' });
      }
      if (project.implementingAgencyId !== user.agencyId) {
        return res.status(403).json({ error: 'Access denied: Project is not assigned to your agency.' });
      }
      return next();
    }

    return res.status(403).json({ error: 'Access denied for your role.' });
  };
}

// Object-level authorization for Citizen Grievance
export function requireGrievanceAccess(req: Request, res: Response, next: NextFunction) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: 'Grievance ID required.' });
  }

  const grievance = db.getFeedbackById(id);
  if (!grievance) {
    return res.status(404).json({ error: 'Grievance record not found.' });
  }

  // Public users can only query if trackingNumber or id matches their explicit query,
  // but if accessing /api/citizen-feedback/:id full internal record, must be authenticated
  if (!req.user || req.user.role === 'PUBLIC') {
    return res.status(401).json({ error: 'Authentication required to view internal grievance record.' });
  }

  const user = req.user;
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return next();
  }

  const project = db.getProjectById(grievance.projectId);
  if (user.role === 'MP') {
    if (project && user.constituency && project.constituency.toLowerCase() !== user.constituency.toLowerCase()) {
      return res.status(403).json({ error: 'Access denied: Grievance is outside your constituency.' });
    }
    return next();
  }

  if (user.role === 'AGENCY') {
    if (project && user.agencyId && project.implementingAgencyId !== user.agencyId) {
      return res.status(403).json({ error: 'Access denied: Grievance does not pertain to your assigned projects.' });
    }
    return next();
  }

  return res.status(403).json({ error: 'Access denied.' });
}

// User-specific notification security
export function requireNotificationAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role === 'PUBLIC') {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const notifId = req.params.id || req.body?.id || req.body?.notificationId;
  if (notifId) {
    const notif = db.getNotificationById(notifId);
    if (!notif) {
      return res.status(404).json({ error: 'Notification not found.' });
    }
    // Allow if assigned directly to user, targeted to user's role, broadcast to ALL, or admin
    const isOwner =
      notif.userId === req.user.userId ||
      notif.targetRole === req.user.role ||
      notif.targetRole === 'ALL';
    if (!isOwner && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied: Notification belongs to another user.' });
    }
  }

  next();
}

// Strict ADMIN-only audit log access
export function requireAuditAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const role = normalizeRole(req.user.role);
  if (role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied: Audit trail logs are strictly restricted to District Vigilance Administrators.' });
  }

  next();
}

// Strip sensitive fields (passwords, salts, tokens)
export function sanitizeUser(u: any): User {
  const { passwordHash, salt, ...safeUser } = u;
  return safeUser as User;
}
