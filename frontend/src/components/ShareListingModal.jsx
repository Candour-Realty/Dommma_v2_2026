import React, { useState } from 'react';
import { Facebook, Twitter, Linkedin, Mail, Link2, Copy, Check, Share2, X, MessageCircle } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ShareListingModal({ listing, isOpen, onClose }) {
  const [links, setLinks] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && listing?.id) {
      setLoading(true);
      const baseUrl = window.location.origin;
      axios.get(`${API}/listings/${listing.id}/share-links?base_url=${baseUrl}`)
        .then(res => setLinks(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, listing?.id]);

  if (!isOpen) return null;

  const copyLink = () => {
    navigator.clipboard.writeText(links?.listing_url || window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const platforms = [
    { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-[#1877F2]' },
    { key: 'facebook_marketplace', label: 'FB Marketplace', icon: Facebook, color: 'bg-[#0866FF]' },
    { key: 'twitter', label: 'X / Twitter', icon: Twitter, color: 'bg-[#1DA1F2]' },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'bg-[#0A66C2]' },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'bg-[#25D366]' },
    { key: 'craigslist', label: 'Craigslist', icon: Link2, color: 'bg-[#5F2DA8]' },
    { key: 'email', label: 'Email', icon: Mail, color: 'bg-gray-600' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()} data-testid="share-modal">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-[#1A2F3A]" />
            <h3 className="font-semibold text-[#1A2F3A]">Share Listing</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg" data-testid="close-share-modal">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {listing && (
            <div className="flex gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
              <img
                src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=100'}
                alt={listing.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <p className="font-medium text-sm text-[#1A2F3A] line-clamp-1">{listing.title}</p>
                <p className="text-xs text-gray-500">{listing.address}, {listing.city}</p>
                <p className="text-sm font-semibold text-[#1A2F3A] mt-0.5">
                  ${listing.price?.toLocaleString()}{listing.listing_type === 'sale' ? '' : '/mo'}
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-[#1A2F3A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {platforms.map(p => (
                  <a
                    key={p.key}
                    href={links?.platforms?.[p.key] || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${p.color} text-white rounded-xl py-3 px-4 flex items-center gap-2.5 text-sm font-medium hover:opacity-90 transition-opacity`}
                    data-testid={`share-${p.key}`}
                  >
                    <p.icon size={16} />
                    {p.label}
                  </a>
                ))}
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={links?.listing_url || window.location.href}
                  className="flex-1 bg-transparent text-sm text-gray-600 outline-none"
                  data-testid="share-url-input"
                />
                <button
                  onClick={copyLink}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    copied ? 'bg-green-100 text-green-700' : 'bg-[#1A2F3A] text-white hover:bg-[#2C4A52]'
                  }`}
                  data-testid="copy-link-btn"
                >
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
