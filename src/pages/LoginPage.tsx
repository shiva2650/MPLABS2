import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { ShieldCheck, Lock, User, Eye, EyeOff, Building2, Landmark, Crown, ArrowLeft, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onEnterPublic: () => void;
  onBackToHome?: () => void;
  initialRole?: 'MP' | 'ADMIN' | 'STATE_NODAL' | 'MINISTRY' | 'AGENCY';
}

export const LoginPage: React.FC<LoginPageProps> = ({ onEnterPublic, onBackToHome, initialRole }) => {
  const { login } = useAuth();
  const getInitial = (r?: any) => {
    if (r === 'MP') return { id: 'MP001', pass: 'MP@123' };
    if (r === 'STATE_NODAL') return { id: 'STATE001', pass: 'State@123' };
    if (r === 'MINISTRY') return { id: 'MINISTRY001', pass: 'Ministry@123' };
    if (r === 'AGENCY') return { id: 'AGENCY001', pass: 'Agency@123' };
    return { id: 'ADMIN001', pass: 'Admin@123' };
  };

  const initial = getInitial(initialRole);
  const [userId, setUserId] = useState(initial.id);
  const [password, setPassword] = useState(initial.pass);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(userId, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = (id: string, pass: string) => {
    setUserId(id);
    setPassword(pass);
    login(id, pass).catch(err => setError(err.message));
  };

  return (
    <div className="min-h-screen bg-[#F8F9F7] flex flex-col justify-between font-sans">
      <div className="h-1.5 w-full bg-linear-to-r from-[#FF9933] via-white to-[#138808]" />

      <header className="bg-white border-b border-[#DDE5D4] py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToHome && (
              <button onClick={onBackToHome} className="p-1.5 rounded-lg bg-[#EAF0E6] text-[#1B3022] text-xs font-semibold flex items-center gap-1 cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
            <div className="text-sm font-bold text-[#1B3022]">Ministry of Statistics & Programme Implementation</div>
          </div>
          <button onClick={onEnterPublic} className="text-xs font-bold text-[#395C40] hover:underline flex items-center gap-1 cursor-pointer">
            <span>Skip to Public Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 my-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#DDE5D4] overflow-hidden">
          <div className="p-6 bg-[#1B3022] text-white text-center space-y-1">
            <ShieldCheck className="w-8 h-8 text-[#A3B18A] mx-auto mb-1" />
            <h1 className="text-base font-bold">Official Governance Login</h1>
            <p className="text-xs text-[#A3B18A]">Statutory Role-Based Access Control</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-[#FAF3E0] border border-[#E8DAB2] text-[#935D26] rounded-xl font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block font-bold text-[#1B3022] mb-1">User ID / Designation Code</label>
              <input
                type="text"
                required
                value={userId}
                onChange={e => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg font-mono font-bold uppercase bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1B3022] mb-1">Security Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DDE5D4] rounded-lg bg-white pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400 cursor-pointer">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#395C40] text-white font-bold rounded-lg hover:bg-[#2C4A34] cursor-pointer">
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            {/* 1-Click Demo Logins */}
            <div className="pt-3 border-t border-[#DDE5D4] space-y-2">
              <div className="text-[11px] font-bold text-[#588157] text-center uppercase">1-Click Demonstration Profiles</div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => handleQuick('ADMIN001', 'Admin@123')} className="p-2 border border-[#DDE5D4] rounded-lg text-left hover:bg-[#EAF0E6] cursor-pointer">
                  <div className="font-bold text-[#1B3022]">District Collector</div>
                  <div className="text-[10px] text-gray-500 font-mono">ADMIN001</div>
                </button>
                <button type="button" onClick={() => handleQuick('MP001', 'MP@123')} className="p-2 border border-[#DDE5D4] rounded-lg text-left hover:bg-[#EAF0E6] cursor-pointer">
                  <div className="font-bold text-[#1B3022]">Member of Parliament</div>
                  <div className="text-[10px] text-gray-500 font-mono">MP001</div>
                </button>
                <button type="button" onClick={() => handleQuick('STATE001', 'State@123')} className="p-2 border border-[#DDE5D4] rounded-lg text-left hover:bg-[#EAF0E6] cursor-pointer">
                  <div className="font-bold text-purple-800">State Nodal Officer</div>
                  <div className="text-[10px] text-gray-500 font-mono">STATE001</div>
                </button>
                <button type="button" onClick={() => handleQuick('MINISTRY001', 'Ministry@123')} className="p-2 border border-[#DDE5D4] rounded-lg text-left hover:bg-[#EAF0E6] cursor-pointer">
                  <div className="font-bold text-indigo-800">Central Ministry</div>
                  <div className="text-[10px] text-gray-500 font-mono">MINISTRY001</div>
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <footer className="bg-white border-t border-[#DDE5D4] py-3 text-center text-xs text-[#588157]">
        National Informatics Centre (NIC) • Ministry of Statistics & Programme Implementation
      </footer>
    </div>
  );
};
