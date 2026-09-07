import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Network, RefreshCw } from 'lucide-react';

export const ContractorNetworkFraudPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    api.getContractorNetwork().then(res => setData(res)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#DDE5D4] p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#1B3022] text-white">
            <Network className="w-6 h-6 text-[#A3B18A]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1B3022]">Contractor Network Collusion & Shell Detection</h1>
            <p className="text-xs text-[#588157]">Graph analytics identifying shared addresses, director PIN overlaps, and cartelization</p>
          </div>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {data.vendorReports?.map((v: any) => (
            <div key={v.vendorName} className="bg-white rounded-xl border border-[#DDE5D4] p-4 space-y-2">
              <div className="flex justify-between font-bold">
                <span>{v.vendorName}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] ${v.requiresHighPriorityAlert ? 'bg-red-100 text-red-900' : 'bg-emerald-100 text-emerald-900'}`}>
                  {v.riskLevel} Risk
                </span>
              </div>
              <div className="text-gray-500">Works: {v.totalProjects} • Value: ₹{v.totalSanctionedCr} Cr</div>
              <p className="text-[11px] text-gray-700 bg-[#F8F9F7] p-2 rounded">{v.recommendation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
