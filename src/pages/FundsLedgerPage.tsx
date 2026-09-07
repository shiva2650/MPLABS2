import React from 'react';
import { Project, UserRole } from '../types/index.js';
import { IndianRupee, TrendingUp, Landmark, Wallet } from 'lucide-react';

export const FundsLedgerPage: React.FC<{ projects: Project[]; userRole: UserRole | 'PUBLIC' }> = ({ projects }) => {
  const totalSanctionedINR = projects.reduce((acc, p) => acc + (p.sanctionedAmount || p.estimatedCost || 0), 0);
  const totalUtilizedINR = projects.reduce((acc, p) => acc + (p.fundsUtilized || 0), 0);
  const sanctionedCr = (totalSanctionedINR / 10000000).toFixed(2);
  const utilizedCr = (totalUtilizedINR / 10000000).toFixed(2);
  const uncommittedCr = Math.max(0, 5.0 - parseFloat(sanctionedCr)).toFixed(2);

  const allPayments = projects.flatMap(p =>
    p.payments.map(pay => ({
      ...pay,
      projectCode: p.projectCode,
      projectTitle: p.title,
      district: p.district
    }))
  ).sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1B3022] tracking-tight">MPLADS Financial Ledger & Disbursals</h1>
        <p className="text-xs text-[#588157]">Statutory annual entitlement tracking (₹5.00 Crore per constituency)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white rounded-xl p-4 border border-[#DDE5D4] shadow-xs">
          <span className="font-bold text-[#588157] uppercase">Entitlement</span>
          <div className="text-2xl font-bold text-[#1B3022] mt-1">₹5.00 Cr</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#DDE5D4] shadow-xs">
          <span className="font-bold text-[#935D26] uppercase">Sanctioned</span>
          <div className="text-2xl font-bold text-[#935D26] mt-1">₹{sanctionedCr} Cr</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#DDE5D4] shadow-xs">
          <span className="font-bold text-[#395C40] uppercase">Disbursed</span>
          <div className="text-2xl font-bold text-[#395C40] mt-1">₹{utilizedCr} Cr</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#DDE5D4] shadow-xs">
          <span className="font-bold text-[#1B3022] uppercase">Balance</span>
          <div className="text-2xl font-bold text-[#1B3022] mt-1">₹{uncommittedCr} Cr</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#DDE5D4] shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-[#FDFDFB] border-b border-[#DDE5D4] font-bold text-xs text-[#1B3022]">
          Certified Milestone Disbursements ({allPayments.length} Transactions)
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8F9F7] text-[#588157] font-bold text-[10px] uppercase border-b border-[#DDE5D4]">
            <tr>
              <th className="p-3">Order Ref</th>
              <th className="p-3">Project Title</th>
              <th className="p-3">Agency</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2ED]">
            {allPayments.map(pay => (
              <tr key={pay.id} className="hover:bg-[#F8F9F7]">
                <td className="p-3 font-mono font-bold text-[#588157]">{pay.sanctionOrderNo}</td>
                <td className="p-3 font-bold text-[#1B3022]">{pay.projectTitle}</td>
                <td className="p-3">{pay.beneficiaryAgency}</td>
                <td className="p-3 text-right font-mono font-bold">₹{(pay.amount / 100000).toFixed(2)}L</td>
                <td className="p-3 font-mono text-[#588157]">{pay.paidAt}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF0E6] text-[#395C40]">{pay.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
