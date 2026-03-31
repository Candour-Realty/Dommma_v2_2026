import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Download, FileText, Calendar, CheckCircle,
  Clock, AlertCircle, Loader2, Filter, Receipt
} from 'lucide-react';
import { useAuth } from '../App';
import DashboardLayout from '../components/layout/DashboardLayout';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentHistory() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('tenant');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) fetchPayments();
  }, [user, role]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/payments/history?user_id=${user.id}&role=${role}`);
      setPayments(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const downloadReceipt = async (paymentId) => {
    try {
      const res = await axios.get(`${API}/payments/${paymentId}/receipt`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DOMMMA_Receipt_${paymentId.slice(0, 8).toUpperCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert(e.response?.status === 400 ? 'Receipt only available for completed payments' : 'Failed to download receipt');
    }
  };

  const filtered = payments.filter(p => filter === 'all' || p.status === filter);

  const statusIcon = (status) => {
    switch (status) {
      case 'paid': case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'pending': return <Clock size={16} className="text-yellow-500" />;
      case 'overdue': return <AlertCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'paid': case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (!user) return null;

  const totalPaid = payments.filter(p => p.status === 'paid' || p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((s, p) => s + (p.total_due || p.amount || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="payment-history-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1A2F3A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Payment History
            </h1>
            <p className="text-gray-500 mt-1">Track all your rent payments and download receipts</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
            <button onClick={() => setRole('tenant')} className={`px-3 py-1.5 rounded-full text-sm ${role === 'tenant' ? 'bg-white shadow text-[#1A2F3A]' : 'text-gray-500'}`} data-testid="role-tenant">Tenant</button>
            <button onClick={() => setRole('landlord')} className={`px-3 py-1.5 rounded-full text-sm ${role === 'landlord' ? 'bg-white shadow text-[#1A2F3A]' : 'text-gray-500'}`} data-testid="role-landlord">Landlord</button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-2xl font-bold text-green-700">${totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pending / Overdue</p>
            <p className="text-2xl font-bold text-orange-600">${totalPending.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Transactions</p>
            <p className="text-2xl font-bold text-[#1A2F3A]">{payments.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
            <Filter size={16} className="text-gray-400" />
            {['all', 'paid', 'pending', 'overdue'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-sm ${filter === f ? 'bg-[#1A2F3A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                data-testid={`filter-${f}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)} {f !== 'all' ? `(${payments.filter(p => p.status === f).length})` : `(${payments.length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-12 text-center"><Loader2 size={24} className="animate-spin text-gray-400 mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">No payments found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100" data-testid="payment-list">
              {filtered.map(p => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50" data-testid={`payment-${p.id}`}>
                  <div className="flex items-center gap-4">
                    {statusIcon(p.status)}
                    <div>
                      <p className="font-medium text-[#1A2F3A] text-sm">{p.property_title || 'Rent Payment'}</p>
                      <p className="text-xs text-gray-500">{p.property_address}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.due_month || (p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-[#1A2F3A]">${(p.total_due || p.amount || 0).toLocaleString()}</p>
                      {p.late_fee > 0 && <p className="text-xs text-red-500">+${p.late_fee} late fee</p>}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
                    {(p.status === 'paid' || p.status === 'completed') && (
                      <button onClick={() => downloadReceipt(p.id)} className="p-2 hover:bg-gray-100 rounded-lg" data-testid={`download-receipt-${p.id}`} title="Download Receipt">
                        <Download size={16} className="text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
