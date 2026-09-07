import React, { useState, useEffect } from 'react';
import { User, Project, Alert, AuditLogEntry, VendorAnalytics } from '../types/index.ts';
import {
  updateProjectStatus,
  reviewAlert,
  fetchAuditLogs,
  fetchVendorAnalytics
} from '../services/api.ts';
import { VendorAnalyticsView } from './VendorAnalyticsView.tsx';
import {
  ShieldAlert,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Building,
  UserCheck,
  History,
  TrendingUp,
  Download,
  AlertTriangle,
  ChevronRight,
  Filter,
  Check,
  MessageSquare,
  Briefcase
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
        const [logsData, vendorData] = await Promise.all([
          fetchAuditLogs(),
          fetchVendorAnalytics()
        ]);
        setAuditLogs(logsData);
        setVendors(vendorData);
      } catch (err) {
        console.error('Failed to load admin supplemental data:', err);
      }
    };
    loadSubData();
  }, [activeTab]);

  const pendingProjects = projects.filter((p) => p.status === 'Recommended' || p.status === 'Under Review');
  const openAlerts = alerts.filter((a) => a.status === 'Open' || a.status === 'Investigating');

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

  const formatLakhs = (val: number) => `₹${(val / 100000).toFixed(2)} L`;

  return (
    <div className="space-y-6">
      {/* Official District Authority Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-5 rounded-lg shadow-xs border-b-4 border-blue-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-blue-600 text-white font-extrabold px-2 py-0.5 rounded uppercase">
                District Authority
              </span>
              <span className="text-xs text-blue-200">
                District Magistrate & Collector • {user.district}, {user.state}
              </span>
            </div>
            <h2 className="text-xl font-extrabold">{user.name}</h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Statutory Administrative Sanctions, Implementing Agency Oversight & Integrity Adjudication
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <div className="bg-white/10 px-3 py-1.5 rounded border border-white/20">
              <span className="text-amber-300 font-bold">{pendingProjects.length}</span> Pending Sanctions
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded border border-white/20">
              <span className="text-rose-300 font-bold">{openAlerts.length}</span> Active AI Alerts
            </div>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-xs font-medium flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-3.5 py-2 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
            activeTab === 'approvals'
              ? 'bg-blue-900 text-white'
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Work Sanction Pipeline ({pendingProjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-3.5 py-2 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
            activeTab === 'alerts'
              ? 'bg-rose-900 text-white'
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>AI Alerts & Adjudication ({alerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vendors')}
          className={`px-3.5 py-2 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
            activeTab === 'vendors'
              ? 'bg-blue-900 text-white'
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Vendor & Agency Risk Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-2 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
            activeTab === 'audit'
              ? 'bg-slate-900 text-white'
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Append-Only Audit Log</span>
        </button>
      </div>

      {/* TAB 1: WORK APPROVAL & SANCTION PIPELINE */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">
                MP Proposals Pending Administrative Sanction
              </h3>
              <p className="text-xs text-gray-600">
                District Magistrate verification under MPLADS Guidelines Rule 2.11
              </p>
            </div>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-full">
              {pendingProjects.length} Pending
            </span>
          </div>

          {pendingProjects.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-xs">
              All recommended works have been processed. No proposals pending sanction.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingProjects.map((proj) => (
                <div key={proj.id} className="p-4 hover:bg-blue-50/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {proj.workId}
                      </span>
                      <span className="text-[10px] font-bold text-gray-600">
                        Recommended by {proj.mpName} ({proj.constituency})
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {proj.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-gray-900">{proj.title}</h4>
                    <p className="text-xs text-gray-600">{proj.description}</p>
                    <div className="text-[11px] text-gray-500">
                      Location: <span className="font-semibold text-gray-700">{proj.locationAddress}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs pt-1">
                      <div>
                        Estimated: <span className="font-bold text-blue-950">{formatLakhs(proj.estimatedCost)}</span>
                      </div>
                      <div>
                        AI Cost Check:{' '}
                        <span className={proj.costAnomaly?.isAnomaly ? 'text-rose-700 font-bold' : 'text-emerald-700 font-semibold'}>
                          {proj.costAnomaly?.isAnomaly ? `Outlier (z=${proj.costAnomaly.zScore})` : 'Normal Baseline'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => onSelectProject(proj)}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded border border-gray-300 transition-colors"
                    >
                      Inspect File
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProjectForSanction(proj);
                        setSanctionCost(String(proj.estimatedCost));
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded shadow-2xs transition-colors flex items-center gap-1"
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

      {/* TAB 2: AI INTEGRITY ALERTS & ADJUDICATION */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">
                AI Anomaly Alerts Vigilance Queue
              </h3>
              <p className="text-xs text-gray-600">
                Rule 6.4: Human review required for all statistical cost and geo-inspection flags
              </p>
            </div>
            <span className="text-xs bg-rose-100 text-rose-900 font-bold px-2.5 py-1 rounded-full">
              {alerts.length} Total Alerts
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {alerts.map((alt) => (
              <div key={alt.id} className="p-4 hover:bg-rose-50/20 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {alt.workId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        alt.riskLevel === 'Critical'
                          ? 'bg-red-600 text-white'
                          : alt.riskLevel === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {alt.type} ({alt.riskLevel})
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        alt.status === 'Open'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : alt.status === 'Valid'
                          ? 'bg-red-100 text-red-900'
                          : alt.status === 'False Positive'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      Status: {alt.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold text-gray-900">{alt.projectTitle}</h4>
                  <div className="text-xs text-rose-950 font-medium bg-rose-50 p-2 rounded border border-rose-100">
                    <span className="font-bold">Automated Observation: </span>
                    {alt.reason}
                  </div>

                  {alt.evidence && (
                    <div className="text-[11px] text-gray-600 font-mono bg-gray-50 p-2 rounded border border-gray-200">
                      {alt.evidence}
                    </div>
                  )}

                  {alt.reviewNotes && (
                    <div className="text-[11px] text-gray-700 bg-amber-50/60 p-2 rounded border border-amber-200">
                      <span className="font-bold">Official Adjudication Note: </span>
                      {alt.reviewNotes} (Reviewed by {alt.reviewedBy || 'District Magistrate'} on{' '}
                      {new Date(alt.reviewedAt || Date.now()).toLocaleDateString()})
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const proj = projects.find((p) => p.id === alt.projectId);
                      if (proj) onSelectProject(proj);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded border border-gray-300 transition-colors"
                  >
                    View Work
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAlertForReview(alt);
                      setReviewNotes(alt.reviewNotes || '');
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <span>Adjudicate / Review</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VENDOR & AGENCY RISK ANALYTICS */}
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
              setFeedbackMsg(`Selected contractor: ${vName}. No works are currently awaiting administrative sanction.`);
            }
          }}
          onRefreshData={async () => {
            try {
              const data = await fetchVendorAnalytics();
              setVendors(data);
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}

      {/* TAB 4: AUDIT LOG VIEWER */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">
                Cryptographic / Append-Only Governance Audit Trail
              </h3>
              <p className="text-xs text-gray-600">
                Tamper-evident chronological record of all administrative sanctions, MB entries, and AI alert reviews
              </p>
            </div>
            <span className="text-xs bg-slate-200 text-slate-800 font-mono font-bold px-2 py-1 rounded">
              {auditLogs.length} Records
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs text-gray-700 border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Work ID</th>
                  <th className="py-2 px-3">Official Action</th>
                  <th className="py-2 px-3">Actor & Role</th>
                  <th className="py-2 px-3">Field Modified</th>
                  <th className="py-2 px-3">Previous State</th>
                  <th className="py-2 px-3">New State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 font-bold text-blue-900 whitespace-nowrap">{log.workId}</td>
                    <td className="py-2 px-3 font-semibold text-gray-900">{log.action}</td>
                    <td className="py-2 px-3 text-gray-700 whitespace-nowrap">
                      {log.actorName} ({log.actorRole})
                    </td>
                    <td className="py-2 px-3 text-indigo-900">{log.fieldChanged}</td>
                    <td className="py-2 px-3 text-gray-500 truncate max-w-[150px]">{log.previousValue}</td>
                    <td className="py-2 px-3 text-emerald-800 font-bold truncate max-w-[200px]">
                      {log.newValue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADMINISTRATIVE SANCTION & AGENCY ASSIGNMENT */}
      {selectedProjectForSanction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-gray-300 overflow-hidden">
            <div className="bg-blue-950 text-white p-4 flex items-center justify-between border-b-2 border-amber-500">
              <h3 className="text-sm font-bold">Issue Administrative Sanction (Rule 2.11)</h3>
              <button onClick={() => setSelectedProjectForSanction(null)} className="text-gray-300 hover:text-white">✕</button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="bg-blue-50 p-2.5 rounded border border-blue-200 text-xs">
                <div className="font-bold text-blue-950">{selectedProjectForSanction.workId}</div>
                <div className="text-gray-700 font-medium">{selectedProjectForSanction.title}</div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Estimated by MP: {formatLakhs(selectedProjectForSanction.estimatedCost)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Sanctioned Cost (INR ₹) *
                </label>
                <input
                  type="number"
                  value={sanctionCost}
                  onChange={(e) => setSanctionCost(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Designate Implementing Agency *
                </label>
                <select
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md font-medium text-gray-900"
                >
                  <option value="PWD Rural Works Division">PWD Rural Works Division</option>
                  <option value="Panchayati Raj Engineering Department">Panchayati Raj Engineering Department</option>
                  <option value="Municipal Corporation Engineering Wing">Municipal Corporation Engineering Wing</option>
                  <option value="Rural Water Supply & Sanitation (RWSS)">Rural Water Supply & Sanitation (RWSS)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase">
                    Assigned Contractor / Vendor
                  </label>
                  <span className="text-[10px] text-gray-500">Select registered or type name</span>
                </div>
                <input
                  type="text"
                  list="registered-contractors-list"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Sri Balaji Civil Infra Ltd."
                  className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-medium"
                />
                <datalist id="registered-contractors-list">
                  {vendors.map((v) => (
                    <option key={v.vendorName} value={v.vendorName}>
                      {v.agencyName} (Avg Delay: {v.avgCompletionDelayDays}d, Risk: {v.riskLevel})
                    </option>
                  ))}
                </datalist>

                {/* Pre-Assignment Performance & Risk Track Record Card */}
                {(() => {
                  const matched = vendors.find(
                    (v) => v.vendorName.toLowerCase().trim() === vendorName.toLowerCase().trim()
                  );
                  if (!matched) return null;

                  const isHighRisk =
                    matched.suitabilityStatus === 'High Risk / Review Required' ||
                    matched.riskLevel === 'Critical' ||
                    matched.avgCompletionDelayDays > 25;

                  return (
                    <div
                      className={`mt-2 p-2.5 rounded-md border text-xs space-y-1.5 ${
                        isHighRisk
                          ? 'bg-rose-50 border-rose-300 text-rose-950'
                          : matched.suitabilityStatus === 'Proceed with Caution'
                          ? 'bg-amber-50 border-amber-300 text-amber-950'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>Contractor Performance Track Record (Rule 2.11)</span>
                        </span>
                        <span
                          className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded border ${
                            isHighRisk
                              ? 'bg-rose-200 text-rose-900 border-rose-300'
                              : matched.suitabilityStatus === 'Proceed with Caution'
                              ? 'bg-amber-200 text-amber-900 border-amber-300'
                              : 'bg-emerald-200 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          {matched.suitabilityStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-[11px] pt-1 border-t border-gray-200/50">
                        <div>
                          <span className="text-gray-500 block text-[10px]">Total Works</span>
                          <span className="font-extrabold text-gray-900">
                            {matched.totalProjects} ({matched.activeProjects} active)
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-[10px]">Avg Delay</span>
                          <span
                            className={`font-black ${
                              matched.avgCompletionDelayDays > 25
                                ? 'text-rose-700'
                                : matched.avgCompletionDelayDays > 10
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {matched.avgCompletionDelayDays} Days
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-[10px]">AI Risk History</span>
                          <span className="font-extrabold text-gray-900">
                            {matched.aiRiskHistory.length} Flagged
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-gray-700 leading-tight">
                        <span className="font-bold">Advisory: </span>
                        {matched.suitabilityReason}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  District Magistrate Sanction Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Record verification of title deed, technical feasibility, and schedule..."
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleSanctionSubmit(false)}
                  className="px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded border border-rose-300"
                >
                  Reject Proposal
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleSanctionSubmit(true)}
                  className="px-4 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded shadow-xs"
                >
                  {submittingAction ? 'Recording...' : 'Grant Administrative Sanction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AI ALERT ADJUDICATION */}
      {selectedAlertForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-gray-300 overflow-hidden">
            <div className="bg-blue-950 text-white p-4 flex items-center justify-between border-b-2 border-rose-500">
              <h3 className="text-sm font-bold">Adjudicate AI Integrity Alert</h3>
              <button onClick={() => setSelectedAlertForReview(null)} className="text-gray-300 hover:text-white">✕</button>
            </div>

            <div className="p-5 space-y-3.5">
              <div className="bg-rose-50 p-3 rounded border border-rose-200 text-xs">
                <div className="font-bold text-rose-950">{selectedAlertForReview.workId} - {selectedAlertForReview.type}</div>
                <div className="text-gray-700 mt-1">{selectedAlertForReview.reason}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Adjudication Finding *
                </label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as any)}
                  className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md font-bold text-gray-900"
                >
                  <option value="Valid">Valid Discrepancy (Confirm Anomaly & Issue Notice)</option>
                  <option value="False Positive">False Positive (Explain Field Justification)</option>
                  <option value="Needs More Info">Request Physical Inspection from SDM</option>
                  <option value="Escalated">Escalate to Ministry (MoSPI)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Official Review Finding & Remarks *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record physical inspection findings, surveyor reports, or administrative explanation..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlertForReview(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingAction || !reviewNotes}
                  onClick={handleAlertReviewSubmit}
                  className="px-4 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded shadow-xs disabled:opacity-50"
                >
                  {submittingAction ? 'Recording...' : 'Record Adjudication & Update Audit Trail'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
