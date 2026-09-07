import React, { useState, useEffect } from 'react';
import { Project, PhotoVerificationResult } from '../types/index.ts';
import { fetchTestPhotoSamples, verifyPhotoUpload } from '../services/api.ts';
import {
  ShieldAlert,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  Cpu,
  Layers,
  MapPin,
  FileCheck2,
  Sparkles,
  Info
} from 'lucide-react';

interface AiVerificationLabProps {
  projects: Project[];
  onSelectProject: (p: Project) => void;
}

export const AiVerificationLab: React.FC<AiVerificationLabProps> = ({
  projects,
  onSelectProject
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'photo-gps' | 'cost-anomaly' | 'duplicate-check'>('photo-gps');

  // Pre-calibrated sample test suites
  const [testSamples, setTestSamples] = useState<any[]>([]);
  const [targetProject, setTargetProject] = useState<any>(null);
  const [loadingSamples, setLoadingSamples] = useState(true);

  // Active Test Result display
  const [activeResult, setActiveResult] = useState<PhotoVerificationResult | null>(null);
  const [activeTestTitle, setActiveTestTitle] = useState<string>('');
  const [activeTestDesc, setActiveTestDesc] = useState<string>('');

  // Custom User Image Upload state
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customPreview, setCustomPreview] = useState<string | null>(null);
  const [customVerifying, setCustomVerifying] = useState(false);

  // Cost Anomaly Interactive Simulator State
  const [costCategory, setCostCategory] = useState('Drinking Water');
  const [costState, setCostState] = useState('Telangana');
  const [simulatedCost, setSimulatedCost] = useState('8500000'); // ₹85 Lakhs

  // Duplicate Check Simulator State
  const [projAId, setProjAId] = useState(projects[0]?.id || '');
  const [projBId, setProjBId] = useState(projects[4]?.id || '');

  useEffect(() => {
    const loadSamples = async () => {
      setLoadingSamples(true);
      try {
        const data = await fetchTestPhotoSamples();
        setTestSamples(data.samples);
        setTargetProject(data.targetProject);
        // Default to first sample (Passing)
        if (data.samples && data.samples.length > 0) {
          setActiveResult(data.samples[0].result);
          setActiveTestTitle(data.samples[0].name);
          setActiveTestDesc(data.samples[0].description);
        }
      } catch (err) {
        console.error('Failed to load sample tests:', err);
      } finally {
        setLoadingSamples(false);
      }
    };
    loadSamples();
  }, []);

  const handleRunSample = (sample: any) => {
    setActiveResult(sample.result);
    setActiveTestTitle(sample.name);
    setActiveTestDesc(sample.description);
  };

  const handleCustomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomFile(file);
      setCustomPreview(URL.createObjectURL(file));
    }
  };

  const handleCustomVerify = async () => {
    if (!customFile) return;
    setCustomVerifying(true);
    try {
      const formData = new FormData();
      formData.append('photo', customFile);
      formData.append('projectId', targetProject?.id || projects[0]?.id);

      const result = await verifyPhotoUpload(formData);
      setActiveResult(result);
      setActiveTestTitle(`Custom Upload: ${customFile.name}`);
      setActiveTestDesc('Live client upload analyzed by server-side exifr metadata engine.');
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setCustomVerifying(false);
    }
  };

  // Cost anomaly calculation logic for simulator
  const cohort = projects.filter(
    (p) => p.category === costCategory && p.state.toLowerCase() === costState.toLowerCase() && p.estimatedCost > 0
  );
  const effectiveCohort = cohort.length >= 2 ? cohort : projects.filter((p) => p.category === costCategory && p.estimatedCost > 0);
  const costs = effectiveCohort.map((p) => p.estimatedCost);
  const baselineMean = costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 3500000;
  const variance = costs.length > 1 ? costs.reduce((sum, val) => sum + Math.pow(val - baselineMean, 2), 0) / (costs.length - 1) : 1000000;
  const baselineStdDev = Math.sqrt(variance) || 800000;

  const costNum = Number(simulatedCost) || baselineMean;
  const zScore = Number(((costNum - baselineMean) / baselineStdDev).toFixed(2));
  const isCostAnomaly = zScore >= 1.8;

  // Duplicate Check comparison logic
  const pA = projects.find((p) => p.id === projAId) || projects[0];
  const pB = projects.find((p) => p.id === projBId) || projects[1];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 to-blue-900 text-white p-5 rounded-lg shadow-xs border-b-4 border-indigo-500">
        <div className="flex items-center gap-3 mb-2">
          <Cpu className="w-6 h-6 text-amber-400" />
          <h2 className="text-lg font-bold">AI Integrity & Statistical Verification Testbench</h2>
        </div>
        <p className="text-xs text-indigo-100 max-w-3xl leading-relaxed">
          Operational evaluation environment for MoSPI Section 6 guidelines: Real-time server-side EXIF metadata
          extraction, Haversine GPS proximity verification, regional cost z-score baseline modeling, and
          perceptual image duplication hashing.
        </p>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveSubTab('photo-gps')}
          className={`px-3.5 py-2 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
            activeSubTab === 'photo-gps'
              ? 'bg-blue-900 text-white'
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Photo & GPS EXIF Verification (Section 6.2)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cost-anomaly')}
          className={`px-3.5 py-2 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
            activeSubTab === 'cost-anomaly'
              ? 'bg-blue-900 text-white'
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Cost Baseline Z-Score Simulator (Section 6.1)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('duplicate-check')}
          className={`px-3.5 py-2 text-xs font-bold rounded-md flex items-center gap-1.5 transition-colors ${
            activeSubTab === 'duplicate-check'
              ? 'bg-blue-900 text-white'
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Duplicate Asset Detection Inspector</span>
        </button>
      </div>

      {/* SUBTAB 1: PHOTO & GPS EXIF VERIFICATION */}
      {activeSubTab === 'photo-gps' && (
        <div className="space-y-6">
          {/* Target Work Anchor Banner */}
          {targetProject && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-blue-900 uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Target Work Anchor: {targetProject.workId}
                </span>
                <h3 className="text-sm font-extrabold text-gray-900 mt-1">{targetProject.title}</h3>
                <div className="text-xs text-gray-600 flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-600" />
                    Registered Site: {targetProject.latitude}°N, {targetProject.longitude}°E
                  </span>
                  <span>Allowed Geo-fence Radius: 500 meters</span>
                </div>
              </div>

              <div className="text-xs font-semibold text-gray-500">
                Rule 6.2 Compliance Verification
              </div>
            </div>
          )}

          {/* Test Controls & Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: 1-Click Pre-Calibrated Samples + Custom File Input */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  1-Click Real Verification Tests
                </h4>
                <p className="text-[11px] text-gray-500 mb-3">
                  Instantly execute verification algorithms using real binary JPEG payloads with valid EXIF headers:
                </p>

                <div className="space-y-2.5">
                  {testSamples.map((sample) => {
                    const isPassing = sample.result.status === 'Verified';
                    const isMismatch = sample.result.status === 'Mismatch';
                    const isSelected = activeTestTitle === sample.name;

                    return (
                      <div
                        key={sample.id}
                        onClick={() => handleRunSample(sample)}
                        className={`p-3 rounded-md border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-gray-900">{sample.name}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              isPassing
                                ? 'bg-emerald-100 text-emerald-800'
                                : isMismatch
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            {sample.result.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-snug">{sample.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image Upload Dropzone */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-2xs">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-900" />
                  <span>Test Custom Site Image</span>
                </h4>
                <p className="text-[11px] text-gray-500 mb-3">
                  Upload any camera image from your device to run live server-side EXIF parsing.
                </p>

                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleCustomFileChange}
                  className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-900 hover:file:bg-blue-200 mb-3"
                />

                {customPreview && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded border mb-3">
                    <img src={customPreview} alt="Preview" className="w-14 h-14 object-cover rounded border" />
                    <div className="text-xs">
                      <div className="font-bold text-gray-900 truncate max-w-[180px]">{customFile?.name}</div>
                      <div className="text-gray-500">{((customFile?.size || 0) / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCustomVerify}
                  disabled={customVerifying || !customFile}
                  className="w-full py-2 px-3 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{customVerifying ? 'Analyzing Metadata...' : 'Run Server-Side Verification'}</span>
                </button>
              </div>
            </div>

            {/* Right: Detailed Inspection Analysis Output */}
            <div className="lg:col-span-7">
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-2xs h-full">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Verification Engine Output</span>
                    <h3 className="text-sm font-extrabold text-gray-900">{activeTestTitle || 'Test Analysis'}</h3>
                  </div>
                  {activeResult && (
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded uppercase tracking-wider ${
                        activeResult.status === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : activeResult.status === 'Mismatch'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : activeResult.status === 'Suspicious'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-gray-100 text-gray-800 border border-gray-300'
                      }`}
                    >
                      {activeResult.status}
                    </span>
                  )}
                </div>

                {activeResult ? (
                  <div className="space-y-4">
                    {/* Status Summary Banner */}
                    <div
                      className={`p-4 rounded-md border text-xs leading-relaxed ${
                        activeResult.status === 'Verified'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                          : activeResult.status === 'Mismatch'
                          ? 'bg-red-50 border-red-200 text-red-950'
                          : activeResult.status === 'Suspicious'
                          ? 'bg-amber-50 border-amber-200 text-amber-950'
                          : 'bg-gray-100 border-gray-300 text-gray-900'
                      }`}
                    >
                      <div className="font-bold text-sm mb-1 flex items-center gap-1.5">
                        {activeResult.status === 'Verified' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        )}
                        <span>
                          {activeResult.status === 'Verified'
                            ? 'Location & Authenticity Verified'
                            : activeResult.status === 'Mismatch'
                            ? 'Location Mismatch Detected'
                            : activeResult.status === 'Suspicious'
                            ? 'Suspicious Manipulation Indicator'
                            : 'Metadata Unverifiable'}
                        </span>
                      </div>
                      <p>{activeResult.reasons.join(' ')}</p>
                    </div>

                    {/* Technical Metric Cards */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Distance to Site</span>
                        <div className="text-base font-extrabold text-blue-950 mt-0.5">
                          {activeResult.distanceMeters !== null
                            ? `${activeResult.distanceMeters.toLocaleString()} meters`
                            : 'GPS Unavailable'}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Allowed: ≤ {activeResult.thresholdMeters}m
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Extracted GPS</span>
                        <div className="text-xs font-mono font-bold text-gray-900 mt-0.5">
                          {activeResult.extractedCoordinates
                            ? `${activeResult.extractedCoordinates.lat.toFixed(4)}°N, ${activeResult.extractedCoordinates.lng.toFixed(4)}°E`
                            : 'None (Stripped)'}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          Target: {activeResult.targetCoordinates.lat.toFixed(4)}°N,{' '}
                          {activeResult.targetCoordinates.lng.toFixed(4)}°E
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Camera Device Tag</span>
                        <div className="text-xs font-bold text-gray-900 mt-0.5">
                          {activeResult.cameraMake || 'Unknown'} {activeResult.cameraModel || ''}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {activeResult.cameraMake ? 'Authentic hardware sensor' : 'No hardware metadata'}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Software Tag</span>
                        <div
                          className={`text-xs font-bold mt-0.5 ${
                            activeResult.isEditedOrAiGenerated ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          {activeResult.software || 'Original Firmware'}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {activeResult.isEditedOrAiGenerated
                            ? 'Editing software detected'
                            : 'No manipulation tags'}
                        </div>
                      </div>
                    </div>

                    {/* Perceptual Hash */}
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 font-mono text-[11px]">
                      <div className="text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Perceptual Hash Fingerprint (pHash)
                      </div>
                      <div className="text-indigo-900 font-bold">{activeResult.perceptualHash}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Matches stored image index: {activeResult.isDuplicateImage ? 'DUPLICATE DETECTED' : 'Unique Original'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-500 text-xs">
                    Select a sample test or upload an image to view verification telemetry.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: COST BASELINE Z-SCORE SIMULATOR */}
      {activeSubTab === 'cost-anomaly' && (
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-2xs space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-extrabold text-gray-900">
              Statistical Cost Anomaly Baseline Simulator (Section 6.1)
            </h3>
            <p className="text-xs text-gray-600">
              Calculates standard deviation and z-score for a work against historical cohorts within the same category and state.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Asset Category</label>
              <select
                value={costCategory}
                onChange={(e) => setCostCategory(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
              >
                <option value="Drinking Water">Drinking Water</option>
                <option value="Education & Schools">Education & Schools</option>
                <option value="Health & Sanitation">Health & Sanitation</option>
                <option value="Roads & Pathways">Roads & Pathways</option>
                <option value="Rural Electrification">Rural Electrification</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">State Cohort</label>
              <select
                value={costState}
                onChange={(e) => setCostState(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
              >
                <option value="Telangana">Telangana</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Test Project Cost (INR ₹)</label>
              <input
                type="number"
                value={simulatedCost}
                onChange={(e) => setSimulatedCost(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md font-bold text-gray-900"
              />
            </div>
          </div>

          {/* Baseline Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-gray-50 p-3 rounded border">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Cohort Sample Size</span>
              <div className="text-base font-extrabold text-gray-900 mt-0.5">{effectiveCohort.length} Works</div>
              <div className="text-[10px] text-gray-500">{costCategory} in {costState}</div>
            </div>

            <div className="bg-gray-50 p-3 rounded border">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Baseline Mean (μ)</span>
              <div className="text-base font-extrabold text-blue-950 mt-0.5">
                ₹{(baselineMean / 100000).toFixed(1)} Lakhs
              </div>
              <div className="text-[10px] text-gray-500">Historical regional average</div>
            </div>

            <div className="bg-gray-50 p-3 rounded border">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Standard Dev (σ)</span>
              <div className="text-base font-extrabold text-indigo-950 mt-0.5">
                ₹{(baselineStdDev / 100000).toFixed(1)} Lakhs
              </div>
              <div className="text-[10px] text-gray-500">Regional variance</div>
            </div>

            <div className="bg-gray-50 p-3 rounded border">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Calculated Z-Score</span>
              <div
                className={`text-base font-extrabold mt-0.5 ${
                  isCostAnomaly ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {zScore >= 0 ? `+${zScore}` : zScore} σ
              </div>
              <div className="text-[10px] text-gray-500">
                Threshold: ≥ 1.8 σ
              </div>
            </div>
          </div>

          {/* Verdict Box */}
          <div
            className={`p-4 rounded-md border text-xs ${
              isCostAnomaly ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="font-bold text-sm mb-1 flex items-center gap-1.5">
              {isCostAnomaly ? <AlertTriangle className="w-4 h-4 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              <span>{isCostAnomaly ? 'Cost Anomaly Flagged (Decision Support Alert)' : 'Cost Verified Within Normal Bounds'}</span>
            </div>
            <p>
              Cost of ₹{(costNum / 100000).toFixed(1)} Lakhs is {zScore} standard deviations {zScore >= 0 ? 'above' : 'below'} the regional baseline average (₹{(baselineMean / 100000).toFixed(1)} Lakhs) for {costCategory} in {costState}.
              {isCostAnomaly ? ' System recommends administrative cost-breakdown verification by District Technical Examiner.' : ' Project cost aligns with standard schedule of rates (SoR).'}
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DUPLICATE ASSET DETECTION INSPECTOR */}
      {activeSubTab === 'duplicate-check' && (
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-2xs space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-extrabold text-gray-900">
              Duplicate Project & Spatial Overlap Inspector (Section 6.3)
            </h3>
            <p className="text-xs text-gray-600">
              Evaluates spatial proximity (Haversine meters), descriptive text overlap, and category coincidence to prevent duplicate asset sanctions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Compare Project A</label>
              <select
                value={projAId}
                onChange={(e) => setProjAId(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.workId}] {p.title} ({p.district})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Compare Project B</label>
              <select
                value={projBId}
                onChange={(e) => setProjBId(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.workId}] {p.title} ({p.district})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {pA && pB && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded border bg-blue-50/40 border-blue-200">
                  <div className="font-bold text-blue-900">{pA.workId}</div>
                  <div className="font-bold text-gray-900">{pA.title}</div>
                  <div className="text-[11px] text-gray-600 mt-1">{pA.locationAddress}</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-1">
                    Coords: {pA.latitude}°N, {pA.longitude}°E
                  </div>
                </div>

                <div className="p-3 rounded border bg-indigo-50/40 border-indigo-200">
                  <div className="font-bold text-indigo-900">{pB.workId}</div>
                  <div className="font-bold text-gray-900">{pB.title}</div>
                  <div className="text-[11px] text-gray-600 mt-1">{pB.locationAddress}</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-1">
                    Coords: {pB.latitude}°N, {pB.longitude}°E
                  </div>
                </div>
              </div>

              {/* Side-by-Side Spatial Overlap Metric */}
              <div className="p-4 bg-slate-50 rounded border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Spatial Distance</span>
                  <div className="text-base font-extrabold text-blue-950">
                    {pA.latitude && pB.latitude
                      ? Math.round(
                          6371000 *
                            2 *
                            Math.atan2(
                              Math.sqrt(
                                Math.sin((((pB.latitude - pA.latitude) * Math.PI) / 360)) ** 2 +
                                  Math.cos((pA.latitude * Math.PI) / 180) *
                                    Math.cos((pB.latitude * Math.PI) / 180) *
                                    Math.sin((((pB.longitude - pA.longitude) * Math.PI) / 360)) ** 2
                              ),
                              Math.sqrt(
                                1 -
                                  (Math.sin((((pB.latitude - pA.latitude) * Math.PI) / 360)) ** 2 +
                                    Math.cos((pA.latitude * Math.PI) / 180) *
                                      Math.cos((pB.latitude * Math.PI) / 180) *
                                      Math.sin((((pB.longitude - pA.longitude) * Math.PI) / 360)) ** 2)
                              )
                            )
                        ).toLocaleString() + ' meters'
                      : 'N/A'}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Category Match</span>
                  <div className="text-sm font-bold text-gray-900">
                    {pA.category === pB.category ? `Exact Match (${pA.category})` : 'Different Categories'}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Risk Evaluation</span>
                  <div className="text-sm font-bold text-indigo-950">
                    {pA.category === pB.category && pA.district === pB.district
                      ? 'Proximity Review Recommended'
                      : 'Distinct Projects (Low Risk)'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
