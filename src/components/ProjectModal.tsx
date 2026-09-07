import React, { useState } from 'react';
import { Project, DuplicateProjectCandidate, UserRole, ProjectStatus } from '../types/index.js';
import { RiskBadge, StatusBadge } from './Badges.js';
import {
  X,
  Calendar,
  IndianRupee,
  MapPin,
  Building,
  User,
  FileText,
  Camera,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Download,
  AlertOctagon,
  ExternalLink,
  ShieldCheck,
  Compass,
  ArrowRight,
  Send,
  Layers,
  TrendingUp
} from 'lucide-react';
import { api } from '../services/api.js';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onRefresh?: () => void;
  userRole: UserRole | 'PUBLIC';
  duplicateCandidates?: DuplicateProjectCandidate[];
  initialTab?: 'overview' | 'ai-risk' | 'photos' | 'financials' | 'documents' | 'audit-report' | 'workflow';
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  onClose,
  onRefresh,
  userRole,
  duplicateCandidates = [],
  initialTab = 'overview'
}) => {
  if (!project) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'ai-risk' | 'photos' | 'financials' | 'documents' | 'audit-report' | 'workflow'>(initialTab);
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState(false);
  const [aiReportContent, setAiReportContent] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab, project?.id]);

  const handleGenerateReport = async () => {
    setIsGeneratingAiReport(true);
    setActiveTab('audit-report');
    try {
      const res = await api.generateAiAuditReport(project.id);
      setAiReportContent(res.report);
    } catch (err) {
      console.error(err);
      setAiReportContent('Failed to generate automated AI audit report.');
    } finally {
      setIsGeneratingAiReport(false);
    }
  };

  const handleTransition = async (targetStatus: ProjectStatus, remarks?: string) => {
    setTransitioning(true);
    setTransitionError(null);
    try {
      const res = await api.transitionProject(project.id, {
        targetStatus,
        statutoryRemarks: remarks || `Administrative clearance to ${targetStatus}`
      });
      setTransitionMessage(`Successfully transitioned to ${targetStatus}`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setTransitionError(err.message || 'Transition failed');
    } finally {
      setTransitioning(false);
    }
  };

  const isPublic = userRole === 'PUBLIC';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B3022]/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#F8F9F7] rounded-2xl shadow-2xl border border-[#DDE5D4] overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#1B3022] text-white flex items-center justify-between border-b border-[#2C4A34]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#395C40]/50 text-[#DDE5D4] border border-[#395C40]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#A3B18A] font-bold">{project.projectCode}</span>
                <StatusBadge status={project.status} />
                <RiskBadge level={project.riskAnalysis?.riskLevel || 'LOW'} score={project.riskAnalysis?.overallScore || 20} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5 line-clamp-1">{project.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A3B18A] hover:text-white hover:bg-[#395C40] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#DDE5D4] bg-[#F8F9F7] px-6 overflow-x-auto gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#395C40] text-[#1B3022] bg-white rounded-t-lg'
                : 'border-transparent text-[#588157] hover:text-[#1B3022]'
            }`}
          >
            Overview & Scope
          </button>
          <button
            onClick={() => setActiveTab('ai-risk')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai-risk'
                ? 'border-[#395C40] text-[#1B3022] bg-white rounded-t-lg'
                : 'border-transparent text-[#588157] hover:text-[#1B3022]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
            AI Anomaly & Duplicates
            {(project.riskAnalysis?.overallScore || 0) > 60 && (
              <span className="w-2 h-2 rounded-full bg-[#E07A5F]" />
            )}
          </button>
          {!isPublic && (
            <button
              onClick={() => setActiveTab('workflow')}
              className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'workflow'
                  ? 'border-[#395C40] text-[#1B3022] bg-white rounded-t-lg'
                  : 'border-transparent text-[#588157] hover:text-[#1B3022]'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-[#395C40]" />
              Approval Workflow Chain
            </button>
          )}
          <button
            onClick={() => setActiveTab('photos')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'photos'
                ? 'border-[#395C40] text-[#1B3022] bg-white rounded-t-lg'
                : 'border-transparent text-[#588157] hover:text-[#1B3022]'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-[#588157]" />
            Site Photos ({project.photos.length})
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'financials'
                ? 'border-[#395C40] text-[#1B3022] bg-white rounded-t-lg'
                : 'border-transparent text-[#588157] hover:text-[#1B3022]'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5 text-[#588157]" />
            Financials & Escalation
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'documents'
                ? 'border-[#395C40] text-[#1B3022] bg-white rounded-t-lg'
                : 'border-transparent text-[#588157] hover:text-[#1B3022]'
            }`}
          >
            Documents ({project.documents.length})
          </button>
          {!isPublic && (
            <button
              onClick={() => {
                setActiveTab('audit-report');
                if (!aiReportContent) handleGenerateReport();
              }}
              className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'audit-report'
                  ? 'border-[#395C40] text-[#1B3022] bg-white rounded-t-lg'
                  : 'border-transparent text-[#395C40] hover:text-[#1B3022]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#395C40]" />
              AI Technical Audit Brief
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 bg-white rounded-xl border border-[#DDE5D4] shadow-xs">
                  <div className="text-[11px] font-bold text-[#588157] uppercase tracking-wider">Sanctioned Cost</div>
                  <div className="text-lg font-bold text-[#1B3022] mt-1">
                    ₹{((project.sanctionedAmount || project.estimatedCost) / 100000).toFixed(2)} Lakh
                  </div>
                  <div className="text-xs text-[#588157]">Estimated: ₹{(project.estimatedCost / 100000).toFixed(2)}L</div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#DDE5D4] shadow-xs">
                  <div className="text-[11px] font-bold text-[#588157] uppercase tracking-wider">Funds Utilized</div>
                  <div className="text-lg font-bold text-[#395C40] mt-1">
                    ₹{(project.fundsUtilized / 100000).toFixed(2)} Lakh
                  </div>
                  <div className="text-xs text-[#588157]">
                    {project.sanctionedAmount > 0
                      ? `${Math.round((project.fundsUtilized / project.sanctionedAmount) * 100)}% drawdown`
                      : 'Pending sanction'}
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#DDE5D4] shadow-xs">
                  <div className="text-[11px] font-bold text-[#588157] uppercase tracking-wider">Physical Progress</div>
                  <div className="text-lg font-bold text-[#1B3022] mt-1 flex items-center gap-2">
                    <span>{project.completionPercentage}%</span>
                    <div className="flex-1 bg-[#DDE5D4] h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-[#395C40] rounded-full" style={{ width: `${project.completionPercentage}%` }} />
                    </div>
                  </div>
                  <div className="text-xs text-[#588157]">{project.status}</div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#DDE5D4] shadow-xs">
                  <div className="text-[11px] font-bold text-[#588157] uppercase tracking-wider">Approval Authority</div>
                  <div className="text-sm font-bold text-[#395C40] mt-1">
                    {project.currentAuthorityQueue || 'DISTRICT_AUTHORITY'}
                  </div>
                  <div className="text-[10px] text-[#588157] mt-0.5">Statutory MoSPI Chain</div>
                </div>
              </div>

              {/* Administrative Details */}
              <div className="bg-white rounded-xl border border-[#DDE5D4] shadow-xs overflow-hidden">
                <div className="px-4 py-2.5 bg-[#F8F9F7] text-xs font-bold text-[#1B3022] uppercase tracking-wider border-b border-[#DDE5D4]">
                  Project Stakeholders & Jurisdiction
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DDE5D4] text-xs">
                  <div className="p-4 space-y-2.5">
                    <div>
                      <span className="text-[#588157]">Member of Parliament:</span>
                      <div className="font-bold text-[#1B3022]">{project.mpName}</div>
                    </div>
                    <div>
                      <span className="text-[#588157]">Constituency:</span>
                      <div className="font-bold text-[#1B3022]">{project.constituency}</div>
                    </div>
                    <div>
                      <span className="text-[#588157]">District & State:</span>
                      <div className="font-bold text-[#1B3022]">{project.district}, {project.state}</div>
                    </div>
                  </div>
                  <div className="p-4 space-y-2.5">
                    <div>
                      <span className="text-[#588157]">Implementing Agency:</span>
                      <div className="font-bold text-[#1B3022]">{project.implementingAgencyName}</div>
                    </div>
                    <div>
                      <span className="text-[#588157]">Contractor:</span>
                      <div className="font-bold text-[#1B3022]">{project.vendorName}</div>
                    </div>
                    <div>
                      <span className="text-[#588157]">GPS Coordinates:</span>
                      <div className="font-mono font-bold text-[#1B3022]">
                        {project.latitude.toFixed(4)}° N, {project.longitude.toFixed(4)}° E {project.isGpsImputed ? '(Centroid Imputed)' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-[#DDE5D4] shadow-xs">
                <div className="text-xs font-bold text-[#1B3022] uppercase tracking-wider mb-1">Scope of Developmental Work</div>
                <p className="text-xs text-[#1B3022] leading-relaxed">{project.description}</p>
              </div>
            </div>
          )}

          {/* TAB 2: AI RISK, ANOMALIES & DUPLICATE WORKS */}
          {activeTab === 'ai-risk' && (
            <div className="space-y-6">
              {/* Statistical Baseline & ML Anomaly Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-[#DDE5D4] shadow-xs">
                  <div className="text-xs font-bold text-[#588157] uppercase tracking-wider">Cost Anomaly Metric</div>
                  <div className="text-2xl font-bold text-[#1B3022] mt-1">
                    {project.riskAnalysis?.costAnomalyScore || 10} / 100
                  </div>
                  <div className="text-xs text-[#588157] mt-1">
                    {project.riskAnalysis?.costBaseline?.reason || 'Cost conforms to regional Schedule of Rates baseline.'}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#DDE5D4] shadow-xs">
                  <div className="text-xs font-bold text-[#588157] uppercase tracking-wider">Predictive Delay Forecast</div>
                  <div className="text-2xl font-bold text-[#1B3022] mt-1">
                    {project.riskAnalysis?.delayProbability || 15}%
                  </div>
                  <div className="text-xs text-[#588157] mt-1">
                    {project.riskAnalysis?.delayMetrics?.confidenceInterval || '85% confidence, ±14 days'}
                  </div>
                  {project.riskAnalysis?.delayMetrics?.costOverrunForecast && (
                    <div className="text-[11px] text-[#B85338] font-bold mt-1">
                      Projected Escalation: ₹{project.riskAnalysis.delayMetrics.costOverrunForecast.projectedCostOverrunLakhs}L
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#DDE5D4] shadow-xs">
                  <div className="text-xs font-bold text-[#588157] uppercase tracking-wider">Duplicate Match Risk</div>
                  <div className="text-2xl font-bold text-[#1B3022] mt-1">
                    {duplicateCandidates.length > 0 ? `${duplicateCandidates[0].similarityScore}%` : '0%'}
                  </div>
                  <div className="text-xs text-[#588157] mt-1">
                    {duplicateCandidates.length} spatially proximate candidate(s) found
                  </div>
                </div>
              </div>

              {/* REAL DUPLICATE WORK DETECTION CANDIDATES */}
              <div className="bg-white rounded-xl border border-[#DDE5D4] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#DDE5D4] pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#395C40]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B3022]">
                      Geospatial & Specification Duplicate Work Candidates ({duplicateCandidates.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#588157]">
                    Matching: Proximity + Description + Overlapping Sanction Windows
                  </span>
                </div>

                {duplicateCandidates.length === 0 ? (
                  <div className="p-6 bg-[#F8F9F7] rounded-xl text-center text-xs text-[#588157]">
                    No duplicate work candidates detected within territorial corridor.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {duplicateCandidates.map((dup, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-[#FAF3E0]/60 rounded-xl border border-[#E8DAB2] space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-[#1B3022]">
                            <span className="font-mono">{dup.candidateProject.projectCode}</span>
                            <StatusBadge status={dup.candidateProject.status} />
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E07A5F] text-white">
                              {dup.similarityScore}% Match
                            </span>
                          </div>
                          <span className="font-mono text-[#588157] font-bold">
                            Distance: {dup.distanceMeters}m
                          </span>
                        </div>
                        <div className="font-semibold text-[#1B3022] text-sm">
                          {dup.candidateProject.title}
                        </div>
                        <div className="text-[11px] text-[#588157] flex flex-wrap gap-3">
                          <span>MP: <strong>{dup.candidateProject.mpName}</strong></span>
                          <span>Constituency: <strong>{dup.candidateProject.constituency}</strong></span>
                          <span>Sanction: <strong>₹{((dup.candidateProject.sanctionedAmount || dup.candidateProject.estimatedCost) / 100000).toFixed(1)}L</strong></span>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-[#E8DAB2] text-[11px] text-[#935D26] space-y-1">
                          <strong className="block text-[#1B3022]">Matching Factors Identified:</strong>
                          <ul className="list-disc list-inside space-y-0.5">
                            {dup.matchingFactors.map((fact, fIdx) => (
                              <li key={fIdx}>{fact}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: APPROVAL WORKFLOW CHAIN */}
          {activeTab === 'workflow' && !isPublic && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-[#DDE5D4] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#DDE5D4] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1B3022]">
                      Multi-Authority Approval Workflow Chain
                    </h3>
                    <p className="text-xs text-[#588157] mt-0.5">
                      Statutory Sequence: MP Recommendation &rarr; District Authority &rarr; State Nodal Authority &rarr; Ministry Sanction
                    </p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>

                {transitionMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{transitionMessage}</span>
                  </div>
                )}

                {transitionError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>{transitionError}</span>
                  </div>
                )}

                {/* Authority Level Actions */}
                <div className="p-4 bg-[#F8F9F7] rounded-xl border border-[#DDE5D4] space-y-3">
                  <div className="text-xs font-bold text-[#1B3022] uppercase tracking-wide">
                    Available Statutory Transitions for Your Role ({userRole})
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {userRole === 'ADMIN' && project.status === 'Recommended' && (
                      <button
                        onClick={() => handleTransition('Feasibility Review')}
                        disabled={transitioning}
                        className="px-4 py-2 bg-[#395C40] hover:bg-[#2C4A34] text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                      >
                        Accept for Feasibility Review
                      </button>
                    )}

                    {userRole === 'ADMIN' && (project.status === 'Feasibility Review' || project.status === 'Recommended') && (
                      <>
                        <button
                          onClick={() => handleTransition('Sanctioned')}
                          disabled={transitioning}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                        >
                          Grant District Administrative Sanction (≤ ₹50L)
                        </button>
                        <button
                          onClick={() => handleTransition('Forwarded To State')}
                          disabled={transitioning}
                          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                        >
                          Forward to State Nodal Authority (&gt; ₹50L / Inter-district)
                        </button>
                      </>
                    )}

                    {userRole === 'STATE_NODAL' && project.status === 'Forwarded To State' && (
                      <>
                        <button
                          onClick={() => handleTransition('State Approved')}
                          disabled={transitioning}
                          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                        >
                          Approve State Clearance
                        </button>
                        <button
                          onClick={() => handleTransition('Forwarded To Ministry')}
                          disabled={transitioning}
                          className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                        >
                          Escalate to Central Ministry (Mega / Special Work)
                        </button>
                      </>
                    )}

                    {userRole === 'MINISTRY' && project.status === 'Forwarded To Ministry' && (
                      <button
                        onClick={() => handleTransition('Ministry Approved')}
                        disabled={transitioning}
                        className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                      >
                        Grant Central Ministry Approval
                      </button>
                    )}

                    {userRole === 'ADMIN' && project.status === 'Sanctioned' && (
                      <button
                        onClick={() => handleTransition('Assigned')}
                        disabled={transitioning}
                        className="px-4 py-2 bg-[#2D4A32] hover:bg-[#1B3022] text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                      >
                        Assign Implementing Agency (TSUDA/PRED)
                      </button>
                    )}

                    {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && project.status !== 'Completed' && project.status !== 'Rejected' && (
                      <button
                        onClick={() => handleTransition('Rejected', 'Rejected by authorized vigilance authority')}
                        disabled={transitioning}
                        className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                      >
                        Reject Recommendation
                      </button>
                    )}
                  </div>
                </div>

                {/* Audit Transition Log */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#1B3022] uppercase tracking-wide">
                    Recorded Transition History
                  </div>
                  {project.approvalHistory && project.approvalHistory.length > 0 ? (
                    <div className="space-y-2">
                      {project.approvalHistory.map((h, i) => (
                        <div key={i} className="p-3 bg-white rounded-lg border border-[#DDE5D4] text-xs flex items-center justify-between">
                          <div>
                            <span className="font-bold text-[#1B3022]">{h.fromStatus} &rarr; {h.toStatus}</span>
                            <div className="text-[11px] text-[#588157]">
                              By: {h.transitionedByName} ({h.transitionedByRole}) • {new Date(h.timestamp).toLocaleString('en-IN')}
                            </div>
                            {h.statutoryRemarks && <div className="text-[10px] text-gray-500 italic mt-0.5">{h.statutoryRemarks}</div>}
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EAF0E6] text-[#2D4A32] font-bold">
                            {h.authorityLevel}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-lg border border-[#DDE5D4] text-xs text-gray-500">
                      Standard administrative sanction path recorded under eSAKSHI schema.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SITE PHOTOS */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.photos.map(photo => (
                  <div key={photo.id} className="bg-white rounded-xl border border-[#DDE5D4] overflow-hidden shadow-xs">
                    <img src={photo.url} alt={photo.caption} className="w-full aspect-video object-cover" />
                    <div className="p-3 text-xs space-y-1">
                      <div className="font-bold text-[#1B3022]">{photo.caption}</div>
                      <div className="text-[11px] text-[#588157]">Stage: {photo.stage} | Uploaded: {photo.uploadedAt}</div>
                      {photo.latitude && photo.longitude && (
                        <div className="text-[10px] font-mono text-gray-500">
                          {photo.latitude.toFixed(4)}° N, {photo.longitude.toFixed(4)}° E
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIALS */}
          {activeTab === 'financials' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-[#DDE5D4] shadow-xs">
                  <div className="text-xs font-bold text-[#588157] uppercase">Sanctioned</div>
                  <div className="text-xl font-bold text-[#1B3022] mt-1">₹{((project.sanctionedAmount || project.estimatedCost) / 100000).toFixed(2)}L</div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-[#DDE5D4] shadow-xs">
                  <div className="text-xs font-bold text-[#588157] uppercase">Utilized</div>
                  <div className="text-xl font-bold text-[#395C40] mt-1">₹{(project.fundsUtilized / 100000).toFixed(2)}L</div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-[#DDE5D4] shadow-xs">
                  <div className="text-xs font-bold text-[#588157] uppercase">Overrun Forecast</div>
                  <div className="text-xl font-bold text-[#B85338] mt-1">
                    ₹{project.riskAnalysis?.delayMetrics?.costOverrunForecast?.projectedCostOverrunLakhs || 0}L
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-2 text-xs">
              {project.documents.map(doc => (
                <div key={doc.id} className="p-3 bg-white rounded-xl border border-[#DDE5D4] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#1B3022]">{doc.name}</div>
                    <div className="text-[11px] text-[#588157]">{doc.type} • {doc.fileSize}</div>
                  </div>
                  <button className="px-3 py-1.5 bg-[#F8F9F7] border border-[#DDE5D4] rounded-lg font-semibold text-[#1B3022] hover:bg-[#EAF0E6]">
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: AI REPORT */}
          {activeTab === 'audit-report' && !isPublic && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1B3022] uppercase">Technical Audit Brief</span>
                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingAiReport}
                  className="px-3 py-1.5 bg-[#395C40] text-white rounded-lg text-xs font-bold hover:bg-[#2C4A34]"
                >
                  {isGeneratingAiReport ? 'Generating...' : 'Re-Generate'}
                </button>
              </div>
              <div className="p-5 bg-white border border-[#DDE5D4] rounded-xl font-mono text-xs whitespace-pre-wrap">
                {aiReportContent || 'Generating evaluation brief...'}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#F8F9F7] border-t border-[#DDE5D4] flex items-center justify-between text-xs text-[#588157]">
          <span className="font-mono">Project UID: {project.id}</span>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-white border border-[#DDE5D4] text-[#1B3022] font-bold hover:bg-[#EAF0E6] cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
