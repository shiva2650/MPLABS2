import React, { useState, useMemo } from 'react';
import { Project, UserRole } from '../types/index.js';
import { RiskBadge, StatusBadge } from '../components/Badges.js';
import { Search, Download, FilePlus2 } from 'lucide-react';

interface ProjectsPageProps {
  projects: Project[];
  userRole: UserRole | 'PUBLIC';
  onSelectProject: (project: Project) => void;
  onNavigateToRecommend?: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  userRole,
  onSelectProject,
  onNavigateToRecommend
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  const categories = useMemo(() => ['All', ...Array.from(new Set(projects.map(p => p.category)))], [projects]);
  const districts = useMemo(() => ['All', ...Array.from(new Set(projects.map(p => p.district)))], [projects]);
  const statuses = ['All', 'Recommended', 'Sanctioned', 'Ongoing', 'Delayed', 'Completed', 'Under Review'];
  const risks = ['All', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch =
        searchTerm.trim() === '' ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.locationAddress.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === 'All' || p.category === categoryFilter;
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchDistrict = districtFilter === 'All' || p.district === districtFilter;
      const matchRisk = riskFilter === 'All' || p.riskAnalysis?.riskLevel === riskFilter;
      return matchSearch && matchCategory && matchStatus && matchDistrict && matchRisk;
    });
  }, [projects, searchTerm, categoryFilter, statusFilter, districtFilter, riskFilter]);

  const handleExportCSV = () => {
    const headers = ['Code', 'Title', 'Category', 'District', 'Cost', 'Progress', 'Status', 'Risk'];
    const rows = filteredProjects.map(p => [
      p.projectCode,
      `"${p.title.replace(/"/g, '""')}"`,
      p.category,
      p.district,
      p.sanctionedAmount || p.estimatedCost,
      p.completionPercentage,
      p.status,
      p.riskAnalysis?.overallScore || 20
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'MPLADS_Projects.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1B3022] tracking-tight">MPLADS Works Directory</h1>
          <p className="text-xs text-[#588157]">Official register of sanctioned and ongoing works</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DDE5D4] rounded-lg text-xs font-semibold text-[#1B3022] hover:bg-[#F8F9F7] cursor-pointer">
            <Download className="w-3.5 h-3.5 text-[#588157]" />
            <span>Export CSV</span>
          </button>
          {(userRole === 'MP' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && onNavigateToRecommend && (
            <button onClick={onNavigateToRecommend} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#395C40] text-white rounded-lg text-xs font-bold hover:bg-[#2C4A34] cursor-pointer">
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Recommend Work</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-[#DDE5D4] shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A3B18A] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by code, title, address..."
            className="w-full pl-9 pr-3 py-2 border border-[#DDE5D4] rounded-xl text-xs text-[#1B3022] bg-[#F8F9F7]"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-[#588157] mb-1">Category</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full px-2 py-1.5 bg-[#F8F9F7] border border-[#DDE5D4] rounded-lg">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#588157] mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-2 py-1.5 bg-[#F8F9F7] border border-[#DDE5D4] rounded-lg">
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#588157] mb-1">District</label>
            <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)} className="w-full px-2 py-1.5 bg-[#F8F9F7] border border-[#DDE5D4] rounded-lg">
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#588157] mb-1">Risk Level</label>
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="w-full px-2 py-1.5 bg-[#F8F9F7] border border-[#DDE5D4] rounded-lg">
              {risks.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#DDE5D4] shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8F9F7] text-[#588157] font-bold uppercase text-[10px] border-b border-[#DDE5D4]">
            <tr>
              <th className="p-3">Project Ref</th>
              <th className="p-3">Title & Category</th>
              <th className="p-3">District</th>
              <th className="p-3 text-right">Cost (Lakh)</th>
              <th className="p-3">Progress</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center">AI Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2ED]">
            {filteredProjects.map(project => (
              <tr key={project.id} onClick={() => onSelectProject(project)} className="hover:bg-[#F8F9F7] cursor-pointer transition-colors">
                <td className="p-3 font-mono font-semibold text-[#588157]">{project.projectCode}</td>
                <td className="p-3">
                  <div className="font-bold text-[#1B3022] line-clamp-1">{project.title}</div>
                  <div className="text-[11px] text-[#588157]">{project.category}</div>
                </td>
                <td className="p-3">{project.district}</td>
                <td className="p-3 text-right font-mono font-semibold">
                  ₹{(((project.sanctionedAmount || project.estimatedCost) || 0) / 100000).toFixed(2)}L
                </td>
                <td className="p-3 font-mono">{project.completionPercentage}%</td>
                <td className="p-3"><StatusBadge status={project.status} /></td>
                <td className="p-3 text-center">
                  <RiskBadge level={project.riskAnalysis?.riskLevel || 'LOW'} score={project.riskAnalysis?.overallScore || 20} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
