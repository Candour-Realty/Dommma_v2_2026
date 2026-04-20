import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

/**
 * Customer-facing week-view availability calendar (BCAA-style).
 *
 * Props:
 *   availability       { schedule: [{day_of_week, enabled, start_time, end_time}], slot_minutes }
 *   bookedSlots        [{preferred_date: 'YYYY-MM-DD', preferred_time: 'HH:MM'}]
 *   weekStart          Date — the Sunday of the currently displayed week
 *   onWeekChange(date) called when user clicks prev/next week
 *   selectedDate       'YYYY-MM-DD' | null
 *   selectedTime       'HH:MM' | null
 *   onSelect(date, time)
 */
export default function AvailabilityCalendar({
  availability,
  bookedSlots = [],
  weekStart,
  onWeekChange,
  selectedDate,
  selectedTime,
  onSelect,
}) {
  const schedule = availability?.schedule || [];
  const slotMinutes = availability?.slot_minutes || 60;

  // Build 7 days from weekStart
  const days = useMemo(() => {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      out.push({
        date: iso,
        dayOfWeek: d.getDay(),
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
      });
    }
    return out;
  }, [weekStart]);

  // For each day, compute time slots
  const daySlots = useMemo(() => {
    const map = {};
    days.forEach((d) => {
      const rule = schedule.find((s) => s.day_of_week === d.dayOfWeek);
      if (!rule || !rule.enabled) {
        map[d.date] = [];
        return;
      }
      const [sh, sm] = rule.start_time.split(':').map(Number);
      const [eh, em] = rule.end_time.split(':').map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;
      const slots = [];
      for (let m = startMin; m + slotMinutes <= endMin; m += slotMinutes) {
        const h = Math.floor(m / 60);
        const mm = m % 60;
        slots.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
      }
      map[d.date] = slots;
    });
    return map;
  }, [days, schedule, slotMinutes]);

  const isBooked = (date, time) => bookedSlots.some(
    (b) => b.preferred_date === date && b.preferred_time === time
  );

  const rangeLabel = useMemo(() => {
    if (!days.length) return '';
    const first = new Date(days[0].date);
    const last = new Date(days[6].date);
    const fmt = { month: 'short', day: 'numeric' };
    return `${first.toLocaleDateString('en-US', fmt)} – ${last.toLocaleDateString('en-US', { ...fmt, year: 'numeric' })}`;
  }, [days]);

  const shiftWeek = (delta) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + delta * 7);
    onWeekChange?.(d);
  };

  // Find a max slot count to pad columns evenly
  const maxSlots = Math.max(1, ...days.map((d) => (daySlots[d.date] || []).length));

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#1A2332]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
        <button
          onClick={() => shiftWeek(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"
          data-testid="week-prev"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold text-[#1A2F3A] dark:text-white">{rangeLabel}</p>
        <button
          onClick={() => shiftWeek(1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"
          data-testid="week-next"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/10">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10" /> Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#1A2F3A]" /> Selected
        </span>
      </div>

      {/* Day columns */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 min-w-[640px]">
          {days.map((d) => (
            <div key={d.date} className="border-r border-gray-100 dark:border-white/10 last:border-r-0">
              <div className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
                {d.label}
              </div>
              <div className="p-2 space-y-1.5 min-h-[200px]">
                {(daySlots[d.date] || []).length === 0 ? (
                  <p className="text-[10px] text-gray-300 dark:text-gray-600 text-center mt-3">Closed</p>
                ) : (
                  (daySlots[d.date] || []).map((t) => {
                    const booked = isBooked(d.date, t);
                    const selected = selectedDate === d.date && selectedTime === t;
                    const base = 'w-full px-2 py-1.5 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-all';
                    let cls;
                    if (selected) cls = 'bg-[#1A2F3A] text-white ring-2 ring-[#C4A962]';
                    else if (booked) cls = 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed line-through';
                    else cls = 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-800/40 cursor-pointer';
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={booked}
                        onClick={() => !booked && onSelect?.(d.date, t)}
                        className={`${base} ${cls}`}
                        data-testid={`slot-${d.date}-${t}`}
                      >
                        {selected && <CheckCircle2 size={10} />}
                        {t}
                      </button>
                    );
                  })
                )}
                {/* Spacer rows to keep day columns the same height */}
                {Array.from({ length: Math.max(0, maxSlots - (daySlots[d.date] || []).length) }).map((_, i) => (
                  <div key={`spacer-${i}`} className="h-[26px]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
