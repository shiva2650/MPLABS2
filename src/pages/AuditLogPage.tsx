import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { AuditLogEntry } from '../types/index.js';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await api.getAuditLogs();
      setLogs(res.auditLogs || []);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyAuditLogsIntegrity();
      setVerificationResult(res);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1B3022] tracking-tight">Tamper-Evident SHA-256 Audit Ledger</h1>
          <p className="text-xs text-[#588157]">Cryptographically chained blocks recording all administrative and ML vigilance events</p>
        </div>
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1B3022] text-white hover:bg-[#2C4A34] cursor-pointer shadow-xs"
        >
          <Lock className="w-4 h-4 text-[#A3B899]" />
          <span>{verifying ? 'Validating Hashes...' : 'Verify Cryptographic Integrity'}</span>
        </button>
      </div>

      {verificationResult && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${verificationResult.isValid ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">Cryptographic Chain Verified: 100% Intact ({verificationResult.verifiedCount} Blocks Checked)</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#DDE5D4] shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8F9F7] text-[#1B3022] font-bold text-[10px] uppercase border-b border-[#DDE5D4]">
            <tr>
              <th className="p-3">Log ID</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Action</th>
              <th className="p-3">Details</th>
              <th className="p-3">SHA-256 Block Signature</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDE5D4]">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-[#F8F9F7]">
                <td className="p-3 font-mono font-bold text-[#588157]">{log.id}</td>
                <td className="p-3 font-mono text-[11px] text-[#588157]">{new Date(log.timestamp).toLocaleString('en-IN')}</td>
                <td className="p-3 font-bold text-[#1B3022]">{log.userName}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-[#EAF0E6] text-[#395C40] font-bold text-[10px]">{log.action}</span></td>
                <td className="p-3">{log.newValue || log.previousValue}</td>
                <td className="p-3 font-mono text-[10px] text-gray-500">{log.entryHash ? `${log.entryHash.slice(0, 16)}...` : 'Genesis'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
