import React from 'react';

export type BadgeType =
  | 'Completed'
  | 'Ongoing'
  | 'In Progress'
  | 'Delayed'
  | 'Recommended'
  | 'Under Review'
  | 'Sanctioned'
  | 'Rejected'
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Critical'
  | 'Submitted'
  | 'Investigating'
  | 'Resolved'
  | 'Escalated'
  | 'False Positive'
  | 'Valid'
  | 'Scheduled'
  | 'Adverse Findings'
  | string;

interface StatusBadgeProps {
  status: BadgeType;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', className = '' }) => {
  const norm = (status || '').toLowerCase().trim();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  // Positive / Completed / Resolved
  if (norm === 'completed' || norm === 'resolved' || norm === 'valid' || norm === 'low') {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  // Active / Ongoing / In Progress / Sanctioned
  else if (norm === 'ongoing' || norm === 'in progress' || norm === 'work started' || norm === 'sanctioned') {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
  }
  // Warning / Delayed / Moderate
  else if (norm === 'delayed' || norm === 'moderate' || norm === 'investigating' || norm === 'needs more info') {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
  }
  // Pending / Review / Recommended
  else if (norm === 'recommended' || norm === 'under review' || norm === 'submitted' || norm === 'scheduled') {
    colorClasses = 'bg-purple-50 text-purple-800 border-purple-200';
  }
  // Danger / High / Critical / Rejected / Escalated
  else if (norm === 'high' || norm === 'critical' || norm === 'rejected' || norm === 'escalated' || norm === 'adverse findings') {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
  }

  const sizeClasses =
    size === 'xs'
      ? 'text-[10px] px-1.5 py-0.5'
      : size === 'md'
      ? 'text-xs px-2.5 py-1'
      : 'text-[11px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded border ${sizeClasses} ${colorClasses} ${className}`}
    >
      {status}
    </span>
  );
};
