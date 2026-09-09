import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Building, AlertTriangle, CheckCircle2, TrendingDown, Layers, ShieldAlert, ArrowLeft } from 'lucide-react';

interface VendorAnalyticsPageProps {
  onBackToDashboard?: () => void;
}

export const VendorAnalyticsPage: React.FC<VendorAnalyticsPageProps> = ({ onBackToDashboard }) => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVendors().then(res => {
      setVendors(res.vendors || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-muted">Loading vendor integrity analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Persistent Back Button */}
      {onBackToDashboard && (
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-govt-navy bg-white border border-slate-border hover:bg-panel-bg rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Overview</span>
          </button>
          <span className="text-xs text-slate-muted">
            Dashboard &gt; Vendors
          </span>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-slate-body tracking-tight">
          Contractor & Vendor Concentration Matrix
        </h1>
        <p className="text-xs text-slate-muted">
          Vigilance profiling tracking contractor allocation caps, execution delays, and risk concentration
        </p>
      </div>

      {/* Advisory card */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-slate-body flex items-start gap-2.5">
        <Building className="w-5 h-5 text-govt-navy shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-govt-navy">Anti-Cartelization & Concentration Vigilance:</div>
          <div className="text-[11px] leading-relaxed mt-0.5 text-slate-muted">
            Under CVC (Central Vigilance Commission) directives, high concentration of projects or repeat delays under single contractors trigger automated alerts to prevent monopolistic distribution of constituency works.
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map(v => (
          <div
            key={v.name}
            className="bg-white rounded-2xl border border-slate-border p-5 shadow-xs space-y-4 hover:border-govt-navy transition-all text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-body line-clamp-1">{v.name}</h3>
                <div className="text-[10px] text-slate-muted font-mono mt-0.5">Registered Govt Contractor</div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  v.highRiskCount > 1
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : v.delayed > 0
                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                    : 'bg-emerald-50 text-status-verified border border-status-verified/30'
                }`}
              >
                {v.riskExposureRating}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 bg-panel-bg p-3 rounded-xl border border-slate-border font-mono">
              <div>
                <div className="text-[10px] text-slate-muted uppercase font-sans font-bold">Total Works</div>
                <div className="text-base font-bold text-slate-body">{v.totalProjects}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-muted uppercase font-sans font-bold">Contract Value</div>
                <div className="text-base font-bold text-govt-navy">₹{v.totalValueCr} Cr</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-muted uppercase font-sans font-bold">Completed</div>
                <div className="text-sm font-bold text-status-verified">{v.completed}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-muted uppercase font-sans font-bold">Delayed / At Risk</div>
                <div className="text-sm font-bold text-red-600">{v.delayed}</div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-muted">
                <span className="font-medium">Timely Completion Rate</span>
                <strong className="font-mono text-slate-body">{v.completionRate}%</strong>
              </div>
              <div className="w-full bg-slate-border h-2 rounded-full overflow-hidden">
                <div className="bg-govt-navy h-full rounded-full" style={{ width: `${v.completionRate}%` }} />
              </div>
            </div>

            {/* Category Tags */}
            <div className="pt-2 border-t border-slate-border">
              <div className="text-[10px] text-slate-muted mb-1 font-bold uppercase">Categories</div>
              <div className="flex flex-wrap gap-1">
                {v.categories.map((c: string) => (
                  <span key={c} className="px-2 py-0.5 rounded-md bg-panel-bg border border-slate-border text-slate-body text-[10px] font-medium">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
