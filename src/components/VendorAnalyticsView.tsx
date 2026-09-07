import React, { useEffect, useState } from 'react';
import { VendorAnalyticsSummary } from '../types';
import { ApiService } from '../services/api';
import {
  Activity,
  Download,
  Info,
  Building,
  CheckCircle,
  AlertTriangle,
  Clock,
  Coins,
  ArrowUpDown,
} from 'lucide-react';

export const VendorAnalyticsView: React.FC = () => {
  const [vendors, setVendors] = useState<VendorAnalyticsSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortField, setSortField] = useState<keyof VendorAnalyticsSummary>('totalValueLakhs');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getVendorAnalytics();
      setVendors(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof VendorAnalyticsSummary) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedVendors = [...vendors].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'string') {
      return sortAsc
        ? (valA as string).localeCompare(valB as string)
        : (valB as string).localeCompare(valA as string);
    }
    return sortAsc
      ? (valA as number) - (valB as number)
      : (valB as number) - (valA as number);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-md shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                Executing Agency &amp; Vendor Performance Analytics
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Comparative execution velocity, completion rates, and delay metrics across contractors and departments.
              </p>
            </div>
          </div>

          <a
            href="/api/reports/vendors/csv"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded shadow-xs transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export Vendor CSV
          </a>
        </div>

        {/* Mandatory Policy Disclaimer */}
        <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Decision Support Policy:</strong> Analytics are compiled exclusively for administrative decision support, capacity planning, and technical performance reviews, not as proof of wrongdoing.
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="border border-stone-200 rounded-md overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700 border-collapse">
            <thead className="bg-stone-100 text-stone-800 font-semibold uppercase text-[10px] tracking-wider border-b border-stone-200">
              <tr>
                <th
                  onClick={() => handleSort('vendorName')}
                  className="p-2.5 border-r border-stone-200 cursor-pointer hover:bg-stone-200"
                >
                  <div className="flex items-center justify-between">
                    <span>Agency / Vendor Name</span>
                    <ArrowUpDown className="w-3 h-3 text-stone-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('projectCount')}
                  className="p-2.5 border-r border-stone-200 text-center cursor-pointer hover:bg-stone-200"
                >
                  Works Assigned
                </th>
                <th
                  onClick={() => handleSort('totalValueLakhs')}
                  className="p-2.5 border-r border-stone-200 text-right cursor-pointer hover:bg-stone-200"
                >
                  Total Value (₹ Lakhs)
                </th>
                <th
                  onClick={() => handleSort('completionRatePercent')}
                  className="p-2.5 border-r border-stone-200 text-center cursor-pointer hover:bg-stone-200"
                >
                  Completion Rate
                </th>
                <th
                  onClick={() => handleSort('delayRatePercent')}
                  className="p-2.5 border-r border-stone-200 text-center cursor-pointer hover:bg-stone-200"
                >
                  Delay Rate
                </th>
                <th
                  onClick={() => handleSort('highRiskCount')}
                  className="p-2.5 border-r border-stone-200 text-center cursor-pointer hover:bg-stone-200"
                >
                  Flagged Works
                </th>
                <th className="p-2.5 text-center">Avg Duration (Days)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {sortedVendors.map((v) => (
                <tr key={v.vendorId} className="hover:bg-stone-50 transition-colors">
                  <td className="p-2.5 border-r border-stone-200">
                    <div className="font-bold text-stone-900">{v.vendorName}</div>
                    <div className="text-[10px] text-stone-500 font-mono">ID: {v.vendorId}</div>
                  </td>
                  <td className="p-2.5 text-center font-mono font-medium border-r border-stone-200">
                    {v.projectCount}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-indigo-900 border-r border-stone-200">
                    ₹{v.totalValueLakhs.toFixed(2)}L
                  </td>
                  <td className="p-2.5 text-center border-r border-stone-200">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-12 bg-stone-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${v.completionRatePercent}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-emerald-800">
                        {v.completionRatePercent}%
                      </span>
                    </div>
                  </td>
                  <td className="p-2.5 text-center border-r border-stone-200 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.delayRatePercent > 30
                          ? 'bg-red-100 text-red-800'
                          : v.delayRatePercent > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {v.delayRatePercent}%
                    </span>
                  </td>
                  <td className="p-2.5 text-center border-r border-stone-200 font-mono font-bold">
                    {v.highRiskCount > 0 ? (
                      <span className="text-red-700">{v.highRiskCount}</span>
                    ) : (
                      <span className="text-emerald-700">0</span>
                    )}
                  </td>
                  <td className="p-2.5 text-center font-mono text-stone-600">
                    ~{v.avgCompletionTimeDays} days
                  </td>
                </tr>
              ))}

              {sortedVendors.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-stone-500">
                    No vendor performance metrics available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
