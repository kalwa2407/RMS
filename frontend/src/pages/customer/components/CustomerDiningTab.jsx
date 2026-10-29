import React, { useState } from 'react';
import { Calendar, Clock, Users, CheckCircle2, ChevronRight, Search, MapPin, Sparkles, Building2, Phone, Crown, Share2 } from 'lucide-react';
import { DINING_MOODS } from '../customerAssets';

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
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('08:00 PM');
  const [guestCount, setGuestCount] = useState(2);
  const [specialNote, setSpecialNote] = useState('');
  const [selectedMood, setSelectedMood] = useState('Royal Dastarkhwan');

  const TIME_SLOTS = [
    '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM',
    '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM'
  ];

  const availableTablesCount = tables.filter(
    (t) => ['available', 'free'].includes(t.status?.toLowerCase())
  ).length || 8;

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


  return (
    <div className="flex-1 pb-32 pt-2 px-4 space-y-4">
      {/* ── 1. SELECTED OUTLET HEADER (Apple Glassmorphism Card) ── */}
      <section className="bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-black/[0.06] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
            SELECTED ROYAL OUTLET
          </span>
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="text-xs font-black text-[#E40000] hover:underline flex items-center space-x-0.5 ios-press cursor-pointer"
          >
            <span>Change Outlet</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center space-x-3.5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-neutral-900 shrink-0 border border-black/[0.08] shadow-xs">
            <img
              src={selectedBranch?.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?crop=entropy&cs=srgb&fm=jpg&w=400&q=80'}
              alt={selectedBranch?.name || 'Persian Darbar'}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <h3 className="text-sm font-black text-neutral-900 truncate">
                Persian Darbar · {selectedBranch?.name || 'Camp, Pune'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-50 text-[#E40000] border border-red-200 shrink-0 shadow-xs">
                {selectedBranch?.badge || 'Open'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 truncate mt-0.5 font-medium">
              {selectedBranch?.fullAddress || selectedBranch?.shortAddress || 'Renaissance Centre, Wellesley Rd, Camp, Pune'}
            </p>
            <div className="flex items-center space-x-3 text-[10px] text-neutral-600 font-semibold mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-500 shrink-0" />
                <span>{selectedBranch?.timing || '11:00 AM - 1:00 AM'}</span>
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 shadow-xs">
                ● {availableTablesCount} Tables Open
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. WHAT'S THE DINING MOOD? (Apple Tactile Cards) ── */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-neutral-500 uppercase tracking-wider">
            WHAT'S THE DINING MOOD?
          </h2>
          <span className="text-[10px] font-bold text-[#E40000] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200 shadow-xs">
            Selected: {selectedMood}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {DINING_MOODS.map((mood, idx) => {
            const isSelected = selectedMood === mood.title;
            return (
              <div
                key={idx}
                onClick={() => setSelectedMood(mood.title)}
                className={`relative rounded-2xl border overflow-hidden p-2.5 cursor-pointer ios-press transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#E40000] bg-gradient-to-b from-red-50/50 to-white ring-2 ring-red-400/30 shadow-[0_6px_18px_-3px_rgba(228,0,0,0.18)]'
                    : 'border-black/[0.06] bg-white hover:border-neutral-300 shadow-xs'
                }`}
              >
                <div className="h-24 w-full rounded-xl overflow-hidden bg-neutral-900 mb-2 relative">
                  <img
                    src={mood.image}
                    alt={mood.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#E40000] text-white flex items-center justify-center text-[10px] font-black shadow-md border border-white/60">
                      ✓
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-black uppercase text-white bg-black/70 px-2 py-0.5 rounded-md backdrop-blur-xs border border-white/20">
                    {mood.tag}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-black text-neutral-900 leading-tight">
                    {mood.title}
                  </h4>
                  <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5 font-medium">
                    {mood.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. TABLE BOOKING FORM & MY BOOKINGS TOGGLE (Native iOS Segmented Control) ── */}
      <section className="space-y-3">
        <div className="flex bg-[#E5E5EA] p-1 rounded-2xl border border-black/[0.04]">
          <button
            onClick={() => setSubView('book')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ios-press ${
              subView === 'book'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Book a Table
          </button>
          <button
            onClick={() => setSubView('history')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ios-press relative ${
              subView === 'history'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            My Bookings
            {reservations.length > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-black ${
                subView === 'history' ? 'bg-[#E40000] text-white' : 'bg-neutral-300 text-neutral-800'
              }`}>
                {reservations.length}
              </span>
            )}
          </button>
        </div>

        {subView === 'book' ? (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 border border-black/[0.06] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] space-y-4">
            {bookingSuccess ? (
              <div className="relative rounded-3xl overflow-hidden bg-white border border-neutral-200/90 shadow-xl p-5 space-y-4 animate-in zoom-in-95 duration-300">
                {/* Red Brand Header Banner */}
                <div className="bg-gradient-to-r from-[#E40000] to-[#B30000] text-white -mx-5 -mt-5 p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <img
                      src="/app-icon.png"
                      alt="Persian Darbar"
                      className="w-8 h-8 rounded-xl object-contain bg-white/10 p-0.5 border border-white/30"
                    />
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-200 block">
                        VIP DINING PASS
                      </span>
                      <span className="text-xs font-black text-white">
                        Persian Darbar · Since 1978
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-white bg-white/20 border border-white/30 px-2 py-0.5 rounded-full">
                    #PD-{String(Date.now()).slice(-4)}
                  </span>
                </div>

                {/* Center Success Status */}
                <div className="text-center py-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 stroke-[2.5]" />
                  </div>
                  <h4 className="text-base font-black tracking-tight text-neutral-900">
                    Royal Table Reserved!
                  </h4>
                  <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                    Your luxury Mughlai dining experience is confirmed
                  </p>
                </div>

                {/* Perforated Ticket Divider with Notches */}
                <div className="relative py-1 flex items-center justify-between">
                  <div className="absolute -left-7 w-5 h-5 rounded-full bg-neutral-100 border border-neutral-200" />
                  <div className="w-full border-b border-dashed border-neutral-200 mx-2" />
                  <div className="absolute -right-7 w-5 h-5 rounded-full bg-neutral-100 border border-neutral-200" />
                </div>

                {/* Pass Details 2x2 Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-1 text-left">
                  <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-2.5">
                    <span className="text-[9px] font-bold uppercase text-neutral-400 tracking-wider block">
                      Date &amp; Time
                    </span>
                    <span className="text-xs font-black text-neutral-900 mt-0.5 block">
                      {bookingSuccess.date || selectedDate}
                    </span>
                    <span className="text-[10px] font-bold text-[#E40000] block">
                      {bookingSuccess.time || selectedTime}
                    </span>
                  </div>

                  <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-2.5">
                    <span className="text-[9px] font-bold uppercase text-neutral-400 tracking-wider block">
                      Table / Party
                    </span>
                    <span className="text-xs font-black text-neutral-900 mt-0.5 block">
                      {bookingSuccess.guests || guestCount} Guests
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Confirmed
                    </span>
                  </div>

                  <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-2.5 col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-neutral-400 tracking-wider block">
                          Royal Outlet &amp; Ambience
                        </span>
                        <span className="text-xs font-black text-neutral-900 mt-0.5 block truncate">
                          Persian Darbar · {selectedBranch?.name || 'Camp, Pune'}
                        </span>
                        <span className="text-[10px] text-neutral-500 block truncate">
                          {selectedBranch?.shortAddress || 'Renaissance Centre, Wellesley Rd'}
                        </span>
                      </div>
                      <span className="px-2 py-1 rounded-xl bg-red-50 border border-red-200 text-[#E40000] text-[10px] font-bold shrink-0">
                        {bookingSuccess.dining_mood || selectedMood || 'Royal Dining'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Share VIP Pass & Book Another Table */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const shareData = {
                          title: 'Persian Darbar VIP Dining Reservation',
                          text: `Table confirmed for ${bookingSuccess.guests || guestCount} guests on ${bookingSuccess.date || selectedDate} at ${bookingSuccess.time || selectedTime} at Persian Darbar ${selectedBranch?.name || 'Camp, Pune'}.`,
                          url: window.location.origin
                        };
                        if (navigator.share) {
                          navigator.share(shareData).catch(() => {});
                        } else {
                          navigator.clipboard?.writeText(shareData.text);
                          alert('Reservation pass copied to clipboard!');
                        }
                      }}
                      className="flex-1 py-3 px-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs flex items-center justify-center space-x-1.5 ios-press transition-all cursor-pointer border border-neutral-200"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Pass</span>
                    </button>

                    <button
                      type="button"
                      onClick={onResetBookingSuccess}
                      className="flex-1 py-3 px-3 rounded-2xl bg-[#E40000] hover:bg-[#CC0000] text-white font-black text-xs shadow-md ios-press transition-all cursor-pointer"
                    >
                      Book Another Table
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className="space-y-4 text-left">
                {/* 1. Date Selector (Apple Styled Container) */}
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                    Select Dining Date
                  </label>
                  <div className="relative w-full rounded-2xl overflow-hidden border border-black/[0.08] bg-neutral-100/70 shadow-xs focus-within:ring-2 focus-within:ring-red-200 focus-within:border-[#E40000] flex items-center px-3.5 py-3 transition-all">
                    <Calendar className="w-4 h-4 text-neutral-400 shrink-0 mr-2.5" />
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full box-border bg-transparent text-xs font-black text-neutral-900 outline-none cursor-pointer"
                      style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', width: '100%', maxWidth: '100%' }}
                    />
                  </div>
                </div>

                {/* 2. Guest Count Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">
                      Number of Guests
                    </label>
                    <span className="text-xs font-black text-[#E40000]">
                      {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGuestCount(num)}
                        className={`w-11 h-11 rounded-2xl font-black text-xs shrink-0 transition-all ios-press cursor-pointer ${
                          guestCount === num
                            ? 'bg-gradient-to-r from-[#E40000] to-[#C90000] text-white shadow-[0_4px_12px_rgba(228,0,0,0.35)] scale-105 border border-white/20'
                            : 'bg-neutral-100/80 text-neutral-700 hover:bg-neutral-200/80 border border-black/[0.05]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Time Slots */}
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                    Select Time Slot
                  </label>
                  <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`px-3.5 py-2 rounded-xl text-xs whitespace-nowrap shrink-0 transition-all ios-press cursor-pointer ${
                          selectedTime === slot
                            ? 'bg-gradient-to-r from-[#E40000] to-[#C90000] text-white shadow-[0_4px_12px_rgba(228,0,0,0.35)] font-black scale-105 border border-white/20'
                            : 'bg-neutral-100/80 text-neutral-700 hover:bg-neutral-200/80 border border-black/[0.05] font-bold'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Special Requests */}
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                    Special Requests (Optional)
                  </label>
                  <input
                    type="text"
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)}
                    placeholder="e.g. Birthday decor, quiet window booth, high chair..."
                    className="w-full bg-neutral-100/80 border border-black/[0.08] rounded-2xl px-4 py-3 text-xs font-medium text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#E40000] transition-all shadow-xs"
                  />
                </div>

                {/* Confirm Booking CTA */}
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full bg-gradient-to-r from-[#E40000] via-[#D31027] to-[#B91C1C] text-white font-black text-xs sm:text-sm py-4 rounded-2xl shadow-[0_8px_24px_-4px_rgba(228,0,0,0.4)] ios-press transition-all disabled:opacity-50 cursor-pointer border border-white/20 active:scale-95"
                >
                  {bookingLoading ? 'Reserving Royal Table...' : currentUser ? 'Confirm Royal Table Reservation ›' : 'Login to Reserve Table ›'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-neutral-200/80 shadow-xs space-y-3">
                <Calendar className="w-12 h-12 text-neutral-300 mx-auto" />
                <h4 className="font-extrabold text-sm text-neutral-800">
                  No Table Reservations Yet
                </h4>
                <p className="text-xs text-neutral-500">
                  Plan your Mughlai fine dining experience at Persian Darbar.
                </p>
                <button
                  onClick={() => setSubView('book')}
                  className="bg-[#E40000] hover:bg-[#CC0000] text-white text-xs font-black px-4 py-2 rounded-xl"
                >
                  Reserve a Table Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reservations.map((res) => (
                  <div
                    key={res.id || res._id}
                    className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                      <div>
                        <span className="text-[10px] font-black text-neutral-400 uppercase">
                          Table for {res.guests} Guests
                        </span>
                        <h4 className="font-extrabold text-sm text-neutral-900">
                          {res.date} at {res.time}
                        </h4>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                          res.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        }`}
                      >
                        {res.status === 'confirmed'
                          ? res.table_number
                            ? `Table ${res.table_number}`
                            : 'Confirmed'
                          : 'Awaiting Host'}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600">
                      Reserved for <strong className="text-neutral-900">{res.customer_name}</strong>
                    </p>

                    {(res.dining_mood || (res.special_requests && res.special_requests.includes('Mood:'))) && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                          {res.dining_mood || (res.special_requests.match(/Mood:\s*([^|\]]+)/)?.[1]?.trim()) || 'Royal Dastarkhwan'}
                        </span>
                      </div>
                    )}

                    {res.special_requests && (
                      <p className="text-[11px] text-neutral-500 bg-neutral-50 p-2 rounded-xl mt-1">
                        {res.special_requests}
                      </p>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomerDiningTab;
