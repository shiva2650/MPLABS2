import React, { useState } from 'react';
import { Project, RiskAlert, UserRole } from '../types/index.js';
import { Download, Printer, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

interface ReportsPageProps {
  projects: Project[];
  alerts: RiskAlert[];
  userRole: UserRole | 'PUBLIC';
  onBackToDashboard?: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ projects, onBackToDashboard }) => {
  const { language, t, translateCategory, translateStatus, translateRiskLevel } = useLanguage();
  const [reportType, setReportType] = useState<'master' | 'risk' | 'financial' | 'agency'>('master');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = 'MPLADS_Report.csv';

    if (reportType === 'master') {
      filename = `MPLADS_Master_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Code', 'Title', 'Category', 'District', 'MP', 'Estimated (INR)', 'Sanctioned (INR)', 'Utilized (INR)', 'Progress %', 'Status', 'Risk Score', 'Vendor'];
      rows = projects.map(p => [
        p.projectCode,
        `"${p.title.replace(/"/g, '""')}"`,
        p.category,
        p.district,
        `"${p.mpName}"`,
        p.estimatedCost,
        p.sanctionedAmount,
        p.fundsUtilized,
        p.completionPercentage,
        p.status,
        p.riskAnalysis.overallScore,
        `"${p.vendorName}"`
      ]);
    } else if (reportType === 'risk') {
      filename = `MPLADS_AI_Vigilance_Anomalies_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Project Code', 'Title', 'District', 'Risk Score', 'Risk Level', 'Cost Score', 'Duplicate Score', 'Delay Probability %', 'Key Observations'];
      rows = projects.filter(p => p.riskAnalysis.overallScore > 40).map(p => [
        p.projectCode,
        `"${p.title.replace(/"/g, '""')}"`,
        p.district,
        p.riskAnalysis.overallScore,
        p.riskAnalysis.riskLevel,
        p.riskAnalysis.costAnomalyScore,
        p.riskAnalysis.duplicateProbability,
        p.riskAnalysis.delayProbability,
        `"${p.riskAnalysis.reasons.join('; ').replace(/"/g, '""')}"`
      ]);
    } else if (reportType === 'financial') {
      filename = `MPLADS_Financial_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Project Code', 'Title', 'Sanctioned (INR)', 'Utilized (INR)', 'Balance (INR)', 'Utilization %', 'Status'];
      rows = projects.map(p => [
        p.projectCode,
        `"${p.title.replace(/"/g, '""')}"`,
        p.sanctionedAmount,
        p.fundsUtilized,
        p.sanctionedAmount - p.fundsUtilized,
        p.sanctionedAmount > 0 ? Math.round((p.fundsUtilized / p.sanctionedAmount) * 100) : 0,
        p.status
      ]);
    } else {
      filename = `MPLADS_Agency_Delivery_Scorecard_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Agency Name', 'Project Code', 'Title', 'Vendor', 'Completion %', 'Status', 'Expected Date'];
      rows = projects.map(p => [
        `"${p.implementingAgencyName}"`,
        p.projectCode,
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.vendorName}"`,
        p.completionPercentage,
        p.status,
        p.expectedCompletionDate || 'Pending'
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
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
            {t.home} &gt; {t.reports}
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-body tracking-tight">
            {language === 'hi' ? 'आधिकारिक ऑडिट रिपोर्ट एवं डेटा निर्यात केंद्र' : 'Official Audit Reports & Data Export Center'}
          </h1>
          <p className="text-xs text-slate-muted">
            {language === 'hi'
              ? 'मानकीकृत MoSPI अनुपालन दस्तावेज़, CAG ऑडिट सारणियां एवं सतर्कता विवरण'
              : 'Standardized MoSPI compliance documentation, CAG audit tables, and vigilance briefs'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-border rounded-lg text-xs font-bold text-slate-body hover:bg-panel-bg shadow-xs cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-muted" />
            <span>{language === 'hi' ? 'आधिकारिक विवरण प्रिंट करें' : 'Print Official Brief'}</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-govt-navy hover:bg-govt-navy-light text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{language === 'hi' ? 'सीएसवी डेटा निर्यात करें' : 'Export CSV Dataset'}</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex border-b border-slate-border gap-4 text-xs font-bold">
        <button
          onClick={() => setReportType('master')}
          className={`pb-3 px-2 border-b-2 transition-colors cursor-pointer ${
            reportType === 'master' ? 'border-govt-navy text-govt-navy' : 'border-transparent text-slate-muted hover:text-slate-body'
          }`}
        >
          {language === 'hi' ? '1. मास्टर कार्य ऑडिट रजिस्टर' : '1. Master Works Audit Register'}
        </button>

        <button
          onClick={() => setReportType('risk')}
          className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            reportType === 'risk' ? 'border-govt-navy text-govt-navy' : 'border-transparent text-slate-muted hover:text-slate-body'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          <span>{language === 'hi' ? '2. एआई सतर्कता एवं जोखिम रजिस्टर' : '2. AI Vigilance & Risk Register'}</span>
        </button>

        <button
          onClick={() => setReportType('financial')}
          className={`pb-3 px-2 border-b-2 transition-colors cursor-pointer ${
            reportType === 'financial' ? 'border-govt-navy text-govt-navy' : 'border-transparent text-slate-muted hover:text-slate-body'
          }`}
        >
          {language === 'hi' ? '3. कोषागार संवितरण खाता' : '3. Treasury Disbursals Ledger'}
        </button>

        <button
          onClick={() => setReportType('agency')}
          className={`pb-3 px-2 border-b-2 transition-colors cursor-pointer ${
            reportType === 'agency' ? 'border-govt-navy text-govt-navy' : 'border-transparent text-slate-muted hover:text-slate-body'
          }`}
        >
          {language === 'hi' ? '4. कार्यान्वयन एजेंसी प्रदर्शन' : '4. Implementing Agency Performance'}
        </button>
      </div>

      {/* Official Government Audit Print Preview */}
      <div className="bg-white rounded-2xl border border-slate-border p-8 shadow-xs space-y-6 print:m-0 print:border-none print:shadow-none">
        {/* Official Header */}
        <div className="text-center border-b border-slate-border pb-4 space-y-1">
          <div className="text-xs font-bold text-slate-muted uppercase tracking-widest">
            {t.govIndia}
          </div>
          <div className="text-base font-bold text-slate-body uppercase">
            {t.mospiTitle}
          </div>
          <div className="text-xs text-govt-navy font-serif">
            {language === 'hi'
              ? 'संसद सदस्य स्थानीय क्षेत्र विकास योजना (सांसद निधि) — आधिकारिक निगरानी विवरण'
              : 'Member of Parliament Local Area Development Scheme (MPLADS) — Official Monitoring Statement'}
          </div>
          <div className="text-[11px] text-slate-muted font-mono mt-2">
            {language === 'hi' ? 'तैयार किया गया:' : 'Generated:'}{' '}
            {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}{' '}
            | {language === 'hi' ? 'अधिकार क्षेत्र: हैदराबाद एवं सिकंदराबाद, तेलंगाना' : 'Jurisdiction: Hyderabad & Secunderabad, Telangana'}
          </div>
        </div>

        {/* Report Content Table */}
        <div className="overflow-x-auto text-xs">
          {reportType === 'master' && (
            <table className="w-full text-left border-collapse border border-slate-border">
              <thead className="bg-panel-bg text-slate-muted font-bold uppercase text-[10px] tracking-wider border-b border-slate-border">
                <tr>
                  <th className="p-2 border border-slate-border">{language === 'hi' ? 'संदर्भ कोड' : 'Ref Code'}</th>
                  <th className="p-2 border border-slate-border">{language === 'hi' ? 'परियोजना शीर्षक' : 'Project Title'}</th>
                  <th className="p-2 border border-slate-border">{t.category}</th>
                  <th className="p-2 border border-slate-border text-right">{language === 'hi' ? 'लागत (लाख)' : 'Cost (Lakh)'}</th>
                  <th className="p-2 border border-slate-border text-right">{language === 'hi' ? 'उपयोग' : 'Utilized'}</th>
                  <th className="p-2 border border-slate-border">{t.status}</th>
                  <th className="p-2 border border-slate-border">{language === 'hi' ? 'एआई जोखिम' : 'AI Risk'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {projects.map(p => (
                  <tr key={p.id} className="hover:bg-panel-bg transition-colors">
                    <td className="p-2 border border-slate-border font-mono font-bold text-slate-muted">{p.projectCode}</td>
                    <td className="p-2 border border-slate-border font-bold text-slate-body">{p.title}</td>
                    <td className="p-2 border border-slate-border text-slate-body">{translateCategory(p.category)}</td>
                    <td className="p-2 border border-slate-border text-right font-mono font-bold text-slate-body">
                      ₹{((p.sanctionedAmount || p.estimatedCost) / 100000).toFixed(1)}{language === 'hi' ? 'लाख' : 'L'}
                    </td>
                    <td className="p-2 border border-slate-border text-right font-mono font-bold text-status-verified">
                      ₹{(p.fundsUtilized / 100000).toFixed(1)}{language === 'hi' ? 'लाख' : 'L'}
                    </td>
                    <td className="p-2 border border-slate-border text-slate-body">{translateStatus(p.status)}</td>
                    <td className="p-2 border border-slate-border font-mono font-bold text-amber-700">
                      {translateRiskLevel(p.riskAnalysis.riskLevel)} ({p.riskAnalysis.overallScore})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'risk' && (
            <table className="w-full text-left border-collapse border border-slate-border">
              <thead className="bg-amber-50 text-amber-900 font-bold uppercase text-[10px] tracking-wider border-b border-amber-200">
                <tr>
                  <th className="p-2 border border-amber-200">{language === 'hi' ? 'संदर्भ कोड' : 'Ref Code'}</th>
                  <th className="p-2 border border-amber-200">{language === 'hi' ? 'परियोजना शीर्षक' : 'Project Title'}</th>
                  <th className="p-2 border border-amber-200 text-center">{language === 'hi' ? 'स्कोर' : 'Score'}</th>
                  <th className="p-2 border border-amber-200 text-center">{language === 'hi' ? 'जोखिम स्तर' : 'Level'}</th>
                  <th className="p-2 border border-amber-200">{language === 'hi' ? 'चिह्नित विसंगति औचित्य' : 'Observed Anomaly Justification'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {projects.filter(p => p.riskAnalysis.overallScore > 30).map(p => (
                  <tr key={p.id} className="hover:bg-panel-bg transition-colors">
                    <td className="p-2 border border-slate-border font-mono font-bold text-slate-muted">{p.projectCode}</td>
                    <td className="p-2 border border-slate-border font-bold text-slate-body">{p.title}</td>
                    <td className="p-2 border border-slate-border font-mono text-center font-bold text-amber-700">
                      {p.riskAnalysis.overallScore}
                    </td>
                    <td className="p-2 border border-slate-border text-center font-bold text-red-600">
                      {translateRiskLevel(p.riskAnalysis.riskLevel)}
                    </td>
                    <td className="p-2 border border-slate-border text-slate-body">
                      {p.riskAnalysis.reasons.join('. ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'financial' && (
            <table className="w-full text-left border-collapse border border-slate-border">
              <thead className="bg-panel-bg text-slate-muted font-bold uppercase text-[10px] tracking-wider border-b border-slate-border">
                <tr>
                  <th className="p-2 border border-slate-border">{language === 'hi' ? 'संदर्भ कोड' : 'Ref Code'}</th>
                  <th className="p-2 border border-slate-border">{language === 'hi' ? 'परियोजना शीर्षक' : 'Project Title'}</th>
                  <th className="p-2 border border-slate-border text-right">{language === 'hi' ? 'स्वीकृत' : 'Sanctioned'}</th>
                  <th className="p-2 border border-slate-border text-right">{language === 'hi' ? 'उपयोग' : 'Utilized'}</th>
                  <th className="p-2 border border-slate-border text-right">{language === 'hi' ? 'शेष' : 'Balance'}</th>
                  <th className="p-2 border border-slate-border text-center">{language === 'hi' ? 'उपभोग %' : 'Drawdown %'}</th>
                  <th className="p-2 border border-slate-border">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {projects.map(p => {
                  const bal = (p.sanctionedAmount || 0) - (p.fundsUtilized || 0);
                  const utilPct = p.sanctionedAmount > 0 ? Math.round((p.fundsUtilized / p.sanctionedAmount) * 100) : 0;
                  return (
                    <tr key={p.id} className="hover:bg-panel-bg transition-colors">
                      <td className="p-2 border border-slate-border font-mono font-bold text-slate-muted">{p.projectCode}</td>
                      <td className="p-2 border border-slate-border font-bold text-slate-body">{p.title}</td>
                      <td className="p-2 border border-slate-border text-right font-mono font-bold text-slate-body">
                        ₹{((p.sanctionedAmount || 0) / 100000).toFixed(1)}{language === 'hi' ? 'लाख' : 'L'}
                      </td>
                      <td className="p-2 border border-slate-border text-right font-mono font-bold text-status-verified">
                        ₹{((p.fundsUtilized || 0) / 100000).toFixed(1)}{language === 'hi' ? 'लाख' : 'L'}
                      </td>
                      <td className="p-2 border border-slate-border text-right font-mono font-bold text-amber-700">
                        ₹{(bal / 100000).toFixed(1)}{language === 'hi' ? 'लाख' : 'L'}
                      </td>
                      <td className="p-2 border border-slate-border text-center font-mono font-bold text-slate-body">
                        {utilPct}%
                      </td>
                      <td className="p-2 border border-slate-border text-slate-body">{translateStatus(p.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'agency' && (
            <table className="w-full text-left border-collapse border border-slate-border">
              <thead className="bg-panel-bg text-slate-muted font-bold uppercase text-[10px] tracking-wider border-b border-slate-border">
                <tr>
                  <th className="p-2 border border-slate-border">{language === 'hi' ? 'एजेंसी का नाम' : 'Agency Name'}</th>
                  <th className="p-2 border border-slate-border">{language === 'hi' ? 'परियोजना कोड' : 'Project Code'}</th>
                  <th className="p-2 border border-slate-border">{language === 'hi' ? 'शीर्षक' : 'Title'}</th>
                  <th className="p-2 border border-slate-border">{language === 'hi' ? 'ठेकेदार' : 'Vendor'}</th>
                  <th className="p-2 border border-slate-border text-center">{language === 'hi' ? 'प्रगति %' : 'Progress %'}</th>
                  <th className="p-2 border border-slate-border">{language === 'hi' ? 'लक्षित तिथि' : 'Target Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border">
                {projects.map(p => (
                  <tr key={p.id} className="hover:bg-panel-bg transition-colors">
                    <td className="p-2 border border-slate-border font-bold text-slate-body">{p.implementingAgencyName}</td>
                    <td className="p-2 border border-slate-border font-mono font-bold text-slate-muted">{p.projectCode}</td>
                    <td className="p-2 border border-slate-border text-slate-body">{p.title}</td>
                    <td className="p-2 border border-slate-border text-slate-muted">
                      {p.vendorName || (language === 'hi' ? 'निर्धारित नहीं' : 'Not Assigned')}
                    </td>
                    <td className="p-2 border border-slate-border text-center font-mono font-bold text-govt-navy">
                      {p.completionPercentage}%
                    </td>
                    <td className="p-2 border border-slate-border font-mono text-slate-muted">
                      {p.expectedCompletionDate || (language === 'hi' ? 'प्रतीक्षित' : 'Pending')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Verification Footnote */}
        <div className="pt-8 flex justify-between items-end text-[11px] text-slate-muted border-t border-slate-border">
          <div>
            <div className="font-bold text-slate-body">
              {language === 'hi' ? 'प्रणाली जनित सत्यनिष्ठा विवरण' : 'System Generated Integrity Brief'}
            </div>
            <div>
              {language === 'hi'
                ? 'राष्ट्रीय सूचना विज्ञान केंद्र (NIC) डेटा प्रोटोकॉल के तहत डिजिटल रूप से प्रमाणित।'
                : 'Digitally certified under National Informatics Centre (NIC) data protocol.'}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-body">
              {language === 'hi' ? 'ज़िला कलेक्टर / अधिकृत मजिस्ट्रेट' : 'District Collector / Authorized Magistrate'}
            </div>
            <div>{language === 'hi' ? 'ज़िला प्राधिकरण, हैदराबाद, तेलंगाना' : 'District Authority, Hyderabad, Telangana'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
