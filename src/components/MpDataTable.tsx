import React, { useState } from 'react';
import { ArrowUpDown, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface MPRecord {
  mpId: string;
  mpName: string;
  house: 'Lok Sabha' | 'Rajya Sabha';
  state: string;
  constituency: string;
  allocatedAmount: number;
  recommendedAmount: number;
  sanctionedAmount: number;
  utilizedAmount: number;
  worksRecommended: number;
  worksSanctioned: number;
  worksCompleted: number;
}

interface MpDataTableProps {
  mps: MPRecord[];
  onSelectMp: (mpName: string) => void;
}

export const MpDataTable: React.FC<MpDataTableProps> = ({ mps, onSelectMp }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof MPRecord>('sanctionedAmount');
  const [sortAsc, setSortAsc] = useState(false);
  const pageSize = 10;

  const handleSort = (field: keyof MPRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sorted = [...mps].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string') {
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    }

    return sortAsc ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
  });

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatLakhs = (val: number) => {
    return `₹${(val / 100000).toFixed(1)} L`;
  };

  const exportToCsv = () => {
    const headers = [
      'Sr. No.',
      'State',
      'MP Name',
      'House',
      'Constituency',
      'Allocated (INR)',
      'Recommended (INR)',
      'Sanctioned (INR)',
      'Utilized (INR)',
      'Works Recommended',
      'Works Sanctioned',
      'Works Completed'
    ];

    const rows = sorted.map((m, i) => [
      i + 1,
      `"${m.state}"`,
      `"${m.mpName}"`,
      `"${m.house}"`,
      `"${m.constituency}"`,
      m.allocatedAmount,
      m.recommendedAmount,
      m.sanctionedAmount,
      m.utilizedAmount,
      m.worksRecommended,
      m.worksSanctioned,
      m.worksCompleted
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MPLADS_Parliamentary_Ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-2xs mb-6 overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
        <div>
          <h3 className="text-sm font-extrabold text-gray-900">
            Parliamentary Members Fund Allocation & Physical Progress Ledger
          </h3>
          <p className="text-xs text-gray-600">
            eSAKSHI official data records across Lok Sabha and Rajya Sabha representatives
          </p>
        </div>

        <button
          onClick={exportToCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-300 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-gray-600" />
          <span>Export CSV Ledger</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-700 border-collapse">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-gray-200">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">Sr.</th>
              <th
                onClick={() => handleSort('state')}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>State</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('mpName')}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Member of Parliament</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('constituency')}
                className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Constituency</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('recommendedAmount')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Recommended</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('sanctionedAmount')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Sanctioned</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('utilizedAmount')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Utilized</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Works (R / S / C)</th>
              <th className="py-2.5 px-3 text-center">Utilized %</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-gray-500 font-medium">
                  No parliamentary records matching criteria.
                </td>
              </tr>
            ) : (
              paginated.map((mp, idx) => {
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                const utilRate =
                  mp.sanctionedAmount > 0
                    ? Math.min(100, Math.round((mp.utilizedAmount / mp.sanctionedAmount) * 100))
                    : 0;

                return (
                  <tr key={mp.mpId} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-2.5 px-3 text-center font-medium text-gray-500">{globalIndex}</td>
                    <td className="py-2.5 px-3 font-semibold text-gray-800">{mp.state}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-gray-900">{mp.mpName}</div>
                      <div className="text-[10px] text-gray-500">{mp.house}</div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-gray-700">{mp.constituency}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-blue-900">
                      {formatLakhs(mp.recommendedAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-900">
                      {formatLakhs(mp.sanctionedAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                      {formatLakhs(mp.utilizedAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1 text-[11px] font-semibold">
                        <span className="text-blue-700" title="Recommended">
                          {mp.worksRecommended}
                        </span>
                        <span className="text-gray-300">/</span>
                        <span className="text-indigo-700" title="Sanctioned">
                          {mp.worksSanctioned}
                        </span>
                        <span className="text-gray-300">/</span>
                        <span className="text-emerald-700 font-bold" title="Completed">
                          {mp.worksCompleted}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="w-16 mx-auto">
                        <div className="text-[10px] font-bold text-gray-700 mb-0.5">{utilRate}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              utilRate >= 70
                                ? 'bg-emerald-600'
                                : utilRate >= 40
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${utilRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectMp(mp.mpName)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-900 hover:text-white hover:bg-blue-900 rounded border border-blue-900 transition-colors"
                      >
                        View Works
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
        <div>
          Showing <span className="font-semibold">{paginated.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
          <span className="font-semibold">{Math.min(currentPage * pageSize, sorted.length)}</span> of{' '}
          <span className="font-semibold">{sorted.length}</span> Members of Parliament
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
