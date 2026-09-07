import React, { useState, useEffect, useMemo } from 'react';
import { User, Project, Alert, CitizenFeedback, VendorAnalytics } from './types/index.ts';
import {
  getStoredUser,
  getStoredToken,
  logoutUser,
  fetchPublicStats,
  fetchMpStats,
  fetchProjects,
  fetchAlerts,
  fetchFeedback,
  fetchVendorAnalytics
} from './services/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { KpiCards } from './components/KpiCards.tsx';
import { SearchFilterPanel } from './components/SearchFilterPanel.tsx';
import { MpDataTable } from './components/MpDataTable.tsx';
import { GisMap } from './components/GisMap.tsx';
import { CitizenFeedbackModal } from './components/CitizenFeedbackModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { MpDashboard } from './components/MpDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AgencyDashboard } from './components/AgencyDashboard.tsx';
import { AiVerificationLab } from './components/AiVerificationLab.tsx';
import { ProjectDetailModal } from './components/ProjectDetailModal.tsx';
import { VendorAnalyticsView } from './components/VendorAnalyticsView.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import {
  Building2,
  MapPin,
  FileText,
  IndianRupee,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Eye,
  RefreshCw
} from 'lucide-react';

export default function App() {
  // Current Authenticated User Session
  const [user, setUser] = useState<User | null>(getStoredUser());

  // Active View Tab: 'public' | 'dashboard' | 'ai-lab' | 'feedback' | 'vendors'
  const [activeView, setActiveView] = useState<'public' | 'dashboard' | 'ai-lab' | 'feedback' | 'vendors'>('public');

  // House filter tab on public portal: 'All' | 'Lok Sabha' | 'Rajya Sabha'
  const [selectedHouseTab, setSelectedHouseTab] = useState<'All' | 'Lok Sabha' | 'Rajya Sabha'>('All');

  // Public Search & Filter State
  const [filters, setFilters] = useState({
    search: '',
    house: 'All',
    state: 'All',
    category: 'All',
    status: 'All',
    riskLevel: 'All'
  });

  // Modal Controls
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [inspectedProject, setInspectedProject] = useState<Project | null>(null);

  // Application Data Stores
  const [publicStats, setPublicStats] = useState<any | null>(null);
  const [mpLedger, setMpLedger] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
  const [allFeedback, setAllFeedback] = useState<CitizenFeedback[]>([]);
  const [allVendors, setAllVendors] = useState<VendorAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  // Data Loader
  const loadPortalData = async () => {
    setLoading(true);
    try {
      const [stats, mps, projects, alerts, feedback, vendors] = await Promise.all([
        fetchPublicStats().catch((e) => {
          console.warn('Failed to fetch public stats:', e);
          return null;
        }),
        fetchMpStats().catch((e) => {
          console.warn('Failed to fetch MP stats:', e);
          return [];
        }),
        fetchProjects().catch((e) => {
          console.warn('Failed to fetch projects:', e);
          return [];
        }),
        fetchAlerts().catch(() => []),
        fetchFeedback().catch(() => []),
        fetchVendorAnalytics().catch(() => [])
      ]);
      setPublicStats(stats);
      setMpLedger(mps || []);
      setAllProjects(projects || []);
      setAllAlerts(alerts || []);
      setAllFeedback(feedback || []);
      setAllVendors(vendors || []);
    } catch (err) {
      console.error('Error fetching portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [user]);

  // Auth Handlers
  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setActiveView('dashboard');
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setActiveView('public');
  };

  // Sync House Tab with Search Filters
  const handleHouseTabChange = (house: 'All' | 'Lok Sabha' | 'Rajya Sabha') => {
    setSelectedHouseTab(house);
    setFilters((prev) => ({ ...prev, house }));
  };

  // Filtered Projects for Public Display
  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      if (filters.house !== 'All' && p.house !== filters.house) return false;
      if (filters.state !== 'All' && p.state.toLowerCase() !== filters.state.toLowerCase()) return false;
      if (filters.category !== 'All' && p.category !== filters.category) return false;
      if (filters.status !== 'All' && p.status !== filters.status) return false;
      if (filters.riskLevel !== 'All' && p.riskLevel !== filters.riskLevel) return false;

      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const matches =
          p.workId.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.mpName.toLowerCase().includes(q) ||
          p.constituency.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.agencyName && p.agencyName.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [allProjects, filters]);

  // Filter MP ledger by house
  const filteredMpLedger = useMemo(() => {
    if (selectedHouseTab === 'All') return mpLedger;
    return mpLedger.filter((m) => m.house === selectedHouseTab);
  }, [mpLedger, selectedHouseTab]);

  const formatLakhs = (amt: number) => `₹${(amt / 100000).toFixed(1)} L`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900 antialiased selection:bg-blue-900 selection:text-white">
      {/* Top Government Navigation Header */}
      <Navbar
        user={user}
        activeView={activeView}
        setActiveView={(v) => {
          if (v === 'dashboard' && !user) {
            setIsLoginModalOpen(true);
          } else {
            setActiveView(v);
          }
        }}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        alertsCount={allAlerts.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: PUBLIC PORTAL (eSAKSHI Style) */}
        {activeView === 'public' && (
          <div className="space-y-6">
            {/* Top Title Section */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 uppercase mb-2">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>MoSPI Central Sector Scheme Portal</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
                    Members of Parliament Local Area Development Scheme (MPLADS)
                  </h2>
                  <p className="text-xs text-gray-600 mt-1 max-w-3xl">
                    Constituency fund utilization, physical execution tracking, and automated AI integrity monitoring
                    across all 543 Lok Sabha and 245 Rajya Sabha parliamentary jurisdictions.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    onClick={loadPortalData}
                    className="p-2 text-gray-600 hover:text-blue-900 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setActiveView('feedback')}
                    className="px-3.5 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-700 text-white rounded-md shadow-xs transition-colors"
                  >
                    Lodge Public Vigilance Report
                  </button>
                </div>
              </div>

              {/* Parliamentary House Selector Tabs */}
              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleHouseTabChange('All')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    selectedHouseTab === 'All'
                      ? 'bg-blue-900 text-white shadow-2xs'
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  All Houses (788 Members)
                </button>
                <button
                  onClick={() => handleHouseTabChange('Lok Sabha')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    selectedHouseTab === 'Lok Sabha'
                      ? 'bg-blue-900 text-white shadow-2xs'
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Lok Sabha (543 Constituencies)
                </button>
                <button
                  onClick={() => handleHouseTabChange('Rajya Sabha')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    selectedHouseTab === 'Rajya Sabha'
                      ? 'bg-blue-900 text-white shadow-2xs'
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Rajya Sabha (245 States/UTs)
                </button>
              </div>
            </div>

            {/* Key Performance Indicators (eSAKSHI) */}
            <KpiCards stats={publicStats} loading={loading} />

            {/* Search & Filter Engine */}
            <SearchFilterPanel
              filters={filters}
              onFilterChange={setFilters}
              onReset={() =>
                setFilters({
                  search: '',
                  house: 'All',
                  state: 'All',
                  category: 'All',
                  status: 'All',
                  riskLevel: 'All'
                })
              }
              totalResults={filteredProjects.length}
            />

            {/* Interactive GIS OpenStreetMap */}
            <ErrorBoundary fallbackTitle="GIS Mapping System">
              <GisMap
                projects={filteredProjects}
                onSelectProject={(p) => setInspectedProject(p)}
                selectedProjectId={inspectedProject?.id}
              />
            </ErrorBoundary>

            {/* Parliamentary MP Progress Ledger Table */}
            <MpDataTable
              mps={filteredMpLedger}
              onSelectMp={(name) => setFilters((prev) => ({ ...prev, search: name }))}
            />

            {/* Public Works Directory Grid */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-2xs p-4">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Works Directory & Physical Inspection Registry
                  </h3>
                  <p className="text-xs text-gray-600">
                    Showing {filteredProjects.length} sanctioned community works
                  </p>
                </div>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-xs">
                  No development works match the selected search criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredProjects.map((p) => (
                    <div
                      key={p.id}
                      className="bg-gray-50/70 border border-gray-200 rounded-lg p-3.5 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                          <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {p.workId}
                          </span>
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded uppercase ${
                              p.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'Ongoing'
                                ? 'bg-blue-100 text-blue-800'
                                : p.status === 'Delayed'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-gray-900 line-clamp-2 mb-1">
                          {p.title}
                        </h4>

                        <div className="text-[11px] text-gray-600 mb-2 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="truncate">{p.district}, {p.state} ({p.constituency})</span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[11px] py-2 border-t border-gray-200/60 mb-2">
                          <div>
                            <span className="text-gray-500 text-[10px] block uppercase">Cost</span>
                            <span className="font-extrabold text-blue-950">
                              {formatLakhs(p.sanctionedCost || p.estimatedCost)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[10px] block uppercase">Representative</span>
                            <span className="font-semibold text-gray-800 truncate block">
                              {p.mpName}
                            </span>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="mb-2">
                          <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-0.5">
                            <span>Progress</span>
                            <span>{p.completionPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-1.5 bg-blue-900 rounded-full"
                              style={{ width: `${p.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setInspectedProject(p)}
                        className="w-full py-1.5 px-3 bg-white hover:bg-blue-900 hover:text-white text-blue-900 text-xs font-bold rounded border border-blue-900 transition-colors flex items-center justify-center gap-1 mt-2"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Work File</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: ROLE-BASED DASHBOARD (MP / ADMIN / AGENCY) */}
        {activeView === 'dashboard' && user && (
          <div>
            {user.role === 'mp' && (
              <MpDashboard
                user={user}
                projects={allProjects.filter((p) => p.mpId === user.userId || p.constituency === user.constituency)}
                alerts={allAlerts.filter((a) => {
                  const proj = allProjects.find((p) => p.id === a.projectId);
                  return proj && (proj.mpId === user.userId || proj.constituency === user.constituency);
                })}
                onSelectProject={(p) => setInspectedProject(p)}
                onRefreshData={loadPortalData}
              />
            )}

            {user.role === 'admin' && (
              <AdminDashboard
                user={user}
                projects={allProjects}
                alerts={allAlerts}
                onSelectProject={(p) => setInspectedProject(p)}
                onRefreshData={loadPortalData}
              />
            )}

            {user.role === 'agency' && (
              <AgencyDashboard
                user={user}
                projects={allProjects.filter(
                  (p) => p.agencyId === user.agencyId || p.agencyName === user.agencyName || user.userId === 'AGENCY001'
                )}
                onSelectProject={(p) => setInspectedProject(p)}
                onRefreshData={loadPortalData}
              />
            )}
          </div>
        )}

        {/* VIEW 3: AI INTEGRITY & STATISTICAL TESTBENCH */}
        {activeView === 'ai-lab' && (
          <AiVerificationLab
            projects={allProjects}
            onSelectProject={(p) => setInspectedProject(p)}
          />
        )}

        {/* VIEW 4: CITIZEN FEEDBACK & GRIEVANCE REDRESSAL */}
        {activeView === 'feedback' && (
          <CitizenFeedbackModal
            projects={allProjects}
            feedbackList={allFeedback}
            onFeedbackSubmitted={loadPortalData}
          />
        )}

        {/* VIEW 5: VENDOR & IMPLEMENTING AGENCY ANALYTICS */}
        {activeView === 'vendors' && (
          <VendorAnalyticsView
            vendors={allVendors}
            projects={allProjects}
            currentUser={user}
            onSelectProject={(p) => setInspectedProject(p)}
            onSanctionWorkWithVendor={(vendorName, agencyName) => {
              if (user && user.role === 'admin') {
                setActiveView('dashboard');
              } else {
                setIsLoginModalOpen(true);
              }
            }}
            onRefreshData={loadPortalData}
          />
        )}
      </main>

      {/* Official Sign-In Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Project Dossier Modal */}
      <ProjectDetailModal
        project={inspectedProject}
        feedbackList={allFeedback}
        onClose={() => setInspectedProject(null)}
        onOpenGrievanceForm={(p) => {
          setInspectedProject(null);
          setActiveView('feedback');
        }}
      />

      {/* Official Government Portal Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs mt-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="text-white font-bold text-sm mb-2">MPLADS AI Integrity System</div>
              <p className="text-[11px] leading-relaxed">
                Central Sector Scheme for Members of Parliament Local Area Development Scheme. Official monitoring
                portal under Ministry of Statistics and Programme Implementation (MoSPI).
              </p>
            </div>
            <div>
              <div className="text-white font-bold text-xs uppercase mb-2">Regulatory Reference</div>
              <ul className="space-y-1 text-[11px]">
                <li>MPLADS Guidelines (2010 Revision)</li>
                <li>eSAKSHI Digital Public Infrastructure</li>
                <li>District Magistrate Circulars</li>
                <li>Technical Feasibility Norms</li>
              </ul>
            </div>
            <div>
              <div className="text-white font-bold text-xs uppercase mb-2">Integrity Protocols</div>
              <ul className="space-y-1 text-[11px]">
                <li>EXIF Metadata Verification</li>
                <li>Haversine Geo-fence Proximity</li>
                <li>Cost Outlier Z-Score Regression</li>
                <li>Perceptual Image Hash Ledger</li>
              </ul>
            </div>
            <div>
              <div className="text-white font-bold text-xs uppercase mb-2">Security & Governance</div>
              <p className="text-[11px] leading-relaxed">
                Append-only immutable audit trail. All AI outputs are framed strictly as decision support requiring
                human review by the District Authority.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2">
            <div>
              Designed for transparency, accountability, and citizen oversight in parliamentary development expenditure.
            </div>
            <div className="text-slate-500">
              Government of India • National Informatics Centre Standard
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
