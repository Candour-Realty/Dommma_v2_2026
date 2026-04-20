import React, { useEffect, useState } from 'react';
import { Clock, Save, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../App';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Contractor's own availability editor. Lets them set weekly working hours,
 * slot duration, advance notice, and booking window.
 */
export default function AvailabilityEditor() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [advanceNotice, setAdvanceNotice] = useState(24);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(60);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    axios.get(`${API}/contractors/${user.id}/availability`)
      .then((res) => {
        setSchedule(res.data.schedule || []);
        setSlotMinutes(res.data.slot_minutes || 60);
        setAdvanceNotice(res.data.advance_notice_hours ?? 24);
        setMaxAdvanceDays(res.data.max_advance_days ?? 60);
      })
      .catch(() => setError('Could not load your availability'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const updateDay = (day, patch) => {
    setSchedule((prev) => prev.map((d) => (d.day_of_week === day ? { ...d, ...patch } : d)));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await axios.put(`${API}/contractors/${user.id}/availability?user_id=${user.id}`, {
        schedule,
        slot_minutes: slotMinutes,
        advance_notice_hours: advanceNotice,
        max_advance_days: maxAdvanceDays,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 justify-center text-gray-500 dark:text-gray-400">
        <Loader2 size={18} className="animate-spin" /> Loading your schedule…
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="availability-editor">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1A2F3A] dark:text-white">Weekly availability</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Customers see this on your public profile and can request bookings in available slots.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-[#1A2F3A] text-white text-sm font-medium hover:bg-[#2C4A52] disabled:opacity-50 flex items-center gap-2"
          data-testid="save-availability"
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : saved ? <><CheckCircle2 size={14} /> Saved</> : <><Save size={14} /> Save</>}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-3 text-xs text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Days */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 divide-y divide-gray-100 dark:divide-white/10 overflow-hidden bg-white dark:bg-[#1A2332]">
        {schedule.sort((a, b) => a.day_of_week - b.day_of_week).map((d) => (
          <div key={d.day_of_week} className="px-4 py-3 flex items-center gap-4 flex-wrap" data-testid={`day-row-${d.day_of_week}`}>
            <label className="flex items-center gap-2 cursor-pointer w-32">
              <input
                type="checkbox"
                checked={d.enabled}
                onChange={(e) => updateDay(d.day_of_week, { enabled: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-[#1A2F3A] dark:text-white">{DAY_NAMES[d.day_of_week]}</span>
            </label>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Clock size={14} className="text-gray-400" />
              <input
                type="time"
                value={d.start_time}
                disabled={!d.enabled}
                onChange={(e) => updateDay(d.day_of_week, { start_time: e.target.value })}
                className="px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#1A2F3A] dark:text-white disabled:opacity-50 text-sm"
              />
              <span>to</span>
              <input
                type="time"
                value={d.end_time}
                disabled={!d.enabled}
                onChange={(e) => updateDay(d.day_of_week, { end_time: e.target.value })}
                className="px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#1A2F3A] dark:text-white disabled:opacity-50 text-sm"
              />
            </div>
            {!d.enabled && <span className="text-xs text-gray-400 dark:text-gray-500">Closed</span>}
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A2332] p-4">
          <label className="text-xs text-gray-500 dark:text-gray-400">Slot length</label>
          <select
            value={slotMinutes}
            onChange={(e) => setSlotMinutes(parseInt(e.target.value, 10))}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#1A2F3A] dark:text-white text-sm"
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
          </select>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A2332] p-4">
          <label className="text-xs text-gray-500 dark:text-gray-400">Min advance notice</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              min={0}
              value={advanceNotice}
              onChange={(e) => setAdvanceNotice(parseInt(e.target.value || '0', 10))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#1A2F3A] dark:text-white text-sm"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">hours</span>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A2332] p-4">
          <label className="text-xs text-gray-500 dark:text-gray-400">Max booking horizon</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              min={7}
              value={maxAdvanceDays}
              onChange={(e) => setMaxAdvanceDays(parseInt(e.target.value || '0', 10))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#1A2F3A] dark:text-white text-sm"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
