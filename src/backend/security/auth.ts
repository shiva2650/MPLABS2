import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, StoredUser, hashPasswordWithSalt } from './persistence.ts';
import { User, UserRole, Project } from '../../types/index.ts';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: StoredUser;
      targetProject?: Project;
    }
  }
}

/**
 * Authenticates credentials against the salted PBKDF2 hash store.
 */
export function authenticateUser(userId: string, password: string): { token: string; user: User } | null {
  const user = db.getUserByUserId(userId);
  if (!user || !user.isActive) {
    return null;
  }

  const computedHash = hashPasswordWithSalt(password, user.salt);
  if (computedHash !== user.passwordHash) {
    return null;
  }

  // Generate cryptographic session token
  const token = `mplads_sec_${crypto.randomBytes(32).toString('hex')}`;
  db.createSession(token, user.userId);

  // Return sanitized user object (strip passwordHash and salt)
  const sanitizedUser: User = {
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

  return { token, user: sanitizedUser };
}

/**
 * Middleware: Requires a valid active session token.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Missing or malformed authorization header.',
      code: 'UNAUTHENTICATED'
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const user = db.getSession(token);

  if (!user) {
    res.status(401).json({
      error: 'Session expired or invalid. Please authenticate again.',
      code: 'INVALID_SESSION'
    });
    return;
  }

  req.user = user;
  next();
}

/**
 * Middleware: Optional authentication (attaches user if present and valid, does not reject if missing).
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = db.getSession(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

/**
 * Middleware: Enforces that the authenticated user possesses one of the authorized roles.
 */
export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.', code: 'UNAUTHENTICATED' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Record security violation in audit log
      recordSecurityViolation({
        action: 'UNAUTHORIZED_ROLE_ACCESS_DENIED',
        actorId: req.user.userId,
        actorName: req.user.name,
        actorRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.originalUrl,
        ipAddress: req.ip || '127.0.0.1'
      });

      res.status(403).json({
        error: `Access Denied. Your role (${req.user.role.toUpperCase()}) is not authorized to access this resource. Requires: ${allowedRoles.join(', ').toUpperCase()}.`,
        code: 'FORBIDDEN_ROLE'
      });
      return;
    }

    next();
  };
}

/**
 * Middleware: Enforces strict data ownership / jurisdiction boundaries on projects.
 * Prevents IDOR (Insecure Direct Object References).
 */
export function requireProjectAccess(paramName = 'id', options: { allowPublicRead?: boolean } = {}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const projectId = req.params[paramName];
    if (!projectId) {
      res.status(400).json({ error: 'Project ID parameter is missing.', code: 'INVALID_REQUEST' });
      return;
    }

    const project = db.getProjectById(projectId);
    if (!project) {
      res.status(404).json({ error: `Project record '${projectId}' not found in database.`, code: 'NOT_FOUND' });
      return;
    }

    req.targetProject = project;

    // If it's a GET and public read is allowed, proceed
    if (req.method === 'GET' && options.allowPublicRead) {
      next();
      return;
    }

    // For protected reads or any state mutation, require authentication
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required to access or modify this project.', code: 'UNAUTHENTICATED' });
      return;
    }

    const user = req.user;

    // 1. Admin: Central or District
    if (user.role === 'admin') {
      // Central admins have nationwide jurisdiction
      if (user.jurisdictionLevel === 'national' || !user.district || user.district === 'All Districts') {
        next();
        return;
      }
      // District admins are scoped to their district
      if (user.district && project.district.toLowerCase() === user.district.toLowerCase()) {
        next();
        return;
      }
      // Out of jurisdiction
      recordSecurityViolation({
        action: 'CROSS_DISTRICT_ACCESS_DENIED',
        actorId: user.userId,
        actorName: user.name,
        actorRole: user.role,
        projectId: project.id,
        workId: project.workId,
        path: req.originalUrl,
        notes: `District Admin of ${user.district} attempted to access project in ${project.district}`
      });
      res.status(403).json({
        error: `Jurisdiction violation: Project is in '${project.district}', outside your authorized district (${user.district}).`,
        code: 'OUT_OF_JURISDICTION'
      });
      return;
    }

    // 2. Member of Parliament (MP): Scoped strictly to their constituency and MP ID
    if (user.role === 'mp') {
      const isOwner =
        (user.userId && project.mpId === user.userId) ||
        (user.constituency && project.constituency.toLowerCase() === user.constituency.toLowerCase());

      if (!isOwner) {
        recordSecurityViolation({
          action: 'CROSS_CONSTITUENCY_ACCESS_DENIED',
          actorId: user.userId,
          actorName: user.name,
          actorRole: user.role,
          projectId: project.id,
          workId: project.workId,
          path: req.originalUrl,
          notes: `MP of ${user.constituency} (${user.userId}) attempted to access project of ${project.constituency} (${project.mpId})`
        });
        res.status(403).json({
          error: `Access Denied: This work belongs to ${project.constituency} constituency (${project.mpName}). You are only authorized for ${user.constituency}.`,
          code: 'OUT_OF_CONSTITUENCY'
        });
        return;
      }
      next();
      return;
    }

    // 3. Implementing Agency: Scoped strictly to projects assigned to this agency
    if (user.role === 'agency') {
      const isAssigned =
        (user.agencyId && project.agencyId === user.agencyId) ||
        (user.agencyName && project.agencyName.toLowerCase().includes(user.agencyName.toLowerCase()));

      if (!isAssigned) {
        recordSecurityViolation({
          action: 'UNASSIGNED_AGENCY_ACCESS_DENIED',
          actorId: user.userId,
          actorName: user.name,
          actorRole: user.role,
          projectId: project.id,
          workId: project.workId,
          path: req.originalUrl,
          notes: `Agency ${user.agencyName} (${user.agencyId}) attempted to access project assigned to ${project.agencyName} (${project.agencyId})`
        });
        res.status(403).json({
          error: `Access Denied: Work is assigned to '${project.agencyName}'. Your agency is '${user.agencyName}'.`,
          code: 'UNASSIGNED_AGENCY'
        });
        return;
      }
      next();
      return;
    }

    // Public / citizen attempting mutation or restricted action
    res.status(403).json({ error: 'Unauthorized role action.', code: 'FORBIDDEN' });
  };
}

function recordSecurityViolation(details: {
  action: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  requiredRoles?: string[];
  projectId?: string;
  workId?: string;
  path: string;
  notes?: string;
  ipAddress?: string;
}): void {
  db.appendAuditLog({
    id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    projectId: details.projectId || 'SECURITY_SYSTEM',
    workId: details.workId || 'AUTH_GATEWAY',
    action: `SECURITY_ALERT: ${details.action}`,
    actorId: details.actorId,
    actorName: details.actorName,
    actorRole: details.actorRole as UserRole,
    fieldChanged: 'AUTHORIZATION_GATEWAY',
    previousValue: 'DENIED',
    newValue: details.notes || `Attempted path: ${details.path}`,
    timestamp: new Date().toISOString(),
    ipAddress: details.ipAddress || '127.0.0.1'
  });
}
