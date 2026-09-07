import React, { useState } from 'react';
import { RiskAlert, Project } from '../types/index.js';
import { AlertBadge, RiskBadge } from '../components/Badges.js';
import { ShieldAlert, Send } from 'lucide-react';
import { api } from '../services/api.js';

interface AlertManagementPageProps {
  alerts: RiskAlert[];
  projects: Project[];
  onOpenAlertAction: (alert: RiskAlert) => void;
  onSelectProject: (project: Project) => void;
}

export const AlertManagementPage: React.FC<AlertManagementPageProps> = ({
  alerts,
  projects,
  onOpenAlertAction,
  onSelectProject
}) => {
  const [testingNotif, setTestingNotif] = useState(false);
  const [notifMessage, setNotifMessage] = useState<string | null>(null);

  const handleTestDispatch = async () => {
    setTestingNotif(true);
    try {
      const res = await api.dispatchTestNotification();
      setNotifMessage(`Dispatched ${res.logs?.length || 0} notifications to MPs and District Authorities via Email & SMS.`);
    } catch (e: any) {
      setNotifMessage(`Notification note: ${e.message}`);
    } finally {
      setTestingNotif(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1B3022] tracking-tight">
            AI Alert Management & Multi-Channel Vigilance Desk
          </h1>
          <p className="text-xs text-[#588157]">
            District & Ministry review desk with automated Email/SMS transactional dispatch for high-risk flags
          </p>
        </div>
        <button
          onClick={handleTestDispatch}
          disabled={testingNotif}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#395C40] hover:bg-[#2C4A34] text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{testingNotif ? 'Dispatching...' : 'Test Multi-Channel Dispatch'}</span>
        </button>
      </div>

      {notifMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold">
          {notifMessage}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#DDE5D4] shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8F9F7] text-[#588157] font-bold uppercase text-[10px] border-b border-[#DDE5D4]">
            <tr>
              <th className="p-3">Alert Ref</th>
              <th className="p-3">Type & Level</th>
              <th className="p-3">Project Title</th>
              <th className="p-3">Observed Discrepancy</th>
              <th className="p-3">Notifications</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F2ED]">
            {alerts.map(alert => {
              const project = projects.find(p => p.id === alert.projectId);
              return (
                <tr key={alert.id} className="hover:bg-[#F8F9F7]">
                  <td className="p-3 font-mono font-bold text-[#588157]">{alert.id}</td>
                  <td className="p-3">
                    <div className="font-semibold text-[#1B3022]">{alert.alertType}</div>
                    <RiskBadge level={alert.riskLevel} />
                  </td>
                  <td className="p-3 max-w-xs">
                    <div onClick={() => project && onSelectProject(project)} className="font-bold text-[#1B3022] hover:text-[#395C40] cursor-pointer line-clamp-1">
                      {alert.projectTitle}
                    </div>
                    <span className="font-mono text-[10px] text-gray-500">{alert.projectCode} • {alert.district}</span>
                  </td>
                  <td className="p-3 max-w-sm text-[#1B3022] line-clamp-2">{alert.reason}</td>
                  <td className="p-3 whitespace-nowrap">
                    {alert.notificationDispatched ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        Email & SMS Sent
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">In Queue</span>
                    )}
                  </td>
                  <td className="p-3"><AlertBadge status={alert.status} /></td>
                  <td className="p-3 text-right">
                    <button onClick={() => onOpenAlertAction(alert)} className="px-3 py-1.5 bg-[#395C40] text-white rounded-lg font-bold hover:bg-[#2C4A34] cursor-pointer">
                      Investigate
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
