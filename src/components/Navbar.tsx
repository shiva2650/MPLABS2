import React, { useState } from 'react';
import { User } from '../types/index.ts';
import {
  Menu,
  Building2,
  User as UserIcon,
  LogOut,
  Search,
  Bot
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter.tsx';

interface NavbarProps {
  user: User | null;
  pageTitle?: string;
  onOpenLogin: () => void;
  onLogout: () => void;
  onToggleSidebarMobile?: () => void;
  onToggleAiAssistant?: () => void;
  onSelectProject?: (projectId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  pageTitle = 'Overview',
  onOpenLogin,
  onLogout,
  onToggleSidebarMobile,
  onToggleAiAssistant,
  onSelectProject
}) => {
  const [quickSearch, setQuickSearch] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim() && onSelectProject) {
      onSelectProject(quickSearch.trim());
      setQuickSearch('');
    }
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
      {/* Subtle National Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-13 flex items-center justify-between gap-3">
        {/* Left: Hamburger (mobile) + Emblem / Logo */}
        <div className="flex items-center gap-2.5">
          {onToggleSidebarMobile && (
            <button
              type="button"
              onClick={onToggleSidebarMobile}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded lg:hidden"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-900 flex items-center justify-center text-white shrink-0 font-bold text-xs">
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900 tracking-tight">MPLADS</span>
                <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 uppercase">
                  MoSPI
                </span>
              </div>
              <div className="text-[10px] text-slate-500 hidden sm:block">
                AI Integrity & Monitoring System
              </div>
            </div>
          </div>
        </div>

        {/* Center/Left: Breadcrumb or Page Title */}
        <div className="hidden md:flex items-center text-xs font-semibold text-slate-600 border-l border-slate-200 pl-4">
          <span className="text-slate-400">Portal</span>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="text-slate-900 font-bold">{pageTitle}</span>
        </div>

        {/* Right: Quick Search, Notifications, User Profile & Role, Auth Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Work ID Search */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center relative">
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Find Work ID..."
              className="text-xs pl-7 pr-2.5 py-1 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded focus:outline-hidden focus:ring-1 focus:ring-blue-900 w-32 md:w-44 transition-all text-slate-800"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
          </form>

          {/* AI Assistant Quick Launcher */}
          {onToggleAiAssistant && (
            <button
              type="button"
              onClick={onToggleAiAssistant}
              className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded transition-colors hidden sm:flex items-center gap-1 text-xs font-semibold"
              title="Open AI Monitoring Assistant"
            >
              <Bot className="w-4 h-4 text-blue-800" />
              <span className="hidden lg:inline">AI Help</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <NotificationCenter onSelectProject={onSelectProject} />

          {/* Authenticated User Status or Sign-In Button */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900 truncate max-w-[120px] sm:max-w-[160px]">
                  {user.name}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {user.role === 'mp'
                    ? `${user.constituency} (MP)`
                    : user.role === 'admin'
                    ? user.jurisdictionLevel === 'district'
                      ? `${user.district} (DM)`
                      : 'Central Admin'
                    : 'Agency'}
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3 py-1.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded transition-colors flex items-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Official Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
