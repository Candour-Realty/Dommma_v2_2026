import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, RefreshCw, CheckCircle, ChevronDown, ChevronUp, Eye, MapPin } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * AI Description Generator — auto-suggests text as the landlord fills the form.
 * No "Generate" button required. Uses Claude Vision (reads uploaded photos) +
 * nearby places context. Landlord can accept, refine (change tone / add notes), or ignore.
 */
export default function AIDescriptionGenerator({ listingData, nearbyPlaces = [], onDescriptionGenerated, currentDescription = '' }) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [usedVision, setUsedVision] = useState(false);
  const [usedNearby, setUsedNearby] = useState(false);
  const [tone, setTone] = useState('professional');
  const [extraContext, setExtraContext] = useState('');
  const [showRefine, setShowRefine] = useState(false);
  const [error, setError] = useState('');
  const lastFiredRef = useRef('');
  const hasFiredRef = useRef(false);

  const tones = [
    { id: 'professional', label: 'Professional' },
    { id: 'casual', label: 'Friendly' },
    { id: 'luxury', label: 'Luxury' },
    { id: 'concise', label: 'Concise' },
  ];

  // Ready to auto-suggest once landlord has title + beds + sqft
  const ready = Boolean(
    listingData?.title?.trim() &&
    listingData?.bedrooms > 0 &&
    listingData?.sqft > 0
  );

  const fetchSuggestion = async (force = false) => {
    if (!ready) return;
    // Build a signature of the inputs so we don't re-fire for identical state
    const sig = JSON.stringify({
      ...listingData,
      tone,
      extraContext,
      imageCount: listingData?.image_urls?.length || 0,
      nearbyCount: nearbyPlaces.length,
    });
    if (!force && sig === lastFiredRef.current) return;
    lastFiredRef.current = sig;

    setLoading(true);
    setError('');
    try {
      const payload = {
        ...listingData,
        tone,
        extra_context: extraContext || undefined,
        image_urls: (listingData?.image_urls || []).slice(0, 4),
        nearby_places: nearbyPlaces.slice(0, 5),
      };
      const res = await axios.post(`${API}/listings/generate-description`, payload);
      setSuggestion(res.data.description || '');
      setUsedVision(Boolean(res.data.used_vision));
      setUsedNearby(Boolean(res.data.used_nearby));
      hasFiredRef.current = true;
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not generate suggestion');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fire once when ready — debounced. Only fires on the first ready state;
  // subsequent refreshes require an explicit click (saves API cost).
  useEffect(() => {
    if (!ready || hasFiredRef.current || currentDescription?.trim()) return;
    const timer = setTimeout(() => fetchSuggestion(false), 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, listingData?.title, listingData?.bedrooms, listingData?.sqft, listingData?.address, currentDescription]);

  // If landlord already wrote their own description, stay silent
  if (currentDescription?.trim() && !suggestion) {
    return null;
  }

  if (!ready) {
    return (
      <div className="border border-dashed border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
        <Sparkles size={12} /> AI will suggest a description once you fill in the title, bedrooms, and square footage.
      </div>
    );
  }

  return (
    <div className="border border-dashed border-[#C4A962]/40 dark:border-[#C4A962]/30 rounded-xl p-4 bg-gradient-to-br from-amber-50/50 to-blue-50/30 dark:from-[#1A2332] dark:to-[#1A2F3A]/50" data-testid="ai-description-generator">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#C4A962]" />
          <span className="text-sm font-semibold text-[#1A2F3A] dark:text-white">
            {loading ? 'DOMMMA AI is writing…' : 'AI-Suggested Description'}
          </span>
        </div>
        {!loading && suggestion && (
          <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
            {usedVision && <span className="flex items-center gap-1"><Eye size={10} /> photos</span>}
            {usedNearby && <span className="flex items-center gap-1"><MapPin size={10} /> neighborhood</span>}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 py-6 justify-center text-sm text-gray-500 dark:text-gray-400">
          <Loader2 size={16} className="animate-spin text-[#C4A962]" />
          {listingData?.image_urls?.length > 0 ? 'Reading your photos…' : 'Drafting…'}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-xs text-red-600 dark:text-red-400 py-2">
          {error}{' '}
          <button onClick={() => fetchSuggestion(true)} className="underline">Retry</button>
        </div>
      )}

      {/* Suggestion preview */}
      {suggestion && !loading && (
        <>
          <div
            className="p-3 bg-white dark:bg-white/5 rounded-xl text-sm text-gray-700 dark:text-gray-200 leading-relaxed border border-gray-100 dark:border-white/10 max-h-40 overflow-y-auto mb-3"
            data-testid="generated-description"
          >
            {suggestion}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => { onDescriptionGenerated(suggestion); setSuggestion(''); }}
              className="flex-1 min-w-[120px] py-2 bg-[#1A2F3A] text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#2C4A52]"
              data-testid="use-description-btn"
            >
              <CheckCircle size={14} /> Use this
            </button>
            <button
              type="button"
              onClick={() => setShowRefine(!showRefine)}
              className="py-2 px-3 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-white/20 flex items-center gap-1.5"
            >
              {showRefine ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Refine
            </button>
            <button
              type="button"
              onClick={() => fetchSuggestion(true)}
              className="py-2 px-3 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-white/20 flex items-center gap-1.5"
              data-testid="regenerate-btn"
              title="Try a different draft"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Refine panel */}
          {showRefine && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5 block">Tone</label>
                <div className="flex gap-1.5 flex-wrap">
                  {tones.map(t => (
                    <button
                      key={t.id}
                      type="button"
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
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Anything else to mention? <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="e.g., renovated in 2024, rooftop gym, new park nearby"
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-700 dark:text-white placeholder-gray-400 outline-none focus:border-[#C4A962]"
                />
              </div>

              <button
                type="button"
                onClick={() => fetchSuggestion(true)}
                className="w-full py-2 bg-[#C4A962] text-[#1A2F3A] rounded-lg text-xs font-semibold hover:bg-[#D4B972] flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} /> Redraft with these changes
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
