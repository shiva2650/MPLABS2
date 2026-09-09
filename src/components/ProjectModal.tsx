import React, { useState } from 'react';
import { Project, DuplicateProjectCandidate, UserRole } from '../types/index.js';
import { RiskBadge, StatusBadge } from './Badges.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  X,
  Calendar,
  IndianRupee,
  FileText,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Download,
  AlertOctagon,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { api } from '../services/api.js';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onRefresh?: () => void;
  userRole: UserRole | 'PUBLIC';
  duplicateCandidates?: DuplicateProjectCandidate[];
  initialTab?: 'overview' | 'ai-risk' | 'photos' | 'financials' | 'documents' | 'audit-report';
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  onClose,
  userRole,
  duplicateCandidates = [],
  initialTab = 'overview'
}) => {
  const { language, t, translateCategory, translateStatus, translateRiskLevel } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-risk' | 'photos' | 'financials' | 'documents' | 'audit-report'>(initialTab);
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState(false);
  const [aiReportContent, setAiReportContent] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, project?.id]);

  if (!project) return null;

  const handleGenerateReport = async () => {
    setIsGeneratingAiReport(true);
    setActiveTab('audit-report');
    try {
      const res = await api.generateAiAuditReport(project.id);
      setAiReportContent(res.report);
    } catch (err) {
      console.error(err);
      setAiReportContent(language === 'hi' ? 'स्वचालित एआई ऑडिट रिपोर्ट तैयार करने में विफलता। कृपया पुन: प्रयास करें।' : 'Failed to generate automated AI audit report. Please try again.');
    } finally {
      setIsGeneratingAiReport(false);
    }
  };

  const isPublic = userRole === 'PUBLIC';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-govt-navy-dark/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-border overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-govt-navy text-white flex items-center justify-between border-b border-govt-navy-dark">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-govt-navy-light text-white border border-white/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-panel-bg/80 font-bold">{project.projectCode}</span>
                <StatusBadge status={project.status} />
                <RiskBadge level={project.riskAnalysis.riskLevel} score={project.riskAnalysis.overallScore} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5 line-clamp-1">{project.title}</h2>
            </div>
          </div>

          <button
            id="close-project-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-panel-bg/80 hover:text-white hover:bg-govt-navy-light transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-border bg-panel-bg px-6 overflow-x-auto gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-govt-navy text-govt-navy bg-white rounded-t-lg'
                : 'border-transparent text-slate-muted hover:text-govt-navy'
            }`}
          >
            {language === 'hi' ? 'परियोजना अवलोकन एवं समयरेखा' : 'Project Overview & Timeline'}
          </button>

          <button
            onClick={() => setActiveTab('ai-risk')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai-risk'
                ? 'border-govt-navy text-govt-navy bg-white rounded-t-lg'
                : 'border-transparent text-slate-muted hover:text-govt-navy'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-govt-saffron" />
            {language === 'hi' ? 'एआई जोखिम एवं विसंगति' : 'AI Risk & Anomaly Assessment'}
            {project.riskAnalysis.overallScore > 60 && (
              <span className="w-2 h-2 rounded-full bg-status-flagged" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'photos'
                ? 'border-govt-navy text-govt-navy bg-white rounded-t-lg'
                : 'border-transparent text-slate-muted hover:text-govt-navy'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-slate-muted" />
            {language === 'hi' ? `साइट तस्वीरें (${project.photos.length})` : `Site Photos (${project.photos.length})`}
          </button>

          <button
            onClick={() => setActiveTab('financials')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'financials'
                ? 'border-govt-navy text-govt-navy bg-white rounded-t-lg'
                : 'border-transparent text-slate-muted hover:text-govt-navy'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5 text-slate-muted" />
            {language === 'hi' ? 'निधि एवं भुगतान' : 'Funds & Payments'}
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'documents'
                ? 'border-govt-navy text-govt-navy bg-white rounded-t-lg'
                : 'border-transparent text-slate-muted hover:text-govt-navy'
            }`}
          >
            {language === 'hi' ? `दस्तावेज (${project.documents.length})` : `Official Documents (${project.documents.length})`}
          </button>

          {!isPublic && (
            <button
              onClick={() => {
                setActiveTab('audit-report');
                if (!aiReportContent) handleGenerateReport();
              }}
              className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'audit-report'
                  ? 'border-govt-navy text-govt-navy bg-white rounded-t-lg'
                  : 'border-transparent text-slate-muted hover:text-govt-navy'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-govt-navy" />
              {language === 'hi' ? 'एआई तकनीकी ऑडिट रिपोर्ट' : 'AI Technical Audit Brief'}
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Essential Parameters Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 bg-white rounded-xl border border-slate-border shadow-xs">
                  <div className="text-[11px] font-bold text-slate-muted uppercase tracking-wider">
                    {language === 'hi' ? 'स्वीकृत लागत' : 'Sanctioned Cost'}
                  </div>
                  <div className="text-lg font-bold text-slate-body mt-1">
                    ₹{(project.sanctionedAmount / 100000).toFixed(2)} {language === 'hi' ? 'लाख' : 'Lakh'}
                  </div>
                  <div className="text-xs text-slate-muted">
                    {language === 'hi' ? 'अनुमानित:' : 'Estimated:'} ₹{(project.estimatedCost / 100000).toFixed(2)}{language === 'hi' ? 'लाख' : 'L'}
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-border shadow-xs">
                  <div className="text-[11px] font-bold text-slate-muted uppercase tracking-wider">
                    {language === 'hi' ? 'उपयोग की गई निधि' : 'Funds Utilized'}
                  </div>
                  <div className="text-lg font-bold text-status-verified mt-1">
                    ₹{(project.fundsUtilized / 100000).toFixed(2)} {language === 'hi' ? 'लाख' : 'Lakh'}
                  </div>
                  <div className="text-xs text-slate-muted">
                    {project.sanctionedAmount > 0
                      ? `${Math.round((project.fundsUtilized / project.sanctionedAmount) * 100)}% ${language === 'hi' ? 'स्वीकृत का' : 'of sanction'}`
                      : (language === 'hi' ? 'स्वीकृति प्रतीक्षित' : 'Pending sanction')}
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-border shadow-xs">
                  <div className="text-[11px] font-bold text-slate-muted uppercase tracking-wider">
                    {language === 'hi' ? 'भौतिक प्रगति' : 'Physical Progress'}
                  </div>
                  <div className="text-lg font-bold text-slate-body mt-1 flex items-center gap-2">
                    <span>{project.completionPercentage}%</span>
                    <div className="flex-1 bg-slate-border h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-status-verified rounded-full"
                        style={{ width: `${project.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-slate-muted">{translateStatus(project.status)}</div>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-border shadow-xs">
                  <div className="text-[11px] font-bold text-slate-muted uppercase tracking-wider">
                    {language === 'hi' ? 'एआई सत्यनिष्ठा सूचकांक' : 'AI Integrity Index'}
                  </div>
                  <div className="mt-1">
                    <RiskBadge level={project.riskAnalysis.riskLevel} score={project.riskAnalysis.overallScore} />
                  </div>
                  <div className="text-[11px] text-slate-muted mt-1 font-medium">
                    {project.riskAnalysis.reasons.length} {language === 'hi' ? 'सक्रिय ध्वज' : 'active flag(s)'}
                  </div>
                </div>
              </div>

              {/* Administrative Details Table */}
              <div className="bg-white rounded-xl border border-slate-border shadow-xs overflow-hidden">
                <div className="px-4 py-2.5 bg-panel-bg text-xs font-bold text-govt-navy uppercase tracking-wider border-b border-slate-border">
                  {language === 'hi' ? 'हितधारक एवं क्षेत्रीय अधिकार क्षेत्र' : 'Project Stakeholders & Territorial Jurisdiction'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-border text-xs">
                  <div className="p-4 space-y-2.5">
                    <div>
                      <span className="text-slate-muted">{language === 'hi' ? 'संसद सदस्य:' : 'Member of Parliament:'}</span>
                      <div className="font-bold text-slate-body">{project.mpName}</div>
                    </div>
                    <div>
                      <span className="text-slate-muted">{t.constituency}:</span>
                      <div className="font-bold text-slate-body">{project.constituency}</div>
                    </div>
                    <div>
                      <span className="text-slate-muted">{language === 'hi' ? 'ज़िला एवं राज्य:' : 'District & State:'}</span>
                      <div className="font-bold text-slate-body">{project.district}, {project.state}</div>
                    </div>
                    <div>
                      <span className="text-slate-muted">{t.category}:</span>
                      <div className="font-bold text-slate-body">{translateCategory(project.category)}</div>
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5">
                    <div>
                      <span className="text-slate-muted">{language === 'hi' ? 'कार्यान्वयन एजेंसी:' : 'Implementing Agency:'}</span>
                      <div className="font-bold text-slate-body">{project.implementingAgencyName}</div>
                    </div>
                    <div>
                      <span className="text-slate-muted">{language === 'hi' ? 'कार्यकारी ठेकेदार:' : 'Executing Vendor / Contractor:'}</span>
                      <div className="font-bold text-slate-body">{project.vendorName}</div>
                      {!isPublic && (
                        <span className="font-mono text-[10px] text-slate-muted">PAN: {project.vendorPanMasked}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-muted">{language === 'hi' ? 'स्वीकृत साइट निर्देशांक:' : 'Sanctioned Site Coordinates:'}</span>
                      <div className="font-mono font-bold text-slate-body">
                        {project.latitude ? `${project.latitude.toFixed(4)}° N, ${project.longitude ? project.longitude.toFixed(4) : '78.4982'}° E` : (language === 'hi' ? 'जियोटैगिंग प्रतीक्षित' : 'Coordinates Pending Geotagging')}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-muted">{language === 'hi' ? 'साइट का पता:' : 'Physical Location Address:'}</span>
                      <div className="font-medium text-slate-body">{project.locationAddress}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 bg-white rounded-xl border border-slate-border shadow-xs">
                <div className="text-xs font-bold text-govt-navy uppercase tracking-wider mb-1">
                  {language === 'hi' ? 'विकास कार्य का विवरण' : 'Scope of Developmental Work'}
                </div>
                <p className="text-xs text-slate-body leading-relaxed">{project.description}</p>
              </div>

              {/* Lifecycle Milestones Timeline */}
              <div className="bg-white rounded-xl border border-slate-border p-4 shadow-xs">
                <div className="text-xs font-bold text-govt-navy uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>{language === 'hi' ? 'सांसद निधि जीवनचक्र प्रगति ट्रैकर' : 'MPLADS Lifecycle Progress Tracker'}</span>
                  <span className="text-[11px] font-normal text-slate-muted">
                    {language === 'hi' ? 'MoSPI दिशा-निर्देशों के अनुसार अनिवार्य चरण' : 'Stages mandated under MoSPI Guidelines'}
                  </span>
                </div>

                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  {project.timeline.map((step, idx) => (
                    <div key={idx} className="flex md:flex-col items-center gap-3 md:gap-1.5 flex-1 text-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          step.completed
                            ? 'bg-govt-navy text-white'
                            : 'bg-panel-bg text-slate-muted border border-slate-border'
                        }`}
                      >
                        {step.completed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div className="text-left md:text-center">
                        <div className="text-xs font-bold text-slate-body">{step.stage}</div>
                        {step.date && <div className="text-[10px] text-slate-muted font-mono">{step.date}</div>}
                        {step.remarks && (
                          <div className="text-[10px] text-slate-muted italic max-w-[140px] truncate" title={step.remarks}>
                            {step.remarks}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI RISK & ANOMALIES */}
          {activeTab === 'ai-risk' && (
            <div className="space-y-6">
              {/* Advisory Disclaimer */}
              <div className="p-3.5 bg-panel-bg border border-status-review/40 rounded-xl text-xs text-status-review flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-status-review shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">{language === 'hi' ? 'मानवीय समीक्षा अनिवार्य सूचना:' : 'Human Review Advisory Mandate:'}</div>
                  <div className="mt-0.5 text-slate-body leading-relaxed">{project.riskAnalysis.disclaimer}</div>
                </div>
              </div>

              {/* Risk Score Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-border shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-muted uppercase tracking-wider">
                      {language === 'hi' ? 'लागत विसंगति सूचकांक' : 'Cost Anomaly Index'}
                    </span>
                    {project.riskAnalysis.costBaseline && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-panel-bg text-status-review font-bold border border-status-review/40">
                        Z-Score: {project.riskAnalysis.costBaseline.zScore > 0 ? `+${project.riskAnalysis.costBaseline.zScore}σ` : `${project.riskAnalysis.costBaseline.zScore}σ`}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-slate-body mt-1">
                    {project.riskAnalysis.costAnomalyScore}
                    <span className="text-xs text-slate-muted font-normal"> / 100</span>
                  </div>
                  
                  {project.riskAnalysis.costBaseline ? (
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="text-[11px] text-slate-muted">
                        Cohort Baseline: <strong>₹{(project.riskAnalysis.costBaseline.cohortMean / 100000).toFixed(2)}L</strong> (±₹{(project.riskAnalysis.costBaseline.cohortStdDev / 100000).toFixed(2)}L)
                      </div>
                      <div className={`text-[11px] p-2 rounded-lg font-medium ${project.riskAnalysis.costBaseline.isAnomaly ? 'bg-panel-bg text-status-flagged border border-status-flagged/30' : 'bg-panel-bg text-status-verified border border-status-verified/30'}`}>
                        {project.riskAnalysis.costBaseline.reason}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-muted">
                      Category benchmark: ₹18 - 25 Lakh.
                      {project.sanctionedAmount > 2500000 && (
                        <span className="text-status-flagged font-bold block mt-1">
                          Proposed cost exceeds standard benchmark by +
                          {Math.round(((project.sanctionedAmount - 2000000) / 2000000) * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-border shadow-xs">
                  <div className="text-xs font-bold text-slate-muted uppercase tracking-wider">
                    {language === 'hi' ? 'डुप्लिकेट संभावना' : 'Duplicate Probability'}
                  </div>
                  <div className="text-2xl font-bold text-slate-body mt-1">
                    {project.riskAnalysis.duplicateProbability}%
                  </div>
                  <div className="mt-2 text-xs text-slate-muted">
                    {duplicateCandidates.length > 0
                      ? (language === 'hi' ? `1 किमी के भीतर ${duplicateCandidates.length} स्थानिक रूप से समीपस्थ परियोजनाएं चिह्नित।` : `${duplicateCandidates.length} spatially proximate project(s) identified within 1 km.`)
                      : (language === 'hi' ? 'डेटाबेस में कोई स्थानिक या शाब्दिक डुप्लिकेट नहीं पाया गया।' : 'No spatial or semantic duplicate detected in database.')}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-border shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-muted uppercase tracking-wider">
                      {language === 'hi' ? 'विलंब पूर्वानुमान' : 'Delay Forecast'}
                    </span>
                    {project.riskAnalysis.delayMetrics && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-panel-bg text-status-review font-bold border border-status-review/40">
                        {project.riskAnalysis.delayMetrics.confidenceIntervalString}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-slate-body mt-1">
                    {project.riskAnalysis.delayProbability}%
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-muted">
                    {project.riskAnalysis.delayProbability > 60 ? (
                      <span className="text-status-flagged font-bold block">
                        {language === 'hi' ? 'समयसीमा पार होने का उच्च जोखिम' : 'High risk of schedule overrun'}
                      </span>
                    ) : (
                      <span className="text-status-verified font-bold block">
                        {language === 'hi' ? 'प्रगति लक्षित समयसीमा के अनुरूप' : 'Trajectory conforms to scheduled target'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Observed AI Findings & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-panel-bg rounded-xl border border-status-review/40 p-4">
                  <div className="text-xs font-bold text-status-review uppercase mb-2 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-status-review" />
                    {language === 'hi' ? 'चिह्नित विसंगति संकेतक' : 'Observed Anomaly Indicators'}
                  </div>
                  <ul className="space-y-2 text-xs text-slate-body list-disc list-inside">
                    {project.riskAnalysis.reasons.map((r, i) => (
                      <li key={i} className="leading-relaxed">{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-panel-bg rounded-xl border border-slate-border p-4">
                  <div className="text-xs font-bold text-govt-navy uppercase mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-status-verified" />
                    {language === 'hi' ? 'अनुशंसित प्रशासनिक प्रोटोकॉल' : 'Recommended Administrative Protocol'}
                  </div>
                  <ul className="space-y-2 text-xs text-slate-body list-disc list-inside">
                    {project.riskAnalysis.recommendations.map((rec, i) => (
                      <li key={i} className="leading-relaxed">{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SITE PHOTOS */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-govt-navy uppercase tracking-wider">
                    {language === 'hi' ? 'जियोटैग्ड प्रगति तस्वीरें' : 'Geotagged Progress Photographs'}
                  </h3>
                  <p className="text-[11px] text-slate-muted">
                    {language === 'hi'
                      ? 'सांसद निधि दिशानिर्देशों के तहत कार्य से पहले, कार्य के दौरान और कार्य पूर्णता की अनिवार्य तस्वीरें'
                      : 'Mandated Before, During, and After photographic verification under MPLADS framework'}
                  </p>
                </div>
              </div>

              {project.photos.length === 0 ? (
                <div className="text-center py-12 bg-panel-bg rounded-xl border border-dashed border-slate-border">
                  <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-body">
                    {language === 'hi' ? 'अभी कोई तस्वीर अपलोड नहीं की गई' : 'No Photographs Uploaded Yet'}
                  </div>
                  <div className="text-[11px] text-slate-muted mt-1">
                    {language === 'hi' ? 'कार्यान्वयन एजेंसी को प्रत्येक चरण पर जियोटैग की गई तस्वीरें प्रस्तुत करनी होंगी।' : 'The implementing agency must submit geotagged photos at each milestone stage.'}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="bg-white rounded-xl border border-slate-border overflow-hidden shadow-xs flex flex-col"
                    >
                      <div className="relative aspect-video bg-panel-bg overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-govt-navy/90 text-white backdrop-blur-xs">
                          {photo.stage} {language === 'hi' ? 'चरण' : 'Stage'}
                        </div>

                        {photo.similarityAlert && (
                          <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded text-[10px] font-bold bg-red-600 text-white flex items-center gap-1 shadow-md">
                            <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                            <span>{language === 'hi' ? 'संभावित तस्वीर पुनःउपयोग चिह्नित' : 'Potential Image Reuse Flagged'}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="text-xs font-bold text-slate-body line-clamp-1">{photo.caption}</div>
                          <div className="text-[10px] text-slate-muted mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{language === 'hi' ? 'अपलोड:' : 'Uploaded:'} {photo.uploadedAt}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-border text-[11px] space-y-1.5">
                          {photo.latitude && photo.longitude ? (
                            <div className="flex items-center justify-between font-mono text-slate-muted">
                              <div className="flex items-center gap-1">
                                <Compass className="w-3 h-3 text-govt-navy" />
                                <span>{photo.latitude.toFixed(4)}°, {photo.longitude.toFixed(4)}°</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-slate-muted italic">{language === 'hi' ? 'कोई जीपीएस डेटा नहीं' : 'No GPS coordinates'}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FINANCIALS */}
          {activeTab === 'financials' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-border shadow-xs">
                  <div className="text-[11px] font-bold text-slate-muted uppercase tracking-wider">
                    {language === 'hi' ? 'स्वीकृत आवंटन' : 'Sanctioned Allocation'}
                  </div>
                  <div className="text-xl font-bold text-slate-body mt-1">₹{(project.sanctionedAmount / 100000).toFixed(2)} {language === 'hi' ? 'लाख' : 'Lakh'}</div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-border shadow-xs">
                  <div className="text-[11px] font-bold text-slate-muted uppercase tracking-wider">
                    {language === 'hi' ? 'संवितरित / जारी राशि' : 'Released / Disbursed'}
                  </div>
                  <div className="text-xl font-bold text-status-verified mt-1">₹{(project.fundsUtilized / 100000).toFixed(2)} {language === 'hi' ? 'लाख' : 'Lakh'}</div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-border shadow-xs">
                  <div className="text-[11px] font-bold text-slate-muted uppercase tracking-wider">
                    {language === 'hi' ? 'कोषागार में शेष' : 'Balance in Treasury'}
                  </div>
                  <div className="text-xl font-bold text-slate-body mt-1">
                    ₹{((project.sanctionedAmount - project.fundsUtilized) / 100000).toFixed(2)} {language === 'hi' ? 'लाख' : 'Lakh'}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-border overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-panel-bg text-xs font-bold text-govt-navy uppercase tracking-wider border-b border-slate-border">
                  {language === 'hi' ? 'भुगतान वाउचर एवं किस्त संवितरण' : 'Payment Vouchers & Tranche Disbursals'}
                </div>
                {project.payments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-muted">
                    {language === 'hi' ? 'अभी कोई भुगतान किस्त जारी नहीं की गई है।' : 'No payment tranches released yet.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-panel-bg text-slate-muted font-bold border-b border-slate-border">
                        <tr>
                          <th className="p-3">{language === 'hi' ? 'किस्त सं.' : 'Inst. #'}</th>
                          <th className="p-3">{language === 'hi' ? 'स्वीकृति आदेश' : 'Sanction Order'}</th>
                          <th className="p-3">{language === 'hi' ? 'राशि' : 'Amount'}</th>
                          <th className="p-3">{language === 'hi' ? 'लाभार्थी' : 'Beneficiary'}</th>
                          <th className="p-3">{language === 'hi' ? 'भुगतान तिथि' : 'Disbursed Date'}</th>
                          <th className="p-3">{t.status}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {project.payments.map((pay) => (
                          <tr key={pay.id} className="hover:bg-panel-bg transition-colors">
                            <td className="p-3 font-bold text-slate-body">{language === 'hi' ? `किस्त #${pay.installmentNo}` : `Installment #${pay.installmentNo}`}</td>
                            <td className="p-3 font-mono text-slate-muted">{pay.sanctionOrderNo}</td>
                            <td className="p-3 font-bold text-slate-body">₹{(pay.amount / 100000).toFixed(2)} {language === 'hi' ? 'लाख' : 'Lakh'}</td>
                            <td className="p-3 text-slate-body">{pay.beneficiaryAgency}</td>
                            <td className="p-3 font-mono text-slate-muted">{pay.paidAt}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-panel-bg text-status-verified border border-status-verified/30">
                                {pay.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-govt-navy uppercase tracking-wider">
                {language === 'hi' ? 'सत्यापित प्रशासनिक भंडार' : 'Verified Administrative Repository'}
              </div>
              <div className="space-y-2">
                {project.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-white rounded-xl border border-slate-border flex items-center justify-between hover:bg-panel-bg transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-panel-bg border border-slate-border text-govt-navy">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-body">{doc.name}</div>
                        <div className="text-[10px] text-slate-muted">
                          {doc.type} | {doc.fileSize} | {language === 'hi' ? 'अपलोड:' : 'Uploaded:'} {doc.uploadedAt}
                        </div>
                      </div>
                    </div>

                    <a
                      href={doc.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-govt-navy bg-panel-bg border border-slate-border hover:bg-white transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? 'डाउनलोड' : 'Download'}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: AI AUDIT BRIEF */}
          {activeTab === 'audit-report' && !isPublic && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-border">
                <div>
                  <div className="text-xs font-bold text-govt-navy uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-govt-saffron" />
                    {language === 'hi' ? 'स्वचालित प्रशासनिक ऑडिट विवरण (जेमिनी तकनीकी ऑडिट)' : 'Automated Administrative Audit Brief (Gemini Technical Audit)'}
                  </div>
                  <div className="text-[11px] text-slate-muted">
                    {language === 'hi'
                      ? 'व्यापक विसंगति संश्लेषण, वित्तीय औचित्य ऑडिट एवं प्रशासनिक निर्देश।'
                      : 'Comprehensive anomaly synthesis, fiscal reasonableness audit, and administrative directives.'}
                  </div>
                </div>

                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingAiReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-govt-navy hover:bg-govt-navy-light disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-govt-saffron" />
                  <span>{isGeneratingAiReport ? (language === 'hi' ? 'विश्लेषण जारी...' : 'Analyzing Project...') : (language === 'hi' ? 'पुनः विवरण तैयार करें' : 'Re-Generate Brief')}</span>
                </button>
              </div>

              {isGeneratingAiReport ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-govt-navy border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="text-xs font-bold text-slate-body">
                    {language === 'hi' ? 'तकनीकी ऑडिट मूल्यांकन तैयार किया जा रहा है...' : 'Generating Technical Audit Evaluation...'}
                  </div>
                </div>
              ) : aiReportContent ? (
                <div className="p-6 bg-white border border-slate-border rounded-xl font-mono text-xs leading-relaxed text-slate-body whitespace-pre-wrap shadow-xs">
                  {aiReportContent}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-panel-bg border-t border-slate-border flex items-center justify-between text-xs text-slate-muted">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-body">{language === 'hi' ? 'परियोजना यूआईडी:' : 'Project UID:'}</span>
            <span className="font-mono text-slate-muted">{project.id}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white border border-slate-border text-slate-body font-bold hover:bg-panel-bg transition-colors cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
