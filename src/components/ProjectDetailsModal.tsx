import React, { useState } from 'react';
import { Project, UserProfile } from '../types';
import {
  X,
  MapPin,
  Building,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  Coins,
  ShieldAlert,
  FileText,
  User,
  Info,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface ProjectDetailsModalProps {
  project: Project | null;
  currentUser: UserProfile | null;
  onClose: () => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  currentUser,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'timeline' | 'photos' | 'ai-risk'>('overview');

  if (!project) return null;

  const isOfficial = currentUser && currentUser.role !== 'PUBLIC';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-stone-300 rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-sky-950 text-white flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-sky-300 bg-sky-900 px-2 py-0.5 rounded">
                {project.workCode}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  project.status === 'Completed'
                    ? 'bg-emerald-600 text-white'
                    : project.status === 'Ongoing'
                    ? 'bg-blue-600 text-white'
                    : project.status === 'Delayed'
                    ? 'bg-orange-600 text-white'
                    : 'bg-stone-600 text-white'
                }`}
              >
                {project.status} ({project.progressPercentage}%)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold leading-snug">
              {project.title}
            </h2>
            <div className="text-xs text-stone-300 flex items-center gap-3 mt-1 flex-wrap">
              <span>Sector: <strong>{project.sector}</strong></span>
              <span>• Location: <strong>{project.district}, {project.state}</strong></span>
              <span>• MP: <strong>{project.mpName}</strong> ({project.house})</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-300 hover:text-white p-1 rounded transition-colors text-lg font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-100 text-xs font-semibold px-4 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-sky-900 text-sky-950 bg-white font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Work Overview
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'financials'
                ? 'border-sky-900 text-sky-950 bg-white font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Financials &amp; Outlays
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-sky-900 text-sky-950 bg-white font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Execution Stages ({project.timeline.filter((t) => t.completed).length}/7)
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'photos'
                ? 'border-sky-900 text-sky-950 bg-white font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Verified Photos ({project.photos.length})
          </button>
          {isOfficial && (
            <button
              onClick={() => setActiveTab('ai-risk')}
              className={`py-2.5 px-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'ai-risk'
                  ? 'border-red-700 text-red-900 bg-white font-bold'
                  : 'border-transparent text-red-700 hover:text-red-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              AI Integrity &amp; Anomaly Dossier
              <span className="px-1.5 py-0.2 bg-red-100 rounded-full text-[10px] text-red-800">
                {project.riskScore}/100
              </span>
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs text-stone-700 space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider mb-2">
                  Scope &amp; Community Justification
                </h4>
                <p className="text-stone-700 leading-relaxed">
                  {project.description || 'No detailed scope description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-stone-200 rounded-lg p-3.5 space-y-2">
                  <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-500" />
                    Geographical Coordinates &amp; Location
                  </h4>
                  <div className="space-y-1 text-[11px]">
                    <div><strong>Landmark:</strong> {project.locationName}</div>
                    <div><strong>Constituency:</strong> {project.constituency}</div>
                    <div><strong>District / State:</strong> {project.district}, {project.state}</div>
                    <div>
                      <strong>GPS Coordinates:</strong>{' '}
                      <span className="font-mono text-stone-800 font-bold">
                        {project.coordinates.lat.toFixed(5)}, {project.coordinates.lng.toFixed(5)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-lg p-3.5 space-y-2">
                  <h4 className="font-bold text-stone-900 border-b border-stone-100 pb-1 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-stone-500" />
                    Administrative &amp; Agency Stakeholders
                  </h4>
                  <div className="space-y-1 text-[11px]">
                    <div><strong>Recommending MP:</strong> {project.mpName} ({project.house})</div>
                    <div><strong>Financial Year:</strong> {project.financialYear} ({project.tenure})</div>
                    <div>
                      <strong>Implementing Agency:</strong>{' '}
                      {project.implementingAgencyName || 'Awaiting Assignment'}
                    </div>
                    <div>
                      <strong>Contractor / Vendor:</strong>{' '}
                      {project.vendorName || 'Not Assigned'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIALS */}
          {activeTab === 'financials' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <div className="text-stone-500 text-[11px] font-semibold">Estimated Cost</div>
                  <div className="text-base sm:text-lg font-bold text-stone-900 font-mono mt-1">
                    ₹{project.estimatedCostLakhs.toFixed(2)} Lakhs
                  </div>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <div className="text-stone-500 text-[11px] font-semibold">Sanctioned Amount</div>
                  <div className="text-base sm:text-lg font-bold text-indigo-900 font-mono mt-1">
                    ₹{project.sanctionedCostLakhs.toFixed(2)} Lakhs
                  </div>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <div className="text-stone-500 text-[11px] font-semibold">Actual Expenditure</div>
                  <div className="text-base sm:text-lg font-bold text-emerald-800 font-mono mt-1">
                    ₹{project.expenditureLakhs.toFixed(2)} Lakhs
                  </div>
                </div>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <div className="text-stone-500 text-[11px] font-semibold">Unspent Balance</div>
                  <div className="text-base sm:text-lg font-bold text-amber-800 font-mono mt-1">
                    ₹{project.balanceLakhs.toFixed(2)} Lakhs
                  </div>
                </div>
              </div>

              {/* Payments Released Table */}
              <div className="bg-white border border-stone-200 rounded-lg p-3.5 space-y-2">
                <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-700" />
                  Installment Releases &amp; Utilization History
                </h4>
                <div className="border border-stone-200 rounded overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-700 font-semibold">
                      <tr>
                        <th className="p-2 border-r border-stone-200">Payment ID</th>
                        <th className="p-2 border-r border-stone-200">Date</th>
                        <th className="p-2 border-r border-stone-200 text-right">Amount (₹ Lakhs)</th>
                        <th className="p-2 border-r border-stone-200">Installment Stage</th>
                        <th className="p-2">UC Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {project.payments.map((pmt) => (
                        <tr key={pmt.id} className="hover:bg-stone-50">
                          <td className="p-2 font-mono text-stone-500 border-r border-stone-200">
                            {pmt.id}
                          </td>
                          <td className="p-2 border-r border-stone-200">{pmt.date}</td>
                          <td className="p-2 text-right font-mono font-bold border-r border-stone-200 text-emerald-800">
                            ₹{pmt.amountLakhs.toFixed(2)}L
                          </td>
                          <td className="p-2 border-r border-stone-200">{pmt.stage}</td>
                          <td className="p-2 font-medium text-stone-700">{pmt.utilizationCertificateStatus}</td>
                        </tr>
                      ))}
                      {project.payments.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-stone-500">
                            No milestone payments disbursed yet for this work.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {project.timeline.map((stage, idx) => (
                  <div key={idx} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                        stage.completed
                          ? 'border-emerald-600 text-emerald-600'
                          : 'border-stone-300 text-stone-300'
                      }`}
                    >
                      {stage.completed && <CheckCircle2 className="w-3 h-3 fill-emerald-600 text-white" />}
                    </div>
                    <div className="bg-stone-50 border border-stone-200 p-3 rounded-md flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900">{stage.stage}</span>
                        <span className="text-[11px] font-mono text-stone-500">
                          {stage.date || 'Pending'}
                        </span>
                      </div>
                      {stage.actor && (
                        <div className="text-[11px] text-stone-600 mt-0.5">
                          <strong>Actor:</strong> {stage.actor}
                        </div>
                      )}
                      {stage.notes && (
                        <div className="text-[11px] text-stone-500 mt-1 italic">
                          "{stage.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PHOTOS & VERIFICATION */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.photos.map((ph) => (
                  <div
                    key={ph.id}
                    className="border border-stone-200 rounded-lg overflow-hidden bg-white shadow-xs"
                  >
                    <img
                      src={ph.url}
                      alt={ph.caption}
                      className="w-full h-44 object-cover bg-stone-100"
                    />
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-stone-900">{ph.caption}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            ph.verification.status === 'Verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {ph.verification.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-stone-600 space-y-0.5 bg-stone-50 p-2 rounded border border-stone-200">
                        <div><strong>Stage:</strong> {ph.stage}</div>
                        <div><strong>Uploaded By:</strong> {ph.uploadedBy} ({ph.uploadedByRole})</div>
                        <div><strong>Capture Date:</strong> {ph.uploadedAt}</div>
                        {ph.verification.distanceMeters !== undefined && (
                          <div>
                            <strong>GPS Distance to Site:</strong> {ph.verification.distanceMeters} meters
                          </div>
                        )}
                        <div className="text-[10px] text-stone-500 pt-1">
                          <strong>Verification Flags:</strong> {ph.verification.flagReasons.join('; ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {project.photos.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-stone-500">
                    No physical progress photographs uploaded yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: AI INTEGRITY DOSSIER */}
          {activeTab === 'ai-risk' && isOfficial && (
            <div className="space-y-4">
              {/* Mandatory AI Framing Disclaimer */}
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-md text-amber-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Official AI Decision Support Policy:</strong> Every AI output, anomaly flag, and risk score is provided strictly as decision support requiring human administrative review — never as a proof or determination of wrongdoing.
                </div>
              </div>

              {/* Composite Risk Gauge Card */}
              <div className="p-4 bg-white border border-stone-200 rounded-lg shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Composite AI Integrity Risk Score
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold font-mono text-stone-900">
                      {project.riskScore}
                    </span>
                    <span className="text-stone-500 text-sm font-semibold">/ 100</span>
                    <span
                      className={`ml-2 px-2.5 py-0.5 text-xs font-bold rounded ${
                        project.riskLevel === 'CRITICAL' || project.riskLevel === 'HIGH'
                          ? 'bg-red-100 text-red-800'
                          : project.riskLevel === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {project.riskLevel} RISK
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600 mt-1">
                    Primary Driver: {project.riskReasons.join('; ') || 'Standard baseline checks satisfied'}
                  </div>
                </div>

                <div className="w-full sm:w-48 bg-stone-100 h-3 rounded-full overflow-hidden border border-stone-200">
                  <div
                    className={`h-full rounded-full ${
                      project.riskScore >= 61
                        ? 'bg-red-600'
                        : project.riskScore >= 31
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${project.riskScore}%` }}
                  />
                </div>
              </div>

              {/* Cost Anomaly Statistical Baseline */}
              {project.costAnomaly && (
                <div className="p-4 bg-white border border-stone-200 rounded-lg shadow-xs space-y-2">
                  <h4 className="font-bold text-stone-900 flex items-center justify-between">
                    <span>Cost Anomaly Statistical Model Evaluation</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        project.costAnomaly.isAnomaly
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {project.costAnomaly.isAnomaly ? 'ANOMALY DETECTED' : 'NORMAL RANGE'}
                    </span>
                  </h4>
                  <p className="text-stone-600 text-xs">
                    {project.costAnomaly.reason}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-100 text-[11px]">
                    <div>
                      <span className="text-stone-500">Proposed Cost:</span>
                      <div className="font-mono font-bold">₹{project.estimatedCostLakhs}L</div>
                    </div>
                    <div>
                      <span className="text-stone-500">Category Mean:</span>
                      <div className="font-mono font-bold">₹{project.costAnomaly.categoryMeanLakhs}L</div>
                    </div>
                    <div>
                      <span className="text-stone-500">Std Deviation:</span>
                      <div className="font-mono font-bold">₹{project.costAnomaly.categoryStdDevLakhs}L</div>
                    </div>
                    <div>
                      <span className="text-stone-500">Z-Score:</span>
                      <div className="font-mono font-bold">{project.costAnomaly.zScore} σ</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delay Prediction Model */}
              {project.delayPrediction && (
                <div className="p-4 bg-white border border-stone-200 rounded-lg shadow-xs space-y-2">
                  <h4 className="font-bold text-stone-900 flex items-center justify-between">
                    <span>Timeline &amp; Delay Velocity Forecast</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        project.delayPrediction.classification === 'Delayed'
                          ? 'bg-red-100 text-red-800'
                          : project.delayPrediction.classification === 'At Risk'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {project.delayPrediction.classification.toUpperCase()}
                    </span>
                  </h4>
                  <p className="text-stone-600 text-xs">
                    {project.delayPrediction.reason}
                  </p>
                  <div className="text-[11px] text-stone-500 flex items-center justify-between pt-2 border-t border-stone-100">
                    <span>
                      Confidence: <strong>{project.delayPrediction.confidencePercent}%</strong> (Est. Delay: {project.delayPrediction.delayDaysMin}-{project.delayPrediction.delayDaysMax} days)
                    </span>
                    <span className="italic">
                      Trained on MPLADS norm data
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200 border border-stone-300 rounded transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
