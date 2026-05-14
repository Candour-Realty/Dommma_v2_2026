import React, { useState } from 'react';
import {
  Link2, Loader2, AlertCircle, Check, ArrowLeft, ArrowRight,
  Image as ImageIcon, Edit3, ExternalLink, Sparkles, Shield, X
} from 'lucide-react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const SUPPORTED = [
  { name: 'Facebook Marketplace', host: 'facebook.com', sample: 'facebook.com/marketplace/item/...' },
  { name: 'Craigslist', host: 'craigslist.org', sample: 'vancouver.craigslist.org/apa/...' },
  { name: 'Kijiji', host: 'kijiji.ca', sample: 'kijiji.ca/v-apartments-condos/...' },
];

const EMPTY_DRAFT = {
  title: '', address: '', city: 'Vancouver', province: 'BC', postal_code: '',
  price: 0, bedrooms: 0, bathrooms: 0, sqft: 0,
  property_type: 'apartment', description: '',
  pet_friendly: false, parking: false,
  available_date: '', listing_type: 'rent', amenities: [],
};

export default function ImportFromUrl() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState('input'); // input | loading | review | publishing | done
  const [url, setUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [showPasteFallback, setShowPasteFallback] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState({});
  const [warnings, setWarnings] = useState([]);
  const [source, setSource] = useState('');
  const [confidence, setConfidence] = useState('');
  const [ownsContent, setOwnsContent] = useState(false);

  const handleImport = async () => {
    setError('');
    if (!url.trim() && !pastedText.trim()) {
      setError('Paste a URL — or use the paste-text fallback below.');
      return;
    }
    setStage('loading');
    try {
      const { data } = await axios.post(`${API}/api/listings/import-from-url`, {
        url: url.trim(),
        pasted_text: pastedText.trim() || undefined,
      });
      setDraft({ ...EMPTY_DRAFT, ...data.draft });
      setImages(data.images || []);
      // Pre-select all images
      const sel = {};
      (data.images || []).forEach((u, i) => { sel[i] = true; });
      setSelectedImages(sel);
      setWarnings(data.warnings || []);
      setSource(data.source);
      setConfidence(data.confidence);
      setStage('review');
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || 'Import failed';
      setError(msg);
      setStage('input');
      // If fetch was blocked, nudge toward paste-text
      if (e?.response?.status === 403 || e?.response?.status === 429) {
        setShowPasteFallback(true);
      }
    }
  };

  const handlePublish = async () => {
    if (!ownsContent) {
      setError('Confirm you own this listing before publishing.');
      return;
    }
    if (!draft.title || draft.price <= 0) {
      setError('Title and a non-zero price are required to publish.');
      return;
    }
    setStage('publishing');
    setError('');

    const keptImages = images.filter((_, i) => selectedImages[i]);

    // Approximate geocoding — fill from city if lat/lng not known
    const payload = {
      ...draft,
      images: keptImages,
      // Backend listings.create expects these; default to Vancouver center
      // if we couldn't extract a real address. Landlord can correct after.
      lat: 49.2827,
      lng: -123.1207,
      // Save audit trail in description tail
      description: draft.description + (url ? `\n\n[Imported from ${url}]` : ''),
      owner_id: user?.id,
      user_id: user?.id,
      landlord_id: user?.id,
    };

    try {
      await axios.post(`${API}/api/listings`, payload);
      setStage('done');
      setTimeout(() => navigate('/my-properties'), 1500);
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || 'Publish failed';
      setError(msg);
      setStage('review');
    }
  };

  const update = (k, v) => setDraft(prev => ({ ...prev, [k]: v }));

  // ---------- RENDER ----------

  if (stage === 'done') {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#5DD4A0]/20 flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-[#5DD4A0]" />
          </div>
          <h2 className="text-2xl text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Listing published.
          </h2>
          <p className="text-white/60 text-sm">Taking you to your properties…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1419] text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <button
          onClick={() => navigate('/my-properties')}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to my properties
        </button>

        <div className="flex items-start gap-3 mb-2">
          <Link2 className="w-6 h-6 text-[#C4A962] mt-1" />
          <div>
            <h1 className="text-4xl mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Import from a <em className="text-[#C4A962]">URL</em>.
            </h1>
            <p className="text-white/60 text-sm max-w-xl">
              Already have your listing on Facebook Marketplace, Craigslist, or Kijiji?
              Paste the link — we'll pre-fill the form in 30 seconds.
            </p>
          </div>
        </div>

        {/* ---------- INPUT STAGE ---------- */}
        {stage === 'input' && (
          <div className="mt-8 space-y-6">
            <div className="bg-[#1A2332] border border-[#2A3441] rounded-2xl p-6">
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2">
                Listing URL
              </label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.facebook.com/marketplace/item/123456789/"
                className="w-full bg-[#0F1419] border border-[#2A3441] rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-[#C4A962] focus:outline-none"
                onKeyDown={e => e.key === 'Enter' && handleImport()}
              />

              <button
                onClick={() => setShowPasteFallback(!showPasteFallback)}
                className="text-white/50 hover:text-white/80 text-xs mt-3 inline-flex items-center gap-1"
              >
                {showPasteFallback ? <X className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                {showPasteFallback ? 'Hide' : 'URL not working?'} Paste the listing text instead
              </button>

              {showPasteFallback && (
                <div className="mt-3">
                  <textarea
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    rows={6}
                    placeholder="Copy the entire listing text from Facebook / Craigslist / Kijiji and paste it here. Title, price, bedrooms, description — all in one block."
                    className="w-full bg-[#0F1419] border border-[#2A3441] rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:border-[#C4A962] focus:outline-none text-sm"
                  />
                  <p className="text-white/40 text-xs mt-1.5">
                    We'll parse the text the same way we'd parse the page. Use this when the link is private or login-walled.
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleImport}
                className="mt-5 w-full bg-[#C4A962] hover:bg-[#D4BB72] text-[#0F1419] font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" /> Import listing
              </button>
            </div>

            {/* Trust & legal */}
            <div className="bg-[#1A2332]/50 border border-[#2A3441] rounded-2xl p-5">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-[#C4A962] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-white/70 leading-relaxed">
                  <p className="text-white font-medium mb-1">Why this is safe.</p>
                  <p>
                    You own your listing. We're not scraping — we're letting <em>you</em> bring <em>your</em> content over.
                    On the next screen you'll confirm you own the content and have rights to the photos. We log the source URL for audit.
                  </p>
                </div>
              </div>
            </div>

            {/* Supported sources */}
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Supported</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {SUPPORTED.map(s => (
                  <div key={s.host} className="bg-[#1A2332] border border-[#2A3441] rounded-lg px-4 py-3">
                    <p className="text-white text-sm font-medium">{s.name}</p>
                    <p className="text-white/40 text-xs mt-1 font-mono truncate">{s.sample}</p>
                  </div>
                ))}
              </div>
              <p className="text-white/40 text-xs mt-3">
                Other source? Use the paste-text fallback above — works for any text.
              </p>
            </div>
          </div>
        )}

        {/* ---------- LOADING STAGE ---------- */}
        {stage === 'loading' && (
          <div className="mt-16 text-center">
            <Loader2 className="w-10 h-10 text-[#C4A962] mx-auto animate-spin mb-5" />
            <p className="text-lg text-white mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Reading your listing…
            </p>
            <p className="text-white/50 text-sm">
              {pastedText ? 'Parsing the text you pasted.' : `Pulling from ${url ? new URL(url).hostname : 'the source'}.`}
            </p>
            <p className="text-white/30 text-xs mt-4">This usually takes 10-25 seconds.</p>
          </div>
        )}

        {/* ---------- REVIEW STAGE ---------- */}
        {(stage === 'review' || stage === 'publishing') && (
          <div className="mt-8 space-y-6">
            {/* Status banner */}
            <div className="flex items-center justify-between bg-[#1A2332] border border-[#2A3441] rounded-xl px-5 py-3">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[#5DD4A0]" />
                <div>
                  <p className="text-sm text-white">
                    Extracted from <span className="text-[#C4A962]">{source || 'pasted text'}</span>
                    {confidence && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        confidence === 'high' ? 'bg-[#5DD4A0]/20 text-[#5DD4A0]' :
                        confidence === 'medium' ? 'bg-[#C4A962]/20 text-[#C4A962]' :
                        'bg-orange-400/20 text-orange-300'
                      }`}>
                        {confidence} confidence
                      </span>
                    )}
                  </p>
                  <p className="text-white/40 text-xs">Review and edit before publishing.</p>
                </div>
              </div>
              {url && (
                <a href={url} target="_blank" rel="noreferrer" className="text-white/40 hover:text-white text-xs inline-flex items-center gap-1">
                  Source <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {warnings.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                <p className="text-orange-300 text-xs uppercase tracking-widest mb-2 font-semibold">Heads up</p>
                <ul className="text-orange-200/80 text-sm space-y-1">
                  {warnings.map((w, i) => <li key={i}>• {w}</li>)}
                </ul>
              </div>
            )}

            {/* Form */}
            <div className="bg-[#1A2332] border border-[#2A3441] rounded-2xl p-6 space-y-5">
              <Field label="Title">
                <input className={inputCls} value={draft.title} onChange={e => update('title', e.target.value)} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Price (CAD)">
                  <input type="number" className={inputCls} value={draft.price || ''} onChange={e => update('price', parseInt(e.target.value) || 0)} />
                </Field>
                <Field label="Listing type">
                  <select className={inputCls} value={draft.listing_type} onChange={e => update('listing_type', e.target.value)}>
                    <option value="rent">Rent</option>
                    <option value="sale">Sale</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Bedrooms">
                  <input type="number" className={inputCls} value={draft.bedrooms} onChange={e => update('bedrooms', parseInt(e.target.value) || 0)} />
                </Field>
                <Field label="Bathrooms">
                  <input type="number" step="0.5" className={inputCls} value={draft.bathrooms} onChange={e => update('bathrooms', parseFloat(e.target.value) || 0)} />
                </Field>
                <Field label="Sqft">
                  <input type="number" className={inputCls} value={draft.sqft || ''} onChange={e => update('sqft', parseInt(e.target.value) || 0)} />
                </Field>
              </div>

              <Field label="Property type">
                <select className={inputCls} value={draft.property_type} onChange={e => update('property_type', e.target.value)}>
                  {['apartment', 'condo', 'house', 'townhouse', 'studio', 'basement', 'room'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>

              <Field label="Address">
                <input className={inputCls} value={draft.address} onChange={e => update('address', e.target.value)} placeholder="Street address" />
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field label="City"><input className={inputCls} value={draft.city} onChange={e => update('city', e.target.value)} /></Field>
                <Field label="Province"><input className={inputCls} value={draft.province} onChange={e => update('province', e.target.value)} /></Field>
                <Field label="Postal code"><input className={inputCls} value={draft.postal_code} onChange={e => update('postal_code', e.target.value)} /></Field>
              </div>

              <Field label="Description">
                <textarea rows={5} className={inputCls} value={draft.description} onChange={e => update('description', e.target.value)} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Available date">
                  <input type="date" className={inputCls} value={draft.available_date} onChange={e => update('available_date', e.target.value)} />
                </Field>
                <div className="flex items-end gap-4">
                  <Toggle label="Pet-friendly" value={draft.pet_friendly} onChange={v => update('pet_friendly', v)} />
                  <Toggle label="Parking" value={draft.parking} onChange={v => update('parking', v)} />
                </div>
              </div>
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div className="bg-[#1A2332] border border-[#2A3441] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs uppercase tracking-widest text-white/50">
                    {images.length} photo{images.length !== 1 ? 's' : ''} found
                  </p>
                  <p className="text-white/40 text-xs">Click to deselect</p>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImages(prev => ({ ...prev, [i]: !prev[i] }))}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                        selectedImages[i] ? 'border-[#C4A962]' : 'border-transparent opacity-40 grayscale'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover"
                           onError={e => { e.target.style.display = 'none'; }} />
                      {selectedImages[i] && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#C4A962] rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-[#0F1419]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Legal */}
            <label className="bg-[#1A2332]/50 border border-[#2A3441] rounded-xl p-4 flex gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ownsContent}
                onChange={e => setOwnsContent(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#C4A962]"
              />
              <span className="text-sm text-white/70">
                I own this listing and have the right to publish the title, description, and photos on Dommma.
              </span>
            </label>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 sticky bottom-4">
              <button
                onClick={() => setStage('input')}
                className="px-5 py-3 rounded-lg border border-[#2A3441] text-white/70 hover:bg-[#1A2332]"
                disabled={stage === 'publishing'}
              >
                Start over
              </button>
              <button
                onClick={handlePublish}
                disabled={stage === 'publishing'}
                className="flex-1 bg-[#C4A962] hover:bg-[#D4BB72] disabled:opacity-50 text-[#0F1419] font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {stage === 'publishing' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</>
                ) : (
                  <>Publish listing <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const inputCls =
  'w-full bg-[#0F1419] border border-[#2A3441] rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:border-[#C4A962] focus:outline-none text-sm';

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="w-4 h-4 accent-[#C4A962]" />
      <span className="text-white/80 text-sm">{label}</span>
    </label>
  );
}
