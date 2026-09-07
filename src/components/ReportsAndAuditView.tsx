import React, { useEffect, useState } from 'react';
import { AuditLogEntry, UserProfile } from '../types';
import { ApiService } from '../services/api';
import {
  FileText,
  Download,
  ShieldCheck,
  Lock,
  Clock,
  User,
  Search,
  CheckCircle,
} from 'lucide-react';

interface ReportsAndAuditViewProps {
  currentUser: UserProfile;
}

export const ReportsAndAuditView: React.FC<ReportsAndAuditViewProps> = ({
  currentUser,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchUser = log.userName.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      if (!matchAction && !matchUser && !matchDetails) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-stone-200 text-stone-800 rounded text-[11px] font-bold">
              Administrative Compliance &amp; Transparency
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 mt-1">
            Reports &amp; Append-Only Immutable Audit Trail
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Every administrative sanction, agency assignment, physical progress update, and photo upload is cryptographically timestamped and logged.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded border border-emerald-200 shrink-0">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Append-Only Immutability Active</span>
        </div>
      </div>

      {/* Reports Export Section */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 border-b border-stone-200 pb-2">
          Statutory Report Generation &amp; CSV Exports
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <a
            href="/api/reports/projects/csv"
            className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg flex items-center justify-between transition-colors group"
          >
            <div>
              <div className="font-bold text-stone-900 group-hover:text-sky-900">
                All Projects Dataset
              </div>
              <div className="text-[11px] text-stone-500">Comprehensive works &amp; financials</div>
            </div>
            <Download className="w-4 h-4 text-stone-400 group-hover:text-sky-900" />
          </a>

          <a
            href="/api/reports/risk/csv"
            className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg flex items-center justify-between transition-colors group"
          >
            <div>
              <div className="font-bold text-stone-900 group-hover:text-sky-900">
                AI Anomaly Alerts
              </div>
              <div className="text-[11px] text-stone-500">Risk flags &amp; review status</div>
            </div>
            <Download className="w-4 h-4 text-stone-400 group-hover:text-sky-900" />
          </a>

          <a
            href="/api/reports/citizen/csv"
            className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg flex items-center justify-between transition-colors group"
          >
            <div>
              <div className="font-bold text-stone-900 group-hover:text-sky-900">
                Citizen Feedback
              </div>
              <div className="text-[11px] text-stone-500">Community complaints &amp; photos</div>
            </div>
            <Download className="w-4 h-4 text-stone-400 group-hover:text-sky-900" />
          </a>

          <a
            href="/api/reports/vendors/csv"
            className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg flex items-center justify-between transition-colors group"
          >
            <div>
              <div className="font-bold text-stone-900 group-hover:text-sky-900">
                Agency Performance
              </div>
              <div className="text-[11px] text-stone-500">Velocity &amp; completion benchmarks</div>
            </div>
            <Download className="w-4 h-4 text-stone-400 group-hover:text-sky-900" />
          </a>
        </div>
      </div>

      {/* Immutable Audit Trail Table */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Immutable System Audit Logs ({filteredLogs.length})
            </h3>
            <p className="text-xs text-stone-500">
              Tamper-evident chronological activity trail of all administrative and scheme transactions
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit trail..."
                className="pl-8 pr-3 py-1.5 border border-stone-300 rounded text-stone-900 bg-white"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-stone-300 rounded text-stone-700 bg-white"
            >
              <option value="ALL">All Actions</option>
              <option value="SANCTION_APPROVED">Sanctions Approved</option>
              <option value="WORK_RECOMMENDED">Works Recommended</option>
              <option value="PROGRESS_UPDATED">Progress Updates</option>
              <option value="PHOTO_UPLOADED">Photo Uploads</option>
              <option value="ALERT_REVIEWED">Alerts Reviewed</option>
              <option value="USER_LOGIN">User Logins</option>
            </select>
          </div>
        </div>

        <div className="border border-stone-200 rounded-md overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700 border-collapse">
            <thead className="bg-stone-100 text-stone-800 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-2.5 border-r border-stone-200">Timestamp</th>
                <th className="p-2.5 border-r border-stone-200">Officer / User</th>
                <th className="p-2.5 border-r border-stone-200">Action Code</th>
                <th className="p-2.5 border-r border-stone-200">Transaction Details</th>
                <th className="p-2.5 border-r border-stone-200">Value Delta (Diff)</th>
                <th className="p-2.5 text-center">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-2.5 font-mono text-stone-500 border-r border-stone-200 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-2.5 border-r border-stone-200 whitespace-nowrap">
                    <div className="font-bold text-stone-900">{log.userName}</div>
                    <div className="text-[10px] text-stone-500">{log.role}</div>
                  </td>
                  <td className="p-2.5 border-r border-stone-200 font-mono text-[11px] whitespace-nowrap">
                    <span className="px-1.5 py-0.5 bg-stone-100 border border-stone-200 rounded text-stone-800 font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-2.5 border-r border-stone-200">
                    <div className="text-stone-800">{log.details}</div>
                    {log.projectTitle && (
                      <div className="text-[10px] text-stone-500 mt-0.5">
                        Target: {log.projectTitle}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-stone-200 font-mono text-[11px] text-stone-600">
                    {log.newValue ? (
                      <div>
                        {log.previousValue && (
                          <div className="text-red-700 line-through text-[10px]">
                            {log.previousValue}
                          </div>
                        )}
                        <div className="text-emerald-800 font-bold">{log.newValue}</div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-2.5 text-center font-mono text-stone-400 text-[11px]">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-stone-500">
                    No matching audit log entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
