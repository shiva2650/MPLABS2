import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { UserRole } from '../types/index.js';
import {
  Home,
  FolderKanban,
  IndianRupee,
  AlertTriangle,
  ShieldCheck,
  FileBarChart,
  MessageCircleQuestion,
  UserCog,
  MapPin,
  FilePlus2,
  HardHat,
  Building,
  MessageSquareWarning,
  ScrollText,
  Network,
  Calculator
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'projects'
  | 'funds'
  | 'alerts'
  | 'anomalies'
  | 'verification'
  | 'reports'
  | 'help'
  | 'feedback'
  | 'map'
  | 'recommend'
  | 'agency-workdesk'
  | 'vendors'
  | 'audit-logs'
  | 'network-fraud'
  | 'data-ingestion';

/**
 * Single source of truth for tab access permissions across Sidebar navigation
 * and App routing defense-in-depth gates.
 */
export const TAB_ALLOWED_ROLES: Record<string, (UserRole | 'PUBLIC')[]> = {
  dashboard: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC'],
  projects: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC'],
  funds: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC'],
  alerts: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC'],
  anomalies: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC'],
  verification: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC'],
  reports: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC'],
  help: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC'],
  feedback: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC'],
  map: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC'],
  recommend: ['MP', 'ADMIN'],
  'agency-workdesk': ['AGENCY', 'ADMIN'],
  vendors: ['ADMIN', 'MP'],
  'network-fraud': ['ADMIN'],
  'audit-logs': ['ADMIN'],
  'data-ingestion': ['ADMIN', 'MP']
};

interface SidebarProps {
  currentTab: NavTab | string;
  onSelectTab: (tab: any) => void;
  pendingAlertsCount?: number;
  unreadFeedbackCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateToHome?: () => void;
  onOpenLogin?: () => void;
  onOpenHelp?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingAlertsCount = 0,
  unreadFeedbackCount = 0,
  isOpen = false,
  onClose,
  onNavigateToHome,
  onOpenLogin,
  onOpenHelp
}) => {
  const { role } = useAuth();
  const { t, translateRole, language } = useLanguage();

  interface NavItem {
    id: NavTab;
    label: string;
    icon: any;
    badge?: number;
    badgeColor?: string;
    roles: UserRole[];
    section?: string;
    isOfficerOnly?: boolean;
  }

  const navItems: NavItem[] = [
    // Core Public & Oversight Navigation
    {
      id: 'dashboard',
      label: t.home,
      icon: Home,
      roles: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC']
    },
    {
      id: 'projects',
      label: t.projects,
      icon: FolderKanban,
      roles: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC']
    },
    {
      id: 'funds',
      label: t.funds,
      icon: IndianRupee,
      roles: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC']
    },
    {
      id: 'alerts',
      label: t.alerts,
      icon: AlertTriangle,
      badge: pendingAlertsCount,
      badgeColor: 'bg-status-flagged',
      roles: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC']
    },
    {
      id: 'verification',
      label: t.verification,
      icon: ShieldCheck,
      roles: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC']
    },
    {
      id: 'reports',
      label: t.reports,
      icon: FileBarChart,
      roles: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC']
    },
    {
      id: 'feedback',
      label: t.feedback,
      icon: MessageSquareWarning,
      badge: unreadFeedbackCount,
      badgeColor: 'bg-status-verified',
      roles: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC']
    },

    // Mapping
    {
      id: 'map',
      label: t.gisMap,
      icon: MapPin,
      roles: ['MP', 'ADMIN', 'AGENCY', 'PUBLIC'],
      section: t.mappingLocation
    },

    // Officer Operations
    {
      id: 'recommend',
      label: t.recommendWork,
      icon: FilePlus2,
      roles: ['MP', 'ADMIN'],
      section: t.officerOperations,
      isOfficerOnly: true
    },
    {
      id: 'agency-workdesk',
      label: t.agencyBilling,
      icon: HardHat,
      roles: ['AGENCY', 'ADMIN'],
      section: t.officerOperations,
      isOfficerOnly: true
    },
    {
      id: 'vendors',
      label: t.contractorDirectory,
      icon: Building,
      roles: ['ADMIN', 'MP'],
      section: t.officerOperations,
      isOfficerOnly: true
    },

    // Forensic / Restricted Tools
    {
      id: 'network-fraud',
      label: t.contractorGraph,
      icon: Network,
      roles: TAB_ALLOWED_ROLES['network-fraud'] as UserRole[],
      section: t.restrictedTools,
      isOfficerOnly: true
    },
    {
      id: 'audit-logs',
      label: t.auditTrail,
      icon: ScrollText,
      roles: TAB_ALLOWED_ROLES['audit-logs'] as UserRole[],
      section: t.restrictedTools,
      isOfficerOnly: true
    },
    {
      id: 'data-ingestion',
      label: t.dataIngestion,
      icon: Calculator,
      roles: TAB_ALLOWED_ROLES['data-ingestion'] as UserRole[],
      section: t.restrictedTools,
      isOfficerOnly: true
    }
  ];

  // Filter items according to role
  const visibleItems = navItems.filter(item => {
    if (role === 'PUBLIC') {
      return !item.isOfficerOnly && item.roles.includes('PUBLIC');
    }
    return item.roles.includes(role);
  });

  let lastSection = '';

  const sidebarContent = (
    <aside className="w-64 bg-white text-slate-body flex flex-col shrink-0 border-r border-slate-border min-h-[calc(100vh-4.5rem)] shadow-xs">
      {/* Portal Context Banner */}
      <div className="px-4 py-3 bg-panel-bg border-b border-slate-border">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-govt-navy">
            {role === 'PUBLIC' ? t.publicView : (language === 'hi' ? 'अधिकारी कार्यक्षेत्र' : 'Officer Workspace')}
          </div>
          {role === 'PUBLIC' && (
            <span className="w-2 h-2 rounded-full bg-status-verified" title={t.publicCitizenModeActive} />
          )}
        </div>
        <p className="text-[11px] text-slate-muted mt-0.5">
          {role === 'PUBLIC'
            ? (language === 'hi' ? 'नागरिक निगरानी एवं ट्रैकिंग' : 'Open citizen oversight & tracking')
            : `${language === 'hi' ? 'प्रमाणित:' : 'Authenticated as'} ${translateRole(role)}`}
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {onNavigateToHome && (
          <button
            onClick={() => {
              onNavigateToHome();
              onClose?.();
            }}
            className="w-full mb-3 flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-govt-navy bg-panel-bg hover:bg-white border border-slate-border transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-govt-navy shrink-0" strokeWidth={2} />
            <span className="truncate">{t.returnToHome}</span>
          </button>
        )}

        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (item.id === 'alerts' && (currentTab === 'anomalies' || currentTab === 'alerts')) ||
            (item.id === 'recommend' && currentTab === 'recommendations') ||
            (item.id === 'agency-workdesk' && currentTab === 'agency') ||
            (item.id === 'feedback' && currentTab === 'grievances') ||
            (item.id === 'audit-logs' && currentTab === 'audit');

          const showSectionHeader = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;

          return (
            <React.Fragment key={item.id}>
              {showSectionHeader && (
                <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-muted">
                  {item.section}
                </div>
              )}

              <button
                id={`nav-link-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose?.();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-govt-navy text-white font-semibold shadow-xs'
                    : 'text-slate-body hover:bg-panel-bg hover:text-govt-navy'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-govt-saffron' : 'text-slate-muted'
                    }`}
                    strokeWidth={2}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white shrink-0 ${
                      item.badgeColor || 'bg-status-flagged'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}

        {/* Dedicated Chatbot Trigger */}
        <button
          id="nav-link-help-chatbot"
          onClick={() => {
            if (onOpenHelp) {
              onOpenHelp();
            } else {
              window.dispatchEvent(new CustomEvent('open-citizen-chatbot'));
            }
            onClose?.();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-body hover:bg-panel-bg hover:text-govt-navy transition-all cursor-pointer mt-2"
        >
          <MessageCircleQuestion className="w-4 h-4 text-slate-muted shrink-0" strokeWidth={2} />
          <span className="truncate">{t.help}</span>
        </button>
      </nav>

      {/* Officer Login Link for Public Mode */}
      {role === 'PUBLIC' && onOpenLogin && (
        <div className="p-3 border-t border-slate-border bg-panel-bg">
          <button
            onClick={() => {
              onOpenLogin();
              onClose?.();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-panel-bg text-govt-navy border border-slate-border shadow-2xs transition-colors cursor-pointer"
          >
            <UserCog className="w-4 h-4 text-govt-saffron shrink-0" strokeWidth={2} />
            <span>{t.officerLogin}</span>
          </button>
          <div className="text-[10px] text-slate-muted text-center mt-1.5">
            {language === 'hi' ? 'ज़िला कलेक्टर एवं सांसद लॉगिन' : 'District Collectors & MP login'}
          </div>
        </div>
      )}

      {/* Ministry Compliance Badge */}
      <div className="p-3 m-3 bg-panel-bg rounded-xl border border-slate-border text-[11px] text-slate-muted">
        <div className="text-[10px] text-govt-navy uppercase tracking-wider font-bold mb-1">
          {language === 'hi' ? 'सरकारी मानक' : 'Government Standards'}
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 bg-status-verified rounded-full" />
          <span className="text-xs font-semibold text-slate-body">MoSPI 2023 Guidelines</span>
        </div>
        <div className="text-[10px] text-slate-muted leading-relaxed">
          {t.mpladsFullName}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block shrink-0">{sidebarContent}</div>

      {/* Mobile Off-canvas Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-govt-navy-dark/60 backdrop-blur-xs" onClick={onClose} />
          <div className="relative z-10 flex">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
