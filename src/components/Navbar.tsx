import React from 'react';
import { User } from '../types/index.ts';
import {
  ShieldAlert,
  Building2,
  User as UserIcon,
  LogOut,
  Bell,
  MapPin,
  FileCheck2,
  ExternalLink,
  ChevronDown,
  Briefcase
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeView: 'public' | 'dashboard' | 'ai-lab' | 'feedback' | 'vendors';
  setActiveView: (view: 'public' | 'dashboard' | 'ai-lab' | 'feedback' | 'vendors') => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  alertsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeView,
  setActiveView,
  onOpenLogin,
  onLogout,
  alertsCount
}) => {
  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      {/* National Tricolor Top Stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      {/* Main Government Portal Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Official Emblem and Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('public')}>
            <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center text-amber-400 font-bold border-2 border-amber-500 shadow-sm shrink-0">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Government of India
                </span>
                <span className="text-xs font-semibold text-gray-500 hidden md:inline">
                  Ministry of Statistics & Programme Implementation (MoSPI)
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-extrabold text-gray-900 leading-tight">
                MPLADS AI Integrity & Monitoring System
              </h1>
              <p className="text-xs text-gray-600 hidden sm:block">
                Members of Parliament Local Area Development Scheme — Official Integrity & eSAKSHI Portal
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <button
              onClick={() => setActiveView('public')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors ${
                activeView === 'public'
                  ? 'bg-blue-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Public Portal
            </button>

            <button
              onClick={() => setActiveView('ai-lab')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                activeView === 'ai-lab'
                  ? 'bg-indigo-900 text-white'
                  : 'text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>AI Integrity Lab</span>
            </button>

            <button
              onClick={() => setActiveView('vendors')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                activeView === 'vendors'
                  ? 'bg-blue-950 text-white shadow-xs'
                  : 'text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-500" />
              <span>Vendor Analytics</span>
            </button>

            <button
              onClick={() => setActiveView('feedback')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors ${
                activeView === 'feedback'
                  ? 'bg-emerald-800 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Citizen Feedback
            </button>

            {/* Official Auth Section */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                    activeView === 'dashboard'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>
                    {user.role === 'mp'
                      ? 'MP Console'
                      : user.role === 'admin'
                      ? 'District Authority'
                      : 'Agency Console'}
                  </span>
                </button>

                <div className="text-right hidden lg:block">
                  <div className="text-xs font-bold text-gray-900 truncate max-w-[140px]">{user.name}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                    {user.role === 'mp'
                      ? `${user.constituency} (MP)`
                      : user.role === 'admin'
                      ? 'District Magistrate'
                      : 'Implementing Agency'}
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-4 py-1.5 text-xs sm:text-sm font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-md shadow-xs flex items-center gap-1.5 transition-all"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Official Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Official Guidelines Disclaimer Bar */}
      <div className="bg-slate-100 border-t border-slate-200 py-1 px-4 text-center">
        <p className="text-[11px] text-slate-700 font-medium">
          <span className="font-bold text-blue-900">Official MoSPI Notice:</span> Conducted in strict compliance
          with MPLADS Guidelines (2010). All AI anomaly scores and risk metrics are provided strictly as{' '}
          <span className="font-semibold underline">decision support for human review</span>, not as conclusive proof of fraud.
        </p>
      </div>
    </header>
  );
};
