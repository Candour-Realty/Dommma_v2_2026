import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Search, Filter, MapPin, Briefcase, DollarSign,
  Calendar, Star, MessageSquare, CheckCircle, Clock,
  Building, User, Mail, Phone, FileText, ChevronRight,
  Eye, Heart, UserCheck, AlertCircle
} from 'lucide-react';
import { useAuth } from '../App';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function FindTenants() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch applications for landlord's properties
      const appsRes = await axios.get(`${API}/api/applications/landlord/${user.id}`);
      setApplications(appsRes.data || []);
      
      // Fetch leads (viewing requests, inquiries)
      try {
        const leadsRes = await axios.get(`${API}/api/leads?landlord_id=${user.id}`);
        setLeads(leadsRes.data || []);
      } catch (e) {
        // Leads endpoint might not exist
        setLeads([]);
      }
    } catch (error) {
      console.error('Error fetching tenant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (appId, status) => {
    try {
      await axios.put(`${API}/api/applications/${appId}/status`, { status });
      fetchData();
    } catch (error) {
      console.error('Error updating application:', error);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = !searchQuery || 
      app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.listing_title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'reviewing': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    thisMonth: applications.filter(a => {
      const date = new Date(a.created_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-[#1A2F3A] mb-2">Find Tenants</h1>
          <p className="text-gray-600">Manage applications and find qualified tenants for your properties</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A2F3A]">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Applications</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A2F3A]">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <UserCheck className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A2F3A]">{stats.approved}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1A2F3A]">{stats.thisMonth}</p>
                <p className="text-sm text-gray-500">This Month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'applications' 
                  ? 'text-[#1A2F3A] border-b-2 border-[#1A2F3A]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Applications ({applications.length})
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'leads' 
                  ? 'text-[#1A2F3A] border-b-2 border-[#1A2F3A]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Leads & Inquiries ({leads.length})
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by tenant name or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A2F3A]/20"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : activeTab === 'applications' ? (
          filteredApplications.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <Users className="mx-auto mb-4 text-gray-300" size={64} />
              <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Applications Yet</h3>
              <p className="text-gray-500 mb-6">
                When tenants apply to your properties, they'll appear here.
              </p>
              <Link
                to="/syndication"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A2F3A] text-white rounded-full hover:bg-[#2C4A52]"
              >
                Promote Your Listings
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map(app => (
                <div key={app.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Applicant Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1A2F3A] to-[#2C4A52] flex items-center justify-center text-white text-xl font-bold">
                        {app.applicant_name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1A2F3A]">{app.applicant_name || 'Unknown Applicant'}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail size={12} /> {app.applicant_email || 'No email'}
                        </p>
                        {app.applicant_phone && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone size={12} /> {app.applicant_phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Property Info */}
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Applied for:</p>
                      <p className="font-medium text-[#1A2F3A] flex items-center gap-1">
                        <Building size={14} /> {app.listing_title || 'Property'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                      </span>
                      
                      {app.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateApplicationStatus(app.id, 'approved')}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 flex items-center gap-1"
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(app.id, 'rejected')}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      
                      <Link
                        to={`/messages?tenant=${app.user_id}`}
                        className="p-2 bg-[#F5F5F0] rounded-lg hover:bg-gray-200"
                        title="Message Tenant"
                      >
                        <MessageSquare size={18} className="text-[#1A2F3A]" />
                      </Link>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {app.message && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600">{app.message}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* Leads Tab */
          leads.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <Eye className="mx-auto mb-4 text-gray-300" size={64} />
              <h3 className="text-xl font-semibold text-[#1A2F3A] mb-2">No Leads Yet</h3>
              <p className="text-gray-500 mb-6">
                Viewing requests and inquiries from potential tenants will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map(lead => (
                <div key={lead.id} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <User size={20} className="text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1A2F3A]">{lead.name}</h3>
                      <p className="text-sm text-gray-500">{lead.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{lead.type}</p>
                      <p className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
