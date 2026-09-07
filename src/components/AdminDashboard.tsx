import React, { useState } from 'react';
import { Project, UserProfile, AnomalyAlert } from '../types';
import { ApiService } from '../services/api';
import {
  CheckCircle,
  XCircle,
  UserCheck,
  AlertTriangle,
  Building,
  ShieldCheck,
  FileCheck,
  Clock,
  Eye,
  Check,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: UserProfile;
  projects: Project[];
  alerts: AnomalyAlert[];
  onSelectProject: (project: Project) => void;
  onNavigate: (view: string) => void;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  projects,
  alerts,
  onSelectProject,
  onNavigate,
  onRefresh,
}) => {
  // Jurisdiction projects (Hyderabad District Authority)
  const districtProjects = projects.filter((p) =>
    currentUser.district ? p.district.toLowerCase() === currentUser.district.toLowerCase() : true
  );

  const pendingRecommendations = districtProjects.filter(
    (p) => p.status === 'Recommended' || p.status === 'Under Review'
  );
  const sanctionedUnassigned = districtProjects.filter(
    (p) => p.status === 'Sanctioned' && !p.implementingAgencyId
  );
  const highRiskAlerts = alerts.filter(
    (a) => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL'
  );

  // Sanction Modal State
  const [activeSanctionProject, setActiveSanctionProject] = useState<Project | null>(null);
  const [sanctionAction, setSanctionAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [sanctionCost, setSanctionCost] = useState<string>('');
  const [sanctionRemarks, setSanctionRemarks] = useState<string>('');
  const [processingSanction, setProcessingSanction] = useState<boolean>(false);

  // Agency Assignment Modal State
  const [activeAssignProject, setActiveAssignProject] = useState<Project | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<string>('IA-HYD-001');
  const [vendorName, setVendorName] = useState<string>('Deccan Infra Tech Ltd');
  const [processingAssign, setProcessingAssign] = useState<boolean>(false);

  const handleSanctionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSanctionProject) return;
    setProcessingSanction(true);

    try {
      await ApiService.sanctionProject(
        activeSanctionProject.id,
        sanctionAction,
        parseFloat(sanctionCost) || activeSanctionProject.estimatedCostLakhs,
        sanctionRemarks
      );
      setActiveSanctionProject(null);
      setSanctionRemarks('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Sanction operation failed.');
    } finally {
      setProcessingSanction(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignProject) return;
    setProcessingAssign(true);

    const agencyNames: Record<string, string> = {
      'IA-HYD-001': 'Telangana State Roads & Development Corp (TSRDC)',
      'IA-HYD-002': 'Hyderabad Metropolitan Water Supply & Sewerage Board (HMWSSB)',
      'IA-HYD-003': 'Greater Hyderabad Municipal Corporation Engineering Dept (GHMC)',
    };

    try {
      await ApiService.assignAgency(
        activeAssignProject.id,
        selectedAgency,
        agencyNames[selectedAgency] || 'Municipal Engineering Division',
        vendorName
      );
      setActiveAssignProject(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Agency assignment failed.');
    } finally {
      setProcessingAssign(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Jurisdiction Header */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded text-[11px] font-bold">
              District Nodal Authority Workspace
            </span>
            <span className="text-xs text-stone-500 font-medium">
              District: {currentUser.district} • State: {currentUser.state}
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            {currentUser.name}
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            {currentUser.designation} • Statutory Approval, Agency Assignment, and Oversight Authority
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('alerts-center')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Anomaly Review ({alerts.length})</span>
          </button>
          <button
            onClick={() => onNavigate('reports-audit')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-stone-600" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* KPI Oversight Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs">
          <div className="text-stone-500 font-medium flex items-center justify-between">
            <span>Pending Recommendations</span>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xl font-bold text-stone-900 font-mono mt-1">
            {pendingRecommendations.length} Works
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Awaiting Sanction / Feasibility</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs">
          <div className="text-stone-500 font-medium flex items-center justify-between">
            <span>Sanctioned • Unassigned</span>
            <UserCheck className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="text-xl font-bold text-indigo-900 font-mono mt-1">
            {sanctionedUnassigned.length} Works
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Requires Implementing Agency</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs">
          <div className="text-stone-500 font-medium flex items-center justify-between">
            <span>High Risk / Critical Alerts</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-bold text-red-700 font-mono mt-1">
            {highRiskAlerts.length} Flagged
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Requires Human Review</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs">
          <div className="text-stone-500 font-medium flex items-center justify-between">
            <span>Total Works in Jurisdiction</span>
            <Building className="w-4 h-4 text-sky-800" />
          </div>
          <div className="text-xl font-bold text-stone-900 font-mono mt-1">
            {districtProjects.length} Works
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Across All Sectors</div>
        </div>
      </div>

      {/* Section 1: Pending Recommendations Awaiting Action */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Pending Recommendations Awaiting Administrative Sanction ({pendingRecommendations.length})
            </h3>
            <p className="text-xs text-stone-500">
              Guidelines 2010 mandate technical scrutiny within 45 days of MP recommendation
            </p>
          </div>
        </div>

        <div className="border border-stone-200 rounded-md overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700 border-collapse">
            <thead className="bg-stone-100 text-stone-800 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-2.5 border-r border-stone-200">Work Code</th>
                <th className="p-2.5 border-r border-stone-200">Asset Title &amp; Location</th>
                <th className="p-2.5 border-r border-stone-200">Sector</th>
                <th className="p-2.5 border-r border-stone-200">Recommended By</th>
                <th className="p-2.5 border-r border-stone-200 text-right">Cost (Lakhs)</th>
                <th className="p-2.5 border-r border-stone-200 text-center">AI Risk</th>
                <th className="p-2.5 text-center">District Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {pendingRecommendations.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-2.5 font-mono text-stone-600 font-semibold border-r border-stone-200">
                    {p.workCode}
                  </td>
                  <td className="p-2.5 border-r border-stone-200 max-w-xs">
                    <div className="font-bold text-stone-900">{p.title}</div>
                    <div className="text-[11px] text-stone-500 truncate">{p.locationName}</div>
                  </td>
                  <td className="p-2.5 border-r border-stone-200">{p.sector}</td>
                  <td className="p-2.5 border-r border-stone-200 font-medium text-stone-800">
                    {p.mpName}
                  </td>
                  <td className="p-2.5 text-right font-mono border-r border-stone-200 font-bold">
                    ₹{p.estimatedCostLakhs.toFixed(2)}L
                  </td>
                  <td className="p-2.5 text-center border-r border-stone-200">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH'
                          ? 'bg-red-100 text-red-800'
                          : p.riskLevel === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {p.riskScore}/100
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        id={`admin-btn-sanction-${p.id}`}
                        onClick={() => {
                          setActiveSanctionProject(p);
                          setSanctionCost(p.estimatedCostLakhs.toString());
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-sky-900 hover:bg-sky-950 rounded shadow-xs transition-colors"
                      >
                        Sanction / Review
                      </button>
                      <button
                        onClick={() => onSelectProject(p)}
                        className="p-1 text-stone-500 hover:text-stone-800"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {pendingRecommendations.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-stone-500">
                    No pending recommendations awaiting sanction in this jurisdiction.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Sanctioned Works Requiring Agency Assignment */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Sanctioned Works Pending Agency Assignment ({sanctionedUnassigned.length})
            </h3>
            <p className="text-xs text-stone-500">
              Select eligible government department / implementing agency as per guidelines
            </p>
          </div>
        </div>

        <div className="border border-stone-200 rounded-md overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700 border-collapse">
            <thead className="bg-stone-100 text-stone-800 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-2.5 border-r border-stone-200">Work Code</th>
                <th className="p-2.5 border-r border-stone-200">Work Title</th>
                <th className="p-2.5 border-r border-stone-200">Sector</th>
                <th className="p-2.5 border-r border-stone-200 text-right">Sanctioned Cost</th>
                <th className="p-2.5 border-r border-stone-200">Sanction Date</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {sanctionedUnassigned.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-2.5 font-mono text-stone-600 font-semibold border-r border-stone-200">
                    {p.workCode}
                  </td>
                  <td className="p-2.5 border-r border-stone-200 font-bold text-stone-900">
                    {p.title}
                  </td>
                  <td className="p-2.5 border-r border-stone-200">{p.sector}</td>
                  <td className="p-2.5 text-right font-mono border-r border-stone-200 font-bold text-indigo-900">
                    ₹{p.sanctionedCostLakhs.toFixed(2)}L
                  </td>
                  <td className="p-2.5 border-r border-stone-200 text-stone-600">
                    {p.sanctionDate || 'Recent'}
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      id={`admin-btn-assign-${p.id}`}
                      onClick={() => setActiveAssignProject(p)}
                      className="px-2.5 py-1 text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors inline-flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Assign Agency
                    </button>
                  </td>
                </tr>
              ))}

              {sanctionedUnassigned.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-stone-500">
                    All sanctioned works have implementing agencies actively assigned.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Administrative Sanction Action */}
      {activeSanctionProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white border border-stone-300 rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-sky-950 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                Administrative Sanction Review • District Authority
              </h3>
              <button
                onClick={() => setActiveSanctionProject(null)}
                className="text-stone-300 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSanctionSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-stone-50 p-3 rounded border border-stone-200 space-y-1">
                <div className="font-bold text-stone-900 text-sm">
                  {activeSanctionProject.title}
                </div>
                <div className="text-stone-600">
                  <strong>Work Code:</strong> {activeSanctionProject.workCode} • <strong>Sector:</strong> {activeSanctionProject.sector}
                </div>
                <div className="text-stone-600">
                  <strong>Recommended by:</strong> {activeSanctionProject.mpName}
                </div>
                <div className="text-stone-600">
                  <strong>AI Risk Indicator:</strong> {activeSanctionProject.riskScore}/100 ({activeSanctionProject.riskLevel})
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Sanction Decision *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSanctionAction('APPROVE')}
                    className={`p-2.5 border rounded flex items-center justify-center gap-2 font-bold transition-colors ${
                      sanctionAction === 'APPROVE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-white border-stone-300 text-stone-700'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Approve Sanction
                  </button>

                  <button
                    type="button"
                    onClick={() => setSanctionAction('REJECT')}
                    className={`p-2.5 border rounded flex items-center justify-center gap-2 font-bold transition-colors ${
                      sanctionAction === 'REJECT'
                        ? 'bg-red-50 border-red-500 text-red-800'
                        : 'bg-white border-stone-300 text-stone-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    Reject Work
                  </button>
                </div>
              </div>

              {sanctionAction === 'APPROVE' && (
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Sanctioned Cost (₹ in Lakhs) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={sanctionCost}
                    onChange={(e) => setSanctionCost(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 font-mono"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Official Administrative Remarks &amp; Technical Sanction Number *
                </label>
                <textarea
                  rows={3}
                  value={sanctionRemarks}
                  onChange={(e) => setSanctionRemarks(e.target.value)}
                  placeholder="e.g. Technically sanctioned as per PWD Schedule of Rates. Feasibility verified by Executive Engineer."
                  className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setActiveSanctionProject(null)}
                  className="px-3.5 py-2 text-stone-700 hover:bg-stone-100 border border-stone-300 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  id="modal-submit-sanction-btn"
                  type="submit"
                  disabled={processingSanction}
                  className="px-4 py-2 bg-sky-900 hover:bg-sky-950 disabled:opacity-50 text-white font-bold rounded shadow-xs"
                >
                  {processingSanction ? 'Submitting...' : 'Confirm Administrative Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Agency Assignment */}
      {activeAssignProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white border border-stone-300 rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-sky-950 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                Assign Implementing Agency • District Authority
              </h3>
              <button
                onClick={() => setActiveAssignProject(null)}
                className="text-stone-300 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="bg-stone-50 p-3 rounded border border-stone-200">
                <div className="font-bold text-stone-900">{activeAssignProject.title}</div>
                <div className="text-stone-600 text-[11px] mt-0.5">
                  Work Code: {activeAssignProject.workCode} • Sanctioned: ₹{activeAssignProject.sanctionedCostLakhs}L
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Select Implementing Agency *
                </label>
                <select
                  value={selectedAgency}
                  onChange={(e) => setSelectedAgency(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded bg-white text-stone-900"
                >
                  <option value="IA-HYD-001">Telangana State Roads &amp; Development Corp (TSRDC)</option>
                  <option value="IA-HYD-002">Hyderabad Metropolitan Water Supply &amp; Sewerage Board (HMWSSB)</option>
                  <option value="IA-HYD-003">Greater Hyderabad Municipal Corporation Engineering Dept (GHMC)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Contractor / Vendor Firm Name (Optional)
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Deccan Infra Tech Ltd"
                  className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setActiveAssignProject(null)}
                  className="px-3.5 py-2 text-stone-700 hover:bg-stone-100 border border-stone-300 rounded"
                >
                  Cancel
                </button>
                <button
                  id="modal-submit-assign-btn"
                  type="submit"
                  disabled={processingAssign}
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 disabled:opacity-50 text-white font-bold rounded shadow-xs"
                >
                  {processingAssign ? 'Assigning...' : 'Assign Implementing Agency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
