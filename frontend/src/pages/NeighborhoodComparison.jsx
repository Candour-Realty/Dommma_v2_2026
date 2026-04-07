import React, { useState } from 'react';
import { 
  MapPin, BarChart3, Home, DollarSign, Loader2, PawPrint, ArrowRight
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function NeighborhoodComparison() {
  const { user } = useAuth();
  const [areas, setAreas] = useState('Downtown,Kitsilano,Mount Pleasant');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/ai/neighborhood-comparison?neighborhoods=${encodeURIComponent(areas)}`);
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (!user) return null;

  const maxRent = data ? Math.max(...data.neighborhoods.map(n => n.rent.avg_price || 0)) : 0;

  return (
    <>
      <div className="space-y-6" data-testid="neighborhood-comparison-page">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Neighborhood Comparison
          </h1>
          <p className="text-gray-500 mt-1">Compare neighborhoods side-by-side</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex gap-3">
            <input value={areas} onChange={e => setAreas(e.target.value)}
              placeholder="Enter neighborhoods separated by commas..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm" data-testid="neighborhood-input" />
            <button onClick={handleCompare} disabled={loading}
              className="px-6 py-2.5 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-50 flex items-center gap-2"
              data-testid="compare-btn">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
              Compare
            </button>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <Loader2 size={32} className="animate-spin text-[#1A2F3A] mx-auto" />
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4" data-testid="neighborhood-cards">
              {data.neighborhoods.map((n, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm" data-testid={`neighborhood-${i}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={18} className="text-[#1A2F3A]" />
                    <h3 className="font-semibold text-[#1A2F3A]">{n.neighborhood}</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-green-600">Avg Rent</span>
                        <span className="font-bold text-green-800">${n.rent.avg_price.toLocaleString()}/mo</span>
                      </div>
                      <div className="w-full h-2 bg-green-200 rounded-full">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${maxRent > 0 ? (n.rent.avg_price / maxRent * 100) : 0}%` }} />
                      </div>
                      <p className="text-xs text-green-500 mt-1">{n.rent.count} rentals ({n.rent.min_price > 0 ? `$${n.rent.min_price.toLocaleString()} - $${n.rent.max_price.toLocaleString()}` : 'N/A'})</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-600">Avg Sale</span>
                        <span className="font-bold text-blue-800">{n.sale.avg_price > 0 ? `$${n.sale.avg_price.toLocaleString()}` : 'N/A'}</span>
                      </div>
                      <p className="text-xs text-blue-500 mt-1">{n.sale.count} listings</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <Home size={14} className="mx-auto text-gray-500 mb-1" />
                        <p className="text-xs text-gray-500">Avg Sqft</p>
                        <p className="text-sm font-medium">{n.avg_sqft || 'N/A'}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <PawPrint size={14} className="mx-auto text-gray-500 mb-1" />
                        <p className="text-xs text-gray-500">Pet Friendly</p>
                        <p className="text-sm font-medium">{n.pet_friendly_pct}%</p>
                      </div>
                    </div>
                    {n.property_types.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {n.property_types.slice(0, 4).map((t, ti) => (
                          <span key={ti} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{t}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400">{n.total_listings} total listings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
