import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LanguageProvider, useLanguage } from './context/LanguageContext.js';
import { Project, RiskAlert } from './types/index.js';
import { useDataService } from './services/dataService.js';

// Layout Components
import { Navbar } from './components/Navbar.js';
import { Sidebar, TAB_ALLOWED_ROLES } from './components/Sidebar.js';
import { OfficerRestrictedGate } from './components/OfficerRestrictedGate.js';
import { GISMap } from './components/GISMap.js';
import { ProjectModal } from './components/ProjectModal.js';
import { RecommendModal } from './components/RecommendModal.js';
import { AlertActionModal } from './components/AlertActionModal.js';

// Pages
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ProjectsPage } from './pages/ProjectsPage.js';
import { AiAnomaliesPage } from './pages/AiAnomaliesPage.js';
import { AlertManagementPage } from './pages/AlertManagementPage.js';
import { RecommendationsPage } from './pages/RecommendationsPage.js';
import { FundsLedgerPage } from './pages/FundsLedgerPage.js';
import { AgencyWorkdeskPage } from './pages/AgencyWorkdeskPage.js';
import { VendorAnalyticsPage } from './pages/VendorAnalyticsPage.js';
import { CitizenFeedbackPage } from './pages/CitizenFeedbackPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { VerificationStatusPage } from './pages/VerificationStatusPage.js';
import { AuditLogPage } from './pages/AuditLogPage.js';
import { ContractorNetworkFraudPage } from './pages/ContractorNetworkFraudPage.js';
import { DataIngestionImpactPage } from './pages/DataIngestionImpactPage.js';
import { CitizenChatbotDrawer } from './components/CitizenChatbotDrawer.js';

import { RefreshCw, ArrowLeft } from 'lucide-react';

type AppViewMode = 'home' | 'workspace' | 'login';

const MainAppContent: React.FC = () => {
  const { user, currentUser, isPublicMode, enterPublicMode, exitPublicMode, logout, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const effectiveUser = user || currentUser;

  // Top-level View Routing:
  // - 'home': Official MoSPI MPLADS Portal Home & Public Dashboard (LandingPage)
  // - 'workspace': Interactive Operational Workspace (Dashboard, GIS map, AI anomalies, etc.)
  // - 'login': Officer authentication screen
  const [viewMode, setViewMode] = useState<AppViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('mplads_current_view');
      if (saved === 'workspace' || saved === 'login') {
        return saved as AppViewMode;
      }
    }
    return 'home';
  });
  const [loginPresetRole, setLoginPresetRole] = useState<'MP' | 'ADMIN' | 'AGENCY' | undefined>(undefined);

  const navigateToHome = () => {
    setViewMode('home');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mplads_current_view', 'home');
    }
  };

  const navigateToWorkspace = () => {
    setViewMode('workspace');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mplads_current_view', 'workspace');
    }
  };

  const navigateToLogin = (role?: 'MP' | 'ADMIN' | 'AGENCY') => {
    setLoginPresetRole(role);
    setViewMode('login');
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mplads_current_view', 'login');
    }
  };

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Dedicated Service Layer: replaces local in-memory arrays with asynchronous backend calls
  // Guarantees persistence of projects, alerts, summary metrics, and feedback across restarts
  const {
    projects,
    alerts,
    summary,
    feedbackList,
    loading,
    refreshing,
    refreshData: fetchData
  } = useDataService();

  // Active Modals State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectInitialTab, setSelectedProjectInitialTab] = useState<'overview' | 'ai-risk' | 'photos' | 'financials' | 'documents' | 'audit-report'>('overview');
  const [isRecommendOpen, setIsRecommendOpen] = useState<boolean>(false);
  const [activeAlertForAction, setActiveAlertForAction] = useState<RiskAlert | null>(null);

  const handleSelectProject = (p: Project | null, tab?: 'overview' | 'ai-risk' | 'photos' | 'financials' | 'documents' | 'audit-report') => {
    setSelectedProject(p);
    setSelectedProjectInitialTab(tab || 'overview');
  };

  const effectiveRole = isPublicMode ? 'PUBLIC' : effectiveUser?.role || 'PUBLIC';

  // While restoring session from localStorage, show gentle loader
  if (authLoading) {
    return (
      <div className="min-h-screen bg-panel-bg flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-slate-border shadow-xs">
          <RefreshCw className="w-6 h-6 text-govt-navy animate-spin" />
          <span className="text-xs font-semibold text-slate-muted">{t.verifyingSession}</span>
        </div>
      </div>
    );
  }

  // 1. Officer Login View
  if (viewMode === 'login') {
    return (
      <LoginPage
        onBackToHome={navigateToHome}
        onEnterPublic={() => {
          enterPublicMode();
          navigateToWorkspace();
        }}
        onLoginSuccess={navigateToWorkspace}
        initialRole={loginPresetRole}
      />
    );
  }

  // 2. Official Portal Home View (LandingPage)
  if (viewMode === 'home') {
    return (
      <>
        <LandingPage
          summary={summary}
          projects={projects}
          currentUser={effectiveUser}
          userRole={effectiveRole}
          onOpenLogin={navigateToLogin}
          onEnterPublic={() => {
            enterPublicMode();
            navigateToWorkspace();
          }}
          onReturnToWorkspace={navigateToWorkspace}
          onLogout={() => {
            logout();
            navigateToHome();
          }}
          onSelectProject={(p) => handleSelectProject(p)}
        />

        {/* Modal for Project details preview from Landing Page */}
        <ProjectModal
          project={selectedProject}
          initialTab={selectedProjectInitialTab}
          onClose={() => setSelectedProject(null)}
          userRole={effectiveRole}
          onRefresh={fetchData}
        />

        {/* Citizen AI Assistant accessible from Portal Home */}
        <CitizenChatbotDrawer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col font-sans antialiased text-slate-body overflow-x-hidden w-full max-w-full">
      {/* Top Navigation Masthead */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNavigateToAlerts={() => setCurrentTab('alerts')}
        onNavigateToProjects={() => setCurrentTab('projects')}
        onNavigateToHome={navigateToHome}
        onOpenLogin={() => navigateToLogin()}
      />

      {/* Main Workspace Layout with Sidebar and Content View */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 gap-6">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={tab => {
            setCurrentTab(tab);
            setSidebarOpen(false);
          }}
          pendingAlertsCount={alerts.filter(a => a.status === 'New').length}
          unreadFeedbackCount={feedbackList.filter(f => f.status === 'New' || f.status === 'Under Review').length}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigateToHome={navigateToHome}
        />

        {/* Dynamic Main Stage */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-border shadow-xs">
              <RefreshCw className="w-8 h-8 text-govt-navy animate-spin" />
              <div className="text-xs font-semibold text-slate-muted">
                Loading official MPLADS dataset & executing AI integrity heuristics...
              </div>
            </div>
          ) : (
            <>
              {/* Active Tab Routing */}
              {currentTab === 'dashboard' && (
                <DashboardPage
                  summary={summary}
                  projects={projects}
                  alerts={alerts}
                  userRole={effectiveRole}
                  onSelectProject={p => setSelectedProject(p)}
                  onNavigateToAnomalies={() => setCurrentTab('anomalies')}
                  onNavigateToRecommend={() => setIsRecommendOpen(true)}
                  onNavigateToMap={() => setCurrentTab('map')}
                />
              )}

              {currentTab === 'map' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentTab('dashboard')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-govt-navy bg-white border border-slate-border hover:bg-panel-bg rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>← Back to Overview</span>
                    </button>
                    <span className="text-xs text-slate-muted">
                      Dashboard &gt; Map Surveillance
                    </span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-body tracking-tight">
                      Geographic Information System (GIS) Surveillance
                    </h1>
                    <p className="text-xs text-slate-muted">
                      Georeferenced project footprints, territorial proximity analysis, and duplicate cluster detection
                    </p>
                  </div>
                  <GISMap
                    projects={projects}
                    selectedProjectId={selectedProject?.id}
                    onSelectProject={p => setSelectedProject(p)}
                  />
                </div>
              )}

              {currentTab === 'projects' && (
                <ProjectsPage
                  projects={projects}
                  userRole={effectiveRole}
                  onSelectProject={p => handleSelectProject(p)}
                  onNavigateToRecommend={() => setIsRecommendOpen(true)}
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                />
              )}

              {currentTab === 'anomalies' && (
                <AiAnomaliesPage
                  projects={projects}
                  alerts={alerts}
                  onSelectProject={(p, tab) => handleSelectProject(p, tab)}
                  onOpenAlertAction={a => setActiveAlertForAction(a)}
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                />
              )}

              {currentTab === 'alerts' && (
                <AlertManagementPage
                  alerts={alerts}
                  projects={projects}
                  onOpenAlertAction={a => setActiveAlertForAction(a)}
                  onSelectProject={p => handleSelectProject(p)}
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                />
              )}

              {(currentTab === 'recommendations' || currentTab === 'recommend') && (
                <RecommendationsPage
                  projects={projects}
                  userRole={effectiveRole}
                  onOpenRecommend={() => setIsRecommendOpen(true)}
                  onSelectProject={p => setSelectedProject(p)}
                  onRefresh={fetchData}
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                />
              )}

              {currentTab === 'funds' && (
                <FundsLedgerPage
                  projects={projects}
                  userRole={effectiveRole}
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                />
              )}

              {(currentTab === 'agency' || currentTab === 'agency-workdesk') && (
                <AgencyWorkdeskPage
                  projects={projects}
                  userRole={effectiveRole}
                  onSelectProject={p => setSelectedProject(p)}
                  onRefresh={fetchData}
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                />
              )}

              {currentTab === 'vendors' && (
                <VendorAnalyticsPage
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                />
              )}

              {(currentTab === 'grievances' || currentTab === 'feedback') && (
                <CitizenFeedbackPage
                  feedbackList={feedbackList}
                  projects={projects}
                  userRole={effectiveRole}
                  onRefresh={fetchData}
                  onSelectProject={p => setSelectedProject(p)}
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                />
              )}

              {currentTab === 'reports' && (
                <ReportsPage
                  projects={projects}
                  alerts={alerts}
                  userRole={effectiveRole}
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                />
              )}

              {currentTab === 'verification' && (
                <VerificationStatusPage
                  projects={projects}
                  onSelectProject={p => setSelectedProject(p)}
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                />
              )}

              {(currentTab === 'audit' || currentTab === 'audit-logs') && (
                !TAB_ALLOWED_ROLES['audit-logs'].includes(effectiveRole as any) ? (
                  <OfficerRestrictedGate
                    toolName="Immutable Ledger Audit Trail"
                    toolDescription="Cryptographic hash-chained audit logs and tamper-verification certificates are restricted to certified District Authority auditors."
                    onLogin={() => navigateToLogin('ADMIN')}
                    onReturnToPublic={() => setCurrentTab('dashboard')}
                  />
                ) : (
                  <AuditLogPage
                    onBackToDashboard={() => setCurrentTab('dashboard')}
                  />
                )
              )}

              {currentTab === 'network-fraud' && (
                !TAB_ALLOWED_ROLES['network-fraud'].includes(effectiveRole as any) ? (
                  <OfficerRestrictedGate
                    toolName="Contractor Link Graph & Network Fraud Detection"
                    toolDescription="Forensic vendor relationship graphs, common director detection, and bid collusion algorithms are restricted to District Vigilance Administrators."
                    onLogin={() => navigateToLogin('ADMIN')}
                    onReturnToPublic={() => setCurrentTab('dashboard')}
                  />
                ) : (
                  <ContractorNetworkFraudPage
                    onBackToDashboard={() => setCurrentTab('dashboard')}
                  />
                )
              )}

              {currentTab === 'data-ingestion' && (
                <DataIngestionImpactPage
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Citizen Chatbot Drawer */}
      <CitizenChatbotDrawer />

      {/* Global Modals */}
      {/* 1. Project Detailed Audit & Photo Verification Modal */}
      <ProjectModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onRefresh={fetchData}
        userRole={effectiveRole}
        initialTab={selectedProjectInitialTab}
      />

      {/* 2. MP New Project Recommendation Modal */}
      <RecommendModal
        isOpen={isRecommendOpen}
        onClose={() => setIsRecommendOpen(false)}
        onSuccess={() => {
          setIsRecommendOpen(false);
          fetchData();
        }}
      />

      {/* 3. District Authority Alert Action Modal */}
      <AlertActionModal
        alert={activeAlertForAction}
        isOpen={!!activeAlertForAction}
        onClose={() => setActiveAlertForAction(null)}
        onSuccess={() => {
          setActiveAlertForAction(null);
          fetchData();
        }}
      />

      {/* Official Government Footer */}
      <footer className="bg-white border-t border-slate-border mt-auto py-4 px-6 text-xs text-slate-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-body">{t.portalName}</span>
            <span>•</span>
            <span>{t.nicGov}</span>
          </div>
          <div className="text-[11px] text-slate-muted">
            {t.footerCompliance}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
