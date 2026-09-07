import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Globe } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught application error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F9F7] text-[#1B3022] flex items-center justify-center p-4 font-sans">
          <div className="max-w-xl w-full bg-white rounded-2xl border border-[#DDE5D4] shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 pb-5 border-b border-[#E7EFE0]">
              <div className="w-12 h-12 rounded-xl bg-[#F5C2B4]/30 border border-[#E07A5F]/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-[#B85338]" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#588157] tracking-wider uppercase">
                  MPLADS AI Integrity System • Diagnostic Mode
                </div>
                <h2 className="text-xl font-bold text-[#1B3022]">
                  Application Recovery Console
                </h2>
              </div>
            </div>
            <div className="py-5 space-y-3 text-sm text-[#455A47]">
              <p>The application encountered an unexpected runtime error. You can reload or clear cache.</p>
              {this.state.error && (
                <div className="p-3 bg-[#FDF2ED] rounded-xl border border-[#F5C2B4] text-xs font-mono text-[#A62B17]">
                  {this.state.error.message || String(this.state.error)}
                </div>
              )}
            </div>
            <div className="pt-2 flex gap-3">
              <button onClick={this.handleReload} className="flex-1 px-4 py-2 bg-[#395C40] text-white text-xs font-semibold rounded-xl cursor-pointer">
                Reload Portal
              </button>
              <button onClick={this.handleResetCache} className="flex-1 px-4 py-2 bg-[#FAFBF9] border border-[#DDE5D4] text-[#1B3022] text-xs font-semibold rounded-xl cursor-pointer">
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
