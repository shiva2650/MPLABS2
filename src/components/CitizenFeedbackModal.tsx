import React, { useState } from 'react';
import { Project } from '../types/index.js';
import { api } from '../services/api.js';
import { X, MessageSquareWarning, CheckCircle2, ShieldCheck, ArrowRight, Building } from 'lucide-react';

interface CitizenFeedbackModalProps {
  projects: Project[];
  preselectedProjectId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CitizenFeedbackModal: React.FC<CitizenFeedbackModalProps> = ({
  projects,
  preselectedProjectId,
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;

  const [projectId, setProjectId] = useState(preselectedProjectId || projects[0]?.id || '');
  const [issueType, setIssueType] = useState('Substandard Material Quality');
  const [description, setDescription] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [citizenContact, setCitizenContact] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ id: string; trackingNumber: string; queue: string; slaDays: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const issueTypes = [
    'Substandard Material Quality',
    'Unexplained Delay in Execution',
    'Location Discrepancy (Work Not At Sanctioned Site)',
    'Suspected Financial Misappropriation / Incomplete Work',
    'Work Completed but Not Put to Public Use',
    'General Grievance / Inquiry'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.submitCitizenFeedback({
        projectId,
        issueType,
        description,
        citizenName: citizenName.trim() || undefined,
        citizenContact: citizenContact.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined
      });
      setSuccessInfo({
        id: res.feedbackId,
        trackingNumber: res.trackingNumber || `MPLADS-GRV-${Date.now().toString().slice(-6)}`,
        queue: res.routedQueue || 'DISTRICT_QUEUE',
        slaDays: res.slaDeadlineDays || 15
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit grievance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B3022]/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-[#F8F9F7] rounded-2xl shadow-2xl border border-[#DDE5D4] overflow-hidden my-8">
        <div className="px-6 py-4 bg-[#1B3022] text-white flex items-center justify-between border-b border-[#2C4A34]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#395C40]/50 text-[#DDE5D4] border border-[#395C40]">
              <MessageSquareWarning className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Durable Citizen Feedback & Grievance Pipeline
              </h2>
              <div className="text-xs text-[#A3B18A]">
                Direct public monitoring channel triaged to District / State / Ministry
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

        {successInfo ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-[#EAF0E6] text-[#395C40] rounded-full flex items-center justify-center mx-auto border border-[#C8D5B9]">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1B3022]">Grievance Successfully Registered</h3>
              <div className="font-mono text-xs font-bold text-[#395C40] mt-1">
                Tracking Number: {successInfo.trackingNumber}
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF3E0] text-[#935D26] font-bold text-[11px] border border-[#E8DAB2]">
                <Building className="w-3.5 h-3.5" />
                <span>Routed Queue: {successInfo.queue} (SLA: {successInfo.slaDays} Days)</span>
              </div>
              <p className="text-xs text-[#588157] mt-3 max-w-sm mx-auto">
                Your report has been persisted to the central government vigilance database. Citizen identities remain strictly confidential under Whistleblower Guidelines.
              </p>
            </div>
            <button
              onClick={() => {
                setSuccessInfo(null);
                onClose();
              }}
              className="px-6 py-2 bg-[#395C40] text-white rounded-lg text-xs font-bold hover:bg-[#2C4A34] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-[#FAF3E0] border border-[#E8DAB2] text-[#935D26] rounded-xl font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block font-bold text-[#1B3022] mb-1">
                Target Developmental Project *
              </label>
              <select
                required
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg text-[#1B3022] bg-white focus:ring-2 focus:ring-[#395C40] focus:border-[#395C40] focus:outline-hidden"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.projectCode}] {p.title} ({p.district})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1B3022] mb-1">
                Nature of Discrepancy / Grievance *
              </label>
              <select
                value={issueType}
                onChange={e => setIssueType(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg text-[#1B3022] bg-white focus:ring-2 focus:ring-[#395C40] focus:border-[#395C40] focus:outline-hidden"
              >
                {issueTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1B3022] mb-1">
                Detailed Observation & Specific Ground Facts *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="State specific visual observations, date observed, or quality deficiencies noticed at the site..."
                className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg text-[#1B3022] bg-white focus:ring-2 focus:ring-[#395C40] focus:border-[#395C40] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#1B3022] mb-1">
                  Citizen Name (Optional)
                </label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={e => setCitizenName(e.target.value)}
                  placeholder="Anonymous or Full Name"
                  className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg text-[#1B3022] bg-white focus:ring-2 focus:ring-[#395C40] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1B3022] mb-1">
                  Mobile Number (For SMS Tracking)
                </label>
                <input
                  type="tel"
                  value={citizenContact}
                  onChange={e => setCitizenContact(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg text-[#1B3022] bg-white focus:ring-2 focus:ring-[#395C40] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1B3022] mb-1">
                Photo Evidence URL (Optional)
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                placeholder="https://... photo link of ground reality"
                className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg text-[#1B3022] bg-white font-mono text-[11px] focus:ring-2 focus:ring-[#395C40] focus:outline-hidden"
              />
            </div>

            <div className="p-2.5 bg-[#EAF0E6] border border-[#C8D5B9] rounded-xl text-[11px] text-[#395C40] flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#395C40] shrink-0" />
              <span>Whistleblower Protection: Phone numbers are cryptographically masked.</span>
            </div>

            <div className="pt-3 border-t border-[#DDE5D4] flex items-center justify-end gap-3">
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
                <span>{submitting ? 'Registering...' : 'Register Grievance in Database'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
