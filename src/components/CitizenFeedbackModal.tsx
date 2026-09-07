import React, { useState } from 'react';
import { Project, CitizenFeedback, IssueType } from '../types/index.ts';
import { submitCitizenFeedback } from '../services/api.ts';
import {
  MessageSquarePlus,
  Send,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Clock,
  Building,
  ShieldCheck
} from 'lucide-react';

interface CitizenFeedbackModalProps {
  projects: Project[];
  feedbackList: CitizenFeedback[];
  preSelectedProject?: Project | null;
  onClose?: () => void;
  onFeedbackSubmitted?: () => void;
}

export const CitizenFeedbackModal: React.FC<CitizenFeedbackModalProps> = ({
  projects,
  feedbackList,
  preSelectedProject,
  onClose,
  onFeedbackSubmitted
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    preSelectedProject ? preSelectedProject.id : (projects[0]?.id || '')
  );
  const [issueType, setIssueType] = useState<IssueType>('Substandard Construction Quality');
  const [citizenName, setCitizenName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [comments, setComments] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !comments) {
      setErrorMsg('Please select a project and describe the issue.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await submitCitizenFeedback({
        projectId: selectedProjectId,
        issueType,
        citizenName: citizenName || 'Concerned Citizen',
        contactEmail: contactEmail || undefined,
        comments,
        photoUrl: photoUrl || undefined
      });

      setSuccessMsg('Grievance registered successfully! District Authority will review.');
      setComments('');
      setPhotoUrl('');
      if (onFeedbackSubmitted) onFeedbackSubmitted();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit grievance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-blue-900 text-white p-5 rounded-lg shadow-xs">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquarePlus className="w-6 h-6 text-amber-400" />
          <h2 className="text-lg font-bold">Public Vigilance & Citizen Grievance Redressal</h2>
        </div>
        <p className="text-xs text-blue-100 leading-relaxed max-w-3xl">
          Under the official MPLADS Guidelines, citizens are empowered to inspect community assets in their
          localities and report discrepancies. Feedback is logged directly into the administrative vigilance queue
          for district magistrate review. Citizen reports do not overwrite official engineering records.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grievance Submission Form */}
        <div className="lg:col-span-6 bg-white p-5 rounded-lg border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-900" />
              <span>Lodge Citizen Observation / Complaint</span>
            </h3>
            <span className="text-[11px] text-gray-500 font-medium">Form 10-A (Public)</span>
          </div>

          {successMsg && (
            <div className="p-3 mb-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 mb-4 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Select MPLADS Work *
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
                className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-800 font-medium"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.workId}] {p.title} ({p.district}, {p.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Category of Issue *
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueType)}
                className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-800 font-medium"
              >
                <option value="Substandard Construction Quality">Substandard Construction Quality</option>
                <option value="Work Not Started">Work Not Started / Inordinate Delay</option>
                <option value="Asset Not Found">Asset Not Found / Ghost Project</option>
                <option value="Location Mismatch">Location Mismatch / Wrong Site Executed</option>
                <option value="Damaged Asset">Damaged / Non-functional Asset</option>
                <option value="Other Discrepancy">Other Discrepancy</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Citizen Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Chandra (or Anonymous)"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Contact Email / Phone (Optional)
                </label>
                <input
                  type="text"
                  placeholder="For status updates"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Ground Observation & Details *
              </label>
              <textarea
                rows={3}
                required
                placeholder="State specific observations regarding physical progress, asset condition, or absence of signboards..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Site Evidence Photo URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-800"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Lodging Observation...' : 'Submit Citizen Observation'}</span>
            </button>
          </form>
        </div>

        {/* Public Grievances Log */}
        <div className="lg:col-span-6 bg-white p-5 rounded-lg border border-gray-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span>Recent Public Observations Ledger</span>
            </h3>
            <span className="text-[11px] bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded">
              {feedbackList.length} Entries
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
            {feedbackList.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs">
                No citizen observations recorded yet.
              </div>
            ) : (
              feedbackList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-gray-50 rounded-md border border-gray-200 hover:bg-blue-50/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <span className="text-[10px] font-bold text-blue-900 uppercase">
                        {item.workId}
                      </span>
                      <h4 className="text-xs font-bold text-gray-900 line-clamp-1">
                        {item.projectTitle}
                      </h4>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        item.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Under Investigation'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'Dismissed'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="text-[11px] font-semibold text-rose-700 mb-1 flex items-center gap-1">
                    <span>Issue:</span>
                    <span>{item.issueType}</span>
                  </div>

                  <p className="text-xs text-gray-700 italic bg-white p-2 rounded border border-gray-100 mb-1.5">
                    "{item.comments}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>Reported by: {item.citizenName}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
