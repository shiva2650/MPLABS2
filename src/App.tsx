import React, { useState, useEffect } from 'react';
import { Project, UserProfile, AnomalyAlert, CitizenFeedback } from './types';
import { ApiService } from './services/api';
import { Header } from './components/Header';
import { PublicDashboard } from './components/PublicDashboard';
import { ProjectsListView } from './components/ProjectsListView';
import { GISProjectMap } from './components/GISProjectMap';
import { MPDashboard } from './components/MPDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AgencyDashboard } from './components/AgencyDashboard';
import { AnomalyAlertsCenter } from './components/AnomalyAlertsCenter';
import { VendorAnalyticsView } from './components/VendorAnalyticsView';
import { ReportsAndAuditView } from './components/ReportsAndAuditView';
import { VerificationWorkbench } from './components/VerificationWorkbench';
import { CitizenFeedbackSection } from './components/CitizenFeedbackSection';
import { ProjectDetailsModal } from './components/ProjectDetailsModal';
import { LoginModal } from './components/LoginModal';
import { Shield, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';

export default function App() {
  // Navigation & Authentication State
  const [currentView, setCurrentView] = useState<string>('public');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Global Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [feedback, setFeedback] = useState<CitizenFeedback[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Load Initial Data
  useEffect(() => {
    // Check local session
    const savedUser = ApiService.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
    }
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [pData, aData, fData] = await Promise.all([
        ApiService.getProjects().catch((err) => {
          console.error('Projects fetch error:', err);
          return [];
        }),
        ApiService.getAlerts().catch((err) => {
          console.error('Alerts fetch error:', err);
          return [];
        }),
        ApiService.getFeedback().catch((err) => {
          console.error('Feedback fetch error:', err);
          return [];
        }),
      ]);
      setProjects(pData || []);
      setAlerts(aData || []);
      setFeedback(fData || []);
    } catch (err) {
      console.error('Failed to load portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    // Automatically redirect to appropriate dashboard based on role
    if (user.role === 'MP') {
      setCurrentView('mp-portal');
    } else if (user.role === 'ADMIN') {
      setCurrentView('admin-portal');
    } else if (user.role === 'AGENCY') {
      setCurrentView('agency-portal');
    } else {
      setCurrentView('public');
    }
  };

  const handleLogout = () => {
    ApiService.logout();
    setCurrentUser(null);
    setCurrentView('public');
  };

  return (
    <div className="min-h-screen bg-[#F2F5F9] text-[#333] flex flex-col font-sans antialiased selection:bg-[#0A2540] selection:text-white">
      {/* Official Government Portal Header - Geometric Balance Theme */}
      <Header
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'dashboard') {
            if (!currentUser) {
              setIsLoginModalOpen(true);
            } else if (currentUser.role === 'MP') {
              setCurrentView('mp-portal');
            } else if (currentUser.role === 'ADMIN') {
              setCurrentView('admin-portal');
            } else if (currentUser.role === 'AGENCY') {
              setCurrentView('agency-portal');
            } else {
              setCurrentView('public');
            }
          } else if (view === 'public-portal') {
            setCurrentView('public');
          } else if (view === 'projects-list') {
            setCurrentView('projects');
          } else if (view === 'citizen-feedback') {
            setCurrentView('feedback');
          } else if (view === 'verification-workbench') {
            setCurrentView('workbench');
          } else {
            setCurrentView(view);
          }
        }}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        alertCount={alerts.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {loading && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#0A2540]" />
            <div className="text-sm font-semibold uppercase tracking-wider text-[#0A2540]">
              Connecting to MPLADS National Monitoring Database...
            </div>
          </div>
        ) : (
          <>
            {/* VIEW 1: PUBLIC DASHBOARD */}
            {currentView === 'public' && (
              <PublicDashboard
                projects={projects}
                onSelectProject={(p) => setSelectedProject(p)}
                onNavigate={(v) => setCurrentView(v)}
                onRefresh={loadAllData}
              />
            )}

            {/* VIEW 2: MASTER PROJECTS REPOSITORY */}
            {currentView === 'projects' && (
              <ProjectsListView
                projects={projects}
                currentUser={currentUser}
                onSelectProject={(p) => setSelectedProject(p)}
              />
            )}

            {/* VIEW 3: GIS GEO MAP */}
            {currentView === 'gis-map' && (
              <GISProjectMap
                projects={projects}
                onSelectProject={(p) => setSelectedProject(p)}
              />
            )}

            {/* VIEW 4: MEMBER OF PARLIAMENT WORKSPACE */}
            {currentView === 'mp-portal' && (
              currentUser && currentUser.role === 'MP' ? (
                <MPDashboard
                  currentUser={currentUser}
                  projects={projects}
                  onSelectProject={(p) => setSelectedProject(p)}
                  onRefresh={loadAllData}
                />
              ) : (
                <div className="bg-white border-t-4 border-[#0A2540] border-x border-b border-gray-200 rounded p-10 text-center space-y-4 shadow-sm">
                  <div className="p-3 bg-orange-50 text-[#F27D26] rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#0A2540] uppercase tracking-wide">
                    MP Authentication Required
                  </h3>
                  <p className="text-xs text-gray-600 max-w-md mx-auto">
                    Access to recommend new developmental works under MPLADS Guidelines (2010) is restricted to credentialed Members of Parliament.
                  </p>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-5 py-2.5 bg-[#0A2540] hover:bg-[#081d33] text-white font-bold text-xs uppercase tracking-wider rounded shadow-sm cursor-pointer"
                  >
                    Login as Member of Parliament
                  </button>
                </div>
              )
            )}

            {/* VIEW 5: DISTRICT NODAL AUTHORITY WORKSPACE */}
            {currentView === 'admin-portal' && (
              currentUser && currentUser.role === 'ADMIN' ? (
                <AdminDashboard
                  currentUser={currentUser}
                  projects={projects}
                  alerts={alerts}
                  onSelectProject={(p) => setSelectedProject(p)}
                  onNavigate={(v) => setCurrentView(v)}
                  onRefresh={loadAllData}
                />
              ) : (
                <div className="bg-white border-t-4 border-[#0A2540] border-x border-b border-gray-200 rounded p-10 text-center space-y-4 shadow-sm">
                  <div className="p-3 bg-blue-50 text-[#0A2540] rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#0A2540] uppercase tracking-wide">
                    District Authority Access Required
                  </h3>
                  <p className="text-xs text-gray-600 max-w-md mx-auto">
                    Administrative Sanction, technical scrutiny, and Implementing Agency assignment require District Nodal Authority credentials.
                  </p>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-5 py-2.5 bg-[#0A2540] hover:bg-[#081d33] text-white font-bold text-xs uppercase tracking-wider rounded shadow-sm cursor-pointer"
                  >
                    Login as District Authority (IAS Collector)
                  </button>
                </div>
              )
            )}

            {/* VIEW 6: IMPLEMENTING AGENCY WORKSPACE */}
            {currentView === 'agency-portal' && (
              currentUser && currentUser.role === 'AGENCY' ? (
                <AgencyDashboard
                  currentUser={currentUser}
                  projects={projects}
                  onSelectProject={(p) => setSelectedProject(p)}
                  onRefresh={loadAllData}
                />
              ) : (
                <div className="bg-white border-t-4 border-[#F27D26] border-x border-b border-gray-200 rounded p-10 text-center space-y-4 shadow-sm">
                  <div className="p-3 bg-orange-50 text-[#F27D26] rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#0A2540] uppercase tracking-wide">
                    Executing Agency Access Required
                  </h3>
                  <p className="text-xs text-gray-600 max-w-md mx-auto">
                    Physical execution progress reporting and geotagged photographic upload require authenticated Executing Agency credentials.
                  </p>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-5 py-2.5 bg-[#F27D26] hover:bg-[#d96817] text-white font-bold text-xs uppercase tracking-wider rounded shadow-sm cursor-pointer"
                  >
                    Login as Executing Agency Engineer
                  </button>
                </div>
              )
            )}

            {/* VIEW 7: AI ANOMALY ALERTS REVIEW CENTER */}
            {currentView === 'alerts-center' && (
              currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'MP') ? (
                <AnomalyAlertsCenter
                  alerts={alerts}
                  currentUser={currentUser}
                  onRefresh={loadAllData}
                  onSelectProjectById={(id) => {
                    const p = projects.find((item) => item.id === id);
                    if (p) setSelectedProject(p);
                  }}
                />
              ) : (
                <div className="bg-white border-t-4 border-red-600 border-x border-b border-gray-200 rounded p-10 text-center space-y-4 shadow-sm">
                  <div className="p-3 bg-red-50 text-red-700 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#0A2540] uppercase tracking-wide">
                    Authorized Personnel Only
                  </h3>
                  <p className="text-xs text-gray-600 max-w-md mx-auto">
                    To prevent misinterpretation, granular AI anomaly reasoning is restricted to District Administrators and Members of Parliament under Scheme Policy.
                  </p>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-5 py-2.5 bg-[#0A2540] hover:bg-[#081d33] text-white font-bold text-xs uppercase tracking-wider rounded shadow-sm cursor-pointer"
                  >
                    Login with Official Credentials
                  </button>
                </div>
              )
            )}

            {/* VIEW 8: VENDOR & AGENCY PERFORMANCE ANALYTICS */}
            {currentView === 'vendor-analytics' && (
              <VendorAnalyticsView />
            )}

            {/* VIEW 9: REPORTS & IMMUTABLE AUDIT TRAIL */}
            {currentView === 'reports-audit' && (
              <ReportsAndAuditView
                currentUser={currentUser || {
                  id: 'guest',
                  name: 'Public Viewer',
                  role: 'PUBLIC',
                }}
              />
            )}

            {/* VIEW 10: CITIZEN GRIEVANCES & FEEDBACK */}
            {currentView === 'feedback' && (
              <CitizenFeedbackSection
                feedbackList={feedback}
                projects={projects}
                onRefresh={loadAllData}
              />
            )}

            {/* VIEW 11: AI VERIFICATION TEST RUNNER / WORKBENCH */}
            {currentView === 'workbench' && (
              <VerificationWorkbench />
            )}
          </>
        )}
      </main>

      {/* Official Government Footer - Geometric Balance */}
      <footer className="mt-12 bg-[#0A2540] text-slate-300 border-t-4 border-[#F27D26] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-white font-bold text-sm flex items-center gap-2 uppercase tracking-wide">
                <span>MPLADS AI Integrity System</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                National transparency portal for monitoring Members of Parliament Local Area Development Scheme works, fund utilization, and physical asset verification.
              </p>
              <div className="text-[10px] text-[#F27D26] font-semibold uppercase tracking-wider">
                Aligned with official MPLADS Guidelines (2010).
              </div>
            </div>

            <div>
              <div className="text-white font-bold text-xs uppercase tracking-wider mb-2">
                Statutory Guidelines
              </div>
              <ul className="space-y-1 text-slate-400 text-[11px]">
                <li>• Annual Entitlement: ₹5.00 Crore / Year</li>
                <li>• SC Population Quota: Minimum 15%</li>
                <li>• ST Population Quota: Minimum 7.5%</li>
                <li>• Permissible Work Limits: Durable Assets</li>
                <li>• Prohibited Works: Movable items, maintenance</li>
              </ul>
            </div>

            <div>
              <div className="text-white font-bold text-xs uppercase tracking-wider mb-2">
                AI Integrity Framework
              </div>
              <ul className="space-y-1 text-slate-400 text-[11px]">
                <li>• Decision Support Policy for Human Review</li>
                <li>• EXIF &amp; GPS Haversine Geo-Verification</li>
                <li>• Perceptual Image Hash Reuse Screening</li>
                <li>• Statistical Cost Deviation (Z-Score &gt; 2.5σ)</li>
                <li>• Append-Only Immutable Audit Trail</li>
              </ul>
            </div>

            <div>
              <div className="text-white font-bold text-xs uppercase tracking-wider mb-2">
                Transparency &amp; Contact
              </div>
              <div className="space-y-1 text-slate-400 text-[11px]">
                <div>Ministry of Statistics &amp; Programme Implementation</div>
                <div>Government of India, New Delhi - 110001</div>
                <div className="pt-2 text-slate-400">
                  Data updated daily from District Nodal Authorities and Executing Agencies.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <div>
              © 2026 Government of India • Ministry of Statistics and Programme Implementation (MoSPI)
            </div>
            <div className="flex items-center gap-4 text-[#F27D26]">
              <span>Security Audited</span>
              <span className="text-slate-600">•</span>
              <span>Append-Only Logs</span>
              <span className="text-slate-600">•</span>
              <span>Citizen Grievance Redressal</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          currentUser={currentUser}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
