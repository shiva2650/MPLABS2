import React from 'react';
import { RiskLevel, ProjectStatus, AlertStatus } from '../types/index.js';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertOctagon, Clock } from 'lucide-react';

export const RiskBadge: React.FC<{ level: RiskLevel; score?: number; showIcon?: boolean }> = ({
  level,
  score,
  showIcon = true
}) => {
  const configs: Record<RiskLevel, { bg: string; text: string; border: string; icon: any }> = {
    LOW: {
      bg: 'bg-[#EAF0E6] text-[#263D2E] border-[#C8D5B9]',
      text: 'text-[#263D2E]',
      border: 'border-[#C8D5B9]',
      icon: ShieldCheck
    },
    MEDIUM: {
      bg: 'bg-[#FAF3E0] text-[#935D26] border-[#E8DAB2]',
      text: 'text-[#935D26]',
      border: 'border-[#E8DAB2]',
      icon: AlertTriangle
    },
    HIGH: {
      bg: 'bg-[#FDF0EC] text-[#B85338] border-[#F5C2B4]',
      text: 'text-[#B85338]',
      border: 'border-[#F5C2B4]',
      icon: ShieldAlert
    },
    CRITICAL: {
      bg: 'bg-[#FBE8E4] text-[#A62B17] border-[#E07A5F] animate-pulse',
      text: 'text-[#A62B17]',
      border: 'border-[#E07A5F]',
      icon: AlertOctagon
    }
  };

  const config = configs[level] || configs.LOW;
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}
      title={`AI Computed Risk: ${level} ${score !== undefined ? `(${score}/100)` : ''}`}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>
        {level} {score !== undefined && <span className="opacity-85 font-mono text-[11px] ml-0.5 font-bold">({score})</span>}
      </span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const statusStyles: Record<string, string> = {
    'Draft': 'bg-gray-100 text-gray-700 border-gray-300',
    'Recommended': 'bg-[#EDEFEA] text-[#395C40] border-[#C8D5B9]',
    'Under Review': 'bg-[#F7F2E7] text-[#8F6827] border-[#E8DAB2]',
    'Feasibility Review': 'bg-[#FAF3E0] text-[#935D26] border-[#E8DAB2]',
    'Forwarded To State': 'bg-purple-50 text-purple-800 border-purple-200 font-semibold',
    'State Approved': 'bg-purple-100 text-purple-900 border-purple-300 font-semibold',
    'Forwarded To Ministry': 'bg-indigo-50 text-indigo-800 border-indigo-200 font-semibold',
    'Ministry Approved': 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold',
    'Sanctioned': 'bg-[#EAF0E6] text-[#263D2E] border-[#A3B18A]',
    'Assigned': 'bg-[#E4ECE7] text-[#2D4F37] border-[#B8CEBF]',
    'Ongoing': 'bg-[#E9EBE5] text-[#1B3022] border-[#C8D5B9]',
    'Delayed': 'bg-[#FDF0EC] text-[#B85338] border-[#F5C2B4] font-medium',
    'Completed': 'bg-[#EAF0E6] text-[#2D5A27] border-[#A3B18A] font-medium',
    'Rejected': 'bg-[#F3F4F1] text-[#617467] border-[#DDE5D4]'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
        statusStyles[status] || 'bg-[#F3F4F1] text-[#617467] border-[#DDE5D4]'
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 shrink-0" />
      {status}
    </span>
  );
};

export const AlertBadge: React.FC<{ status: AlertStatus }> = ({ status }) => {
  const styles: Record<string, string> = {
    'New': 'bg-[#FDF0EC] text-[#B85338] border-[#E07A5F] font-semibold',
    'Under Review': 'bg-[#FAF3E0] text-[#935D26] border-[#E8DAB2]',
    'Confirmed Anomaly': 'bg-red-100 text-red-900 border-red-300 font-bold',
    'Escalated': 'bg-[#F3EBF7] text-[#6A3D7E] border-[#D8C2E5] font-semibold',
    'Resolved': 'bg-[#EAF0E6] text-[#263D2E] border-[#C8D5B9]',
    'False Positive': 'bg-[#F3F4F1] text-[#617467] border-[#DDE5D4]'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};
