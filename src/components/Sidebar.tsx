import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';
import {
  LayoutDashboard,
  FolderGit2,
  AlertTriangle,
  MapPin,
  FilePlus2,
  Coins,
  HardHat,
  Building,
  MessageSquareWarning,
  FileSpreadsheet,
  ScrollText,
  ShieldCheck,
  Home,
  Satellite,
  Network,
  Calculator,
  Cpu
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'projects'
  | 'recommend'
  | 'anomalies'
  | 'alerts'
  | 'satellite'
  | 'network-fraud'
  | 'map'
  | 'funds'
  | 'agency-workdesk'
  | 'vendors'
  | 'feedback'
  | 'reports'
  | 'audit-logs'
  | 'data-ingestion';

interface SidebarProps {
  currentTab: NavTab | string;
  onSelectTab: (tab: any) => void;
  pendingAlertsCount?: number;
  unreadFeedbackCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateToHome?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingAlertsCount = 0,
  isOpen = false,
  onClose,
  onNavigateToHome
}) => {
  const { role } = useAuth();

  interface NavItem {
    id: NavTab;
    label: string;
    icon: any;
    badge?: number;
    badgeColor?: string;
    roles: (UserRole | string)[];
    section?: string;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, roles: ['MP', 'ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN', 'AGENCY', 'PUBLIC'] },
    { id: 'projects', label: 'Projects Directory', icon: FolderGit2, roles: ['MP', 'ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN', 'AGENCY', 'PUBLIC'] },
    { id: 'map', label: 'GIS Interactive Map', icon: MapPin, roles: ['MP', 'ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN', 'AGENCY', 'PUBLIC'] },

    { id: 'recommend', label: 'Recommend Work', icon: FilePlus2, roles: ['MP', 'ADMIN', 'SUPER_ADMIN'], section: 'Proposals & Sanctions' },

    { id: 'anomalies', label: 'AI Anomaly Center', icon: AlertTriangle, badge: pendingAlertsCount, roles: ['MP', 'ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN'], section: 'AI Vigilance & Oversight' },
    { id: 'satellite', label: 'Satellite Verification', icon: Satellite, roles: ['MP', 'ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN', 'AGENCY', 'PUBLIC'], section: 'AI Vigilance & Oversight' },
    { id: 'network-fraud', label: 'Contractor Collusion Graph', icon: Network, roles: ['ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN', 'MP'], section: 'AI Vigilance & Oversight' },
    { id: 'alerts', label: 'Alert Management', icon: ShieldCheck, badge: pendingAlertsCount, roles: ['ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN'], section: 'AI Vigilance & Oversight' },

    { id: 'funds', label: 'Funds & Expenditure', icon: Coins, roles: ['MP', 'ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN', 'PUBLIC'], section: 'Financial Tracking' },
    { id: 'agency-workdesk', label: 'Agency Workdesk', icon: HardHat, roles: ['AGENCY', 'ADMIN', 'SUPER_ADMIN'], section: 'Execution & Billing' },
    { id: 'vendors', label: 'Vendor Performance', icon: Building, roles: ['ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN', 'MP'], section: 'Execution & Billing' },

    { id: 'feedback', label: 'Citizen Grievances', icon: MessageSquareWarning, roles: ['ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN', 'PUBLIC'], section: 'Public Transparency' },
    { id: 'reports', label: 'Reports & Audit Briefs', icon: FileSpreadsheet, roles: ['MP', 'ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN', 'AGENCY', 'PUBLIC'], section: 'Governance' },
    { id: 'audit-logs', label: 'System Audit Trail', icon: ScrollText, roles: ['ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN'], section: 'Governance' },
    { id: 'data-ingestion', label: 'eSAKSHI & Impact Metrics', icon: Calculator, roles: ['ADMIN', 'STATE_NODAL', 'MINISTRY', 'SUPER_ADMIN', 'MP', 'AGENCY', 'PUBLIC'], section: 'Governance' }
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(role));
  let lastSection = '';

  const sidebarContent = (
    <aside className="w-64 bg-[#263D2E] text-[#DDE5D4] flex flex-col shrink-0 border-r border-[#1B3022] min-h-[calc(100vh-4rem)]">
      <div className="px-4 py-3 bg-[#1B3022] border-b border-[#395C40] text-xs text-[#A3B18A]">
        <div className="font-bold uppercase tracking-wider text-[10px] text-[#A3B18A]">System Menu</div>
        <div className="font-mono text-white text-xs font-semibold truncate mt-0.5">
          {role === 'PUBLIC' ? 'Public Portal Mode' : `${role} Authorized Access`}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {onNavigateToHome && (
          <button
            onClick={onNavigateToHome}
            className="w-full mb-3 flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-[#DDE5D4] bg-[#1B3022] hover:bg-[#395C40] hover:text-white transition-colors cursor-pointer border border-[#395C40]"
          >
            <Home className="w-4 h-4 text-[#A3B18A]" />
            <span>Portal Home & Overview</span>
          </button>
        )}
        {filteredItems.map(item => {
          const Icon = item.icon;
          const isActive =
            currentTab === item.id ||
            (item.id === 'recommend' && currentTab === 'recommendations') ||
            (item.id === 'agency-workdesk' && currentTab === 'agency') ||
            (item.id === 'feedback' && currentTab === 'grievances') ||
            (item.id === 'audit-logs' && currentTab === 'audit');
          const showSectionHeader = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;
          return (
            <React.Fragment key={item.id}>
              {showSectionHeader && (
                <div className="pt-4 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-[#A3B18A]">
                  {item.section}
                </div>
              )}
              <button
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#395C40] text-white shadow-xs font-semibold'
                    : 'text-[#DDE5D4] opacity-85 hover:opacity-100 hover:bg-[#395C40]/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#A3B18A]'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0 bg-[#E07A5F]">
                    {item.badge}
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      <div className="p-3 m-3 bg-[#1B3022] rounded-xl border border-[#395C40] text-[11px] text-[#DDE5D4]">
        <div className="text-[10px] text-[#A3B18A] uppercase tracking-wider font-bold mb-1.5">
          System Vigilance
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-white">MoSPI Online & Secured</span>
        </div>
        <div className="text-[10px] text-[#A3B18A] leading-relaxed">
          Compliant with MoSPI 2023 Guidelines & SIH Standards. All AI indicators require human adjudication.
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block shrink-0">{sidebarContent}</div>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
          <div className="relative z-10 flex">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
