import React from 'react';
import { IndianRupee, CheckCircle2, Clock, AlertTriangle, FileText, CheckCheck } from 'lucide-react';

interface KpiStats {
  allocatedLimit: number;
  worksRecommended: number;
  worksSanctioned: number;
  worksCompleted: number;
  worksOngoing: number;
  totalExpenditure: number;
  sanctionedExpenditure: number;
  updatedAt?: string;
}

interface KpiCardsProps {
  stats: KpiStats | null;
  loading?: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const formatCrores = (amount: number) => {
    return (amount / 10000000).toFixed(2);
  };

  const cards = [
    {
      title: 'Works Recommended',
      value: stats.worksRecommended.toLocaleString(),
      subtext: 'Proposals from MPs',
      icon: FileText,
      color: 'text-blue-800',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    {
      title: 'Works Sanctioned',
      value: stats.worksSanctioned.toLocaleString(),
      subtext: 'Administratively Approved',
      icon: CheckCheck,
      color: 'text-indigo-800',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200'
    },
    {
      title: 'Works Completed',
      value: stats.worksCompleted.toLocaleString(),
      subtext: 'Handed over assets',
      icon: CheckCircle2,
      color: 'text-emerald-800',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    },
    {
      title: 'Works In Progress',
      value: stats.worksOngoing.toLocaleString(),
      subtext: 'Under execution',
      icon: Clock,
      color: 'text-amber-800',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    },
    {
      title: 'Sanctioned Cost',
      value: `₹${formatCrores(stats.sanctionedExpenditure)} Cr`,
      subtext: 'Committed funds',
      icon: IndianRupee,
      color: 'text-slate-800',
      bg: 'bg-slate-50',
      border: 'border-slate-200'
    },
    {
      title: 'Expenditure Utilized',
      value: `₹${formatCrores(stats.totalExpenditure)} Cr`,
      subtext: 'Disbursed against MB',
      icon: IndianRupee,
      color: 'text-emerald-900',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
          National Scheme Summary (eSAKSHI Key Performance Indicators)
        </h2>
        <span className="text-[11px] text-gray-500">
          Last synchronized: {new Date(stats.updatedAt || Date.now()).toLocaleTimeString()}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`bg-white p-3.5 rounded-lg border ${card.border} shadow-2xs hover:shadow-xs transition-shadow`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-semibold text-gray-600 truncate">{card.title}</span>
                <div className={`p-1.5 rounded-md ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-xl font-extrabold ${card.color} tracking-tight`}>
                {card.value}
              </div>
              <div className="text-[11px] text-gray-500 truncate mt-0.5">{card.subtext}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
