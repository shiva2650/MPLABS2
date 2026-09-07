import React, { useState } from 'react';
import { CitizenFeedback, Project, UserRole } from '../types/index.js';
import { MessageSquareWarning, Calendar, ShieldCheck } from 'lucide-react';
import { CitizenFeedbackModal } from '../components/CitizenFeedbackModal.js';
import { api } from '../services/api.js';

export const CitizenFeedbackPage: React.FC<{
  feedbackList: CitizenFeedback[];
  projects: Project[];
  userRole: UserRole | 'PUBLIC';
  onRefresh: () => void;
  onSelectProject: (p: Project) => void;
}> = ({ feedbackList, projects, userRole, onRefresh, onSelectProject }) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1B3022] tracking-tight">Citizen Grievance Redressal & Feedback</h1>
          <p className="text-xs text-[#588157]">Durable feedback pipeline triaged to District, State, and Ministry queues</p>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#395C40] hover:bg-[#2C4A34] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
        >
          <MessageSquareWarning className="w-4 h-4" />
          <span>Register Citizen Grievance</span>
        </button>
      </div>

      <div className="space-y-3">
        {feedbackList.map(item => {
          const project = projects.find(p => p.id === item.projectId || p.projectCode === item.projectCode);
          return (
            <div key={item.id} className="bg-white rounded-xl border border-[#DDE5D4] p-5 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-[#F0F2ED] pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#395C40]">{item.trackingNumber || item.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF3E0] text-[#935D26]">{item.issueType}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF0E6] text-[#2D4A32]">{item.routedQueue || 'DISTRICT_QUEUE'}</span>
                </div>
                <span className="text-[11px] text-gray-400">{new Date(item.submittedAt).toLocaleDateString('en-IN')}</span>
              </div>
              <div onClick={() => project && onSelectProject(project)} className="font-bold text-[#1B3022] cursor-pointer hover:underline">
                {item.projectTitle} ({item.district})
              </div>
              <p className="text-gray-700 leading-relaxed bg-[#F8F9F7] p-2.5 rounded-lg border border-[#DDE5D4]">{item.description}</p>
              <div className="text-[11px] text-[#588157]">
                Citizen: {item.citizenName || 'Public Whistleblower'} • Priority: <strong>{item.priorityLevel || 'NORMAL'}</strong> (SLA: {item.slaDeadlineDays || 15}d)
              </div>
            </div>
          );
        })}
      </div>

      <CitizenFeedbackModal
        projects={projects}
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={() => { setShowSubmitModal(false); onRefresh(); }}
      />
    </div>
  );
};
