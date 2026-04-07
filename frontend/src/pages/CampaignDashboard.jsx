import React, { useState, useEffect } from 'react';
import {
  Rocket, TrendingUp, Eye, MousePointer, Users, Plus, DollarSign, Calendar, BarChart3, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CampaignDashboard() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [listings, setListings] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ listing_id: '', campaign_type: 'boost', duration_days: 7 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchCampaigns();
    fetchPricing();
    fetchListings();
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      const res = await axios.get(`${API}/campaigns/landlord/${user.id}`);
      setCampaigns(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchPricing = async () => {
    try {
      const res = await axios.get(`${API}/campaigns/pricing`);
      setPricing(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchListings = async () => {
    try {
      const res = await axios.get(`${API}/listings?owner_id=${user.id}`);
      setListings(res.data);
    } catch (e) { console.error(e); }
  };

  const createCampaign = async () => {
    if (!form.listing_id) return;
    setLoading(true);
    const rate = pricing?.[form.campaign_type]?.daily_rate || 2.99;
    try {
      await axios.post(`${API}/campaigns`, {
        ...form,
        landlord_id: user.id,
        budget: rate * form.duration_days
      });
      setShowCreate(false);
      fetchCampaigns();
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to create campaign');
    } finally { setLoading(false); }
  };

  const totalSpend = campaigns.reduce((s, c) => s + (c.total_cost || 0), 0);
  const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  if (!user) return null;

  return (
    <div className="space-y-6" data-testid="campaign-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Listing Promotions
          </h1>
          <p className="text-gray-500 mt-1">Boost your listings to get more views and leads</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] flex items-center gap-2 text-sm font-medium"
          data-testid="create-campaign-btn"
        >
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Campaigns', value: activeCampaigns, icon: Rocket, color: 'text-blue-600' },
          { label: 'Total Impressions', value: totalImpressions.toLocaleString(), icon: Eye, color: 'text-green-600' },
          { label: 'Total Clicks', value: totalClicks.toLocaleString(), icon: MousePointer, color: 'text-purple-600' },
          { label: 'Total Spend', value: `$${totalSpend.toFixed(2)}`, icon: DollarSign, color: 'text-orange-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
            <p className="text-2xl font-semibold text-[#1A2F3A]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pricing Tiers */}
      {pricing && (
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(pricing).map(([key, tier]) => (
            <div key={key} className={`rounded-2xl border p-5 ${key === 'premium' ? 'border-[#1A2F3A] bg-[#1A2F3A] text-white' : 'border-gray-100 bg-white'}`}>
              <h3 className="font-semibold text-lg mb-1">{tier.label}</h3>
              <p className={`text-sm mb-3 ${key === 'premium' ? 'text-white/70' : 'text-gray-500'}`}>{tier.description}</p>
              <p className="text-3xl font-bold">${tier.daily_rate}<span className="text-sm font-normal opacity-60">/day</span></p>
            </div>
          ))}
        </div>
      )}

      {/* Campaigns List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-[#1A2F3A] flex items-center gap-2">
            <BarChart3 size={18} /> Your Campaigns
          </h2>
        </div>
        {campaigns.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Rocket size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No campaigns yet. Create one to boost your listings!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {campaigns.map(c => (
              <div key={c.id} className="p-5 flex items-center justify-between hover:bg-gray-50" data-testid={`campaign-${c.id}`}>
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                    c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {c.status}
                  </div>
                  <div>
                    <p className="font-medium text-[#1A2F3A]">{c.listing?.title || 'Listing'}</p>
                    <p className="text-xs text-gray-500 capitalize">{c.campaign_type} - {c.duration_days} days</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-semibold text-[#1A2F3A]">{c.impressions || 0}</p>
                    <p className="text-[10px] text-gray-400">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-[#1A2F3A]">{c.clicks || 0}</p>
                    <p className="text-[10px] text-gray-400">Clicks</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-[#1A2F3A]">${c.total_cost?.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400">Cost</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()} data-testid="create-campaign-modal">
            <h3 className="font-semibold text-lg text-[#1A2F3A] mb-4">Create Campaign</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Listing</label>
                <select
                  value={form.listing_id}
                  onChange={e => setForm(f => ({ ...f, listing_id: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                  data-testid="campaign-listing-select"
                >
                  <option value="">Select a listing...</option>
                  {listings.map(l => (
                    <option key={l.id} value={l.id}>{l.title} - ${l.price?.toLocaleString()}/mo</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Campaign Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(pricing || {}).map(([key, tier]) => (
                    <button
                      key={key}
                      onClick={() => setForm(f => ({ ...f, campaign_type: key }))}
                      className={`p-3 rounded-xl text-center text-xs font-medium transition-all ${
                        form.campaign_type === key ? 'bg-[#1A2F3A] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <p className="font-bold">{tier.label}</p>
                      <p className="opacity-70">${tier.daily_rate}/day</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[7, 14, 21, 30].map(d => (
                    <button
                      key={d}
                      onClick={() => setForm(f => ({ ...f, duration_days: d }))}
                      className={`p-2.5 rounded-xl text-xs font-medium transition-all ${
                        form.duration_days === d ? 'bg-[#1A2F3A] text-white' : 'bg-gray-50 text-gray-600'
                      }`}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Cost</span>
                  <span className="font-bold text-[#1A2F3A]">
                    ${((pricing?.[form.campaign_type]?.daily_rate || 2.99) * form.duration_days).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={createCampaign}
                disabled={loading || !form.listing_id}
                className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-50 font-medium"
                data-testid="submit-campaign-btn"
              >
                {loading ? 'Creating...' : 'Launch Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
