import React from 'react';
import { Project, UserRole } from '../types/index.js';
import { IndianRupee, TrendingUp, Landmark, Wallet, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

interface FundsLedgerPageProps {
  projects: Project[];
  userRole: UserRole | 'PUBLIC';
  onBackToDashboard?: () => void;
}

export const FundsLedgerPage: React.FC<FundsLedgerPageProps> = ({ projects, onBackToDashboard }) => {
  const { language, t, translateCategory } = useLanguage();

  // Annual statutory entitlement under MPLADS is ₹5.00 Crore
  const annualEntitlementINR = 50000000;

  const totalSanctionedINR = projects.reduce((acc, p) => acc + (p.sanctionedAmount || 0), 0);
  const totalUtilizedINR = projects.reduce((acc, p) => acc + (p.fundsUtilized || 0), 0);
  const uncommittedINR = Math.max(0, annualEntitlementINR - totalSanctionedINR);

  const sanctionedCr = (totalSanctionedINR / 10000000).toFixed(2);
  const utilizedCr = (totalUtilizedINR / 10000000).toFixed(2);
  const uncommittedCr = (uncommittedINR / 10000000).toFixed(2);
  const utilizationPct = totalSanctionedINR > 0 ? Math.round((totalUtilizedINR / totalSanctionedINR) * 100) : 0;

  // Flatten all payments
  const allPayments = projects
    .flatMap(p =>
      p.payments.map(pay => ({
        ...pay,
        projectCode: p.projectCode,
        projectTitle: p.title,
        district: p.district
      }))
    )
    .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

  // Category breakdown
  const categoryMap = new Map<string, { sanctioned: number; utilized: number }>();
  projects.forEach(p => {
    const prev = categoryMap.get(p.category) || { sanctioned: 0, utilized: 0 };
    categoryMap.set(p.category, {
      sanctioned: prev.sanctioned + (p.sanctionedAmount || 0),
      utilized: prev.utilized + (p.fundsUtilized || 0)
    });
  });

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
            {t.home} &gt; {t.funds}
          </span>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-slate-body tracking-tight">
          {language === 'hi' ? 'सांसद निधि वित्तीय खाता एवं संवितरण' : 'MPLADS Financial Ledger & Fund Disbursals'}
        </h1>
        <p className="text-xs text-slate-muted">
          {language === 'hi'
            ? 'MoSPI दिशानिर्देशों के तहत प्रति वित्तीय वर्ष ₹5.00 करोड़ की वैधानिक वार्षिक पात्रता ट्रैकिंग'
            : 'Statutory annual entitlement tracking (₹5.00 Crore per fiscal year) under MoSPI Guidelines'}
        </p>
      </div>

      {/* Fund KPI Summary Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-muted uppercase tracking-wider">
            <span>{language === 'hi' ? 'वार्षिक पात्रता' : 'Annual Entitlement'}</span>
            <Landmark className="w-4 h-4 text-govt-navy" />
          </div>
          <div className="text-2xl font-bold text-slate-body mt-2">
            ₹5.00 <span className="text-xs text-slate-muted font-normal">{language === 'hi' ? 'करोड़' : 'Cr'}</span>
          </div>
          <div className="text-[11px] text-slate-muted mt-1">{language === 'hi' ? 'प्रति संसदीय निर्वाचन क्षेत्र' : 'Per Parliamentary Constituency'}</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-muted uppercase tracking-wider">
            <span>{language === 'hi' ? 'स्वीकृत कार्य' : 'Sanctioned Works'}</span>
            <Wallet className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold text-amber-800 mt-2">
            ₹{sanctionedCr} <span className="text-xs text-slate-muted font-normal">{language === 'hi' ? 'करोड़' : 'Cr'}</span>
          </div>
          <div className="text-[11px] text-slate-muted mt-1">
            {Math.round((totalSanctionedINR / annualEntitlementINR) * 100)}% {language === 'hi' ? 'वार्षिक सीमा का आवंटित' : 'of annual cap allocated'}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-muted uppercase tracking-wider">
            <span>{language === 'hi' ? 'संवितरित एवं उपयोगित' : 'Disbursed & Utilized'}</span>
            <TrendingUp className="w-4 h-4 text-status-verified" />
          </div>
          <div className="text-2xl font-bold text-status-verified mt-2">
            ₹{utilizedCr} <span className="text-xs text-slate-muted font-normal">{language === 'hi' ? 'करोड़' : 'Cr'}</span>
          </div>
          <div className="text-[11px] text-slate-muted mt-1">
            {language === 'hi' ? 'भौतिक निष्पादन उपभोग:' : 'Physical execution drawdown:'} {utilizationPct}%
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-border shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-muted uppercase tracking-wider">
            <span>{language === 'hi' ? 'अप्रतिबद्ध शेष' : 'Uncommitted Balance'}</span>
            <IndianRupee className="w-4 h-4 text-govt-navy" />
          </div>
          <div className="text-2xl font-bold text-slate-body mt-2">
            ₹{uncommittedCr} <span className="text-xs text-slate-muted font-normal">{language === 'hi' ? 'करोड़' : 'Cr'}</span>
          </div>
          <div className="text-[11px] text-slate-muted mt-1">{language === 'hi' ? 'नई अनुशंसाओं हेतु उपलब्ध' : 'Available for fresh recommendations'}</div>
        </div>
      </div>

      {/* Category Expenditure Grid */}
      <div className="bg-white rounded-2xl border border-slate-border p-5 shadow-xs">
        <h2 className="text-xs font-bold text-slate-body uppercase tracking-wider mb-4">
          {language === 'hi' ? 'विकास श्रेणीवार व्यय आवंटन' : 'Developmental Category Expenditure Allocation'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(categoryMap.entries()).map(([cat, f]) => {
            const catSanctionedLakh = (f.sanctioned / 100000).toFixed(1);
            const catUtilizedLakh = (f.utilized / 100000).toFixed(1);
            const pct = f.sanctioned > 0 ? Math.round((f.utilized / f.sanctioned) * 100) : 0;

            return (
              <div key={cat} className="p-3.5 bg-panel-bg rounded-xl border border-slate-border text-xs space-y-2">
                <div className="font-bold text-slate-body truncate">{translateCategory(cat)}</div>
                <div className="flex justify-between text-slate-muted font-mono text-[11px]">
                  <span>{language === 'hi' ? 'स्वीकृत:' : 'Sanctioned:'} ₹{catSanctionedLakh}{language === 'hi' ? 'लाख' : 'L'}</span>
                  <span>{language === 'hi' ? 'उपयोग:' : 'Utilized:'} ₹{catUtilizedLakh}{language === 'hi' ? 'लाख' : 'L'}</span>
                </div>
                <div className="w-full bg-slate-border h-2 rounded-full overflow-hidden">
                  <div className="bg-govt-navy h-full rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[10px] text-slate-muted text-right font-medium">
                  {pct}% {language === 'hi' ? 'व्यय' : 'spent'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disbursed Payment Vouchers Table */}
      <div className="bg-white rounded-2xl border border-slate-border shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-panel-bg border-b border-slate-border flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-body uppercase tracking-wider">
            {language === 'hi' ? 'प्रमाणित मील का पत्थर भुगतान खाता' : 'Certified Milestone Payments Ledger'}
          </h2>
          <span className="text-xs font-mono text-slate-muted">
            {allPayments.length} {language === 'hi' ? 'संवितरण' : 'Disbursals'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-panel-bg text-slate-muted font-bold uppercase text-[10px] border-b border-slate-border tracking-wider">
              <tr>
                <th className="p-3">{language === 'hi' ? 'स्वीकृति आदेश सं.' : 'Sanction Order Ref'}</th>
                <th className="p-3">{language === 'hi' ? 'परियोजना शीर्षक' : 'Project Title'}</th>
                <th className="p-3">{t.district}</th>
                <th className="p-3">{language === 'hi' ? 'लाभार्थी एजेंसी' : 'Beneficiary Agency'}</th>
                <th className="p-3 text-right">{language === 'hi' ? 'राशि (रुपये)' : 'Amount (INR)'}</th>
                <th className="p-3">{language === 'hi' ? 'संवितरण तिथि' : 'Disbursed Date'}</th>
                <th className="p-3">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-border">
              {allPayments.map(pay => (
                <tr key={pay.id} className="hover:bg-panel-bg">
                  <td className="p-3 font-mono font-bold text-slate-muted">{pay.sanctionOrderNo}</td>
                  <td className="p-3 max-w-xs">
                    <div className="font-bold text-slate-body truncate">{pay.projectTitle}</div>
                    <div className="text-[10px] text-slate-muted font-mono">{pay.projectCode}</div>
                  </td>
                  <td className="p-3 text-slate-body">{pay.district}</td>
                  <td className="p-3 text-slate-body">{pay.beneficiaryAgency}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-body">
                    ₹{(pay.amount / 100000).toFixed(2)} {language === 'hi' ? 'लाख' : 'Lakh'}
                  </td>
                  <td className="p-3 font-mono text-slate-muted">{pay.paidAt}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-status-verified border border-status-verified/30">
                      {pay.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
