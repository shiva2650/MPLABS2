import React, { useState } from 'react';
import { Project, CitizenFeedback } from '../types';
import { ApiService } from '../services/api';
import { MessageSquare, CheckCircle2, AlertCircle, Send, ShieldCheck, MapPin } from 'lucide-react';

interface CitizenFeedbackSectionProps {
  projects: Project[];
  feedbackList: CitizenFeedback[];
  onFeedbackSubmitted: () => void;
}

export const CitizenFeedbackSection: React.FC<CitizenFeedbackSectionProps> = ({
  projects,
  feedbackList,
  onFeedbackSubmitted,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [citizenName, setCitizenName] = useState<string>('');
  const [citizenContact, setCitizenContact] = useState<string>('');
  const [issueType, setIssueType] = useState<string>('Quality of Construction');
  const [comments, setComments] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !citizenName.trim() || !comments.trim()) {
      setErrorMessage('Please select a project, provide your name, and write comments.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await ApiService.submitFeedback({
        projectId: selectedProjectId,
        citizenName,
        citizenContact,
        issueType,
        comments,
      });

      setSuccessMessage('Thank you! Your feedback and ground report has been recorded for official district review.');
      setComments('');
      setCitizenContact('');
      onFeedbackSubmitted();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-md shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Citizen Opinion &amp; Community Feedback Portal
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Empowering local communities to verify MPLADS assets on the ground. Report discrepancies in physical progress, quality, location, or uncompleted community assets directly to District Authorities.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Submission Form */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-lg p-5 shadow-xs">
          <h3 className="text-sm font-bold text-stone-900 mb-3 pb-2 border-b border-stone-200 flex items-center justify-between">
            <span>Submit Ground Feedback / Grievance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </h3>

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Select MPLADS Development Project *
              </label>
              <select
                id="feedback-project-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-800"
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.district}] {p.title} ({p.workCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Your Full Name *
                </label>
                <input
                  id="feedback-name-input"
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="e.g. Ramesh Reddy"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Mobile / Contact (Optional)
                </label>
                <input
                  id="feedback-contact-input"
                  type="text"
                  value={citizenContact}
                  onChange={(e) => setCitizenContact(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Observation / Issue Category *
              </label>
              <select
                id="feedback-issue-select"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-800"
              >
                <option value="Quality of Construction">Quality of Construction / Material</option>
                <option value="Work Incomplete or Abandoned">Work Incomplete or Abandoned</option>
                <option value="Asset Not Found at Location">Asset Not Found at Registered Location</option>
                <option value="Signboard Missing / Non-Compliant">MPLADS Signboard Missing / Non-Compliant</option>
                <option value="Asset Maintenance Issue">Asset Maintenance / Operational Issue</option>
                <option value="Appreciation & Commendation">Appreciation &amp; Positive Observation</option>
                <option value="Other">Other Ground Feedback</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Detailed Ground Observations &amp; Specifics *
              </label>
              <textarea
                id="feedback-comments-input"
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Describe current physical state, street landmark, or discrepancy observed..."
                className="w-full px-3 py-2 bg-white border border-stone-300 rounded text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-800"
                required
              />
              <span className="text-[11px] text-stone-500">
                Personal contact details are automatically masked for privacy in public listings.
              </span>
            </div>

            <button
              id="feedback-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-sky-900 hover:bg-sky-950 disabled:opacity-50 rounded transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Submitting Report...' : 'Submit Official Citizen Report'}
            </button>
          </form>
        </div>

        {/* Public Feedback Feed */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-200">
            <h3 className="text-sm font-bold text-stone-900">
              Community Ground Reports &amp; Verified Feedback
            </h3>
            <span className="text-xs text-stone-500 font-medium">
              {feedbackList.length} submissions logged
            </span>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {feedbackList.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-stone-50 border border-stone-200 rounded-md text-xs hover:border-stone-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="font-bold text-stone-900">{item.projectTitle}</span>
                    <div className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      <span>{item.district}, {item.state} • Work Code: {item.workCode}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      item.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'Under Review'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="inline-block px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 rounded text-[10px] font-semibold mr-2">
                    {item.issueType}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Reported by {item.citizenName} {item.citizenContact && `(${item.citizenContact})`} on{' '}
                    {new Date(item.submittedAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-stone-700 bg-white p-2.5 rounded border border-stone-200 text-xs leading-relaxed">
                  "{item.comments}"
                </p>

                {item.officialRemarks && (
                  <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded border border-emerald-200">
                    <strong>District Authority Response:</strong> {item.officialRemarks}
                  </div>
                )}
              </div>
            ))}

            {feedbackList.length === 0 && (
              <div className="text-center py-8 text-stone-500 text-xs">
                No citizen feedback submitted yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
