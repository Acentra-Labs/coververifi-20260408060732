import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { validateEmail } from '../utils/validators';

export default function Login() {
  const { login, loading } = useAuth();
  const { error: toastError } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) {
      setErrors({ email: emailErr });
      return;
    }
    if (!password) {
      setErrors({ password: 'Password is required' });
      return;
    }
    setErrors({});

    const result = await login(email, password);
    if (result.success) {
      navigate(result.user.role === 'consultant' ? '/dashboard' : '/gc/dashboard');
    } else {
      toastError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">CoverVerifi</h1>
          </div>
          <p className="text-slate-400 text-sm">Insurance compliance verification for construction</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to access your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors ${
                  errors.password ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Demo Accounts</p>
            <div className="space-y-2">
              <button
                onClick={() => { setEmail('dawn.mitchell@coververifi.com'); setPassword('demo1234'); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all group"
              >
                <p className="text-sm font-medium text-slate-700 group-hover:text-teal-600">Consultant — Dawn Mitchell</p>
                <p className="text-xs text-slate-400">dawn.mitchell@coververifi.com</p>
              </button>
              <button
                onClick={() => { setEmail('mike@tvbuilders.com'); setPassword('demo1234'); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all group"
              >
                <p className="text-sm font-medium text-slate-700 group-hover:text-teal-600">GC — Treasure Valley Builders</p>
                <p className="text-xs text-slate-400">mike@tvbuilders.com</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
