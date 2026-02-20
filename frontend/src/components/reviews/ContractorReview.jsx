import React, { useState } from 'react';
import { Star, Send, X, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContractorReview = ({ booking, onClose, onReviewed }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (review.trim().length < 10) {
      setError('Please write at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await axios.post(
        `${API}/bookings/${booking.id}/review?customer_id=${booking.customer_id}`,
        { rating, review: review.trim() }
      );
      setSubmitted(true);
      if (onReviewed) onReviewed();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit review');
    }
    setIsSubmitting(false);
  };

  const ratingLabels = [
    '', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'
  ];

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="review-modal">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-3xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-500" size={32} />
          </div>
          <h3 className="text-2xl font-semibold text-[#1A2F3A] mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Thank You!
          </h3>
          <p className="text-gray-600 mb-6">
            Your review has been submitted and will help other customers find great contractors.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52]"
            data-testid="close-review-btn"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="review-modal">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Leave a Review
              </h3>
              <p className="text-sm text-white/70">Share your experience</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
              data-testid="close-review-modal-btn"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Contractor Info */}
          <div className="mb-6 p-4 bg-[#F5F5F0] rounded-xl">
            <p className="text-sm text-gray-500">Reviewing</p>
            <p className="font-semibold text-[#1A2F3A]">{booking.contractor?.business_name || 'Contractor'}</p>
            <p className="text-sm text-gray-500">{booking.title}</p>
          </div>

          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you rate this service?
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                  data-testid={`star-${star}`}
                >
                  <Star
                    size={36}
                    className={`transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hoverRating || rating) > 0 && (
              <p className="text-center text-sm text-[#1A2F3A] mt-2 font-medium">
                {ratingLabels[hoverRating || rating]}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Write your review
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell others about your experience with this contractor..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none resize-none"
              rows={4}
              data-testid="review-text-input"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {review.length} characters (minimum 10)
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-full py-4 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-50 flex items-center justify-center gap-2"
            data-testid="submit-review-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Submitting...
              </>
            ) : (
              <>
                <Send size={18} />
                Submit Review
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContractorReview;
