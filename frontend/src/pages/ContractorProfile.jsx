import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, X, Star,
  Shield, DollarSign, Clock, Phone, Mail, Globe, Briefcase, CheckCircle
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContractorProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [form, setForm] = useState({
    business_name: '', description: '', specialties: [], service_areas: [],
    hourly_rate: '', years_experience: '', license_number: '', insurance: false,
    phone: '', email: '', website: ''
  });
  const [serviceForm, setServiceForm] = useState({
    title: '', description: '', category: '', price_type: 'fixed', price: '', duration_estimate: ''
  });

  const specialtyOptions = ['plumbing', 'electrical', 'painting', 'renovation', 'carpentry',
    'flooring', 'landscaping', 'cleaning', 'HVAC', 'roofing', 'drywall', 'masonry'];
  const areaOptions = ['Vancouver', 'Burnaby', 'Richmond', 'North Vancouver', 'West Vancouver',
    'Surrey', 'New Westminster', 'Coquitlam', 'Port Moody', 'Delta'];

  useEffect(() => {
    if (!user || user.user_type !== 'contractor') { navigate('/login'); return; }
    fetchAll();
  }, [user, navigate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profRes, svcRes, bookRes] = await Promise.all([
        axios.get(`${API}/contractors/profile/${user.id}`).catch(() => null),
        axios.get(`${API}/contractors/${user.id}/services`).catch(() => ({ data: [] })),
        axios.get(`${API}/bookings/contractor/${user.id}`).catch(() => ({ data: [] }))
      ]);
      if (profRes?.data) {
        setProfile(profRes.data);
        setForm({
          business_name: profRes.data.business_name || '',
          description: profRes.data.description || '',
          specialties: profRes.data.specialties || [],
          service_areas: profRes.data.service_areas || [],
          hourly_rate: profRes.data.hourly_rate || '',
          years_experience: profRes.data.years_experience || '',
          license_number: profRes.data.license_number || '',
          insurance: profRes.data.insurance || false,
          phone: profRes.data.phone || '',
          email: profRes.data.email || '',
          website: profRes.data.website || ''
        });
      }
      setServices(svcRes?.data || []);
      setBookings(bookRes?.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
        years_experience: form.years_experience ? parseInt(form.years_experience) : 0
      };
      await axios.post(`${API}/contractors/profile?user_id=${user.id}`, data);
      await fetchAll();
      alert('Profile saved!');
    } catch (e) { console.error(e); alert('Failed to save.'); }
    setSaving(false);
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      const data = { ...serviceForm, price: serviceForm.price ? parseFloat(serviceForm.price) : null };
      await axios.post(`${API}/contractors/services?contractor_id=${user.id}`, data);
      setShowServiceModal(false);
      setServiceForm({ title: '', description: '', category: '', price_type: 'fixed', price: '', duration_estimate: '' });
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await axios.delete(`${API}/contractors/services/${serviceId}?contractor_id=${user.id}`);
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const handleBookingStatus = async (bookingId, status) => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/status?status=${status}&user_id=${user.id}`);
      fetchAll();
    } catch (e) { console.error(e); }
  };

  const toggleSpecialty = (s) => setForm(prev => ({ ...prev, specialties: prev.specialties.includes(s) ? prev.specialties.filter(x => x !== s) : [...prev.specialties, s] }));
  const toggleArea = (a) => setForm(prev => ({ ...prev, service_areas: prev.service_areas.includes(a) ? prev.service_areas.filter(x => x !== a) : [...prev.service_areas, a] }));

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-purple-100 text-purple-700', completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-600'
  };

  if (loading) return <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <header className="bg-[#1A2F3A] text-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link to="/dashboard" className="text-white/70 hover:text-white"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Contractor Dashboard</h1>
            <p className="text-sm text-white/70">Manage your profile, services & bookings</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl"><p className="text-2xl font-semibold text-[#1A2F3A]">{profile?.rating || 0}</p><p className="text-sm text-gray-500">Rating</p></div>
          <div className="bg-white p-4 rounded-2xl"><p className="text-2xl font-semibold text-[#1A2F3A]">{profile?.review_count || 0}</p><p className="text-sm text-gray-500">Reviews</p></div>
          <div className="bg-white p-4 rounded-2xl"><p className="text-2xl font-semibold text-[#1A2F3A]">{services.length}</p><p className="text-sm text-gray-500">Services</p></div>
          <div className="bg-white p-4 rounded-2xl"><p className="text-2xl font-semibold text-[#1A2F3A]">{bookings.length}</p><p className="text-sm text-gray-500">Bookings</p></div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-6">
          {['profile', 'services', 'bookings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm capitalize transition-colors ${activeTab === tab ? 'bg-[#1A2F3A] text-white' : 'text-gray-500 hover:text-gray-700'}`}
              data-testid={`tab-${tab}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Business Name</label>
              <input type="text" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" required data-testid="business-name-input" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none resize-none" rows={3} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Hourly Rate ($)</label>
                <input type="number" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Years Experience</label>
                <input type="number" value={form.years_experience} onChange={e => setForm({ ...form, years_experience: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Website</label>
                <input type="text" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="https://" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">License Number</label>
              <input type="text" value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.insurance} onChange={e => setForm({ ...form, insurance: e.target.checked })} className="w-5 h-5 rounded" />
              <span className="text-sm text-gray-700">I have liability insurance</span>
            </label>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Specialties</label>
              <div className="flex flex-wrap gap-2">
                {specialtyOptions.map(s => (
                  <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                    className={`px-3 py-1.5 rounded-full text-xs capitalize transition-colors ${form.specialties.includes(s) ? 'bg-[#1A2F3A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Service Areas</label>
              <div className="flex flex-wrap gap-2">
                {areaOptions.map(a => (
                  <button key={a} type="button" onClick={() => toggleArea(a)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${form.service_areas.includes(a) ? 'bg-[#1A2F3A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="save-profile-btn">
              <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1A2F3A]">Your Services</h3>
              <button onClick={() => setShowServiceModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1A2F3A] text-white rounded-full text-sm hover:bg-[#2C4A52]" data-testid="add-service-btn">
                <Plus size={14} /> Add Service
              </button>
            </div>
            {services.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Briefcase className="mx-auto mb-3 text-gray-300" size={48} />
                <p className="text-gray-500">No services yet. Add your first service listing.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map(svc => (
                  <div key={svc.id} className="bg-white rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-[#1A2F3A]">{svc.title}</h4>
                      <p className="text-sm text-gray-500">{svc.category} · {svc.duration_estimate}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {svc.price && <span className="font-semibold text-[#1A2F3A]">${svc.price}</span>}
                      <button onClick={() => handleDeleteService(svc.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <h3 className="text-lg font-semibold text-[#1A2F3A] mb-4">Your Bookings</h3>
            {bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <Clock className="mx-auto mb-3 text-gray-300" size={48} />
                <p className="text-gray-500">No bookings yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b.id} className="bg-white rounded-2xl p-5" data-testid={`booking-${b.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-[#1A2F3A]">{b.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs ${statusColors[b.status]}`}>{b.status?.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{b.description}</p>
                    {b.customer && <p className="text-xs text-gray-400 mb-2">From: {b.customer.name || b.customer.email}</p>}
                    {b.preferred_date && <p className="text-xs text-gray-400">Date: {b.preferred_date} {b.preferred_time}</p>}
                    {b.amount && <p className="text-sm font-medium text-[#1A2F3A] mt-2">${b.amount}</p>}
                    {b.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleBookingStatus(b.id, 'confirmed')} className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm hover:bg-green-200" data-testid={`confirm-${b.id}`}>
                          <CheckCircle size={14} className="inline mr-1" /> Confirm
                        </button>
                        <button onClick={() => handleBookingStatus(b.id, 'cancelled')} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm hover:bg-red-100">
                          Cancel
                        </button>
                      </div>
                    )}
                    {b.status === 'confirmed' && (
                      <button onClick={() => handleBookingStatus(b.id, 'in_progress')} className="mt-3 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm hover:bg-purple-200">
                        Start Job
                      </button>
                    )}
                    {b.status === 'in_progress' && (
                      <button onClick={() => handleBookingStatus(b.id, 'completed')} className="mt-3 px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm hover:bg-green-200">
                        Mark Complete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowServiceModal(false)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Add Service</h2>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Title</label>
                <input type="text" value={serviceForm.title} onChange={e => setServiceForm({ ...serviceForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Category</label>
                <select value={serviceForm.category} onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" required>
                  <option value="">Select...</option>
                  {specialtyOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Description</label>
                <textarea value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none resize-none" rows={3} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Price ($)</label>
                  <input type="number" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Duration</label>
                  <input type="text" value={serviceForm.duration_estimate} onChange={e => setServiceForm({ ...serviceForm, duration_estimate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none" placeholder="e.g., 2-4 hours" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowServiceModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-[#1A2F3A] text-white hover:bg-[#2C4A52]" data-testid="create-service-btn">Create Service</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorProfile;
