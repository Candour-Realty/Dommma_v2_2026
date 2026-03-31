import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Home, MapPin, BarChart3,
  Loader2, ArrowRight, ArrowUpRight, ArrowDownRight, Minus,
  Sparkles, Calculator
} from 'lucide-react';
import { useAuth } from '../App';
import DashboardLayout from '../components/layout/DashboardLayout';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PropertyValuation() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    address: '', city: 'Vancouver', property_type: 'Apartment',
    bedrooms: 2, bathrooms: 1, sqft: 700, year_built: 2010, amenities: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleValuation = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(form).toString();
      const res = await axios.post(`${API}/ai/property-valuation?${params}`);
      setResult(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="property-valuation-page">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            AI Property Valuation
          </h1>
          <p className="text-gray-500 mt-1">Get an AI-powered estimate for your property</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-testid="valuation-form">
            <h2 className="font-semibold text-[#1A2F3A] mb-4 flex items-center gap-2">
              <Home size={18} />Property Details
            </h2>
            <div className="space-y-3">
              <input placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" data-testid="val-address" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" data-testid="val-city" />
                <select value={form.property_type} onChange={e => setForm({...form, property_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" data-testid="val-type">
                  {['Apartment', 'Condo', 'Townhouse', 'House', 'Studio'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Beds</label>
                  <input type="number" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" data-testid="val-beds" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Baths</label>
                  <input type="number" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" data-testid="val-baths" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Sqft</label>
                  <input type="number" value={form.sqft} onChange={e => setForm({...form, sqft: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" data-testid="val-sqft" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Year Built</label>
                <input type="number" value={form.year_built} onChange={e => setForm({...form, year_built: parseInt(e.target.value) || 2000})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" data-testid="val-year" />
              </div>
              <input placeholder="Amenities (gym, pool, balcony...)" value={form.amenities}
                onChange={e => setForm({...form, amenities: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" data-testid="val-amenities" />
              <button onClick={handleValuation} disabled={loading}
                className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="run-valuation-btn">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                Get Valuation
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {loading && (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <Loader2 size={32} className="animate-spin text-[#1A2F3A] mx-auto mb-3" />
                <p className="text-gray-500">Analyzing market data...</p>
              </div>
            )}

            {result && !loading && (
              <>
                <div className="grid md:grid-cols-2 gap-4" data-testid="valuation-results">
                  {result.estimated_rent && (
                    <div className="bg-white rounded-2xl border border-green-200 p-6 shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">Estimated Rent</p>
                      <p className="text-3xl font-bold text-green-700">${result.estimated_rent.toLocaleString()}<span className="text-lg font-normal">/mo</span></p>
                      <p className="text-xs text-gray-400 mt-2">{result.comparables_count.rent} comparable rentals</p>
                    </div>
                  )}
                  {result.estimated_sale_price && (
                    <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">Estimated Sale Price</p>
                      <p className="text-3xl font-bold text-blue-700">${result.estimated_sale_price.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-2">{result.comparables_count.sale} comparable sales</p>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-semibold text-[#1A2F3A] mb-3 flex items-center gap-2">
                    <BarChart3 size={18} />Market Context
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">Avg Rent</p>
                      <p className="text-lg font-semibold">${result.market_averages.avg_rent.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">Confidence</p>
                      <p className={`text-lg font-semibold ${result.confidence === 'high' ? 'text-green-600' : result.confidence === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {result.confidence.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">Adjustments</p>
                      <p className="text-xs text-gray-600">Size: {result.adjustments.size}x | Age: {result.adjustments.age}x</p>
                    </div>
                  </div>
                </div>

                {result.ai_analysis && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-6" data-testid="ai-analysis">
                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <Sparkles size={18} />AI Analysis
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">{result.ai_analysis.assessment}</p>
                    {result.ai_analysis.value_drivers?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {result.ai_analysis.value_drivers.map((d, i) => (
                          <span key={i} className="px-3 py-1 bg-white/70 rounded-full text-xs text-purple-700">{d}</span>
                        ))}
                      </div>
                    )}
                    {result.ai_analysis.rent_range && (
                      <p className="text-xs text-purple-600">
                        Suggested rent: ${result.ai_analysis.rent_range.low?.toLocaleString()} - ${result.ai_analysis.rent_range.high?.toLocaleString()}/mo
                        {result.ai_analysis.market_trend && ` | Trend: ${result.ai_analysis.market_trend}`}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {!result && !loading && (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <TrendingUp size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400">Enter property details and click "Get Valuation"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
