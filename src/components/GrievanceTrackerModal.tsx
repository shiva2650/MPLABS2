import React, { useState } from 'react';
import {
  Search,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  User,
  Building,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { CitizenFeedback, GrievanceWorkflowStatus } from '../types/index.ts';
import { trackGrievance } from '../services/api.ts';

interface GrievanceTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGrievanceId?: string;
  onSelectProject?: (workId: string) => void;
}

const STAGES: GrievanceWorkflowStatus[] = [
  'Submitted',
  'Under Review',
  'Assigned',
  'Investigation',
  'Action Taken',
  'Resolved'
];

export const GrievanceTrackerModal: React.FC<GrievanceTrackerModalProps> = ({
  isOpen,
  onClose,
  initialGrievanceId = '',
  onSelectProject
}) => {
  const [searchId, setSearchId] = useState(initialGrievanceId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    grievance: CitizenFeedback;
    project?: {
      workId: string;
      title: string;
      category: string;
      status: string;
      state: string;
      district: string;
      mpName: string;
    };
  } | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const idToSearch = searchId.trim();
    if (!idToSearch) return;

    setLoading(true);
    setError(null);
    try {
      const data = await trackGrievance(idToSearch);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'No record found with that tracking ID.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getStageIndex = (status: string) => {
    if (status === 'Dismissed') return -1;
    const idx = STAGES.findIndex((s) => s.toLowerCase() === status.toLowerCase());
    return idx >= 0 ? idx : 1;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl border border-gray-300 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-blue-950 text-white p-4 flex items-start justify-between border-b-2 border-amber-500">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded uppercase">
                Citizen Portal
              </span>
              <span className="text-xs text-blue-200">Public Vigilance & Redressal Tracking</span>
            </div>
            <h3 className="text-base font-extrabold text-white">Track Grievance / Observation Status</h3>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Grievance ID (e.g., MPLADS-GRV-2024-884920)"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-900 focus:border-blue-900 bg-gray-50 uppercase font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchId.trim()}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded disabled:opacity-50 transition-colors shrink-0 shadow-2xs"
            >
              {loading ? 'Searching...' : 'Track Status'}
            </button>
          </form>

          {/* Quick Sample IDs */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-200">
            <span className="font-semibold text-gray-700">Sample Tracking IDs:</span>
            <button
              type="button"
              onClick={() => {
                setSearchId('MPLADS-GRV-2024-884920');
              }}
              className="font-mono text-blue-900 hover:underline bg-white px-1.5 py-0.5 rounded border border-gray-300 text-[10px]"
            >
              MPLADS-GRV-2024-884920
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchId('MPLADS-GRV-2024-192847');
              }}
              className="font-mono text-blue-900 hover:underline bg-white px-1.5 py-0.5 rounded border border-gray-300 text-[10px]"
            >
              MPLADS-GRV-2024-192847
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-4">
              {/* Header Details */}
              <div className="flex items-start justify-between pb-3 border-b border-gray-200 flex-wrap gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {result.grievance.grievanceId || result.grievance.id}
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm mt-1">
                    Issue: {result.grievance.issueType}
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Filed on {new Date(result.grievance.createdAt).toLocaleDateString()} by{' '}
                    <span className="font-semibold">{result.grievance.citizenName}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`font-bold px-2.5 py-1 rounded uppercase text-[11px] inline-block ${
                      result.grievance.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : result.grievance.status === 'Dismissed'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {result.grievance.status}
                  </span>
                </div>
              </div>

              {/* Progress Timeline Stepper */}
              <div>
                <div className="text-[11px] font-bold text-gray-700 uppercase mb-2">
                  Redressal Workflow Stage
                </div>

                <div className="relative flex items-center justify-between">
                  <div className="absolute left-0 right-0 top-3 h-0.5 bg-gray-200 -z-0" />
                  {STAGES.map((stage, idx) => {
                    const currentIdx = getStageIndex(result.grievance.status);
                    const isCompleted = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={stage} className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                            isCurrent
                              ? 'bg-blue-900 border-amber-500 text-white shadow-xs'
                              : isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-gray-300 text-gray-400'
                          }`}
                        >
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <span
                          className={`text-[9px] mt-1 text-center font-medium max-w-[55px] sm:max-w-none leading-tight ${
                            isCurrent
                              ? 'font-bold text-blue-950'
                              : isCompleted
                              ? 'text-emerald-800'
                              : 'text-gray-400'
                          }`}
                        >
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Associated Work Reference */}
              {result.project && (
                <div className="bg-slate-50 p-3 rounded border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Referenced Work</span>
                    <div className="font-bold text-gray-900">
                      [{result.project.workId}] {result.project.title}
                    </div>
                    <div className="text-[11px] text-gray-600">
                      {result.project.district}, {result.project.state} • MP: {result.project.mpName}
                    </div>
                  </div>
                  {onSelectProject && (
                    <button
                      onClick={() => {
                        onSelectProject(result.project!.workId);
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-gray-100 text-blue-900 border border-gray-300 rounded shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <span>View Work</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Investigation Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Assigned Officer</span>
                  <div className="font-bold text-gray-900 mt-0.5">
                    {result.grievance.assignedOfficer || 'Assistant Engineer (Civil), DRDA'}
                  </div>
                  <div className="text-[11px] text-gray-600">District Grievance Cell</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Action Taken</span>
                  <div className="font-semibold text-gray-800 mt-0.5">
                    {result.grievance.actionTaken || 'Joint site inspection completed; corrective repairs underway.'}
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase">Officer Investigation Remarks</span>
                <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded border border-gray-200 mt-0.5 leading-relaxed">
                  {result.grievance.investigationRemarks ||
                    'Physical inspection verified ground complaint. Contractor issued milestone compliance notice.'}
                </p>
              </div>

              {/* Citizen Original Comments */}
              <div className="pt-2 border-t border-gray-100">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Original Citizen Submission</span>
                <p className="text-xs text-gray-600 italic mt-0.5">"{result.grievance.comments}"</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-[10px] text-gray-500">
            For escalations, contact the District Planning Officer (DPO).
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
