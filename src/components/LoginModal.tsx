import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ApiService } from '../services/api';
import { Lock, User, Eye, EyeOff, AlertCircle, Shield, X, Check } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [userId, setUserId] = useState<string>('MP001');
  const [password, setPassword] = useState<string>('MP@123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await ApiService.login(userId.trim(), password);
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (u: string, p: string) => {
    setUserId(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white border border-stone-300 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header with tricolor banner */}
        <div className="h-1 w-full flex">
          <div className="h-full w-1/3 bg-[#FF9933]" />
          <div className="h-full w-1/3 bg-white" />
          <div className="h-full w-1/3 bg-[#138808]" />
        </div>

        <div className="p-5 border-b border-stone-200 flex items-start justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-900 text-white rounded-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Official Portal Sign In
              </h3>
              <p className="text-xs text-stone-600">
                Authorized access for MPs, District Authorities, and Agencies
              </p>
            </div>
          </div>
          <button
            id="login-modal-close-btn"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick 1-Click Demo Fill Selector */}
          <div className="bg-stone-100 p-3 rounded-md border border-stone-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-2">
              Quick 1-Click Role Login (Demo Credentials):
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                id="demo-btn-mp"
                onClick={() => handleFillDemo('MP001', 'MP@123')}
                className={`px-2 py-1.5 rounded border text-left font-medium transition-colors ${
                  userId === 'MP001'
                    ? 'bg-sky-900 text-white border-sky-950 font-bold'
                    : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div className="font-bold">MP</div>
                <div className="text-[10px] opacity-80">MP001</div>
              </button>

              <button
                type="button"
                id="demo-btn-admin"
                onClick={() => handleFillDemo('ADMIN001', 'Admin@123')}
                className={`px-2 py-1.5 rounded border text-left font-medium transition-colors ${
                  userId === 'ADMIN001'
                    ? 'bg-sky-900 text-white border-sky-950 font-bold'
                    : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div className="font-bold">Admin</div>
                <div className="text-[10px] opacity-80">ADMIN001</div>
              </button>

              <button
                type="button"
                id="demo-btn-agency"
                onClick={() => handleFillDemo('AGENCY001', 'Agency@123')}
                className={`px-2 py-1.5 rounded border text-left font-medium transition-colors ${
                  userId === 'AGENCY001'
                    ? 'bg-sky-900 text-white border-sky-950 font-bold'
                    : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50'
                }`}
              >
                <div className="font-bold">Agency</div>
                <div className="text-[10px] opacity-80">AGENCY001</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Official User ID / Designation Code
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-username-input"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. MP001, ADMIN001, AGENCY001"
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Secure Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your official password"
                  className="w-full pl-9 pr-9 py-2 border border-stone-300 rounded text-stone-900 focus:outline-hidden focus:ring-1 focus:ring-sky-800"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1">
              <span className="flex items-center gap-1 text-emerald-700">
                <Check className="w-3.5 h-3.5" /> 256-bit Encrypted Session
              </span>
              <button
                type="button"
                onClick={() => alert('Password reset requests require administrative verification from the District Nodal Officer.')}
                className="text-sky-900 hover:underline"
              >
                Forgot credentials?
              </button>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-sky-900 hover:bg-sky-950 disabled:opacity-50 rounded shadow-xs transition-colors mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>
        </div>

        <div className="p-3 bg-stone-100 border-t border-stone-200 text-[11px] text-stone-500 text-center">
          Complies with Official Secrets &amp; IT Act guidelines. All access is logged to the immutable audit trail.
        </div>
      </div>
    </div>
  );
};
