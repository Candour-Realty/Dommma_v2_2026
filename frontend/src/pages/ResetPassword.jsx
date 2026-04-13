import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const rules = [
    { test: password.length >= 8, label: 'At least 8 characters' },
    { test: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { test: /[a-z]/.test(password), label: 'One lowercase letter' },
    { test: /[0-9]/.test(password), label: 'One number' },
    { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), label: 'One special character' },
    { test: password && password === confirm, label: 'Passwords match' },
  ];

  const allValid = rules.every(r => r.test);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allValid) return;
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API}/api/auth/reset-password`, { token, new_password: password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#0F1419] flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-4">Invalid Reset Link</h1>
          <p className="text-gray-500 mb-6">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="px-6 py-3 bg-[#1A2F3A] text-white rounded-full text-sm font-medium">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#0F1419] flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md">
        <Link to="/" className="text-3xl text-[#1A2F3A] dark:text-white mb-8 block" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          DOMMMA
        </Link>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Password Reset!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Your password has been changed. You can now log in.</p>
            <Link to="/login" className="inline-block px-6 py-3 bg-[#1A2F3A] text-white rounded-full text-sm font-medium hover:bg-[#2C4A52] dark:bg-[#C4A962] dark:text-[#1A2F3A]">
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl text-[#1A2F3A] dark:text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Set New Password
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Choose a strong password for your account.</p>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">New Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" required />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Confirm Password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" required />
              </div>

              {password && (
                <div className="space-y-1">
                  {rules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={rule.test ? 'text-green-500' : 'text-gray-400'}>{rule.test ? '\u2713' : '\u2717'}</span>
                      <span className={rule.test ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>{rule.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" disabled={loading || !allValid}
                className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] disabled:opacity-50 flex items-center justify-center gap-2 dark:bg-[#C4A962] dark:text-[#1A2F3A]">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Resetting...</> : <><Lock size={16} /> Reset Password</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
