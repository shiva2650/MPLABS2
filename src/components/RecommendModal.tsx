import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { X, FilePlus2, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RecommendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecommendModal: React.FC<RecommendModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Drinking Water & Sanitation');
  const [description, setDescription] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [district, setDistrict] = useState(user?.district || 'Hyderabad');
  const [estimatedCostLakh, setEstimatedCostLakh] = useState('18.5');
  const [latitude, setLatitude] = useState('17.4120');
  const [longitude, setLongitude] = useState('78.4890');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Cost guidance
  const costBenchmarks: Record<string, { typical: string; range: string }> = {
    'Drinking Water & Sanitation': { typical: '₹16 Lakh', range: '₹12 - 20 Lakh' },
    'Education & Schools': { typical: '₹24 Lakh', range: '₹18 - 30 Lakh' },
    'Renewable Energy': { typical: '₹32 Lakh', range: '₹25 - 40 Lakh' },
    'Roads, Bridges & Pathways': { typical: '₹22 Lakh', range: '₹15 - 28 Lakh' },
    'Healthcare & Wellness': { typical: '₹35 Lakh', range: '₹25 - 45 Lakh' },
    'Community Infrastructure': { typical: '₹20 Lakh', range: '₹15 - 25 Lakh' }
  };

  const benchmark = costBenchmarks[category] || { typical: '₹20 Lakh', range: '₹15 - 25 Lakh' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const costNumber = Math.round(parseFloat(estimatedCostLakh) * 100000);
      if (isNaN(costNumber) || costNumber <= 0) {
        throw new Error('Please enter a valid estimated cost in Lakhs.');
      }

      await api.recommendProject({
        title,
        category,
        description,
        locationAddress,
        district,
        estimatedCost: costNumber,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit recommendation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-govt-navy-dark/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-border overflow-hidden my-8">
        <div className="px-6 py-4 bg-govt-navy text-white flex items-center justify-between border-b border-govt-navy-dark">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-govt-navy-light text-white border border-white/20">
              <FilePlus2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                MP Recommendation of Developmental Work
              </h2>
              <div className="text-xs text-panel-bg/80">
                Member of Parliament Local Area Development Scheme (MPLADS)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-panel-bg/80 hover:text-white hover:bg-govt-navy-light transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-panel-bg border border-status-flagged/30 text-status-flagged rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-body mb-1">
                Project Title / Proposed Work Name *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Installation of 2000 LPH RO Water Purification Plant at Sector 4"
                className="w-full px-3 py-2 border border-slate-border rounded-lg text-slate-body bg-white focus:ring-2 focus:ring-govt-navy focus:border-govt-navy focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-body mb-1">
                Developmental Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-border rounded-lg text-slate-body bg-white focus:ring-2 focus:ring-govt-navy focus:border-govt-navy focus:outline-hidden"
              >
                {Object.keys(costBenchmarks).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-body mb-1">
                Proposed Estimated Cost (in ₹ Lakh) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={estimatedCostLakh}
                onChange={e => setEstimatedCostLakh(e.target.value)}
                className="w-full px-3 py-2 border border-slate-border rounded-lg text-slate-body bg-white font-mono font-bold focus:ring-2 focus:ring-govt-navy focus:border-govt-navy focus:outline-hidden"
              />
            </div>
          </div>

          {/* AI Benchmark Preview */}
          <div className="p-3.5 bg-panel-bg border border-slate-border rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-govt-saffron shrink-0 mt-0.5" />
            <div className="text-[11px] text-govt-navy leading-relaxed">
              <strong>MoSPI Cost Benchmark Guidance:</strong> For <em>{category}</em>, typical cost is {benchmark.typical} (standard range: {benchmark.range}). Entering costs over 50% above this range will trigger an automated AI Cost Anomaly alert.
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-body mb-1">
              Location Address / Landmark *
            </label>
            <input
              type="text"
              required
              value={locationAddress}
              onChange={e => setLocationAddress(e.target.value)}
              placeholder="Village / Ward / Landmark, Tehsil, District"
              className="w-full px-3 py-2 border border-slate-border rounded-lg text-slate-body bg-white focus:ring-2 focus:ring-govt-navy focus:border-govt-navy focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-body mb-1">District</label>
              <input
                type="text"
                required
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full px-3 py-2 border border-slate-border rounded-lg text-slate-body bg-white focus:ring-2 focus:ring-govt-navy focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-body mb-1">GPS Latitude</label>
              <input
                type="text"
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
                className="w-full px-3 py-2 border border-slate-border rounded-lg font-mono text-slate-body bg-white focus:ring-2 focus:ring-govt-navy focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-body mb-1">GPS Longitude</label>
              <input
                type="text"
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
                className="w-full px-3 py-2 border border-slate-border rounded-lg font-mono text-slate-body bg-white focus:ring-2 focus:ring-govt-navy focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-body mb-1">
              Detailed Scope of Work & Public Justification
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Explain the local necessity, target population, and specific engineering requirements..."
              className="w-full px-3 py-2 border border-slate-border rounded-lg text-slate-body bg-white focus:ring-2 focus:ring-govt-navy focus:border-govt-navy focus:outline-hidden"
            />
          </div>

          <div className="pt-4 border-t border-slate-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-border text-slate-body bg-white hover:bg-panel-bg font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-govt-navy text-white font-bold hover:bg-govt-navy-light disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Submitting Recommendation...' : 'Submit Recommendation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
