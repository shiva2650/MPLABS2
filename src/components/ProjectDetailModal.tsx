import React, { useState } from 'react';
import { Project, CitizenFeedback } from '../types/index.ts';
import {
  X,
  MapPin,
  Calendar,
  Building,
  User,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  ShieldAlert,
  FileText,
  Layers,
  MessageSquare
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project | null;
  feedbackList?: CitizenFeedback[];
  onClose: () => void;
  onOpenGrievanceForm?: (project: Project) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  feedbackList = [],
  onClose,
  onOpenGrievanceForm
}) => {
  if (!project) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'financials' | 'feedback'>('overview');

  const formatLakhs = (val: number) => `₹${(val / 100000).toFixed(2)} Lakhs`;

  // Project linked citizen feedback
  const linkedFeedback = feedbackList.filter((f) => f.projectId === project.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full shadow-2xl border border-gray-300 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Government Style Header */}
        <div className="bg-blue-950 text-white p-4 flex items-start justify-between border-b-2 border-amber-500">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded uppercase">
                {project.workId}
              </span>
              <span className="text-xs text-blue-200">
                {project.category} • {project.district}, {project.state}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white leading-tight">{project.title}</h3>
          </div>

          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Header Navigation Tabs */}
        <div className="flex items-center gap-1 bg-gray-50 border-b border-gray-200 px-4 pt-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-900 text-blue-900 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Work Dossier & AI Integrity
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'photos'
                ? 'border-blue-900 text-blue-900 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Camera className="w-3 h-3" />
            <span>Site Inspection Photos ({project.photos?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('financials')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'financials'
                ? 'border-blue-900 text-blue-900 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <IndianRupee className="w-3 h-3" />
            <span>Financials & Disbursals</span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'feedback'
                ? 'border-blue-900 text-blue-900 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Citizen Observations ({linkedFeedback.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: WORK DOSSIER & AI INTEGRITY */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Status and Risk Quick Badges */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-600 uppercase">Current Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded uppercase text-[10px] ${
                      project.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : project.status === 'Ongoing'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : project.status === 'Delayed'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-gray-100 text-gray-800 border border-gray-300'
                    }`}
                  >
                    {project.status} ({project.completionPercentage}% Physical Progress)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-600 uppercase">AI Risk Score:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                      project.riskLevel === 'Critical'
                        ? 'bg-red-600 text-white'
                        : project.riskLevel === 'High'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : project.riskLevel === 'Medium'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {project.riskScore}/100 ({project.riskLevel})
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1">
                  <span>Physical Execution Progress</span>
                  <span>{project.completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-blue-900 rounded-full transition-all duration-300"
                    style={{ width: `${project.completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Administrative Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/70 p-3.5 rounded border border-gray-200">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Parliamentary Representative</span>
                  <div className="font-bold text-gray-900">{project.mpName}</div>
                  <div className="text-[11px] text-gray-600">{project.house} • {project.constituency}</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Implementing Agency</span>
                  <div className="font-bold text-gray-900">{project.agencyName || 'Pending Assignment'}</div>
                  <div className="text-[11px] text-gray-600">Contractor: {project.vendorName || 'Unassigned'}</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Exact Site Location</span>
                  <div className="font-semibold text-gray-800">{project.locationAddress}</div>
                  <div className="text-[10px] text-blue-900 font-mono mt-0.5">
                    GPS: {project.latitude}°N, {project.longitude}°E
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Timeline & Milestones</span>
                  <div className="text-[11px] text-gray-700">
                    Recommended: {project.recommendedDate || project.createdAt.split('T')[0]}
                  </div>
                  <div className="text-[11px] text-gray-700">
                    Sanctioned: {project.sanctionDate || 'Awaiting sanction'}
                  </div>
                  <div className="text-[11px] text-gray-700">
                    Target Completion: {project.expectedCompletionDate || '180 days post-sanction'}
                  </div>
                </div>
              </div>

              {/* AI Decision Support Findings Box */}
              <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-lg space-y-2.5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-900" />
                  <h4 className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
                    AI Integrity & Decision Support Telemetry
                  </h4>
                </div>

                <div className="text-gray-700 text-xs leading-relaxed bg-white p-3 rounded border border-indigo-100">
                  <div className="font-bold text-blue-900 mb-1">Composite Risk Indicator:</div>
                  <p>{project.riskReason}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-white p-2.5 rounded border border-indigo-100">
                    <span className="text-gray-500 font-bold block mb-0.5 uppercase text-[9px]">
                      Cost Anomaly Test
                    </span>
                    <span className={project.costAnomaly?.isAnomaly ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                      {project.costAnomaly?.isAnomaly ? `Outlier (z=${project.costAnomaly.zScore})` : 'Within Normal Baseline'}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-indigo-100">
                    <span className="text-gray-500 font-bold block mb-0.5 uppercase text-[9px]">
                      Duplicate Asset Check
                    </span>
                    <span className={project.duplicateFlag?.isSuspected ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                      {project.duplicateFlag?.isSuspected ? `${project.duplicateFlag.similarityScore}% Suspected Match` : 'No Duplicates Found'}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-indigo-100">
                    <span className="text-gray-500 font-bold block mb-0.5 uppercase text-[9px]">
                      Delay Prediction
                    </span>
                    <span className={project.delayPrediction?.status === 'Delayed' ? 'text-amber-700 font-bold' : 'text-gray-800 font-bold'}>
                      {project.delayPrediction?.status || 'On Track'}
                    </span>
                  </div>
                </div>

                {/* Mandated AI Disclaimer */}
                <p className="text-[10px] text-indigo-900/80 italic pt-1 border-t border-indigo-200/60">
                  Disclaimer: Every AI score is generated strictly for administrative decision support and requires
                  field validation by the competent District Authority. It does not constitute proof of fraud.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SITE INSPECTION PHOTOS */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-700">
                  Geo-Tagged Field Inspection Records ({project.photos?.length || 0})
                </span>
                <span className="text-[10px] text-gray-500">
                  Server-side EXIF extracted per Section 6.2
                </span>
              </div>

              {project.photos && project.photos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.photos.map((ph) => (
                    <div key={ph.id} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 shadow-2xs">
                      <img
                        src={ph.url}
                        alt="Site Inspection"
                        className="w-full h-36 object-cover bg-gray-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{ph.stage}</span>
                          <span
                            className={`font-bold px-1.5 py-0.2 rounded text-[10px] uppercase ${
                              ph.exifStatus === 'Verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ph.exifStatus === 'Mismatch'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {ph.exifStatus}
                          </span>
                        </div>

                        <div className="text-[11px] text-gray-600">{ph.notes}</div>

                        <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-500 space-y-0.5 font-mono">
                          {ph.distanceMeters !== undefined && (
                            <div>Distance: {ph.distanceMeters}m from registered site</div>
                          )}
                          {ph.device && <div>Device: {ph.device}</div>}
                          {ph.software && <div>Software: {ph.software}</div>}
                          <div>Uploaded: {new Date(ph.uploadedAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-xs bg-gray-50 rounded">
                  No inspection photos uploaded for this work yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FINANCIALS & DISBURSALS */}
          {activeTab === 'financials' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 p-3 rounded border">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Estimated</span>
                  <div className="text-sm font-extrabold text-gray-900 mt-0.5">{formatLakhs(project.estimatedCost)}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <span className="text-[10px] text-blue-700 font-bold uppercase">Sanctioned</span>
                  <div className="text-sm font-extrabold text-blue-950 mt-0.5">{formatLakhs(project.sanctionedCost)}</div>
                </div>
                <div className="bg-emerald-50 p-3 rounded border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase">Utilized</span>
                  <div className="text-sm font-extrabold text-emerald-950 mt-0.5">{formatLakhs(project.utilizedCost)}</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-900 mb-2">Disbursal & Payment History</h4>
                {project.payments && project.payments.length > 0 ? (
                  <table className="w-full text-left text-xs border border-gray-200 rounded">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Inst. #</th>
                        <th className="py-2 px-3">Sanction Order</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {project.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 font-bold">Installment {p.installmentNo}</td>
                          <td className="py-2 px-3 font-mono text-[11px]">{p.sanctionOrderNo}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-800">{formatLakhs(p.amount)}</td>
                          <td className="py-2 px-3 text-gray-600">{p.date}</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-gray-500 text-xs bg-gray-50 rounded">
                    No payment disbursals recorded against this work yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CITIZEN OBSERVATIONS */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-700">
                  Citizen Vigilance Reports for Work ID {project.workId}
                </span>

                {onOpenGrievanceForm && (
                  <button
                    onClick={() => onOpenGrievanceForm(project)}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded shadow-2xs"
                  >
                    Submit New Observation
                  </button>
                )}
              </div>

              {linkedFeedback.length > 0 ? (
                <div className="space-y-2.5">
                  {linkedFeedback.map((fb) => (
                    <div key={fb.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-bold text-rose-800">{fb.issueType}</span>
                        <span className="font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                          {fb.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700 italic bg-white p-2 rounded border border-gray-100 mb-1">
                        "{fb.comments}"
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>Submitted by: {fb.citizenName}</span>
                        <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-xs bg-gray-50 rounded">
                  No public complaints or feedback registered for this work.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 font-mono">
            Work ID: {project.workId}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded shadow-2xs"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
