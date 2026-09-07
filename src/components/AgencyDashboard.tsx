import React, { useState } from 'react';
import { Project, UserProfile } from '../types';
import { ApiService } from '../services/api';
import {
  Upload,
  Camera,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Clock,
  Layers,
  FileCheck,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface AgencyDashboardProps {
  currentUser: UserProfile;
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onRefresh: () => void;
}

export const AgencyDashboard: React.FC<AgencyDashboardProps> = ({
  currentUser,
  projects,
  onSelectProject,
  onRefresh,
}) => {
  // Filter only projects assigned to this agency
  const assignedProjects = projects.filter(
    (p) => p.implementingAgencyId === currentUser.agencyId
  );

  // Selected project for action
  const [activeProject, setActiveProject] = useState<Project | null>(
    assignedProjects[0] || null
  );

  // Progress update state
  const [progressVal, setProgressVal] = useState<number>(activeProject?.progressPercentage || 50);
  const [stageNotes, setStageNotes] = useState<string>('');
  const [expenditureAdd, setExpenditureAdd] = useState<string>('');
  const [updatingProgress, setUpdatingProgress] = useState<boolean>(false);
  const [progressSuccess, setProgressSuccess] = useState<string | null>(null);

  // Photo upload state
  const [photoCaption, setPhotoCaption] = useState<string>('Site progress execution');
  const [photoStage, setPhotoStage] = useState<string>('During Execution');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleProjectSelect = (p: Project) => {
    setActiveProject(p);
    setProgressVal(p.progressPercentage);
    setUploadResult(null);
    setProgressSuccess(null);
    setUploadError(null);
  };

  const handleProgressUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    setUpdatingProgress(true);
    setProgressSuccess(null);

    try {
      const updated = await ApiService.updateProgress(
        activeProject.id,
        progressVal,
        stageNotes,
        expenditureAdd ? parseFloat(expenditureAdd) : undefined
      );
      setActiveProject(updated);
      setProgressSuccess(`Physical progress successfully updated to ${progressVal}%.`);
      setStageNotes('');
      setExpenditureAdd('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Progress update failed.');
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handlePhotoUploadSubmit = async (simulationOverride?: string) => {
    if (!activeProject) return;
    setUploadingPhoto(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      let fileToUpload = selectedFile;

      // If no file selected but simulation triggered, generate dummy 1x1 png file
      if (!fileToUpload) {
        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 100;
        dummyCanvas.height = 100;
        const ctx = dummyCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(0, 0, 100, 100);
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.fillText('MPLADS SITE', 10, 50);
        }
        const blob = await new Promise<Blob>((resolve) =>
          dummyCanvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg')
        );
        fileToUpload = new File([blob], 'site_inspection.jpg', { type: 'image/jpeg' });
      }

      const res = await ApiService.uploadPhoto(
        activeProject.id,
        fileToUpload,
        photoCaption,
        photoStage,
        simulationOverride
      );

      setUploadResult(res.verification);
      setSelectedFile(null);
      onRefresh();

      // Refresh active project instance
      const refreshed = await ApiService.getProjectById(activeProject.id);
      setActiveProject(refreshed);
    } catch (err: any) {
      setUploadError(err.message || 'Photo upload failed.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Agency Identity Header */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded text-[11px] font-bold">
              Executing Agency Workspace
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Agency Code: {currentUser.agencyId} • District: {currentUser.district}
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            {currentUser.agencyName || currentUser.name}
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Field Inspection, Physical Progress Reporting &amp; Geotagged Photographic Verification Portal
          </p>
        </div>

        <div className="text-xs text-right bg-stone-50 p-2.5 rounded border border-stone-200">
          <div className="text-stone-500">Assigned Execution Portfolio</div>
          <div className="font-bold text-stone-900 font-mono text-sm">
            {assignedProjects.length} Works Assigned
          </div>
        </div>
      </div>

      {/* Main Two-Column Workflow Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Assigned Works Selector */}
        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Assigned Works ({assignedProjects.length})
            </h3>
            <span className="text-[11px] text-stone-500">Select to manage</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {assignedProjects.map((p) => {
              const isSelected = activeProject?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleProjectSelect(p)}
                  className={`p-3 rounded-md border cursor-pointer transition-colors text-xs ${
                    isSelected
                      ? 'bg-sky-50/80 border-sky-600 shadow-xs'
                      : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-bold text-stone-900 line-clamp-1">{p.title}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                        p.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'Ongoing'
                          ? 'bg-blue-100 text-blue-800'
                          : p.status === 'Delayed'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 mb-1.5">
                    {p.workCode} • {p.sector}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-600">
                    <span>Sanctioned: ₹{p.sanctionedCostLakhs}L</span>
                    <span className="font-bold text-sky-900">{p.progressPercentage}% Completed</span>
                  </div>
                </div>
              );
            })}

            {assignedProjects.length === 0 && (
              <div className="text-center py-8 text-stone-500 text-xs">
                No developmental works assigned to this agency yet.
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Project Execution Management & Photo Verification */}
        {activeProject ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Active Project Header Strip */}
            <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3 mb-3">
                <div>
                  <div className="text-[11px] font-mono text-stone-500">{activeProject.workCode}</div>
                  <h3 className="text-base font-bold text-stone-900">{activeProject.title}</h3>
                  <div className="text-xs text-stone-600 flex items-center gap-2 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{activeProject.locationName}</span>
                    <span>• Sanctioned: ₹{activeProject.sanctionedCostLakhs.toFixed(2)} Lakhs</span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectProject(activeProject)}
                  className="px-3 py-1.5 text-xs font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded transition-colors shrink-0 inline-flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Dossier
                </button>
              </div>

              {/* Progress Slider & Update Form */}
              <form onSubmit={handleProgressUpdate} className="space-y-4 text-xs">
                {progressSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{progressSuccess}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-stone-800 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-sky-800" />
                      Physical Execution Progress:
                    </label>
                    <span className="text-base font-bold text-sky-900 font-mono">
                      {progressVal}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressVal}
                    onChange={(e) => setProgressVal(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-sky-900"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
                    <span>0% (Commencing)</span>
                    <span>25% (Foundation)</span>
                    <span>50% (Superstructure)</span>
                    <span>75% (Finishing)</span>
                    <span>100% (Completed)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Stage Milestone Observations &amp; Notes
                    </label>
                    <input
                      type="text"
                      value={stageNotes}
                      onChange={(e) => setStageNotes(e.target.value)}
                      placeholder="e.g. Foundation excavation and RCC casting completed"
                      className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Additional Expenditure Recorded (₹ in Lakhs)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={expenditureAdd}
                      onChange={(e) => setExpenditureAdd(e.target.value)}
                      placeholder="e.g. 5.5"
                      className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    id="agency-submit-progress-btn"
                    type="submit"
                    disabled={updatingProgress}
                    className="px-4 py-2 text-xs font-bold text-white bg-sky-900 hover:bg-sky-950 disabled:opacity-50 rounded shadow-xs transition-colors"
                  >
                    {updatingProgress ? 'Updating...' : 'Record Physical Progress'}
                  </button>
                </div>
              </form>
            </div>

            {/* Photo Upload & AI GPS/EXIF Verification Engine Box */}
            <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-sky-100 text-sky-900 rounded">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      Geotagged Progress Photo Upload &amp; Verification
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Server-side EXIF inspection, Perceptual Hash reuse check, and GPS Haversine verification
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-900 rounded border border-purple-200">
                  AI Integrity Engine
                </span>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Verification Outcome Card */}
              {uploadResult && (
                <div
                  className={`p-3.5 rounded-md border text-xs space-y-1.5 ${
                    uploadResult.status === 'Verified'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : uploadResult.status === 'Location Mismatch'
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm flex items-center gap-1.5">
                      {uploadResult.status === 'Verified' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                      Verification Outcome: {uploadResult.status}
                    </span>
                    {uploadResult.distanceMeters !== undefined && (
                      <span className="font-mono text-xs font-bold">
                        Distance: {uploadResult.distanceMeters} meters
                      </span>
                    )}
                  </div>
                  <div className="text-[11px]">
                    {uploadResult.flagReasons.map((r: string, idx: number) => (
                      <div key={idx}>• {r}</div>
                    ))}
                  </div>
                  {uploadResult.pHash && (
                    <div className="text-[10px] font-mono text-stone-500 pt-1 border-t border-stone-200/60">
                      Perceptual Hash: {uploadResult.pHash}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Photo Stage Category *
                  </label>
                  <select
                    value={photoStage}
                    onChange={(e) => setPhotoStage(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded bg-white text-stone-900"
                  >
                    <option value="Before Commencement">Before Commencement</option>
                    <option value="During Execution">During Execution</option>
                    <option value="Near Completion">Near Completion</option>
                    <option value="Completed Asset">Completed Asset (Final)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Photo Caption &amp; Milestone Label
                  </label>
                  <input
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="e.g. Laying of bitumin macadam layer"
                    className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900"
                  />
                </div>
              </div>

              {/* File Input Selection */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1 text-xs">
                  Select Inspection Image (JPEG with EXIF geotags)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-800 hover:file:bg-stone-200 border border-stone-300 rounded p-1"
                />
              </div>

              {/* Verification Simulation Buttons (For testing verification with 1 click) */}
              <div className="p-3 bg-stone-100 rounded border border-stone-200 space-y-2 text-xs">
                <div className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                  Instant Verification Test Triggers (Demo Workbench):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePhotoUploadSubmit('PASS_GPS')}
                    disabled={uploadingPhoto}
                    className="p-2 bg-white hover:bg-emerald-50 border border-emerald-300 rounded text-left transition-colors"
                  >
                    <div className="font-bold text-emerald-800">Test Authentic (Pass)</div>
                    <div className="text-[10px] text-stone-500">GPS within 32m of site</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePhotoUploadSubmit('FAIL_GPS')}
                    disabled={uploadingPhoto}
                    className="p-2 bg-white hover:bg-red-50 border border-red-300 rounded text-left transition-colors"
                  >
                    <div className="font-bold text-red-800">Test Location Mismatch</div>
                    <div className="text-[10px] text-stone-500">GPS 8.4 km away from site</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePhotoUploadSubmit('FAIL_EXIF')}
                    disabled={uploadingPhoto}
                    className="p-2 bg-white hover:bg-amber-50 border border-amber-300 rounded text-left transition-colors"
                  >
                    <div className="font-bold text-amber-800">Test Stripped EXIF</div>
                    <div className="text-[10px] text-stone-500">Unverifiable metadata</div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handlePhotoUploadSubmit()}
                  disabled={uploadingPhoto || !selectedFile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-sky-900 hover:bg-sky-950 disabled:opacity-40 rounded shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingPhoto ? 'Verifying & Uploading...' : 'Upload & Verify Photo'}
                </button>
              </div>

              {/* Uploaded Photos Gallery */}
              {activeProject.photos && activeProject.photos.length > 0 && (
                <div className="pt-3 border-t border-stone-200">
                  <div className="text-xs font-bold text-stone-800 mb-2">
                    Verified Progress Photographs ({activeProject.photos.length})
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeProject.photos.map((ph) => (
                      <div
                        key={ph.id}
                        className="bg-stone-50 border border-stone-200 rounded overflow-hidden text-[11px]"
                      >
                        <img
                          src={ph.url}
                          alt={ph.caption}
                          className="w-full h-28 object-cover bg-stone-200"
                        />
                        <div className="p-2 space-y-1">
                          <div className="font-bold text-stone-900 truncate">{ph.caption}</div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">{ph.stage}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                ph.verification.status === 'Verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {ph.verification.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white border border-stone-200 rounded-lg p-8 text-center text-stone-500 text-xs">
            Please select an assigned developmental work from the left panel to update progress or upload verification photos.
          </div>
        )}
      </div>
    </div>
  );
};
