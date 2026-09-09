import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { AuditLogEntry } from '../types/index.js';
import { useLanguage } from '../context/LanguageContext.js';

interface AuditLogPageProps {
  onBackToDashboard?: () => void;
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({ onBackToDashboard }) => {
  const { language, t, translateRole } = useLanguage();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    verifiedCount: number;
    brokenAtId?: string;
    algorithm: string;
    verifiedAt: string;
  } | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      setLogs(res.auditLogs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyAuditLogsIntegrity();
      setVerificationResult(res);
    } catch (err) {
      console.error('Audit log verification failed:', err);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-muted flex flex-col items-center justify-center space-y-2">
        <RefreshCw className="w-5 h-5 animate-spin text-govt-navy" />
        <span>{language === 'hi' ? 'अपरिवर्तनीय ऑडिट अनुक्रम का सत्यापन एवं लोड किया जा रहा है...' : 'Verifying & loading immutable audit sequence...'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Persistent Back Button */}
      {onBackToDashboard && (
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-govt-navy bg-white border border-slate-border hover:bg-panel-bg rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← {t.backToOverview}</span>
          </button>
          <span className="text-xs text-slate-muted">
            {t.home} &gt; {t.auditLogs}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-govt-navy" />
            <h1 className="text-xl font-bold text-slate-body tracking-tight">
              {language === 'hi' ? 'अपरिवर्तनीय सिस्टम ऑडिट ट्रेल एवं सुरक्षा लॉग' : 'Tamper-Evident System Audit Trail & Security Logs'}
            </h1>
          </div>
          <p className="text-xs text-slate-muted mt-0.5">
            {language === 'hi'
              ? 'प्रशासनिक, वित्तीय और एआई सत्यापन घटनाओं को रिकॉर्ड करने वाला क्रिप्टोग्राफिक SHA-256 खाता'
              : 'Cryptographically chained SHA-256 ledger recording all administrative, financial, and AI verification events'}
          </p>
        </div>

        <button
          onClick={handleVerifyIntegrity}
          disabled={verifying}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-govt-navy text-white hover:bg-govt-navy-light transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {verifying ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Lock className="w-4 h-4 text-panel-bg/80" />
          )}
          <span>{verifying ? (language === 'hi' ? 'हैश सत्यापन जारी...' : 'Validating Hashes...') : (language === 'hi' ? 'क्रिप्टोग्राफिक अखंडता सत्यापित करें' : 'Verify Cryptographic Integrity')}</span>
        </button>
      </div>

      {verificationResult && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            verificationResult.isValid
              ? 'bg-emerald-50 border-status-verified/30 text-status-verified'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {verificationResult.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-status-verified flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <div>
              <div className="font-bold">
                {verificationResult.isValid
                  ? (language === 'hi'
                      ? `क्रिप्टोग्राफिक हैश श्रृंखला सत्यापित: 100% सुरक्षित (${verificationResult.verifiedCount} प्रविष्टियां)`
                      : `Cryptographic Hash Chain Verified: 100% Intact (${verificationResult.verifiedCount} Entries)`)
                  : (language === 'hi'
                      ? `सत्यनिष्ठा विसंगति: ${verificationResult.brokenAtId} पर टूटी हुई श्रृंखला पाई गई`
                      : `Integrity Anomaly: Broken chain detected at ${verificationResult.brokenAtId}`)}
              </div>
              <div className="text-[11px] opacity-80">
                {language === 'hi' ? 'एल्गोरिदम:' : 'Algorithm:'} {verificationResult.algorithm} | {language === 'hi' ? 'सत्यापन समय:' : 'Verified At:'} {new Date(verificationResult.verifiedAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider font-bold px-2 py-0.5 rounded bg-white/60">
            {language === 'hi' ? 'जेनेसिस एंकर मान्य' : 'Genesis Anchor Validated'}
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-panel-bg text-slate-body font-bold uppercase text-[10px] tracking-wider border-b border-slate-border">
              <tr>
                <th className="p-3">{language === 'hi' ? 'लॉग आईडी' : 'Log ID'}</th>
                <th className="p-3">{language === 'hi' ? 'समय-मुहर' : 'Timestamp'}</th>
                <th className="p-3">{language === 'hi' ? 'कर्ता (अधिकारी)' : 'Actor (Officer)'}</th>
                <th className="p-3">{language === 'hi' ? 'कार्रवाई का प्रकार' : 'Action Type'}</th>
                <th className="p-3">{language === 'hi' ? 'लक्षित विवरण' : 'Target & Details'}</th>
                <th className="p-3">{language === 'hi' ? 'क्रिप्टोग्राफिक SHA-256 हैश' : 'Cryptographic SHA-256 Hash'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-border">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-panel-bg transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-muted whitespace-nowrap">
                    {log.id}
                  </td>
                  <td className="p-3 whitespace-nowrap font-mono text-slate-muted text-[11px]">
                    {new Date(log.timestamp).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN')}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-bold text-slate-body">{log.userName}</div>
                    <div className="text-[10px] text-slate-muted font-mono">
                      {log.userId} ({translateRole(log.userRole)})
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-govt-navy border border-emerald-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-body">
                    <div className="font-mono text-[11px] text-govt-navy">
                      {log.targetEntity}: {log.targetId}
                    </div>
                    {log.newValue && (
                      <div className="text-xs text-slate-700 mt-0.5">{log.newValue}</div>
                    )}
                    {log.previousValue && (
                      <div className="text-[10px] text-slate-400 mt-0.5">{language === 'hi' ? 'पूर्व:' : 'Prev:'} {log.previousValue}</div>
                    )}
                  </td>
                  <td className="p-3 font-mono text-[10px] text-gray-500 max-w-[200px]">
                    {log.entryHash ? (
                      <div>
                        <span className="font-semibold text-status-verified">Hash: </span>
                        <span title={log.entryHash} className="cursor-help">
                          {log.entryHash.slice(0, 16)}...
                        </span>
                        {log.prevHash && (
                          <div className="text-[9px] text-gray-400" title={log.prevHash}>
                            Prev: {log.prevHash.slice(0, 12)}...
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Genesis</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
