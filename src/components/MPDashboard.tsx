import React, { useState } from 'react';
import { User, Project, Alert } from '../types/index.ts';
import { recommendNewWork } from '../services/api.ts';
import {
  Building2,
  PlusCircle,
  IndianRupee,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Eye,
  Check,
  ShieldAlert
} from 'lucide-react';

interface MpDashboardProps {
  user: User;
  projects: Project[];
  alerts: Alert[];
  onSelectProject: (p: Project) => void;
  onRefreshData: () => void;
}

export const MpDashboard: React.FC<MpDashboardProps> = ({
  user,
  projects,
  alerts,
  onSelectProject,
  onRefreshData
}) => {
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Drinking Water');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState('18.5724');
  const [longitude, setLongitude] = useState('79.1312');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Financial calculations
  const totalEntitlement = 50000000; // ₹ 5.00 Crore annual baseline limit
  const recommendedAmount = projects.reduce((acc, p) => acc + p.estimatedCost, 0);
  const sanctionedAmount = projects.reduce((acc, p) => acc + p.sanctionedCost, 0);
  const utilizedAmount = projects.reduce((acc, p) => acc + p.utilizedCost, 0);
  const uncommittedBalance = Math.max(0, totalEntitlement - sanctionedAmount);

  const formatLakhs = (amt: number) => `₹${(amt / 100000).toFixed(2)} Lakhs`;
  const formatCrores = (amt: number) => `₹${(amt / 10000000).toFixed(2)} Cr`;

  const handleRecommendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !estimatedCost || !locationAddress) {
      setErrorMsg('Please fill in all mandatory fields.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await recommendNewWork({
        title,
        description,
        category,
        estimatedCost: Number(estimatedCost),
        locationAddress,
        latitude: Number(latitude) || 18.5724,
        longitude: Number(longitude) || 79.1312
      });

      setSuccessMsg('Work proposal submitted to District Authority for administrative sanction.');
      setTitle('');
      setDescription('');
      setEstimatedCost('');
      setLocationAddress('');
      setShowRecommendModal(false);
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Official MP Banner */}
      <div className="bg-gradient-to-r from-blue-950 to-indigo-900 text-white p-5 rounded-lg shadow-xs border-b-4 border-amber-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-amber-500 text-slate-950 font-extrabold px-2 py-0.5 rounded uppercase">
                Member of Parliament
              </span>
              <span className="text-xs text-blue-200">
                {user.house || 'Lok Sabha'} • {user.constituency} ({user.state})
              </span>
            </div>
            <h2 className="text-xl font-extrabold">{user.name}</h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Constituency Development Management & Fund Utilization Console
            </p>
          </div>

          <button
            onClick={() => setShowRecommendModal(true)}
            className="self-start md:self-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Recommend New Work</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* MP Financial Entitlement Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase">Annual Entitlement</div>
          <div className="text-lg font-extrabold text-blue-950 mt-1">{formatCrores(totalEntitlement)}</div>
          <div className="text-[10px] text-gray-500">Fixed MoSPI limit</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase">Recommended Value</div>
          <div className="text-lg font-extrabold text-blue-900 mt-1">{formatLakhs(recommendedAmount)}</div>
          <div className="text-[10px] text-blue-700">{projects.length} Works proposed</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase">Sanctioned Value</div>
          <div className="text-lg font-extrabold text-indigo-900 mt-1">{formatLakhs(sanctionedAmount)}</div>
          <div className="text-[10px] text-indigo-700">Administratively committed</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase">Expenditure Disbursed</div>
          <div className="text-lg font-extrabold text-emerald-800 mt-1">{formatLakhs(utilizedAmount)}</div>
          <div className="text-[10px] text-emerald-700">Against physical milestones</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-bold text-gray-500 uppercase">Uncommitted Balance</div>
          <div className="text-lg font-extrabold text-amber-900 mt-1">{formatLakhs(uncommittedBalance)}</div>
          <div className="text-[10px] text-amber-700">Available for new works</div>
        </div>
      </div>

      {/* Constituency AI Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-amber-800" />
            <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
              Constituency Decision Support Alerts ({alerts.length})
            </h3>
          </div>
          <p className="text-xs text-amber-900 mb-3">
            The automated integrity system flagged these works for administrative verification. Per guidelines,
            these require field verification by the District Authority.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {alerts.slice(0, 4).map((alt) => (
              <div
                key={alt.id}
                className="bg-white p-3 rounded border border-amber-200 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="font-bold text-blue-900">{alt.workId}</span>
                  <span className="font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 uppercase">
                    {alt.type}
                  </span>
                </div>
                <div className="text-xs font-bold text-gray-900 line-clamp-1 mb-1">{alt.projectTitle}</div>
                <div className="text-xs text-gray-600 line-clamp-2">{alt.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Constituency Works Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900">
              Works Recommended in {user.constituency}
            </h3>
            <p className="text-xs text-gray-600">
              Live physical and financial monitoring of parliamentary works
            </p>
          </div>
          <span className="text-xs bg-blue-100 text-blue-900 font-bold px-2.5 py-1 rounded-full">
            {projects.length} Works
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700 border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3">Work ID & Title</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Estimated</th>
                <th className="py-2.5 px-3 text-right">Sanctioned</th>
                <th className="py-2.5 px-3 text-right">Disbursed</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Physical Progress</th>
                <th className="py-2.5 px-3 text-center">Risk Tier</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((proj) => (
                <tr key={proj.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-blue-900 text-[10px]">{proj.workId}</div>
                    <div className="font-bold text-gray-900 text-xs line-clamp-1">{proj.title}</div>
                    <div className="text-[10px] text-gray-500 truncate">{proj.locationAddress}</div>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-gray-800">{proj.category}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-gray-800">
                    {formatLakhs(proj.estimatedCost)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-indigo-900">
                    {proj.sanctionedCost > 0 ? formatLakhs(proj.sanctionedCost) : 'Pending'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                    {formatLakhs(proj.utilizedCost)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                        proj.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : proj.status === 'Ongoing'
                          ? 'bg-blue-100 text-blue-800'
                          : proj.status === 'Delayed'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="w-16 mx-auto">
                      <div className="text-[10px] font-bold text-gray-700 mb-0.5">
                        {proj.completionPercentage}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 bg-blue-900 rounded-full"
                          style={{ width: `${proj.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        proj.riskLevel === 'Critical'
                          ? 'bg-red-100 text-red-800'
                          : proj.riskLevel === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : proj.riskLevel === 'Medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {proj.riskLevel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onSelectProject(proj)}
                      className="p-1 text-blue-900 hover:bg-blue-100 rounded transition-colors"
                      title="Inspect Project File"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Recommend New Work */}
      {showRecommendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg max-w-xl w-full shadow-2xl border border-gray-300 overflow-hidden">
            <div className="bg-blue-950 text-white p-4 flex items-center justify-between border-b-2 border-amber-500">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">Recommend New MPLADS Development Work</h3>
              </div>
              <button
                onClick={() => setShowRecommendModal(false)}
                className="text-gray-300 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecommendSubmit} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 text-red-800 text-xs rounded border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Title of Proposed Work *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Construction of Community Health Sub-Centre at Jagtial"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Asset Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-900"
                  >
                    <option value="Drinking Water">Drinking Water</option>
                    <option value="Education & Schools">Education & Schools</option>
                    <option value="Health & Sanitation">Health & Sanitation</option>
                    <option value="Roads & Pathways">Roads & Pathways</option>
                    <option value="Rural Electrification">Rural Electrification</option>
                    <option value="Community Infrastructure">Community Infrastructure</option>
                    <option value="Irrigation & Agriculture">Irrigation & Agriculture</option>
                    <option value="Sports & Youth Facilities">Sports & Youth Facilities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Estimated Cost (INR ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2500000 (₹25 Lakhs)"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Location / Village / Ward Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near Old Bus Stand, Choppadandi Gram Panchayat, Karimnagar"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    GPS Latitude (°N)
                  </label>
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    GPS Longitude (°E)
                  </label>
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Public Need / Justification
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain how this community asset benefits local citizens under the 2010 Guidelines..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowRecommendModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting Proposal...' : 'Recommend to District Magistrate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
