import React, { useState } from 'react';
import { loginUser } from '../services/api.ts';
import { User } from '../types/index.ts';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  X,
  Building,
  KeyRound,
  AlertCircle
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent, customUid?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const uid = customUid || userId;
    const pwd = customPass || password;

    if (!uid || !pwd) {
      setErrorMsg('Please enter both User ID and Password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginUser(uid, pwd);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Check official credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setQuickDemoAccount = (uid: string, pwd: string) => {
    setUserId(uid);
    setPassword(pwd);
    handleLogin(undefined, uid, pwd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl border border-gray-300 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Government Style Header */}
        <div className="bg-blue-950 text-white p-4 flex items-center justify-between border-b-2 border-amber-500">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-900 border border-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Official Authority Sign-In</h3>
              <p className="text-[10px] text-blue-200 uppercase font-semibold">
                MPLADS Administrative & Regulatory Gateway
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={(e) => handleLogin(e)} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Official User ID / NIC Designation
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. MP001, ADMIN001, AGENCY001"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter authorized password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-900 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{loading ? 'Authenticating Credentials...' : 'Authenticate & Sign In'}</span>
            </button>
          </form>

          {/* Quick 1-Click Role Testing Buttons */}
          <div className="mt-5 pt-4 border-t border-gray-200">
            <div className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
              1-Click Demo Persona Sign-In (Official Evaluation)
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setQuickDemoAccount('MP001', 'MP@123')}
                className="w-full text-left p-2 rounded-md border border-amber-200 bg-amber-50/70 hover:bg-amber-100 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-amber-950">
                    Member of Parliament (Lok Sabha)
                  </div>
                  <div className="text-[10px] text-amber-800">
                    Shri Rajesh K. Sharma (Karimnagar) • Recommend works & track funds
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded">
                  MP001
                </span>
              </button>

              <button
                type="button"
                onClick={() => setQuickDemoAccount('ADMIN001', 'Admin@123')}
                className="w-full text-left p-2 rounded-md border border-blue-200 bg-blue-50/70 hover:bg-blue-100 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-blue-950">
                    District Authority (DM / Collector)
                  </div>
                  <div className="text-[10px] text-blue-800">
                    Dr. Anand K. Verma, IAS • Sanction works, review AI alerts, audit logs
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-200 text-blue-900 rounded">
                  ADMIN001
                </span>
              </button>

              <button
                type="button"
                onClick={() => setQuickDemoAccount('AGENCY001', 'Agency@123')}
                className="w-full text-left p-2 rounded-md border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-emerald-950">
                    Implementing Agency (PWD Division)
                  </div>
                  <div className="text-[10px] text-emerald-800">
                    Executive Engineer • Update progress (MB), upload geo-tagged photos
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded">
                  AGENCY001
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Security Notice */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-[10px] text-gray-500">
            Authorized government personnel only. System activity is logged under the National Informatics Centre
            security guidelines.
          </p>
        </div>
      </div>
    </div>
  );
};
