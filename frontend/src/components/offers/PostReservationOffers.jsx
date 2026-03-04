import React, { useState, useEffect } from 'react';
import { 
  Truck, Wifi, Shield, Sparkles, Package, Zap, 
  ChevronRight, X, Check, Star, Phone, ExternalLink
} from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * PostReservationOffers - Shows recommended services after a renter reserves a property
 * Displays movers, wifi providers, insurance, and other services for the new area
 */
const PostReservationOffers = ({ reservation, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState({
    movers: [],
    wifi: [],
    insurance: [],
    utilities: []
  });
  const [selectedOffers, setSelectedOffers] = useState([]);

  useEffect(() => {
    fetchLocalOffers();
  }, [reservation]);

  const fetchLocalOffers = async () => {
    setLoading(true);
    try {
      // Fetch local service providers based on property location
      const city = reservation?.city || 'Vancouver';
      
      // In production, this would call real APIs. For now, use curated local providers
      const localOffers = {
        movers: [
          { id: 'm1', name: 'BC Moving Co.', rating: 4.8, reviews: 234, price: 'From $99/hr', phone: '604-555-0101', featured: true },
          { id: 'm2', name: 'Vancouver Movers', rating: 4.6, reviews: 156, price: 'From $89/hr', phone: '604-555-0102' },
          { id: 'm3', name: 'Quick Move YVR', rating: 4.5, reviews: 89, price: 'From $79/hr', phone: '604-555-0103' },
        ],
        wifi: [
          { id: 'w1', name: 'Telus', rating: 4.2, price: '$75/mo', promo: '3 months free', featured: true },
          { id: 'w2', name: 'Shaw', rating: 4.0, price: '$70/mo', promo: 'Free installation' },
          { id: 'w3', name: 'Novus', rating: 4.5, price: '$65/mo', promo: 'No contract' },
        ],
        insurance: [
          { id: 'i1', name: 'BCAA Renters Insurance', rating: 4.7, price: 'From $20/mo', featured: true },
          { id: 'i2', name: 'Square One Insurance', rating: 4.5, price: 'From $15/mo' },
        ],
        utilities: [
          { id: 'u1', name: 'BC Hydro Setup', rating: 4.3, price: 'Free', link: 'https://bchydro.com' },
          { id: 'u2', name: 'FortisBC Gas', rating: 4.2, price: 'Free', link: 'https://fortisbc.com' },
        ]
      };
      
      setOffers(localOffers);
    } catch (error) {
      console.error('Error fetching local offers:', error);
    }
    setLoading(false);
  };

  const toggleOffer = (category, offerId) => {
    const key = `${category}-${offerId}`;
    setSelectedOffers(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleContactSelected = async () => {
    // In production, this would send contact requests to selected providers
    alert(`Contact requests sent to ${selectedOffers.length} providers! They will reach out shortly.`);
    onClose?.();
  };

  const categoryIcons = {
    movers: Truck,
    wifi: Wifi,
    insurance: Shield,
    utilities: Zap
  };

  const categoryTitles = {
    movers: 'Moving Companies',
    wifi: 'Internet Providers',
    insurance: 'Renters Insurance',
    utilities: 'Utilities Setup'
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <Sparkles className="w-8 h-8 text-[#1A2F3A] animate-pulse mx-auto mb-4" />
        <p className="text-gray-600">Finding the best services for your new place...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A2F3A] to-[#2C4A52] text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">Get Ready for Your New Home!</h2>
            <p className="text-white/70 text-sm">We found these trusted services in {reservation?.city || 'your area'}</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Service Categories */}
      <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
        {Object.entries(offers).map(([category, items]) => {
          if (items.length === 0) return null;
          const Icon = categoryIcons[category];
          
          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={20} className="text-[#1A2F3A]" />
                <h3 className="font-semibold text-[#1A2F3A]">{categoryTitles[category]}</h3>
              </div>
              <div className="space-y-2">
                {items.map(offer => {
                  const isSelected = selectedOffers.includes(`${category}-${offer.id}`);
                  return (
                    <div 
                      key={offer.id}
                      onClick={() => toggleOffer(category, offer.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[#1A2F3A] bg-[#1A2F3A]/5' 
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-[#1A2F3A] bg-[#1A2F3A]' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#1A2F3A]">{offer.name}</span>
                          {offer.featured && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          {offer.rating && (
                            <span className="flex items-center gap-1">
                              <Star size={12} className="text-yellow-500 fill-yellow-500" />
                              {offer.rating}
                            </span>
                          )}
                          {offer.reviews && <span>({offer.reviews} reviews)</span>}
                          {offer.price && <span className="font-medium text-[#1A2F3A]">{offer.price}</span>}
                        </div>
                        {offer.promo && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            {offer.promo}
                          </span>
                        )}
                      </div>
                      {offer.phone && (
                        <a 
                          href={`tel:${offer.phone}`} 
                          onClick={e => e.stopPropagation()}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Phone size={16} className="text-gray-400" />
                        </a>
                      )}
                      {offer.link && (
                        <a 
                          href={offer.link} 
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <ExternalLink size={16} className="text-gray-400" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="border-t p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {selectedOffers.length} service{selectedOffers.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Maybe Later
            </button>
            <button 
              onClick={handleContactSelected}
              disabled={selectedOffers.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-[#1A2F3A] text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2C4A52] transition-colors"
            >
              Contact Selected
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostReservationOffers;
