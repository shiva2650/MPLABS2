import React from 'react';

export interface KpiStats {
  allocatedLimit?: number;
  worksRecommended: number;
  worksSanctioned: number;
  worksCompleted: number;
  worksOngoing: number;
  totalExpenditure: number;
  sanctionedExpenditure: number;
  delayedWorks?: number;
  highRiskWorks?: number;
  updatedAt?: string;
}

interface KpiCardsProps {
  stats: KpiStats | null;
  loading?: boolean;
  onFilterStatus?: (status: string) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ stats, loading, onFilterStatus }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-3.5 rounded border border-slate-200 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  const formatCrores = (amount: number) => {
    return (amount / 10000000).toFixed(2);
  };

  const totalWorks = stats.worksSanctioned || (stats.worksCompleted + stats.worksOngoing) || 22;
  const delayedCount = stats.delayedWorks ?? 4;
  const completionRate = totalWorks > 0 ? Math.round((stats.worksCompleted / totalWorks) * 100) : 0;
  const utilizationRate = stats.sanctionedExpenditure > 0 
    ? Math.round((stats.totalExpenditure / stats.sanctionedExpenditure) * 100) 
    : 0;

  const kpis = [
    {
      label: 'Total Projects',
      value: totalWorks.toLocaleString(),
      subtext: 'Sanctioned works',
      statusKey: 'All',
      color: 'text-slate-900'
    },
    {
      label: 'Completed Assets',
      value: stats.worksCompleted.toLocaleString(),
      subtext: `${completionRate}% completed`,
      statusKey: 'Completed',
      color: 'text-emerald-700'
    },
    {
      label: 'Under Execution',
      value: stats.worksOngoing.toLocaleString(),
      subtext: 'On-site progress',
      statusKey: 'Ongoing',
      color: 'text-blue-700'
    },
    {
      label: 'Delayed / Review',
      value: delayedCount.toLocaleString(),
      subtext: 'Requires oversight',
      statusKey: 'Delayed',
      color: 'text-amber-700'
    },
    {
      label: 'Sanctioned Cost',
      value: `₹${formatCrores(stats.sanctionedExpenditure)} Cr`,
      subtext: 'Administratively approved',
      color: 'text-slate-900'
    },
    {
      label: 'Expenditure Disbursed',
      value: `₹${formatCrores(stats.totalExpenditure)} Cr`,
      subtext: `${utilizationRate}% utilized against MB`,
      color: 'text-emerald-700'
    }
  ];

  return (
    <div className="mb-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            onClick={() => kpi.statusKey && onFilterStatus?.(kpi.statusKey)}
            className={`bg-white p-3.5 rounded border border-slate-200 transition-colors ${
              kpi.statusKey && onFilterStatus ? 'cursor-pointer hover:border-slate-400 hover:bg-slate-50/60' : ''
            }`}
          >
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate mb-1">
              {kpi.label}
            </div>
            <div className={`text-xl sm:text-2xl font-bold tracking-tight ${kpi.color}`}>
              {kpi.value}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">
              {kpi.subtext}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
