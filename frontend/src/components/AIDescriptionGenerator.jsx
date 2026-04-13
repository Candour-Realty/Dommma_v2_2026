import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AIDescriptionGenerator({ listingData, onDescriptionGenerated }) {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState('');
  const [tone, setTone] = useState('professional');
  const [showExtras, setShowExtras] = useState(false);
  const [extras, setExtras] = useState({
    highlights: '',
    target_tenant: '',
    neighborhood: '',
    unique_features: '',
  });

  const tones = [
    { id: 'professional', label: 'Professional' },
    { id: 'casual', label: 'Friendly' },
    { id: 'luxury', label: 'Luxury' },
    { id: 'concise', label: 'Concise' },
  ];

  const extraFields = [
    { key: 'highlights', label: 'Top highlights', placeholder: 'e.g., Recently renovated, new appliances, great natural light...' },
    { key: 'target_tenant', label: 'Ideal tenant', placeholder: 'e.g., Young professional, family with kids, students...' },
    { key: 'neighborhood', label: 'Neighborhood perks', placeholder: 'e.g., Steps from SkyTrain, quiet street, great restaurants nearby...' },
    { key: 'unique_features', label: 'Unique selling points', placeholder: 'e.g., Corner unit, panoramic views, private rooftop access...' },
  ];

  const generate = async () => {
    if (!listingData?.title) return;
    setLoading(true);
    try {
      const payload = {
        ...listingData,
        tone,
      };
      // Add extra context if provided
      const extraContext = Object.entries(extras)
        .filter(([_, v]) => v.trim())
        .map(([k, v]) => `${k.replace('_', ' ')}: ${v}`)
        .join('. ');
      if (extraContext) {
        payload.extra_context = extraContext;
      }

      const res = await axios.post(`${API}/listings/generate-description`, payload);
      setGenerated(res.data.description);
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to generate description');
    } finally {
      setLoading(false);
    }
  };

  const useDescription = () => {
    if (generated) {
      onDescriptionGenerated(generated);
      setGenerated('');
    }
  };

  return (
    <div className="border border-dashed border-gray-200 dark:border-white/10 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-[#1A2332] dark:to-[#1A2F3A]/30" data-testid="ai-description-generator">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-[#1A2F3A] dark:text-[#C4A962]" />
        <span className="text-sm font-semibold text-[#1A2F3A] dark:text-white">AI Description Generator</span>
      </div>

      {/* Tone selector */}
      <div className="flex gap-1.5 mb-3">
        {tones.map(t => (
          <button
            key={t.id}
            onClick={() => setTone(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tone === t.id
                ? 'bg-[#1A2F3A] text-white'
                : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10'
            }`}
            data-testid={`tone-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Extra context (optional follow-up questions) */}
      <button
        onClick={() => setShowExtras(!showExtras)}
        className="flex items-center gap-1.5 text-xs text-[#1A2F3A] dark:text-[#C4A962] font-medium mb-2 hover:underline"
      >
        {showExtras ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {showExtras ? 'Hide extra details' : 'Add details for a better description (optional)'}
      </button>

      {showExtras && (
        <div className="space-y-2 mb-3">
          {extraFields.map(field => (
            <div key={field.key}>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 block">{field.label}</label>
              <input
                type="text"
                value={extras[field.key]}
                onChange={(e) => setExtras({ ...extras, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-700 dark:text-white placeholder-gray-400 outline-none focus:border-[#1A2F3A] dark:focus:border-[#C4A962]"
              />
            </div>
          ))}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={loading || !listingData?.title}
        className="w-full py-2.5 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
        data-testid="generate-description-btn"
      >
        {loading ? (
          <><Loader2 size={14} className="animate-spin" /> Generating...</>
        ) : (
          <><Sparkles size={14} /> Generate Description</>
        )}
      </button>

      {/* Generated result */}
      {generated && (
        <div className="mt-3 space-y-2">
          <div className="p-3 bg-white dark:bg-white/5 rounded-xl text-sm text-gray-700 dark:text-gray-300 leading-relaxed border border-gray-100 dark:border-white/10 max-h-40 overflow-y-auto" data-testid="generated-description">
            {generated}
          </div>
          <div className="flex gap-2">
            <button
              onClick={useDescription}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-green-700"
              data-testid="use-description-btn"
            >
              <CheckCircle size={14} /> Use This
            </button>
            <button
              onClick={generate}
              className="py-2 px-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-200 dark:hover:bg-white/20 flex items-center gap-1.5"
              data-testid="regenerate-btn"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
