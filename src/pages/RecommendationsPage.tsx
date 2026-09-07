import React, { useState } from 'react';
import { Project, UserRole } from '../types/index.js';
import { StatusBadge, RiskBadge } from '../components/Badges.js';
import { FilePlus2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';

interface RecommendationsPageProps {
  projects: Project[];
  userRole: UserRole | 'PUBLIC';
  onOpenRecommend: () => void;
  onSelectProject: (project: Project) => void;
  onRefresh: () => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  projects,
  userRole,
  onOpenRecommend,
  onSelectProject,
  onRefresh
}) => {
  const recommendations = projects.filter(
    p => p.status === 'Recommended' || p.status === 'Under Review' || p.status === 'Feasibility Review' || p.status === 'Forwarded To State'
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1B3022] tracking-tight">
            MP Recommendations & Multi-Authority Sanctions
          </h1>
          <p className="text-xs text-[#588157]">
            Work proposals progressing through MP recommendation, District Scrutiny, and State/Ministry approvals
          </p>
        </div>
        {(userRole === 'MP' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
          <button
            onClick={onOpenRecommend}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#395C40] text-white rounded-lg text-xs font-bold hover:bg-[#2C4A34] cursor-pointer shadow-xs"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>Submit New Recommendation</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {recommendations.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-[#DDE5D4] text-[#588157] text-xs">
            No proposals currently in recommendation queue.
          </div>
        ) : (
          recommendations.map(project => (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-[#DDE5D4] p-5 shadow-xs hover:border-[#395C40] transition-all text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#588157]">{project.projectCode}</span>
                  <StatusBadge status={project.status} />
                  <RiskBadge level={project.riskAnalysis?.riskLevel || 'LOW'} score={project.riskAnalysis?.overallScore || 20} />
                </div>
                <h3 onClick={() => onSelectProject(project)} className="text-sm font-bold text-[#1B3022] hover:text-[#395C40] cursor-pointer">
                  {project.title}
                </h3>
                <div className="text-[11px] text-[#588157]">
                  MP: {project.mpName} • District: {project.district} • Category: {project.category}
                </div>
              </div>
              <div className="flex md:flex-col items-end gap-2 shrink-0">
                <div className="text-right font-mono font-bold text-sm text-[#1B3022]">
                  ₹{((project.sanctionedAmount || project.estimatedCost) / 100000).toFixed(2)}L
                </div>
                <button onClick={() => onSelectProject(project)} className="px-3 py-1.5 bg-[#EAF0E6] text-[#2D4A32] rounded-lg font-bold border border-[#C8D5B9] hover:bg-[#DDE5D4] cursor-pointer">
                  Audit Proposal
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
