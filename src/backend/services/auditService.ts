import { AuditLogEntry, UserRole } from '../../types/index.ts';
import { db } from '../security/persistence.ts';

/**
 * Appends a new immutable audit log entry to persistent storage.
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

  db.appendAuditLog(newEntry);
  return newEntry;
}

export function getAuditLogs(projectId?: string): AuditLogEntry[] {
  return db.getAuditLogs(projectId);
}
