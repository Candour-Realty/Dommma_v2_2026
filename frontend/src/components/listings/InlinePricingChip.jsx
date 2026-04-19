import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, TrendingUp, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Inline pricing helper — fires once the landlord has filled in enough of the form
 * (city + bedrooms + sqft). Shows a subtle market-range chip under the price field,
 * with an expandable breakdown. No page navigation, no modal.
 */
export default function InlinePricingChip({ city, bedrooms, bathrooms, sqft, propertyType, currentPrice, onSuggest }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lastFetchRef = useRef('');

  const ready = Boolean(city && bedrooms && sqft);

  useEffect(() => {
    if (!ready) return;
    const key = `${city}|${bedrooms}|${bathrooms}|${sqft}|${propertyType}`;
    if (lastFetchRef.current === key) return;
    lastFetchRef.current = key;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          city,
          bedrooms: bedrooms || 1,
          bathrooms: bathrooms || 1,
          sqft: sqft || 600,
          property_type: propertyType || 'Apartment',
          current_rent: currentPrice || 0,
        }).toString();
        const res = await axios.post(`${API}/ai/smart-rent-pricing?${params}`);
        setData(res.data);
      } catch (e) {
        setData(null);
      } finally {
        setLoading(false);
      }
    }, 800); // debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, bedrooms, bathrooms, sqft, propertyType, ready]);

  if (!ready) return null;

  if (loading && !data) {
    return (
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Loader2 size={12} className="animate-spin" />
        Checking market data…
      </div>
    );
  }

  if (!data || !data.market_data) return null;

  const { market_data: md, competitive_price, suggested_rent, premium_price, source } = data;
  const sourceLabel = source === 'comparables'
    ? `based on ${md.count} nearby ${md.count === 1 ? 'listing' : 'listings'}`
    : source === 'hybrid'
      ? `based on limited local data + regional baselines`
      : `based on ${city} regional baselines`;

  return (
    <div className="mt-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 p-3 text-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
          <Sparkles size={14} />
          <span>
            Market suggests{' '}
            <strong>${md.p25?.toLocaleString()}–${md.p75?.toLocaleString()}/mo</strong>
          </span>
          <span className="text-blue-500 dark:text-blue-400/70 text-xs">· {sourceLabel}</span>
        </span>
        {expanded ? <ChevronUp size={14} className="text-blue-600 dark:text-blue-400" /> : <ChevronDown size={14} className="text-blue-600 dark:text-blue-400" />}
      </button>

      {expanded && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onSuggest?.(competitive_price)}
            className="rounded-lg bg-white dark:bg-white/5 p-2 text-center hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-600 transition"
          >
            <p className="text-[10px] text-blue-600 dark:text-blue-400">Competitive</p>
            <p className="text-base font-bold text-blue-700 dark:text-blue-300">${competitive_price?.toLocaleString()}</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">Quick fill</p>
          </button>
          <button
            type="button"
            onClick={() => onSuggest?.(suggested_rent)}
            className="rounded-lg bg-green-100 dark:bg-green-900/40 p-2 text-center ring-2 ring-green-300 dark:ring-green-700 hover:ring-green-400 transition"
          >
            <p className="text-[10px] text-green-700 dark:text-green-300 font-medium">Suggested</p>
            <p className="text-base font-bold text-green-800 dark:text-green-200">${suggested_rent?.toLocaleString()}</p>
            <p className="text-[9px] text-green-600 dark:text-green-400">Best balance</p>
          </button>
          <button
            type="button"
            onClick={() => onSuggest?.(premium_price)}
            className="rounded-lg bg-white dark:bg-white/5 p-2 text-center hover:ring-2 hover:ring-purple-300 dark:hover:ring-purple-600 transition"
          >
            <p className="text-[10px] text-purple-600 dark:text-purple-400">Premium</p>
            <p className="text-base font-bold text-purple-700 dark:text-purple-300">${premium_price?.toLocaleString()}</p>
            <p className="text-[9px] text-gray-500 dark:text-gray-400">Max return</p>
          </button>
        </div>
      )}
    </div>
  );
}
