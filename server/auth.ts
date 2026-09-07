import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { users } from './db.js';
import { User, UserRole } from '../src/types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * =========================================================================================
 * STATUTORY MPLADS MULTI-AUTHORITY ROLE-BASED ACCESS CONTROL (RBAC) MATRIX
 * Mandated under MoSPI (Ministry of Statistics and Programme Implementation) Framework
 * =========================================================================================
 * Role / Authority               | Permitted Actions & Boundaries
 * -------------------------------+---------------------------------------------------------
 * MP (Member of Parliament)      | Recommend project, view constituency works, track funds
 * District Authority (ADMIN)     | Scrutinize feasibility, sanction works up to ₹50L, assign agency,
 *                                | disburse funds, review & dismiss alerts, forward high-value works to State
 * State Nodal Authority (STATE)  | Review works > ₹50L, inter-district projects, approve state clearance,
 *                                | or forward to Ministry for mega / special schemes
 * Ministry (MINISTRY/SUPER_ADMIN)| Final sanction for special category works, national policy audits,
 *                                | global transparency dashboard, vigilance investigation
 * Implementing Agency (AGENCY)   | Update physical progress, submit geotagged photos, request payment vouchers
 * Public Citizen (PUBLIC/VIEWER) | View public sanitized register, submit grievances & feedback
 * =========================================================================================
 */

export const ROLE_ALIASES: Record<string, UserRole> = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CENTRAL_VIGILANCE: 'SUPER_ADMIN',
  MINISTRY: 'MINISTRY',
  MOSPI: 'MINISTRY',
  STATE_NODAL: 'STATE_NODAL',
  STATE_ADMIN: 'STATE_NODAL',
  STATE: 'STATE_NODAL',
  ADMIN: 'ADMIN',
  ADMINISTRATOR: 'ADMIN',
  DISTRICT_AUTHORITY: 'ADMIN',
  COLLECTOR: 'ADMIN',
  DM: 'ADMIN',
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

const JWT_SECRET: string = process.env.JWT_SECRET || 'mplads_secure_statutory_token_secret_2025_entropy';
const TOKEN_EXPIRY = '8h';
const revokedTokens = new Set<string>();

export function generateToken(user: User): string {
  const safeRole = normalizeRole(user.role);
  const payload = {
    userId: user.userId,
    role: safeRole,
    name: user.name,
    district: user.district,
    state: user.state,
    constituency: user.constituency,
    agencyId: user.agencyId,
    jti: crypto.randomUUID()
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): User | null {
  if (!token || revokedTokens.has(token)) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.userId) return null;
    const foundUser = users.find(u => u.userId.toUpperCase() === decoded.userId.toUpperCase());
    if (foundUser) {
      return sanitizeUser(foundUser);
    }
    return {
      id: `user_${decoded.userId.toLowerCase()}`,
      userId: decoded.userId,
      name: decoded.name || decoded.userId,
      role: normalizeRole(decoded.role),
      designation: decoded.role === 'ADMIN' ? 'District Authority' : decoded.role === 'MP' ? 'Member of Parliament' : decoded.role === 'STATE_NODAL' ? 'State Nodal Officer' : decoded.role === 'MINISTRY' ? 'MoSPI Officer' : 'Implementing Officer',
      district: decoded.district,
      state: decoded.state,
      constituency: decoded.constituency,
      agencyId: decoded.agencyId
    };
  } catch {
    return null;
  }
}

export function revokeToken(token: string) {
  if (token) {
    revokedTokens.add(token);
    setTimeout(() => revokedTokens.delete(token), 24 * 60 * 60 * 1000);
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    req.user = undefined;
    return next();
  }
  const user = verifyToken(token);
  req.user = user || undefined;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role === 'PUBLIC') {
    return res.status(401).json({ error: 'Authentication required to access this resource.' });
  }
  next();
}

export function requireRole(allowedRoles: (UserRole | string)[]) {
  const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication credentials required.' });
    }
    const userRole = normalizeRole(req.user.role);
    // SUPER_ADMIN has master override
    if (userRole === 'SUPER_ADMIN' || normalizedAllowed.includes(userRole)) {
      return next();
    }
    return res.status(403).json({
      error: `Access denied. Role '${req.user.role}' lacks sufficient privileges. Required: ${allowedRoles.join(', ')}`
    });
  };
}

export function sanitizeUser(u: typeof users[0]): User {
  const { passwordHash, ...safeUser } = u;
  return safeUser;
}
