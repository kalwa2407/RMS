import React, { useMemo, useState } from 'react';
import { Calendar, Clock, CheckCircle2, ChevronRight, Share2, Minus, Plus, Check, Sun, Moon } from 'lucide-react';
import { DINING_MOODS } from '../customerAssets';
import { cx, EmptyState } from '../ui';

// Local YYYY-MM-DD (avoids the UTC shift of toISOString late at night in IST)
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const LUNCH_SLOTS = ['12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM'];
const DINNER_SLOTS = ['07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM'];

const formatPrettyDate = (value) => {
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return value;
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

const CustomerDiningTab = ({
  selectedBranch,
  onSelectBranch,
  onOpenLocationModal,
  reservations = [],
  tables = [],
  currentUser,
  customerProfile,
  onBookTable,
  bookingLoading = false,
  bookingSuccess = null,
  onResetBookingSuccess,
  onOpenSearch
}) => {
  const [subView, setSubView] = useState('book'); // 'book' | 'history'

  // Booking Form State
  const [selectedDate, setSelectedDate] = useState(() => ymd(new Date()));
  const [selectedTime, setSelectedTime] = useState('08:00 PM');
  const [guestCount, setGuestCount] = useState(2);
  const [specialNote, setSpecialNote] = useState('');
  const [selectedMood, setSelectedMood] = useState('Royal Dastarkhwan');

  // Next 14 days for the date strip
  const dateOptions = useMemo(() => {
    const out = [];
    const base = new Date();
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      out.push({
        value: ymd(d),
        dow: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
        day: d.getDate(),
        month: d.toLocaleDateString('en-IN', { month: 'short' }),
      });
    }
    return out;
  }, []);

  const availableTablesCount = tables.filter(
    (t) => ['available', 'free'].includes(t.status?.toLowerCase())
  ).length;

  const handleSubmitBooking = (e) => {
    e.preventDefault();
    if (!currentUser) {
      onBookTable({});
      return;
    }
    onBookTable({
      date: selectedDate,
      time: selectedTime,
      guests: guestCount,
      dining_mood: selectedMood,
      branch_name: selectedBranch?.name || 'Persian Darbar, Camp Pune',
      special_requests: [selectedMood ? `Dining Mood: ${selectedMood}` : '', specialNote.trim()].filter(Boolean).join(' | ')
    });
  };

  const SlotGroup = ({ icon: Icon, label, slots }) => (
    <div>
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-pd-ink-2 mb-2">
        <Icon className="w-4 h-4" strokeWidth={1.75} /> {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => {
          const active = selectedTime === slot;
          return (
            <button
              key={slot}
              type="button"
              aria-pressed={active}
              onClick={() => setSelectedTime(slot)}
              className={cx(
                'h-10 px-3.5 rounded-[10px] text-[14px] font-medium border transition-colors pd-press pd-tabular',
                active ? 'bg-pd-ink text-white border-pd-ink' : 'bg-white text-pd-ink border-[color:var(--pd-line)]'
              )}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex-1 w-full max-w-full overflow-x-clip pb-44 bg-white min-h-screen">
      {/* ── Outlet ── */}
      <section className="px-4 pt-4">
        <button
          type="button"
          onClick={onOpenLocationModal}
          className="w-full flex items-center gap-3.5 rounded-[18px] border border-[color:var(--pd-line)] p-3 text-left pd-press"
        >
          <span className="w-16 h-16 rounded-[12px] overflow-hidden bg-pd-surface shrink-0">
            <img
              src={selectedBranch?.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?crop=entropy&cs=srgb&fm=jpg&w=400&q=80'}
              alt=""
              className="w-full h-full object-cover"
            />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[16px] font-semibold text-pd-ink truncate">
              Persian Darbar · {selectedBranch?.name || 'Camp, Pune'}
            </span>
            <span className="block text-[13px] text-pd-ink-2 truncate">
              {selectedBranch?.fullAddress || selectedBranch?.shortAddress || 'Renaissance Centre, Wellesley Rd, Camp, Pune'}
            </span>
            <span className="mt-1 flex items-center gap-3 text-[12px] text-pd-ink-3">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selectedBranch?.timing || '11:00 AM - 1:00 AM'}</span>
              {availableTablesCount > 0 && (
                <span className="text-pd-success font-medium">{availableTablesCount} tables free now</span>
              )}
            </span>
          </span>
          <span className="text-[13px] font-semibold text-pd-action flex items-center shrink-0">
            Change <ChevronRight className="w-4 h-4" />
          </span>
        </button>
      </section>

      {/* ── Book / My bookings ── */}
      <div className="px-4 pt-5">
        <div className="flex bg-pd-surface p-1 rounded-[12px]" role="tablist">
          {[
            { id: 'book', label: 'Book a table' },
            { id: 'history', label: `My bookings${reservations.length ? ` (${reservations.length})` : ''}` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={subView === t.id}
              onClick={() => setSubView(t.id)}
              className={cx(
                'flex-1 h-9 rounded-[9px] text-[14px] font-semibold transition-colors',
                subView === t.id ? 'bg-white text-pd-ink shadow-pd-1' : 'text-pd-ink-2'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {subView === 'book' ? (
        bookingSuccess ? (
          /* ── Success pass ── */
          <section className="px-4 pt-5">
            <div className="rounded-[22px] overflow-hidden border border-[color:var(--pd-line)] shadow-pd-1 animate-in zoom-in-95 duration-300">
              <div className="bg-pd-teal text-white px-5 pt-6 pb-5 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-[#7EE2A0]" strokeWidth={1.75} />
                <h3 className="mt-3 text-[22px] font-bold">Table reserved</h3>
                <p className="mt-1 text-[14px] text-white/75">We look forward to hosting you.</p>
              </div>
              <div className="relative">
                <span className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-white border border-[color:var(--pd-line)]" />
                <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-white border border-[color:var(--pd-line)]" />
              </div>
              <dl className="grid grid-cols-2 gap-y-4 gap-x-3 p-5">
                <div>
                  <dt className="text-[12px] text-pd-ink-3">Date</dt>
                  <dd className="text-[15px] font-semibold text-pd-ink">{formatPrettyDate(bookingSuccess.date || selectedDate)}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-pd-ink-3">Time</dt>
                  <dd className="text-[15px] font-semibold text-pd-ink">{bookingSuccess.time || selectedTime}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-pd-ink-3">Guests</dt>
                  <dd className="text-[15px] font-semibold text-pd-ink">{bookingSuccess.guests || guestCount}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-pd-ink-3">Setting</dt>
                  <dd className="text-[15px] font-semibold text-pd-ink truncate">{bookingSuccess.dining_mood || selectedMood || 'Royal Dining'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[12px] text-pd-ink-3">Outlet</dt>
                  <dd className="text-[15px] font-semibold text-pd-ink">Persian Darbar · {selectedBranch?.name || 'Camp, Pune'}</dd>
                  <dd className="text-[13px] text-pd-ink-2">{selectedBranch?.shortAddress || 'Renaissance Centre, Wellesley Rd'}</dd>
                </div>
              </dl>
              <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const shareData = {
                      title: 'Persian Darbar table reservation',
                      text: `Table confirmed for ${bookingSuccess.guests || guestCount} guests on ${bookingSuccess.date || selectedDate} at ${bookingSuccess.time || selectedTime} at Persian Darbar ${selectedBranch?.name || 'Camp, Pune'}.`,
                      url: window.location.origin
                    };
                    if (navigator.share) {
                      navigator.share(shareData).catch(() => {});
                    } else {
                      navigator.clipboard?.writeText(shareData.text);
                      alert('Reservation details copied to clipboard!');
                    }
                  }}
                  className="h-12 rounded-[12px] bg-pd-surface text-pd-ink text-[15px] font-semibold flex items-center justify-center gap-2 pd-press"
                >
                  <Share2 className="w-[18px] h-[18px]" /> Share
                </button>
                <button
                  type="button"
                  onClick={onResetBookingSuccess}
                  className="h-12 rounded-[12px] bg-pd-ink text-white text-[15px] font-semibold pd-press"
                >
                  Book another
                </button>
              </div>
            </div>
          </section>
        ) : (
          <form onSubmit={handleSubmitBooking}>
            {/* Date strip */}
            <section className="pt-6">
              <h3 className="px-4 text-[17px] font-semibold text-pd-ink">Date</h3>
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
                {dateOptions.map((d) => {
                  const active = selectedDate === d.value;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedDate(d.value)}
                      className={cx(
                        'w-[60px] h-[72px] shrink-0 rounded-[14px] border flex flex-col items-center justify-center pd-press transition-colors',
                        active ? 'bg-pd-ink border-pd-ink text-white' : 'bg-white border-[color:var(--pd-line)] text-pd-ink'
                      )}
                    >
                      <span className={cx('text-[12px]', active ? 'text-white/75' : 'text-pd-ink-3')}>{d.dow}</span>
                      <span className="text-[20px] leading-6 font-bold pd-tabular">{d.day}</span>
                      <span className={cx('text-[11px]', active ? 'text-white/75' : 'text-pd-ink-3')}>{d.month}</span>
                    </button>
                  );
                })}
                <label className="w-[60px] h-[72px] shrink-0 rounded-[14px] border border-dashed border-black/20 flex flex-col items-center justify-center text-pd-ink-2 relative cursor-pointer">
                  <Calendar className="w-5 h-5" strokeWidth={1.75} />
                  <span className="text-[11px] mt-1">More</span>
                  <input
                    type="date"
                    min={ymd(new Date())}
                    value={selectedDate}
                    onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                    aria-label="Pick another date"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            </section>

            {/* Guests */}
            <section className="px-4 pt-6">
              <div className="flex items-center justify-between rounded-[16px] border border-[color:var(--pd-line)] px-4 h-16">
                <div>
                  <p className="text-[16px] font-semibold text-pd-ink">Guests</p>
                  <p className="text-[12px] text-pd-ink-3">Including children</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Fewer guests"
                    onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                    disabled={guestCount <= 1}
                    className="w-10 h-10 rounded-full border border-[color:var(--pd-line)] flex items-center justify-center text-pd-ink disabled:opacity-30 pd-press"
                  >
                    <Minus className="w-4 h-4" strokeWidth={2.25} />
                  </button>
                  <span className="w-10 text-center text-[18px] font-semibold text-pd-ink pd-tabular" aria-live="polite">{guestCount}</span>
                  <button
                    type="button"
                    aria-label="More guests"
                    onClick={() => setGuestCount((g) => Math.min(30, g + 1))}
                    className="w-10 h-10 rounded-full border border-[color:var(--pd-line)] flex items-center justify-center text-pd-ink pd-press"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.25} />
                  </button>
                </div>
              </div>
            </section>

            {/* Time */}
            <section className="px-4 pt-6 space-y-4">
              <h3 className="text-[17px] font-semibold text-pd-ink">Time</h3>
              <SlotGroup icon={Sun} label="Lunch" slots={LUNCH_SLOTS} />
              <SlotGroup icon={Moon} label="Dinner" slots={DINNER_SLOTS} />
            </section>

            {/* Setting */}
            <section className="pt-7">
              <h3 className="px-4 text-[17px] font-semibold text-pd-ink">Seating preference</h3>
              <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1">
                {DINING_MOODS.map((mood, idx) => {
                  const isSelected = selectedMood === mood.title;
                  return (
                    <button
                      key={idx}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedMood(mood.title)}
                      className="w-[148px] shrink-0 text-left pd-press"
                    >
                      <span className={cx('relative block h-[100px] rounded-[14px] overflow-hidden bg-pd-surface ring-offset-2 transition-shadow', isSelected && 'ring-2 ring-pd-ink')}>
                        <img src={mood.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-pd-ink text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          </span>
                        )}
                      </span>
                      <span className="mt-2 block text-[14px] font-semibold text-pd-ink leading-5">{mood.title}</span>
                      <span className="block text-[12px] text-pd-ink-3 line-clamp-1">{mood.tag}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Requests */}
            <section className="px-4 pt-6">
              <label htmlFor="pd-special-note" className="text-[17px] font-semibold text-pd-ink">Special requests</label>
              <input
                id="pd-special-note"
                type="text"
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder="Birthday, window seat, high chair…"
                className="mt-3 w-full h-12 bg-pd-surface rounded-[12px] px-3.5 text-[16px] text-pd-ink placeholder:text-pd-ink-3 focus:outline-none focus:ring-2 focus:ring-pd-action/30"
              />
            </section>

            {/* Summary + CTA */}
            <section className="px-4 pt-6">
              <p className="text-[14px] text-pd-ink-2 text-center pd-tabular">
                {formatPrettyDate(selectedDate)} · {selectedTime} · {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
              </p>
              <button
                type="submit"
                disabled={bookingLoading}
                className="mt-3 w-full h-[52px] rounded-[14px] bg-pd-action hover:bg-pd-action-press text-white text-[16px] font-semibold pd-press disabled:opacity-60"
              >
                {bookingLoading ? 'Reserving…' : currentUser ? 'Reserve table' : 'Log in to reserve'}
              </button>
            </section>
          </form>
        )
      ) : (
        /* ── My bookings ── */
        <section className="px-4 pt-4">
          {reservations.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No reservations yet"
              message="Your upcoming and past table bookings will show here."
              actionLabel="Book a table"
              onAction={() => setSubView('book')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reservations.map((res) => {
                const confirmed = res.status === 'confirmed';
                const mood = res.dining_mood || (res.special_requests && res.special_requests.match(/Mood:\s*([^|\]]+)/)?.[1]?.trim());
                return (
                  <article key={res.id || res._id} className="rounded-[16px] border border-[color:var(--pd-line)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[16px] font-semibold text-pd-ink">{formatPrettyDate(res.date)} · {res.time}</p>
                        <p className="text-[13px] text-pd-ink-2 mt-0.5">
                          Table for {res.guests} · {res.customer_name}
                        </p>
                      </div>
                      <span className={cx(
                        'h-7 px-2.5 rounded-full text-[12px] font-semibold flex items-center shrink-0',
                        confirmed ? 'bg-[#EAF6EE] text-pd-success' : 'bg-[#FFF5E5] text-pd-warn'
                      )}>
                        {confirmed ? (res.table_number ? `Table ${res.table_number}` : 'Confirmed') : 'Awaiting host'}
                      </span>
                    </div>
                    {mood && <p className="mt-2 text-[13px] text-pd-ink">{mood}</p>}
                    {res.special_requests && (
                      <p className="mt-2 text-[13px] text-pd-ink-2 bg-pd-surface rounded-[10px] px-3 py-2">{res.special_requests}</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default CustomerDiningTab;
