import React, { useState } from 'react';
import { RiskAlert } from '../types/index.js';
import { api } from '../services/api.js';
import { X, ShieldAlert, CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';
import { AlertBadge, RiskBadge } from './Badges.js';

interface AlertActionModalProps {
  alert: RiskAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AlertActionModal: React.FC<AlertActionModalProps> = ({
  alert,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [decision, setDecision] = useState<'Under Review' | 'False Positive' | 'Escalated' | 'Resolved'>('Under Review');
  const [reviewNotes, setReviewNotes] = useState(alert?.reviewNotes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (alert) {
      setReviewNotes(alert.reviewNotes || '');
      setDecision('Under Review');
      setError(null);
    }
  }, [alert?.id, isOpen]);

  if (!isOpen || !alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.updateAlertStatus(alert.id, decision, reviewNotes);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update alert review status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-govt-navy-dark/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-border overflow-hidden my-8">
        <div className="px-6 py-4 bg-govt-navy text-white flex items-center justify-between border-b border-govt-navy-dark">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-panel-bg text-status-flagged border border-status-flagged/40">
              <ShieldAlert className="w-5 h-5 text-status-flagged" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Investigate & Adjudicate AI Risk Alert
              </h2>
              <div className="text-xs text-panel-bg/80 font-mono">
                {alert.id} — {alert.alertType}
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

          {/* Alert Context Summary */}
          <div className="p-4 bg-panel-bg rounded-xl border border-slate-border shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-body">{alert.projectTitle}</span>
              <RiskBadge level={alert.riskLevel} />
            </div>
            <div className="text-[11px] text-slate-muted space-x-2 font-mono">
              <span>Code: {alert.projectCode}</span>
              <span>•</span>
              <span>District: {alert.district}</span>
              <span>•</span>
              <span>Agency: {alert.agencyName}</span>
            </div>
            <div className="pt-2 border-t border-slate-border text-slate-body font-medium">
              <span className="text-slate-muted font-normal">Observed Indicator: </span>
              {alert.reason}
            </div>
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block font-bold text-slate-body mb-2">
              Human Review & Vigilance Determination *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors ${
                  decision === 'Under Review'
                    ? 'border-status-review/40 bg-panel-bg text-status-review font-bold'
                    : 'border-slate-border bg-white hover:bg-panel-bg text-slate-body'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="decision"
                    value="Under Review"
                    checked={decision === 'Under Review'}
                    onChange={() => setDecision('Under Review')}
                  />
                  <span>Mark Under Review</span>
                </div>
                <span className="text-[10px] text-slate-muted font-normal ml-5">
                  Assigned for field verification & measurement book check
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors ${
                  decision === 'Escalated'
                    ? 'border-status-flagged/40 bg-panel-bg text-status-flagged font-bold'
                    : 'border-slate-border bg-white hover:bg-panel-bg text-slate-body'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="decision"
                    value="Escalated"
                    checked={decision === 'Escalated'}
                    onChange={() => setDecision('Escalated')}
                  />
                  <span>Escalate to Vigilance</span>
                </div>
                <span className="text-[10px] text-slate-muted font-normal ml-5">
                  Issue show-cause notice & freeze further payment tranches
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors ${
                  decision === 'False Positive'
                    ? 'border-govt-navy/40 bg-panel-bg text-govt-navy font-bold'
                    : 'border-slate-border bg-white hover:bg-panel-bg text-slate-body'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="decision"
                    value="False Positive"
                    checked={decision === 'False Positive'}
                    onChange={() => setDecision('False Positive')}
                  />
                  <span>Mark False Positive</span>
                </div>
                <span className="text-[10px] text-slate-muted font-normal ml-5">
                  Verified as legitimate deviation; adjust AI baseline
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors ${
                  decision === 'Resolved'
                    ? 'border-govt-navy bg-panel-bg text-govt-navy font-bold'
                    : 'border-slate-border bg-white hover:bg-panel-bg text-slate-body'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="decision"
                    value="Resolved"
                    checked={decision === 'Resolved'}
                    onChange={() => setDecision('Resolved')}
                  />
                  <span>Mark Resolved</span>
                </div>
                <span className="text-[10px] text-slate-muted font-normal ml-5">
                  Satisfactory justification submitted and vetted
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-body mb-1">
              Administrative Findings & Action Taken Notes *
            </label>
            <textarea
              rows={3}
              required
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              placeholder="Detail reasons for decision, inspection officer appointed, or rectification received..."
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
              <span>{submitting ? 'Saving Decision...' : 'Record Administrative Decision'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
