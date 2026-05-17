import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Inbox, Plus, X, Loader2, ExternalLink, Phone, Mail, MessageSquare,
  Sparkles, Check, AlertCircle, Filter, RefreshCw, Copy, Send, Trash2,
  ChevronDown, ChevronUp, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const STATUS_LABELS = {
  queued: { label: 'Queued', color: 'bg-white/10 text-white/70' },
  extracting: { label: 'Extracting', color: 'bg-blue-500/20 text-blue-300' },
  extracted: { label: 'Ready', color: 'bg-[#5DD4A0]/20 text-[#5DD4A0]' },
  drafted: { label: 'Drafted', color: 'bg-[#C4A962]/20 text-[#C4A962]' },
  sent: { label: 'Sent', color: 'bg-purple-500/20 text-purple-300' },
  replied: { label: 'Replied', color: 'bg-pink-500/20 text-pink-300' },
  won: { label: 'Won', color: 'bg-emerald-500/30 text-emerald-200' },
  lost: { label: 'Lost', color: 'bg-white/5 text-white/40' },
  failed: { label: 'Failed', color: 'bg-red-500/20 text-red-300' },
};

const SOURCE_ICONS = {
  facebook: '🟦',
  craigslist: '🟪',
  kijiji: '🟧',
  pasted: '📋',
  pending: '⏳',
};

export default function BDInbox() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Admin-only gate. Redirect non-admins to /my-properties. We allow
  // `user === undefined` for one render while the auth context hydrates,
  // but block as soon as we know the user is non-admin (or not logged in).
  const isAdmin = user?.is_admin === true;
  useEffect(() => {
    if (user === null) {
      navigate('/login', { replace: true });
      return;
    }
    if (user && !isAdmin) {
      navigate('/my-properties', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ counts: {}, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState(''); // '' = all
  const [expandedId, setExpandedId] = useState(null);
  const pollIntervalRef = useRef(null);

  const ownerId = user?.id;

  const fetchLeads = useCallback(async () => {
    try {
      const params = { limit: 500 };
      if (ownerId) params.owner_id = ownerId;
      if (statusFilter) params.status = statusFilter;
      const { data } = await axios.get(`${API}/api/bd-inbox/leads`, { params });
      setLeads(data.leads || []);
    } catch (e) {
      console.error('Failed to load leads', e);
    } finally {
      setLoading(false);
    }
  }, [ownerId, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const params = ownerId ? { owner_id: ownerId } : {};
      const { data } = await axios.get(`${API}/api/bd-inbox/stats`, { params });
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  }, [ownerId]);

  // Initial load + poll while anything is in-flight
  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [fetchLeads, fetchStats]);

  useEffect(() => {
    const hasInFlight = leads.some(l => l.status === 'queued' || l.status === 'extracting');
    if (hasInFlight) {
      pollIntervalRef.current = setInterval(() => {
        fetchLeads();
        fetchStats();
      }, 3000);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [leads, fetchLeads, fetchStats]);

  const filteredLeads = useMemo(() => {
    if (!statusFilter) return leads;
    return leads.filter(l => statusFilter.split(',').includes(l.status));
  }, [leads, statusFilter]);

  // While auth is hydrating, or if non-admin, render nothing. The redirect
  // effect above will move them off this page.
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0F1419] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">

        <button
          onClick={() => navigate('/my-properties')}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-5"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-start gap-3">
            <Inbox className="w-7 h-7 text-[#C4A962] mt-1" />
            <div>
              <h1 className="text-4xl mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                BD <em className="text-[#C4A962]">Inbox</em>
              </h1>
              <p className="text-white/60 text-sm">
                Paste any number of listing URLs. We extract, draft, and track outreach.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchLeads(); fetchStats(); }}
              className="p-2.5 rounded-lg border border-[#2A3441] hover:bg-[#1A2332] text-white/70"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowPasteModal(true)}
              className="flex items-center gap-2 bg-[#C4A962] hover:bg-[#D4BB72] text-[#0F1419] font-semibold px-4 py-2.5 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Paste URLs
            </button>
          </div>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <StatusPill
            label="All"
            count={stats.total}
            active={!statusFilter}
            onClick={() => setStatusFilter('')}
          />
          {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
            <StatusPill
              key={key}
              label={label}
              count={stats.counts?.[key] || 0}
              colorClass={color}
              active={statusFilter === key}
              onClick={() => setStatusFilter(statusFilter === key ? '' : key)}
            />
          ))}
        </div>

        {/* Table */}
        <div className="bg-[#1A2332] border border-[#2A3441] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-white/50">
              <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />
              <p className="text-sm">Loading…</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="py-20 text-center">
              <Inbox className="w-10 h-10 text-white/30 mx-auto mb-3" />
              <p className="text-white/60 mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px' }}>
                No leads yet.
              </p>
              <p className="text-white/40 text-sm">Click "Paste URLs" to add a batch.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0F1419]/50 text-white/50 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3 w-12"></th>
                    <th className="text-left px-3 py-3">Title</th>
                    <th className="text-left px-3 py-3">Price</th>
                    <th className="text-left px-3 py-3">Loc</th>
                    <th className="text-left px-3 py-3">Contact</th>
                    <th className="text-left px-3 py-3">Status</th>
                    <th className="text-right px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map(lead => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      expanded={expandedId === lead.id}
                      onToggleExpand={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                      onRefresh={() => { fetchLeads(); fetchStats(); }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showPasteModal && (
        <PasteModal
          onClose={() => setShowPasteModal(false)}
          onDone={() => { setShowPasteModal(false); fetchLeads(); fetchStats(); }}
          ownerId={ownerId}
        />
      )}
    </div>
  );
}

function StatusPill({ label, count, colorClass = 'bg-white/10 text-white/70', active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        active ? 'border-[#C4A962] bg-[#C4A962]/10 text-[#C4A962]' : `border-transparent ${colorClass} hover:bg-white/10`
      }`}
    >
      {label} <span className="opacity-60">{count}</span>
    </button>
  );
}

function LeadRow({ lead, expanded, onToggleExpand, onRefresh }) {
  const { label, color } = STATUS_LABELS[lead.status] || STATUS_LABELS.queued;
  const draft = lead.draft || {};
  const srcIcon = SOURCE_ICONS[lead.source] || '🔗';

  return (
    <>
      <tr className="border-t border-[#2A3441] hover:bg-[#0F1419]/40 transition cursor-pointer" onClick={onToggleExpand}>
        <td className="px-4 py-3">
          {expanded ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
        </td>
        <td className="px-3 py-3 max-w-xs">
          <div className="flex items-start gap-2">
            <span>{srcIcon}</span>
            <div className="min-w-0">
              <p className="text-white truncate font-medium">
                {draft.title || lead.source_url}
              </p>
              {!draft.title && lead.status === 'failed' && lead.error && (
                <p className="text-red-300 text-xs truncate">{lead.error}</p>
              )}
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-white/80 whitespace-nowrap">
          {draft.price ? `$${draft.price.toLocaleString()}${draft.listing_type === 'rent' ? '/mo' : ''}` : '—'}
        </td>
        <td className="px-3 py-3 text-white/60 text-xs">
          {draft.city || '—'}
          {draft.bedrooms !== undefined && draft.price ? ` · ${draft.bedrooms}BR` : ''}
        </td>
        <td className="px-3 py-3">
          <ContactBadge method={lead.contact_method} value={lead.contact_value} />
        </td>
        <td className="px-3 py-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>
        </td>
        <td className="px-3 py-3 text-right">
          <a
            href={lead.source_url}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-white/40 hover:text-white inline-flex items-center"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-[#0F1419]/40 border-t border-[#2A3441]">
          <td colSpan={7} className="px-4 py-5">
            <LeadDetail lead={lead} onRefresh={onRefresh} />
          </td>
        </tr>
      )}
    </>
  );
}

function ContactBadge({ method, value }) {
  if (method === 'phone' && value) {
    const fmt = value.length === 10 ? `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6)}` : value;
    return <span className="inline-flex items-center gap-1 text-white/70 text-xs"><Phone className="w-3 h-3" /> {fmt}</span>;
  }
  if (method === 'email' && value) {
    return <span className="inline-flex items-center gap-1 text-white/70 text-xs"><Mail className="w-3 h-3" /> {value.length > 20 ? value.slice(0,18) + '…' : value}</span>;
  }
  if (method === 'email') {
    return <span className="inline-flex items-center gap-1 text-white/50 text-xs"><Mail className="w-3 h-3" /> Email relay</span>;
  }
  if (method === 'fb_dm') {
    return <span className="inline-flex items-center gap-1 text-white/50 text-xs"><MessageSquare className="w-3 h-3" /> FB DM</span>;
  }
  if (method === 'kijiji_message') {
    return <span className="inline-flex items-center gap-1 text-white/50 text-xs"><MessageSquare className="w-3 h-3" /> Kijiji</span>;
  }
  return <span className="text-white/30 text-xs">—</span>;
}

function LeadDetail({ lead, onRefresh }) {
  const [drafting, setDrafting] = useState(false);
  const [draftedMessage, setDraftedMessage] = useState(lead.drafted_message || '');
  const [notes, setNotes] = useState(lead.notes || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const draft = lead.draft || {};
  const canDraft = ['extracted', 'drafted', 'sent', 'replied'].includes(lead.status);

  const generateDraft = async () => {
    setDrafting(true);
    setError('');
    try {
      const { data } = await axios.post(`${API}/api/bd-inbox/leads/${lead.id}/draft-message`);
      setDraftedMessage(data.message);
      onRefresh();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setDrafting(false);
    }
  };

  const saveMessage = async () => {
    try {
      await axios.patch(`${API}/api/bd-inbox/leads/${lead.id}`, { drafted_message: draftedMessage });
    } catch (e) { /* swallow */ }
  };

  const updateStatus = async (newStatus) => {
    setBusy(true);
    try {
      await axios.patch(`${API}/api/bd-inbox/leads/${lead.id}`, { status: newStatus });
      onRefresh();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setBusy(false);
    }
  };

  const saveNotes = async () => {
    try {
      await axios.patch(`${API}/api/bd-inbox/leads/${lead.id}`, { notes });
      onRefresh();
    } catch (e) { /* swallow */ }
  };

  const convert = async () => {
    if (!window.confirm('Convert this lead into a live Dommma listing? (Only do this after the landlord has said YES.)')) return;
    setBusy(true);
    setError('');
    try {
      await axios.post(`${API}/api/bd-inbox/leads/${lead.id}/convert`, { owns_content: true });
      onRefresh();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteLead = async () => {
    if (!window.confirm('Delete this lead permanently?')) return;
    try {
      await axios.delete(`${API}/api/bd-inbox/leads/${lead.id}`);
      onRefresh();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    }
  };

  const [toast, setToast] = useState('');
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(draftedMessage);
    showToast(`Copied draft for "${(draft.title || 'this lead').slice(0, 40)}"`);
  };

  const subjectForEmail = () => {
    // Friendly subject — references their listing
    const where = draft.city || 'Vancouver';
    const what = draft.bedrooms === 0 ? 'studio'
                : draft.bedrooms ? `${draft.bedrooms}BR rental`
                : 'rental listing';
    return `Quick question about your ${where} ${what}`;
  };

  const sendEmail = (toAddress = '') => {
    const subject = subjectForEmail();
    const body = draftedMessage;
    // Empty `to` means user picks recipient in their mail client
    window.location.href = `mailto:${toAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    updateStatus('sent');
    showToast(`Email opened for "${(draft.title || 'this lead').slice(0, 40)}"`);
  };

  const sendSms = (number) => {
    window.location.href = `sms:${number}?body=${encodeURIComponent(draftedMessage)}`;
    updateStatus('sent');
    showToast(`SMS opened for "${(draft.title || 'this lead').slice(0, 40)}"`);
  };

  const openSourceAndCopy = () => {
    if (!lead.source_url) {
      navigator.clipboard.writeText(draftedMessage);
      showToast(`Copied. (No source URL saved — open the listing manually and paste.)`);
      updateStatus('sent');
      return;
    }
    navigator.clipboard.writeText(draftedMessage);
    window.open(lead.source_url, '_blank', 'noopener,noreferrer');
    updateStatus('sent');
    showToast(`Copied & opened "${(draft.title || 'this listing').slice(0, 40)}"`);
  };

  // Decide which channel-specific buttons to show. Email + SMS + Open-Source
  // are independent options — surface all that apply, highlight the primary.
  const hasEmail = lead.contact_method === 'email' && lead.contact_value;
  const hasPhone = lead.contact_method === 'phone' && lead.contact_value;
  const hasUrl = !!lead.source_url;
  const sourceLabel = lead.source === 'facebook' ? 'FB'
                    : lead.source === 'craigslist' ? 'Craigslist'
                    : lead.source === 'kijiji' ? 'Kijiji'
                    : 'source';

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      {/* Left: listing summary */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-white/40">Listing</p>
        {lead.status === 'failed' ? (
          <div className="text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 inline mr-1" /> {lead.error}
          </div>
        ) : (
          <div className="space-y-1.5 text-sm">
            <p className="text-white font-medium">{draft.title || '—'}</p>
            {draft.address && <p className="text-white/60">{draft.address}, {draft.city}</p>}
            <p className="text-white/60">
              {draft.bedrooms !== undefined ? `${draft.bedrooms}BR / ${draft.bathrooms}BA` : ''}
              {draft.sqft ? ` · ${draft.sqft} sqft` : ''}
            </p>
            <p className="text-white/40 text-xs mt-2 line-clamp-4">{draft.description || ''}</p>
            {(lead.images || []).length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {lead.images.slice(0, 4).map((src, i) => (
                  <img key={i} src={src} alt="" className="w-12 h-12 rounded object-cover"
                       onError={e => { e.target.style.display = 'none'; }} />
                ))}
              </div>
            )}
          </div>
        )}
        <a href={lead.source_url} target="_blank" rel="noreferrer"
           className="text-[#C4A962] hover:text-[#D4BB72] text-xs inline-flex items-center gap-1">
          View source <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Middle: outreach */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-white/40">Outreach</p>
          {canDraft && (
            <button
              onClick={generateDraft}
              disabled={drafting}
              className="text-[#C4A962] hover:text-[#D4BB72] text-xs inline-flex items-center gap-1 disabled:opacity-50"
            >
              {drafting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Redraft
            </button>
          )}
        </div>
        <textarea
          rows={6}
          value={draftedMessage}
          onChange={e => setDraftedMessage(e.target.value)}
          onBlur={saveMessage}
          placeholder={canDraft ? 'Draft will auto-generate once extraction finishes…' : 'Waiting for extraction…'}
          className="w-full bg-[#0F1419] border border-[#2A3441] rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:border-[#C4A962] focus:outline-none"
        />
        {/* Send options — surface all relevant channels. Primary picks the
            most-direct option for this lead's contact_method. */}
        <div className="space-y-2">
          {/* Primary action row */}
          <div className="grid grid-cols-2 gap-2">
            {hasEmail && (
              <button
                onClick={() => sendEmail(lead.contact_value)}
                disabled={!draftedMessage}
                className="inline-flex items-center justify-center gap-1.5 bg-[#C4A962] hover:bg-[#D4BB72] disabled:opacity-50 text-[#0F1419] font-semibold text-xs px-3 py-2 rounded-lg"
                title={`Open mailto: ${lead.contact_value}`}
              >
                <Mail className="w-3 h-3" /> Email — {lead.contact_value.length > 18 ? lead.contact_value.slice(0,16)+'…' : lead.contact_value}
              </button>
            )}
            {hasPhone && (
              <button
                onClick={() => sendSms(lead.contact_value)}
                disabled={!draftedMessage}
                className="inline-flex items-center justify-center gap-1.5 bg-[#C4A962] hover:bg-[#D4BB72] disabled:opacity-50 text-[#0F1419] font-semibold text-xs px-3 py-2 rounded-lg"
              >
                <Phone className="w-3 h-3" /> SMS — {lead.contact_value}
              </button>
            )}
            {hasUrl && (
              <button
                onClick={openSourceAndCopy}
                disabled={!draftedMessage}
                className={`inline-flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs px-3 py-2 rounded-lg font-semibold ${
                  hasEmail || hasPhone
                    ? 'border border-[#C4A962]/40 text-[#C4A962] hover:bg-[#C4A962]/10'
                    : 'bg-[#C4A962] hover:bg-[#D4BB72] text-[#0F1419]'
                }`}
                title={lead.source_url}
              >
                <ExternalLink className="w-3 h-3" /> Open {sourceLabel} + Copy
              </button>
            )}
          </div>

          {/* Secondary row */}
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => sendEmail('')}
              disabled={!draftedMessage}
              className="inline-flex items-center gap-1 text-white/50 hover:text-white px-2 py-1 disabled:opacity-30"
              title="Open your mail client with the draft — pick the recipient yourself"
            >
              <Mail className="w-3 h-3" /> Email (pick recipient)
            </button>
            <button
              onClick={copyMessage}
              disabled={!draftedMessage}
              className="inline-flex items-center gap-1 text-white/50 hover:text-white px-2 py-1 disabled:opacity-30"
            >
              <Copy className="w-3 h-3" /> Copy only
            </button>
          </div>

          {toast && (
            <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 rounded px-2 py-1.5 text-xs flex items-start gap-1.5">
              <Check className="w-3 h-3 flex-shrink-0 mt-0.5" /> {toast}
            </div>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-white/40">Pipeline</p>
        <div className="grid grid-cols-2 gap-2">
          {['sent', 'replied', 'won', 'lost'].map(s => {
            const { label, color } = STATUS_LABELS[s];
            return (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={busy || lead.status === s}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                  lead.status === s
                    ? `${color} ring-1 ring-[#C4A962]`
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                Mark {label.toLowerCase()}
              </button>
            );
          })}
        </div>
        <textarea
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Private notes (e.g. 'said maybe next week')"
          className="w-full bg-[#0F1419] border border-[#2A3441] rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/30 focus:border-[#C4A962] focus:outline-none"
        />
        <div className="flex gap-2 pt-1">
          {lead.status !== 'won' && (
            <button
              onClick={convert}
              disabled={busy || !draft.title}
              className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-40 inline-flex items-center justify-center gap-1.5"
            >
              <Check className="w-3 h-3" /> Convert to listing
            </button>
          )}
          <button
            onClick={deleteLead}
            className="px-3 py-2 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-300"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
        {error && (
          <div className="text-red-300 text-xs bg-red-500/10 border border-red-500/30 rounded p-2 flex items-start gap-1.5">
            <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}
      </div>
    </div>
  );
}

function channelLabel(method) {
  switch (method) {
    case 'phone': return 'SMS';
    case 'email': return 'Email';
    case 'fb_dm': return 'FB';
    case 'kijiji_message': return 'Kijiji';
    default: return 'source';
  }
}

function PasteModal({ onClose, onDone, ownerId }) {
  const [mode, setMode] = useState('url'); // 'url' | 'text'
  const [text, setText] = useState('');
  const [sourceHint, setSourceHint] = useState('facebook'); // for text mode
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const urlCount = useMemo(() => {
    return text
      .split(/[\n,\s]+/)
      .map(s => s.trim())
      .filter(s => /^https?:\/\//i.test(s))
      .length;
  }, [text]);

  // Text mode: split on lines of three+ dashes (---, ====, ___)
  const textBlocks = useMemo(() => {
    return text
      .split(/^\s*[-=_]{3,}\s*$/m)
      .map(s => s.trim())
      .filter(s => s.length >= 50);
  }, [text]);

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'url') {
        const urls = text
          .split(/[\n,\s]+/)
          .map(s => s.trim())
          .filter(s => /^https?:\/\//i.test(s));
        if (urls.length === 0) {
          setError('No valid URLs found. Paste one URL per line.');
          setSubmitting(false);
          return;
        }
        const { data } = await axios.post(`${API}/api/bd-inbox/import`, {
          urls,
          owner_id: ownerId,
        });
        setResult(data);
        setTimeout(onDone, 1200);
      } else {
        if (textBlocks.length === 0) {
          setError('No listing blocks found. Paste at least one listing of 50+ characters.');
          setSubmitting(false);
          return;
        }
        const { data } = await axios.post(`${API}/api/bd-inbox/import-text`, {
          texts: textBlocks,
          source_hint: sourceHint,
          owner_id: ownerId,
        });
        setResult(data);
        setTimeout(onDone, 1200);
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const urlPlaceholder = `https://vancouver.craigslist.org/van/apa/d/.../789.html
https://www.kijiji.ca/v-apartments-condos/.../456
https://www.facebook.com/marketplace/item/123/  (note: FB usually fails — use Text mode instead)`;

  const textPlaceholder = `Paste the full listing copy here. Separate multiple listings with three dashes.

Bright 2BR · Kitsilano · $2,800/mo
2 bed, 1 bath, 850 sqft. Available June 1. Pets OK, parking included.
Renovated kitchen, in-suite laundry. Steps to the beach and West 4th.
Phone: 604-555-1234

---

Studio · Yaletown · $1,950/mo
450 sqft. Available July 1. No pets, no parking.
Concierge, gym, rooftop. 5 min walk to SkyTrain.`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-[#1A2332] border border-[#2A3441] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#2A3441]">
          <h2 className="text-2xl text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {mode === 'url' ? 'Paste listing URLs' : 'Paste listing text'}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab toggle */}
        <div className="flex border-b border-[#2A3441]">
          <button
            onClick={() => { setMode('url'); setError(''); setResult(null); }}
            className={`flex-1 py-3 text-sm font-medium transition ${
              mode === 'url'
                ? 'text-[#C4A962] border-b-2 border-[#C4A962] -mb-px bg-[#0F1419]/40'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            URLs <span className="opacity-50 text-xs">(CL, Kijiji)</span>
          </button>
          <button
            onClick={() => { setMode('text'); setError(''); setResult(null); }}
            className={`flex-1 py-3 text-sm font-medium transition ${
              mode === 'text'
                ? 'text-[#C4A962] border-b-2 border-[#C4A962] -mb-px bg-[#0F1419]/40'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            Listing text <span className="opacity-50 text-xs">(FB Marketplace, anything)</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {mode === 'url' ? (
            <p className="text-white/60 text-sm">
              One URL per line. No limit on count. Best results: <strong>Craigslist</strong> and <strong>Kijiji</strong>.
              <span className="block mt-1 text-orange-300/80 text-xs">
                ⚠ FB Marketplace usually fails here (JS-rendered, login-walled). Use <strong>Listing text</strong> mode instead.
              </span>
            </p>
          ) : (
            <>
              <p className="text-white/60 text-sm">
                Copy the listing text from FB Marketplace (or anywhere) and paste below.
                Separate multiple listings with three dashes on their own line: <code className="bg-[#0F1419] px-1.5 py-0.5 rounded text-xs">---</code>
              </p>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-1.5">
                  Where these listings are from
                </label>
                <select
                  value={sourceHint}
                  onChange={e => setSourceHint(e.target.value)}
                  className="bg-[#0F1419] border border-[#2A3441] rounded-lg px-3 py-2 text-white text-sm focus:border-[#C4A962] focus:outline-none"
                >
                  <option value="facebook">Facebook Marketplace</option>
                  <option value="craigslist">Craigslist</option>
                  <option value="kijiji">Kijiji</option>
                  <option value="pasted">Other / Mixed</option>
                </select>
              </div>
            </>
          )}

          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={mode === 'text' ? 16 : 12}
            placeholder={mode === 'url' ? urlPlaceholder : textPlaceholder}
            className="w-full bg-[#0F1419] border border-[#2A3441] rounded-lg px-3 py-2.5 text-white text-sm font-mono placeholder:text-white/30 focus:border-[#C4A962] focus:outline-none"
          />

          <div className="flex items-center justify-between text-xs text-white/50">
            <span>
              {mode === 'url'
                ? `${urlCount} URL${urlCount !== 1 ? 's' : ''} detected`
                : `${textBlocks.length} listing${textBlocks.length !== 1 ? 's' : ''} detected`}
            </span>
            <span>Processing: ~5 simultaneous at a time</span>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-3 py-2 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {result && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 rounded-lg px-3 py-2 text-sm">
              ✓ Queued {result.created} new leads
              {result.skipped_existing > 0 && ` (${result.skipped_existing} already in inbox)`}
              {result.skipped_short > 0 && ` (${result.skipped_short} too short to extract)`}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-[#2A3441] text-white/70 hover:bg-[#1A2332]"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting || (mode === 'url' ? urlCount === 0 : textBlocks.length === 0)}
              className="flex-1 bg-[#C4A962] hover:bg-[#D4BB72] disabled:opacity-50 text-[#0F1419] font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Queueing…</>
                : <>Queue {mode === 'url' ? urlCount : textBlocks.length} for extraction</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
