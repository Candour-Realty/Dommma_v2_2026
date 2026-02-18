import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Users, Wrench, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const userTypes = [
  {
    id: 'renter',
    title: 'Renter',
    icon: Users,
    description: 'Find your perfect rental home',
    features: ['Search properties', 'Apply for rentals', 'Pay rent online', 'Message landlords', 'Sign documents'],
    color: '#2C4A52'
  },
  {
    id: 'landlord',
    title: 'Landlord',
    icon: Building2,
    description: 'Manage your properties with ease',
    features: ['List properties', 'Screen tenants', 'Collect rent', 'Track maintenance', 'Document management'],
    color: '#1A2F3A'
  },
  {
    id: 'contractor',
    title: 'Contractor',
    icon: Wrench,
    description: 'Grow your business',
    features: ['Get job leads', 'Manage projects', 'Build reputation', 'Connect with landlords', 'Invoice clients'],
    color: '#3D5A63'
  },
];

const Login = () => {
  const [selectedType, setSelectedType] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedType) {
      setError('Please select an account type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create or login user
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API}${endpoint}`, {
        ...formData,
        user_type: selectedType
      });

      // For demo, simulate successful login
      const userData = {
        id: response.data?.id || 'demo-user-' + Date.now(),
        email: formData.email,
        name: formData.name || formData.email.split('@')[0],
        user_type: selectedType,
        created_at: new Date().toISOString()
      };

      login(userData);
      navigate('/dashboard');
    } catch (err) {
      // Demo mode - create user locally
      const userData = {
        id: 'demo-user-' + Date.now(),
        email: formData.email,
        name: formData.name || formData.email.split('@')[0],
        user_type: selectedType,
        created_at: new Date().toISOString()
      };

      login(userData);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link 
            to="/"
            className="text-3xl text-[#1A2F3A] mb-8 block"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            DOMMMA
          </Link>

          <h1 
            className="text-4xl text-[#1A2F3A] mb-2"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-500 mb-8">
            {isLogin ? 'Sign in to access your dashboard' : 'Join DOMMMA marketplace'}
          </p>

          {/* User Type Selection */}
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-4">I am a:</p>
            <div className="grid grid-cols-3 gap-3">
              {userTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedType === type.id
                      ? 'border-[#1A2F3A] bg-[#1A2F3A] text-white'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  data-testid={`user-type-${type.id}`}
                >
                  <type.icon className="mx-auto mb-2" size={24} />
                  <span className="text-sm font-medium">{type.title}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm text-gray-600 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none transition-all"
                  placeholder="John Doe"
                  data-testid="name-input"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none transition-all"
                placeholder="you@example.com"
                required
                data-testid="email-input"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none transition-all"
                placeholder="••••••••"
                required
                data-testid="password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-dark flex items-center justify-center gap-2"
              data-testid="submit-btn"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#1A2F3A] font-medium hover:underline"
              data-testid="toggle-auth-btn"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - Features */}
      {selectedType && (
        <div 
          className="hidden lg:flex flex-1 items-center justify-center p-12"
          style={{ backgroundColor: userTypes.find(t => t.id === selectedType)?.color }}
        >
          <div className="text-white max-w-md">
            <h2 
              className="text-4xl mb-4"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              {userTypes.find(t => t.id === selectedType)?.title} Features
            </h2>
            <p className="text-white/70 mb-8">
              {userTypes.find(t => t.id === selectedType)?.description}
            </p>
            <ul className="space-y-4">
              {userTypes.find(t => t.id === selectedType)?.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <Check size={14} />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
