import React, { useState, useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Project } from '../types/index.js';
import { ShieldCheck, AlertTriangle, Layers, Building2, HelpCircle } from 'lucide-react';
import { PlainTooltip } from './PlainTooltip.js';
import { themeTokens } from '../utils/themeTokens.js';

interface RadarVisualizerProps {
  projects: Project[];
  className?: string;
  defaultMode?: 'CONSTITUENCY' | 'PROJECT' | 'RISK_BREAKDOWN' | 'CONTRACTOR_RISK';
}

export const RadarVisualizer: React.FC<RadarVisualizerProps> = ({
  projects = [],
  className = '',
  defaultMode = 'CONSTITUENCY'
}) => {
  const [activeMode, setActiveMode] = useState<
    'CONSTITUENCY' | 'PROJECT' | 'RISK_BREAKDOWN' | 'CONTRACTOR_RISK'
  >(defaultMode);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return projects.length > 0 ? projects[0].id : '';
  });

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  // 1. Constituency Multi-Metric Comparison Radar Data
  const constituencyRadarData = useMemo(() => {
    return [
      {
        axis: 'Sanction Rate %',
        'Hyderabad North': 92,
        'Secunderabad': 88,
        'Hyderabad South': 78,
        fullMark: 100
      },
      {
        axis: 'Utilized %',
        'Hyderabad North': 76,
        'Secunderabad': 82,
        'Hyderabad South': 64,
        fullMark: 100
      },
      {
        axis: 'Timeline Adherence',
        'Hyderabad North': 85,
        'Secunderabad': 90,
        'Hyderabad South': 70,
        fullMark: 100
      },
      {
        axis: 'Document Completeness',
        'Hyderabad North': 94,
        'Secunderabad': 96,
        'Hyderabad South': 82,
        fullMark: 100
      },
      {
        axis: 'Verification Score',
        'Hyderabad North': 90,
        'Secunderabad': 94,
        'Hyderabad South': 75,
        fullMark: 100
      }
    ];
  }, []);

  // 2. Single Project Fund & Execution Profile Radar Data
  const projectRadarData = useMemo(() => {
    if (!selectedProject) {
      return [
        { axis: 'Sanctioned %', value: 0, fullMark: 100 },
        { axis: 'Utilized %', value: 0, fullMark: 100 },
        { axis: 'Timeline Adherence', value: 0, fullMark: 100 },
        { axis: 'Document Completeness', value: 0, fullMark: 100 },
        { axis: 'Verification Score', value: 0, fullMark: 100 }
      ];
    }

    const estimated = selectedProject.estimatedCost || 1;
    const sanctioned = selectedProject.sanctionedAmount || estimated;
    const utilized = selectedProject.fundsUtilized || 0;

    const sanctionPct = Math.min(100, Math.round((sanctioned / estimated) * 100));
    const utilPct = Math.min(100, Math.round((utilized / sanctioned) * 100));
    const timeScore = selectedProject.status === 'Completed' ? 95 : Math.max(30, 100 - (selectedProject.riskAnalysis.delayProbability || 20));
    const docScore = selectedProject.documents && selectedProject.documents.length > 0 ? Math.min(100, selectedProject.documents.length * 25) : 75;
    const verificationScore = Math.max(20, 100 - selectedProject.riskAnalysis.overallScore);

    return [
      { axis: 'Sanctioned %', value: sanctionPct, fullMark: 100 },
      { axis: 'Utilized %', value: utilPct, fullMark: 100 },
      { axis: 'Timeline Adherence', value: timeScore, fullMark: 100 },
      { axis: 'Doc Completeness', value: docScore, fullMark: 100 },
      { axis: 'Verification Score', value: verificationScore, fullMark: 100 }
    ];
  }, [selectedProject]);

  // 3. Anomaly & Risk Breakdown Radar Data
  const riskRadarData = useMemo(() => {
    if (!projects || projects.length === 0) {
      return [
        { axis: 'Cost Anomaly', value: 15, benchmark: 20, fullMark: 100 },
        { axis: 'Duplicate Claim', value: 10, benchmark: 15, fullMark: 100 },
        { axis: 'Delay Risk', value: 25, benchmark: 20, fullMark: 100 },
        { axis: 'Photo Mismatch', value: 8, benchmark: 10, fullMark: 100 },
        { axis: 'Complaint Volume', value: 12, benchmark: 15, fullMark: 100 }
      ];
    }

    const avgCostRisk = Math.round(
      projects.reduce((acc, p) => acc + (p.riskAnalysis.costAnomalyScore || 0), 0) / projects.length
    );
    const avgDupRisk = Math.round(
      projects.reduce((acc, p) => acc + (p.riskAnalysis.duplicateProbability || 0), 0) / projects.length
    );
    const avgDelayRisk = Math.round(
      projects.reduce((acc, p) => acc + (p.riskAnalysis.delayProbability || 0), 0) / projects.length
    );
    const avgPhotoRisk = Math.round(
      projects.reduce((acc, p) => acc + (p.riskAnalysis.photoAnomalyScore || 0), 0) / projects.length
    );

    return [
      { axis: 'Cost Anomaly', value: Math.min(100, avgCostRisk * 1.4), benchmark: 20, fullMark: 100 },
      { axis: 'Duplicate Claim', value: Math.min(100, avgDupRisk * 1.5), benchmark: 15, fullMark: 100 },
      { axis: 'Delay Risk', value: Math.min(100, avgDelayRisk * 1.2), benchmark: 25, fullMark: 100 },
      { axis: 'Photo Mismatch', value: Math.min(100, avgPhotoRisk * 1.6), benchmark: 10, fullMark: 100 },
      { axis: 'Complaint Volume', value: 28, benchmark: 20, fullMark: 100 }
    ];
  }, [projects]);

  // 4. Contractor & Entity Risk Profile Radar
  const contractorRadarData = useMemo(() => {
    return [
      { axis: 'Shared Contractors', 'Flagged Cluster': 85, 'State Average': 25, fullMark: 100 },
      { axis: 'Transaction Overlap', 'Flagged Cluster': 78, 'State Average': 20, fullMark: 100 },
      { axis: 'Geographic Cluster', 'Flagged Cluster': 90, 'State Average': 35, fullMark: 100 },
      { axis: 'Past Audit Flags', 'Flagged Cluster': 65, 'State Average': 15, fullMark: 100 },
      { axis: 'Bid Frequency Risk', 'Flagged Cluster': 82, 'State Average': 30, fullMark: 100 }
    ];
  }, []);

  return (
    <div className={`bg-white rounded-xl border border-slate-border p-5 shadow-sm space-y-4 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-govt-navy uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-govt-navy" />
              Multi-Metric Radar Performance Profile
            </span>
            <PlainTooltip
              term="Radar Chart"
              explanation="A radar chart displays multiple dimensions of performance simultaneously, allowing quick comparison across funding, timeliness, and audit status."
            />
          </div>
          <p className="text-xs text-slate-muted mt-0.5">
            Holistic multi-dimensional analysis comparing execution, utilization, and vigilance metrics.
          </p>
        </div>

        {/* View Selection Tabs */}
        <div className="flex items-center flex-wrap gap-1 bg-panel-bg p-1 rounded-lg border border-slate-border text-xs">
          <button
            onClick={() => setActiveMode('CONSTITUENCY')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeMode === 'CONSTITUENCY'
                ? 'bg-govt-navy text-white font-semibold shadow-xs'
                : 'text-slate-body hover:text-govt-navy'
            }`}
          >
            Constituency Comparison
          </button>
          <button
            onClick={() => setActiveMode('PROJECT')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeMode === 'PROJECT'
                ? 'bg-govt-navy text-white font-semibold shadow-xs'
                : 'text-slate-body hover:text-govt-navy'
            }`}
          >
            Project Profile
          </button>
          <button
            onClick={() => setActiveMode('RISK_BREAKDOWN')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeMode === 'RISK_BREAKDOWN'
                ? 'bg-govt-navy text-white font-semibold shadow-xs'
                : 'text-slate-body hover:text-govt-navy'
            }`}
          >
            Vigilance Risk Breakdown
          </button>
          <button
            onClick={() => setActiveMode('CONTRACTOR_RISK')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              activeMode === 'CONTRACTOR_RISK'
                ? 'bg-govt-navy text-white font-semibold shadow-xs'
                : 'text-slate-body hover:text-govt-navy'
            }`}
          >
            Contractor Risk Profile
          </button>
        </div>
      </div>

      {/* Sub-selectors (e.g. project dropdown if in project mode) */}
      {activeMode === 'PROJECT' && projects.length > 0 && (
        <div className="flex items-center gap-2 text-xs bg-panel-bg p-2.5 rounded-lg border border-slate-border">
          <span className="font-semibold text-slate-body shrink-0">Select Project:</span>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="flex-1 bg-white border border-slate-border rounded px-2.5 py-1.5 text-xs text-slate-body focus:outline-hidden focus:ring-1 focus:ring-govt-navy"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.projectCode || p.id}) — {p.constituency}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Radar Chart Display Container */}
      <div className="w-full h-80 sm:h-96 flex items-center justify-center relative">
        {activeMode === 'CONSTITUENCY' && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={constituencyRadarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke={themeTokens.slateBorder} />
              <PolarAngleAxis dataKey="axis" stroke={themeTokens.slateBody} tick={{ fill: themeTokens.slateBody, fontSize: 11, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={themeTokens.slateBorder} tick={{ fill: themeTokens.slateMuted, fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: themeTokens.white,
                  borderColor: themeTokens.slateBorder,
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(11, 61, 102, 0.1)',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Radar
                name="Hyderabad North"
                dataKey="Hyderabad North"
                stroke={themeTokens.govtNavy}
                fill={themeTokens.govtNavy}
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Radar
                name="Secunderabad"
                dataKey="Secunderabad"
                stroke={themeTokens.statusVerified}
                fill={themeTokens.statusVerified}
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Radar
                name="Hyderabad South"
                dataKey="Hyderabad South"
                stroke={themeTokens.govtSaffron}
                fill={themeTokens.govtSaffron}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}

        {activeMode === 'PROJECT' && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={projectRadarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke={themeTokens.slateBorder} />
              <PolarAngleAxis dataKey="axis" stroke={themeTokens.slateBody} tick={{ fill: themeTokens.slateBody, fontSize: 11, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={themeTokens.slateBorder} tick={{ fill: themeTokens.slateMuted, fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: themeTokens.white,
                  borderColor: themeTokens.slateBorder,
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(11, 61, 102, 0.1)',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Radar
                name={selectedProject?.title || 'Selected Project'}
                dataKey="value"
                stroke={themeTokens.govtNavy}
                fill={themeTokens.govtNavy}
                fillOpacity={0.45}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}

        {activeMode === 'RISK_BREAKDOWN' && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={riskRadarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke={themeTokens.slateBorder} />
              <PolarAngleAxis dataKey="axis" stroke={themeTokens.slateBody} tick={{ fill: themeTokens.slateBody, fontSize: 11, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={themeTokens.slateBorder} tick={{ fill: themeTokens.slateMuted, fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: themeTokens.white,
                  borderColor: themeTokens.slateBorder,
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(11, 61, 102, 0.1)',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Radar
                name="Current Risk Index"
                dataKey="value"
                stroke={themeTokens.statusFlagged}
                fill={themeTokens.statusFlagged}
                fillOpacity={0.35}
                strokeWidth={2}
              />
              <Radar
                name="Acceptable Benchmark"
                dataKey="benchmark"
                stroke={themeTokens.statusVerified}
                fill={themeTokens.statusVerified}
                fillOpacity={0.15}
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            </RadarChart>
          </ResponsiveContainer>
        )}

        {activeMode === 'CONTRACTOR_RISK' && (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={contractorRadarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke={themeTokens.slateBorder} />
              <PolarAngleAxis dataKey="axis" stroke={themeTokens.slateBody} tick={{ fill: themeTokens.slateBody, fontSize: 11, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={themeTokens.slateBorder} tick={{ fill: themeTokens.slateMuted, fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: themeTokens.white,
                  borderColor: themeTokens.slateBorder,
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(11, 61, 102, 0.1)',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Radar
                name="Flagged Entity Risk Vector"
                dataKey="Flagged Cluster"
                stroke={themeTokens.statusReview}
                fill={themeTokens.statusReview}
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Radar
                name="State Average Baseline"
                dataKey="State Average"
                stroke={themeTokens.govtNavy}
                fill={themeTokens.govtNavy}
                fillOpacity={0.15}
                strokeWidth={2}
                strokeDasharray="3 3"
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Informational Guidance Footer */}
      <div className="bg-panel-bg rounded-lg p-3 border border-slate-border text-xs text-slate-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-verified" />
          <span>
            {activeMode === 'CONSTITUENCY' && 'Balanced outer boundaries indicate consistent fund utilization and on-time delivery.'}
            {activeMode === 'PROJECT' && 'Larger area coverage represents higher sanction execution, complete documentation, and verified status.'}
            {activeMode === 'RISK_BREAKDOWN' && 'Spikes beyond the green dashed benchmark flag areas requiring district administrative review.'}
            {activeMode === 'CONTRACTOR_RISK' && 'Public summary risk profile replaces complex graph forensics with clear multi-factor scores.'}
          </span>
        </div>
        <span className="text-[11px] font-medium text-govt-navy">
          Normalized to 0–100% scale &bull; MoSPI Standards
        </span>
      </div>
    </div>
  );
};
