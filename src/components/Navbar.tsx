import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  LogOut,
  UserCheck,
  Building2,
  Landmark,
  Eye,
  Menu,
  X,
  ChevronDown,
  UserCog,
  Shield
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter.js';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onNavigateToAlerts?: () => void;
  onNavigateToProjects?: () => void;
  onNavigateToHome?: () => void;
  onOpenLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onNavigateToAlerts,
  onNavigateToProjects,
  onNavigateToHome,
  onOpenLogin
}) => {
  const { user, role, logout } = useAuth();
  const { language, setLanguage, t, translateRole } = useLanguage();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const getRoleDisplay = () => {
    switch (role) {
      case 'MP':
        return {
          title: translateRole('MP'),
          label: language === 'hi' ? 'सांसद पोर्टल' : 'MP Portal',
          name: user?.name || (language === 'hi' ? 'श्री राजेश कुमार, सांसद' : 'Shri Rajesh Kumar, MP'),
          icon: Landmark,
          theme: 'bg-govt-navy-light text-white border border-white/20'
        };
      case 'ADMIN':
        return {
          title: translateRole('ADMIN'),
          label: language === 'hi' ? 'ज़िला प्राधिकारी' : 'District Admin',
          name: user?.name || (language === 'hi' ? 'डॉ. अनन्या शर्मा, आईएएस' : 'Dr. Ananya Sharma, IAS'),
          icon: Building2,
          theme: 'bg-govt-navy-dark text-white border border-white/20'
        };
      case 'AGENCY':
        return {
          title: translateRole('AGENCY'),
          label: language === 'hi' ? 'एजेंसी डेस्क' : 'Agency Desk',
          name: user?.name || 'TSUDA - Hyderabad Zone',
          icon: UserCheck,
          theme: 'bg-govt-navy-light text-white border border-white/20'
        };
      default:
        return {
          title: translateRole('PUBLIC'),
          label: language === 'hi' ? 'नागरिक पोर्टल' : 'Public Access',
          name: language === 'hi' ? 'नागरिक' : 'Public Citizen',
          icon: Eye,
          theme: 'bg-govt-navy-dark text-white border border-white/20'
        };
    }
  };

  const roleInfo = getRoleDisplay();
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-govt-navy text-white border-b border-govt-navy-dark shadow-sm w-full">
      {/* National Tricolor Top Accent Stripe */}
      <div className="h-1 w-full bg-linear-to-r from-govt-saffron via-white to-emerald-600" />

      {/* Main Government Masthead */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4 w-full">
          {/* Left: Emblem & System Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              id="sidebar-toggle-btn"
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg text-white hover:bg-govt-navy-light focus:outline-hidden focus:ring-2 focus:ring-govt-saffron transition-colors cursor-pointer shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Institutional Shield & Ministry Name */}
            <div
              className={`flex items-center gap-2 sm:gap-3 min-w-0 ${onNavigateToHome ? 'cursor-pointer hover:opacity-95' : ''}`}
              onClick={onNavigateToHome}
              title={onNavigateToHome ? t.returnToHome : undefined}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-govt-saffron" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-panel-bg/80 font-semibold leading-tight flex items-center gap-1.5 truncate">
                  <span>{t.govIndia}</span>
                  <span className="text-white/60">•</span>
                  <span className="truncate">{t.mospiTitle}</span>
                </div>
                <div className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight flex items-center gap-1.5 sm:gap-2">
                  <span className="truncate">{t.portalName}</span>
                  <span className="text-[10px] px-1.5 sm:px-2 py-0.5 rounded-md bg-govt-saffron text-govt-navy-dark font-bold tracking-normal uppercase shrink-0">
                    {t.officialBadge}
                  </span>
                </div>
                <div className="text-[11px] text-panel-bg/80 font-normal leading-tight hidden xl:block truncate max-w-md">
                  {t.mpladsFullName}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Language Toggle, Role Selector, and Officer Login */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Bilingual Language Switcher (EN | हिन्दी) */}
            <div className="flex items-center bg-govt-navy-dark rounded-lg p-0.5 border border-white/20 text-xs shrink-0">
              <button
                id="lang-switch-en-btn"
                onClick={() => setLanguage('en')}
                aria-label="Switch to English"
                className={`px-1.5 sm:px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  language === 'en'
                    ? 'bg-white text-govt-navy shadow-xs'
                    : 'text-panel-bg/80 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                id="lang-switch-hi-btn"
                onClick={() => setLanguage('hi')}
                aria-label="हिन्दी भाषा चुनें"
                className={`px-1.5 sm:px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  language === 'hi'
                    ? 'bg-white text-govt-navy shadow-xs'
                    : 'text-panel-bg/80 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Notification Bell */}
            <NotificationCenter
              onNavigateToAlerts={onNavigateToAlerts}
              onNavigateToProjects={onNavigateToProjects}
            />

            {/* Officer Session Profile & Sign Out (Authenticated) */}
            {role !== 'PUBLIC' && user ? (
              <div className="relative shrink-0">
                <button
                  id="officer-session-menu-btn"
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${roleInfo.theme}`}
                  title={t.activeOfficerSession}
                  aria-label={t.activeOfficerSession}
                >
                  <RoleIcon className="w-3.5 h-3.5 shrink-0 text-govt-saffron" />
                  <span className="hidden lg:inline">{roleInfo.label}:</span>
                  <span className="truncate max-w-[80px] sm:max-w-[120px] md:max-w-[140px] font-normal">
                    {user.name.split(',')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 ml-0.5 opacity-80 shrink-0" />
                </button>

                {showRoleMenu && (
                  <div
                    className="absolute right-0 mt-2 w-72 bg-white text-slate-body rounded-xl shadow-lg border border-slate-border py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setShowRoleMenu(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-border">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-muted">
                        {t.authenticatedOfficial}
                      </div>
                      <div className="text-xs font-bold text-slate-body mt-0.5">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-slate-muted">
                        {user.designation || roleInfo.title}
                      </div>
                      <div className="text-[10px] font-mono text-govt-navy mt-1">
                        ID: {user.userId} • {user.district || user.constituency || 'Headquarters'}
                      </div>
                    </div>

                    <div className="px-3 py-2 text-[11px] text-slate-muted space-y-1 bg-panel-bg/50">
                      <div className="flex justify-between">
                        <span>{t.roleAuthority}:</span>
                        <span className="font-semibold text-slate-body">{translateRole(user.role)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{language === 'hi' ? 'सुरक्षा प्रोटोकॉल:' : 'Security Protocol:'}</span>
                        <span className="font-semibold text-emerald-700">
                          {language === 'hi' ? 'सरकारी टोकन सत्यापित' : 'Govt Token Verified'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 mt-1 border-t border-slate-border px-2">
                      <button
                        onClick={() => {
                          logout();
                          setShowRoleMenu(false);
                        }}
                        className="w-full px-2.5 py-1.5 text-left text-xs text-status-flagged hover:bg-red-50 rounded-lg flex items-center gap-2 font-medium cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.signOut}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Public Citizen Mode - Dedicated Officer Login Button */
              onOpenLogin && (
                <button
                  onClick={onOpenLogin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-govt-saffron hover:bg-govt-saffron-hover text-govt-navy-dark shadow-xs transition-colors cursor-pointer"
                  title={t.officerLogin}
                  aria-label={t.officerLogin}
                >
                  <UserCog className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.officerLogin}</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
