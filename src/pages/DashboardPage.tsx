import React from 'react';
import { Project, RiskAlert, DashboardSummary, UserRole } from '../types/index.js';
import { StatusBadge, VerificationBadge } from '../components/Badges.js';
import { MonthlyTrendChart } from '../components/MonthlyTrendChart.js';
import { RadarVisualizer } from '../components/RadarVisualizer.js';
import { PlainTooltip } from '../components/PlainTooltip.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  FolderGit2,
  AlertTriangle,
  IndianRupee,
  ArrowRight,
  TrendingUp,
  FilePlus2,
  ChevronRight,
  MapPin,
  ShieldCheck
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
  const { language, t, translateRole, translateStatus } = useLanguage();

  const highRiskProjects = projects
    .filter(p => p.riskAnalysis.overallScore > 40)
    .sort((a, b) => b.riskAnalysis.overallScore - a.riskAnalysis.overallScore)
    .slice(0, 5);

  const pendingAlerts = alerts
    .filter(a => a.status === 'New' || a.status === 'Under Review')
    .slice(0, 5);

  const sanctionedCr = summary ? (summary.totalFundsSanctioned / 10000000).toFixed(2) : '0.00';
  const utilizedCr = summary ? (summary.totalFundsUtilized / 10000000).toFixed(2) : '0.00';
  const utilizationRate = summary && summary.totalFundsSanctioned > 0
    ? Math.round((summary.totalFundsUtilized / summary.totalFundsSanctioned) * 100)
    : 0;

  const getDashboardTitle = () => {
    switch (userRole) {
      case 'MP':
        return t.mpOverviewTitle;
      case 'ADMIN':
        return t.adminOverviewTitle;
      case 'AGENCY':
        return t.agencyOverviewTitle;
      default:
        return t.publicOverviewTitle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Official Government Banner */}
      <div className="bg-govt-navy text-white rounded-xl p-5 sm:p-6 shadow-sm border border-govt-navy-dark flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-panel-bg border border-white/20">
              {userRole === 'PUBLIC' ? t.citizenViewTag : `${translateRole(userRole)} ${t.officerConsoleTag}`}
            </span>
            <span className="text-xs text-panel-bg/80">
              {t.govIndia} &bull; {t.mospiTitle}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-2 text-white">
            {getDashboardTitle()}
          </h1>
          <p className="text-xs text-panel-bg/90 mt-1 max-w-2xl leading-relaxed">
            {t.dashboardSubheading}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {(userRole === 'MP' || userRole === 'ADMIN') && (
            <button
              onClick={onNavigateToRecommend}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-govt-saffron hover:bg-govt-saffron-hover text-govt-navy-dark rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>{t.recommendNewWork}</span>
            </button>
          )}

          <button
            onClick={onNavigateToMap}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold border border-white/25 shadow-xs transition-colors cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-govt-saffron" />
            <span>{t.interactiveMapView}</span>
          </button>
        </div>
      </div>

      {/* Top 4 Essential Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Works */}
        <div className="bg-white rounded-xl p-4 border border-slate-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-muted uppercase tracking-wider">
              {t.totalProjects}
            </span>
            <div className="p-2 rounded-lg bg-panel-bg border border-slate-border text-govt-navy">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-body mt-2">{summary?.totalProjects ?? 0}</div>
          <div className="text-[11px] text-slate-muted mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-status-verified">
              {summary?.completedProjects ?? 0} {language === 'hi' ? 'पूर्ण' : 'Completed'}
            </span>
            <span>&bull;</span>
            <span className="font-semibold text-slate-body">
              {summary?.activeProjects ?? 0} {language === 'hi' ? 'सक्रिय' : 'Active'}
            </span>
          </div>
        </div>

        {/* Card 2: Sanctioned Allocation */}
        <div className="bg-white rounded-xl p-4 border border-slate-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-muted uppercase tracking-wider">
              {t.sanctionedAllocation}
            </span>
            <div className="p-2 rounded-lg bg-panel-bg border border-slate-border text-status-review">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-body mt-2">
            ₹{sanctionedCr} <span className="text-xs font-normal text-slate-muted">{language === 'hi' ? 'करोड़' : 'Cr'}</span>
          </div>
          <div className="text-[11px] text-slate-muted mt-1">
            {language === 'hi'
              ? `${summary?.totalProjects ?? 0} स्थानीय विकास कार्यों में`
              : `Across ${summary?.totalProjects ?? 0} local development works`}
          </div>
        </div>

        {/* Card 3: Funds Utilized */}
        <div className="bg-white rounded-xl p-4 border border-slate-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-muted uppercase tracking-wider">
              {t.fundsUtilized}
            </span>
            <div className="p-2 rounded-lg bg-panel-bg border border-slate-border text-govt-navy">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-govt-navy mt-2">
            ₹{utilizedCr} <span className="text-xs font-normal text-slate-muted">{language === 'hi' ? 'करोड़' : 'Cr'}</span>
          </div>
          <div className="text-[11px] text-slate-muted mt-1 flex items-center gap-2">
            <span>{t.utilizationRate}: <strong>{utilizationRate}%</strong></span>
            <div className="w-14 bg-slate-border h-1.5 rounded-full overflow-hidden">
              <div className="bg-govt-navy h-full rounded-full" style={{ width: `${utilizationRate}%` }} />
            </div>
          </div>
        </div>

        {/* Card 4: Under Review / Flagged */}
        <div className="bg-white rounded-xl p-4 border border-slate-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-status-review uppercase tracking-wider">
              {language === 'hi' ? 'समीक्षा स्थिति' : 'Review Status'}
            </span>
            <div className="p-2 rounded-lg bg-panel-bg border border-slate-border text-status-review">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-status-review mt-2">
            {summary?.totalPendingReviews ?? 0}
            <span className="text-xs font-normal text-slate-muted ml-1.5">{language === 'hi' ? 'नोटिस' : 'notices'}</span>
          </div>
          <div className="text-[11px] text-slate-muted mt-1 flex items-center gap-1.5">
            <span className="text-status-flagged font-semibold">
              {summary?.highRiskProjectsCount ?? 0} {language === 'hi' ? 'चिह्नित' : 'Flagged'}
            </span>
            <span>&bull;</span>
            <span className="text-status-review font-semibold">
              {summary?.delayedProjects ?? 0} {language === 'hi' ? 'विलंबित' : 'Delayed'}
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Metric Radar Chart Performance Section */}
      <RadarVisualizer projects={projects} defaultMode="CONSTITUENCY" />

      {/* Monthly Chronological Sanctions vs Completed Timeline Chart */}
      <MonthlyTrendChart projects={projects} />

      {/* Plain Language Review Summary Section */}
      <div className="bg-panel-bg rounded-xl p-5 border border-slate-border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-border gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-panel-bg border border-slate-border text-govt-navy">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h2 className="text-xs font-bold tracking-tight text-govt-navy uppercase">
                {language === 'hi' ? 'सतत निगरानी एवं निरीक्षण सारांश' : 'Continuous Oversight & Inspection Summary'}
              </h2>
              <PlainTooltip
                term={language === 'hi' ? 'सतत निगरानी' : 'Continuous Oversight'}
                explanation={language === 'hi'
                  ? 'स्वचालित नियमित जांच ठेकेदार के बिलों का मानक अनुसूची से मिलान करती है और साइट की तस्वीरों को जीपीएस निर्देशांक से सत्यापित करती है।'
                  : 'Automated routine checks verify contractor invoices against standard district schedules and match site photographs with GPS coordinates.'}
              />
            </div>
            <p className="text-xs text-slate-muted mt-0.5">
              {language === 'hi'
                ? 'ज़िला अभियंता समीक्षा या ज़मीनी निरीक्षण के लिए चिह्नित वस्तुओं का सारांश।'
                : 'Summary of items identified for district engineer review or field inspection.'}
            </p>
          </div>

          <button
            onClick={onNavigateToAnomalies}
            className="text-xs text-govt-navy hover:underline flex items-center gap-1 font-semibold cursor-pointer self-start sm:self-auto"
          >
            <span>{t.reviewAlerts}</span>
            <ArrowRight className="w-3.5 h-3.5 text-govt-saffron" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="p-3 bg-white rounded-lg border border-slate-border">
            <div className="text-slate-muted text-[11px] font-medium">
              {language === 'hi' ? 'लागत सत्यापन' : 'Cost Checks'}
            </div>
            <div className="text-xl font-bold text-status-review mt-1">
              {summary?.costAnomaliesCount ?? 0}
            </div>
            <div className="text-[10px] text-slate-muted mt-0.5">
              {language === 'hi' ? 'मानक दर से अधिक संभावित' : 'May exceed standard rate'}
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-border">
            <div className="text-slate-muted text-[11px] font-medium">
              {language === 'hi' ? 'संभावित डुप्लिकेट' : 'Potential Duplicates'}
            </div>
            <div className="text-xl font-bold text-govt-navy mt-1">
              {summary?.possibleDuplicatesCount ?? 0}
            </div>
            <div className="text-[10px] text-slate-muted mt-0.5">
              {language === 'hi' ? 'निकटवर्ती या समान प्रस्ताव' : 'Nearby or similar proposal'}
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-border">
            <div className="text-slate-muted text-[11px] font-medium">
              {language === 'hi' ? 'तस्वीर एवं स्थान सत्यापन' : 'Photo & Location Checks'}
            </div>
            <div className="text-xl font-bold text-status-flagged mt-1">
              {(summary?.photoAnomaliesCount ?? 0) + (summary?.locationMismatchesCount ?? 0)}
            </div>
            <div className="text-[10px] text-slate-muted mt-0.5">
              {language === 'hi' ? 'स्पष्ट जीपीएस छवि प्रतीक्षित' : 'Awaiting clear GPS image'}
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-border">
            <div className="text-slate-muted text-[11px] font-medium">
              {language === 'hi' ? 'समयसीमा अनुवर्ती' : 'Timeline Follow-ups'}
            </div>
            <div className="text-xl font-bold text-slate-body mt-1">
              {summary?.delayRisksCount ?? 0}
            </div>
            <div className="text-[10px] text-slate-muted mt-0.5">
              {language === 'hi' ? 'लक्षित समयसीमा समाप्त' : 'Past target schedule date'}
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Works Under Review and Active Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Under Review */}
        <div className="bg-white rounded-xl border border-slate-border shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-panel-bg border-b border-slate-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-review" />
              <h2 className="text-xs font-bold text-slate-body uppercase tracking-wider">
                {t.worksRequiringAttention}
              </h2>
            </div>
            <span className="text-[11px] text-slate-muted">
              {language === 'hi' ? `प्रदर्शित: ${highRiskProjects.length}` : `Showing ${highRiskProjects.length}`}
            </span>
          </div>

          <div className="divide-y divide-slate-border flex-1">
            {highRiskProjects.map(project => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="p-4 hover:bg-panel-bg cursor-pointer transition-colors flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-muted text-[11px]">
                      {project.projectCode || project.id}
                    </span>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="font-bold text-slate-body truncate">{project.title}</div>
                  <div className="text-[11px] text-slate-muted">
                    {t.district}: {project.district} &bull; {t.sanctionedAmount}: ₹{(project.sanctionedAmount / 100000).toFixed(1)} {language === 'hi' ? 'लाख' : 'L'} &bull; {t.progress}: {project.completionPercentage}%
                  </div>
                  <div className="text-[11px] text-status-review line-clamp-1">
                    {language === 'hi'
                      ? 'नोटिस: इस कार्य की मील का पत्थर समयसीमा अथवा दस्तावेजों की समीक्षा आवश्यक हो सकती है।'
                      : 'Notice: This project may need review due to milestone timeline or documentation.'}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <VerificationBadge status={project.riskAnalysis.overallScore > 60 ? 'Flagged' : 'Under Review'} />
                  <div className="text-[11px] text-govt-navy font-semibold mt-2 flex items-center justify-end gap-0.5">
                    <span>{language === 'hi' ? 'निरीक्षण' : 'Inspect'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Inspection Notices */}
        <div className="bg-white rounded-xl border border-slate-border shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-panel-bg border-b border-slate-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-govt-navy" />
              <h2 className="text-xs font-bold text-slate-body uppercase tracking-wider">
                {t.recentAlerts}
              </h2>
            </div>
            <button
              onClick={onNavigateToAnomalies}
              className="text-[11px] font-semibold text-govt-navy hover:underline cursor-pointer"
            >
              {t.reviewAlerts} ({alerts.length})
            </button>
          </div>

          <div className="divide-y divide-slate-border flex-1">
            {pendingAlerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-muted">
                {t.noPendingAlerts}
              </div>
            ) : (
              pendingAlerts.map(alert => {
                const matchedProject = projects.find(p => p.id === alert.projectId);
                return (
                  <div
                    key={alert.id}
                    onClick={() => matchedProject && onSelectProject(matchedProject)}
                    className="p-4 hover:bg-panel-bg cursor-pointer transition-colors text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-body truncate max-w-[220px]">
                        {alert.projectTitle}
                      </span>
                      <VerificationBadge
                        status={alert.status === 'New' ? 'Flagged' : 'Under Review'}
                      />
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-muted">
                      <span className="text-govt-navy font-medium">{alert.alertType}</span>
                      <span>&bull;</span>
                      <span>{alert.district}</span>
                      <span>&bull;</span>
                      <span>{alert.agencyName}</span>
                    </div>

                    <div className="text-[11px] text-slate-body bg-panel-bg p-2.5 rounded-lg border border-slate-border">
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
