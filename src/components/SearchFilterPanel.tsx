import React from 'react';
import { Search, Filter, X, RotateCcw } from 'lucide-react';

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
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-900" />
          <span className="text-sm font-bold text-gray-900">Project Search & Filter Engine</span>
          <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
            {totalResults} Works Found
          </span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>

      {/* Primary Search Bar */}
      <div className="relative mb-3">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          placeholder="Search by Work ID (e.g. MPLADS/2024-25/TS...), Work Title, MP Name, District, or Implementing Agency..."
          className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all text-gray-900"
        />
        {filters.search && (
          <button
            onClick={() => handleChange('search', '')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Multi-Criteria Dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <div>
          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Parliamentary House</label>
          <select
            value={filters.house}
            onChange={(e) => handleChange('house', e.target.value)}
            className="w-full text-xs py-1.5 px-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-800 font-medium"
          >
            <option value="All">All Houses (543 + 245)</option>
            <option value="Lok Sabha">Lok Sabha</option>
            <option value="Rajya Sabha">Rajya Sabha</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">State / UT</label>
          <select
            value={filters.state}
            onChange={(e) => handleChange('state', e.target.value)}
            className="w-full text-xs py-1.5 px-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-800 font-medium"
          >
            <option value="All">All States</option>
            <option value="Telangana">Telangana</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Rajasthan">Rajasthan</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Asset Category</label>
          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full text-xs py-1.5 px-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-800 font-medium"
          >
            <option value="All">All Categories</option>
            <option value="Drinking Water">Drinking Water</option>
            <option value="Education & Schools">Education & Schools</option>
            <option value="Health & Sanitation">Health & Sanitation</option>
            <option value="Roads & Pathways">Roads & Pathways</option>
            <option value="Rural Electrification">Rural Electrification</option>
            <option value="Community Infrastructure">Community Infrastructure</option>
            <option value="Irrigation & Agriculture">Irrigation & Agriculture</option>
            <option value="Sports & Youth Facilities">Sports & Youth Facilities</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Execution Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full text-xs py-1.5 px-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-800 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Recommended">Recommended</option>
            <option value="Under Review">Under Review</option>
            <option value="Sanctioned">Sanctioned</option>
            <option value="Assigned">Assigned to Agency</option>
            <option value="Ongoing">Ongoing (MB Active)</option>
            <option value="Delayed">Delayed / Lagging</option>
            <option value="Completed">Completed & Handed Over</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">AI Risk Tier</label>
          <select
            value={filters.riskLevel}
            onChange={(e) => handleChange('riskLevel', e.target.value)}
            className="w-full text-xs py-1.5 px-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-800 font-medium"
          >
            <option value="All">All Risk Tiers</option>
            <option value="Low">Low (Normal)</option>
            <option value="Medium">Medium (Attention)</option>
            <option value="High">High (Discrepancy)</option>
            <option value="Critical">Critical (Anomaly)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
