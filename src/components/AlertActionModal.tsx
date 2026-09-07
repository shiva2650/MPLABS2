import React, { useState } from 'react';
import { RiskAlert } from '../types/index.js';
import { api } from '../services/api.js';
import { X, ShieldAlert, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import { RiskBadge } from './Badges.js';

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
  if (!isOpen || !alert) return null;

  const [decision, setDecision] = useState<'Under Review' | 'False Positive' | 'Confirmed Anomaly' | 'Escalated' | 'Resolved'>('Under Review');
  const [reviewNotes, setReviewNotes] = useState(alert.reviewNotes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackSavedNotice, setFeedbackSavedNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.updateAlertStatus(alert.id, decision, reviewNotes);
      setFeedbackSavedNotice(
        decision === 'False Positive'
          ? 'Label fed into ML training set: Future false alarm sensitivity reduced.'
          : decision === 'Confirmed Anomaly' || decision === 'Escalated'
          ? 'Label fed into ML training set: Anomaly detection weights reinforced.'
          : 'Decision recorded.'
      );
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update alert review status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B3022]/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl bg-[#F8F9F7] rounded-2xl shadow-2xl border border-[#DDE5D4] overflow-hidden my-8">
        <div className="px-6 py-4 bg-[#1B3022] text-white flex items-center justify-between border-b border-[#2C4A34]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#E07A5F]/20 text-[#E07A5F] border border-[#E07A5F]/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Investigate & Adjudicate AI Risk Alert
              </h2>
              <div className="text-xs text-[#A3B18A] font-mono">
                {alert.id} • {alert.alertType}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A3B18A] hover:text-white hover:bg-[#395C40] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-[#FAF3E0] border border-[#E8DAB2] text-[#935D26] rounded-xl font-medium">
              {error}
            </div>
          )}

          {feedbackSavedNotice && (
            <div className="p-3 bg-[#EAF0E6] border border-[#C8D5B9] text-[#263D2E] rounded-xl font-bold flex items-center gap-2 animate-in fade-in">
              <RefreshCw className="w-4 h-4 text-[#395C40] animate-spin" />
              <span>{feedbackSavedNotice}</span>
            </div>
          )}

          {/* Alert Context Summary */}
          <div className="p-4 bg-white rounded-xl border border-[#DDE5D4] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1B3022]">{alert.projectTitle}</span>
              <RiskBadge level={alert.riskLevel} />
            </div>
            <div className="text-[11px] text-[#588157] space-x-2 font-mono">
              <span>Code: {alert.projectCode}</span>
              <span>•</span>
              <span>District: {alert.district}</span>
              <span>•</span>
              <span>Agency: {alert.agencyName}</span>
            </div>
            <div className="pt-2 border-t border-[#F0F2ED] text-[#1B3022] font-medium">
              <span className="text-[#588157] font-normal">Observed Indicator: </span>
              {alert.reason}
            </div>
          </div>

          {/* ML Feedback Retraining Notice */}
          <div className="p-3 bg-[#EAF0E6] border border-[#C8D5B9] rounded-xl text-[11px] text-[#263D2E]">
            <strong>Active ML Feedback Loop:</strong> Marking this alert as <em>False Positive</em> or <em>Confirmed Anomaly</em> directly updates the Isolation Forest & Decision Boosting weights to improve future accuracy.
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block font-bold text-[#1B3022] mb-2">
              Human Review & Vigilance Determination *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors ${
                  decision === 'Under Review'
                    ? 'border-[#D4A373] bg-[#FAF3E0] text-[#935D26] font-bold'
                    : 'border-[#DDE5D4] bg-white hover:bg-[#F8F9F7] text-[#1B3022]'
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
                <span className="text-[10px] text-[#588157] font-normal ml-5">
                  Assigned for field verification & measurement book check
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors ${
                  decision === 'Confirmed Anomaly'
                    ? 'border-[#B85338] bg-[#FDF0EC] text-[#B85338] font-bold'
                    : 'border-[#DDE5D4] bg-white hover:bg-[#F8F9F7] text-[#1B3022]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="decision"
                    value="Confirmed Anomaly"
                    checked={decision === 'Confirmed Anomaly'}
                    onChange={() => setDecision('Confirmed Anomaly')}
                  />
                  <span>Confirmed Anomaly</span>
                </div>
                <span className="text-[10px] text-[#588157] font-normal ml-5">
                  Verified irregularity; reinforces ML training weights
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors ${
                  decision === 'False Positive'
                    ? 'border-[#395C40] bg-[#EAF0E6] text-[#395C40] font-bold'
                    : 'border-[#DDE5D4] bg-white hover:bg-[#F8F9F7] text-[#1B3022]'
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
                  <span>False Positive</span>
                </div>
                <span className="text-[10px] text-[#588157] font-normal ml-5">
                  Legitimate deviation; feeds negative label into ML model
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col gap-1 cursor-pointer transition-colors ${
                  decision === 'Escalated'
                    ? 'border-[#E07A5F] bg-[#FAF0EC] text-[#B84A30] font-bold'
                    : 'border-[#DDE5D4] bg-white hover:bg-[#F8F9F7] text-[#1B3022]'
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
                  <span>Escalate to Ministry</span>
                </div>
                <span className="text-[10px] text-[#588157] font-normal ml-5">
                  Direct central vigilance enquiry & freeze tranche payments
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1B3022] mb-1">
              Administrative Findings & Action Taken Notes *
            </label>
            <textarea
              rows={3}
              required
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              placeholder="Detail reasons for decision, inspection officer appointed, or rectification received..."
              className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg text-[#1B3022] bg-white focus:ring-2 focus:ring-[#395C40] focus:border-[#395C40] focus:outline-hidden"
            />
          </div>

          <div className="pt-4 border-t border-[#DDE5D4] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#DDE5D4] text-[#1B3022] bg-white hover:bg-[#F8F9F7] font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#395C40] text-white font-bold hover:bg-[#2C4A34] disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Updating & Retraining...' : 'Save & Retrain ML Model'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
