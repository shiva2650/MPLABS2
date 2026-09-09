import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Upload,
  Database,
  Calculator,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  Lock,
  Unlock,
  Building,
  Info,
  Layers,
  ArrowUpRight,
  ArrowLeft
} from 'lucide-react';

interface DataIngestionImpactPageProps {
  onBackToDashboard?: () => void;
}

export const DataIngestionImpactPage: React.FC<DataIngestionImpactPageProps> = ({ onBackToDashboard }) => {
  const { user, role } = useAuth();
  const [impactData, setImpactData] = useState<any | null>(null);
  const [loadingImpact, setLoadingImpact] = useState<boolean>(true);

  // Ingestion state
  const [ingesting, setIngesting] = useState<boolean>(false);
  const [qualityReport, setQualityReport] = useState<any | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Security Demo & Tamper Simulation state
  const [tampering, setTampering] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [tamperActiveState, setTamperActiveState] = useState<any | null>(null);

  const fetchImpactSummary = async () => {
    setLoadingImpact(true);
    try {
      const res = await api.getImpactSummary();
      setImpactData(res);
    } catch (err) {
      console.error('Failed to load impact metrics:', err);
    } finally {
      setLoadingImpact(false);
    }
  };

  useEffect(() => {
    fetchImpactSummary();
  }, []);

  // Demo CSV for one-click ingestion
  const sampleCsvData = `Project Code,Title,Category,District,Sanctioned Amount,MP Name,Latitude,Longitude,Sanction Date,Vendor PAN
MPLADS-TS-2024-0091,Construction of Anganwadi Center in Ward 8,Education & Child Welfare,Hyderabad,1850000,Shri Rajesh Kumar,17.4125,78.4890,2024-02-15,AABCS8891K
MPLADS-TS-2024-0092,Installation of Solar High-Mast Lights,Rural & Urban Electrification,Hyderabad,1200000,Shri Rajesh Kumar,17.4201,78.4950,2024-02-18,AABCS8891K
MPLADS-TS-2024-0093,Upgradation of Primary Health Sub-Center,Public Health & Sanitation,Hyderabad,2800000,Shri Rajesh Kumar,17.3950,78.4720,2024-03-01,BBXCP9921M
MPLADS-TS-2024-0094,Construction of Cement Concrete Drainage,Sanitation & Water,Hyderabad,1500000,Shri Rajesh Kumar,17.3880,78.4610,2024-03-10,CCYDM4412P
MPLADS-TS-2024-0095,Community Hall & Skill Development Center,Community Infrastructure,Hyderabad,4500000,Shri Rajesh Kumar,17.4350,78.5120,2024-03-25,AABCS8891K`;

  const handleIngestSampleData = async () => {
    setIngesting(true);
    setImportSuccessMessage(null);
    try {
      const res = await api.ingestData(sampleCsvData, 'MoSPI Official Batch Export 2024');
      setQualityReport(res.qualityReport);
      setImportSuccessMessage(`Successfully ingested ${res.importedCount} records via data overlay!`);
      fetchImpactSummary();
    } catch (err: any) {
      console.error('Ingestion failed:', err);
    } finally {
      setIngesting(false);
    }
  };

  const handleSimulateTamper = async () => {
    setTampering(true);
    setVerificationResult(null);
    try {
      const res = await api.simulateTamper();
      setTamperActiveState(res.result);
    } catch (err: any) {
      console.error('Tamper simulation error:', err);
    } finally {
      setTampering(false);
    }
  };

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyAuditLogsIntegrity();
      setVerificationResult(res);
    } catch (err: any) {
      console.error('Verification error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleRestoreChain = async () => {
    try {
      await api.restoreAuditLogs();
      setTamperActiveState(null);
      setVerificationResult(null);
    } catch (err: any) {
      console.error('Restore error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Persistent Back Button */}
      {onBackToDashboard && (
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-govt-navy bg-white border border-slate-border hover:bg-panel-bg rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Overview</span>
          </button>
          <span className="text-xs text-slate-muted">
            Dashboard &gt; Data Ingestion
          </span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-border p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-govt-navy text-white shrink-0">
              <Calculator className="w-6 h-6 text-panel-bg/80" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-body">
                  Data Ingestion & Executive Impact Metrics
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-govt-navy font-semibold border border-emerald-200">
                  data.gov.in & Official Data Adapter
                </span>
              </div>
              <p className="text-xs text-slate-muted mt-0.5 max-w-3xl">
                Operates as an intelligence and forensic verification overlay sitting atop government systems of record. Ingests public batch data, audits missing GPS tags, and computes verified potential savings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleIngestSampleData}
              disabled={ingesting}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-govt-navy hover:bg-govt-navy-light disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              <Upload className={`w-3.5 h-3.5 ${ingesting ? 'animate-spin' : ''}`} />
              <span>{ingesting ? 'Ingesting...' : 'Ingest Sample Data Batch'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Executive Impact Metrics Calculator Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-body">
            Executive Pitch & Impact Metrics (Pitch Deliverables)
          </h2>
          <span className="text-[11px] text-slate-muted">Live Real-Time Calculations</span>
        </div>

        {impactData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Total Flagged Value */}
            <div className="bg-white p-4 rounded-xl border border-slate-border shadow-xs">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-medium">Total High-Risk Flagged</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-600 mt-1.5">
                ₹{impactData.totalFlaggedAmountCr} Cr
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                {impactData.totalFlaggedProjects} works flagged ({impactData.flaggedPercentage}% of catalog)
              </div>
            </div>

            {/* Metric 2: Estimated Potential Savings */}
            <div className="bg-white p-4 rounded-xl border border-status-verified/30 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-500/20">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-semibold text-status-verified">Estimated Potential Savings</span>
                <CheckCircle2 className="w-4 h-4 text-status-verified" />
              </div>
              <div className="text-2xl font-bold text-slate-body mt-1.5">
                ₹{impactData.estimatedPotentialSavingsCr} Cr
              </div>
              <div className="text-[11px] text-slate-muted mt-1">
                Disbursement-vs-physical disparity
              </div>
            </div>

            {/* Metric 3: Highest Risk District */}
            <div className="bg-white p-4 rounded-xl border border-slate-border shadow-xs">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-medium">Highest Risk District</span>
                <Building className="w-4 h-4 text-gray-500" />
              </div>
              <div className="text-lg font-bold text-slate-body mt-1.5">
                {impactData.highestRiskDistrict.district}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                {impactData.highestRiskDistrict.flaggedCount} flagged works (₹{impactData.highestRiskDistrict.totalCr} Cr)
              </div>
            </div>

            {/* Metric 4: Total Monitored Portfolio */}
            <div className="bg-white p-4 rounded-xl border border-slate-border shadow-xs">
              <div className="flex items-center justify-between text-gray-500">
                <span className="text-xs font-medium">Active Ingested Works</span>
                <Database className="w-4 h-4 text-gray-500" />
              </div>
              <div className="text-2xl font-bold text-slate-body mt-1.5">
                {impactData.totalLoadedProjects}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                Cumulative value: ₹{impactData.totalSanctionedAmountCr} Cr
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-white rounded-xl text-center text-gray-500">Loading impact metrics...</div>
        )}

        {impactData?.methodologyNote && (
          <div className="bg-panel-bg p-3 rounded-lg border border-slate-border text-xs text-slate-muted flex items-start gap-2">
            <Info className="w-4 h-4 text-govt-navy shrink-0 mt-0.5" />
            <span>{impactData.methodologyNote}</span>
          </div>
        )}
      </div>

      {/* 2. Data Ingestion Quality Audit Report */}
      {qualityReport && (
        <div className="bg-white rounded-xl border border-slate-border p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-body">
              Ingestion Data Quality Audit
            </h3>
            <span className="text-xs font-bold text-status-verified bg-emerald-50 px-2.5 py-0.5 rounded-full border border-status-verified/30">
              Overall Quality Score: {qualityReport.overallDataQualityScore}/100
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-panel-bg rounded-lg border border-slate-border">
              <span className="text-[11px] text-gray-500">GPS Coordinate Completeness</span>
              <div className="text-base font-bold text-slate-body mt-0.5">
                {qualityReport.gpsCompletenessPct}%
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-govt-navy h-full" style={{ width: `${qualityReport.gpsCompletenessPct}%` }} />
              </div>
            </div>

            <div className="p-3 bg-panel-bg rounded-lg border border-slate-border">
              <span className="text-[11px] text-gray-500">Sanction Order Date Completeness</span>
              <div className="text-base font-bold text-slate-body mt-0.5">
                {qualityReport.sanctionDateCompletenessPct}%
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-govt-navy h-full" style={{ width: `${qualityReport.sanctionDateCompletenessPct}%` }} />
              </div>
            </div>

            <div className="p-3 bg-panel-bg rounded-lg border border-slate-border">
              <span className="text-[11px] text-gray-500">Vendor PAN Tagging</span>
              <div className="text-base font-bold text-slate-body mt-0.5">
                {qualityReport.vendorPanCompletenessPct}%
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-govt-navy h-full" style={{ width: `${qualityReport.vendorPanCompletenessPct}%` }} />
              </div>
            </div>
          </div>

          {importSuccessMessage && (
            <div className="text-xs text-status-verified font-semibold flex items-center gap-1.5 mt-2">
              <CheckCircle2 className="w-4 h-4 text-status-verified" />
              <span>{importSuccessMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Live Security Proof & Cryptographic Audit Verification */}
      <div className="bg-white rounded-xl border border-slate-border p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-govt-navy" />
              <h3 className="text-sm font-bold text-slate-body uppercase tracking-wider">
                Live Security Proof: Cryptographic Hash-Chain Tamper Detection
              </h3>
            </div>
            <p className="text-xs text-slate-muted mt-0.5">
              Continuous cryptographic audit trail demonstrating SHA-256 block hash chaining and zero-trust audit integrity.
            </p>
          </div>

          {/* Active Session Role Clearance Badge */}
          <div className="flex items-center gap-2 bg-panel-bg px-3 py-1.5 rounded-lg border border-slate-border">
            <span className="text-[11px] font-bold text-slate-muted">Security Clearance:</span>
            <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-govt-navy text-white font-mono">
              {role}
            </span>
          </div>
        </div>

        {/* Tamper Simulation Action Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg border border-slate-border bg-panel-bg space-y-2">
            <span className="text-xs font-bold text-slate-body">Step 1: Simulate Attack</span>
            <p className="text-[11px] text-gray-600">
              Alters an existing approved transaction in memory directly without recomputing its SHA-256 hash or prevHash.
            </p>
            <button
              onClick={handleSimulateTamper}
              disabled={tampering}
              className="w-full py-2 px-3 rounded-md text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {tampering ? 'Mutating Memory...' : 'Simulate Unauthorized Mutation'}
            </button>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-border bg-panel-bg space-y-2">
            <span className="text-xs font-bold text-slate-body">Step 2: Run Cryptographic Audit</span>
            <p className="text-[11px] text-gray-600">
              Iterates chronological blocks verifying <code>H(prevHash | payload) == entryHash</code>.
            </p>
            <button
              onClick={handleVerifyChain}
              disabled={verifying}
              className="w-full py-2 px-3 rounded-md text-xs font-bold text-white bg-govt-navy hover:bg-govt-navy-light transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {verifying ? 'Verifying Hashes...' : 'Verify Cryptographic Integrity'}
            </button>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-border bg-panel-bg space-y-2">
            <span className="text-xs font-bold text-slate-body">Step 3: Restore Ledger</span>
            <p className="text-[11px] text-gray-600">
              Restores the pristine tamper-evident audit ledger from verified cryptographic state.
            </p>
            <button
              onClick={handleRestoreChain}
              className="w-full py-2 px-3 rounded-md text-xs font-bold text-slate-body bg-white border border-slate-border hover:bg-gray-50 transition-colors cursor-pointer shadow-xs"
            >
              Restore Pristine Chain
            </button>
          </div>
        </div>

        {/* Verification Status Result Display */}
        {verificationResult && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              verificationResult.isValid
                ? 'bg-emerald-50 border-status-verified/30 text-status-verified'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {verificationResult.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-status-verified shrink-0 mt-0.5" />
            ) : (
              <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-sm">
                {verificationResult.isValid
                  ? `Cryptographic Audit Passed: All ${verificationResult.verifiedCount} Blocks Validated`
                  : `TAMPER DETECTED: Hash Chain Broken at Entry ${verificationResult.brokenAtId}`}
              </div>
              <p className="text-xs mt-1 opacity-90">
                {verificationResult.isValid
                  ? `Every administrative action is immutably linked with 256-bit SHA-256 hashes originating from ${verificationResult.genesisHash}.`
                  : `The recomputed SHA-256 hash does not match stored block signature, proving unauthorized database modification.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
