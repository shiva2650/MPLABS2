import React, { useState } from 'react';
import { X, Calendar, User, Building, ShieldCheck, AlertCircle } from 'lucide-react';
import { Project } from '../types/index.ts';
import { scheduleInspection } from '../services/api.ts';

interface ScheduleInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onInspectionScheduled: () => void;
}

export const ScheduleInspectionModal: React.FC<ScheduleInspectionModalProps> = ({
  isOpen,
  onClose,
  project,
  onInspectionScheduled
}) => {
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [inspectingOfficer, setInspectingOfficer] = useState('');
  const [officerDesignation, setOfficerDesignation] = useState('Assistant Executive Engineer (PWD)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await scheduleInspection({
        projectId: project.id,
        scheduledDate,
        inspectingOfficer: inspectingOfficer.trim() || 'Designated Quality Inspector',
        officerDesignation
      });
      onInspectionScheduled();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule inspection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-gray-300 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-blue-950 text-white p-4 flex items-start justify-between border-b-2 border-amber-500">
          <div>
            <div className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded uppercase w-fit mb-1">
              Quality Assurance
            </div>
            <h3 className="text-base font-extrabold text-white">Schedule Field Site Inspection</h3>
            <p className="text-xs text-blue-200 mt-0.5">
              Work ID: {project.workId} • {project.district}, {project.state}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-gray-700 mb-1 uppercase text-[10px]">
              Scheduled Inspection Date *
            </label>
            <input
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs bg-gray-50 focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1 uppercase text-[10px]">
              Inspecting Officer Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Er. Rajiv Ranjan"
              value={inspectingOfficer}
              onChange={(e) => setInspectingOfficer(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs bg-gray-50 focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1 uppercase text-[10px]">
              Designation & Department *
            </label>
            <select
              value={officerDesignation}
              onChange={(e) => setOfficerDesignation(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-xs bg-gray-50 focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
            >
              <option value="Assistant Executive Engineer (PWD)">Assistant Executive Engineer (PWD)</option>
              <option value="Superintending Engineer (DRDA)">Superintending Engineer (DRDA)</option>
              <option value="District Quality Monitor (MoSPI)">District Quality Monitor (MoSPI)</option>
              <option value="Block Development Officer (BDO)">Block Development Officer (BDO)</option>
              <option value="National Quality Monitor (NQM)">National Quality Monitor (NQM)</option>
            </select>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded text-[11px] text-amber-900">
            <strong>Mandatory Protocol:</strong> Per Section 6.1 of MPLADS Guidelines, site inspection must verify
            physical asset coordinates against DPR, measure MB physical stage, and capture GPS-verified photographs.
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded text-xs disabled:opacity-50 shadow-2xs"
            >
              {loading ? 'Scheduling...' : 'Issue Inspection Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
