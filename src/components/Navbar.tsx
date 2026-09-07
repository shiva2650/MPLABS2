import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  ShieldAlert,
  LogOut,
  UserCheck,
  Building2,
  Landmark,
  Eye,
  Bell,
  Menu,
  X,
  ChevronDown,
  Home,
  Crown
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onNavigateToAlerts?: () => void;
  pendingAlertsCount?: number;
  criticalAlertsCount?: number;
  onOpenRecommend?: () => void;
  onNavigateToHome?: () => void;
  onOpenLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onNavigateToAlerts,
  pendingAlertsCount = 0,
  criticalAlertsCount = 0,
  onNavigateToHome,
  onOpenLogin
}) => {
  const { user, role, logout, switchDemoRole } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const getRoleDisplay = () => {
    switch (role) {
      case 'MINISTRY':
      case 'SUPER_ADMIN':
        return {
          title: 'MoSPI Central Ministry',
          label: 'Ministry Desk',
          name: user?.name || 'Shri Amitabh Kant, IAS',
          detail: 'Central Oversight & Mega Sanctions',
          icon: Crown,
          theme: 'bg-[#1B3022] text-white border border-[#A3B18A]'
        };
      case 'STATE_NODAL':
        return {
          title: 'State Nodal Authority',
          label: 'State Authority',
          name: user?.name || 'Smt. Smita Sabharwal, IAS',
          detail: 'State Planning Dept (Telangana)',
          icon: Building2,
          theme: 'bg-[#2C4A34] text-white border border-[#C8D5B9]'
        };
      case 'MP':
        return {
          title: 'Member of Parliament',
          label: 'MP Portal',
          name: user?.name || 'Shri Rajesh Kumar, MP',
          detail: 'Hyderabad North Constituency',
          icon: Landmark,
          theme: 'bg-[#395C40] text-white border border-[#C8D5B9]'
        };
      case 'ADMIN':
        return {
          title: 'District Authority / Collector',
          label: 'District Admin',
          name: user?.name || 'Dr. Ananya Sharma, IAS',
          detail: 'Hyderabad District Collectorate',
          icon: Building2,
          theme: 'bg-[#263D2E] text-white border border-[#C8D5B9]'
        };
      case 'AGENCY':
        return {
          title: 'Implementing Agency',
          label: 'Agency Desk',
          name: user?.name || 'TSUDA - Hyderabad Zone',
          detail: 'Municipal & Urban Dev Authority',
          icon: UserCheck,
          theme: 'bg-[#3A5A40] text-white border border-[#C8D5B9]'
        };
      default:
        return {
          title: 'Citizen Transparency Portal',
          label: 'Public Access',
          name: 'Public Citizen',
          detail: 'Open Public View (Restricted/Safe)',
          icon: Eye,
          theme: 'bg-[#2D3A3A] text-white border border-[#C8D5B9]'
        };
    }
  };

  const roleInfo = getRoleDisplay();
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-[#1B3022] text-white border-b-4 border-[#C8D5B9] shadow-md">
      <div className="h-1 w-full bg-linear-to-r from-[#FF9933] via-white to-[#138808]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-md text-[#DDE5D4] hover:text-white hover:bg-[#263D2E]"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div
              className={`flex items-center gap-3 ${onNavigateToHome ? 'cursor-pointer hover:opacity-90' : ''}`}
              onClick={onNavigateToHome}
            >
              <div className="bg-white p-1 rounded shadow-xs">
                <div className="w-8 h-8 bg-[#1B3022] rounded-xs flex items-center justify-center font-bold text-white text-xs border border-[#C8D5B9]">
                  AI
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="text-[10px] uppercase tracking-wider text-[#C8D5B9] font-medium leading-tight">
                  Ministry of Statistics & Programme Implementation
                </div>
                <div className="text-base sm:text-lg font-bold text-white tracking-wider uppercase leading-tight flex items-center gap-2">
                  <span>MPLADS</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#395C40] text-white font-mono font-medium border border-[#A3B18A]/50">
                    AI Integrity
                  </span>
                  <span className="text-xs text-[#C8D5B9] font-normal lowercase tracking-normal hidden md:inline">portal</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Quick Demo Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${roleInfo.theme}`}
              >
                <RoleIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">{roleInfo.label}:</span>
                <span className="truncate max-w-[120px] sm:max-w-[160px] font-normal">{roleInfo.name.split(',')[0]}</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-80" />
              </button>

              {showRoleMenu && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white text-[#1B3022] rounded-xl shadow-xl border border-[#DDE5D4] py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setShowRoleMenu(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-bold text-[#588157] uppercase tracking-wider border-b border-[#DDE5D4]">
                    Multi-Authority Approval Hierarchy
                  </div>
                  <button
                    onClick={() => { switchDemoRole('MINISTRY'); setShowRoleMenu(false); }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-[#F8F9F7] ${role === 'MINISTRY' ? 'bg-[#EAF0E6] font-bold' : ''}`}
                  >
                    <Crown className="w-4 h-4 text-indigo-700 shrink-0" />
                    <div>
                      <div className="font-semibold">4. Central Ministry (MoSPI New Delhi)</div>
                      <div className="text-[10px] text-gray-500">National oversight & mega project sanctioning</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { switchDemoRole('STATE_NODAL'); setShowRoleMenu(false); }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-[#F8F9F7] ${role === 'STATE_NODAL' ? 'bg-[#EAF0E6] font-bold' : ''}`}
                  >
                    <Building2 className="w-4 h-4 text-purple-700 shrink-0" />
                    <div>
                      <div className="font-semibold">3. State Nodal Authority (Principal Secretary)</div>
                      <div className="text-[10px] text-gray-500">State planning clearance & works &gt; ₹50L</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { switchDemoRole('ADMIN'); setShowRoleMenu(false); }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-[#F8F9F7] ${role === 'ADMIN' ? 'bg-[#EAF0E6] font-bold' : ''}`}
                  >
                    <Building2 className="w-4 h-4 text-[#263D2E] shrink-0" />
                    <div>
                      <div className="font-semibold">2. District Authority (Collector / DM)</div>
                      <div className="text-[10px] text-gray-500">Sanction works, assign agency, disburse funds</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { switchDemoRole('MP'); setShowRoleMenu(false); }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-[#F8F9F7] ${role === 'MP' ? 'bg-[#EAF0E6] font-bold' : ''}`}
                  >
                    <Landmark className="w-4 h-4 text-[#395C40] shrink-0" />
                    <div>
                      <div className="font-semibold">1. MP Portal (Shri Rajesh Kumar)</div>
                      <div className="text-[10px] text-gray-500">Recommend works & monitor constituency ₹5Cr</div>
                    </div>
                  </button>
                  <div className="border-t border-[#DDE5D4] my-1" />
                  <button
                    onClick={() => { switchDemoRole('AGENCY'); setShowRoleMenu(false); }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-[#F8F9F7] ${role === 'AGENCY' ? 'bg-[#EAF0E6] font-bold' : ''}`}
                  >
                    <UserCheck className="w-4 h-4 text-[#588157] shrink-0" />
                    <div>
                      <div className="font-semibold">Implementing Agency Desk (TSUDA)</div>
                      <div className="text-[10px] text-gray-500">Submit geotagged progress, bills & vouchers</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { switchDemoRole('PUBLIC'); setShowRoleMenu(false); }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-[#F8F9F7] ${role === 'PUBLIC' ? 'bg-[#EAF0E6] font-bold' : ''}`}
                  >
                    <Eye className="w-4 h-4 text-[#2D3A3A] shrink-0" />
                    <div>
                      <div className="font-semibold">Citizen Transparency Portal</div>
                      <div className="text-[10px] text-gray-500">Public dashboard without confidential data</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {role !== 'PUBLIC' && (
              <button
                onClick={onNavigateToAlerts}
                className="relative p-2 rounded-lg text-[#DDE5D4] hover:text-white hover:bg-[#263D2E] transition-colors"
                title={`${pendingAlertsCount} pending AI alerts`}
              >
                <Bell className="w-5 h-5" />
                {pendingAlertsCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E07A5F] text-[10px] font-bold text-white shadow-xs">
                    {pendingAlertsCount}
                  </span>
                )}
              </button>
            )}

            {role !== 'PUBLIC' ? (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#395C40] hover:bg-[#4a7251] text-white border border-[#C8D5B9]/40 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-[#C8D5B9]" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenLogin ? onOpenLogin() : switchDemoRole('ADMIN')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#395C40] hover:bg-[#4a7251] border border-[#C8D5B9] shadow-xs transition-colors cursor-pointer"
              >
                <span>Officer Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
