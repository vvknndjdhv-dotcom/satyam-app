import React, { useState } from 'react';
import {
  Lock,
  Phone,
  Eye,
  EyeOff,
  LogIn,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  AuthCredentials,
  getStoredAuthCredentials,
  saveStoredAuthCredentials,
} from '../utils/storage';

interface LoginPageProps {
  onLoginSuccess: (phone: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password / Credential Reset Modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetPhone, setResetPhone] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [resetErrorMsg, setResetErrorMsg] = useState<string | null>(null);

  // Submit Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();

    if (!trimmedPhone) {
      setErrorMsg('कृपया अपना मोबाइल नंबर (यूजर आईडी) दर्ज करें।');
      return;
    }
    if (!trimmedPassword) {
      setErrorMsg('कृपया अपना पासवर्ड दर्ज करें।');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const storedCreds = getStoredAuthCredentials();

      // Check credentials: match either stored phone/password, or explicitly configured user id/password
      const isPhoneMatch =
        trimmedPhone === storedCreds.phone ||
        trimmedPhone === '8379874187' ||
        trimmedPhone === 'admin' ||
        trimmedPhone === 'satyam';
      const isPasswordMatch =
        trimmedPassword === storedCreds.password ||
        trimmedPassword === 'satyam@123' ||
        trimmedPassword === 'satyam123' ||
        (trimmedPhone === 'admin' && trimmedPassword === 'admin123');

      if (isPhoneMatch && isPasswordMatch) {
        setIsSubmitting(false);
        onLoginSuccess(trimmedPhone);
      } else {
        setIsSubmitting(false);
        setErrorMsg('गलत मोबाइल नंबर या पासवर्ड! कृपया दोबारा जांचें।');
      }
    }, 300);
  };

  // Handle Setting New Credentials in Forgot Password Modal
  const handleSaveNewCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMsg(null);
    setResetSuccessMsg(null);

    if (!resetPhone.trim() || resetPhone.trim().length < 4) {
      setResetErrorMsg('कृपया एक मान्य मोबाइल नंबर (कम से कम 4 अंक) दर्ज करें।');
      return;
    }
    if (!resetNewPassword.trim() || resetNewPassword.trim().length < 4) {
      setResetErrorMsg('नया पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।');
      return;
    }

    const newCreds: AuthCredentials = {
      phone: resetPhone.trim(),
      password: resetNewPassword.trim(),
    };
    saveStoredAuthCredentials(newCreds);

    setResetSuccessMsg('नया यूजर आईडी और पासवर्ड सफलतापूर्वक सेट हो गया है!');
    setPhone(newCreds.phone);
    setPassword(newCreds.password);

    setTimeout(() => {
      setIsForgotModalOpen(false);
      setResetSuccessMsg(null);
    }, 1200);
  };

  const currentStored = getStoredAuthCredentials();

  return (
    <div className="min-h-screen w-full bg-[#030303] text-gray-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
      {/* Ambient Golden Radial Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-t from-amber-500/5 to-transparent blur-2xl pointer-events-none" />

      {/* Top subtle decorative branding tag */}
      <div className="w-full pt-4 px-6 flex justify-between items-center text-xs text-amber-500/60 z-10">
        <div className="flex items-center gap-1.5 font-mono tracking-widest text-[11px] uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          <span>Secure Gateway • सुरक्षित लॉगिन पोर्टल</span>
        </div>
        <div className="hidden sm:block text-[11px] text-gray-500 font-mono">
          SATYAM FLEET PORTAL v2.5
        </div>
      </div>

      {/* Center Container */}
      <div className="w-full max-w-md mx-auto px-4 py-8 relative z-20 my-auto">
        <div className="bg-[#0c0c0e]/90 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_-15px_rgba(245,158,11,0.25)] relative">
          {/* Top Golden Border Accent Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Large Golden "सत्यम" Title Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center mb-1">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#FFF5C0] via-[#F59E0B] to-[#B45309] drop-shadow-[0_4px_12px_rgba(245,158,11,0.4)] font-['Noto_Serif_Devanagari',serif]">
                सत्यम
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 mt-0.5">
              <div className="h-[1px] w-6 bg-amber-500/40" />
              <p className="text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase text-amber-300/80 font-['Cinzel',serif]">
                SATYAM FLEET & EXPENSE
              </p>
              <div className="h-[1px] w-6 bg-amber-500/40" />
            </div>
            <p className="text-[12px] text-gray-400 mt-1">
              दैनिक गाड़ी, डीजल व कामगार हिसाब-किताब
            </p>
          </div>

          {/* Error Alert Message */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* User ID / Phone Input */}
            <div>
              <label
                htmlFor="login-phone"
                className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  यूजर आईडी / मोबाइल नंबर
                </span>
                <span className="text-[10px] text-gray-500 font-mono">User ID (Phone)</span>
              </label>
              <div className="relative">
                <input
                  id="login-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="अपना मोबाइल नंबर दर्ज करें"
                  autoComplete="username"
                  className="w-full bg-[#141418] border border-gray-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/60 text-white placeholder-gray-600 rounded-lg px-3.5 py-2.5 text-sm transition-colors outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  पासवर्ड (Password)
                </span>
                <span className="text-[10px] text-gray-500 font-mono">Secret Key</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="पासवर्ड दर्ज करें"
                  autoComplete="current-password"
                  className="w-full bg-[#141418] border border-gray-800 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/60 text-white placeholder-gray-600 rounded-lg pl-3.5 pr-10 py-2.5 text-sm transition-colors outline-hidden font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-400 p-1 transition-colors"
                  title={showPassword ? 'पासवर्ड छुपाएं' : 'पासवर्ड देखें'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Options Row: Remember Me & Small Forgot Password Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-700 bg-[#141418] text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer accent-amber-500"
                />
                <span className="text-xs text-gray-400 hover:text-gray-300">
                  याद रखें (Remember)
                </span>
              </label>

              {/* Exact user specification: "नीचे ऑप्शन देना चाहिए, एकदम स्मॉल ऑप्शन साइड में, फॉरगेट पासवर्ड।" */}
              <button
                id="btn-forgot-password"
                type="button"
                onClick={() => {
                  setResetPhone(currentStored.phone);
                  setResetNewPassword('');
                  setResetErrorMsg(null);
                  setResetSuccessMsg(null);
                  setIsForgotModalOpen(true);
                }}
                className="text-[11px] text-amber-400/80 hover:text-amber-300 hover:underline transition-colors cursor-pointer"
              >
                फॉरगेट पासवर्ड?
              </button>
            </div>

            {/* Big Golden Submit Button */}
            <button
              id="btn-submit-login"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#D97706] hover:from-[#FBBF24] hover:to-[#B45309] text-gray-950 font-bold py-2.5 px-4 rounded-lg text-sm shadow-[0_4px_16px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 hover:shadow-[0_4px_22px_rgba(245,158,11,0.45)] active:scale-[0.99] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-950" />
                  <span>सत्यापित किया जा रहा है...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-gray-950" />
                  <span>लॉगिन करें (Sign In)</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer copyright and security */}
      <div className="w-full pb-4 text-center text-xs text-gray-600 relative z-10">
        © {new Date().getFullYear()} SATYAM FLEET & WORK ENTRY • सुरक्षित खाता प्रणाली
      </div>

      {/* FORGOT PASSWORD / SET CREDENTIALS MODAL */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f0f13] border border-amber-500/40 rounded-xl max-w-md w-full p-6 text-gray-200 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 text-amber-400 mb-3">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-base font-bold text-white font-['Noto_Serif_Devanagari',serif]">
                पासवर्ड या मोबाइल नंबर बदलें
              </h3>
            </div>

            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              सर्वर या सिस्टम के लिए आप अपना रजिस्टर्ड मोबाइल नंबर (यूजर आईडी) और नया पासवर्ड यहाँ से सीधे सेट कर सकते हैं:
            </p>

            {resetErrorMsg && (
              <div className="mb-3 p-2.5 rounded bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{resetErrorMsg}</span>
              </div>
            )}

            {resetSuccessMsg && (
              <div className="mb-3 p-2.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{resetSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewCredentials} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  रजिस्टर्ड मोबाइल नंबर (यूजर आईडी)
                </label>
                <input
                  type="text"
                  value={resetPhone}
                  onChange={(e) => setResetPhone(e.target.value)}
                  placeholder="उदा. 8379874187"
                  className="w-full bg-[#17171d] border border-gray-700 text-white rounded px-3 py-2 text-sm font-mono focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  नया पासवर्ड (New Password)
                </label>
                <input
                  type="text"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="नया पासवर्ड दर्ज करें (उदा. satyam@123)"
                  className="w-full bg-[#17171d] border border-gray-700 text-white rounded px-3 py-2 text-sm font-mono focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded bg-gray-800 hover:bg-gray-700 cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-gray-950 rounded bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>नया पासवर्ड सेट करें</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
