import React from 'react';
import { Project, RiskAlert, DashboardSummary, UserRole } from '../types/index.js';
import { RiskBadge, StatusBadge } from '../components/Badges.js';
import {
  FolderGit2,
  IndianRupee,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FilePlus2,
  MapPin,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

interface DashboardPageProps {
  summary: DashboardSummary | null;
  projects: Project[];
  alerts: RiskAlert[];
  userRole: UserRole | 'PUBLIC';
  onSelectProject: (project: Project) => void;
  onNavigateToAnomalies: () => void;
  onNavigateToRecommend: () => void;
  onNavigateToMap: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  projects,
  alerts,
  userRole,
  onSelectProject,
  onNavigateToAnomalies,
  onNavigateToRecommend,
  onNavigateToMap
}) => {
  const highRiskProjects = projects
    .filter(p => (p.riskAnalysis?.overallScore || 0) > 50)
    .sort((a, b) => (b.riskAnalysis?.overallScore || 0) - (a.riskAnalysis?.overallScore || 0))
    .slice(0, 5);

  const pendingAlerts = alerts
    .filter(a => a.status === 'New' || a.status === 'Under Review')
    .slice(0, 5);

  const sanctionedCr = summary ? (summary.totalFundsSanctioned / 10000000).toFixed(2) : '0.00';
  const utilizedCr = summary ? (summary.totalFundsUtilized / 10000000).toFixed(2) : '0.00';
  const utilizationRate = summary && summary.totalFundsSanctioned > 0
    ? Math.round((summary.totalFundsUtilized / summary.totalFundsSanctioned) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-[#1B3022] text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#395C40] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#395C40] text-white font-semibold border border-[#A3B18A]/40">
              {userRole === 'PUBLIC' ? 'Citizen Transparency' : `${userRole} Console`}
            </span>
            <span className="text-xs text-[#C8D5B9]">MoSPI MPLADS Real-Time Integrity Stream</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1.5 text-white">
            {userRole === 'MINISTRY' && 'Central Ministry Oversight & National Vigilance Dashboard'}
            {userRole === 'STATE_NODAL' && 'State Nodal Authority Planning & Clearance Dashboard'}
            {userRole === 'MP' && 'Constituency Development & Integrity Dashboard'}
            {userRole === 'ADMIN' && 'District Authority Executive Vigilance Dashboard'}
            {userRole === 'AGENCY' && 'Implementing Agency Workdesk & Field Monitoring'}
            {userRole === 'PUBLIC' && 'Public Project Monitoring & Grievance Portal'}
          </h1>
          <p className="text-xs text-[#DDE5D4] mt-1 max-w-2xl leading-relaxed">
            AI-assisted surveillance of public civil works, fund utilization, and multi-authority approval state transitions under MoSPI guidelines.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {(userRole === 'MP' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
            <button
              onClick={onNavigateToRecommend}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#A3B18A] hover:bg-[#b5c29d] text-[#1B3022] rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Recommend New Work</span>
            </button>
          )}
          <button
            onClick={onNavigateToMap}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#395C40] hover:bg-[#4a7251] text-white rounded-xl text-xs font-semibold border border-[#C8D5B9]/40 shadow-xs transition-colors cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            <span>GIS Map View</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#DDE5D4] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#588157] uppercase tracking-wider">Total Works</span>
            <FolderGit2 className="w-4 h-4 text-[#263D2E]" />
          </div>
          <div className="text-2xl font-bold text-[#1B3022] mt-2">{summary?.totalProjects ?? 0}</div>
          <div className="text-[11px] text-[#588157] mt-1">
            <span className="font-semibold text-[#395C40]">{summary?.completedProjects ?? 0} Completed</span> • <span>{summary?.activeProjects ?? 0} Active</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#DDE5D4] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#588157] uppercase tracking-wider">Sanctioned Amount</span>
            <IndianRupee className="w-4 h-4 text-[#935D26]" />
          </div>
          <div className="text-2xl font-bold text-[#1B3022] mt-2">₹{sanctionedCr} <span className="text-xs font-normal text-[#588157]">Cr</span></div>
          <div className="text-[11px] text-[#588157] mt-1">Across all parliamentary works</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#DDE5D4] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#588157] uppercase tracking-wider">Funds Utilized</span>
            <TrendingUp className="w-4 h-4 text-[#395C40]" />
          </div>
          <div className="text-2xl font-bold text-[#395C40] mt-2">₹{utilizedCr} <span className="text-xs font-normal text-[#588157]">Cr</span></div>
          <div className="text-[11px] text-[#588157] mt-1">Utilization Drawdown: <strong>{utilizationRate}%</strong></div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#FAD2D2] bg-red-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#B85338] uppercase tracking-wider">AI Vigilance Flags</span>
            <ShieldAlert className="w-4 h-4 text-[#B85338]" />
          </div>
          <div className="text-2xl font-bold text-[#B85338] mt-2">
            {summary?.highRiskProjectsCount ?? 0}
            <span className="text-xs font-normal text-[#588157] ml-1">High Risk</span>
          </div>
          <div className="text-[11px] text-[#588157] mt-1">
            <span className="text-[#B85338] font-semibold">{summary?.delayedProjects ?? 0} Delayed</span> • <span>{summary?.totalPendingReviews ?? 0} Alerts</span>
          </div>
        </div>
      </div>

      {/* Anomaly Breakdown */}
      <div className="bg-[#2D3A3A] text-white rounded-2xl p-5 shadow-sm border border-[#395C40]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#395C40] gap-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-[#3A5A40] rounded text-white flex items-center justify-center text-[10px] font-bold">AI</span>
            <h2 className="text-xs font-bold tracking-tight text-[#DDE5D4] uppercase">
              ML-Based Anomaly & Risk Breakdown (Isolation Forest + Forecasting)
            </h2>
          </div>
          <button onClick={onNavigateToAnomalies} className="text-xs text-[#A3B18A] hover:text-white flex items-center gap-1 font-semibold cursor-pointer">
            <span>Open Detailed Anomaly Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
          <div className="p-3 bg-[#1B3022]/60 rounded-xl border border-[#395C40]/60">
            <div className="text-[#A3B18A] text-[11px]">Cost Anomalies</div>
            <div className="text-xl font-bold text-[#E8DAB2] mt-1">{summary?.costAnomaliesCount ?? 0}</div>
            <div className="text-[10px] text-[#DDE5D4]/70 mt-0.5">Z-score & ML Outliers</div>
          </div>
          <div className="p-3 bg-[#1B3022]/60 rounded-xl border border-[#395C40]/60">
            <div className="text-[#A3B18A] text-[11px]">Duplicate Works</div>
            <div className="text-xl font-bold text-[#A3B18A] mt-1">{summary?.possibleDuplicatesCount ?? 0}</div>
            <div className="text-[10px] text-[#DDE5D4]/70 mt-0.5">Spatial & overlap matches</div>
          </div>
          <div className="p-3 bg-[#1B3022]/60 rounded-xl border border-[#395C40]/60">
            <div className="text-[#A3B18A] text-[11px]">Photo/GPS Mismatches</div>
            <div className="text-xl font-bold text-[#E07A5F] mt-1">{(summary?.photoAnomaliesCount ?? 0) + (summary?.locationMismatchesCount ?? 0)}</div>
            <div className="text-[10px] text-[#DDE5D4]/70 mt-0.5">dHash reuse & GPS &gt;500m</div>
          </div>
          <div className="p-3 bg-[#1B3022]/60 rounded-xl border border-[#395C40]/60">
            <div className="text-[#A3B18A] text-[11px]">Delay & Overrun Risks</div>
            <div className="text-xl font-bold text-[#DDE5D4] mt-1">{summary?.delayRisksCount ?? 0}</div>
            <div className="text-[10px] text-[#DDE5D4]/70 mt-0.5">S-curve time-series forecast</div>
          </div>
        </div>
      </div>

      {/* High Risk Works & Alerts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#DDE5D4] shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-[#FDFDFB] border-b border-[#DDE5D4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#B85338]" />
              <h2 className="text-xs font-bold text-[#1B3022] uppercase tracking-wider">
                Flagged Works Requiring Technical Audit
              </h2>
            </div>
            <span className="text-[11px] text-[#588157] font-mono">Top {highRiskProjects.length}</span>
          </div>
          <div className="divide-y divide-[#F0F2ED] flex-1">
            {highRiskProjects.map(project => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="p-4 hover:bg-[#F8F9F7] cursor-pointer transition-colors flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-[#588157] text-[11px]">{project.projectCode}</span>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="font-bold text-[#1B3022] truncate">{project.title}</div>
                  <div className="text-[11px] text-[#588157]">
                    District: {project.district} | Cost: ₹{((project.sanctionedAmount || project.estimatedCost) / 100000).toFixed(1)}L | Progress: {project.completionPercentage}%
                  </div>
                  <div className="text-[11px] text-[#B85338] italic line-clamp-1">
                    {project.riskAnalysis?.reasons[0]}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <RiskBadge level={project.riskAnalysis?.riskLevel || 'LOW'} score={project.riskAnalysis?.overallScore || 20} />
                  <div className="text-[10px] text-[#395C40] font-bold mt-2 flex items-center justify-end gap-0.5">
                    <span>Audit</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#DDE5D4] shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-[#FDFDFB] border-b border-[#DDE5D4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#935D26]" />
              <h2 className="text-xs font-bold text-[#1B3022] uppercase tracking-wider">
                Active AI Vigilance Alerts
              </h2>
            </div>
            <button onClick={onNavigateToAnomalies} className="text-[11px] font-semibold text-[#395C40] hover:underline cursor-pointer">
              View All ({alerts.length})
            </button>
          </div>
          <div className="divide-y divide-[#F0F2ED] flex-1">
            {pendingAlerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#588157]">
                No pending alerts in queue.
              </div>
            ) : (
              pendingAlerts.map(alert => {
                const matchedProject = projects.find(p => p.id === alert.projectId);
                return (
                  <div
                    key={alert.id}
                    onClick={() => matchedProject && onSelectProject(matchedProject)}
                    className="p-4 hover:bg-[#F8F9F7] cursor-pointer transition-colors text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1B3022]">{alert.projectTitle}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF3E0] text-[#935D26] border border-[#E8DAB2]">
                        {alert.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#588157] font-mono">
                      <span className="text-[#935D26] font-semibold">{alert.alertType}</span>
                      <span>•</span>
                      <span>{alert.district}</span>
                      {alert.notificationDispatched && (
                        <span className="text-emerald-700 font-bold ml-auto">✓ Dispatched (Email/SMS)</span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#1B3022] bg-[#F8F9F7] p-2.5 rounded-lg border border-[#DDE5D4]">
                      {alert.reason}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
