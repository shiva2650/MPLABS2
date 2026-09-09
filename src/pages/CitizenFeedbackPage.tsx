import React, { useState } from 'react';
import { CitizenFeedback, Project, UserRole } from '../types/index.js';
import { MessageSquareWarning, Calendar, ArrowLeft } from 'lucide-react';
import { CitizenFeedbackModal } from '../components/CitizenFeedbackModal.js';
import { useLanguage } from '../context/LanguageContext.js';
import { api } from '../services/api.js';

interface CitizenFeedbackPageProps {
  feedbackList: CitizenFeedback[];
  projects: Project[];
  userRole: UserRole | 'PUBLIC';
  onRefresh: () => void;
  onSelectProject: (project: Project) => void;
  onBackToDashboard?: () => void;
}

export const CitizenFeedbackPage: React.FC<CitizenFeedbackPageProps> = ({
  feedbackList,
  projects,
  userRole,
  onRefresh,
  onSelectProject,
  onBackToDashboard
}) => {
  const { language, t, translateStatus } = useLanguage();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [reviewingItem, setReviewingItem] = useState<CitizenFeedback | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'Under Review' | 'Verified' | 'Resolved' | 'Rejected'>('Under Review');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingItem) return;
    setSubmitting(true);
    setModalError(null);
    try {
      await api.updateFeedbackStatus(reviewingItem.id, reviewStatus, adminNotes);
      setReviewingItem(null);
      setAdminNotes('');
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setModalError(err?.message || (language === 'hi' ? 'शिकायत स्थिति अद्यतन करने में विफलता। कृपया पुन: प्रयास करें।' : 'Failed to update grievance status. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Persistent Back Button */}
      {onBackToDashboard && (
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-govt-navy bg-white border border-slate-border hover:bg-panel-bg rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← {t.backToOverview}</span>
          </button>
          <span className="text-xs text-slate-muted">
            {t.home} &gt; {t.grievances}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {language === 'hi' ? 'नागरिक शिकायत निवारण एवं जन प्रतिक्रिया' : 'Citizen Grievance Redressal & Public Feedback'}
          </h1>
          <p className="text-xs text-gray-500">
            {language === 'hi'
              ? 'सीधे ज़िला प्रशासन को प्रेषित विसलब्लोअर रिपोर्ट एवं सार्वजनिक निगरानी'
              : 'Whistleblower reports and public civil works monitoring directly submitted to District Authority'}
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-govt-navy text-white rounded-md text-xs font-semibold hover:bg-govt-navy-light shadow-2xs cursor-pointer"
        >
          <MessageSquareWarning className="w-4 h-4" />
          <span>{language === 'hi' ? 'नई नागरिक शिकायत दर्ज करें' : 'Register New Citizen Grievance'}</span>
        </button>
      </div>

      {/* Grievances List */}
      <div className="space-y-3">
        {feedbackList.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200 text-gray-500 text-xs">
            {language === 'hi' ? 'अधिकार क्षेत्र में कोई सार्वजनिक शिकायत दर्ज नहीं है।' : 'No public grievances registered in jurisdiction.'}
          </div>
        ) : (
          feedbackList.map(item => {
            const project = projects.find(p => p.id === item.projectId || p.projectCode === item.projectCode);
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-2xs text-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-govt-navy">{item.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {item.issueType}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'Resolved'
                          ? 'bg-emerald-100 text-status-verified'
                          : item.status === 'Verified'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {translateStatus(item.status)}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {language === 'hi' ? 'दर्ज तिथि:' : 'Reported on:'}{' '}
                      {new Date(item.submittedAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN')}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="text-gray-500 text-[11px]">{language === 'hi' ? 'संबंधित परियोजना:' : 'Associated Project:'}</div>
                  <div
                    onClick={() => project && onSelectProject(project)}
                    className="font-bold text-gray-900 text-sm hover:text-govt-navy cursor-pointer"
                  >
                    [{item.projectCode}] {item.projectTitle} ({item.district})
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-800 leading-relaxed">
                  {item.description}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-gray-500 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <span>
                      {language === 'hi' ? 'नागरिक:' : 'Citizen:'}{' '}
                      <strong>{item.citizenName || (language === 'hi' ? 'जागरूक नागरिक' : 'Concerned Citizen')}</strong>
                    </span>
                    {item.citizenContactMasked && (
                      <span className="font-mono">{language === 'hi' ? 'संपर्क:' : 'Contact:'} {item.citizenContactMasked}</span>
                    )}
                  </div>

                  {userRole === 'ADMIN' && (
                    <button
                      onClick={() => {
                        setReviewingItem(item);
                        setReviewStatus(item.status === 'New' ? 'Under Review' : item.status);
                        setAdminNotes(item.adminNotes || '');
                      }}
                      className="px-3 py-1.5 bg-govt-navy text-white rounded font-semibold text-xs hover:bg-govt-navy-light cursor-pointer"
                    >
                      {language === 'hi' ? 'सतर्कता स्थिति अद्यतन करें' : 'Update Vigilance Status'}
                    </button>
                  )}
                </div>

                {item.adminNotes && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded text-govt-navy text-[11px]">
                    <strong>{language === 'hi' ? 'प्रशासनिक निरीक्षण टिप्पणी:' : 'Administrative Inspection Note:'}</strong> {item.adminNotes}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Citizen Feedback Modal */}
      <CitizenFeedbackModal
        projects={projects}
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={() => {
          setShowSubmitModal(false);
          onRefresh();
        }}
      />

      {/* Admin Status Review Modal */}
      {reviewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-gray-900">
              {language === 'hi' ? 'नागरिक शिकायत निवारण स्थिति अद्यतन करें' : 'Update Citizen Grievance Redressal Status'}
            </h3>
            <div className="p-2.5 bg-gray-50 rounded border border-gray-200 font-mono text-[11px]">
              {language === 'hi' ? 'शिकायत आईडी:' : 'Grievance ID:'} {reviewingItem.id} ({reviewingItem.issueType})
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-3">
              {modalError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {modalError}
                </div>
              )}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {language === 'hi' ? 'स्थिति निर्धारण' : 'Status Determination'}
                </label>
                <select
                  value={reviewStatus}
                  onChange={e => setReviewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                >
                  <option value="Under Review">{language === 'hi' ? 'समीक्षाधीन (निरीक्षण प्रतिनियुक्त)' : 'Under Review (Inspection Deputed)'}</option>
                  <option value="Verified">{language === 'hi' ? 'सत्यापित दोष (एजेंसी को कारण बताओ नोटिस)' : 'Verified Defect (Show-cause notice to Agency)'}</option>
                  <option value="Resolved">{language === 'hi' ? 'निस्तारित (सुधार कार्य पूर्ण)' : 'Resolved (Rectification Completed)'}</option>
                  <option value="Rejected">{language === 'hi' ? 'अस्वीकृत (अप्रमाणित)' : 'Rejected (Unsubstantiated)'}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  {language === 'hi' ? 'प्रशासनिक टिप्पणी' : 'Administrative Notes'}
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  placeholder={language === 'hi' ? 'निरीक्षण तिथि, निष्कर्ष या ठेकेदार पर लगाए गए जुर्माने का विवरण दर्ज करें...' : 'Record inspection date, findings, or contractor penalties imposed...'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingItem(null)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 font-medium cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-govt-navy text-white rounded font-semibold hover:bg-govt-navy-light disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (language === 'hi' ? 'अद्यतन जारी...' : 'Updating...') : (language === 'hi' ? 'निवारण रिकॉर्ड सहेजें' : 'Save Redressal Record')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
