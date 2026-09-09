import React, { useState } from 'react';
import { Project, UserRole } from '../types/index.js';
import { StatusBadge, RiskBadge } from '../components/Badges.js';
import { FilePlus2, ArrowLeft } from 'lucide-react';
import { api } from '../services/api.js';
import { useLanguage } from '../context/LanguageContext.js';

interface RecommendationsPageProps {
  projects: Project[];
  userRole: UserRole | 'PUBLIC';
  onOpenRecommend: () => void;
  onSelectProject: (project: Project) => void;
  onRefresh: () => void;
  onBackToDashboard?: () => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  projects,
  userRole,
  onOpenRecommend,
  onSelectProject,
  onRefresh,
  onBackToDashboard
}) => {
  const { language, t, translateCategory } = useLanguage();
  const [sanctionModalProject, setSanctionModalProject] = useState<Project | null>(null);
  const [sanctionAmountLakh, setSanctionAmountLakh] = useState('');
  const [sanctionRemarks, setSanctionRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sanctionError, setSanctionError] = useState<string | null>(null);

  // Recommendations include projects with status 'Recommended', 'Under Review', or recently sanctioned
  const recommendations = projects.filter(
    p => p.status === 'Recommended' || p.status === 'Under Review' || p.timeline[0]?.completed
  );

  const handleSanctionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanctionModalProject) return;
    setSubmitting(true);
    setSanctionError(null);
    try {
      const amountNumber = Math.round(parseFloat(sanctionAmountLakh) * 100000);
      await api.updateProjectStatus(
        sanctionModalProject.id,
        'Sanctioned',
        amountNumber,
        sanctionRemarks
      );
      setSanctionModalProject(null);
      onRefresh();
    } catch (err: any) {
      console.error(err);
      setSanctionError(err?.message || (language === 'hi' ? 'परियोजना स्वीकृत करने में विफलता।' : 'Failed to sanction project. Please verify permissions.'));
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
            {t.home} &gt; {t.recommendations}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {language === 'hi' ? 'सांसद अनुशंसाएं एवं प्रशासनिक स्वीकृतियां' : 'MP Recommendations & Administrative Sanctions'}
          </h1>
          <p className="text-xs text-gray-500">
            {language === 'hi'
              ? 'संसद सदस्य द्वारा कार्य प्रस्ताव प्रस्तुत करने से लेकर ज़िला प्राधिकरण द्वारा तकनीकी स्वीकृति तक का जीवनचक्र'
              : 'Work proposal lifecycle from Member of Parliament submission to District Authority technical sanction'}
          </p>
        </div>

        {(userRole === 'MP' || userRole === 'ADMIN') && (
          <button
            onClick={onOpenRecommend}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-govt-navy text-white rounded-md text-xs font-semibold hover:bg-govt-navy-light shadow-2xs cursor-pointer"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>{language === 'hi' ? 'नई अनुशंसा प्रस्तुत करें' : 'Submit New Recommendation'}</span>
          </button>
        )}
      </div>

      {/* Recommendations Cards */}
      <div className="space-y-3">
        {recommendations.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-slate-border text-slate-muted text-xs">
            {language === 'hi' ? 'वर्तमान में कोई सक्रिय अनुशंसा दर्ज नहीं है।' : 'No active recommendations currently logged.'}
          </div>
        ) : (
          recommendations.map(project => {
            const isPendingSanction = project.status === 'Recommended' || project.status === 'Under Review';
            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-slate-border p-5 shadow-2xs hover:border-govt-navy-light/40 transition-all text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-body">{project.projectCode}</span>
                    <StatusBadge status={project.status} />
                    <RiskBadge level={project.riskAnalysis.riskLevel} score={project.riskAnalysis.overallScore} />
                  </div>

                  <h3
                    onClick={() => onSelectProject(project)}
                    className="text-sm font-bold text-slate-body hover:text-govt-navy cursor-pointer"
                  >
                    {project.title}
                  </h3>

                  <div className="text-[11px] text-slate-muted space-x-2">
                    <span>{language === 'hi' ? 'सांसद:' : 'MP:'} <strong>{project.mpName}</strong></span>
                    <span>•</span>
                    <span>{t.district}: {project.district}</span>
                    <span>•</span>
                    <span>{t.category}: {translateCategory(project.category)}</span>
                  </div>

                  <p className="text-[11px] text-slate-muted line-clamp-1">{project.description}</p>
                </div>

                <div className="flex md:flex-col items-end justify-between w-full md:w-auto gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-border/50">
                  <div className="text-left md:text-right font-mono">
                    <div className="text-[10px] text-slate-muted uppercase">
                      {language === 'hi' ? 'अनुमानित प्रस्ताव' : 'Estimated Proposal'}
                    </div>
                    <div className="text-base font-bold text-slate-body">
                      ₹{(project.estimatedCost / 100000).toFixed(2)} {language === 'hi' ? 'लाख' : 'Lakh'}
                    </div>
                    {project.sanctionedAmount > 0 && (
                      <div className="text-[10px] text-status-verified font-semibold">
                        {language === 'hi' ? 'स्वीकृत:' : 'Sanctioned:'} ₹{(project.sanctionedAmount / 100000).toFixed(2)}{language === 'hi' ? 'लाख' : 'L'}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectProject(project)}
                      className="px-3 py-1.5 border border-slate-border rounded text-xs font-medium text-slate-body hover:bg-panel-bg cursor-pointer"
                    >
                      {language === 'hi' ? 'ऑडिट विवरण' : 'Audit Details'}
                    </button>

                    {userRole === 'ADMIN' && isPendingSanction && (
                      <button
                        onClick={() => {
                          setSanctionModalProject(project);
                          setSanctionAmountLakh((project.estimatedCost / 100000).toFixed(2));
                        }}
                        className="px-3 py-1.5 bg-govt-navy hover:bg-govt-navy-light text-white rounded text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        {language === 'hi' ? 'कार्य स्वीकृत करें' : 'Sanction Work'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* District Collector Sanction Modal */}
      {sanctionModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-body">
              {language === 'hi' ? 'ज़िला प्राधिकरण औपचारिक कार्य स्वीकृति' : 'District Authority Formal Work Sanction'}
            </h3>
            <div className="p-3 bg-panel-bg rounded border border-slate-border">
              <div className="font-mono text-[11px] text-slate-muted">{sanctionModalProject.projectCode}</div>
              <div className="font-bold text-slate-body mt-0.5">{sanctionModalProject.title}</div>
            </div>

            <form onSubmit={handleSanctionSubmit} className="space-y-3">
              {sanctionError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-status-flagged font-medium">
                  {sanctionError}
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-body mb-1">
                  {language === 'hi' ? 'स्वीकृत प्रशासनिक आवंटन (₹ लाख में) *' : 'Sanctioned Administrative Allocation (₹ in Lakh) *'}
                </label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={sanctionAmountLakh}
                  onChange={e => setSanctionAmountLakh(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-border rounded-md font-mono font-bold text-slate-body"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-body mb-1">
                  {language === 'hi' ? 'प्रशासनिक स्वीकृति आदेश टिप्पणी' : 'Administrative Sanction Order Remarks'}
                </label>
                <textarea
                  rows={2}
                  value={sanctionRemarks}
                  onChange={e => setSanctionRemarks(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. डीटीईसी द्वारा व्यवहार्यता सत्यापित। MoSPI दिशानिर्देशों के तहत प्रशासनिक स्वीकृति प्रदान की गई।' : 'e.g., Feasibility verified by DTEC. Administrative sanction granted in accordance with Para 3.2 of MoSPI Guidelines.'}
                  className="w-full px-3 py-2 border border-slate-border rounded-md text-slate-body"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSanctionModalProject(null)}
                  className="px-4 py-2 border border-slate-border rounded text-slate-body font-medium cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-govt-navy text-white rounded font-semibold hover:bg-govt-navy-light disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? (language === 'hi' ? 'स्वीकृति जारी...' : 'Sanctioning...')
                    : (language === 'hi' ? 'तकनीकी स्वीकृति प्रदान करें' : 'Grant Technical Sanction')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
