import React, { useState, useMemo } from 'react';
import { Project } from '../types/index.ts';
import { StatusBadge } from './ui/StatusBadge.tsx';
import { ArrowUpDown, Eye, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface ProjectTableProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  title?: string;
  subtitle?: string;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  onSelectProject,
  title = 'Sanctioned Works Directory',
  subtitle
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Project>('sanctionedCost');
  const [sortAsc, setSortAsc] = useState(false);
  const pageSize = 10;

  const handleSort = (field: keyof Project) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      }

      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return sortAsc ? numA - numB : numB - numA;
    });
  }, [projects, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedProjects.length / pageSize) || 1;
  const paginated = sortedProjects.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatLakhs = (amt: number) => `₹${(amt / 100000).toFixed(1)} L`;

  const exportCsv = () => {
    const headers = [
      'Work ID',
      'Title',
      'Category',
      'Constituency',
      'District',
      'State',
      'MP Name',
      'Agency',
      'Sanctioned Cost (INR)',
      'Utilized Cost (INR)',
      'Physical Progress (%)',
      'Status',
      'Risk Level'
    ];

    const rows = sortedProjects.map((p) => [
      `"${p.workId}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.constituency}"`,
      `"${p.district}"`,
      `"${p.state}"`,
      `"${p.mpName}"`,
      `"${p.agencyName}"`,
      p.sanctionedCost,
      p.utilizedCost,
      p.completionPercentage,
      `"${p.status}"`,
      `"${p.riskLevel || 'Low'}"`
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MPLADS_Works_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded border border-slate-200 overflow-hidden mb-5">
      {/* Table Header Controls */}
      <div className="p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">
            {subtitle || `Showing ${projects.length} verified parliamentary development works`}
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-300 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">Project ID</th>
              <th className="py-2.5 px-3">Project Name</th>
              <th className="py-2.5 px-3">Location</th>
              <th className="py-2.5 px-3">Agency</th>
              <th
                onClick={() => handleSort('completionPercentage')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>Progress</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('sanctionedCost')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>Expenditure</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3">Risk</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                  No projects match the current criteria.
                </td>
              </tr>
            ) : (
              paginated.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Project ID */}
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap text-[11px]">
                    {p.workId}
                  </td>

                  {/* Project Name */}
                  <td className="py-2.5 px-3 min-w-[200px] max-w-xs">
                    <div className="font-semibold text-slate-900 line-clamp-1">{p.title}</div>
                    <div className="text-[10px] text-slate-500 truncate">{p.category}</div>
                  </td>

                  {/* Location */}
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                    <div className="font-medium text-slate-800">{p.district}</div>
                    <div className="text-[10px] text-slate-400">{p.state}</div>
                  </td>

                  {/* Agency */}
                  <td className="py-2.5 px-3 max-w-[150px] truncate text-slate-600">
                    {p.agencyName || 'PWD Rural Works'}
                  </td>

                  {/* Progress */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-14 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-900 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, p.completionPercentage)}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-700 text-[11px]">
                        {p.completionPercentage}%
                      </span>
                    </div>
                  </td>

                  {/* Expenditure */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{formatLakhs(p.sanctionedCost)}</div>
                    <div className="text-[10px] text-slate-500">
                      Utilized: {formatLakhs(p.utilizedCost)}
                    </div>
                  </td>

                  {/* Risk */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <StatusBadge status={p.riskLevel || 'Low'} size="xs" />
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <StatusBadge status={p.status} size="xs" />
                  </td>

                  {/* Action */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectProject(p)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-semibold rounded border border-slate-300 transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Compact Pagination */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedProjects.length)} of {sortedProjects.length} works
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-white text-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-white text-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
