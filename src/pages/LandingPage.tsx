import React, { useState } from 'react';
import { Project, DashboardSummary } from '../types/index.js';
import { Search, Eye, Lock, ArrowRight, ShieldCheck, Database, Layers, CheckCircle2, TrendingUp, Sparkles, Building, Landmark } from 'lucide-react';

interface LandingPageProps {
  summary: DashboardSummary | null;
  projects: Project[];
  onOpenLogin: (role?: any) => void;
  onEnterPublic: () => void;
  onSelectProject: (project: Project) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  summary,
  projects,
  onOpenLogin,
  onEnterPublic,
  onSelectProject
}) => {
  const [search, setSearch] = useState('');

  const filtered = projects.filter(p =>
    search.trim() === '' ||
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.projectCode.toLowerCase().includes(search.toLowerCase()) ||
    p.district.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 6);

  return (
    <div className="min-h-screen bg-[#F8F9F7] flex flex-col font-sans text-[#1B3022]">
      {/* National Stripe */}
      <div className="h-1.5 w-full bg-linear-to-r from-[#FF9933] via-white to-[#138808]" />

      <header className="bg-white border-b border-[#DDE5D4] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1B3022] text-[#A3B18A] flex flex-col items-center justify-center font-serif text-xs font-bold border border-[#395C40] shrink-0">
              <span className="text-[9px] text-white">GOI</span>
              <span className="text-[7px] text-[#A3B18A]">MoSPI</span>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#588157] font-semibold">Government of India</div>
              <div className="text-sm font-bold text-[#1B3022]">MPLADS AI Integrity & Monitoring Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onEnterPublic} className="px-3.5 py-1.5 text-xs font-semibold text-[#2D4A32] bg-[#EAF0E6] hover:bg-[#DCE7D6] rounded-lg border border-[#C8D5B9] cursor-pointer">
              Public Portal
            </button>
            <button onClick={() => onOpenLogin()} className="px-4 py-1.5 text-xs font-semibold bg-[#1B3022] text-white hover:bg-[#284431] rounded-lg cursor-pointer">
              Officer Login
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF0E6] text-[#2D4A32] text-xs font-bold border border-[#C8D5B9]">
            <Sparkles className="w-3.5 h-3.5 text-[#395C40]" />
            <span>eSAKSHI Overlay Architecture • Trainable Machine Learning</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B3022] tracking-tight">
            Transparent Governance & Integrity for MPLADS Works
          </h1>
          <p className="text-sm text-[#588157] leading-relaxed">
            Automated intelligence layer safeguarding Member of Parliament Local Area Development Scheme funds through Sentinel-2 satellite cross-verification, spatial duplicate matching, and predictive cost-overrun forecasting.
          </p>
        </div>

        {/* Quick Search */}
        <div className="max-w-xl mx-auto relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search developmental work by title, code, district..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#DDE5D4] rounded-2xl shadow-xs text-xs focus:ring-2 focus:ring-[#395C40] focus:outline-hidden"
          />
        </div>

        {/* Highlighted Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1B3022]">Featured Developmental Projects</h2>
            <button onClick={onEnterPublic} className="text-xs font-bold text-[#395C40] hover:underline flex items-center gap-1 cursor-pointer">
              <span>View All Public Works</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(project => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="bg-white rounded-2xl border border-[#DDE5D4] p-5 shadow-xs hover:border-[#395C40] transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#588157]">{project.projectCode}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF0E6] text-[#395C40]">{project.status}</span>
                </div>
                <h3 className="font-bold text-[#1B3022] text-sm line-clamp-2">{project.title}</h3>
                <div className="text-[11px] text-[#588157]">
                  {project.district} • MP: {project.mpName}
                </div>
                <div className="pt-2 border-t border-[#F0F2ED] flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-500">Cost: ₹{((project.sanctionedAmount || project.estimatedCost) / 100000).toFixed(1)}L</span>
                  <span className="text-[#395C40] font-bold">{project.completionPercentage}% Complete</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4-Tier Role Cards */}
        <div className="bg-white rounded-2xl border border-[#DDE5D4] p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#1B3022] text-center">
            Multi-Authority Approval & Vigilance Roles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div onClick={() => onOpenLogin('MP')} className="p-4 rounded-xl border border-[#DDE5D4] bg-[#F8F9F7] hover:bg-[#EAF0E6] cursor-pointer transition-colors space-y-1.5">
              <Landmark className="w-5 h-5 text-[#395C40]" />
              <div className="font-bold text-[#1B3022]">1. Member of Parliament</div>
              <p className="text-[11px] text-gray-500">Recommend new civil works and monitor constituency allocations.</p>
            </div>

            <div onClick={() => onOpenLogin('ADMIN')} className="p-4 rounded-xl border border-[#DDE5D4] bg-[#F8F9F7] hover:bg-[#EAF0E6] cursor-pointer transition-colors space-y-1.5">
              <Building className="w-5 h-5 text-[#263D2E]" />
              <div className="font-bold text-[#1B3022]">2. District Authority (Collector)</div>
              <p className="text-[11px] text-gray-500">Scrutinize feasibility, accord sanctions, and disburse tranches.</p>
            </div>

            <div onClick={() => onOpenLogin('STATE_NODAL')} className="p-4 rounded-xl border border-[#DDE5D4] bg-[#F8F9F7] hover:bg-[#EAF0E6] cursor-pointer transition-colors space-y-1.5">
              <Building className="w-5 h-5 text-purple-700" />
              <div className="font-bold text-[#1B3022]">3. State Nodal Authority</div>
              <p className="text-[11px] text-gray-500">State planning clearance and high-value project approvals.</p>
            </div>

            <div onClick={() => onOpenLogin('MINISTRY')} className="p-4 rounded-xl border border-[#DDE5D4] bg-[#F8F9F7] hover:bg-[#EAF0E6] cursor-pointer transition-colors space-y-1.5">
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
              <div className="font-bold text-[#1B3022]">4. Central MoSPI Ministry</div>
              <p className="text-[11px] text-gray-500">National oversight, mega project approvals, and central vigilance.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-[#DDE5D4] py-4 text-center text-xs text-[#588157]">
        Ministry of Statistics and Programme Implementation (MoSPI) • Government of India
      </footer>
    </div>
  );
};
