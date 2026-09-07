import React, { useState } from 'react';
import { Project, RiskAlert, UserRole } from '../types/index.js';
import { Download, Printer } from 'lucide-react';

export const ReportsPage: React.FC<{
  projects: Project[];
  alerts: RiskAlert[];
  userRole: UserRole | 'PUBLIC';
}> = ({ projects }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1B3022] tracking-tight">Official Audit Reports & Export Center</h1>
          <p className="text-xs text-[#588157]">Compliance tables generated for MoSPI and Comptroller and Auditor General (CAG)</p>
        </div>
        <button onClick={() => window.print()} className="px-3.5 py-2 bg-white border border-[#DDE5D4] rounded-lg text-xs font-bold text-[#1B3022] hover:bg-[#F8F9F7] cursor-pointer">
          Print Brief
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#DDE5D4] p-6 shadow-xs overflow-x-auto text-xs">
        <table className="w-full text-left">
          <thead className="bg-[#F8F9F7] text-[#588157] font-bold text-[10px] uppercase border-b border-[#DDE5D4]">
            <tr>
              <th className="p-2.5">Code</th>
              <th className="p-2.5">Title</th>
              <th className="p-2.5">District</th>
              <th className="p-2.5 text-right">Cost (Lakh)</th>
              <th className="p-2.5 text-right">Utilized</th>
              <th className="p-2.5">Status</th>
              <th className="p-2.5 text-center">Risk Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2ED]">
            {projects.map(p => (
              <tr key={p.id} className="hover:bg-[#F8F9F7]">
                <td className="p-2.5 font-mono text-[#588157]">{p.projectCode}</td>
                <td className="p-2.5 font-bold text-[#1B3022]">{p.title}</td>
                <td className="p-2.5">{p.district}</td>
                <td className="p-2.5 text-right font-mono">₹{(((p.sanctionedAmount || p.estimatedCost) || 0) / 100000).toFixed(1)}L</td>
                <td className="p-2.5 text-right font-mono text-[#395C40]">₹{((p.fundsUtilized || 0) / 100000).toFixed(1)}L</td>
                <td className="p-2.5">{p.status}</td>
                <td className="p-2.5 text-center font-bold">{p.riskAnalysis?.overallScore || 20}/100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
