import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Project } from '../types/index.js';
import {
  TrendingUp,
  FileCheck2,
  CheckCircle2,
  Clock,
  Layers,
  IndianRupee,
  Info
} from 'lucide-react';
import { PlainTooltip } from './PlainTooltip.js';
import { themeTokens } from '../utils/themeTokens.js';

interface MonthlyTrendChartProps {
  projects: Project[];
  className?: string;
}

type MetricMode = 'COUNT' | 'VALUE' | 'CUMULATIVE';

interface MonthlyDataPoint {
  monthKey: string;
  label: string;
  sanctionedCount: number;
  completedCount: number;
  sanctionedAmountLakh: number;
  completedAmountLakh: number;
  cumulativeSanctionedCount: number;
  cumulativeCompletedCount: number;
  cumulativeSanctionedLakh: number;
  cumulativeCompletedLakh: number;
  activeBacklog: number;
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ projects, className = '' }) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('COUNT');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Extract unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [projects]);

  // Compute monthly chronological data
  const monthlyData = useMemo(() => {
    const filteredProjects = selectedCategory === 'ALL'
      ? projects
      : projects.filter(p => p.category === selectedCategory);

    const monthKeys = [
      '2023-11', '2023-12',
      '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
      '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
      '2025-01', '2025-02', '2025-03'
    ];

    const monthFormatNames: Record<string, string> = {
      '2023-11': "Nov '23",
      '2023-12': "Dec '23",
      '2024-01': "Jan '24",
      '2024-02': "Feb '24",
      '2024-03': "Mar '24",
      '2024-04': "Apr '24",
      '2024-05': "May '24",
      '2024-06': "Jun '24",
      '2024-07': "Jul '24",
      '2024-08': "Aug '24",
      '2024-09': "Sep '24",
      '2024-10': "Oct '24",
      '2024-11': "Nov '24",
      '2024-12': "Dec '24",
      '2025-01': "Jan '25",
      '2025-02': "Feb '25",
      '2025-03': "Mar '25"
    };

    const monthlyMap: Record<string, {
      sanctionedCount: number;
      completedCount: number;
      sanctionedAmountLakh: number;
      completedAmountLakh: number;
    }> = {};

    monthKeys.forEach(m => {
      monthlyMap[m] = {
        sanctionedCount: 0,
        completedCount: 0,
        sanctionedAmountLakh: 0,
        completedAmountLakh: 0
      };
    });

    filteredProjects.forEach(p => {
      if (p.sanctionDate) {
        const sMonth = p.sanctionDate.substring(0, 7);
        if (monthlyMap[sMonth]) {
          monthlyMap[sMonth].sanctionedCount += 1;
          monthlyMap[sMonth].sanctionedAmountLakh += (p.sanctionedAmount || p.estimatedCost || 0) / 100000;
        }
      }

      if (p.status === 'Completed') {
        const cDate = p.actualCompletionDate || p.expectedCompletionDate;
        if (cDate) {
          const cMonth = cDate.substring(0, 7);
          if (monthlyMap[cMonth]) {
            monthlyMap[cMonth].completedCount += 1;
            monthlyMap[cMonth].completedAmountLakh += (p.sanctionedAmount || p.fundsUtilized || 0) / 100000;
          }
        }
      }
    });

    let runningSanctionedCount = 0;
    let runningCompletedCount = 0;
    let runningSanctionedLakh = 0;
    let runningCompletedLakh = 0;

    const data: MonthlyDataPoint[] = monthKeys.map(key => {
      const entry = monthlyMap[key];
      runningSanctionedCount += entry.sanctionedCount;
      runningCompletedCount += entry.completedCount;
      runningSanctionedLakh += entry.sanctionedAmountLakh;
      runningCompletedLakh += entry.completedAmountLakh;

      return {
        monthKey: key,
        label: monthFormatNames[key] || key,
        sanctionedCount: entry.sanctionedCount,
        completedCount: entry.completedCount,
        sanctionedAmountLakh: Math.round(entry.sanctionedAmountLakh * 10) / 10,
        completedAmountLakh: Math.round(entry.completedAmountLakh * 10) / 10,
        cumulativeSanctionedCount: runningSanctionedCount,
        cumulativeCompletedCount: runningCompletedCount,
        cumulativeSanctionedLakh: Math.round(runningSanctionedLakh * 10) / 10,
        cumulativeCompletedLakh: Math.round(runningCompletedLakh * 10) / 10,
        activeBacklog: Math.max(0, runningSanctionedCount - runningCompletedCount)
      };
    });

    return data;
  }, [projects, selectedCategory]);

  const metrics = useMemo(() => {
    const totalSanctionedCount = monthlyData.reduce((acc, m) => acc + m.sanctionedCount, 0);
    const totalCompletedCount = monthlyData.reduce((acc, m) => acc + m.completedCount, 0);
    const totalSanctionedLakh = monthlyData.reduce((acc, m) => acc + m.sanctionedAmountLakh, 0);
    const totalCompletedLakh = monthlyData.reduce((acc, m) => acc + m.completedAmountLakh, 0);
    const inProgressBacklog = Math.max(0, totalSanctionedCount - totalCompletedCount);
    const clearanceRatio = totalSanctionedCount > 0
      ? Math.round((totalCompletedCount / totalSanctionedCount) * 100)
      : 0;

    return {
      totalSanctionedCount,
      totalCompletedCount,
      totalSanctionedLakh: totalSanctionedLakh.toFixed(1),
      totalCompletedLakh: totalCompletedLakh.toFixed(1),
      inProgressBacklog,
      clearanceRatio
    };
  }, [monthlyData]);

  const chartConfig = useMemo(() => {
    switch (metricMode) {
      case 'VALUE':
        return {
          sanctionKey: 'sanctionedAmountLakh',
          completionKey: 'completedAmountLakh',
          sanctionName: 'Sanctioned Value (₹ Lakhs)',
          completionName: 'Completed Value (₹ Lakhs)',
          yUnit: '₹ L'
        };
      case 'CUMULATIVE':
        return {
          sanctionKey: 'cumulativeSanctionedCount',
          completionKey: 'cumulativeCompletedCount',
          sanctionName: 'Cumulative Sanctions',
          completionName: 'Cumulative Completions',
          yUnit: ' works'
        };
      case 'COUNT':
      default:
        return {
          sanctionKey: 'sanctionedCount',
          completionKey: 'completedCount',
          sanctionName: 'Monthly Sanctions',
          completionName: 'Monthly Completions',
          yUnit: ' works'
        };
    }
  }, [metricMode]);

  return (
    <div className={`bg-white rounded-xl p-5 border border-slate-border shadow-sm ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-border">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-panel-bg border border-slate-border text-govt-navy">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-body tracking-tight uppercase">
              Sanction vs. Completion Timeline
            </h2>
            <PlainTooltip
              term="Sanction vs. Completion"
              explanation="Tracks how quickly allocated funding turns into finished, verified public assets across constituencies."
            />
          </div>
          <p className="text-xs text-slate-muted mt-0.5">
            Official monthly velocity of administrative sanctions against verified on-ground handovers.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-panel-bg text-xs font-medium text-slate-body px-3 py-1.5 rounded-lg border border-slate-border focus:outline-hidden focus:ring-1 focus:ring-govt-navy cursor-pointer"
          >
            <option value="ALL">All Sectors ({projects.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-panel-bg p-1 rounded-lg border border-slate-border">
            {(['COUNT', 'VALUE', 'CUMULATIVE'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setMetricMode(mode)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  metricMode === mode
                    ? 'bg-govt-navy text-white shadow-xs'
                    : 'text-slate-muted hover:text-slate-body'
                }`}
              >
                {mode === 'COUNT' ? 'Works Count' : mode === 'VALUE' ? 'Amount (₹ L)' : 'Cumulative'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 bg-panel-bg rounded-lg border border-slate-border">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-muted">
            <FileCheck2 className="w-3.5 h-3.5 text-govt-navy" />
            <span>Total Sanctioned</span>
          </div>
          <div className="text-lg font-bold text-govt-navy mt-0.5">
            {metrics.totalSanctionedCount} <span className="text-xs font-medium text-slate-muted">works</span>
          </div>
          <div className="text-[10px] text-slate-muted">
            ₹{metrics.totalSanctionedLakh} Lakh total
          </div>
        </div>

        <div className="p-3 bg-panel-bg rounded-lg border border-slate-border">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-muted">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-verified" />
            <span>Completed Works</span>
          </div>
          <div className="text-lg font-bold text-status-verified mt-0.5">
            {metrics.totalCompletedCount} <span className="text-xs font-medium text-slate-muted">works</span>
          </div>
          <div className="text-[10px] text-slate-muted">
            ₹{metrics.totalCompletedLakh} Lakh delivered
          </div>
        </div>

        <div className="p-3 bg-panel-bg rounded-lg border border-slate-border">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-muted">
            <Layers className="w-3.5 h-3.5 text-status-review" />
            <span>In-Progress Works</span>
          </div>
          <div className="text-lg font-bold text-status-review mt-0.5">
            {metrics.inProgressBacklog} <span className="text-xs font-medium text-slate-muted">active</span>
          </div>
          <div className="text-[10px] text-slate-muted">
            Under execution / inspection
          </div>
        </div>

        <div className="p-3 bg-panel-bg rounded-lg border border-slate-border">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-muted">
            <Clock className="w-3.5 h-3.5 text-govt-navy" />
            <span>Delivery Rate</span>
          </div>
          <div className="text-lg font-bold text-slate-body mt-0.5">
            {metrics.clearanceRatio}%
          </div>
          <div className="text-[10px] text-slate-muted">
            Overall completion velocity
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-64 sm:h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={themeTokens.slateBorder} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: themeTokens.slateMuted, fontSize: 11 }} tickLine={{ stroke: themeTokens.slateBorder }} axisLine={{ stroke: themeTokens.slateBorder }} />
            <YAxis tick={{ fill: themeTokens.slateMuted, fontSize: 11 }} tickLine={{ stroke: themeTokens.slateBorder }} axisLine={{ stroke: themeTokens.slateBorder }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: themeTokens.white,
                borderColor: themeTokens.slateBorder,
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(11, 61, 102, 0.1)',
                fontSize: '12px'
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
              formatter={(value) => <span className="text-xs font-medium text-slate-body ml-1">{value}</span>}
            />
            <Line
              type="monotone"
              dataKey={chartConfig.sanctionKey}
              name={chartConfig.sanctionName}
              stroke={themeTokens.govtNavy}
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: themeTokens.govtNavy, strokeWidth: 1, stroke: themeTokens.white }}
              activeDot={{ r: 5, fill: themeTokens.govtNavy, stroke: themeTokens.white, strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey={chartConfig.completionKey}
              name={chartConfig.completionName}
              stroke={themeTokens.govtSaffron}
              strokeWidth={2.5}
              strokeDasharray={metricMode === 'CUMULATIVE' ? undefined : '4 2'}
              dot={{ r: 3.5, fill: themeTokens.govtSaffron, strokeWidth: 1, stroke: themeTokens.white }}
              activeDot={{ r: 5, fill: themeTokens.statusReview, stroke: themeTokens.white, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
