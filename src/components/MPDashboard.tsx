import React, { useState } from 'react';
import { Project, UserProfile } from '../types';
import { ApiService } from '../services/api';
import {
  PlusCircle,
  AlertTriangle,
  Building,
  Coins,
  FileCheck,
  CheckCircle,
  HelpCircle,
  Clock,
  Send,
  Eye,
} from 'lucide-react';

interface MPDashboardProps {
  currentUser: UserProfile;
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onRefresh: () => void;
}

export const MPDashboard: React.FC<MPDashboardProps> = ({
  currentUser,
  projects,
  onSelectProject,
  onRefresh,
}) => {
  const [showRecommendModal, setShowRecommendModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [sector, setSector] = useState<string>('Roads, Pathways & Bridges');
  const [estimatedCostLakhs, setEstimatedCostLakhs] = useState<string>('35.0');
  const [locationName, setLocationName] = useState<string>('Chandrayangutta Ward, Hyderabad');
  const [financialYear, setFinancialYear] = useState<string>('2024-25');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // My constituency projects
  const myProjects = projects.filter((p) => p.mpId === currentUser.userId);

  // Financial calculations
  const entitlementLakhs = 500.0; // Standard 5 Crore annual normative allocation
  const totalRecommended = myProjects.reduce((acc, p) => acc + p.estimatedCostLakhs, 0);
  const totalSanctioned = myProjects.reduce((acc, p) => acc + p.sanctionedCostLakhs, 0);
  const totalExpenditure = myProjects.reduce((acc, p) => acc + p.expenditureLakhs, 0);
  const availableBalance = Math.max(0, entitlementLakhs - totalSanctioned);

  const handleRecommendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      await ApiService.recommendWork({
        title: title.trim(),
        description: description.trim(),
        sector,
        estimatedCostLakhs: parseFloat(estimatedCostLakhs),
        locationName: locationName.trim(),
        financialYear,
      });

      setShowRecommendModal(false);
      setTitle('');
      setDescription('');
      onRefresh();
    } catch (err: any) {
      setModalError(err.message || 'Failed to submit recommendation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Constituency Banner */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-sky-100 text-sky-900 rounded text-[11px] font-bold">
              MP Workspace • 18th Lok Sabha
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Constituency: {currentUser.constituency}, {currentUser.state}
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            {currentUser.name}
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Member of Parliament (Lok Sabha) • Dedicated Work Recommendation &amp; Constituency Asset Tracker
          </p>
        </div>

        <button
          id="mp-btn-recommend-work"
          onClick={() => setShowRecommendModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-sky-900 hover:bg-sky-950 rounded shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Recommend New Work
        </button>
      </div>

      {/* Entitlement & Financial Health Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs">
          <div className="text-stone-500 font-medium flex items-center justify-between">
            <span>Annual Entitlement Limit</span>
            <Building className="w-4 h-4 text-sky-800" />
          </div>
          <div className="text-xl font-bold text-stone-900 font-mono mt-1">
            ₹{entitlementLakhs.toFixed(2)} Lakhs
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">FY 2024-25 Ceiling</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs">
          <div className="text-stone-500 font-medium flex items-center justify-between">
            <span>Works Recommended</span>
            <Coins className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xl font-bold text-stone-900 font-mono mt-1">
            ₹{totalRecommended.toFixed(2)} Lakhs
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">{myProjects.length} Works Proposed</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs">
          <div className="text-stone-500 font-medium flex items-center justify-between">
            <span>Sanctioned Allocation</span>
            <FileCheck className="w-4 h-4 text-indigo-700" />
          </div>
          <div className="text-xl font-bold text-stone-900 font-mono mt-1">
            ₹{totalSanctioned.toFixed(2)} Lakhs
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Approved by District Authority</div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs">
          <div className="text-stone-500 font-medium flex items-center justify-between">
            <span>Available Balance Limit</span>
            <Coins className="w-4 h-4 text-emerald-800" />
          </div>
          <div className="text-xl font-bold text-emerald-800 font-mono mt-1">
            ₹{availableBalance.toFixed(2)} Lakhs
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Ready for new works</div>
        </div>
      </div>

      {/* My Constituency Works Table */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Constituency Developmental Works ({myProjects.length})
            </h3>
            <p className="text-xs text-stone-500">
              Status, progress velocity, and integrity evaluations for {currentUser.constituency}
            </p>
          </div>
        </div>

        <div className="border border-stone-200 rounded-md overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700 border-collapse">
            <thead className="bg-stone-100 text-stone-800 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-2.5 border-r border-stone-200">Work Code</th>
                <th className="p-2.5 border-r border-stone-200">Work Description / Title</th>
                <th className="p-2.5 border-r border-stone-200">Sector</th>
                <th className="p-2.5 border-r border-stone-200 text-right">Estimated</th>
                <th className="p-2.5 border-r border-stone-200 text-right">Sanctioned</th>
                <th className="p-2.5 border-r border-stone-200 text-center">Status</th>
                <th className="p-2.5 border-r border-stone-200 text-center">Progress</th>
                <th className="p-2.5 border-r border-stone-200 text-center">AI Risk</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {myProjects.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-2.5 font-mono text-stone-600 font-semibold border-r border-stone-200">
                    {p.workCode}
                  </td>
                  <td className="p-2.5 border-r border-stone-200 max-w-xs">
                    <div className="font-bold text-stone-900">{p.title}</div>
                    <div className="text-[11px] text-stone-500 truncate">{p.locationName}</div>
                  </td>
                  <td className="p-2.5 border-r border-stone-200">{p.sector}</td>
                  <td className="p-2.5 text-right font-mono border-r border-stone-200">
                    ₹{p.estimatedCostLakhs.toFixed(2)}L
                  </td>
                  <td className="p-2.5 text-right font-mono border-r border-stone-200 font-medium">
                    {p.sanctionedCostLakhs > 0 ? `₹${p.sanctionedCostLakhs.toFixed(2)}L` : '—'}
                  </td>
                  <td className="p-2.5 text-center border-r border-stone-200">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'Ongoing'
                          ? 'bg-blue-100 text-blue-800'
                          : p.status === 'Delayed'
                          ? 'bg-orange-100 text-orange-800'
                          : p.status === 'Sanctioned'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-center border-r border-stone-200">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-12 bg-stone-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-900 h-full rounded-full"
                          style={{ width: `${p.progressPercentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px]">{p.progressPercentage}%</span>
                    </div>
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
                    <button
                      id={`mp-btn-view-details-${p.id}`}
                      onClick={() => onSelectProject(p)}
                      className="px-2.5 py-1 text-xs font-semibold text-sky-900 hover:bg-sky-50 border border-sky-200 rounded transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {myProjects.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-stone-500">
                    No works recommended for this constituency yet. Click "Recommend New Work" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Recommend New Work with Instant AI Check */}
      {showRecommendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white border border-stone-300 rounded-lg shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-sky-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">
                  Recommend New MPLADS Development Work
                </h3>
              </div>
              <button
                onClick={() => setShowRecommendModal(false)}
                className="text-stone-300 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRecommendSubmit} className="p-5 space-y-3.5 text-xs">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Title of Developmental Asset *
                </label>
                <input
                  id="rec-input-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Construction of Community Hall & Skill Center"
                  className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Eligible Sector (Guidelines 2010) *
                  </label>
                  <select
                    id="rec-select-sector"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 bg-white"
                  >
                    <option value="Roads, Pathways & Bridges">Roads, Pathways &amp; Bridges</option>
                    <option value="Drinking Water Facility">Drinking Water Facility</option>
                    <option value="Sanitation & Public Health">Sanitation &amp; Public Health</option>
                    <option value="Education & School Infrastructure">Education &amp; School Infrastructure</option>
                    <option value="Community Infrastructure">Community Infrastructure</option>
                    <option value="Irrigation & Flood Control">Irrigation &amp; Flood Control</option>
                    <option value="Electricity & Non-Conventional Energy">Electricity &amp; Non-Conventional Energy</option>
                    <option value="Sports & Youth Development">Sports &amp; Youth Development</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Estimated Cost (₹ in Lakhs) *
                  </label>
                  <input
                    id="rec-input-cost"
                    type="number"
                    step="0.1"
                    min="1"
                    max="500"
                    value={estimatedCostLakhs}
                    onChange={(e) => setEstimatedCostLakhs(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Location Name &amp; Landmark *
                </label>
                <input
                  id="rec-input-location"
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Near Govt High School, Old City, Hyderabad"
                  className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Detailed Justification &amp; Community Beneficiaries
                </label>
                <textarea
                  id="rec-input-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain how this durable community asset benefits the local population in accordance with MPLADS guidelines..."
                  className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-800"
                />
              </div>

              {/* Automatic AI Preliminary Baseline Preview */}
              <div className="p-3 bg-stone-100 border border-stone-200 rounded text-[11px] space-y-1">
                <div className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-800" />
                  Automated Integrity Engine Verification on Submission:
                </div>
                <div className="text-stone-600">
                  • <strong>Cost Anomaly Check:</strong> Compares proposed ₹{estimatedCostLakhs}L against statistical baseline for {sector} in {currentUser.state}.
                </div>
                <div className="text-stone-600">
                  • <strong>Duplicate Search:</strong> Scans existing sanctioned works in {currentUser.district} to prevent redundant works.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowRecommendModal(false)}
                  className="px-3.5 py-2 text-stone-700 hover:bg-stone-100 border border-stone-300 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  id="rec-submit-btn"
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-900 hover:bg-sky-950 disabled:opacity-50 text-white font-bold rounded shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Submitting & Verifying...' : 'Submit Recommendation to District Authority'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
