import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle, Lock } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-[#0F1419] flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md">
        <Link to="/login" className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#1A2F3A] dark:hover:text-white mb-8 text-sm">
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <Link to="/" className="text-3xl text-[#1A2F3A] dark:text-white mb-8 block" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          DOMMMA
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Check Your Email
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              If an account exists with <strong>{email}</strong>, we've sent a password reset link. Check your inbox (and spam folder).
            </p>
            <p className="text-sm text-gray-400">The link expires in 1 hour.</p>
            <Link to="/login" className="inline-block mt-6 px-6 py-3 bg-[#1A2F3A] text-white rounded-full text-sm font-medium hover:bg-[#2C4A52]">
              Return to Login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl text-[#1A2F3A] dark:text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Forgot Password
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Enter your email and we'll send you a link to reset your password.
            </p>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl font-medium hover:bg-[#2C4A52] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors dark:bg-[#C4A962] dark:text-[#1A2F3A] dark:hover:bg-[#d4b972]"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
