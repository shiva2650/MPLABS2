import React, { useState, useMemo } from 'react';
import { VendorAnalytics, VendorRiskEvent, VendorProjectSummary, Project, User } from '../types/index.ts';
import {
  Briefcase,
  Building2,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  IndianRupee,
  Search,
  Filter,
  Eye,
  ChevronRight,
  X,
  UserCheck,
  AlertOctagon,
  TrendingUp,
  BarChart3,
  Scale,
  Layers,
  Calendar,
  ExternalLink,
  RefreshCw,
  FileText,
  Check,
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface VendorAnalyticsViewProps {
  vendors: VendorAnalytics[];
  projects: Project[];
  currentUser: User | null;
  onSelectProject?: (p: Project) => void;
  onSanctionWorkWithVendor?: (vendorName: string, agencyName: string) => void;
  onRefreshData?: () => void;
}

export const VendorAnalyticsView: React.FC<VendorAnalyticsViewProps> = ({
  vendors,
  projects,
  currentUser,
  onSelectProject,
  onSanctionWorkWithVendor,
  onRefreshData
}) => {
  // Search and Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgency, setSelectedAgency] = useState('All');
  const [selectedSuitability, setSelectedSuitability] = useState('All');
  const [selectedDelayRange, setSelectedDelayRange] = useState('All');
  const [sortBy, setSortBy] = useState<'projects' | 'delay_asc' | 'delay_desc' | 'risk_desc' | 'value_desc'>('projects');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Comparison Tool State
  const [isCompareModeOpen, setIsCompareModeOpen] = useState(false);
  const [compareVendorA, setCompareVendorA] = useState<string>(vendors[0]?.vendorName || '');
  const [compareVendorB, setCompareVendorB] = useState<string>(vendors[1]?.vendorName || '');
  const [selectedPendingWorkId, setSelectedPendingWorkId] = useState<string>('');

  // Selected Vendor Dossier Modal
  const [inspectedVendor, setInspectedVendor] = useState<VendorAnalytics | null>(null);
  const [dossierTab, setDossierTab] = useState<'overview' | 'risk_history' | 'projects' | 'checklist'>('overview');

  // Format currency in Lakhs (1 Lakh = 100,000 INR) or Crores
  const formatLakhs = (val: number) => {
    if (!val) return '₹0.00 L';
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(val / 100000).toFixed(2)} Lakhs`;
  };

  // Extract unique agencies for filter dropdown
  const uniqueAgencies = useMemo(() => {
    const set = new Set<string>();
    vendors.forEach((v) => {
      if (v.agencyName) set.add(v.agencyName);
      if (v.secondaryAgencies) v.secondaryAgencies.forEach((a) => set.add(a));
    });
    return Array.from(set);
  }, [vendors]);

  // Extract recommended/pending works to simulate pre-sanction assignment
  const pendingWorks = useMemo(() => {
    return projects.filter((p) => p.status === 'Recommended' || p.status === 'Under Review');
  }, [projects]);

  // Filtered and Sorted Vendors
  const filteredVendors = useMemo(() => {
    let list = [...vendors];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (v) =>
          v.vendorName.toLowerCase().includes(q) ||
          v.agencyName.toLowerCase().includes(q) ||
          (v.sectors && v.sectors.some((s) => s.toLowerCase().includes(q)))
      );
    }

    if (selectedAgency !== 'All') {
      list = list.filter(
        (v) =>
          v.agencyName === selectedAgency ||
          (v.secondaryAgencies && v.secondaryAgencies.includes(selectedAgency))
      );
    }

    if (selectedSuitability !== 'All') {
      list = list.filter((v) => v.suitabilityStatus === selectedSuitability);
    }

    if (selectedDelayRange !== 'All') {
      if (selectedDelayRange === 'ontime') {
        list = list.filter((v) => v.avgCompletionDelayDays <= 5);
      } else if (selectedDelayRange === 'moderate') {
        list = list.filter((v) => v.avgCompletionDelayDays > 5 && v.avgCompletionDelayDays <= 25);
      } else if (selectedDelayRange === 'heavy') {
        list = list.filter((v) => v.avgCompletionDelayDays > 25);
      }
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'projects') {
        return b.totalProjects - a.totalProjects || a.avgCompletionDelayDays - b.avgCompletionDelayDays;
      }
      if (sortBy === 'delay_asc') {
        return a.avgCompletionDelayDays - b.avgCompletionDelayDays;
      }
      if (sortBy === 'delay_desc') {
        return b.avgCompletionDelayDays - a.avgCompletionDelayDays;
      }
      if (sortBy === 'risk_desc') {
        return b.avgRiskScore - a.avgRiskScore;
      }
      if (sortBy === 'value_desc') {
        return b.totalValue - a.totalValue;
      }
      return 0;
    });

    return list;
  }, [vendors, searchTerm, selectedAgency, selectedSuitability, selectedDelayRange, sortBy]);

  // Overall Statistics
  const overallStats = useMemo(() => {
    const totalCount = vendors.length;
    const totalAssignedValue = vendors.reduce((acc, v) => acc + v.totalValue, 0);
    const avgDelayAll =
      vendors.length > 0
        ? Math.round(vendors.reduce((acc, v) => acc + v.avgCompletionDelayDays, 0) / vendors.length)
        : 0;
    const highRiskCount = vendors.filter(
      (v) => v.suitabilityStatus === 'High Risk / Review Required' || v.riskLevel === 'Critical' || v.riskLevel === 'High'
    ).length;
    const cleanRecordCount = vendors.filter((v) => v.suitabilityStatus === 'Recommended').length;
    const totalWorksAcross = vendors.reduce((acc, v) => acc + v.totalProjects, 0);

    return {
      totalCount,
      totalAssignedValue,
      avgDelayAll,
      highRiskCount,
      cleanRecordCount,
      totalWorksAcross
    };
  }, [vendors]);

  const vendorAObj = vendors.find((v) => v.vendorName === compareVendorA);
  const vendorBObj = vendors.find((v) => v.vendorName === compareVendorB);
  const pendingWorkObj = projects.find((p) => p.id === selectedPendingWorkId);

  return (
    <div className="space-y-6">
      {/* Official Section Banner & Guidance */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 border-b-2 border-amber-500">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded">
                  District Authority Intelligence
                </span>
                <span className="text-[10px] font-semibold text-slate-300 bg-white/10 px-2 py-0.5 rounded">
                  MPLADS Guidelines Rule 2.11 & 4.3 Norms
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
                <Briefcase className="w-6 h-6 text-amber-400" />
                <span>Vendor & Implementing Agency Analytics</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Aggregated performance metrics, historical execution delay distribution, and automated AI risk events.
                Designed to assist District Magistrates and Implementing Authorities in conducting due diligence before
                assigning fresh parliamentary works.
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
              <button
                onClick={() => setIsCompareModeOpen(!isCompareModeOpen)}
                className={`px-3.5 py-2 text-xs font-bold rounded-md shadow-xs flex items-center gap-2 transition-all ${
                  isCompareModeOpen
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>{isCompareModeOpen ? 'Close Assessment Tool' : 'Pre-Sanction Assessment Tool'}</span>
              </button>

              {onRefreshData && (
                <button
                  onClick={onRefreshData}
                  title="Refresh Analytics Data"
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-md border border-white/20 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Executive Summary Metrics Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-200 bg-gray-50/70 text-xs">
          <div className="p-3.5 sm:p-4 text-center">
            <div className="text-gray-500 font-medium text-[11px] mb-0.5">Tracked Contractors</div>
            <div className="text-lg sm:text-xl font-black text-gray-900">{overallStats.totalCount}</div>
            <div className="text-[10px] text-blue-900 font-semibold mt-0.5">{overallStats.totalWorksAcross} Works Assigned</div>
          </div>

          <div className="p-3.5 sm:p-4 text-center">
            <div className="text-gray-500 font-medium text-[11px] mb-0.5">Avg Completion Delay</div>
            <div className={`text-lg sm:text-xl font-black ${overallStats.avgDelayAll > 20 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {overallStats.avgDelayAll} Days
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">Across active & completed works</div>
          </div>

          <div className="p-3.5 sm:p-4 text-center">
            <div className="text-gray-500 font-medium text-[11px] mb-0.5">Recommended Clean Track</div>
            <div className="text-lg sm:text-xl font-black text-emerald-700">{overallStats.cleanRecordCount}</div>
            <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">Zero critical integrity flags</div>
          </div>

          <div className="p-3.5 sm:p-4 text-center">
            <div className="text-gray-500 font-medium text-[11px] mb-0.5">High Risk / Scrutiny Flagged</div>
            <div className={`text-lg sm:text-xl font-black ${overallStats.highRiskCount > 0 ? 'text-rose-700' : 'text-gray-900'}`}>
              {overallStats.highRiskCount}
            </div>
            <div className="text-[10px] text-rose-700 font-semibold mt-0.5">Requires Section 2.11 Review</div>
          </div>

          <div className="p-3.5 sm:p-4 text-center col-span-2 md:col-span-1">
            <div className="text-gray-500 font-medium text-[11px] mb-0.5">Total Assigned Value</div>
            <div className="text-lg sm:text-xl font-black text-indigo-950">{formatLakhs(overallStats.totalAssignedValue)}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Across all agencies</div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE PRE-ASSIGNMENT VENDOR ASSESSMENT & COMPARISON TOOL */}
      {isCompareModeOpen && (
        <div className="bg-amber-50/50 rounded-lg border-2 border-amber-300 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                  Pre-Sanction Verification
                </span>
                <h3 className="text-base font-bold text-gray-900">
                  Compare Vendor Performance Before Assigning New Works
                </h3>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Benchmark contractor capacity, average execution delays, and historical AI anomalies to satisfy Rule 2.11 obligations.
              </p>
            </div>

            {pendingWorks.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Target Proposal:</span>
                <select
                  value={selectedPendingWorkId}
                  onChange={(e) => setSelectedPendingWorkId(e.target.value)}
                  className="text-xs bg-white border border-amber-300 rounded px-2.5 py-1.5 font-medium text-gray-900 max-w-[260px] truncate"
                >
                  <option value="">-- Select Pending Recommendation --</option>
                  {pendingWorks.map((pw) => (
                    <option key={pw.id} value={pw.id}>
                      {pw.workId} - {pw.title} ({formatLakhs(pw.estimatedCost)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Pending Work Card if selected */}
          {pendingWorkObj && (
            <div className="bg-white p-3.5 rounded-md border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-extrabold text-blue-900">{pendingWorkObj.workId}</div>
                <div className="font-bold text-gray-900 text-sm">{pendingWorkObj.title}</div>
                <div className="text-gray-500 text-[11px] mt-0.5">
                  Category: <span className="font-semibold text-gray-700">{pendingWorkObj.category}</span> • Location: {pendingWorkObj.locationAddress}
                </div>
              </div>
              <div className="text-right whitespace-nowrap bg-blue-50 px-3 py-1.5 rounded border border-blue-200">
                <div className="text-[10px] text-gray-500 font-semibold uppercase">Proposed Budget</div>
                <div className="text-sm font-extrabold text-blue-950">{formatLakhs(pendingWorkObj.estimatedCost)}</div>
              </div>
            </div>
          )}

          {/* Side by Side Vendor Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vendor A */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Vendor Option A</span>
                <select
                  value={compareVendorA}
                  onChange={(e) => setCompareVendorA(e.target.value)}
                  className="text-xs bg-gray-50 border border-gray-300 rounded px-2 py-1 font-bold text-gray-900 max-w-[200px]"
                >
                  {vendors.map((v) => (
                    <option key={v.vendorName} value={v.vendorName}>
                      {v.vendorName}
                    </option>
                  ))}
                </select>
              </div>

              {vendorAObj ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Suitability Status:</span>
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded border ${
                        vendorAObj.suitabilityStatus === 'Recommended'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : vendorAObj.suitabilityStatus === 'Proceed with Caution'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {vendorAObj.suitabilityStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded border border-gray-100">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Total Works</span>
                      <span className="font-extrabold text-gray-900 text-sm">{vendorAObj.totalProjects}</span>
                      <span className="text-[10px] text-gray-400 block">({vendorAObj.activeProjects} active)</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Avg Completion Delay</span>
                      <span
                        className={`font-extrabold text-sm ${
                          vendorAObj.avgCompletionDelayDays > 25
                            ? 'text-rose-700'
                            : vendorAObj.avgCompletionDelayDays > 10
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {vendorAObj.avgCompletionDelayDays} Days
                      </span>
                      <span className="text-[10px] text-gray-400 block">({vendorAObj.completionRate}% completed)</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[11px] font-semibold mb-1">AI Risk History Summary</span>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800">Risk Score: {vendorAObj.avgRiskScore}/100</span>
                        <span className="text-[10px] font-bold text-gray-600">
                          {vendorAObj.aiRiskHistory.length} Flagged Events
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">{vendorAObj.suitabilityReason}</p>
                    </div>
                  </div>

                  {onSanctionWorkWithVendor && currentUser?.role === 'admin' && (
                    <button
                      onClick={() => onSanctionWorkWithVendor(vendorAObj.vendorName, vendorAObj.agencyName)}
                      className="w-full py-1.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded transition-colors flex items-center justify-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Select This Vendor for Work Sanction</span>
                    </button>
                  )}
                </div>
              ) : null}
            </div>

            {/* Vendor B */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Vendor Option B</span>
                <select
                  value={compareVendorB}
                  onChange={(e) => setCompareVendorB(e.target.value)}
                  className="text-xs bg-gray-50 border border-gray-300 rounded px-2 py-1 font-bold text-gray-900 max-w-[200px]"
                >
                  {vendors.map((v) => (
                    <option key={v.vendorName} value={v.vendorName}>
                      {v.vendorName}
                    </option>
                  ))}
                </select>
              </div>

              {vendorBObj ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Suitability Status:</span>
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded border ${
                        vendorBObj.suitabilityStatus === 'Recommended'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : vendorBObj.suitabilityStatus === 'Proceed with Caution'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {vendorBObj.suitabilityStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded border border-gray-100">
                    <div>
                      <span className="text-gray-500 block text-[10px]">Total Works</span>
                      <span className="font-extrabold text-gray-900 text-sm">{vendorBObj.totalProjects}</span>
                      <span className="text-[10px] text-gray-400 block">({vendorBObj.activeProjects} active)</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">Avg Completion Delay</span>
                      <span
                        className={`font-extrabold text-sm ${
                          vendorBObj.avgCompletionDelayDays > 25
                            ? 'text-rose-700'
                            : vendorBObj.avgCompletionDelayDays > 10
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {vendorBObj.avgCompletionDelayDays} Days
                      </span>
                      <span className="text-[10px] text-gray-400 block">({vendorBObj.completionRate}% completed)</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[11px] font-semibold mb-1">AI Risk History Summary</span>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800">Risk Score: {vendorBObj.avgRiskScore}/100</span>
                        <span className="text-[10px] font-bold text-gray-600">
                          {vendorBObj.aiRiskHistory.length} Flagged Events
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">{vendorBObj.suitabilityReason}</p>
                    </div>
                  </div>

                  {onSanctionWorkWithVendor && currentUser?.role === 'admin' && (
                    <button
                      onClick={() => onSanctionWorkWithVendor(vendorBObj.vendorName, vendorBObj.agencyName)}
                      className="w-full py-1.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded transition-colors flex items-center justify-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Select This Vendor for Work Sanction</span>
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* FILTER & CONTROLS TOOLBAR */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor name, implementing agency, or sector specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-900 focus:bg-white text-gray-900"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Agency Selector */}
            <div className="flex items-center gap-1">
              <span className="text-gray-500 font-medium hidden sm:inline">Agency:</span>
              <select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded py-1.5 px-2 text-xs font-medium text-gray-900 max-w-[170px]"
              >
                <option value="All">All Agencies</option>
                {uniqueAgencies.map((agency) => (
                  <option key={agency} value={agency}>
                    {agency}
                  </option>
                ))}
              </select>
            </div>

            {/* Suitability / Risk Tier */}
            <div className="flex items-center gap-1">
              <span className="text-gray-500 font-medium hidden sm:inline">Suitability:</span>
              <select
                value={selectedSuitability}
                onChange={(e) => setSelectedSuitability(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded py-1.5 px-2 text-xs font-medium text-gray-900"
              >
                <option value="All">All Suitabilities</option>
                <option value="Recommended">Recommended (Clean)</option>
                <option value="Proceed with Caution">Proceed with Caution</option>
                <option value="High Risk / Review Required">High Risk / Review Required</option>
              </select>
            </div>

            {/* Delay Range */}
            <div className="flex items-center gap-1">
              <span className="text-gray-500 font-medium hidden sm:inline">Delay:</span>
              <select
                value={selectedDelayRange}
                onChange={(e) => setSelectedDelayRange(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded py-1.5 px-2 text-xs font-medium text-gray-900"
              >
                <option value="All">All Delays</option>
                <option value="ontime">On-Time (≤ 5 Days)</option>
                <option value="moderate">Moderate (6–25 Days)</option>
                <option value="heavy">Heavy Delay (&gt; 25 Days)</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-gray-500 font-medium hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-50 border border-gray-300 rounded py-1.5 px-2 text-xs font-bold text-gray-900"
              >
                <option value="projects">Most Works</option>
                <option value="delay_asc">Lowest Delay (Best)</option>
                <option value="delay_desc">Highest Delay (Worst)</option>
                <option value="risk_desc">Highest AI Risk</option>
                <option value="value_desc">Highest Value (₹)</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="border-l border-gray-200 pl-2 flex items-center gap-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'cards' ? 'bg-blue-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="Card Grid View"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-blue-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
                title="Detailed Table View"
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <div>
            Showing <span className="font-bold text-gray-900">{filteredVendors.length}</span> of{' '}
            <span className="font-bold text-gray-900">{vendors.length}</span> registered contractors & agencies
          </div>
          {(searchTerm || selectedAgency !== 'All' || selectedSuitability !== 'All' || selectedDelayRange !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedAgency('All');
                setSelectedSuitability('All');
                setSelectedDelayRange('All');
              }}
              className="text-blue-900 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* VENDOR ROSTER DISPLAY */}
      {filteredVendors.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-900 mb-1">No matching vendors or agencies found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            Try adjusting your search criteria or clearing applied filters.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedAgency('All');
              setSelectedSuitability('All');
              setSelectedDelayRange('All');
            }}
            className="px-3 py-1.5 text-xs font-bold bg-blue-900 text-white rounded"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => {
            const hasCriticalRisk = vendor.riskLevel === 'Critical' || vendor.suitabilityStatus === 'High Risk / Review Required';
            const hasCaution = vendor.suitabilityStatus === 'Proceed with Caution';

            return (
              <div
                key={vendor.vendorName}
                className={`bg-white rounded-lg border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md ${
                  hasCriticalRisk
                    ? 'border-rose-300 hover:border-rose-400'
                    : hasCaution
                    ? 'border-amber-300 hover:border-amber-400'
                    : 'border-gray-200 hover:border-blue-400'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900 leading-tight">{vendor.vendorName}</h4>
                      <p className="text-[11px] text-gray-600 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate max-w-[220px]">{vendor.agencyName}</span>
                      </p>
                    </div>

                    {/* Suitability Badge */}
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border shrink-0 ${
                        vendor.suitabilityStatus === 'Recommended'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : vendor.suitabilityStatus === 'Proceed with Caution'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {vendor.suitabilityStatus === 'Recommended'
                        ? 'Recommended'
                        : vendor.suitabilityStatus === 'Proceed with Caution'
                        ? 'Caution'
                        : 'Review Required'}
                    </span>
                  </div>

                  {/* Sectors Chips */}
                  {vendor.sectors && vendor.sectors.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {vendor.sectors.slice(0, 3).map((sector) => (
                        <span
                          key={sector}
                          className="text-[9px] bg-slate-100 text-slate-700 font-medium px-1.5 py-0.5 rounded border border-slate-200"
                        >
                          {sector}
                        </span>
                      ))}
                      {vendor.sectors.length > 3 && (
                        <span className="text-[9px] text-gray-400">+{vendor.sectors.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Performance Metrics Body */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  {/* Primary Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="text-[10px] text-gray-500 block">Total Works</span>
                      <span className="font-extrabold text-sm text-blue-950">{vendor.totalProjects}</span>
                      <span className="text-[9px] text-gray-400 block">{vendor.activeProjects} active</span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="text-[10px] text-gray-500 block">Avg Delay</span>
                      <span
                        className={`font-black text-sm ${
                          vendor.avgCompletionDelayDays > 25
                            ? 'text-rose-700'
                            : vendor.avgCompletionDelayDays > 10
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {vendor.avgCompletionDelayDays}d
                      </span>
                      <span className="text-[9px] text-gray-400 block">{vendor.completionRate}% on-time</span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <span className="text-[10px] text-gray-500 block">Total Value</span>
                      <span className="font-extrabold text-xs text-indigo-950 block truncate">
                        {formatLakhs(vendor.totalValue)}
                      </span>
                      <span className="text-[9px] text-gray-400 block">{vendor.completedProjects} done</span>
                    </div>
                  </div>

                  {/* AI Risk History Overview */}
                  <div className="bg-gray-50 p-2.5 rounded-md border border-gray-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-700 flex items-center gap-1 text-[11px]">
                        <ShieldAlert
                          className={`w-3.5 h-3.5 ${
                            vendor.avgRiskScore > 50
                              ? 'text-rose-600'
                              : vendor.avgRiskScore > 25
                              ? 'text-amber-500'
                              : 'text-emerald-600'
                          }`}
                        />
                        <span>AI Risk History</span>
                      </span>
                      <span className="font-bold text-[10px] text-gray-600">
                        Avg Score: <span className="text-gray-900">{vendor.avgRiskScore}/100</span>
                      </span>
                    </div>

                    {vendor.aiRiskHistory.length > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded border border-rose-200">
                            {vendor.aiRiskHistory.length} Incident{vendor.aiRiskHistory.length > 1 ? 's' : ''} Flagged
                          </span>
                          <span className="text-gray-500 truncate">{vendor.aiRiskHistory[0]?.type}</span>
                        </div>
                        <p className="text-[10px] text-gray-600 line-clamp-1 italic">
                          "{vendor.aiRiskHistory[0]?.description}"
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Zero integrity anomalies or geo-falsification alerts</span>
                      </div>
                    )}
                  </div>

                  {/* Pre-Sanction Suitability Advisory */}
                  <div className="text-[11px] text-gray-600 bg-blue-50/40 p-2 rounded border border-blue-100 leading-snug">
                    <span className="font-bold text-blue-900">Rule 2.11 Pre-Check: </span>
                    <span>{vendor.suitabilityReason}</span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setInspectedVendor(vendor);
                      setDossierTab('overview');
                    }}
                    className="flex-1 py-1.5 px-3 text-xs font-bold text-blue-900 hover:bg-blue-100 rounded transition-colors flex items-center justify-center gap-1 border border-blue-300"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Performance Dossier</span>
                  </button>

                  <button
                    onClick={() => {
                      setCompareVendorA(vendor.vendorName);
                      setIsCompareModeOpen(true);
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    title="Add to Side-by-Side Comparison"
                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                  >
                    <Scale className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT TABLE VIEW */
        <div className="bg-white rounded-lg border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700 border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Contractor / Vendor Name</th>
                  <th className="py-2.5 px-3">Implementing Agency</th>
                  <th className="py-2.5 px-3 text-center">Total Works</th>
                  <th className="py-2.5 px-3 text-right">Sanctioned Value</th>
                  <th className="py-2.5 px-3 text-center">Avg Completion Delay</th>
                  <th className="py-2.5 px-3 text-center">On-Time %</th>
                  <th className="py-2.5 px-3 text-center">AI Risk History</th>
                  <th className="py-2.5 px-3 text-center">Pre-Check Suitability</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.vendorName} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900">{vendor.vendorName}</div>
                      <div className="text-[10px] text-gray-500">{vendor.sectors?.slice(0, 2).join(' • ')}</div>
                    </td>
                    <td className="py-3 px-3 text-gray-600 text-xs">{vendor.agencyName}</td>
                    <td className="py-3 px-3 text-center font-bold text-blue-900">
                      {vendor.totalProjects}{' '}
                      <span className="text-[10px] text-gray-400 font-normal">({vendor.activeProjects} act)</span>
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-indigo-950 whitespace-nowrap">
                      {formatLakhs(vendor.totalValue)}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`font-black text-xs px-2 py-0.5 rounded ${
                          vendor.avgCompletionDelayDays > 25
                            ? 'bg-rose-100 text-rose-800'
                            : vendor.avgCompletionDelayDays > 10
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {vendor.avgCompletionDelayDays} Days
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-gray-800">{vendor.completionRate}%</span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            vendor.avgRiskScore > 50
                              ? 'bg-rose-600'
                              : vendor.avgRiskScore > 25
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span className="font-bold text-gray-900">{vendor.avgRiskScore}</span>
                        <span className="text-[10px] text-gray-500">({vendor.aiRiskHistory.length} alerts)</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                          vendor.suitabilityStatus === 'Recommended'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : vendor.suitabilityStatus === 'Proceed with Caution'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {vendor.suitabilityStatus === 'Recommended'
                          ? 'Recommended'
                          : vendor.suitabilityStatus === 'Proceed with Caution'
                          ? 'Caution'
                          : 'Review Required'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setInspectedVendor(vendor);
                          setDossierTab('overview');
                        }}
                        className="py-1 px-2.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                      >
                        Inspect Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FULL VENDOR DOSSIER & RISK HISTORY MODAL */}
      {inspectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full shadow-2xl border border-gray-300 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-5 border-b-2 border-amber-500 flex items-start justify-between gap-3 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded">
                    Official Contractor Dossier
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                      inspectedVendor.suitabilityStatus === 'Recommended'
                        ? 'bg-emerald-900/80 text-emerald-200 border-emerald-400'
                        : inspectedVendor.suitabilityStatus === 'Proceed with Caution'
                        ? 'bg-amber-900/80 text-amber-200 border-amber-400'
                        : 'bg-rose-900/80 text-rose-200 border-rose-400'
                    }`}
                  >
                    {inspectedVendor.suitabilityStatus}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white">{inspectedVendor.vendorName}</h3>
                <p className="text-xs text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{inspectedVendor.agencyName}</span>
                  {inspectedVendor.secondaryAgencies && inspectedVendor.secondaryAgencies.length > 1 && (
                    <span className="text-slate-400 text-[11px]">
                      (+{inspectedVendor.secondaryAgencies.length - 1} other departments)
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={() => setInspectedVendor(null)}
                className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="bg-gray-100 border-b border-gray-200 px-5 flex items-center gap-2 overflow-x-auto shrink-0">
              <button
                onClick={() => setDossierTab('overview')}
                className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  dossierTab === 'overview'
                    ? 'border-blue-900 text-blue-900 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview & KPIs
              </button>
              <button
                onClick={() => setDossierTab('risk_history')}
                className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  dossierTab === 'risk_history'
                    ? 'border-blue-900 text-blue-900 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>AI Risk History ({inspectedVendor.aiRiskHistory.length})</span>
              </button>
              <button
                onClick={() => setDossierTab('projects')}
                className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  dossierTab === 'projects'
                    ? 'border-blue-900 text-blue-900 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Assigned Works ({inspectedVendor.projects.length})</span>
              </button>
              <button
                onClick={() => setDossierTab('checklist')}
                className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  dossierTab === 'checklist'
                    ? 'border-blue-900 text-blue-900 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-900" />
                <span>District Authority Sanction Clearance</span>
              </button>
            </div>

            {/* Modal Body Scroll Area */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* TAB 1: OVERVIEW & KPIS */}
              {dossierTab === 'overview' && (
                <div className="space-y-4">
                  {/* KPI Quadrant */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-gray-500 font-semibold block mb-0.5">Total Works</span>
                      <div className="text-xl font-extrabold text-gray-900">{inspectedVendor.totalProjects}</div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        {inspectedVendor.completedProjects} Completed • {inspectedVendor.activeProjects} Active •{' '}
                        {inspectedVendor.delayedProjects} Delayed
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-gray-500 font-semibold block mb-0.5">
                        Average Completion Delay
                      </span>
                      <div
                        className={`text-xl font-black ${
                          inspectedVendor.avgCompletionDelayDays > 25
                            ? 'text-rose-700'
                            : inspectedVendor.avgCompletionDelayDays > 10
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {inspectedVendor.avgCompletionDelayDays} Days
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        On-Time Velocity: {inspectedVendor.completionRate}%
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-gray-500 font-semibold block mb-0.5">
                        Capital Under Execution
                      </span>
                      <div className="text-xl font-extrabold text-indigo-950">
                        {formatLakhs(inspectedVendor.totalValue)}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        Utilized: {formatLakhs(inspectedVendor.utilizedValue)}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-gray-500 font-semibold block mb-0.5">AI Risk Rating</span>
                      <div
                        className={`text-xl font-black ${
                          inspectedVendor.avgRiskScore > 50
                            ? 'text-rose-700'
                            : inspectedVendor.avgRiskScore > 25
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {inspectedVendor.avgRiskScore} / 100
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        Tier: {inspectedVendor.riskLevel} Risk
                      </div>
                    </div>
                  </div>

                  {/* Pre-Sanction Evaluation Card */}
                  <div
                    className={`p-4 rounded-lg border ${
                      inspectedVendor.suitabilityStatus === 'Recommended'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : inspectedVendor.suitabilityStatus === 'Proceed with Caution'
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-extrabold text-sm mb-1.5">
                      {inspectedVendor.suitabilityStatus === 'Recommended' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : inspectedVendor.suitabilityStatus === 'Proceed with Caution' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      ) : (
                        <AlertOctagon className="w-5 h-5 text-rose-600" />
                      )}
                      <span>Pre-Assignment Advisory for District Authorities (Section 2.11)</span>
                    </div>
                    <p className="text-xs leading-relaxed">{inspectedVendor.suitabilityReason}</p>
                  </div>

                  {/* Sectors & Operational Footprint */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                      Technical Sectors & Specialization
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      {inspectedVendor.sectors?.map((s) => (
                        <span
                          key={s}
                          className="bg-white border border-gray-300 text-gray-800 px-2.5 py-1 rounded font-semibold text-xs shadow-2xs"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: AI RISK & ANOMALY HISTORY */}
              {dossierTab === 'risk_history' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm">
                        AI Integrity & Anomaly Audit Log
                      </h4>
                      <p className="text-gray-500 text-[11px]">
                        Algorithmic detections: cost deviation Z-scores, photo GPS distance discrepancies, and schedule slippage
                      </p>
                    </div>
                    <span className="bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded text-[11px]">
                      {inspectedVendor.aiRiskHistory.length} Event{inspectedVendor.aiRiskHistory.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {inspectedVendor.aiRiskHistory.length === 0 ? (
                    <div className="p-8 text-center bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <div className="font-bold text-sm">Clean Integrity Record</div>
                      <p className="text-xs text-emerald-700 max-w-md mx-auto">
                        No statistical cost outliers, geo-location mismatches, image tampering artifacts, or duplicate proposals
                        have ever been flagged by the AI engine for this vendor.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inspectedVendor.aiRiskHistory.map((event, idx) => (
                        <div
                          key={event.id || idx}
                          className={`p-3.5 rounded-lg border ${
                            event.riskLevel === 'Critical'
                              ? 'bg-rose-50/70 border-rose-300'
                              : event.riskLevel === 'High'
                              ? 'bg-amber-50/70 border-amber-300'
                              : 'bg-blue-50/70 border-blue-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                                  event.riskLevel === 'Critical'
                                    ? 'bg-rose-200 text-rose-900 border-rose-400'
                                    : event.riskLevel === 'High'
                                    ? 'bg-amber-200 text-amber-900 border-amber-400'
                                    : 'bg-blue-200 text-blue-900 border-blue-300'
                                }`}
                              >
                                {event.riskLevel} Risk • {event.type}
                              </span>
                              <span className="font-extrabold text-blue-950 text-xs">{event.workId}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {event.date ? new Date(event.date).toLocaleDateString() : 'Active'}
                            </span>
                          </div>

                          <div className="font-semibold text-gray-900 mb-1">{event.projectTitle}</div>
                          <p className="text-gray-700 text-xs leading-relaxed mb-1.5">{event.description}</p>

                          {event.evidence && (
                            <div className="bg-white/80 p-2 rounded border border-gray-200 text-[11px] font-mono text-slate-800">
                              <span className="font-bold text-gray-600">Evidence Extracted: </span>
                              {event.evidence}
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-200/60">
                            <span>Status: <span className="font-bold text-gray-800">{event.status}</span></span>
                            <span>Advisory: Decision support requiring field verification</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ASSIGNED PROJECTS PORTFOLIO */}
              {dossierTab === 'projects' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                    <div>
                      <h4 className="font-extrabold text-gray-900 text-sm">Assigned Parliamentary Works Portfolio</h4>
                      <p className="text-gray-500 text-[11px]">
                        List of works sanctioned, underway, or executed under MPLADS guidelines
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-left text-xs text-gray-700 border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
                        <tr>
                          <th className="py-2.5 px-3">Work ID & Title</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right">Sanctioned Cost</th>
                          <th className="py-2.5 px-3 text-center">Progress %</th>
                          <th className="py-2.5 px-3 text-center">Delay (Days)</th>
                          <th className="py-2.5 px-3 text-center">Risk Tier</th>
                          <th className="py-2.5 px-3 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium">
                        {inspectedVendor.projects.map((proj) => (
                          <tr key={proj.id} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 max-w-[200px]">
                              <div className="font-bold text-blue-900">{proj.workId}</div>
                              <div className="text-gray-900 truncate" title={proj.title}>
                                {proj.title}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-gray-600">{proj.category}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  proj.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : proj.status === 'Delayed'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {proj.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-gray-900 whitespace-nowrap">
                              {formatLakhs(proj.sanctionedCost)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-gray-800">
                              {proj.completionPercentage}%
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span
                                className={`font-bold ${
                                  proj.delayDays > 25
                                    ? 'text-rose-700'
                                    : proj.delayDays > 5
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                                }`}
                              >
                                {proj.delayDays}d
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  proj.riskLevel === 'Critical'
                                    ? 'bg-rose-100 text-rose-800'
                                    : proj.riskLevel === 'High'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {proj.riskLevel}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {onSelectProject && (
                                <button
                                  onClick={() => {
                                    const fullProj = projects.find((p) => p.id === proj.id);
                                    if (fullProj) onSelectProject(fullProj);
                                  }}
                                  className="text-blue-900 font-bold hover:underline"
                                >
                                  Inspect
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: DISTRICT AUTHORITY CHECKLIST */}
              {dossierTab === 'checklist' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3.5 rounded-lg border border-blue-200">
                    <h4 className="font-extrabold text-blue-950 text-sm mb-1">
                      Administrative Sanction Suitability Scorecard
                    </h4>
                    <p className="text-gray-700 text-xs">
                      Under Section 2.11 of the official MPLADS Guidelines, the District Authority is mandated to verify
                      contractor execution bandwidth and previous completion track record prior to designating implementing agencies.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {/* Check 1: Concurrent Load */}
                    <div className="p-3 rounded-lg border border-gray-200 flex items-start justify-between gap-3 bg-white">
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          {inspectedVendor.activeProjects <= 3 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span>Concurrent Workload Capacity (&le; 3 Active Works Recommended)</span>
                        </div>
                        <p className="text-gray-500 text-[11px]">
                          Currently assigned {inspectedVendor.activeProjects} active ongoing works.
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          inspectedVendor.activeProjects <= 3
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inspectedVendor.activeProjects <= 3 ? 'Within Limits' : 'Elevated Load'}
                      </span>
                    </div>

                    {/* Check 2: Average Delay */}
                    <div className="p-3 rounded-lg border border-gray-200 flex items-start justify-between gap-3 bg-white">
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          {inspectedVendor.avgCompletionDelayDays <= 20 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span>Historical Execution Delay Tolerance (&le; 20 Days Benchmark)</span>
                        </div>
                        <p className="text-gray-500 text-[11px]">
                          Average recorded delay is {inspectedVendor.avgCompletionDelayDays} days across historical works.
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          inspectedVendor.avgCompletionDelayDays <= 20
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inspectedVendor.avgCompletionDelayDays <= 20 ? 'Tolerable' : 'Exceeds Benchmark'}
                      </span>
                    </div>

                    {/* Check 3: Integrity & EXIF alerts */}
                    <div className="p-3 rounded-lg border border-gray-200 flex items-start justify-between gap-3 bg-white">
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          {inspectedVendor.aiRiskHistory.filter((r) => r.riskLevel === 'Critical').length === 0 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span>Critical Geo-Falsification & Cost Fraud Clearances</span>
                        </div>
                        <p className="text-gray-500 text-[11px]">
                          {inspectedVendor.aiRiskHistory.filter((r) => r.riskLevel === 'Critical').length === 0
                            ? 'Zero critical photo location or duplicate flags registered.'
                            : `${inspectedVendor.aiRiskHistory.filter((r) => r.riskLevel === 'Critical').length} critical alerts requiring explanation.`}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          inspectedVendor.aiRiskHistory.filter((r) => r.riskLevel === 'Critical').length === 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inspectedVendor.aiRiskHistory.filter((r) => r.riskLevel === 'Critical').length === 0
                          ? 'Passed'
                          : 'Review Required'}
                      </span>
                    </div>
                  </div>

                  {/* Formal Verdict */}
                  <div className="bg-slate-900 text-white p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-amber-400">Formal Sanction Verdict</span>
                      <span className="text-xs font-extrabold bg-white/10 px-2 py-0.5 rounded">
                        {inspectedVendor.suitabilityStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {inspectedVendor.suitabilityReason}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => setInspectedVendor(null)}
                className="py-2 px-4 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                Close Dossier
              </button>

              {onSanctionWorkWithVendor && currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    const vName = inspectedVendor.vendorName;
                    const aName = inspectedVendor.agencyName;
                    setInspectedVendor(null);
                    onSanctionWorkWithVendor(vName, aName);
                  }}
                  className="py-2 px-4 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Assign Works to {inspectedVendor.vendorName}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
