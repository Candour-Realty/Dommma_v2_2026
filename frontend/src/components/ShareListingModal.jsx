import React, { useState } from 'react';
import { Facebook, Twitter, Linkedin, Mail, Link2, Copy, Check, Share2, X, MessageCircle, Globe, Building2, Camera, Ghost, Pin, Music } from 'lucide-react';
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

  const listingUrl = links?.listing_url || `${window.location.origin}/browse?property=${listing?.id}`;
  const listingTitle = listing?.title || 'Property Listing';
  const listingPrice = listing?.price ? `$${listing.price.toLocaleString()}` : '';
  const emailSubject = encodeURIComponent(`Check out this property: ${listingTitle}`);
  const emailBody = encodeURIComponent(`I found this property on DOMMMA:\n\n${listingTitle}\n${listingPrice}${listing?.listing_type === 'sale' ? '' : '/mo'}\n${listing?.address}, ${listing?.city}\n\nView it here: ${listingUrl}`);

  // Uniform icon grid — brand color shows only on hover. Keeps the modal calm & on-brand.
  const platforms = [
    { key: 'facebook', label: 'Facebook', icon: Facebook, hover: 'hover:text-[#1877F2]', fallbackUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listingUrl)}` },
    { key: 'facebook_marketplace', label: 'Marketplace', icon: Building2, hover: 'hover:text-[#0866FF]', fallbackUrl: `https://www.facebook.com/marketplace/create/rental/` },
    { key: 'twitter', label: 'X', icon: Twitter, hover: 'hover:text-[#1DA1F2]', fallbackUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(listingTitle + ' ' + listingPrice)}&url=${encodeURIComponent(listingUrl)}` },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, hover: 'hover:text-[#0A66C2]', fallbackUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(listingUrl)}` },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, hover: 'hover:text-[#25D366]', fallbackUrl: `https://wa.me/?text=${encodeURIComponent(listingTitle + ' ' + listingPrice + ' - ' + listingUrl)}` },
    { key: 'craigslist', label: 'Craigslist', icon: Link2, hover: 'hover:text-[#5F2DA8]', fallbackUrl: `https://vancouver.craigslist.org/` },
    { key: 'snapchat', label: 'Snapchat', icon: Ghost, hover: 'hover:text-[#FFFC00]', fallbackUrl: `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(listingUrl)}` },
    { key: 'pinterest', label: 'Pinterest', icon: Pin, hover: 'hover:text-[#E60023]', fallbackUrl: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(listingUrl)}&description=${encodeURIComponent(listingTitle + ' ' + listingPrice)}` },
    { key: 'instagram', label: 'Instagram', icon: Camera, hover: 'hover:text-[#E1306C]', fallbackUrl: `https://www.instagram.com/` },
    { key: 'tiktok', label: 'TikTok', icon: Music, hover: 'hover:text-black dark:hover:text-white', fallbackUrl: `https://www.tiktok.com/` },
    { key: 'email', label: 'Email', icon: Mail, hover: 'hover:text-[#1A2F3A] dark:hover:text-[#C4A962]', fallbackUrl: `mailto:?subject=${emailSubject}&body=${emailBody}` },
    { key: 'google_business', label: 'Google', icon: Globe, hover: 'hover:text-[#4285F4]', fallbackUrl: `https://business.google.com/` },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-[1200] flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1A2332] rounded-2xl sm:rounded-2xl rounded-b-none w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()} data-testid="share-modal">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-[#1A2F3A] dark:text-[#C4A962]" />
            <h3 className="font-semibold text-[#1A2F3A] dark:text-white">Share Listing</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-500 dark:text-gray-400" data-testid="close-share-modal">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {listing && (
            <div className="flex gap-3 mb-5 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
              <img
                src={listing.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=100'}
                alt={listing.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <p className="font-medium text-sm text-[#1A2F3A] dark:text-white line-clamp-1">{listing.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{listing.address}, {listing.city}</p>
                <p className="text-sm font-semibold text-[#1A2F3A] dark:text-[#C4A962] mt-0.5">
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
              <div className="grid grid-cols-4 gap-3 mb-5">
                {platforms.map(p => (
                  <a
                    key={p.key}
                    href={links?.platforms?.[p.key] || p.fallbackUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 group"
                    data-testid={`share-${p.key}`}
                  >
                    <div className={`w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors group-hover:bg-gray-200 dark:group-hover:bg-white/10 ${p.hover}`}>
                      <p.icon size={20} />
                    </div>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center leading-tight">
                      {p.label}
                    </span>
                  </a>
                ))}
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <input
                  type="text"
                  readOnly
                  value={links?.listing_url || window.location.href}
                  className="flex-1 bg-transparent text-sm text-gray-600 dark:text-gray-300 outline-none"
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
