import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';

interface FilterState {
  search: string;
  house: string;
  state: string;
  category: string;
  status: string;
  riskLevel: string;
}

interface SearchFilterPanelProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onReset: () => void;
  totalResults: number;
}

export const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset,
  totalResults
}) => {
  const handleChange = (key: keyof FilterState, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.house !== 'All' ||
    filters.state !== 'All' ||
    filters.category !== 'All' ||
    filters.status !== 'All' ||
    filters.riskLevel !== 'All';

  return (
    <div className="bg-white p-3 rounded border border-slate-200 mb-5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Search by Work ID, Title, Representative, District, or Agency..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-slate-900"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => handleChange('search', '')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Results count & reset */}
        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
          <span className="text-slate-500 whitespace-nowrap">
            <strong className="text-slate-900 font-bold">{totalResults}</strong> works found
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-900 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Dropdowns in compact single line / responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div>
          <select
            value={filters.house}
            onChange={(e) => handleChange('house', e.target.value)}
            className="w-full py-1 px-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-900 font-medium"
          >
            <option value="All">All Houses (Lok / Rajya)</option>
            <option value="Lok Sabha">Lok Sabha</option>
            <option value="Rajya Sabha">Rajya Sabha</option>
          </select>
        </div>

        <div>
          <select
            value={filters.state}
            onChange={(e) => handleChange('state', e.target.value)}
            className="w-full py-1 px-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-900 font-medium"
          >
            <option value="All">All States / UTs</option>
            <option value="Telangana">Telangana</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Bihar">Bihar</option>
            <option value="Kerala">Kerala</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Assam">Assam</option>
            <option value="Gujarat">Gujarat</option>
          </select>
        </div>

        <div>
          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full py-1 px-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-900 font-medium"
          >
            <option value="All">All Sectors</option>
            <option value="Drinking Water">Drinking Water</option>
            <option value="Education">Education</option>
            <option value="Electricity">Electricity</option>
            <option value="Health & Family Welfare">Health & Family Welfare</option>
            <option value="Irrigation">Irrigation</option>
            <option value="Roads, Pathways & Bridges">Roads & Bridges</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Community Halls">Community Halls</option>
          </select>
        </div>

        <div>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full py-1 px-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-900 font-medium"
          >
            <option value="All">All Execution Stages</option>
            <option value="Recommended">Recommended</option>
            <option value="Sanctioned">Sanctioned</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Delayed">Delayed</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <select
            value={filters.riskLevel}
            onChange={(e) => handleChange('riskLevel', e.target.value)}
            className="w-full py-1 px-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-900 font-medium"
          >
            <option value="All">All AI Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Moderate">Moderate Risk</option>
            <option value="High">High Risk</option>
            <option value="Critical">Critical Risk</option>
          </select>
        </div>
      </div>
    </div>
  );
};
