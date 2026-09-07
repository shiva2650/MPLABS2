import React, { useState, useMemo } from 'react';
import { Project, UserProfile } from '../types';
import {
  Search,
  Filter,
  Eye,
  Building,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpDown,
  Download,
} from 'lucide-react';

interface ProjectsListViewProps {
  projects: Project[];
  currentUser: UserProfile | null;
  onSelectProject: (project: Project) => void;
}

export const ProjectsListView: React.FC<ProjectsListViewProps> = ({
  projects,
  currentUser,
  onSelectProject,
}) => {
  const [search, setSearch] = useState<string>('');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Extract unique states and sectors
  const states = useMemo(() => Array.from(new Set(projects.map((p) => p.state))).sort(), [projects]);
  const sectors = useMemo(() => Array.from(new Set(projects.map((p) => p.sector))).sort(), [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (sectorFilter !== 'ALL' && p.sector !== sectorFilter) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (riskFilter !== 'ALL' && p.riskLevel !== riskFilter) return false;
      if (stateFilter !== 'ALL' && p.state !== stateFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const mTitle = p.title.toLowerCase().includes(q);
        const mCode = p.workCode.toLowerCase().includes(q);
        const mMP = p.mpName.toLowerCase().includes(q);
        const mDist = p.district.toLowerCase().includes(q);
        if (!mTitle && !mCode && !mMP && !mDist) return false;
      }
      return true;
    });
  }, [projects, sectorFilter, statusFilter, riskFilter, stateFilter, search]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900">
            MPLADS Developmental Works Master Repository
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Search, filter, and inspect physical execution dossiers across all Parliamentary constituencies.
          </p>
        </div>

        <a
          href="/api/reports/projects/csv"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded shadow-xs transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Export All CSV
        </a>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by title, work code, MP, district..."
              className="w-full pl-8 pr-3 py-1.5 border border-stone-300 rounded text-stone-900 bg-white"
            />
          </div>

          <select
            value={sectorFilter}
            onChange={(e) => {
              setSectorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="p-1.5 border border-stone-300 rounded bg-white text-stone-700 font-medium"
          >
            <option value="ALL">All Sectors ({sectors.length})</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="p-1.5 border border-stone-300 rounded bg-white text-stone-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="Recommended">Recommended</option>
            <option value="Sanctioned">Sanctioned</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Delayed">Delayed</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="p-1.5 border border-stone-300 rounded bg-white text-stone-700 font-medium"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-stone-500">
          <span>
            Found <strong>{filtered.length}</strong> matching projects
          </span>
          <button
            onClick={() => {
              setSearch('');
              setSectorFilter('ALL');
              setStatusFilter('ALL');
              setRiskFilter('ALL');
              setStateFilter('ALL');
              setCurrentPage(1);
            }}
            className="text-stone-600 hover:text-stone-900 underline"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="border border-stone-200 rounded-md overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700 border-collapse">
            <thead className="bg-stone-100 text-stone-800 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th className="p-2.5 border-r border-stone-200">Work Code</th>
                <th className="p-2.5 border-r border-stone-200">Development Work Title</th>
                <th className="p-2.5 border-r border-stone-200">Sector</th>
                <th className="p-2.5 border-r border-stone-200">Constituency / District</th>
                <th className="p-2.5 border-r border-stone-200 text-right">Sanctioned</th>
                <th className="p-2.5 border-r border-stone-200 text-center">Status</th>
                <th className="p-2.5 border-r border-stone-200 text-center">Progress</th>
                <th className="p-2.5 border-r border-stone-200 text-center">AI Risk</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {paginated.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-2.5 font-mono text-stone-600 font-semibold border-r border-stone-200 whitespace-nowrap">
                    {p.workCode}
                  </td>
                  <td className="p-2.5 border-r border-stone-200 max-w-xs">
                    <div className="font-bold text-stone-900">{p.title}</div>
                    <div className="text-[11px] text-stone-500 truncate">{p.locationName}</div>
                  </td>
                  <td className="p-2.5 border-r border-stone-200">{p.sector}</td>
                  <td className="p-2.5 border-r border-stone-200">
                    <div className="font-medium text-stone-800">{p.district}</div>
                    <div className="text-[10px] text-stone-500">{p.state} • {p.mpName}</div>
                  </td>
                  <td className="p-2.5 text-right font-mono border-r border-stone-200 font-bold text-indigo-900">
                    ₹{p.sanctionedCostLakhs.toFixed(2)}L
                  </td>
                  <td className="p-2.5 text-center border-r border-stone-200">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'Ongoing'
                          ? 'bg-blue-100 text-blue-800'
                          : p.status === 'Delayed'
                          ? 'bg-orange-100 text-orange-800'
                          : p.status === 'Sanctioned'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-center border-r border-stone-200 font-mono">
                    {p.progressPercentage}%
                  </td>
                  <td className="p-2.5 text-center border-r border-stone-200">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH'
                          ? 'bg-red-100 text-red-800'
                          : p.riskLevel === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {p.riskScore}/100
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => onSelectProject(p)}
                      className="px-2.5 py-1 text-xs font-semibold text-sky-900 hover:bg-sky-50 border border-sky-200 rounded transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Dossier
                    </button>
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-stone-500">
                    No matching projects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-xs text-stone-600 pt-2">
          <div>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filtered.length} total works)
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-stone-300 rounded text-stone-700 hover:bg-stone-100 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 border border-stone-300 rounded text-stone-700 hover:bg-stone-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
