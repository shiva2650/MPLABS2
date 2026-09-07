import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Building, CheckCircle2 } from 'lucide-react';

export const VendorAnalyticsPage: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVendors().then(res => {
      setVendors(res.vendors || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-xs text-gray-500">Loading vendor concentration data...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1B3022] tracking-tight">Contractor & Vendor Concentration Matrix</h1>
        <p className="text-xs text-[#588157]">Anti-cartelization surveillance tracking project allocations across contractors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vendors.map(v => (
          <div key={v.name} className="bg-white rounded-2xl border border-[#DDE5D4] p-5 shadow-xs space-y-3 text-xs">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-[#1B3022] line-clamp-1">{v.name}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF0E6] text-[#395C40]">{v.riskExposureRating}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-[#F8F9F7] p-2.5 rounded-lg font-mono">
              <div>Works: <strong>{v.totalProjects}</strong></div>
              <div>Value: <strong>₹{v.totalValueCr} Cr</strong></div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>Timely Delivery</span>
                <span>{v.completionRate}%</span>
              </div>
              <div className="w-full bg-[#DDE5D4] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#395C40] h-full" style={{ width: `${v.completionRate}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
