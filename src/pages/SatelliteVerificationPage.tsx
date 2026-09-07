import React, { useState, useEffect } from 'react';
import { Project } from '../types/index.js';
import { api } from '../services/api.js';
import { Satellite, CheckCircle2, AlertTriangle, RefreshCw, Calendar, Activity, TreePine, Building } from 'lucide-react';

export const SatelliteVerificationPage: React.FC<{ projects: Project[]; onSelectProject?: (p: Project) => void }> = ({ projects }) => {
  const [selectedId, setSelectedId] = useState(projects[0]?.id || '');
  const [obs, setObs] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSat = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.getSatelliteObservation(id);
      setObs(res.observation);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId) fetchSat(selectedId);
  }, [selectedId]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#DDE5D4] p-5 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#263D2E] text-white">
              <Satellite className="w-6 h-6 text-[#A3B18A]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1B3022]">Satellite Imagery Multi-Temporal Cross-Verification</h1>
              <p className="text-xs text-[#588157]">Copernicus Sentinel-2 Process API & Google Earth Engine Integration</p>
            </div>
          </div>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="text-xs bg-[#F8F9F7] border border-[#C8D5B9] rounded-lg px-3 py-2">
            {projects.map(p => (
              <option key={p.id} value={p.id}>[{p.projectCode}] {p.title.slice(0, 45)}...</option>
            ))}
          </select>
        </div>
      </div>

      {obs && (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${obs.verdict === 'ANOMALY_DETECTED' ? 'bg-[#FFF0ED] border-[#E07A5F] text-[#9C3820]' : 'bg-[#F1F6EF] border-[#A3B18A] text-[#244829]'}`}>
            <div>
              <span className="font-bold text-sm uppercase">{obs.verdict.replace('_', ' ')}</span>
              <p className="mt-0.5">{obs.verdictReason}</p>
            </div>
            <span className="font-bold font-mono text-sm">{(obs.confidenceScore * 100).toFixed(0)}% Confidence</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-[#DDE5D4] p-4 text-center space-y-2">
              <span className="text-xs font-bold text-[#1B3022]">T0 Baseline Pass ({obs.baselineDate})</span>
              <img src={obs.beforeImageUrl} alt="Baseline" className="w-full rounded-lg shadow-xs" />
            </div>
            <div className="bg-white rounded-xl border border-[#DDE5D4] p-4 text-center space-y-2">
              <span className="text-xs font-bold text-[#1B3022]">T1 Observed Completion ({obs.evaluationDate})</span>
              <img src={obs.afterImageUrl} alt="Observed" className="w-full rounded-lg shadow-xs" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
