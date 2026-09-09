import React from 'react';
import { Lock, ArrowLeft, ShieldAlert, UserCog } from 'lucide-react';

interface OfficerRestrictedGateProps {
  toolName: string;
  toolDescription: string;
  onLogin: () => void;
  onReturnToPublic: () => void;
}

export const OfficerRestrictedGate: React.FC<OfficerRestrictedGateProps> = ({
  toolName,
  toolDescription,
  onLogin,
  onReturnToPublic
}) => {
  return (
    <div className="max-w-2xl mx-auto my-12 bg-white rounded-xl border border-slate-border p-8 shadow-sm text-center">
      <div className="w-14 h-14 rounded-full bg-panel-bg text-govt-navy border border-slate-border flex items-center justify-center mx-auto mb-4">
        <Lock className="w-7 h-7 text-govt-navy" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-panel-bg text-govt-navy text-xs font-semibold border border-slate-border mb-2">
        <ShieldAlert className="w-3.5 h-3.5 text-status-review" />
        <span>Restricted Investigative Tooling</span>
      </div>

      <h2 className="text-xl font-bold text-slate-body mb-2">
        {toolName} — Officer Login Required
      </h2>

      <p className="text-sm text-slate-muted max-w-lg mx-auto mb-4 leading-relaxed">
        {toolDescription}
      </p>

      <div className="bg-panel-bg p-4 rounded-lg border border-slate-border text-xs text-slate-body text-left max-w-lg mx-auto mb-6">
        <div className="font-semibold text-govt-navy mb-1">Public Transparency Notice:</div>
        <p className="text-slate-muted">
          Public users can view project statuses, geotagged photos, and verified fund utilization on the
          Projects and Verification pages. Raw cryptographic logs, audit ledgers, and collusion graphs
          are restricted to authorized District Authorities and MoSPI oversight officers.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onLogin}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-govt-navy hover:bg-govt-navy-light text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <UserCog className="w-4 h-4 text-govt-saffron" />
          <span>Log In with Officer Credentials</span>
        </button>

        <button
          onClick={onReturnToPublic}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-panel-bg text-slate-body border border-slate-border rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-muted" />
          <span>Return to Public Dashboard</span>
        </button>
      </div>
    </div>
  );
};
