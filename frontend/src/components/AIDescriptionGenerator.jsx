import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AIDescriptionGenerator({ listingData, onDescriptionGenerated }) {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState('');
  const [tone, setTone] = useState('professional');

  const tones = [
    { id: 'professional', label: 'Professional' },
    { id: 'casual', label: 'Friendly' },
    { id: 'luxury', label: 'Luxury' },
    { id: 'concise', label: 'Concise' },
  ];

  const generate = async () => {
    if (!listingData?.title) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/listings/generate-description`, {
        ...listingData,
        tone
      });
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
    <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-blue-50/30" data-testid="ai-description-generator">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-[#1A2F3A]" />
        <span className="text-sm font-semibold text-[#1A2F3A]">AI Description Generator</span>
      </div>

      <div className="flex gap-1.5 mb-3">
        {tones.map(t => (
          <button
            key={t.id}
            onClick={() => setTone(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tone === t.id ? 'bg-[#1A2F3A] text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
            data-testid={`tone-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>

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

      {generated && (
        <div className="mt-3 space-y-2">
          <div className="p-3 bg-white rounded-xl text-sm text-gray-700 leading-relaxed border border-gray-100 max-h-40 overflow-y-auto" data-testid="generated-description">
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
              className="py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 flex items-center gap-1.5"
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
