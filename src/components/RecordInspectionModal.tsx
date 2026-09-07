import React, { useState } from 'react';
import { X, CheckSquare, AlertTriangle, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProjectInspection, InspectionChecklistItem } from '../types/index.ts';
import { recordInspectionFindings } from '../services/api.ts';

interface RecordInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: ProjectInspection | null;
  onFindingsRecorded: () => void;
}

export const RecordInspectionModal: React.FC<RecordInspectionModalProps> = ({
  isOpen,
  onClose,
  inspection,
  onFindingsRecorded
}) => {
  const [result, setResult] = useState<'Satisfactory' | 'Minor Issues' | 'Major Issues' | 'Critical Issues'>(
    (inspection?.result as any) || 'Satisfactory'
  );
  const [observations, setObservations] = useState(inspection?.observations || '');
  const [recommendations, setRecommendations] = useState(inspection?.recommendations || '');
  const [complianceNotes, setComplianceNotes] = useState(inspection?.complianceNotes || '');
  const [checklist, setChecklist] = useState<InspectionChecklistItem[]>(
    inspection?.checklist && inspection.checklist.length > 0
      ? inspection.checklist
      : [
          { item: 'Site location verification against approved DPR geo-coordinates', status: 'Satisfactory' },
          { item: 'Civil construction physical stage & structural safety compliance', status: 'Satisfactory' },
          { item: 'Material quality testing certificates compliance', status: 'Satisfactory' },
          { item: 'Measurement Book (MB) physical entries alignment with progress', status: 'Satisfactory' },
          { item: 'Citizen safety measures & statutory MPLADS signage installed', status: 'Satisfactory' }
        ]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !inspection) return null;

  const handleChecklistChange = (index: number, newStatus: 'Satisfactory' | 'Issue' | 'N/A') => {
    setChecklist((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status: newStatus };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await recordInspectionFindings(inspection.id, {
        result,
        observations: observations.trim(),
        recommendations: recommendations.trim(),
        checklist,
        complianceNotes: complianceNotes.trim()
      });
      onFindingsRecorded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record findings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl border border-gray-300 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-blue-950 text-white p-4 flex items-start justify-between border-b-2 border-amber-500">
          <div>
            <div className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded uppercase w-fit mb-1">
              Field Report Filing
            </div>
            <h3 className="text-base font-extrabold text-white">Record Site Inspection Findings</h3>
            <p className="text-xs text-blue-200 mt-0.5">
              Work ID: {inspection.workId} • Officer: {inspection.inspectingOfficer} ({inspection.officerDesignation})
            </p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Overall Result Outcome */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 uppercase text-[10px]">
              Overall Inspection Outcome *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { val: 'Satisfactory', color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                { val: 'Minor Issues', color: 'border-blue-500 bg-blue-50 text-blue-900' },
                { val: 'Major Issues', color: 'border-amber-500 bg-amber-50 text-amber-900' },
                { val: 'Critical Issues', color: 'border-red-500 bg-red-50 text-red-900' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.val}
                  onClick={() => setResult(item.val as any)}
                  className={`py-2 px-2 text-center rounded border font-bold text-xs transition-all ${
                    result === item.val
                      ? `${item.color} ring-2 ring-blue-950`
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.val}
                </button>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 uppercase text-[10px]">
              Statutory Quality & Compliance Checklist
            </label>
            <div className="space-y-2 bg-gray-50 p-3 rounded border border-gray-200">
              {checklist.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-800 flex-1">{c.item}</span>
                  <div className="flex items-center gap-1">
                    {(['Satisfactory', 'Issue', 'N/A'] as const).map((st) => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => handleChecklistChange(idx, st)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          c.status === st
                            ? st === 'Satisfactory'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : st === 'Issue'
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-gray-700 text-white border-gray-700'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Observations */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 uppercase text-[10px]">
              Physical Stage & Quality Observations *
            </label>
            <textarea
              required
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Detail ground physical progress, alignment with drawings, material test results..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs bg-gray-50 focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>

          {/* Actionable Recommendations */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 uppercase text-[10px]">
              Officer Recommendations *
            </label>
            <textarea
              required
              rows={2}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="e.g. Approve milestone disbursement, or issue notice for rectifying plastering defects..."
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs bg-gray-50 focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>

          {/* Compliance Notes */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 uppercase text-[10px]">
              Compliance & Action Directives (Optional)
            </label>
            <input
              type="text"
              value={complianceNotes}
              onChange={(e) => setComplianceNotes(e.target.value)}
              placeholder="e.g. Contractor instructed to submit cubic test report within 7 days."
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs bg-gray-50 focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !observations.trim() || !recommendations.trim()}
              className="px-5 py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded text-xs disabled:opacity-50 shadow-2xs"
            >
              {loading ? 'Submitting...' : 'Submit Official Inspection Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
