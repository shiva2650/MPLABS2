import React, { useState } from 'react';
import { Project, RiskAlert } from '../types/index.js';
import { RiskBadge, StatusBadge } from '../components/Badges.js';
import {
  Sparkles,
  AlertTriangle,
  Camera,
  Compass,
  Clock,
  IndianRupee,
  Layers,
  CheckCircle2,
  X,
  Eye,
  Crosshair,
  ShieldAlert,
  Activity,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { api } from '../services/api.js';

interface AiAnomaliesPageProps {
  projects: Project[];
  alerts: RiskAlert[];
  onSelectProject: (project: Project, initialTab?: any) => void;
  onOpenAlertAction: (alert: RiskAlert) => void;
}

export const AiAnomaliesPage: React.FC<AiAnomaliesPageProps> = ({
  projects,
  alerts,
  onSelectProject,
  onOpenAlertAction
}) => {
  const [activeModule, setActiveModule] = useState<'all' | 'cost' | 'duplicate' | 'photo' | 'gps' | 'delay'>('all');
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const costAnomalies = projects.filter(p => (p.riskAnalysis?.costAnomalyScore || 0) > 40 || p.riskAnalysis?.costBaseline?.isAnomaly);
  const duplicateFlags = alerts.filter(a => a.alertType === 'Possible Duplicate');
  const photoAnomalies = alerts.filter(a => a.alertType === 'Photo Anomaly');
  const locationMismatches = alerts.filter(a => a.alertType === 'Location Mismatch');
  const delayRisks = projects.filter(p => (p.riskAnalysis?.delayProbability || 0) > 50);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1B3022] text-white rounded-2xl p-6 border border-[#395C40] shadow-sm">
        <div className="flex items-center gap-2 text-[#A3B18A] text-xs font-bold uppercase tracking-wider">
          <Cpu className="w-4 h-4" />
          <span>Trainable ML Anomaly Detection & Feedback Engine</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1.5">
          AI Integrity & Anomaly Detection Center
        </h1>
        <p className="text-xs text-[#DDE5D4] mt-1 max-w-3xl leading-relaxed">
          Isolation Forest ensemble coupled with predictive S-curve delay regression and multi-factor duplicate work detection. Human review verdicts (False Positive / Confirmed Anomaly) continuously retrain the model weights.
        </p>
      </div>

      {/* Module Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveModule('all')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
            activeModule === 'all' ? 'bg-[#1B3022] text-white shadow-xs' : 'bg-white text-[#588157] border border-[#DDE5D4]'
          }`}
        >
          All Modules Overview
        </button>
        <button
          onClick={() => setActiveModule('cost')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeModule === 'cost' ? 'bg-[#1B3022] text-white shadow-xs' : 'bg-white text-[#588157] border border-[#DDE5D4]'
          }`}
        >
          <IndianRupee className="w-3.5 h-3.5 text-[#935D26]" />
          <span>1. Cost Anomalies ({costAnomalies.length})</span>
        </button>
        <button
          onClick={() => setActiveModule('duplicate')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeModule === 'duplicate' ? 'bg-[#1B3022] text-white shadow-xs' : 'bg-white text-[#588157] border border-[#DDE5D4]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#395C40]" />
          <span>2. Duplicate Works ({duplicateFlags.length})</span>
        </button>
        <button
          onClick={() => setActiveModule('photo')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeModule === 'photo' ? 'bg-[#1B3022] text-white shadow-xs' : 'bg-white text-[#588157] border border-[#DDE5D4]'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-[#588157]" />
          <span>3. Photo & GPS Verification ({photoAnomalies.length + locationMismatches.length})</span>
        </button>
        <button
          onClick={() => setActiveModule('delay')}
          className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeModule === 'delay' ? 'bg-[#1B3022] text-white shadow-xs' : 'bg-white text-[#588157] border border-[#DDE5D4]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-[#935D26]" />
          <span>4. Delay & Cost-Overrun Forecast ({delayRisks.length})</span>
        </button>
      </div>

      {/* MODULE 1: COST ANOMALY */}
      {(activeModule === 'all' || activeModule === 'cost') && (
        <section className="bg-white rounded-2xl border border-[#DDE5D4] shadow-xs overflow-hidden">
          <div className="px-5 py-4 bg-[#FDFDFB] border-b border-[#DDE5D4] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1B3022] flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-[#935D26]" />
              <span>Cost Anomaly Detection (Statistical Z-Score + ML Isolation Index)</span>
            </h2>
            <span className="text-xs font-bold px-2.5 py-1 bg-[#FAF3E0] text-[#935D26] rounded-full border border-[#E8DAB2]">
              {costAnomalies.length} Flagged
            </span>
          </div>
          <div className="p-5 space-y-4">
            {costAnomalies.map(project => (
              <div key={project.id} className="p-4 rounded-xl border border-[#E8DAB2] bg-[#FAF3E0]/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#1B3022]">{project.projectCode}</span>
                    <StatusBadge status={project.status} />
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FDF0EC] text-[#B85338]">
                      Z-Score: +{project.riskAnalysis?.costBaseline?.zScore || 2.1}σ
                    </span>
                  </div>
                  <div className="font-bold text-[#1B3022] text-sm">{project.title}</div>
                  <div className="text-[11px] p-2 bg-white rounded-lg border border-[#E8DAB2] text-[#935D26]">
                    {project.riskAnalysis?.costBaseline?.reason || 'Proposed budget significantly exceeds regional benchmark.'}
                  </div>
                </div>
                <div className="flex md:flex-col items-end gap-2 shrink-0">
                  <RiskBadge level={project.riskAnalysis?.riskLevel || 'LOW'} score={project.riskAnalysis?.overallScore || 20} />
                  <button onClick={() => onSelectProject(project, 'ai-risk')} className="px-3 py-1.5 bg-[#395C40] text-white rounded-lg font-bold cursor-pointer hover:bg-[#2C4A34]">
                    Audit BOQ & Duplicates
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MODULE 2: DUPLICATE WORKS */}
      {(activeModule === 'all' || activeModule === 'duplicate') && (
        <section className="bg-white rounded-2xl border border-[#DDE5D4] shadow-xs overflow-hidden">
          <div className="px-5 py-4 bg-[#FDFDFB] border-b border-[#DDE5D4] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1B3022] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#395C40]" />
              <span>Duplicate Work Detection (Geospatial Proximity + Description + Overlapping Windows)</span>
            </h2>
            <span className="text-xs font-bold px-2.5 py-1 bg-[#EAF0E6] text-[#395C40] rounded-full border border-[#C8D5B9]">
              {duplicateFlags.length} Pairs Flagged
            </span>
          </div>
          <div className="p-5 space-y-3">
            {duplicateFlags.map(alert => (
              <div key={alert.id} className="p-4 bg-[#F8F9F7] rounded-xl border border-[#DDE5D4] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-mono font-bold text-[#588157]">{alert.projectCode}</span>
                  <div className="font-bold text-[#1B3022] text-sm">{alert.projectTitle}</div>
                  <p className="text-[11px] text-gray-600">{alert.reason}</p>
                </div>
                <button onClick={() => onOpenAlertAction(alert)} className="px-3 py-1.5 bg-[#395C40] text-white rounded-lg font-bold shrink-0 hover:bg-[#2C4A34] cursor-pointer">
                  Adjudicate Alert
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MODULE 3: DELAY & OVERRUN FORECASTING */}
      {(activeModule === 'all' || activeModule === 'delay') && (
        <section className="bg-white rounded-2xl border border-[#DDE5D4] shadow-xs overflow-hidden">
          <div className="px-5 py-4 bg-[#FDFDFB] border-b border-[#DDE5D4] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1B3022] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#935D26]" />
              <span>Predictive Delay & Cost-Overrun Forecasting Model (CPWD Escalation Regression)</span>
            </h2>
            <span className="text-xs font-bold px-2.5 py-1 bg-[#FAF3E0] text-[#935D26] rounded-full border border-[#E8DAB2]">
              {delayRisks.length} Overruns Predicted
            </span>
          </div>
          <div className="p-5 space-y-3">
            {delayRisks.map(project => (
              <div key={project.id} onClick={() => onSelectProject(project, 'ai-risk')} className="p-3.5 rounded-xl border border-[#DDE5D4] hover:bg-[#F8F9F7] cursor-pointer flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#1B3022]">{project.projectCode}</span>
                    <StatusBadge status={project.status} />
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#FAF3E0] text-[#935D26] font-bold">
                      {project.riskAnalysis?.delayProbability}% Delay Risk
                    </span>
                  </div>
                  <div className="font-bold text-[#1B3022] text-sm mt-0.5">{project.title}</div>
                  <div className="text-[11px] text-[#588157]">
                    Forecast: {project.riskAnalysis?.delayMetrics?.confidenceInterval || '85% confidence'} •
                    {project.riskAnalysis?.delayMetrics?.costOverrunForecast && (
                      <span className="text-[#B85338] font-bold ml-1">
                        Overrun: ₹{project.riskAnalysis.delayMetrics.costOverrunForecast.projectedCostOverrunLakhs}L
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <RiskBadge level={project.riskAnalysis?.riskLevel || 'LOW'} score={project.riskAnalysis?.overallScore || 20} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
