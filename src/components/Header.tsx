import React from 'react';
import { UserProfile } from '../types';
import {
  ShieldAlert,
  Building2,
  FileCheck,
  UserCheck,
  LogOut,
  MapPin,
  FileText,
  Activity,
  AlertTriangle,
  Beaker,
  MessageSquare,
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserProfile | null;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  alertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onOpenLogin,
  onLogout,
  alertCount,
}) => {
  const isOfficial = currentUser && currentUser.role !== 'PUBLIC';

  // Helper to determine if a nav item is active
  const isNavActive = (key: string) => {
    if (key === 'public-portal' && (currentView === 'public-portal' || currentView === 'public')) return true;
    if (key === 'gis-map' && currentView === 'gis-map') return true;
    if (key === 'citizen-feedback' && (currentView === 'citizen-feedback' || currentView === 'feedback')) return true;
    if (key === 'dashboard' && (currentView === 'dashboard' || currentView === 'mp-portal' || currentView === 'admin-portal' || currentView === 'agency-portal')) return true;
    if (key === 'projects-list' && (currentView === 'projects-list' || currentView === 'projects')) return true;
    if (key === 'alerts-center' && currentView === 'alerts-center') return true;
    if (key === 'vendor-analytics' && currentView === 'vendor-analytics') return true;
    if (key === 'reports-audit' && currentView === 'reports-audit') return true;
    if (key === 'verification-workbench' && (currentView === 'verification-workbench' || currentView === 'workbench')) return true;
    return false;
  };

  return (
    <header className="bg-[#0A2540] text-white border-b-4 border-[#F27D26] shadow-md sticky top-0 z-40">
      {/* Top MoSPI Government Header Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Circular National Emblem badge in Geometric Balance style */}
          <div className="w-12 h-12 bg-white rounded-full flex flex-col items-center justify-center font-bold text-[#0A2540] text-lg shrink-0 shadow-md">
            <span className="text-[10px] tracking-widest font-black leading-none text-[#F27D26]">GOI</span>
            <span className="text-[9px] font-bold leading-none text-[#0A2540] mt-0.5">भारत</span>
          </div>
          <div>
            <div className="text-[10px] text-gray-300 uppercase tracking-[0.2em] font-medium">
              Ministry of Statistics and Programme Implementation • Government of India
            </div>
            <h1 className="text-base sm:text-lg font-bold leading-tight uppercase tracking-wider text-white">
              MPLADS AI Integrity &amp; Monitoring System
            </h1>
            <p className="text-[11px] text-slate-300">
              Members of Parliament Local Area Development Scheme — Guidelines (2010) Compliance Portal
            </p>
          </div>
        </div>

        {/* User Status / Official Login Button */}
        <div className="flex items-center gap-3 shrink-0">
          {isOfficial ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold uppercase tracking-wider text-white">{currentUser.name}</div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wide flex items-center justify-end gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                  <span className="font-bold text-[#F27D26]">{currentUser.role}</span>
                  {currentUser.constituency && <span>• {currentUser.constituency}</span>}
                  {currentUser.district && !currentUser.constituency && <span>• {currentUser.district}</span>}
                </div>
              </div>
              <button
                id="header-btn-logout"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white bg-[#081e35] hover:bg-[#071729] border border-slate-700 rounded shadow-xs transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              id="header-btn-login"
              onClick={onOpenLogin}
              className="bg-[#F27D26] hover:bg-[#d96817] text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              Official Login
            </button>
          )}
        </div>
      </div>

      {/* Primary Portal Navigation Bar with Geometric Balance Styling */}
      <nav className="bg-[#081e35] border-t border-[#0f3459]/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto py-1">
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs font-semibold uppercase tracking-wider">
            {/* Links available to all */}
            <button
              id="nav-btn-home"
              onClick={() => onNavigate('public')}
              className={`px-3 py-1.5 rounded text-xs transition-colors whitespace-nowrap cursor-pointer ${
                isNavActive('public-portal')
                  ? 'bg-[#0A2540] text-white font-bold border-b-2 border-[#F27D26] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-[#0A2540]/60'
              }`}
            >
              Public Portal
            </button>

            <button
              id="nav-btn-gis"
              onClick={() => onNavigate('gis-map')}
              className={`px-3 py-1.5 rounded text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isNavActive('gis-map')
                  ? 'bg-[#0A2540] text-white font-bold border-b-2 border-[#F27D26] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-[#0A2540]/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              GIS Analysis
            </button>

            <button
              id="nav-btn-feedback"
              onClick={() => onNavigate('feedback')}
              className={`px-3 py-1.5 rounded text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isNavActive('citizen-feedback')
                  ? 'bg-[#0A2540] text-white font-bold border-b-2 border-[#F27D26] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-[#0A2540]/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#F27D26]" />
              Citizen Feedback
            </button>

            {/* Official Dashboard Navigation (Shown when logged in) */}
            {isOfficial && (
              <>
                <button
                  id="nav-btn-dashboard"
                  onClick={() => onNavigate('dashboard')}
                  className={`px-3 py-1.5 rounded text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isNavActive('dashboard')
                      ? 'bg-[#0A2540] text-white font-bold border-b-2 border-[#F27D26] shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-[#0A2540]/60'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-sky-400" />
                  My Dashboard ({currentUser.role})
                </button>

                <button
                  id="nav-btn-projects"
                  onClick={() => onNavigate('projects')}
                  className={`px-3 py-1.5 rounded text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isNavActive('projects-list')
                  ? 'bg-[#0A2540] text-white font-bold border-b-2 border-[#F27D26] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-[#0A2540]/60'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5 text-slate-300" />
                  Project Repository
                </button>

                <button
                  id="nav-btn-alerts"
                  onClick={() => onNavigate('alerts-center')}
                  className={`px-3 py-1.5 rounded text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isNavActive('alerts-center')
                  ? 'bg-[#0A2540] text-white font-bold border-b-2 border-[#F27D26] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-[#0A2540]/60'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  AI Anomaly Alerts
                  {alertCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-white font-bold rounded text-[9px]">
                      {alertCount}
                    </span>
                  )}
                </button>

                <button
                  id="nav-btn-vendors"
                  onClick={() => onNavigate('vendor-analytics')}
                  className={`px-3 py-1.5 rounded text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isNavActive('vendor-analytics')
                  ? 'bg-[#0A2540] text-white font-bold border-b-2 border-[#F27D26] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-[#0A2540]/60'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  Agency Analytics
                </button>

                <button
                  id="nav-btn-reports"
                  onClick={() => onNavigate('reports-audit')}
                  className={`px-3 py-1.5 rounded text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isNavActive('reports-audit')
                  ? 'bg-[#0A2540] text-white font-bold border-b-2 border-[#F27D26] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-[#0A2540]/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-slate-300" />
                  Audit Trail &amp; Reports
                </button>
              </>
            )}

            {/* Test Workbench */}
            <button
              id="nav-btn-workbench"
              onClick={() => onNavigate('workbench')}
              className={`px-3 py-1.5 rounded text-xs transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isNavActive('verification-workbench')
                  ? 'bg-[#0A2540] text-white font-bold border-b-2 border-[#F27D26] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-[#0A2540]/60'
              }`}
            >
              <Beaker className="w-3.5 h-3.5 text-purple-400" />
              AI Test Workbench
            </button>
          </div>

          <div className="hidden lg:flex items-center text-[10px] text-slate-400 uppercase tracking-wider gap-2 shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 text-[#F27D26]" />
            <span>AI Decision Support System</span>
          </div>
        </div>
      </nav>
    </header>
  );
};
