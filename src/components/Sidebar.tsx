import React from 'react';
import { User } from '../types/index.ts';
import {
  LayoutDashboard,
  FolderGit2,
  Map,
  IndianRupee,
  ShieldAlert,
  MessageSquare,
  ClipboardCheck,
  FileText,
  Briefcase,
  History,
  Bot,
  Layers,
  X
} from 'lucide-react';

export type NavItemKey =
  | 'dashboard'
  | 'projects'
  | 'map'
  | 'financials'
  | 'risk'
  | 'grievances'
  | 'inspections'
  | 'documents'
  | 'vendors'
  | 'audit'
  | 'ai-lab'
  | 'ai-assistant';

interface SidebarProps {
  user: User | null;
  activeItem: NavItemKey;
  onNavigate: (item: NavItemKey) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenAiAssistant: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeItem,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  onOpenAiAssistant
}) => {
  const role = user?.role || 'citizen';

  // Build role-specific menu items per specifications
  const getNavItems = () => {
    if (role === 'mp') {
      return [
        { key: 'dashboard' as NavItemKey, label: 'Dashboard', icon: LayoutDashboard },
        { key: 'projects' as NavItemKey, label: 'Constituency Works', icon: FolderGit2 },
        { key: 'map' as NavItemKey, label: 'GIS Project Map', icon: Map },
        { key: 'financials' as NavItemKey, label: 'Financial Ledger', icon: IndianRupee },
        { key: 'grievances' as NavItemKey, label: 'Citizen Grievances', icon: MessageSquare }
      ];
    }

    if (role === 'admin') {
      return [
        { key: 'dashboard' as NavItemKey, label: 'Dashboard', icon: LayoutDashboard },
        { key: 'projects' as NavItemKey, label: 'Work Sanctions', icon: FolderGit2 },
        { key: 'map' as NavItemKey, label: 'GIS District Map', icon: Map },
        { key: 'financials' as NavItemKey, label: 'Financials', icon: IndianRupee },
        { key: 'risk' as NavItemKey, label: 'Risk Monitoring', icon: ShieldAlert },
        { key: 'grievances' as NavItemKey, label: 'Grievance Redressal', icon: MessageSquare },
        { key: 'inspections' as NavItemKey, label: 'Field Inspections', icon: ClipboardCheck },
        { key: 'documents' as NavItemKey, label: 'Project Documents', icon: FileText },
        { key: 'vendors' as NavItemKey, label: 'Vendor Directory', icon: Briefcase },
        { key: 'audit' as NavItemKey, label: 'Audit Logs', icon: History }
      ];
    }

    if (role === 'agency') {
      return [
        { key: 'dashboard' as NavItemKey, label: 'Dashboard', icon: LayoutDashboard },
        { key: 'projects' as NavItemKey, label: 'Assigned Works', icon: FolderGit2 },
        { key: 'map' as NavItemKey, label: 'Site GIS Map', icon: Map },
        { key: 'financials' as NavItemKey, label: 'Progress & MB', icon: ClipboardCheck },
        { key: 'documents' as NavItemKey, label: 'Documents & UC', icon: FileText },
        { key: 'inspections' as NavItemKey, label: 'Inspections', icon: Layers },
        { key: 'grievances' as NavItemKey, label: 'Issues & Reports', icon: MessageSquare }
      ];
    }

    // Default: Public / Citizen
    return [
      { key: 'dashboard' as NavItemKey, label: 'Overview & KPIs', icon: LayoutDashboard },
      { key: 'projects' as NavItemKey, label: 'Works Directory', icon: FolderGit2 },
      { key: 'map' as NavItemKey, label: 'Geographic Map', icon: Map },
      { key: 'financials' as NavItemKey, label: 'Parliamentary Ledger', icon: IndianRupee },
      { key: 'grievances' as NavItemKey, label: 'Citizen Vigilance', icon: MessageSquare },
      { key: 'vendors' as NavItemKey, label: 'Implementing Agencies', icon: Briefcase },
      { key: 'ai-lab' as NavItemKey, label: 'AI Integrity Lab', icon: ShieldAlert }
    ];
  };

  const navItems = getNavItems();

  const handleItemClick = (key: NavItemKey) => {
    onNavigate(key);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-40 w-56 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="p-3 border-b border-slate-100 flex items-center justify-between lg:hidden">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Navigation Menu
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 text-slate-500 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Role Scope Indicator */}
        <div className="px-3.5 py-3 border-b border-slate-100 bg-slate-50/50">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Current Portal View
          </div>
          <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
            {role === 'mp'
              ? `MP Console • ${user?.constituency}`
              : role === 'admin'
              ? `District Authority • ${user?.district || 'Central'}`
              : role === 'agency'
              ? 'Executing Agency'
              : 'Public Transparency Portal'}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleItemClick(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded transition-colors text-left ${
                  isActive
                    ? 'bg-blue-900 text-white font-bold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Persistent AI Assistant Launcher at bottom of sidebar */}
        <div className="p-2 border-t border-slate-200">
          <button
            type="button"
            onClick={() => {
              onOpenAiAssistant();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
          >
            <Bot className="w-4 h-4 text-blue-800" />
            <span>AI Assistant</span>
          </button>
        </div>
      </aside>
    </>
  );
};
