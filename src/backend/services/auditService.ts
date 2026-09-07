import { AuditLogEntry, UserRole } from '../../types/index.ts';
import { INITIAL_AUDIT_LOGS } from '../data/seedData.ts';

// In-memory append-only log store initialized with realistic initial logs
const auditStore: AuditLogEntry[] = [...INITIAL_AUDIT_LOGS];

/**
 * Appends a new immutable audit log entry.
 * Note: No updates or deletes are permitted on this store, preserving an unalterable history.
 */
export function recordAuditLog(params: {
  projectId: string;
  workId: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  fieldChanged: string;
  previousValue: string;
  newValue: string;
  ipAddress?: string;
}): AuditLogEntry {
  const newEntry: AuditLogEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    projectId: params.projectId,
    workId: params.workId,
    action: params.action,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    fieldChanged: params.fieldChanged,
    previousValue: params.previousValue,
    newValue: params.newValue,
    timestamp: new Date().toISOString(),
    ipAddress: params.ipAddress || '127.0.0.1'
  };

  auditStore.unshift(newEntry);
  return newEntry;
}

export function getAuditLogs(projectId?: string): AuditLogEntry[] {
  if (projectId) {
    return auditStore.filter((l) => l.projectId === projectId);
  }
  return [...auditStore];
}
