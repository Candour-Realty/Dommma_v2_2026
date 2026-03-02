import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowRightLeft, Calendar, DollarSign, MapPin, Home, 
  Clock, Search, Filter, Plus, CheckCircle2, AlertCircle,
  Building, Bed, Bath, Car, Wifi, PawPrint, Sparkles,
  MessageSquare, Phone, Mail, ExternalLink, TrendingUp,
  CreditCard, Loader2
} from 'lucide-react';
import { useAuth } from '../App';
import MainLayout from '../components/layout/MainLayout';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function LeaseAssignments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingPayment, setProcessingPayment] = useState(null);

  // Form state for creating assignment
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    address: '',
    city: 'Vancouver',
    current_rent: '',
    assignment_fee: '',
    remaining_months: '',
    available_date: '',
    bedrooms: 1,
    bathrooms: 1,
    amenities: [],
    description: '',
    reason: ''
  });

  useEffect(() => {
    fetchAssignments();
    
    // Handle payment callback
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    
    if (paymentStatus === 'success' && sessionId) {
      // Show success message
      alert('Payment successful! The lease assignment fee has been paid.');
      // Clear URL params
      setSearchParams({});
    } else if (paymentStatus === 'cancelled') {
      alert('Payment was cancelled.');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handlePayAssignmentFee = async (assignment) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    setProcessingPayment(assignment.id);
    try {
      const response = await axios.post(`${API}/api/lease-assignments/${assignment.id}/payment?buyer_id=${user.id}`);
      
      if (response.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment: ' + (error.response?.data?.detail || error.message));
      setProcessingPayment(null);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`${API}/api/lease-assignments`);
      setAssignments(response.data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      // Demo data
      setAssignments(generateDemoAssignments());
    } finally {
      setLoading(false);
    }
  };

  const generateDemoAssignments = () => {
    return [
      {
        id: '1',
        title: 'Modern 1BR in Yaletown',
        address: '1088 Richards St',
        city: 'Vancouver',
        current_rent: 2200,
        market_rent: 2500,
        assignment_fee: 1800,
        remaining_months: 8,
        available_date: '2026-04-01',
        bedrooms: 1,
        bathrooms: 1,
        sqft: 650,
        amenities: ['Gym', 'Rooftop', 'Concierge'],
        pet_friendly: false,
        description: 'Beautiful corner unit with floor-to-ceiling windows and city views. Building has amazing amenities.',
        reason: 'Relocating for work',
        owner: { name: 'Alex M.', avatar: 'A' },
        savings_per_month: 300,
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'],
        created_at: '2026-02-25',
        status: 'active',
        verified: true
      },
      {
        id: '2',
        title: 'Spacious 2BR near Commercial',
        address: '1650 Commercial Dr',
        city: 'Vancouver',
        current_rent: 2400,
        market_rent: 2650,
        assignment_fee: 1200,
        remaining_months: 5,
        available_date: '2026-03-15',
        bedrooms: 2,
        bathrooms: 1,
        sqft: 850,
        amenities: ['In-suite Laundry', 'Parking', 'Storage'],
        pet_friendly: true,
        description: 'Great location in vibrant Commercial Drive area. Walking distance to shops, cafes, and SkyTrain.',
        reason: 'Moving in with partner',
        owner: { name: 'Jamie L.', avatar: 'J' },
        savings_per_month: 250,
        images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'],
        created_at: '2026-02-20',
        status: 'active',
        verified: false
      },
      {
        id: '3',
        title: 'Studio in Downtown Core',
        address: '833 Seymour St',
        city: 'Vancouver',
        current_rent: 1650,
        market_rent: 1850,
        assignment_fee: 800,
        remaining_months: 4,
        available_date: '2026-04-15',
        bedrooms: 0,
        bathrooms: 1,
        sqft: 450,
        amenities: ['Gym', 'Bike Storage'],
        pet_friendly: false,
        description: 'Cozy studio perfect for students or young professionals. Steps from everything downtown.',
        reason: 'Graduating and leaving city',
        owner: { name: 'Sam K.', avatar: 'S' },
        savings_per_month: 200,
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'],
        created_at: '2026-02-28',
        status: 'active',
        verified: true
      }
    ];
  };

  const handleCreateAssignment = async () => {
    try {
      const response = await axios.post(`${API}/api/lease-assignments`, {
        ...newAssignment,
        owner_id: user?.id,
        owner_name: user?.name
      });
      setAssignments(prev => [response.data, ...prev]);
      setShowCreateModal(false);
      setNewAssignment({
        title: '',
        address: '',
        city: 'Vancouver',
        current_rent: '',
        assignment_fee: '',
        remaining_months: '',
        available_date: '',
        bedrooms: 1,
        bathrooms: 1,
        amenities: [],
        description: '',
        reason: ''
      });
    } catch (error) {
      console.error('Error creating assignment:', error);
      // Still close modal in demo mode
      setShowCreateModal(false);
    }
  };

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'verified' && !a.verified) return false;
    if (filter === 'pet_friendly' && !a.pet_friendly) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        a.title?.toLowerCase().includes(query) ||
        a.address?.toLowerCase().includes(query) ||
        a.city?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const amenityOptions = [
    'Gym', 'Rooftop', 'Concierge', 'Pool', 'In-suite Laundry', 
    'Parking', 'Storage', 'Bike Storage', 'EV Charging'
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F5F5F0]">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] py-16 px-4">
          <div className="max-w-6xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-semibold mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              <ArrowRightLeft className="inline-block mr-3 mb-1" size={40} />
              Lease Assignment Marketplace
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Take over someone's lease and save money, or list your lease for transfer
            </p>
            
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by location, neighborhood..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-[#1A2F3A] outline-none focus:ring-2 focus:ring-white/30"
                  data-testid="assignment-search"
                />
              </div>
              {user && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-4 bg-white text-[#1A2F3A] rounded-xl font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                  data-testid="create-assignment-btn"
                >
                  <Plus size={20} /> List Your Lease
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto py-8 px-4">
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8 border border-blue-100">
            <div className="flex items-start gap-4">
              <Sparkles className="text-purple-500 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-[#1A2F3A] mb-1">How Lease Assignments Work</h3>
                <p className="text-gray-600 text-sm">
                  A lease assignment lets you take over someone's existing lease - often at below-market rent. 
                  The original tenant pays you an assignment fee (typically based on the monthly savings). 
                  You get a great deal, they get out of their lease. Win-win!
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Filter size={18} className="text-gray-500" />
            {[
              { value: 'all', label: 'All Listings' },
              { value: 'verified', label: 'Verified Only' },
              { value: 'pet_friendly', label: 'Pet Friendly' }
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  filter === f.value 
                    ? 'bg-[#1A2F3A] text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="text-sm text-gray-500 ml-auto">
              {filteredAssignments.length} lease{filteredAssignments.length !== 1 ? 's' : ''} available
            </span>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A2F3A] mx-auto"></div>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <ArrowRightLeft size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Lease Assignments Found</h3>
              <p className="text-gray-600 mb-6">
                Be the first to list your lease for assignment!
              </p>
              {user && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-[#1A2F3A] text-white rounded-lg font-medium hover:bg-[#2C4A52] transition-colors"
                >
                  List Your Lease
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map((assignment, index) => (
                <div 
                  key={assignment.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                  data-testid={`assignment-card-${index}`}
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200">
                    <img 
                      src={assignment.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'}
                      alt={assignment.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {assignment.verified && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={12} /> Verified
                        </span>
                      )}
                      {assignment.pet_friendly && (
                        <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <PawPrint size={12} /> Pet OK
                        </span>
                      )}
                    </div>
                    {/* Savings Badge */}
                    <div className="absolute top-3 right-3 bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">
                      Save ${assignment.savings_per_month}/mo
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-[#1A2F3A] text-lg mb-1">{assignment.title}</h3>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mb-3">
                      <MapPin size={14} /> {assignment.address}, {assignment.city}
                    </p>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Bed size={14} /> {assignment.bedrooms === 0 ? 'Studio' : `${assignment.bedrooms} bed`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath size={14} /> {assignment.bathrooms} bath
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {assignment.remaining_months} mo left
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="bg-[#F5F5F0] rounded-xl p-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Current Rent</span>
                        <span className="font-semibold text-[#1A2F3A]">${assignment.current_rent?.toLocaleString()}/mo</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Market Rent</span>
                        <span className="text-gray-500 line-through">${assignment.market_rent?.toLocaleString()}/mo</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-sm font-medium text-[#1A2F3A]">Assignment Fee</span>
                        <span className="font-bold text-green-600">${assignment.assignment_fee?.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Reason */}
                    <p className="text-xs text-gray-500 italic mb-4">
                      "{assignment.reason}"
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button className="flex-1 px-4 py-2 bg-[#1A2F3A] text-white rounded-lg font-medium hover:bg-[#2C4A52] transition-colors">
                        Contact
                      </button>
                      <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <MessageSquare size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Assignment Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-2xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  List Your Lease for Assignment
                </h2>
                <p className="text-gray-600 mt-1">
                  Help someone find a great deal while you get out of your lease
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Listing Title</label>
                  <input
                    type="text"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Modern 1BR in Yaletown"
                    className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                  />
                </div>

                {/* Address */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Address</label>
                    <input
                      type="text"
                      value={newAssignment.address}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Main St"
                      className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">City</label>
                    <select
                      value={newAssignment.city}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                    >
                      <option>Vancouver</option>
                      <option>Burnaby</option>
                      <option>Richmond</option>
                      <option>New Westminster</option>
                      <option>Coquitlam</option>
                      <option>Surrey</option>
                    </select>
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Current Rent ($/mo)</label>
                    <input
                      type="number"
                      value={newAssignment.current_rent}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, current_rent: e.target.value }))}
                      placeholder="2000"
                      className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Assignment Fee ($)</label>
                    <input
                      type="number"
                      value={newAssignment.assignment_fee}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, assignment_fee: e.target.value }))}
                      placeholder="1000"
                      className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Months Remaining</label>
                    <input
                      type="number"
                      value={newAssignment.remaining_months}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, remaining_months: e.target.value }))}
                      placeholder="6"
                      className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                    />
                  </div>
                </div>

                {/* Unit Details */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Bedrooms</label>
                    <select
                      value={newAssignment.bedrooms}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, bedrooms: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                    >
                      <option value={0}>Studio</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4+</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Bathrooms</label>
                    <select
                      value={newAssignment.bathrooms}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, bathrooms: parseFloat(e.target.value) }))}
                      className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                    >
                      <option value={1}>1</option>
                      <option value={1.5}>1.5</option>
                      <option value={2}>2</option>
                      <option value={2.5}>2.5</option>
                      <option value={3}>3+</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Available Date</label>
                    <input
                      type="date"
                      value={newAssignment.available_date}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, available_date: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                    />
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <label className="text-sm text-gray-600 block mb-2">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {amenityOptions.map(amenity => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => {
                          setNewAssignment(prev => ({
                            ...prev,
                            amenities: prev.amenities.includes(amenity)
                              ? prev.amenities.filter(a => a !== amenity)
                              : [...prev.amenities, amenity]
                          }));
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          newAssignment.amenities.includes(amenity)
                            ? 'bg-[#1A2F3A] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Why are you assigning?</label>
                  <input
                    type="text"
                    value={newAssignment.reason}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g., Relocating for work"
                    className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Description</label>
                  <textarea
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell potential assignees about the unit and neighborhood..."
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:border-[#1A2F3A] focus:ring-1 focus:ring-[#1A2F3A] outline-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAssignment}
                  className="px-6 py-2 bg-[#1A2F3A] text-white rounded-lg font-medium hover:bg-[#2C4A52] transition-colors"
                >
                  List Lease
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
