import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, ArrowLeft, Plus, MapPin, DollarSign, Calendar,
  Clock, Check, Users, ChevronRight, Send, Star, Award
} from 'lucide-react';
import { useAuth } from '../App';
import { trackFeatureEngagement } from '../lib/firebase';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const jobCategories = [
  'plumbing', 'electrical', 'painting', 'flooring', 'roofing',
  'landscaping', 'cleaning', 'hvac', 'carpentry', 'general'
];

const Jobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [showModal, setShowModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [bidForm, setBidForm] = useState({
    amount: '',
    estimated_days: '',
    message: ''
  });
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    location: 'Vancouver, BC',
    budget_min: '',
    budget_max: '',
    deadline: ''
  });

  const isLandlord = user?.user_type === 'landlord';
  const isContractor = user?.user_type === 'contractor';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchJobs();
    trackFeatureEngagement('jobs_page');
  }, [user, navigate]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Fetch available jobs
      const jobsResponse = await axios.get(`${API}/jobs`);
      setJobs(jobsResponse.data);
      
      // Fetch user's jobs
      if (isLandlord) {
        const myJobsResponse = await axios.get(`${API}/jobs/landlord/${user.id}`);
        setMyJobs(myJobsResponse.data);
      } else if (isContractor) {
        const myJobsResponse = await axios.get(`${API}/jobs/contractor/${user.id}`);
        setMyJobs(myJobsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/jobs?landlord_id=${user.id}`, {
        ...form,
        budget_min: parseFloat(form.budget_min) || null,
        budget_max: parseFloat(form.budget_max) || null
      });
      setShowModal(false);
      setForm({ title: '', description: '', category: 'general', location: 'Vancouver, BC', budget_min: '', budget_max: '', deadline: '' });
      fetchJobs();
      alert('Job posted successfully!');
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to post job. Please try again.');
    }
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;
    
    try {
      await axios.post(`${API}/jobs/${selectedJob.id}/bid`, {
        contractor_id: user.id,
        amount: parseFloat(bidForm.amount),
        estimated_days: parseInt(bidForm.estimated_days),
        message: bidForm.message
      });
      setShowBidModal(false);
      setBidForm({ amount: '', estimated_days: '', message: '' });
      setSelectedJob(null);
      fetchJobs();
      alert('Bid submitted successfully!');
    } catch (error) {
      console.error('Error submitting bid:', error);
      alert('Failed to submit bid. Please try again.');
    }
  };

  const handleSelectBid = async (jobId, bidId) => {
    try {
      await axios.post(`${API}/jobs/${jobId}/select-bid?bid_id=${bidId}&landlord_id=${user.id}`);
      fetchJobs();
      alert('Bid accepted! The contractor has been notified.');
    } catch (error) {
      console.error('Error selecting bid:', error);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      open: { bg: 'bg-green-100', text: 'text-green-700', label: 'Open' },
      assigned: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Assigned' },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'In Progress' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed' }
    };
    const config = configs[status] || configs.open;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="bg-[#1A2F3A] text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-white/70 hover:text-white">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {isContractor ? 'Job Marketplace' : 'Contractor Jobs'}
              </h1>
              <p className="text-sm text-white/70">
                {isContractor ? 'Find and bid on jobs' : 'Post jobs and manage contractors'}
              </p>
            </div>
          </div>
          {isLandlord && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
              data-testid="post-job-btn"
            >
              <Plus size={16} />
              Post Job
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              activeTab === 'browse' 
                ? 'bg-[#1A2F3A] text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isContractor ? 'Available Jobs' : 'Browse Contractors'}
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              activeTab === 'my' 
                ? 'bg-[#1A2F3A] text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isLandlord ? 'My Posted Jobs' : 'My Jobs'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-[#1A2F3A]">{jobs.length}</p>
            <p className="text-sm text-gray-500">Available Jobs</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-green-600">
              {jobs.filter(j => j.status === 'open').length}
            </p>
            <p className="text-sm text-gray-500">Open for Bids</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-blue-600">{myJobs.length}</p>
            <p className="text-sm text-gray-500">{isLandlord ? 'My Posted' : 'My Jobs'}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl">
            <p className="text-2xl font-semibold text-purple-600">
              {myJobs.filter(j => j.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (activeTab === 'browse' ? jobs : myJobs).length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Briefcase className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">
              {activeTab === 'browse' ? 'No Jobs Available' : 'No Jobs Yet'}
            </h3>
            <p className="text-gray-500">
              {isLandlord && activeTab === 'my' 
                ? 'Post your first job to find contractors' 
                : 'Check back later for new opportunities'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(activeTab === 'browse' ? jobs : myJobs).map(job => (
              <div 
                key={job.id}
                className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow"
                data-testid={`job-${job.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-[#1A2F3A] text-lg mb-1">{job.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {job.location}
                      </span>
                      <span className="capitalize px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {job.category}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(job.status)}
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    {(job.budget_min || job.budget_max) && (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <DollarSign size={14} />
                        {job.budget_min && job.budget_max 
                          ? `$${job.budget_min} - $${job.budget_max}`
                          : job.budget_max ? `Up to $${job.budget_max}` : `From $${job.budget_min}`
                        }
                      </span>
                    )}
                    {job.deadline && (
                      <span className="flex items-center gap-1 text-gray-500">
                        <Calendar size={14} /> Due {job.deadline}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-blue-600">
                      <Users size={14} /> {job.bids?.length || 0} bids
                    </span>
                  </div>

                  {isContractor && job.status === 'open' && (
                    <button
                      onClick={() => { setSelectedJob(job); setShowBidModal(true); }}
                      className="px-4 py-2 bg-[#1A2F3A] text-white rounded-full text-sm hover:bg-[#2C4A52] flex items-center gap-2"
                      data-testid={`bid-btn-${job.id}`}
                    >
                      <Send size={14} />
                      Submit Bid
                    </button>
                  )}
                </div>

                {/* Landlord View: Show Bids */}
                {isLandlord && job.bids?.length > 0 && activeTab === 'my' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-3">Bids ({job.bids.length})</p>
                    <div className="space-y-2">
                      {job.bids.map(bid => (
                        <div 
                          key={bid.id}
                          className={`flex items-center justify-between p-3 rounded-xl ${
                            job.selected_bid_id === bid.id ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#1A2F3A] flex items-center justify-center text-white">
                              <Users size={16} />
                            </div>
                            <div>
                              <p className="font-medium text-[#1A2F3A]">${bid.amount}</p>
                              <p className="text-xs text-gray-500">{bid.estimated_days} days • {bid.message?.slice(0, 50)}...</p>
                            </div>
                          </div>
                          {job.status === 'open' && (
                            <button
                              onClick={() => handleSelectBid(job.id, bid.id)}
                              className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200"
                            >
                              Accept
                            </button>
                          )}
                          {job.selected_bid_id === bid.id && (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                              <Check size={14} /> Selected
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Post Job Modal (Landlord) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Post a Job
            </h2>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Job Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                  placeholder="e.g., Kitchen Renovation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none capitalize"
                >
                  {jobCategories.map(cat => (
                    <option key={cat} value={cat} className="capitalize">{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({...form, location: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                  placeholder="Vancouver, BC"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Budget Min ($)</label>
                  <input
                    type="number"
                    value={form.budget_min}
                    onChange={(e) => setForm({...form, budget_min: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                    placeholder="500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Budget Max ($)</label>
                  <input
                    type="number"
                    value={form.budget_max}
                    onChange={(e) => setForm({...form, budget_max: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                    placeholder="2000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({...form, deadline: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none resize-none"
                  rows={4}
                  placeholder="Describe the work needed..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-[#1A2F3A] text-white hover:bg-[#2C4A52]"
                >
                  Post Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Bid Modal (Contractor) */}
      {showBidModal && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setShowBidModal(false); setSelectedJob(null); }}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Submit Bid
            </h2>
            <p className="text-gray-500 mb-6">{selectedJob.title}</p>

            <form onSubmit={handleSubmitBid} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Your Bid Amount ($)</label>
                <input
                  type="number"
                  value={bidForm.amount}
                  onChange={(e) => setBidForm({...bidForm, amount: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                  placeholder="Enter your quote"
                  required
                  data-testid="bid-amount-input"
                />
                {selectedJob.budget_max && (
                  <p className="text-xs text-gray-400 mt-1">
                    Client budget: ${selectedJob.budget_min || 0} - ${selectedJob.budget_max}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Estimated Days to Complete</label>
                <input
                  type="number"
                  value={bidForm.estimated_days}
                  onChange={(e) => setBidForm({...bidForm, estimated_days: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none"
                  placeholder="e.g., 5"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Message to Client</label>
                <textarea
                  value={bidForm.message}
                  onChange={(e) => setBidForm({...bidForm, message: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] outline-none resize-none"
                  rows={4}
                  placeholder="Describe your experience and approach..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowBidModal(false); setSelectedJob(null); }}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-[#1A2F3A] text-white hover:bg-[#2C4A52] flex items-center justify-center gap-2"
                  data-testid="submit-bid-btn"
                >
                  <Send size={16} />
                  Submit Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
