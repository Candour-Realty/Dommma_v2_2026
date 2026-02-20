import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ChevronRight, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import ContractorReview from './ContractorReview';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PendingReviews = ({ userId }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchPendingReviews();
  }, [userId]);

  const fetchPendingReviews = async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`${API}/bookings/customer/${userId}`);
      // Filter for completed bookings without reviews
      const pending = response.data.filter(
        b => b.status === 'completed' && !b.rating
      );
      setBookings(pending);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
    setLoading(false);
  };

  const handleReviewed = () => {
    setSelectedBooking(null);
    fetchPendingReviews();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return null; // Don't show if no pending reviews
  }

  return (
    <>
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-5" data-testid="pending-reviews">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
            <Star className="text-yellow-500" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-[#1A2F3A]">Share Your Experience</h3>
            <p className="text-sm text-gray-600">You have {bookings.length} completed job{bookings.length > 1 ? 's' : ''} to review</p>
          </div>
        </div>

        <div className="space-y-2">
          {bookings.slice(0, 3).map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between p-3 bg-white rounded-xl cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedBooking(booking)}
              data-testid={`pending-review-${booking.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1A2F3A] flex items-center justify-center text-white font-medium">
                  {booking.contractor?.business_name?.charAt(0) || 'C'}
                </div>
                <div>
                  <p className="font-medium text-[#1A2F3A] text-sm">
                    {booking.contractor?.business_name || 'Contractor'}
                  </p>
                  <p className="text-xs text-gray-500">{booking.title}</p>
                </div>
              </div>
              <button className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium hover:bg-yellow-200 transition-colors">
                <MessageSquare size={12} />
                Review
              </button>
            </div>
          ))}
        </div>

        {bookings.length > 3 && (
          <button className="mt-3 w-full py-2 text-sm text-[#1A2F3A] hover:bg-white/50 rounded-xl flex items-center justify-center gap-1">
            View all {bookings.length} pending reviews <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Review Modal */}
      {selectedBooking && (
        <ContractorReview
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onReviewed={handleReviewed}
        />
      )}
    </>
  );
};

export default PendingReviews;
