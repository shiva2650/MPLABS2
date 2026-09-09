import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  WifiOff,
  Languages
} from 'lucide-react';

interface LoginPageProps {
  onEnterPublic: () => void;
  onBackToHome?: () => void;
  onLoginSuccess?: () => void;
  initialRole?: 'MP' | 'ADMIN' | 'AGENCY';
}

interface AuthError {
  type: 'invalid_credentials' | 'server_unreachable' | 'unknown';
  title: string;
  message: string;
  suggestion?: string;
}

const parseAuthError = (err: any, isHindi: boolean): AuthError => {
  const rawMsg = (err?.message || String(err || '')).trim();
  const lower = rawMsg.toLowerCase();

  if (
    lower.includes('invalid credentials') ||
    lower.includes('invalid user id') ||
    lower.includes('password') ||
    lower.includes('401') ||
    lower.includes('unauthorized')
  ) {
    return {
      type: 'invalid_credentials',
      title: isHindi ? 'अमान्य क्रेडेंशियल्स' : 'Invalid credentials',
      message: isHindi
        ? 'आपके द्वारा दर्ज की गई यूज़र आईडी या पासवर्ड अधिकृत रिकॉर्ड से मेल नहीं खाता है।'
        : 'The User ID or password you entered does not match authorized records.',
      suggestion: isHindi
        ? 'कृपया अपनी विभागीय यूज़र आईडी और पासवर्ड सत्यापित करें।'
        : 'Please verify your departmental User ID and password.'
    };
  }

  if (
    lower.includes('server unreachable') ||
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('econnrefused') ||
    lower.includes('load failed') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('504')
  ) {
    return {
      type: 'server_unreachable',
      title: isHindi ? 'सर्वर अनुपलब्ध' : 'Server unreachable',
      message: isHindi
        ? 'केंद्रीय प्रमाणीकरण सेवा से सुरक्षित कनेक्शन स्थापित करने में असमर्थ।'
        : 'Unable to establish a secure connection with the central authentication service.',
      suggestion: isHindi
        ? 'कृपया अपना नेटवर्क कनेक्शन जांचें या सुनिश्चित करें कि सर्वर ऑनलाइन है।'
        : 'Please check your network connection or verify that the server is online.'
    };
  }

  return {
    type: 'unknown',
    title: isHindi ? 'प्रमाणीकरण विफल' : 'Authentication Failed',
    message: rawMsg || (isHindi ? 'प्रमाणीकरण प्रयास के दौरान अप्रत्याशित त्रुटि उत्पन्न हुई।' : 'An unexpected error occurred during the authentication attempt.'),
    suggestion: isHindi ? 'कृपया अपने क्रेडेंशियल्स सत्यापित करें और पुनः प्रयास करें।' : 'Please verify your credentials and try again.'
  };
};

export const LoginPage: React.FC<LoginPageProps> = ({ onEnterPublic, onBackToHome, onLoginSuccess }) => {
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const isHindi = language === 'hi';

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(userId, password);
      onLoginSuccess?.();
    } catch (err: any) {
      setError(parseAuthError(err, isHindi));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-panel-bg flex flex-col justify-between font-sans">
      {/* Top National Strip */}
      <div className="h-1.5 w-full bg-linear-to-r from-[#FF9933] via-white to-[#138808]" />

      {/* Header bar */}
      <header className="bg-white border-b border-slate-border py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="p-1.5 rounded-lg bg-panel-bg hover:bg-slate-border text-slate-body text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer mr-1"
                title={isHindi ? 'योजना मुख्य पृष्ठ पर लौटें' : 'Return to Scheme Home & Public Dashboard'}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{isHindi ? 'मुख्य पृष्ठ' : 'Back to Home'}</span>
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-govt-navy text-white flex items-center justify-center font-serif text-sm font-bold border-2 border-govt-saffron/50">
              GOI
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-muted font-semibold">
                {t.govIndia}
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-body">
                {t.mospiTitle}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-panel-bg p-1 rounded-lg border border-slate-border">
              <Languages className="w-3.5 h-3.5 text-govt-navy ml-1" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                  language === 'en' ? 'bg-govt-navy text-white shadow-xs' : 'text-slate-muted hover:text-slate-body'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                  language === 'hi' ? 'bg-govt-navy text-white shadow-xs' : 'text-slate-muted hover:text-slate-body'
                }`}
              >
                हिन्दी
              </button>
            </div>

            <button
              onClick={onEnterPublic}
              className="text-xs font-bold text-govt-navy hover:text-govt-navy-light underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{isHindi ? 'नागरिक सार्वजनिक पारदर्शिता पोर्टल' : 'Skip to Citizen Transparency Portal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-border overflow-hidden">
          {/* Card Header */}
          <div className="p-6 bg-govt-navy text-white text-center">
            {onBackToHome && (
              <div className="flex justify-start mb-3">
                <button
                  onClick={onBackToHome}
                  className="text-[11px] font-medium text-panel-bg/80 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>{isHindi ? 'योजना मुख्य पृष्ठ पर लौटें' : 'Return to Scheme Home'}</span>
                </button>
              </div>
            )}
            <div className="inline-flex p-2.5 rounded-xl bg-white/10 text-white mb-2 border border-white/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              {isHindi ? 'सांसद निधि एआई सत्यनिष्ठा एवं निगरानी प्रणाली' : 'MPLADS AI Integrity & Monitoring'}
            </h1>
            <p className="text-xs text-panel-bg/80 mt-1">
              {isHindi
                ? 'सुरक्षित भूमिका-आधारित पहुंच नियंत्रण एवं विसंगति जांच पोर्टल'
                : 'Secure Role-Based Access Control & Anomaly Detection Portal'}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {error && (
              <div
                role="alert"
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                  error.type === 'invalid_credentials'
                    ? 'bg-[#FAF3E0] border-[#E8DAB2] text-[#935D26]'
                    : error.type === 'server_unreachable'
                    ? 'bg-[#FBEBE8] border-[#F5C2B4] text-[#B85338]'
                    : 'bg-[#FAF3E0] border-[#E8DAB2] text-[#935D26]'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {error.type === 'server_unreachable' ? (
                    <WifiOff className="w-4 h-4 text-[#B85338]" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-[#935D26]" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="font-bold text-[13px] leading-snug tracking-tight">
                    {error.title}
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-95">
                    {error.message}
                  </p>
                  {error.suggestion && (
                    <p className="text-[10px] font-semibold opacity-90 pt-0.5">
                      💡 {error.suggestion}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-body mb-1">
                {isHindi ? 'आधिकारिक यूज़र आईडी / कर्मचारी कोड' : 'Official User ID / Employee Code'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={e => {
                    setUserId(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={isHindi ? 'उदा. MP001, ADMIN001, AGENCY001' : 'e.g. MP001, ADMIN001, AGENCY001'}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-border rounded-lg text-slate-body uppercase font-mono font-bold bg-white focus:ring-2 focus:ring-govt-navy focus:border-govt-navy focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-body">
                  {isHindi ? 'सुरक्षा पासवर्ड' : 'Security Password'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-govt-navy hover:underline font-semibold cursor-pointer"
                >
                  {isHindi ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={isHindi ? 'अधिकृत पासवर्ड दर्ज करें' : 'Enter authorized password'}
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-border rounded-lg text-slate-body bg-white focus:ring-2 focus:ring-govt-navy focus:border-govt-navy focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-body cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-govt-navy text-white font-bold rounded-lg hover:bg-govt-navy-light disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              {loading
                ? (isHindi ? 'प्रमाणीकरण जारी...' : 'Authenticating...')
                : (isHindi ? 'सुरक्षित पोर्टल में प्रवेश करें' : 'Sign In to Secure Portal')}
            </button>

            {/* Department Officer Credential Notice */}
            <div className="pt-4 border-t border-slate-border text-slate-muted">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-body mb-1">
                {isHindi ? 'अधिकृत विभागीय पोर्टल' : 'Authorized Department Portals'}
              </div>
              <p className="text-[11px] text-slate-muted leading-relaxed">
                {isHindi
                  ? 'ज़िला कलेक्ट्रेट, संसदीय सचिवालय और कार्यान्वयन प्राधिकरणों के पंजीकृत अधिकारी अपनी निर्धारित भारत सरकार सेवा आईडी का उपयोग करके लॉगिन कर सकते हैं।'
                  : 'Registered officers from District Collectorates, Parliamentary Secretariats, and Implementing Authorities may log in using their assigned Government of India service IDs.'}
              </p>
            </div>

            {/* Citizen Open Access */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onEnterPublic}
                className="w-full py-2 bg-panel-bg hover:bg-slate-border text-slate-body font-bold rounded-lg border border-slate-border transition-colors cursor-pointer"
              >
                {isHindi ? 'नागरिक के रूप में प्रवेश (पारदर्शिता दृश्य)' : 'Access as Public Citizen (Transparency View)'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-slate-border space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-body">
              {isHindi ? 'आधिकारिक पासवर्ड रीसेट प्रोटोकॉल' : 'Official Password Reset Protocol'}
            </h3>
            <p className="text-slate-muted leading-relaxed">
              {isHindi
                ? 'राष्ट्रीय सूचना विज्ञान केंद्र (NIC) सुरक्षा निर्देशों के तहत, अधिकारी क्रेडेंशियल्स केवल आपके पंजीकृत ज़िला मजिस्ट्रेट प्रशासनिक कार्यालय या नोडल संसदीय अधिकारी के माध्यम से रीसेट किए जा सकते हैं।'
                : 'Under National Informatics Centre (NIC) security directives, MPLADS officer credentials can only be reset through your registered District Magistrate Administrative Office or Nodal Parliamentary Officer.'}
            </p>
            <div className="p-2.5 bg-slate-50 text-slate-body rounded-xl font-mono text-[11px] border border-slate-border">
              {isHindi
                ? 'क्रेडेंशियल रिकवरी के लिए अपने नोडल सिस्टम एडमिनिस्ट्रेटर या NIC स्टेट सेंटर हेल्पडेस्क से संपर्क करें।'
                : 'Contact your Nodal System Administrator or NIC State Centre Helpdesk for credential recovery.'}
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-govt-navy text-white rounded-lg font-bold hover:bg-govt-navy-light transition-colors cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-border py-3 text-center text-xs text-slate-muted">
        <div>{isHindi ? 'राष्ट्रीय सूचना विज्ञान केंद्र (NIC)' : 'National Informatics Centre (NIC)'} &copy; {new Date().getFullYear()} {t.mospiTitle}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">{t.govIndia} • e-SAKSHI MPLADS Verification Engine</div>
      </footer>
    </div>
  );
};
