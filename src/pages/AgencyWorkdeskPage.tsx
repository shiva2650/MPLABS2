import React, { useState } from 'react';
import { Project, UserRole } from '../types/index.js';
import { StatusBadge, RiskBadge } from '../components/Badges.js';
import { HardHat, Camera, IndianRupee } from 'lucide-react';
import { AgencyUpdateModal } from '../components/AgencyUpdateModal.js';
import { api } from '../services/api.js';

export const AgencyWorkdeskPage: React.FC<{
  projects: Project[];
  userRole: UserRole | 'PUBLIC';
  onSelectProject: (project: Project) => void;
  onRefresh: () => void;
}> = ({ projects, userRole, onSelectProject, onRefresh }) => {
  const [selectedForUpdate, setSelectedForUpdate] = useState<Project | null>(null);

  const agencyProjects = projects.filter(
    p => p.status === 'Assigned' || p.status === 'Ongoing' || p.status === 'Delayed' || p.status === 'Completed'
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#1B3022] tracking-tight">Implementing Agency Field Workdesk</h1>
        <p className="text-xs text-[#588157]">Update site execution, upload camera-tagged photographs, and track bills</p>
      </div>

      <div className="space-y-3">
        {agencyProjects.map(project => (
          <div key={project.id} className="bg-white rounded-xl border border-[#DDE5D4] p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#588157]">{project.projectCode}</span>
                <StatusBadge status={project.status} />
                <RiskBadge level={project.riskAnalysis?.riskLevel || 'LOW'} score={project.riskAnalysis?.overallScore || 20} />
              </div>
              <h3 onClick={() => onSelectProject(project)} className="text-sm font-bold text-[#1B3022] hover:text-[#395C40] cursor-pointer truncate">
                {project.title}
              </h3>
              <div className="text-[11px] text-gray-500">
                Vendor: {project.vendorName} • Progress: {project.completionPercentage}% • Funds: ₹{((project.fundsUtilized || 0) / 100000).toFixed(1)}L
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setSelectedForUpdate(project)} className="px-3.5 py-2 bg-[#395C40] hover:bg-[#2C4A34] text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer">
                <Camera className="w-3.5 h-3.5" />
                <span>Update Progress & Geotag</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <AgencyUpdateModal
        project={selectedForUpdate}
        isOpen={!!selectedForUpdate}
        onClose={() => setSelectedForUpdate(null)}
        onSuccess={() => { setSelectedForUpdate(null); onRefresh(); }}
      />
    </div>
  );
};
