import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Minus, BarChart3,
  Loader2, Sparkles, ArrowRight, Calculator
} from 'lucide-react';
import { useAuth } from '../App';
import DashboardLayout from '../components/layout/DashboardLayout';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SmartRentPricing() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    city: 'Vancouver', bedrooms: 2, bathrooms: 1, sqft: 700,
    property_type: 'Apartment', amenities: '', current_rent: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...form,
        current_rent: form.current_rent || '0'
      }).toString();
      const res = await axios.post(`${API}/ai/smart-rent-pricing?${params}`);
      setResult(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="smart-pricing-page">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Smart Rent Pricing
          </h1>
          <p className="text-gray-500 mt-1">AI-powered rent price suggestions based on real market data</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-testid="pricing-form">
            <h2 className="font-semibold text-[#1A2F3A] mb-4">Property Specs</h2>
            <div className="space-y-3">
              <input placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" data-testid="price-city" />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Beds</label>
                  <input type="number" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" data-testid="price-beds" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Baths</label>
                  <input type="number" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" data-testid="price-baths" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Sqft</label>
                  <input type="number" value={form.sqft} onChange={e => setForm({...form, sqft: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" data-testid="price-sqft" />
                </div>
              </div>
              <select value={form.property_type} onChange={e => setForm({...form, property_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" data-testid="price-type">
                {['Apartment', 'Condo', 'Townhouse', 'House', 'Studio'].map(t => <option key={t}>{t}</option>)}
              </select>
              <div>
                <label className="text-xs text-gray-500">Current Rent (optional)</label>
                <input type="number" placeholder="$0" value={form.current_rent} onChange={e => setForm({...form, current_rent: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" data-testid="price-current" />
              </div>
              <button onClick={handleAnalyze} disabled={loading}
                className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="analyze-pricing-btn">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                Analyze Pricing
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {result && !loading && (
              <>
                <div className="grid grid-cols-3 gap-4" data-testid="pricing-results">
                  <div className="bg-blue-50 rounded-2xl border border-blue-200 p-5 text-center">
                    <p className="text-xs text-blue-600 mb-1">Competitive</p>
                    <p className="text-2xl font-bold text-blue-700">${result.competitive_price?.toLocaleString()}</p>
                    <p className="text-xs text-blue-500 mt-1">Quick fill</p>
                  </div>
                  <div className="bg-green-50 rounded-2xl border border-green-300 p-5 text-center shadow-md ring-2 ring-green-200">
                    <p className="text-xs text-green-600 mb-1 font-medium">Suggested</p>
                    <p className="text-3xl font-bold text-green-700">${result.suggested_rent?.toLocaleString()}</p>
                    <p className="text-xs text-green-500 mt-1">Best balance</p>
                  </div>
                  <div className="bg-purple-50 rounded-2xl border border-purple-200 p-5 text-center">
                    <p className="text-xs text-purple-600 mb-1">Premium</p>
                    <p className="text-2xl font-bold text-purple-700">${result.premium_price?.toLocaleString()}</p>
                    <p className="text-xs text-purple-500 mt-1">Max return</p>
                  </div>
                </div>

                {result.current_position && result.current_position !== 'unknown' && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 ${
                    result.current_position === 'below_market' ? 'bg-yellow-50 border border-yellow-200' :
                    result.current_position === 'above_market' ? 'bg-red-50 border border-red-200' :
                    'bg-green-50 border border-green-200'
                  }`} data-testid="position-indicator">
                    {result.current_position === 'below_market' ? <TrendingDown size={20} className="text-yellow-600" /> :
                     result.current_position === 'above_market' ? <TrendingUp size={20} className="text-red-600" /> :
                     <Minus size={20} className="text-green-600" />}
                    <p className="text-sm">
                      Your current rent of <strong>${parseFloat(form.current_rent).toLocaleString()}</strong> is{' '}
                      <strong>{result.current_position.replace('_', ' ')}</strong>.
                    </p>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-semibold text-[#1A2F3A] mb-3 flex items-center gap-2">
                    <BarChart3 size={18} />Market Data ({result.market_data?.count} comparables)
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Median</p>
                      <p className="font-bold">${result.market_data?.median?.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Average</p>
                      <p className="font-bold">${result.market_data?.average?.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">25th %ile</p>
                      <p className="font-bold">${result.market_data?.p25?.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">75th %ile</p>
                      <p className="font-bold">${result.market_data?.p75?.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">{result.recommendation}</p>
                </div>
              </>
            )}
            {!result && !loading && (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <DollarSign size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400">Enter property details to get market-based pricing</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
