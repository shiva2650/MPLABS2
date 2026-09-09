import React, { useState, useMemo } from 'react';
import { Project, UserRole } from '../types/index.js';
import { RiskBadge, StatusBadge } from '../components/Badges.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  Search,
  Download,
  FilePlus2,
  ArrowLeft
} from 'lucide-react';

interface ProjectsPageProps {
  projects: Project[];
  userRole: UserRole | 'PUBLIC';
  onSelectProject: (project: Project) => void;
  onNavigateToRecommend?: () => void;
  onBackToDashboard?: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  userRole,
  onSelectProject,
  onNavigateToRecommend,
  onBackToDashboard
}) => {
  const { language, t, translateStatus, translateRiskLevel, translateCategory } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [sortField, setSortField] = useState<'code' | 'cost' | 'progress' | 'risk'>('risk');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Unique lists for filter dropdowns
  const rawCategories = useMemo(() => Array.from(new Set(projects.map(p => p.category))), [projects]);
  const rawDistricts = useMemo(() => Array.from(new Set(projects.map(p => p.district))), [projects]);
  const statuses = ['Ongoing', 'Completed', 'Delayed', 'Assigned', 'Sanctioned', 'Recommended'];
  const risks = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  // Filter & Sort Logic
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch =
        searchTerm.trim() === '' ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.locationAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vendorName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchDistrict = districtFilter === 'All' || p.district === districtFilter;
      const matchRisk = riskFilter === 'All' || p.riskAnalysis.riskLevel === riskFilter;

      return matchSearch && matchCategory && matchStatus && matchDistrict && matchRisk;
    }).sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;
      if (sortField === 'code') {
        valA = a.projectCode;
        valB = b.projectCode;
      } else if (sortField === 'cost') {
        valA = a.sanctionedAmount || a.estimatedCost;
        valB = b.sanctionedAmount || b.estimatedCost;
      } else if (sortField === 'progress') {
        valA = a.completionPercentage;
        valB = b.completionPercentage;
      } else if (sortField === 'risk') {
        valA = a.riskAnalysis.overallScore;
        valB = b.riskAnalysis.overallScore;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [projects, searchTerm, categoryFilter, statusFilter, districtFilter, riskFilter, sortField, sortOrder]);

  const handleExportCSV = () => {
    const headers = ['Project Code', 'Title', 'Category', 'District', 'MP', 'Cost (INR)', 'Utilized (INR)', 'Status', 'Progress %', 'Risk Score', 'Risk Level'];
    const rows = filteredProjects.map(p => [
      p.projectCode,
      `"${p.title.replace(/"/g, '""')}"`,
      p.category,
      p.district,
      `"${p.mpName}"`,
      p.sanctionedAmount || p.estimatedCost,
      p.fundsUtilized,
      p.status,
      p.completionPercentage,
      p.riskAnalysis.overallScore,
      p.riskAnalysis.riskLevel
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MPLADS_Projects_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Persistent Back Button */}
      {onBackToDashboard && (
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-govt-navy bg-white border border-slate-border hover:bg-panel-bg rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← {t.backToOverview}</span>
          </button>
          <span className="text-xs text-slate-muted">
            {t.home} &gt; {t.projects}
          </span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-body tracking-tight">{t.projectsPageTitle}</h1>
          <p className="text-xs text-slate-muted">
            {t.projectsPageSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-border rounded-lg text-xs font-semibold text-slate-body hover:bg-panel-bg shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-muted" />
            <span>{t.exportCsv}</span>
          </button>

          {(userRole === 'MP' || userRole === 'ADMIN') && onNavigateToRecommend && (
            <button
              onClick={onNavigateToRecommend}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-govt-navy hover:bg-govt-navy-light text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>{t.recommendWork}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-border shadow-xs space-y-3">
        {/* Search row */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-muted">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t.searchProjectsPlaceholder}
            className="w-full pl-9 pr-3 py-2 border border-slate-border rounded-xl text-xs text-slate-body bg-panel-bg focus:bg-white focus:ring-2 focus:ring-govt-navy focus:outline-hidden"
          />
        </div>

        {/* Filter chips row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-muted mb-1 uppercase tracking-wider">{t.category}</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-panel-bg border border-slate-border rounded-lg text-xs text-slate-body"
            >
              <option value="All">{t.allCategories}</option>
              {rawCategories.map(c => (
                <option key={c} value={c}>{translateCategory(c)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-muted mb-1 uppercase tracking-wider">{t.status}</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-panel-bg border border-slate-border rounded-lg text-xs text-slate-body"
            >
              <option value="All">{t.allStatuses}</option>
              {statuses.map(s => (
                <option key={s} value={s}>{translateStatus(s)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-muted mb-1 uppercase tracking-wider">{t.district}</label>
            <select
              value={districtFilter}
              onChange={e => setDistrictFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-panel-bg border border-slate-border rounded-lg text-xs text-slate-body"
            >
              <option value="All">{t.allDistricts}</option>
              {rawDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-muted mb-1 uppercase tracking-wider">{t.riskLevel}</label>
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-panel-bg border border-slate-border rounded-lg text-xs text-slate-body"
            >
              <option value="All">{t.allRiskLevels}</option>
              {risks.map(r => (
                <option key={r} value={r}>{translateRiskLevel(r)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter Stats Summary */}
      <div className="flex items-center justify-between text-xs text-slate-muted px-1">
        <div>
          {language === 'hi' ? (
            <>
              {projects.length} विकास कार्यों में से <strong>{filteredProjects.length}</strong> प्रदर्शित
            </>
          ) : (
            <>
              Showing <strong>{filteredProjects.length}</strong> of {projects.length} developmental works
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-muted">{t.sortBy}:</span>
          <button
            onClick={() => {
              setSortField('risk');
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            }}
            className={`font-semibold underline cursor-pointer ${sortField === 'risk' ? 'text-slate-body' : 'text-slate-muted'}`}
          >
            {t.sortRisk} ({sortOrder})
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-panel-bg text-slate-muted font-bold uppercase text-[10px] border-b border-slate-border tracking-wider">
              <tr>
                <th className="p-3">{t.workId}</th>
                <th className="p-3">{language === 'hi' ? 'कार्य शीर्षक एवं श्रेणी' : 'Work Title & Category'}</th>
                <th className="p-3">{language === 'hi' ? 'स्थान एवं ज़िला' : 'Location & District'}</th>
                <th className="p-3 text-right">{language === 'hi' ? 'लागत (लाख)' : 'Cost (Lakh)'}</th>
                <th className="p-3">{t.physicalProgress}</th>
                <th className="p-3">{t.status}</th>
                <th className="p-3 text-center">{language === 'hi' ? 'एआई जोखिम' : 'AI Risk'}</th>
                <th className="p-3 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-border">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-muted text-xs">
                    {t.noProjectsFound}
                  </td>
                </tr>
              ) : (
                filteredProjects.map(project => (
                  <tr
                    key={project.id}
                    onClick={() => onSelectProject(project)}
                    className="hover:bg-panel-bg cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono font-semibold text-slate-muted whitespace-nowrap">
                      {project.projectCode}
                    </td>

                    <td className="p-3 max-w-xs">
                      <div className="font-bold text-slate-body line-clamp-1">{project.title}</div>
                      <div className="text-[11px] text-slate-muted mt-0.5">{translateCategory(project.category)}</div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <div className="text-slate-body font-medium">{project.district}</div>
                      <div className="text-[10px] text-slate-muted">{project.constituency}</div>
                    </td>

                    <td className="p-3 text-right whitespace-nowrap font-mono font-semibold text-slate-body">
                      ₹{((project.sanctionedAmount || project.estimatedCost) / 100000).toFixed(2)} {language === 'hi' ? 'लाख' : 'L'}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-border h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              project.status === 'Delayed'
                                ? 'bg-status-flagged'
                                : 'bg-govt-navy'
                            }`}
                            style={{ width: `${project.completionPercentage}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-body font-medium">
                          {project.completionPercentage}%
                        </span>
                      </div>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <StatusBadge status={project.status} />
                    </td>

                    <td className="p-3 text-center whitespace-nowrap">
                      <RiskBadge level={project.riskAnalysis.riskLevel} score={project.riskAnalysis.overallScore} />
                    </td>

                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectProject(project);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-govt-navy bg-panel-bg border border-slate-border rounded-lg hover:bg-white transition-colors cursor-pointer"
                      >
                        {language === 'hi' ? 'ऑडिट विवरण' : 'Audit Details'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
