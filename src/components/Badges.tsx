import React from 'react';
import { RiskLevel, ProjectStatus, AlertStatus } from '../types/index.js';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.js';

export type VerificationState = 'Verified' | 'Under Review' | 'Flagged';

/**
 * Public-friendly simple Verification Badge (Verified / Under Review / Flagged)
 * Clean, official styling without raw AI confidence scores.
 */
export const VerificationBadge: React.FC<{
  status?: VerificationState | string;
  className?: string;
}> = ({ status = 'Verified', className = '' }) => {
  const { translateVerificationState } = useLanguage();

  let normalizedStatus: VerificationState = 'Verified';
  if (status === 'Under Review' || status === 'Pending' || status === 'In Review') {
    normalizedStatus = 'Under Review';
  } else if (status === 'Flagged' || status === 'High Risk' || status === 'Critical' || status === 'Rejected') {
    normalizedStatus = 'Flagged';
  }

  const configs: Record<VerificationState, { bg: string; text: string; border: string; icon: any }> = {
    'Verified': {
      bg: 'bg-panel-bg text-status-verified border-status-verified/30',
      text: 'text-status-verified',
      border: 'border-status-verified/30',
      icon: CheckCircle2
    },
    'Under Review': {
      bg: 'bg-panel-bg text-status-review border-status-review/30',
      text: 'text-status-review',
      border: 'border-status-review/30',
      icon: Clock
    },
    'Flagged': {
      bg: 'bg-panel-bg text-status-flagged border-status-flagged/30',
      text: 'text-status-flagged',
      border: 'border-status-flagged/30',
      icon: AlertTriangle
    }
  };

  const config = configs[normalizedStatus];
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${className}`}
    >
      <IconComponent className="w-3.5 h-3.5 shrink-0" />
      <span>{translateVerificationState(normalizedStatus)}</span>
    </span>
  );
};

export const RiskBadge: React.FC<{
  level: RiskLevel;
  score?: number;
  showIcon?: boolean;
  publicView?: boolean;
}> = ({ level, score, showIcon = true, publicView = false }) => {
  const { translateRiskLevel } = useLanguage();

  // In public view, convert to plain language without raw algorithmic scores
  if (publicView) {
    if (level === 'LOW') {
      return <VerificationBadge status="Verified" />;
    } else if (level === 'MEDIUM') {
      return <VerificationBadge status="Under Review" />;
    } else {
      return <VerificationBadge status="Flagged" />;
    }
  }

  const configs: Record<RiskLevel, { bg: string; text: string; border: string; icon: any }> = {
    LOW: {
      bg: 'bg-panel-bg text-status-verified border-status-verified/30',
      text: 'text-status-verified',
      border: 'border-status-verified/30',
      icon: ShieldCheck
    },
    MEDIUM: {
      bg: 'bg-panel-bg text-status-review border-status-review/30',
      text: 'text-status-review',
      border: 'border-status-review/30',
      icon: AlertTriangle
    },
    HIGH: {
      bg: 'bg-panel-bg text-status-flagged border-status-flagged/30',
      text: 'text-status-flagged',
      border: 'border-status-flagged/30',
      icon: ShieldAlert
    },
    CRITICAL: {
      bg: 'bg-panel-bg text-status-flagged border-status-flagged/50',
      text: 'text-status-flagged',
      border: 'border-status-flagged/50',
      icon: ShieldAlert
    }
  };

  const config = configs[level] || configs.LOW;
  const IconComponent = config.icon;
  const label = translateRiskLevel(level);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}
      title={`Review Status: ${label} ${score !== undefined ? `(Index: ${score})` : ''}`}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>
        {label}
        {score !== undefined && (
          <span className="opacity-80 text-[11px] ml-1 font-semibold">({score})</span>
        )}
      </span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const { translateStatus } = useLanguage();

  const statusStyles: Record<ProjectStatus, string> = {
    'Recommended': 'bg-panel-bg text-slate-body border-slate-border',
    'Under Review': 'bg-panel-bg text-status-review border-status-review/30',
    'Sanctioned': 'bg-panel-bg text-govt-navy border-slate-border font-semibold',
    'Assigned': 'bg-panel-bg text-govt-navy-light border-slate-border',
    'Ongoing': 'bg-panel-bg text-govt-navy border-slate-border',
    'Delayed': 'bg-panel-bg text-status-flagged border-status-flagged/30 font-medium',
    'Completed': 'bg-panel-bg text-govt-navy border-slate-border font-semibold',
    'Rejected': 'bg-panel-bg text-slate-muted border-slate-border'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
        statusStyles[status] || 'bg-panel-bg text-slate-body border-slate-border'
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 shrink-0" />
      {translateStatus(status)}
    </span>
  );
};

export const AlertBadge: React.FC<{ status: AlertStatus }> = ({ status }) => {
  const { translateAlertStatus } = useLanguage();

  const styles: Record<AlertStatus, string> = {
    'New': 'bg-panel-bg text-status-flagged border-status-flagged/30 font-semibold',
    'Under Review': 'bg-panel-bg text-status-review border-status-review/30',
    'Escalated': 'bg-panel-bg text-status-flagged border-status-flagged/40 font-semibold',
    'Resolved': 'bg-panel-bg text-govt-navy border-slate-border font-semibold',
    'False Positive': 'bg-panel-bg text-slate-muted border-slate-border'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${styles[status] || 'bg-panel-bg text-slate-body border-slate-border'}`}>
      {translateAlertStatus(status)}
    </span>
  );
};
