import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, MapPin, Phone, Globe, Mail, Award, CheckCircle2, Clock,
  ArrowLeft, MessageSquare, Share2, Shield, Loader2
} from 'lucide-react';
import axios from 'axios';
import AvailabilityCalendar from '../components/contractors/AvailabilityCalendar';
import BookingWidget from '../components/contractors/BookingWidget';
import ShareListingModal from '../components/ShareListingModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function getSundayOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export default function PublicContractorProfile() {
  const { contractorId } = useParams();

  const [data, setData] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [weekStart, setWeekStart] = useState(() => getSundayOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showShare, setShowShare] = useState(false);

  // Fetch public profile
  useEffect(() => {
    if (!contractorId) return;
    setLoading(true);
    axios.get(`${API}/contractors/${contractorId}/public`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Could not load provider'))
      .finally(() => setLoading(false));
  }, [contractorId]);

  // Fetch availability
  useEffect(() => {
    if (!contractorId) return;
    axios.get(`${API}/contractors/${contractorId}/availability`)
      .then((res) => setAvailability(res.data))
      .catch(() => {});
  }, [contractorId]);

  // Fetch booked slots for the visible week (+ a bit of buffer)
  useEffect(() => {
    if (!contractorId) return;
    const start = weekStart.toISOString().split('T')[0];
    const endDate = new Date(weekStart);
    endDate.setDate(weekStart.getDate() + 6);
    const end = endDate.toISOString().split('T')[0];
    axios.get(`${API}/contractors/${contractorId}/booked-slots`, { params: { start_date: start, end_date: end } })
      .then((res) => setBookedSlots(res.data.booked_slots || []))
      .catch(() => setBookedSlots([]));
  }, [contractorId, weekStart]);

  const profile = data?.profile;
  const services = data?.services || [];
  const portfolio = data?.portfolio || [];
  const reviews = data?.reviews || [];

  const operatingHoursList = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (!availability?.schedule) return [];
    return availability.schedule
      .slice()
      .sort((a, b) => a.day_of_week - b.day_of_week)
      .map((d) => ({
        label: dayNames[d.day_of_week],
        hours: d.enabled ? `${d.start_time} – ${d.end_time}` : 'Closed',
      }));
  }, [availability]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F5EE] dark:bg-[#0F1419]">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Loader2 size={18} className="animate-spin" /> Loading provider…
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F5EE] dark:bg-[#0F1419]">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error || 'Provider not found'}</p>
          <Link to="/contractors" className="text-[#1A2F3A] dark:text-[#C4A962] underline">Browse all providers</Link>
        </div>
      </div>
    );
  }

  const rating = profile.rating || 0;
  const reviewCount = profile.review_count || 0;
  const avatar = profile.avatar || profile.portfolio_images?.[0];

  return (
    <div className="min-h-screen bg-[#F8F5EE] dark:bg-[#0F1419]">
      {/* Header bar */}
      <div className="bg-[#1A2F3A] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link to="/contractors" className="flex items-center gap-2 text-sm hover:opacity-80">
          <ArrowLeft size={16} /> Back
        </Link>
        <button
          onClick={() => setShowShare(true)}
          className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
        >
          <Share2 size={14} /> Share
        </button>
      </div>

      {/* Profile hero */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-24 h-24 rounded-2xl bg-gray-200 dark:bg-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
            {avatar ? (
              <img src={avatar} alt={profile.business_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-gray-400 dark:text-gray-500">
                {(profile.business_name || 'P').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-[#1A2F3A] dark:text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {profile.business_name}
              </h1>
              {profile.verified && (
                <span className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={12} /> Verified
                </span>
              )}
              {profile.insurance && (
                <span className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                  <Shield size={12} /> Insured
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3 mt-2 text-sm">
              {reviewCount > 0 ? (
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  <span className="font-semibold text-[#1A2F3A] dark:text-white">{rating.toFixed(1)}</span>
                  <span className="text-gray-500 dark:text-gray-400">· {reviewCount} reviews</span>
                </div>
              ) : (
                <span className="text-gray-400 dark:text-gray-500 text-xs">No reviews yet</span>
              )}
              {profile.completed_jobs > 0 && (
                <>
                  <span className="text-gray-300 dark:text-gray-700">·</span>
                  <span className="text-gray-600 dark:text-gray-300 text-xs">{profile.completed_jobs} jobs completed</span>
                </>
              )}
            </div>

            {/* Specialties chips */}
            {profile.specialties?.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {profile.specialties.slice(0, 5).map((s) => (
                  <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">{s}</span>
                ))}
              </div>
            )}

            {/* Contact row */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
              {profile.service_areas?.length > 0 && (
                <span className="flex items-center gap-1"><MapPin size={12} /> {profile.service_areas.slice(0, 3).join(', ')}</span>
              )}
              {profile.hourly_rate && (
                <span className="flex items-center gap-1">${profile.hourly_rate}/hr</span>
              )}
              {profile.years_experience > 0 && (
                <span className="flex items-center gap-1"><Award size={12} /> {profile.years_experience}y experience</span>
              )}
              {profile.phone && <span className="flex items-center gap-1"><Phone size={12} /> {profile.phone}</span>}
              {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline"><Globe size={12} /> Website</a>}
            </div>
          </div>
        </div>

        {/* Body: 2-column layout with calendar+details on left, booking on right */}
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {profile.description && (
              <section className="rounded-2xl bg-white dark:bg-[#1A2332] border border-gray-200 dark:border-white/10 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">About</h2>
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{profile.description}</p>
              </section>
            )}

            {/* Services */}
            {services.length > 0 && (
              <section className="rounded-2xl bg-white dark:bg-[#1A2332] border border-gray-200 dark:border-white/10 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Services</h2>
                <div className="space-y-2">
                  {services.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#1A2F3A] dark:text-white">{s.title}</p>
                        {s.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{s.description}</p>}
                      </div>
                      {s.price && (
                        <span className="text-sm font-semibold text-[#1A2F3A] dark:text-[#C4A962] whitespace-nowrap">${s.price}</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Availability calendar */}
            <section data-testid="public-availability">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Availability</h2>
              <AvailabilityCalendar
                availability={availability}
                bookedSlots={bookedSlots}
                weekStart={weekStart}
                onWeekChange={setWeekStart}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSelect={(date, time) => { setSelectedDate(date); setSelectedTime(time); }}
              />
            </section>

            {/* Operating hours */}
            {operatingHoursList.length > 0 && (
              <section className="rounded-2xl bg-white dark:bg-[#1A2332] border border-gray-200 dark:border-white/10 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                  <Clock size={14} /> Operating hours
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {operatingHoursList.map((h) => (
                    <div key={h.label} className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400 w-12">{h.label}</span>
                      <span className={`text-right ${h.hours === 'Closed' ? 'text-gray-400 dark:text-gray-600' : 'text-[#1A2F3A] dark:text-white'}`}>
                        {h.hours}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Portfolio */}
            {portfolio.length > 0 && (
              <section className="rounded-2xl bg-white dark:bg-[#1A2332] border border-gray-200 dark:border-white/10 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Recent work</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {portfolio.slice(0, 6).map((p) => {
                    const img = p.after_image || p.before_image || (p.images || [])[0];
                    return (
                      <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 relative group">
                        {img ? (
                          <img src={img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">No image</div>
                        )}
                        {p.title && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-[11px] text-white truncate">{p.title}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="rounded-2xl bg-white dark:bg-[#1A2332] border border-gray-200 dark:border-white/10 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                <MessageSquare size={14} /> Reviews
              </h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">No reviews yet. Be the first to work with this provider.</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r, i) => (
                    <div key={i} className="border-b border-gray-100 dark:border-white/10 last:border-b-0 pb-3 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} size={12} className={j < r.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-600'} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">— {r.customer_name}</span>
                      </div>
                      {r.review && <p className="text-sm text-gray-700 dark:text-gray-200">{r.review}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right column: booking widget (sticky on desktop) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <BookingWidget
                contractorId={contractorId}
                contractorName={profile.business_name}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                services={services}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Share modal (reuse the one we already have) */}
      {showShare && (
        <ShareListingModal
          listing={{
            id: contractorId,
            title: profile.business_name,
            address: profile.service_areas?.[0] || '',
            city: '',
            price: profile.hourly_rate || 0,
            listing_type: 'sale',
            images: profile.portfolio_images || (avatar ? [avatar] : []),
          }}
          isOpen={showShare}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
