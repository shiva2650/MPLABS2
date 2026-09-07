import React, { useState } from 'react';
import { User, Project, PhotoStage } from '../types/index.ts';
import {
  updateProjectProgress,
  recordProjectExpenditure,
  verifyPhotoUpload
} from '../services/api.ts';
import {
  Building2,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  IndianRupee,
  MapPin,
  ShieldCheck,
  Clock,
  Layers
} from 'lucide-react';

interface AgencyDashboardProps {
  user: User;
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onRefreshData: () => void;
}

export const AgencyDashboard: React.FC<AgencyDashboardProps> = ({
  user,
  projects,
  onSelectProject,
  onRefreshData
}) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(projects[0] || null);

  // Progress Update Form state
  const [progressPercent, setProgressPercent] = useState<number>(selectedProject?.completionPercentage || 0);
  const [progressNotes, setProgressNotes] = useState('');
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // Expenditure Form state
  const [expenditureAmount, setExpenditureAmount] = useState('');
  const [sanctionOrderNo, setSanctionOrderNo] = useState('');
  const [recordingExpenditure, setRecordingExpenditure] = useState(false);

  // Photo Upload & Verification state
  const [photoStage, setPhotoStage] = useState<PhotoStage>('During-Work');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoNotes, setPhotoNotes] = useState('');
  const [verifyingPhoto, setVerifyingPhoto] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  // Notifications
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const handleSelectWork = (p: Project) => {
    setSelectedProject(p);
    setProgressPercent(p.completionPercentage);
    setVerificationResult(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setUpdatingProgress(true);
    try {
      await updateProjectProgress(selectedProject.id, {
        percentage: Number(progressPercent),
        description: progressNotes || 'Measurement Book (MB) physical inspection updated.'
      });
      setStatusFeedback(`Physical progress recorded for ${selectedProject.workId}: ${progressPercent}%`);
      setProgressNotes('');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to update progress.');
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handleExpenditureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !expenditureAmount) return;
    setRecordingExpenditure(true);
    try {
      await recordProjectExpenditure(selectedProject.id, {
        amount: Number(expenditureAmount),
        sanctionOrderNo
      });
      setStatusFeedback(`Expenditure of ₹${Number(expenditureAmount).toLocaleString()} booked against ${selectedProject.workId}`);
      setExpenditureAmount('');
      setSanctionOrderNo('');
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to record expenditure.');
    } finally {
      setRecordingExpenditure(false);
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setVerificationResult(null);
    }
  };

  const handlePhotoVerifyAndUpload = async () => {
    if (!selectedProject || !photoFile) {
      alert('Please select an inspection photo file.');
      return;
    }

    setVerifyingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('projectId', selectedProject.id);
      formData.append('stage', photoStage);
      formData.append('notes', photoNotes || 'Inspection site photo');

      const result = await verifyPhotoUpload(formData);
      setVerificationResult(result);
      setStatusFeedback(`Inspection photo processed! Status: ${result.status}`);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Photo verification failed.');
    } finally {
      setVerifyingPhoto(false);
    }
  };

  const formatLakhs = (val: number) => `₹${(val / 100000).toFixed(2)} L`;

  return (
    <div className="space-y-6">
      {/* Implementing Agency Banner */}
      <div className="bg-gradient-to-r from-emerald-950 to-teal-900 text-white p-5 rounded-lg shadow-xs border-b-4 border-emerald-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-emerald-500 text-slate-950 font-extrabold px-2 py-0.5 rounded uppercase">
                Implementing Agency
              </span>
              <span className="text-xs text-emerald-200">
                {user.agencyName || 'PWD Rural Works Division'} • {user.district}, {user.state}
              </span>
            </div>
            <h2 className="text-xl font-extrabold">{user.name}</h2>
            <p className="text-xs text-emerald-200 mt-0.5">
              Measurement Book (MB) Entries, Milestone Invoicing & Geo-Tagged Site Inspections
            </p>
          </div>

          <div className="bg-white/10 px-4 py-2 rounded-md border border-white/20 text-xs">
            <span className="font-bold text-amber-300">{projects.length}</span> Works Assigned
          </div>
        </div>
      </div>

      {statusFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusFeedback}</span>
          </div>
          <button onClick={() => setStatusFeedback(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assigned Works Selector */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider mb-2">
              Assigned Works Queue ({projects.length})
            </h3>
            <p className="text-[11px] text-gray-500 mb-3">
              Select an asset to update physical progress or upload geo-inspections.
            </p>

            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {projects.map((proj) => {
                const isSelected = selectedProject?.id === proj.id;
                return (
                  <div
                    key={proj.id}
                    onClick={() => handleSelectWork(proj)}
                    className={`p-3 rounded-md border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 shadow-xs'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-bold text-blue-900">{proj.workId}</span>
                      <span
                        className={`font-bold px-1.5 py-0.2 rounded uppercase ${
                          proj.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : proj.status === 'Delayed'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {proj.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{proj.title}</h4>
                    <div className="text-[10px] text-gray-500 mt-1 flex items-center justify-between">
                      <span>Progress: {proj.completionPercentage}%</span>
                      <span className="font-semibold text-gray-700">{formatLakhs(proj.sanctionedCost)}</span>
                    </div>

                    {/* Progress mini bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1.5 overflow-hidden">
                      <div
                        className="h-1 bg-emerald-600 rounded-full"
                        style={{ width: `${proj.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Work Operations Console */}
        <div className="lg:col-span-8 space-y-4">
          {selectedProject ? (
            <>
              {/* Selected Work Header Details */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
                <div className="flex items-start justify-between gap-3 pb-3 mb-3 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                      {selectedProject.workId}
                    </span>
                    <h3 className="text-base font-extrabold text-gray-900 mt-1">{selectedProject.title}</h3>
                    <p className="text-xs text-gray-600">{selectedProject.locationAddress}</p>
                  </div>

                  <button
                    onClick={() => onSelectProject(selectedProject)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-50 rounded border border-blue-300 shrink-0"
                  >
                    View Full File
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Sanctioned Cost</span>
                    <div className="font-extrabold text-blue-950">{formatLakhs(selectedProject.sanctionedCost)}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Utilized</span>
                    <div className="font-extrabold text-emerald-800">{formatLakhs(selectedProject.utilizedCost)}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Physical Progress</span>
                    <div className="font-extrabold text-gray-900">{selectedProject.completionPercentage}%</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Assigned Vendor</span>
                    <div className="font-bold text-gray-800 truncate">{selectedProject.vendorName || 'Unassigned'}</div>
                  </div>
                </div>
              </div>

              {/* ACTION 1: Physical Progress & MB Entry */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-2xs">
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                  <FileText className="w-4 h-4 text-blue-900" />
                  <h4 className="text-sm font-bold text-gray-900">Record Measurement Book (MB) Entry</h4>
                </div>

                <form onSubmit={handleProgressSubmit} className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      <span>Physical Completion Percentage: {progressPercent}%</span>
                      <span>Target: 100% Handover</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progressPercent}
                      onChange={(e) => setProgressPercent(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Measurement Book Observation / Milestone Details
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Foundation excavation completed. Reinforced concrete plinth beam inspection signed off by Asst. Engineer."
                      value={progressNotes}
                      onChange={(e) => setProgressNotes(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingProgress}
                    className="py-2 px-4 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <span>{updatingProgress ? 'Updating MB...' : 'Record Physical Progress Entry'}</span>
                  </button>
                </form>
              </div>

              {/* ACTION 2: Upload Geo-Tagged Inspection Photo (Real Server-Side EXIF Verification) */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-800" />
                    <h4 className="text-sm font-bold text-gray-900">
                      Geo-Tagged Site Photo Upload & AI EXIF Verification
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Mandatory Section 6.2
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Inspection Stage *
                      </label>
                      <select
                        value={photoStage}
                        onChange={(e) => setPhotoStage(e.target.value as PhotoStage)}
                        className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                      >
                        <option value="Before-Work">Before-Work (Baseline Site)</option>
                        <option value="During-Work">During-Work (Mid-Stage Construction)</option>
                        <option value="After-Completion">After-Completion (Asset Ready)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Inspector Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. North-facing elevation view"
                        value={photoNotes}
                        onChange={(e) => setPhotoNotes(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>

                  {/* File Selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Select Inspection Image (JPEG / PNG with EXIF) *
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handlePhotoFileChange}
                      className="w-full text-xs text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100"
                    />
                  </div>

                  {photoPreview && (
                    <div className="flex items-center gap-4 p-2 bg-gray-50 rounded border border-gray-200">
                      <img
                        src={photoPreview}
                        alt="Inspection Preview"
                        className="w-20 h-20 object-cover rounded border"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-gray-900">{photoFile?.name}</div>
                        <div className="text-gray-500">{((photoFile?.size || 0) / 1024).toFixed(1)} KB</div>
                        <div className="text-[11px] text-blue-900 mt-1">
                          Ready for server-side EXIF GPS distance analysis
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePhotoVerifyAndUpload}
                    disabled={verifyingPhoto || !photoFile}
                    className="py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{verifyingPhoto ? 'Extracting EXIF & Verifying...' : 'Verify EXIF & Upload Inspection Photo'}</span>
                  </button>

                  {/* Live Verification Result Card */}
                  {verificationResult && (
                    <div
                      className={`p-4 rounded-lg border text-xs space-y-2 ${
                        verificationResult.status === 'Verified'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : verificationResult.status === 'Mismatch'
                          ? 'bg-red-50 border-red-200 text-red-950'
                          : verificationResult.status === 'Suspicious'
                          ? 'bg-amber-50 border-amber-200 text-amber-950'
                          : 'bg-gray-100 border-gray-300 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-sm">Verification Status: {verificationResult.status}</span>
                        <span>
                          Distance to Site:{' '}
                          {verificationResult.distanceMeters !== null
                            ? `${verificationResult.distanceMeters}m`
                            : 'N/A'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-current/20">
                        <div>
                          Camera: {verificationResult.cameraMake || 'Unknown'}{' '}
                          {verificationResult.cameraModel || ''}
                        </div>
                        <div>Software: {verificationResult.software || 'Original Firmware'}</div>
                        <div>
                          GPS:{' '}
                          {verificationResult.extractedCoordinates
                            ? `${verificationResult.extractedCoordinates.lat.toFixed(4)}°N, ${verificationResult.extractedCoordinates.lng.toFixed(4)}°E`
                            : 'None (Stripped)'}
                        </div>
                        <div>
                          Perceptual Hash: {verificationResult.perceptualHash?.substring(0, 8)}...
                        </div>
                      </div>

                      <div className="pt-1 text-[11px] italic">
                        {verificationResult.reasons?.join(' | ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION 3: Record Expenditure / Submit Bill */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-2xs">
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
                  <IndianRupee className="w-4 h-4 text-blue-900" />
                  <h4 className="text-sm font-bold text-gray-900">Record Expenditure / Disbursal</h4>
                </div>

                <form onSubmit={handleExpenditureSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Amount to Disburse (INR ₹) *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 500000"
                        value={expenditureAmount}
                        onChange={(e) => setExpenditureAmount(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md font-bold text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Sanction Order / Bill Reference *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MPLADS/2024/SO-821"
                        value={sanctionOrderNo}
                        onChange={(e) => setSanctionOrderNo(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={recordingExpenditure}
                    className="py-2 px-4 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <span>{recordingExpenditure ? 'Recording...' : 'Book Expenditure Against Sanction'}</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-lg border text-gray-500 text-xs">
              No works assigned to this agency.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
