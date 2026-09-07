import React, { useState } from 'react';
import { Project, Alert, CitizenFeedback } from '../types/index.ts';
import { StatusBadge } from './ui/StatusBadge.tsx';
import { AlertCircle, Clock, MessageSquare, ChevronRight, ShieldAlert } from 'lucide-react';

interface RequiresAttentionProps {
  projects: Project[];
  alerts?: Alert[];
  feedback?: CitizenFeedback[];
  onSelectProject: (project: Project) => void;
  onOpenGrievances?: () => void;
  onOpenAlerts?: () => void;
}

export const RequiresAttention: React.FC<RequiresAttentionProps> = ({
  projects,
  alerts = [],
  feedback = [],
  onSelectProject,
  onOpenGrievances,
  onOpenAlerts
}) => {
  const [activeTab, setActiveTab] = useState<'high-risk' | 'delayed' | 'grievances'>('high-risk');

  const highRiskProjects = projects.filter(
    (p) => p.riskLevel === 'High' || p.riskLevel === 'Critical' || (p.riskScore && p.riskScore >= 65)
  );

  const delayedProjects = projects.filter(
    (p) => p.status === 'Delayed' || p.delayPrediction?.status === 'Delayed'
  );

  const openGrievances = feedback.filter(
    (f) => f.status === 'Submitted' || f.status === 'Investigating' || f.status === 'Escalated'
  );

  // If there are no flagged items at all, show a clean, reassuring notice
  const totalActionItems = highRiskProjects.length + delayedProjects.length + openGrievances.length;
  if (totalActionItems === 0) {
    return (
      <div className="bg-white p-4 rounded border border-slate-200 mb-5 text-center text-xs text-slate-600">
        <span className="font-semibold text-emerald-800">All Systems Nominal:</span> No high-risk anomalies, delays, or pending grievances recorded.
      </div>
    );
  }

  const formatLakhs = (amt: number) => `₹${(amt / 100000).toFixed(1)} L`;

  return (
    <div className="bg-white rounded border border-slate-200 mb-5 overflow-hidden">
      {/* Section Header with Category Tabs */}
      <div className="p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Requires Attention
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            {totalActionItems} Action Items
          </span>
        </div>

        {/* Action Item Category Switcher */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('high-risk')}
            className={`px-2.5 py-1 rounded font-semibold transition-colors ${
              activeTab === 'high-risk'
                ? 'bg-rose-900 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            High Risk ({highRiskProjects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('delayed')}
            className={`px-2.5 py-1 rounded font-semibold transition-colors ${
              activeTab === 'delayed'
                ? 'bg-amber-800 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Delayed ({delayedProjects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('grievances')}
            className={`px-2.5 py-1 rounded font-semibold transition-colors ${
              activeTab === 'grievances'
                ? 'bg-blue-900 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Open Grievances ({openGrievances.length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
        {/* High Risk Tab */}
        {activeTab === 'high-risk' && (
          highRiskProjects.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No high-risk projects detected.
            </div>
          ) : (
            highRiskProjects.map((p) => (
              <div
                key={p.id}
                className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-slate-700">{p.workId}</span>
                    <StatusBadge status={p.riskLevel || 'High'} size="xs" />
                    <span className="text-[11px] text-slate-500 truncate">
                      {p.district}, {p.state} • {p.mpName}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 truncate">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {p.riskReason || `Risk Score: ${p.riskScore}/100 • Physical: ${p.completionPercentage}% • Utilized: ${formatLakhs(p.utilizedCost)}`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectProject(p)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 rounded border border-slate-300 shrink-0 transition-colors"
                >
                  Inspect Work
                </button>
              </div>
            ))
          )
        )}

        {/* Delayed Tab */}
        {activeTab === 'delayed' && (
          delayedProjects.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No delayed projects recorded.
            </div>
          ) : (
            delayedProjects.map((p) => (
              <div
                key={p.id}
                className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-slate-700">{p.workId}</span>
                    <StatusBadge status="Delayed" size="xs" />
                    <span className="text-[11px] text-slate-500">
                      {p.delayPrediction?.estimatedDelayDays ? `Est. Delay: ~${p.delayPrediction.estimatedDelayDays} days` : 'Schedule overrun'}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 truncate">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    Agency: {p.agencyName} • Progress: {p.completionPercentage}% • Sanctioned: {formatLakhs(p.sanctionedCost)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectProject(p)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 rounded border border-slate-300 shrink-0 transition-colors"
                >
                  Inspect Work
                </button>
              </div>
            ))
          )
        )}

        {/* Grievances Tab */}
        {activeTab === 'grievances' && (
          openGrievances.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No unresolved citizen grievances pending.
            </div>
          ) : (
            openGrievances.map((g) => (
              <div
                key={g.id}
                className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {g.trackingId || g.id}
                    </span>
                    <StatusBadge status={g.status} size="xs" />
                    <span className="text-[11px] text-slate-500">
                      {g.workTitle || g.category}
                    </span>
                  </div>
                  <div className="text-slate-800 line-clamp-1">
                    {g.comment}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Lodged: {new Date(g.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {onOpenGrievances && (
                  <button
                    type="button"
                    onClick={onOpenGrievances}
                    className="px-2.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 shrink-0 transition-colors"
                  >
                    View Grievances
                  </button>
                )}
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
