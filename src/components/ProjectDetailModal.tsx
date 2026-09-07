import React, { useState, useEffect } from 'react';
import {
  Project,
  CitizenFeedback,
  ProjectDocument,
  ProjectInspection,
  AuditLogEntry,
  User
} from '../types/index.ts';
import {
  X,
  MapPin,
  Calendar,
  Building,
  User as UserIcon,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  ShieldAlert,
  FileText,
  Layers,
  MessageSquare,
  History,
  Upload,
  Search,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Plus
} from 'lucide-react';
import {
  fetchProjectDocuments,
  uploadProjectDocument,
  verifyProjectDocument,
  fetchInspections,
  fetchAuditLogs
} from '../services/api.ts';

interface ProjectDetailModalProps {
  project: Project | null;
  feedbackList?: CitizenFeedback[];
  user: User | null;
  onClose: () => void;
  onOpenGrievanceForm?: (project: Project) => void;
  onOpenScheduleInspection?: (project: Project) => void;
  onOpenRecordInspection?: (inspection: ProjectInspection) => void;
}

type TabType =
  | 'overview'
  | 'timeline'
  | 'financials'
  | 'integrity'
  | 'photos'
  | 'documents'
  | 'inspections'
  | 'feedback'
  | 'audit';

const TIMELINE_STAGES = [
  'Recommended',
  'Approved',
  'Work Started',
  'In Progress',
  'Inspection',
  'Completed'
];

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  feedbackList = [],
  user,
  onClose,
  onOpenGrievanceForm,
  onOpenScheduleInspection,
  onOpenRecordInspection
}) => {
  if (!project) return null;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [documents, setDocuments] = useState<ProjectDocument[]>(project.documents || []);
  const [inspections, setInspections] = useState<ProjectInspection[]>(project.inspections || []);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [uploadDocType, setUploadDocType] = useState('Work Order');
  const [uploadDocTitle, setUploadDocTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [docMessage, setDocMessage] = useState<string | null>(null);

  const formatLakhs = (val: number) => `₹${(val / 100000).toFixed(2)} Lakhs`;
  const formatCrores = (val: number) => `₹${(val / 10000000).toFixed(2)} Cr`;

  // Linked citizen feedback
  const linkedFeedback = feedbackList.filter((f) => f.projectId === project.id);

  // Load documents and inspections when project changes
  useEffect(() => {
    if (project) {
      fetchProjectDocuments(project.id)
        .then((docs) => setDocuments(docs))
        .catch((err) => console.warn('Fetch documents notice:', err));

      fetchInspections(project.id)
        .then((insps) => setInspections(insps))
        .catch((err) => console.warn('Fetch inspections notice:', err));

      if (user?.role === 'admin') {
        fetchAuditLogs(project.id)
          .then((logs) => setAuditLogs(logs))
          .catch((err) => console.warn('Fetch audit logs notice:', err));
      }
    }
  }, [project, user]);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocTitle.trim()) return;
    setIsUploading(true);
    setDocMessage(null);
    try {
      const doc = await uploadProjectDocument(project.id, {
        documentType: uploadDocType,
        title: uploadDocTitle.trim(),
        fileName: `${uploadDocType.replace(/\s+/g, '_')}_${Date.now()}.pdf`,
        fileSize: '1.8 MB'
      });
      setDocuments((prev) => [doc, ...prev]);
      setUploadDocTitle('');
      setDocMessage('Document submitted successfully for statutory verification.');
    } catch (err: any) {
      setDocMessage(`Error: ${err.message || 'Failed to upload document'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifyDocument = async (docId: string, status: 'Verified' | 'Flagged') => {
    try {
      const updated = await verifyProjectDocument(docId, { verificationStatus: status });
      setDocuments((prev) => prev.map((d) => (d.id === docId ? updated : d)));
    } catch (err: any) {
      console.warn('Verify document notice:', err);
    }
  };

  const sanctioned = project.sanctionedCost || project.estimatedCost || 0;
  const utilized = project.utilizedCost || 0;
  const remaining = Math.max(0, sanctioned - utilized);
  const utilPct = sanctioned > 0 ? Math.round((utilized / sanctioned) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full shadow-2xl border border-gray-300 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Government Portal Header */}
        <div className="bg-blue-950 text-white p-3.5 sm:p-4 flex items-start justify-between border-b-2 border-amber-500 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded uppercase font-mono">
                {project.workId}
              </span>
              <span className="text-xs text-blue-200">
                {project.category} • {project.district}, {project.state}
              </span>
              <span className="text-[10px] bg-blue-900 border border-blue-400/40 text-blue-100 px-2 py-0.5 rounded font-semibold">
                MP: {project.mpName} ({project.constituency})
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight">
              {project.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dossier Navigation Tabs */}
        <div className="flex items-center gap-1 bg-gray-50 border-b border-gray-200 px-3 sm:px-4 pt-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'timeline', label: 'Timeline & Milestones' },
            { id: 'financials', label: 'Financials' },
            { id: 'integrity', label: `AI Integrity (${project.riskScore}/100)` },
            { id: 'photos', label: `Photos (${project.photos?.length || 0})` },
            { id: 'documents', label: `Documents (${documents.length})` },
            { id: 'inspections', label: `Inspections (${inspections.length})` },
            { id: 'feedback', label: `Grievances (${linkedFeedback.length})` },
            ...(user?.role === 'admin' ? [{ id: 'audit', label: 'Audit Trail' }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-2.5 py-2 font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-950 text-blue-950 bg-white shadow-2xs'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: OVERVIEW & LOCATION */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Quick Key Metrics Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Current Stage</span>
                  <div className="font-extrabold text-gray-900 text-sm mt-0.5">{project.status}</div>
                  <div className="text-[10px] text-gray-600 font-semibold">{project.completionPercentage}% Physical Progress</div>
                </div>

                <div className="bg-blue-50/70 p-2.5 rounded border border-blue-200">
                  <span className="text-[10px] font-bold text-blue-800 uppercase">Sanctioned Cost</span>
                  <div className="font-extrabold text-blue-950 text-sm mt-0.5">{formatLakhs(sanctioned)}</div>
                  <div className="text-[10px] text-blue-700 font-semibold">{formatCrores(sanctioned)}</div>
                </div>

                <div className="bg-emerald-50/70 p-2.5 rounded border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase">Expenditure Utilized</span>
                  <div className="font-extrabold text-emerald-950 text-sm mt-0.5">{formatLakhs(utilized)}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">{utilPct}% of Sanction</div>
                </div>

                <div className="bg-amber-50/70 p-2.5 rounded border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-800 uppercase">AI Risk Score</span>
                  <div className="font-extrabold text-amber-950 text-sm mt-0.5">
                    {project.riskScore}/100 ({project.riskLevel})
                  </div>
                  <div className="text-[10px] text-amber-800 font-semibold truncate">
                    {project.delayPrediction?.status === 'Delayed' ? `Delay ~${project.delayPrediction.estimatedDelayDays}d` : 'Timeline On Track'}
                  </div>
                </div>
              </div>

              {/* Physical Execution Progress */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-700 mb-1">
                  <span>Physical Execution Progress</span>
                  <span>{project.completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 bg-blue-900 rounded-full transition-all duration-300"
                    style={{ width: `${project.completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Administrative & Technical Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-gray-50 p-3.5 rounded border border-gray-200">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Parliamentary Representative</span>
                  <div className="font-bold text-gray-900 text-sm">{project.mpName}</div>
                  <div className="text-[11px] text-gray-600">
                    {project.house} • Constituency: {project.constituency}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Implementing Agency & Contractor</span>
                  <div className="font-bold text-gray-900 text-sm">{project.agencyName || 'District Rural Development Agency (DRDA)'}</div>
                  <div className="text-[11px] text-gray-600">
                    Awarded Vendor: {project.vendorName || 'Civil Contractor Unassigned'}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Site Location & Geo-Coordinates</span>
                  <div className="font-semibold text-gray-900">{project.locationAddress}</div>
                  <div className="text-[11px] text-blue-950 font-mono mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-600 shrink-0" />
                    <span>GPS: {project.latitude}° N, {project.longitude}° E</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Administrative Dates</span>
                  <div className="text-[11px] text-gray-700">
                    Recommended: <span className="font-semibold">{project.recommendedDate || project.createdAt.split('T')[0]}</span>
                  </div>
                  <div className="text-[11px] text-gray-700">
                    Sanctioned: <span className="font-semibold">{project.sanctionDate || 'Under Sanction Review'}</span>
                  </div>
                  <div className="text-[11px] text-gray-700">
                    Target Completion: <span className="font-semibold">{project.expectedCompletionDate || '180 days post-sanction'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Authorized Roles */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-200">
                {onOpenGrievanceForm && (
                  <button
                    onClick={() => onOpenGrievanceForm(project)}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded shadow-2xs text-xs flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Submit Citizen Vigilance Observation</span>
                  </button>
                )}

                {user && (user.role === 'admin' || user.role === 'mp') && onOpenScheduleInspection && (
                  <button
                    onClick={() => onOpenScheduleInspection(project)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded shadow-2xs text-xs flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Schedule Field Inspection</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TIMELINE & MILESTONES */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Official Stage Progression</h4>
                  <p className="text-[11px] text-gray-500">
                    Statutory MPLADS lifecycle milestones from recommendation to dedication
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-blue-950 text-xs">
                    {project.delayPrediction?.status === 'Delayed' ? (
                      <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                        Delayed by ~{project.delayPrediction.estimatedDelayDays} days
                      </span>
                    ) : (
                      <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                        On Track
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Timeline Stepper */}
              <div className="relative pl-6 sm:pl-8 border-l-2 border-blue-900/20 space-y-6 my-4">
                {(project.timeline && project.timeline.length > 0
                  ? project.timeline
                  : [
                      {
                        id: '1',
                        stage: 'Recommended',
                        date: project.recommendedDate || '2023-06-15',
                        actor: project.mpName,
                        actorRole: 'mp',
                        notes: `Formally recommended for sanction under MPLADS by Member of Parliament.`
                      },
                      {
                        id: '2',
                        stage: 'Approved',
                        date: project.sanctionDate || '2023-08-10',
                        actor: 'District Authority',
                        actorRole: 'admin',
                        notes: `Administrative & Technical approval granted. Sanction order issued for ${formatLakhs(sanctioned)}.`
                      },
                      {
                        id: '3',
                        stage: 'Work Started',
                        date: project.agencyAssignedDate || '2023-09-01',
                        actor: project.agencyName || 'Executing Agency',
                        actorRole: 'agency',
                        notes: `Work order awarded to contractor. Site mobilization and layout verification commenced.`
                      },
                      {
                        id: '4',
                        stage: 'In Progress',
                        date: project.updatedAt?.split('T')[0] || '2024-01-15',
                        actor: project.agencyName || 'Executing Agency',
                        actorRole: 'agency',
                        notes: `Physical execution reached ${project.completionPercentage}%. Measurement book entries recorded.`
                      }
                    ]
                ).map((ev, idx) => (
                  <div key={ev.id} className="relative">
                    <div className="absolute -left-[31px] sm:-left-[39px] top-0 w-5 h-5 rounded-full bg-blue-950 border-2 border-amber-400 flex items-center justify-center text-white text-[9px] font-bold">
                      {idx + 1}
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <span className="font-extrabold text-blue-950 text-xs uppercase tracking-wide">
                          {ev.stage}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono font-semibold">
                          {ev.date}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-700 leading-relaxed">{ev.notes}</div>
                      <div className="mt-1.5 pt-1 border-t border-gray-100 text-[10px] text-gray-500 flex items-center justify-between">
                        <span>Actor: <strong className="text-gray-800">{ev.actor}</strong></span>
                        <span className="uppercase font-mono text-[9px] bg-gray-200 px-1.5 py-0.2 rounded">
                          {ev.actorRole}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIALS */}
          {activeTab === 'financials' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 p-3 rounded border">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Estimated</span>
                  <div className="text-sm font-extrabold text-gray-900 mt-0.5">{formatLakhs(project.estimatedCost)}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <span className="text-[10px] text-blue-700 font-bold uppercase">Sanctioned</span>
                  <div className="text-sm font-extrabold text-blue-950 mt-0.5">{formatLakhs(sanctioned)}</div>
                </div>
                <div className="bg-emerald-50 p-3 rounded border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase">Utilized</span>
                  <div className="text-sm font-extrabold text-emerald-950 mt-0.5">{formatLakhs(utilized)}</div>
                  <div className="text-[10px] text-emerald-800 font-semibold">{utilPct}% of Sanction</div>
                </div>
                <div className="bg-purple-50 p-3 rounded border border-purple-200">
                  <span className="text-[10px] text-purple-700 font-bold uppercase">Unspent Balance</span>
                  <div className="text-sm font-extrabold text-purple-950 mt-0.5">{formatLakhs(remaining)}</div>
                </div>
              </div>

              {/* Financial Discrepancy Analysis */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-800 text-xs">Expenditure vs Physical Progress Ratio</span>
                  <span className="text-xs font-bold text-blue-950">
                    Expenditure: {utilPct}% vs Construction: {project.completionPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-emerald-600 h-2"
                    style={{ width: `${Math.min(100, utilPct)}%` }}
                    title={`Expenditure: ${utilPct}%`}
                  />
                </div>
                {utilPct > project.completionPercentage + 20 && utilPct > 30 && (
                  <div className="mt-2 text-[11px] font-semibold text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Alert: Fund utilization ({utilPct}%) significantly outpaces verified ground progress ({project.completionPercentage}%).
                    </span>
                  </div>
                )}
              </div>

              {/* Disbursal Installments Table */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 mb-2">Disbursal & Payment History</h4>
                {project.payments && project.payments.length > 0 ? (
                  <table className="w-full text-left text-xs border border-gray-200 rounded overflow-hidden">
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
                  <div className="p-4 text-center text-gray-500 text-xs bg-gray-50 rounded">
                    First installment release order in preparation by District Authority.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AI INTEGRITY ENGINE */}
          {activeTab === 'integrity' && (
            <div className="space-y-4">
              <div className="bg-blue-950 text-white p-4 rounded-lg flex items-center justify-between border-2 border-amber-500">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Deterministic Composite Risk Engine (0-100)
                  </span>
                  <div className="text-xl font-extrabold mt-0.5">
                    Risk Score: {project.riskScore}/100 —{' '}
                    <span
                      className={
                        project.riskLevel === 'Critical'
                          ? 'text-red-400'
                          : project.riskLevel === 'High'
                          ? 'text-rose-400'
                          : project.riskLevel === 'Elevated'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }
                    >
                      {project.riskLevel} Risk
                    </span>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <div className="text-[10px] text-blue-200">Decision Support Model</div>
                  <div className="font-mono text-xs text-amber-300">MoSPI Rule-Engine v3.2</div>
                </div>
              </div>

              {/* Primary Reason & Individual Factors */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Primary AI Finding</span>
                  <p className="text-xs font-semibold text-gray-900 mt-0.5 bg-white p-2.5 rounded border border-gray-200 leading-relaxed">
                    {project.riskReason}
                  </p>
                </div>

                {project.riskReasons && project.riskReasons.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      Specific Contributing Factors ({project.riskReasons.length})
                    </span>
                    <ul className="mt-1 space-y-1">
                      {project.riskReasons.map((reason, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-gray-800 bg-white p-2 rounded border border-gray-100 flex items-start gap-2"
                        >
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Automated Anomaly Tests Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded border border-gray-200">
                  <span className="text-gray-500 font-bold block mb-1 uppercase text-[10px]">
                    Cost Statistical Outlier
                  </span>
                  <div className={project.costAnomaly?.isAnomaly ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                    {project.costAnomaly?.isAnomaly ? `Outlier (z=${project.costAnomaly.zScore})` : 'Within Normal Baseline'}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Evaluated across category average</div>
                </div>

                <div className="bg-white p-3 rounded border border-gray-200">
                  <span className="text-gray-500 font-bold block mb-1 uppercase text-[10px]">
                    Duplicate Asset Screening
                  </span>
                  <div className={project.duplicateFlag?.isSuspected ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                    {project.duplicateFlag?.isSuspected
                      ? `${project.duplicateFlag.similarityScore}% Suspected Match`
                      : 'Zero Duplicates in Radius'}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Cross-checked with state registry</div>
                </div>

                <div className="bg-white p-3 rounded border border-gray-200">
                  <span className="text-gray-500 font-bold block mb-1 uppercase text-[10px]">
                    Timeline Slippage Projection
                  </span>
                  <div className={project.delayPrediction?.status === 'Delayed' ? 'text-amber-700 font-bold' : 'text-gray-800 font-bold'}>
                    {project.delayPrediction?.status === 'Delayed'
                      ? `Delayed (~${project.delayPrediction.estimatedDelayDays} days)`
                      : 'Milestone Compliant'}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Calculated from sanction date</div>
                </div>
              </div>

              {/* Mandatory Governance Disclaimer */}
              <p className="text-[10px] text-slate-600 italic bg-amber-50/60 p-2.5 rounded border border-amber-200">
                <strong>Statutory Notice:</strong> AI anomaly indicators provide automated telemetry to assist the District Authority.
                All adverse flags require physical site inspection and verification before any administrative sanction or penalty is imposed.
              </p>
            </div>
          )}

          {/* TAB 5: SITE INSPECTION PHOTOS */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Geo-Tagged Field Inspection Photos</h4>
                  <p className="text-[11px] text-gray-500">
                    Server-side EXIF extracted & validated against site GPS ({project.latitude}, {project.longitude})
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                  Total Photos: {project.photos?.length || 0}
                </span>
              </div>

              {project.photos && project.photos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {project.photos.map((ph) => (
                    <div key={ph.id} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={ph.url}
                        alt="Site Inspection"
                        className="w-full h-40 object-cover bg-gray-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{ph.stage}</span>
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase ${
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

                        <p className="text-[11px] text-gray-600">{ph.notes}</p>

                        <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-500 font-mono space-y-0.5">
                          {ph.distanceMeters !== undefined && (
                            <div>Location Distance: <strong>{ph.distanceMeters}m</strong> from registered GPS</div>
                          )}
                          {ph.device && <div>Capture Device: {ph.device}</div>}
                          <div>Uploaded: {new Date(ph.uploadedAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-xs bg-gray-50 rounded">
                  No site photographs uploaded for this work yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: STATUTORY DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Statutory Project Documents Dossier</h4>
                  <p className="text-[11px] text-gray-500">
                    Mandatory sanctions, work orders, MB entries, and completion certificates
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                  {documents.length} Documents On Record
                </span>
              </div>

              {/* Upload Document Form for Authenticated Users */}
              {user && (
                <form onSubmit={handleUploadDocument} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                  <div className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Statutory Document</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">
                        Document Type *
                      </label>
                      <select
                        value={uploadDocType}
                        onChange={(e) => setUploadDocType(e.target.value)}
                        className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-900"
                      >
                        <option value="Sanction Order">Sanction Order</option>
                        <option value="Administrative Approval">Administrative Approval</option>
                        <option value="Technical Sanction">Technical Sanction</option>
                        <option value="Work Order">Work Order</option>
                        <option value="Measurement Book">Measurement Book (MB)</option>
                        <option value="Field Inspection Report">Field Inspection Report</option>
                        <option value="Utilization Certificate">Utilization Certificate (UC)</option>
                        <option value="Completion Certificate">Completion Certificate</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">
                        Document Title / Reference Number *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sanction Order Ref # MOSPI/2023/MPLADS/99"
                          value={uploadDocTitle}
                          onChange={(e) => setUploadDocTitle(e.target.value)}
                          className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:ring-1 focus:ring-blue-900"
                        />
                        <button
                          type="submit"
                          disabled={isUploading || !uploadDocTitle.trim()}
                          className="px-4 py-1.5 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded text-xs disabled:opacity-50 transition-colors shadow-2xs"
                        >
                          {isUploading ? 'Uploading...' : 'Upload'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {docMessage && (
                    <div className="text-[11px] text-blue-900 font-semibold bg-blue-100/60 p-2 rounded">
                      {docMessage}
                    </div>
                  )}
                </form>
              )}

              {/* Documents List */}
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between gap-3 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <FileText className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900">{doc.title}</span>
                            <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded font-mono">
                              {doc.documentType}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                doc.verificationStatus === 'Verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : doc.verificationStatus === 'Flagged'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {doc.verificationStatus}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Uploaded by {doc.uploadedRole.toUpperCase()} on {new Date(doc.uploadedAt).toLocaleDateString()} • {doc.fileSize || '1.5 MB'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {user?.role === 'admin' && doc.verificationStatus !== 'Verified' && (
                          <button
                            onClick={() => handleVerifyDocument(doc.id, 'Verified')}
                            className="px-2 py-1 text-[10px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded shadow-2xs"
                          >
                            Verify
                          </button>
                        )}
                        {user?.role === 'admin' && doc.verificationStatus !== 'Flagged' && (
                          <button
                            onClick={() => handleVerifyDocument(doc.id, 'Flagged')}
                            className="px-2 py-1 text-[10px] font-bold bg-red-700 hover:bg-red-800 text-white rounded shadow-2xs"
                          >
                            Flag
                          </button>
                        )}
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                        >
                          View PDF
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-xs bg-gray-50 rounded">
                  No statutory documents on record for this work.
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SITE INSPECTIONS */}
          {activeTab === 'inspections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Statutory Quality Field Inspections</h4>
                  <p className="text-[11px] text-gray-500">
                    Mandatory 10% sample inspections mandated by District Authorities
                  </p>
                </div>
                {user && (user.role === 'admin' || user.role === 'mp') && onOpenScheduleInspection && (
                  <button
                    onClick={() => onOpenScheduleInspection(project)}
                    className="px-3 py-1 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded text-xs flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Schedule Inspection</span>
                  </button>
                )}
              </div>

              {inspections.length > 0 ? (
                <div className="space-y-3">
                  {inspections.map((insp) => (
                    <div key={insp.id} className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-2.5">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-xs">
                              Officer: {insp.inspectingOfficer}
                            </span>
                            <span className="text-[10px] text-gray-600 bg-white px-1.5 py-0.2 rounded border border-gray-200 font-semibold">
                              {insp.officerDesignation}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Inspection Date: {insp.inspectionDate || insp.scheduledDate} • Status: {insp.status}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                              insp.result === 'Satisfactory'
                                ? 'bg-emerald-100 text-emerald-800'
                                : insp.result === 'Minor Issues'
                                ? 'bg-blue-100 text-blue-800'
                                : insp.result === 'Major Issues'
                                ? 'bg-amber-100 text-amber-800'
                                : insp.result === 'Critical Issues'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            Result: {insp.result}
                          </span>

                          {insp.status === 'Scheduled' && user && (user.role === 'admin' || user.role === 'agency') && onOpenRecordInspection && (
                            <button
                              onClick={() => onOpenRecordInspection(insp)}
                              className="px-2.5 py-1 text-[10px] font-bold bg-blue-900 hover:bg-blue-800 text-white rounded shadow-2xs"
                            >
                              Record Findings
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Observations */}
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Field Observations:</span>
                        <p className="text-xs text-gray-700 bg-white p-2 rounded border border-gray-100 mt-0.5 leading-relaxed">
                          {insp.observations}
                        </p>
                      </div>

                      {/* Recommendations */}
                      {insp.recommendations && (
                        <div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Recommendations:</span>
                          <p className="text-xs text-gray-700 bg-white p-2 rounded border border-gray-100 mt-0.5 leading-relaxed">
                            {insp.recommendations}
                          </p>
                        </div>
                      )}

                      {/* Checklist Items */}
                      {insp.checklist && insp.checklist.length > 0 && (
                        <div className="bg-white p-2.5 rounded border border-gray-100">
                          <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                            Quality Checklist Verification
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {insp.checklist.map((c, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[10px] text-gray-700">
                                <span className="truncate max-w-[200px]">{c.item}</span>
                                <span
                                  className={`font-bold px-1 rounded ${
                                    c.status === 'Satisfactory' || c.status === 'Pass'
                                      ? 'text-emerald-700'
                                      : c.status === 'Issue' || c.status === 'Fail'
                                      ? 'text-rose-700'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  {c.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-xs bg-gray-50 rounded">
                  No site inspection records filed for this work yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 8: CITIZEN GRIEVANCES */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Citizen Vigilance & Grievances</h4>
                  <p className="text-[11px] text-gray-500">
                    Complaints and observations registered by residents on ground execution
                  </p>
                </div>
                {onOpenGrievanceForm && (
                  <button
                    onClick={() => onOpenGrievanceForm(project)}
                    className="px-3 py-1 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded text-xs flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Submit Grievance</span>
                  </button>
                )}
              </div>

              {linkedFeedback.length > 0 ? (
                <div className="space-y-3">
                  {linkedFeedback.map((fb) => (
                    <div key={fb.id} className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                      <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-900 bg-blue-100 px-1.5 py-0.2 rounded text-[10px]">
                            {fb.grievanceId || fb.id}
                          </span>
                          <span className="font-bold text-rose-800">{fb.issueType}</span>
                        </div>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase ${
                            fb.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : fb.status === 'Dismissed'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {fb.status}
                        </span>
                      </div>

                      <p className="text-xs text-gray-800 bg-white p-2.5 rounded border border-gray-100 leading-relaxed italic">
                        "{fb.comments}"
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-gray-600 pt-1">
                        <div>
                          <span>Submitted by: <strong>{fb.citizenName}</strong></span>
                          <div>Date: {new Date(fb.createdAt).toLocaleDateString()}</div>
                        </div>
                        {fb.assignedOfficer && (
                          <div>
                            <span>Assigned Officer: <strong>{fb.assignedOfficer}</strong></span>
                            {fb.actionTaken && <div>Action: <strong>{fb.actionTaken}</strong></div>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-xs bg-gray-50 rounded">
                  No citizen grievances on record for this work.
                </div>
              )}
            </div>
          )}

          {/* TAB 9: AUDIT TRAIL (Admin Only) */}
          {activeTab === 'audit' && user?.role === 'admin' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Immutable Audit Trail</h4>
                  <p className="text-[11px] text-gray-500">
                    Chronological record of all administrative, financial, and inspection events
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                  {auditLogs.length} Events Logged
                </span>
              </div>

              {auditLogs.length > 0 ? (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-2.5 bg-gray-50 rounded border border-gray-200 text-xs">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-blue-950">{log.action}</span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-700">
                        Actor: <strong className="text-gray-900">{log.actorName}</strong> ({log.actorRole.toUpperCase()})
                      </div>
                      {log.fieldChanged && (
                        <div className="mt-1 text-[10px] text-gray-600 bg-white p-1.5 rounded border border-gray-100 font-mono">
                          Changed: {log.fieldChanged} → {log.newValue}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 text-xs bg-gray-50 rounded">
                  No historical audit entries for this work.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-gray-500 font-mono">
            Work ID: {project.workId} • e-SAKSHI Central Registry
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
