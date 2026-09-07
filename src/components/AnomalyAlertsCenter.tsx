import React, { useState } from 'react';
import { AnomalyAlert, UserProfile } from '../types';
import { ApiService } from '../services/api';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowUpRight,
  Filter,
  Info,
  Clock,
  UserCheck,
  Building,
} from 'lucide-react';

interface AnomalyAlertsCenterProps {
  alerts: AnomalyAlert[];
  currentUser: UserProfile;
  onRefresh: () => void;
  onSelectProjectById?: (projectId: string) => void;
}

export const AnomalyAlertsCenter: React.FC<AnomalyAlertsCenterProps> = ({
  alerts,
  currentUser,
  onRefresh,
  onSelectProjectById,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';

  // Filters
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  // Review modal state
  const [activeAlert, setActiveAlert] = useState<AnomalyAlert | null>(null);
  const [newStatus, setNewStatus] = useState<string>('Valid');
  const [reviewRemarks, setReviewRemarks] = useState<string>('');
  const [assignedOfficer, setAssignedOfficer] = useState<string>('Executive Engineer (Nodal)');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const filteredAlerts = alerts.filter((a) => {
    if (filterType !== 'ALL' && a.type !== filterType) return false;
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    if (filterRisk !== 'ALL' && a.riskLevel !== filterRisk) return false;
    return true;
  });

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAlert) return;
    setSubmittingReview(true);

    try {
      await ApiService.reviewAlert(
        activeAlert.id,
        newStatus,
        reviewRemarks,
        assignedOfficer
      );
      setActiveAlert(null);
      setReviewRemarks('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Review action failed.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Decision Support Policy Banner - Geometric Balance */}
      <div className="bg-white border-l-4 border-red-600 border-y border-r border-gray-200 rounded p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-red-50 text-red-700 rounded shrink-0 border border-red-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-red-700 px-2 py-0.5 rounded">
                MoSPI Alert Center
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A2540] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                AI Decision Support
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-bold uppercase tracking-wide text-[#0A2540] mt-1">
              AI Anomaly &amp; Integrity Review Center
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Automated anomaly screening based on statistical cost deviations (Z-score &gt; 2.5σ), GIS photo geotags, and timeline heuristics.
            </p>
            <div className="mt-2 text-xs font-semibold text-orange-900 bg-orange-50 p-2 rounded border border-orange-200 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#F27D26] shrink-0" />
              <span>
                <strong>Mandatory Statutory Guideline:</strong> AI outputs are indicators for human review. Administrative determinations require physical site inspection and District Nodal Authority sign-off.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 mr-1" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-1.5 bg-white border border-gray-300 rounded text-gray-700 font-semibold"
          >
            <option value="ALL">All Anomaly Types</option>
            <option value="Cost Anomaly">Cost Anomaly</option>
            <option value="Location Mismatch">Location Mismatch (GPS)</option>
            <option value="Delay Risk">Delay Risk</option>
            <option value="Possible Duplicate">Possible Duplicate</option>
            <option value="Photo Anomaly">Photo Anomaly</option>
            <option value="High Risk">High Risk</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-1.5 bg-white border border-gray-300 rounded text-gray-700 font-semibold"
          >
            <option value="ALL">All Review Statuses</option>
            <option value="Under Review">Under Review</option>
            <option value="Valid">Valid (Confirmed)</option>
            <option value="False Positive">False Positive</option>
            <option value="Needs More Info">Needs More Info</option>
            <option value="Escalated">Escalated</option>
          </select>

          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="p-1.5 bg-white border border-gray-300 rounded text-gray-700 font-semibold"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>
        </div>

        <div className="text-gray-600 font-bold text-[11px] uppercase tracking-wider">
          Showing <strong>{filteredAlerts.length}</strong> active alerts
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3.5">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`bg-white border-y border-r border-gray-200 rounded-r p-4 shadow-sm transition-colors ${
              alert.riskLevel === 'CRITICAL' || alert.riskLevel === 'HIGH'
                ? 'border-l-4 border-l-red-600'
                : alert.riskLevel === 'MEDIUM'
                ? 'border-l-4 border-l-[#F27D26]'
                : 'border-l-4 border-l-green-600'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    alert.riskLevel === 'CRITICAL' || alert.riskLevel === 'HIGH'
                      ? 'bg-red-100 text-red-800'
                      : alert.riskLevel === 'MEDIUM'
                      ? 'bg-orange-100 text-[#F27D26]'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {alert.riskLevel} RISK
                </span>
                <span className="font-bold text-[#0A2540] text-xs sm:text-sm uppercase tracking-wide">
                  {alert.type}
                </span>
                <span className="text-[11px] text-gray-500 font-mono">
                  [{alert.workCode}]
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    alert.status === 'Valid'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : alert.status === 'False Positive'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : alert.status === 'Escalated'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  Status: {alert.status}
                </span>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setActiveAlert(alert);
                      setNewStatus(alert.status);
                    }}
                    className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-white bg-[#0A2540] hover:bg-[#081d33] rounded transition-colors shadow-xs cursor-pointer"
                  >
                    Take Administrative Action
                  </button>
                )}
              </div>
            </div>

            <div className="text-xs text-[#0A2540] font-bold mb-1">
              Project: {alert.projectTitle}
            </div>

            <div className="text-xs text-gray-600 mb-2">
              <strong className="text-gray-800">Ground Anomaly Detail:</strong> {alert.reason}
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <span>District: <strong>{alert.district}, {alert.state}</strong></span>
                <span>MP: <strong>{alert.mpName}</strong></span>
                {alert.assignedOfficer && (
                  <span>Officer Assigned: <strong>{alert.assignedOfficer}</strong></span>
                )}
              </div>
              <div>Detected on: {new Date(alert.createdAt).toLocaleDateString()}</div>
            </div>

            {/* Review History Logs */}
            {alert.reviewHistory && alert.reviewHistory.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-100 text-[11px] space-y-1">
                <div className="font-bold text-[#0A2540] uppercase tracking-wider text-[10px]">Official Review Trail:</div>
                {alert.reviewHistory.map((rh) => (
                  <div key={rh.id} className="bg-gray-50 p-2 rounded border border-gray-200/60 text-gray-600">
                    <span className="font-semibold text-[#0A2540]">{rh.reviewedBy} ({rh.role})</span> changed status to{' '}
                    <strong className="text-gray-900">{rh.newStatus}</strong> on{' '}
                    {new Date(rh.timestamp).toLocaleString()}
                    <div className="italic text-gray-700 mt-0.5">"{rh.remarks}"</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="bg-white border border-gray-200 rounded p-8 text-center text-gray-500 text-xs shadow-sm">
            No active alerts matching the selected filters.
          </div>
        )}
      </div>

      {/* Review Modal - Geometric Balance Style */}
      {activeAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-gray-300 rounded shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#0A2540] text-white flex items-center justify-between border-b-2 border-[#F27D26]">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                Administrative Anomaly Review • District Authority
              </h3>
              <button
                onClick={() => setActiveAlert(null)}
                className="text-gray-300 hover:text-white text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-1">
                <div className="font-bold text-[#0A2540]">{activeAlert.type}</div>
                <div className="text-gray-800">{activeAlert.projectTitle}</div>
                <div className="text-gray-500 text-[11px]">{activeAlert.reason}</div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[10px] text-gray-700 mb-1">
                  Review Determination *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 font-bold"
                >
                  <option value="Valid">Valid (Confirmed Anomaly - Requires Corrective Notice)</option>
                  <option value="False Positive">False Positive (Explained by Local Site Conditions)</option>
                  <option value="Needs More Info">Needs More Info (Order Physical Field Inspection)</option>
                  <option value="Escalated">Escalated (Referred to MoSPI / State Vigilance)</option>
                  <option value="Under Review">Keep Under Review</option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[10px] text-gray-700 mb-1">
                  Assigned Inquiry Officer
                </label>
                <input
                  type="text"
                  value={assignedOfficer}
                  onChange={(e) => setAssignedOfficer(e.target.value)}
                  placeholder="e.g. Executive Engineer, PWD"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[10px] text-gray-700 mb-1">
                  Mandatory Review Remarks &amp; Grounds *
                </label>
                <textarea
                  rows={3}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Document specific grounds for determination to maintain compliance audit trail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveAlert(null)}
                  className="px-3.5 py-2 text-gray-700 hover:bg-gray-100 border border-gray-300 rounded font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 bg-[#0A2540] hover:bg-[#081d33] disabled:opacity-50 text-white font-bold uppercase tracking-wider rounded shadow-xs cursor-pointer"
                >
                  {submittingReview ? 'Recording...' : 'Log Official Determination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
