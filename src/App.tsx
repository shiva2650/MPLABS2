import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Project, RiskAlert, DashboardSummary, CitizenFeedback } from './types/index.js';
import { api } from './services/api.js';

import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { GISMap } from './components/GISMap.js';
import { ProjectModal } from './components/ProjectModal.js';
import { RecommendModal } from './components/RecommendModal.js';
import { AlertActionModal } from './components/AlertActionModal.js';

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
import { AuditLogPage } from './pages/AuditLogPage.js';
import { SatelliteVerificationPage } from './pages/SatelliteVerificationPage.js';
import { ContractorNetworkFraudPage } from './pages/ContractorNetworkFraudPage.js';
import { DataIngestionImpactPage } from './pages/DataIngestionImpactPage.js';
import { CitizenChatbotDrawer } from './components/CitizenChatbotDrawer.js';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, currentUser, isPublicMode, enterPublicMode, exitPublicMode, loading: authLoading } = useAuth();
  const effectiveUser = user || currentUser;

  const [unauthenticatedView, setUnauthenticatedView] = useState<'landing' | 'login'>('landing');
  const [loginPresetRole, setLoginPresetRole] = useState<any>(undefined);

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [feedbackList, setFeedbackList] = useState<CitizenFeedback[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectInitialTab, setSelectedProjectInitialTab] = useState<any>('overview');
  const [isRecommendOpen, setIsRecommendOpen] = useState<boolean>(false);
  const [activeAlertForAction, setActiveAlertForAction] = useState<RiskAlert | null>(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<any[]>([]);

  const handleSelectProject = async (p: Project | null, tab?: any) => {
    if (!p) {
      setSelectedProject(null);
      setDuplicateCandidates([]);
      return;
    }
    setSelectedProject(p);
    setSelectedProjectInitialTab(tab || 'overview');
    try {
      const res = await api.getProjectById(p.id);
      if (res?.duplicateCandidates) {
        setDuplicateCandidates(res.duplicateCandidates);
      }
    } catch {
      setDuplicateCandidates([]);
    }
  };

  const effectiveRole = isPublicMode ? 'PUBLIC' : effectiveUser?.role || 'PUBLIC';

  const fetchData = useCallback(async () => {
    try {
      const [projectsRes, alertsRes, summaryRes, feedbackRes] = await Promise.all([
        api.getProjects(),
        api.getAlerts().catch(() => ({ alerts: [] })),
        api.getDashboardSummary().catch(() => null),
        api.getCitizenFeedback().catch(() => ({ feedback: [] }))
      ]);
      setProjects(projectsRes.projects || []);
      setAlerts(alertsRes.alerts || []);
      setSummary(summaryRes || null);
      setFeedbackList(feedbackRes.feedback || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9F7] flex items-center justify-center font-sans">
        <RefreshCw className="w-6 h-6 text-[#395C40] animate-spin" />
      </div>
    );
  }

  if (!effectiveUser && !isPublicMode) {
    if (unauthenticatedView === 'login') {
      return (
        <LoginPage
          onBackToHome={() => setUnauthenticatedView('landing')}
          onEnterPublic={enterPublicMode}
          initialRole={loginPresetRole}
        />
      );
    }
    return (
      <>
        <LandingPage
          summary={summary}
          projects={projects}
          onOpenLogin={(role) => {
            setLoginPresetRole(role);
            setUnauthenticatedView('login');
          }}
          onEnterPublic={enterPublicMode}
          onSelectProject={(p) => handleSelectProject(p)}
        />
        <ProjectModal
          project={selectedProject}
          onClose={() => handleSelectProject(null)}
          userRole="PUBLIC"
          duplicateCandidates={duplicateCandidates}
        />
      </>
    );
  }

  const criticalAlertsCount = alerts.filter(
    a => (a.status === 'New' || a.status === 'Under Review') && (a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL')
  ).length;

  return (
    <div className="min-h-screen bg-[#F8F9F7] flex flex-col font-sans antialiased text-[#1B3022]">
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenRecommend={() => setIsRecommendOpen(true)}
        criticalAlertsCount={criticalAlertsCount}
        onNavigateToHome={() => {
          if (isPublicMode) exitPublicMode();
          setUnauthenticatedView('landing');
        }}
        onOpenLogin={() => {
          if (isPublicMode) exitPublicMode();
          setUnauthenticatedView('login');
        }}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 gap-6">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={tab => {
            setCurrentTab(tab);
            setSidebarOpen(false);
          }}
          pendingAlertsCount={alerts.filter(a => a.status === 'New').length}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigateToHome={() => {
            if (isPublicMode) exitPublicMode();
            setUnauthenticatedView('landing');
          }}
        />

        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-[#DDE5D4]">
              <RefreshCw className="w-8 h-8 text-[#395C40] animate-spin" />
              <div className="text-xs font-semibold text-[#588157]">Loading verified government records...</div>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardPage
                  summary={summary}
                  projects={projects}
                  alerts={alerts}
                  userRole={effectiveRole}
                  onSelectProject={p => handleSelectProject(p)}
                  onNavigateToAnomalies={() => setCurrentTab('anomalies')}
                  onNavigateToRecommend={() => setIsRecommendOpen(true)}
                  onNavigateToMap={() => setCurrentTab('map')}
                />
              )}
              {currentTab === 'map' && (
                <div className="space-y-4">
                  <h1 className="text-xl font-bold text-[#1B3022]">Geographic Information System (GIS) Surveillance</h1>
                  <GISMap projects={projects} onSelectProject={p => handleSelectProject(p)} />
                </div>
              )}
              {currentTab === 'projects' && (
                <ProjectsPage
                  projects={projects}
                  userRole={effectiveRole}
                  onSelectProject={p => handleSelectProject(p)}
                  onNavigateToRecommend={() => setIsRecommendOpen(true)}
                />
              )}
              {currentTab === 'anomalies' && (
                <AiAnomaliesPage
                  projects={projects}
                  alerts={alerts}
                  onSelectProject={(p, tab) => handleSelectProject(p, tab)}
                  onOpenAlertAction={a => setActiveAlertForAction(a)}
                />
              )}
              {currentTab === 'alerts' && (
                <AlertManagementPage
                  alerts={alerts}
                  projects={projects}
                  onOpenAlertAction={a => setActiveAlertForAction(a)}
                  onSelectProject={p => handleSelectProject(p)}
                />
              )}
              {(currentTab === 'recommend' || currentTab === 'recommendations') && (
                <RecommendationsPage
                  projects={projects}
                  userRole={effectiveRole}
                  onOpenRecommend={() => setIsRecommendOpen(true)}
                  onSelectProject={p => handleSelectProject(p)}
                  onRefresh={fetchData}
                />
              )}
              {currentTab === 'funds' && (
                <FundsLedgerPage projects={projects} userRole={effectiveRole} />
              )}
              {(currentTab === 'agency' || currentTab === 'agency-workdesk') && (
                <AgencyWorkdeskPage
                  projects={projects}
                  userRole={effectiveRole}
                  onSelectProject={p => handleSelectProject(p)}
                  onRefresh={fetchData}
                />
              )}
              {currentTab === 'vendors' && <VendorAnalyticsPage />}
              {(currentTab === 'feedback' || currentTab === 'grievances') && (
                <CitizenFeedbackPage
                  feedbackList={feedbackList}
                  projects={projects}
                  userRole={effectiveRole}
                  onRefresh={fetchData}
                  onSelectProject={p => handleSelectProject(p)}
                />
              )}
              {currentTab === 'reports' && <ReportsPage projects={projects} alerts={alerts} userRole={effectiveRole} />}
              {(currentTab === 'audit-logs' || currentTab === 'audit') && <AuditLogPage />}
              {currentTab === 'satellite' && <SatelliteVerificationPage projects={projects} onSelectProject={p => handleSelectProject(p)} />}
              {currentTab === 'network-fraud' && <ContractorNetworkFraudPage />}
              {currentTab === 'data-ingestion' && <DataIngestionImpactPage />}
            </>
          )}
        </main>
      </div>

      <CitizenChatbotDrawer />

      <ProjectModal
        project={selectedProject}
        onClose={() => handleSelectProject(null)}
        onRefresh={fetchData}
        userRole={effectiveRole}
        duplicateCandidates={duplicateCandidates}
        initialTab={selectedProjectInitialTab}
      />

      <RecommendModal
        isOpen={isRecommendOpen}
        onClose={() => setIsRecommendOpen(false)}
        onSuccess={() => { setIsRecommendOpen(false); fetchData(); }}
      />

      <AlertActionModal
        alert={activeAlertForAction}
        isOpen={!!activeAlertForAction}
        onClose={() => setActiveAlertForAction(null)}
        onSuccess={() => { setActiveAlertForAction(null); fetchData(); }}
      />

      <footer className="bg-white border-t border-[#DDE5D4] mt-auto py-4 px-6 text-xs text-[#588157]">
        <div className="max-w-7xl mx-auto flex justify-between">
          <span>MPLADS AI Integrity System • MoSPI Government of India</span>
          <span>eSAKSHI Overlay Architecture</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
