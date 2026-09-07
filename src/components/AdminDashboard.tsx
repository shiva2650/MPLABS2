import React, { useState, useEffect } from 'react';
import { User, Project, Alert, AuditLogEntry, VendorAnalytics } from '../types/index.ts';
import {
  updateProjectStatus,
  reviewAlert,
  fetchAuditLogs,
  fetchVendorAnalytics
} from '../services/api.ts';
import { VendorAnalyticsView } from './VendorAnalyticsView.tsx';
import { StatusBadge } from './ui/StatusBadge.tsx';
import {
  FileCheck2,
  ShieldAlert,
  TrendingUp,
  History,
  Check,
  X,
  UserCheck,
  ChevronRight,
  Download
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  projects: Project[];
  alerts: Alert[];
  onSelectProject: (p: Project) => void;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  projects,
  alerts,
  onSelectProject,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'alerts' | 'vendors' | 'audit'>('approvals');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [vendors, setVendors] = useState<VendorAnalytics[]>([]);
  const [loading, setLoading] = useState(false);

  // Sanctioning Modal state
  const [selectedProjectForSanction, setSelectedProjectForSanction] = useState<Project | null>(null);
  const [sanctionCost, setSanctionCost] = useState('');
  const [agencyName, setAgencyName] = useState('PWD Rural Works Division');
  const [vendorName, setVendorName] = useState('Venkateshwara Infratech Pvt Ltd');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Alert Review Modal state
  const [selectedAlertForReview, setSelectedAlertForReview] = useState<Alert | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'Valid' | 'False Positive' | 'Needs More Info' | 'Escalated'>('Valid');
  const [reviewNotes, setReviewNotes] = useState('');

  // Notification feedback
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Load audit logs and vendor stats on mount/tab change
  useEffect(() => {
    const loadSubData = async () => {
      try {
        setLoading(true);
        const [logsData, vendorData] = await Promise.all([
          fetchAuditLogs(),
          fetchVendorAnalytics()
        ]);
        setAuditLogs(logsData);
        setVendors(vendorData);
      } catch (err) {
        console.warn('Admin supplemental data load notice:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSubData();
  }, [activeTab]);

  const pendingProjects = projects.filter((p) => p.status === 'Recommended' || p.status === 'Under Review');
  const openAlerts = alerts.filter((a) => a.status === 'Open' || a.status === 'Under Review');
  const totalSanctionedCost = projects.reduce((acc, p) => acc + (p.sanctionedCost || 0), 0);
  const totalUtilizedCost = projects.reduce((acc, p) => acc + (p.utilizedCost || 0), 0);

  const handleSanctionSubmit = async (approved: boolean) => {
    if (!selectedProjectForSanction) return;
    setSubmittingAction(true);
    try {
      if (approved) {
        await updateProjectStatus(selectedProjectForSanction.id, {
          status: 'Sanctioned',
          sanctionedCost: Number(sanctionCost) || selectedProjectForSanction.estimatedCost,
          agencyId: 'AGENCY001',
          agencyName,
          vendorName,
          notes: decisionNotes
        });
        setFeedbackMsg(`Work ${selectedProjectForSanction.workId} administratively sanctioned.`);
      } else {
        await updateProjectStatus(selectedProjectForSanction.id, {
          status: 'Rejected',
          notes: decisionNotes || 'Proposal does not fulfill technical or financial feasibility guidelines.'
        });
        setFeedbackMsg(`Work ${selectedProjectForSanction.workId} marked as rejected.`);
      }

      setSelectedProjectForSanction(null);
      setDecisionNotes('');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleAlertReviewSubmit = async () => {
    if (!selectedAlertForReview) return;
    setSubmittingAction(true);
    try {
      await reviewAlert(selectedAlertForReview.id, {
        status: reviewStatus,
        reviewNotes
      });
      setFeedbackMsg(`Alert #${selectedAlertForReview.id} updated to status: ${reviewStatus}`);
      setSelectedAlertForReview(null);
      setReviewNotes('');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to review alert.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const formatLakhs = (val: number) => `₹${(val / 100000).toFixed(1)} L`;
  const formatCrores = (val: number) => `₹${(val / 10000000).toFixed(2)} Cr`;

  return (
    <div className="space-y-5">
      {/* Clean Institutional Header */}
      <div className="bg-white p-4 rounded border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] bg-blue-900 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                District Authority Console
              </span>
              <span className="text-xs text-slate-500">
                {user.jurisdictionLevel === 'district' ? `District Magistrate & Collector • ${user.district}, ${user.state}` : 'Central Programme Officer'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
            <p className="text-xs text-slate-500">
              Statutory Administrative Sanctions, Implementing Agency Oversight & AI Integrity Adjudication
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onRefreshData}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded border border-slate-300 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded border border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Pending Sanctions
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {pendingProjects.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Proposals awaiting review
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Active AI Alerts
          </div>
          <div className="text-2xl font-bold text-rose-700">
            {openAlerts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Vigilance queue items
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Sanctioned Works
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {projects.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Total {formatCrores(totalSanctionedCost)}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Expenditure Disbursed
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCrores(totalUtilizedCost)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {totalSanctionedCost > 0 ? Math.round((totalUtilizedCost / totalSanctionedCost) * 100) : 0}% of allocation
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs font-semibold flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`px-3 py-1.5 font-bold rounded transition-colors whitespace-nowrap ${
            activeTab === 'approvals'
              ? 'bg-blue-900 text-white'
              : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Work Sanctions Pipeline ({pendingProjects.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`px-3 py-1.5 font-bold rounded transition-colors whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'bg-rose-900 text-white'
              : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200'
          }`}
        >
          AI Risk Alerts ({alerts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vendors')}
          className={`px-3 py-1.5 font-bold rounded transition-colors whitespace-nowrap ${
            activeTab === 'vendors'
              ? 'bg-blue-900 text-white'
              : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Vendor & Agency Analytics
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 font-bold rounded transition-colors whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-slate-900 text-white'
              : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Audit Trail
        </button>
      </div>

      {/* TAB 1: WORK APPROVAL & SANCTION PIPELINE */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded border border-slate-200 overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                MP Proposals Pending Administrative Sanction
              </h3>
              <p className="text-xs text-slate-500">
                Verification under MPLADS Guidelines Rule 2.11
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {pendingProjects.length} Pending
            </span>
          </div>

          {pendingProjects.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              All recommended works have been processed. No proposals pending sanction.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[11px] text-slate-700">
                        {proj.workId}
                      </span>
                      <StatusBadge status={proj.status} size="xs" />
                      <span className="text-[11px] text-slate-500">
                        Recommended by {proj.mpName} ({proj.constituency})
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900">{proj.title}</h4>
                    <p className="text-slate-600 line-clamp-1">{proj.description}</p>
                    <div className="text-slate-500 text-[11px]">
                      Location: <span className="font-medium text-slate-700">{proj.locationAddress}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs pt-0.5">
                      <div>
                        Estimated Cost: <span className="font-bold text-slate-900">{formatLakhs(proj.estimatedCost)}</span>
                      </div>
                      <div>
                        Cost Check:{' '}
                        <span className={proj.costAnomaly?.isAnomaly ? 'text-rose-700 font-bold' : 'text-emerald-700 font-semibold'}>
                          {proj.costAnomaly?.isAnomaly ? `Flagged Outlier (z=${proj.costAnomaly.zScore})` : 'Normal Baseline'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={() => onSelectProject(proj)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-300 transition-colors"
                    >
                      Inspect File
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProjectForSanction(proj);
                        setSanctionCost(String(proj.estimatedCost));
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded transition-colors flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Sanction / Assign</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI RISK ALERTS & ADJUDICATION */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded border border-slate-200 overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                AI Anomaly Alerts Vigilance Queue
              </h3>
              <p className="text-xs text-slate-500">
                Human review required for all statistical cost and geo-inspection flags
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
              {alerts.length} Total Alerts
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active integrity alerts. All projects within statistical tolerances.
              </div>
            ) : (
              alerts.map((alt) => (
                <div
                  key={alt.id}
                  className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[11px] text-slate-700">
                        {alt.workId}
                      </span>
                      <StatusBadge status={alt.riskLevel} size="xs" />
                      <StatusBadge status={alt.status} size="xs" />
                    </div>

                    <h4 className="font-bold text-slate-900">{alt.projectTitle}</h4>
                    <div className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="font-bold text-slate-900">Observation: </span>
                      {alt.reason}
                    </div>

                    {alt.reviewNotes && (
                      <div className="text-[11px] text-slate-600 bg-amber-50 p-2 rounded border border-amber-200">
                        <span className="font-bold text-slate-900">Adjudication Note: </span>
                        {alt.reviewNotes} (by {alt.reviewedBy || 'District Authority'})
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                    <button
                      type="button"
                      onClick={() => {
                        const proj = projects.find((p) => p.id === alt.projectId);
                        if (proj) onSelectProject(proj);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-300 transition-colors"
                    >
                      View Work
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAlertForReview(alt);
                        setReviewNotes(alt.reviewNotes || '');
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded transition-colors"
                    >
                      Adjudicate Alert
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: VENDOR & AGENCY ANALYTICS */}
      {activeTab === 'vendors' && (
        <VendorAnalyticsView
          vendors={vendors}
          projects={projects}
          currentUser={user}
          onSelectProject={onSelectProject}
          onSanctionWorkWithVendor={(vName, aName) => {
            if (pendingProjects.length > 0) {
              const target = pendingProjects[0];
              setSelectedProjectForSanction(target);
              setVendorName(vName);
              setAgencyName(aName);
              setSanctionCost(String(target.estimatedCost));
            } else {
              setFeedbackMsg(`Contractor ${vName} noted. No works are currently awaiting administrative sanction.`);
            }
          }}
          onRefreshData={async () => {
            try {
              const data = await fetchVendorAnalytics();
              setVendors(data);
            } catch (e) {
              console.warn('Vendor analytics refresh notice:', e);
            }
          }}
        />
      )}

      {/* TAB 4: AUDIT LOG VIEWER */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded border border-slate-200 overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Append-Only Governance Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Tamper-evident chronological log of all administrative actions and inspections
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {auditLogs.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity ID</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No audit records found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {log.userName}
                        <span className="block text-[10px] text-slate-400 uppercase">{log.userRole}</span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-blue-900">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {log.entityId}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sanction Modal */}
      {selectedProjectForSanction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded max-w-md w-full border border-slate-300 shadow-xl overflow-hidden text-xs">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold">Administrative Sanction Adjudication</span>
              <button
                type="button"
                onClick={() => setSelectedProjectForSanction(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Work Proposal</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedProjectForSanction.title}</div>
                <div className="text-slate-500 text-[11px]">
                  {selectedProjectForSanction.workId} • Recommended by {selectedProjectForSanction.mpName}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Sanctioned Amount (INR)
                </label>
                <input
                  type="number"
                  value={sanctionCost}
                  onChange={(e) => setSanctionCost(e.target.value)}
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Designated Implementing Agency
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Selected Vendor / Contractor
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Adjudication Remarks / Technical Feasibility Order
                </label>
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Record formal sanction notes or justification for approval/rejection..."
                  rows={2}
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded focus:bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSanctionSubmit(false)}
                  disabled={submittingAction}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 rounded border border-rose-200 transition-colors"
                >
                  Reject Proposal
                </button>
                <button
                  type="button"
                  onClick={() => handleSanctionSubmit(true)}
                  disabled={submittingAction}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded transition-colors"
                >
                  {submittingAction ? 'Processing...' : 'Approve Administrative Sanction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Review Modal */}
      {selectedAlertForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded max-w-md w-full border border-slate-300 shadow-xl overflow-hidden text-xs">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold">Adjudicate AI Integrity Alert</span>
              <button
                type="button"
                onClick={() => setSelectedAlertForReview(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Alert Finding</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedAlertForReview.projectTitle}</div>
                <div className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 mt-1">
                  {selectedAlertForReview.reason}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Adjudication Finding
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e: any) => setReviewStatus(e.target.value)}
                  className="w-full py-1.5 px-2 bg-slate-50 border border-slate-300 rounded text-slate-900 font-semibold"
                >
                  <option value="Valid">Valid Flag (Adverse Finding Confirmed)</option>
                  <option value="False Positive">False Positive (Field Norm Normal)</option>
                  <option value="Needs More Info">Needs Additional Physical Inspection</option>
                  <option value="Escalated">Escalate to State Vigilance Officer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Adjudication Notes
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record formal adjudication decision and instructions..."
                  rows={3}
                  className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded focus:bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedAlertForReview(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAlertReviewSubmit}
                  disabled={submittingAction}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded"
                >
                  {submittingAction ? 'Saving...' : 'Record Adjudication'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
