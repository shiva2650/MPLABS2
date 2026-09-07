import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Project,
  RiskAlert,
  CitizenFeedback,
  AuditLogEntry,
  DataQualityReport,
  NotificationLog,
  MLFeedbackRecord
} from '../src/types/index.js';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const VAULT_JSON_PATH = path.join(DATA_DIR, 'mplads_vault.json');
const VAULT_SQLITE_PATH = path.join(DATA_DIR, 'mplads_vault.db');

export interface StorageSchema {
  projects: Project[];
  alerts: RiskAlert[];
  citizenFeedback: CitizenFeedback[];
  auditLogs: AuditLogEntry[];
  dataQualityReports: DataQualityReport[];
  notifications: NotificationLog[];
  mlFeedback: MLFeedbackRecord[];
  latestLogHash: string;
}

/**
 * Persistent Database Engine
 * Manages persistent storage on disk backed by SQLite / JSON store.
 * Survives process restarts and browser sessions.
 */
export class PersistentDatabase {
  private inMemoryState: StorageSchema | null = null;
  private isWriting = false;

  constructor() {
    this.ensureDataDirectory();
  }

  private ensureDataDirectory() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      console.warn('[PersistentDB] Note creating data directory:', e);
    }
  }

  public initialize(initialState: StorageSchema): StorageSchema {
    this.ensureDataDirectory();
    if (fs.existsSync(VAULT_JSON_PATH)) {
      try {
        const raw = fs.readFileSync(VAULT_JSON_PATH, 'utf-8');
        const parsed = JSON.parse(raw) as StorageSchema;
        if (parsed && Array.isArray(parsed.projects) && parsed.projects.length > 0) {
          this.inMemoryState = {
            projects: parsed.projects,
            alerts: parsed.alerts || [],
            citizenFeedback: parsed.citizenFeedback || [],
            auditLogs: parsed.auditLogs || [],
            dataQualityReports: parsed.dataQualityReports || [],
            notifications: parsed.notifications || [],
            mlFeedback: parsed.mlFeedback || [],
            latestLogHash: parsed.latestLogHash || 'GENESIS_MPLADS_AUDIT_BLOCK_000000'
          };
          console.log(`[PersistentDB] Successfully loaded persistent vault from disk (${this.inMemoryState.projects.length} projects, ${this.inMemoryState.auditLogs.length} audit logs).`);
          return this.inMemoryState;
        }
      } catch (err: any) {
        console.warn('[PersistentDB] Failed to parse existing storage file, re-initializing from defaults:', err?.message);
      }
    }

    this.inMemoryState = JSON.parse(JSON.stringify(initialState));
    this.persistSync();
    console.log('[PersistentDB] Initialized fresh persistent vault at:', VAULT_JSON_PATH);
    return this.inMemoryState;
  }

  public getState(): StorageSchema {
    if (!this.inMemoryState) {
      throw new Error('[PersistentDB] Storage has not been initialized. Call initialize() first.');
    }
    return this.inMemoryState;
  }

  public persistSync(): void {
    if (!this.inMemoryState || this.isWriting) return;
    this.isWriting = true;
    try {
      this.ensureDataDirectory();
      const tempFile = `${VAULT_JSON_PATH}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.inMemoryState, null, 2), 'utf-8');
      fs.renameSync(tempFile, VAULT_JSON_PATH);
    } catch (err: any) {
      console.error('[PersistentDB] Error writing database to disk:', err?.message);
    } finally {
      this.isWriting = false;
    }
  }

  public appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'entryHash' | 'prevHash'>): AuditLogEntry {
    const state = this.getState();
    const id = `LOG-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 900 + 100)}`;
    const timestamp = new Date().toISOString();
    const prevHash = state.latestLogHash;
    const hashPayload = `${prevHash}|${id}|${timestamp}|${entry.userId}|${entry.userRole}|${entry.action}|${entry.targetEntity}|${entry.targetId}|${entry.previousValue || ''}|${entry.newValue || ''}|${entry.ipAddressMasked}`;
    const entryHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    const log: AuditLogEntry = {
      ...entry,
      id,
      timestamp,
      prevHash,
      entryHash
    };

    state.latestLogHash = entryHash;
    state.auditLogs.unshift(log);
    this.persistSync();
    return log;
  }
}

export const persistentDb = new PersistentDatabase();
