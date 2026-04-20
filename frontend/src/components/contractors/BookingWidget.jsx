import React, { useState } from 'react';
import { Calendar, Clock, MapPin, MessageSquare, User, Mail, Phone, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../App';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * Booking widget shown on the public contractor profile.
 *
 * Props:
 *   contractorId    string
 *   contractorName  string
 *   selectedDate    'YYYY-MM-DD' | null (pre-selected from the calendar)
 *   selectedTime    'HH:MM' | null
 *   services        [{id, title, price, duration_estimate}]  (optional)
 *   onSuccess(booking) called after successful booking
 */
export default function BookingWidget({
  contractorId,
  contractorName,
  selectedDate,
  selectedTime,
  services = [],
  onSuccess,
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState(services[0]?.title || 'Service booking');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const isGuest = !user;
  const selectedService = services.find((s) => s.id === serviceId);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedDate || !selectedTime) {
      setError('Pick a date and time from the calendar first.');
      return;
    }
    if (isGuest && (!guestName || !guestEmail)) {
      setError('Please enter your name and email.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        contractor_id: contractorId,
        service_id: serviceId || null,
        title: title || 'Service booking',
        description,
        booking_date: selectedDate,
        booking_time: selectedTime,
        duration_minutes: 60,
        address,
        notes,
      };
      if (isGuest) {
        payload.customer_name = guestName;
        payload.customer_email = guestEmail;
        payload.customer_phone = guestPhone || undefined;
      } else {
        payload.customer_name = user.full_name || user.name;
        payload.customer_email = user.email;
      }

      const url = user?.id
        ? `${API}/contractors/${contractorId}/book?customer_id=${user.id}`
        : `${API}/contractors/${contractorId}/book`;
      const res = await axios.post(url, payload);
      setSuccess(res.data);
      onSuccess?.(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send booking request');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 p-6 text-center" data-testid="booking-success">
        <CheckCircle2 size={40} className="mx-auto text-green-600 mb-3" />
        <h3 className="text-lg font-semibold text-[#1A2F3A] dark:text-white mb-2">Request sent!</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
          <strong>{contractorName}</strong> has been notified of your request for{' '}
          <strong>{selectedDate}</strong> at <strong>{selectedTime}</strong>.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          You'll get a confirmation email as soon as they respond — usually within a few hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A2332] p-5 space-y-4" data-testid="booking-widget">
      <div>
        <h3 className="text-base font-semibold text-[#1A2F3A] dark:text-white">Request a booking</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Your request is sent to {contractorName}. They'll confirm or suggest another time.
        </p>
      </div>

      {/* Selected date/time summary */}
      <div className={`rounded-lg p-3 text-sm ${selectedDate && selectedTime
        ? 'bg-[#1A2F3A] text-white'
        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'}`}>
        {selectedDate && selectedTime ? (
          <div className="flex items-center gap-2">
            <Calendar size={14} /> {selectedDate}
            <span className="opacity-50">·</span>
            <Clock size={14} /> {selectedTime}
          </div>
        ) : (
          <p>← Pick a date and time from the calendar</p>
        )}
      </div>

      {/* Service selector (only if contractor has services) */}
      {services.length > 0 && (
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Service</label>
          <select
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              const s = services.find((x) => x.id === e.target.value);
              if (s) setTitle(s.title);
            }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#1A2F3A] dark:text-white outline-none focus:border-[#1A2F3A]"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} {s.price ? `— $${s.price}` : ''}
              </option>
            ))}
          </select>
          {selectedService?.duration_estimate && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              Typical duration: {selectedService.duration_estimate}
            </p>
          )}
        </div>
      )}

      {/* Title if no services defined */}
      {services.length === 0 && (
        <div>
          <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">What do you need?</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Bathroom sink leak"
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#1A2F3A] dark:text-white outline-none focus:border-[#1A2F3A]"
          />
        </div>
      )}

      {/* Address */}
      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1 flex items-center gap-1">
          <MapPin size={11} /> Service address (optional)
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St, Vancouver BC"
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#1A2F3A] dark:text-white outline-none focus:border-[#1A2F3A]"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1 flex items-center gap-1">
          <MessageSquare size={11} /> Notes for the provider (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any details that would help — access instructions, pets, urgency, etc."
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#1A2F3A] dark:text-white outline-none focus:border-[#1A2F3A] resize-none"
        />
      </div>

      {/* Guest contact info */}
      {isGuest && (
        <>
          <div className="pt-2 border-t border-gray-100 dark:border-white/10">
            <p className="text-xs font-medium text-[#1A2F3A] dark:text-white mb-2">Your contact info</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1 flex items-center gap-1"><User size={11} /> Name</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#1A2F3A] dark:text-white outline-none focus:border-[#1A2F3A]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1 flex items-center gap-1"><Mail size={11} /> Email</label>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#1A2F3A] dark:text-white outline-none focus:border-[#1A2F3A]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1 flex items-center gap-1"><Phone size={11} /> Phone (optional)</label>
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#1A2F3A] dark:text-white outline-none focus:border-[#1A2F3A]"
            />
          </div>
        </>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-3 text-xs text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !selectedDate || !selectedTime}
        className="w-full py-3 rounded-lg bg-[#1A2F3A] text-white font-medium text-sm hover:bg-[#2C4A52] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
        data-testid="submit-booking"
      >
        {submitting ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : 'Request Booking'}
      </button>

      <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
        No charge yet. You won't be billed until the provider confirms.
      </p>
    </form>
  );
}
