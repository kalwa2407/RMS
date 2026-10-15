import React, { useState } from 'react';
import { Calendar, Clock, Users, CheckCircle2, ChevronRight, Search, MapPin, Sparkles } from 'lucide-react';
import { DINING_MOODS, SPOTLIGHT_BRANDS } from '../customerAssets';

const CustomerDiningTab = ({
  selectedBranch,
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
  const [selectedMood, setSelectedMood] = useState(null);

  const TIME_SLOTS = [
    '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM',
    '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM'
  ];

  const availableTablesCount = tables.filter(
    t => ['available', 'free'].includes(t.status?.toLowerCase())
  ).length;

  const handleSubmitBooking = (e) => {
    e.preventDefault();
    onBookTable({
      date: selectedDate,
      time: selectedTime,
      guests: guestCount,
      special_requests: [selectedMood ? `Mood: ${selectedMood}` : '', specialNote.trim()].filter(Boolean).join(' | ')
    });
  };

  return (
    <div className="flex-1 pb-28 pt-2">
      {/* ── BEGIN: Dining Promo Banners Carousel ── */}
      <section className="px-4">
        <div className="flex space-x-3 overflow-x-auto no-scrollbar py-1">
          {/* Promo Card 1: UP TO 50% OFF */}
          <div className="w-[140px] shrink-0 h-28 bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] rounded-2xl p-3 text-white flex flex-col justify-between shadow-xs relative overflow-hidden cursor-pointer">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-purple-200">
                UP TO
              </p>
              <h3 className="text-xl font-black leading-none mt-0.5">50% OFF</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                →
              </span>
              <span className="w-8 h-8 rounded-full bg-red-500 text-white font-black text-xs flex items-center justify-center -mr-1 -mb-1 shadow">
                %
              </span>
            </div>
          </div>

          {/* Promo Card 2: FAMILY FAVOURITES */}
          <div className="w-[140px] shrink-0 h-28 bg-gradient-to-br from-[#6366F1] to-[#4338CA] rounded-2xl p-3 text-white flex flex-col justify-between shadow-xs relative overflow-hidden cursor-pointer">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-200">
                ROYAL
              </p>
              <h3 className="text-xs font-black leading-tight mt-0.5">
                FAMILY<br />FAVOURITES
              </h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                →
              </span>
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=srgb&fm=jpg&w=200&q=80"
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-white/40 -mr-1 -mb-1"
              />
            </div>
          </div>

          {/* Promo Card 3: ROYAL DASTARKHWAN */}
          <div className="w-[140px] shrink-0 h-28 bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] rounded-2xl p-3 text-white flex flex-col justify-between shadow-xs relative overflow-hidden cursor-pointer">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-purple-200">
                SPECIAL
              </p>
              <h3 className="text-xs font-black leading-tight mt-0.5">
                SHAHI<br />DASTARKHWAN
              </h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                →
              </span>
              <img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?crop=entropy&cs=srgb&fm=jpg&w=200&q=80"
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-white/40 -mr-1 -mb-1"
              />
            </div>
          </div>
        </div>
      </section>
      {/* ── END: Dining Promo Banners ── */}

      {/* ── BEGIN: IN THE SPOTLIGHT ── */}
      <section className="mt-5 px-4">
        <div className="flex items-center justify-center space-x-1.5 mb-3 text-neutral-800">
          <span className="text-[#6366F1] text-xs">✦</span>
          <h2 className="text-xs font-black tracking-widest uppercase">
            IN THE SPOTLIGHT
          </h2>
          <span className="text-[#6366F1] text-xs">✦</span>
        </div>

        <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-2">
          {SPOTLIGHT_BRANDS.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 rounded-full bg-neutral-900 text-amber-300 font-serif font-black text-xs flex items-center justify-center shadow-xs border border-neutral-700 p-2 text-center">
                {item.logo}
              </div>
              <span className="text-[11px] font-bold text-neutral-900 mt-1.5 text-center max-w-[80px] truncate">
                {item.name}
              </span>
              <span className="text-[10px] font-extrabold text-[#5B21B6]">
                {item.discount}
              </span>
            </div>
          ))}
        </div>
      </section>
      {/* ── END: IN THE SPOTLIGHT ── */}

      {/* ── BEGIN: What's the mood? ── */}
      <section className="mt-5 px-4">
        <h2 className="text-base font-extrabold text-neutral-900 mb-3">
          What's the mood?
        </h2>

        <div className="grid grid-cols-3 gap-2.5">
          {DINING_MOODS.map((mood, idx) => {
            const isSelected = selectedMood === mood.title;
            return (
              <div
                key={idx}
                onClick={() => setSelectedMood(isSelected ? null : mood.title)}
                className={`bg-white rounded-2xl border p-2 shadow-xs cursor-pointer active:scale-95 transition-all flex flex-col justify-between ${
                  isSelected ? 'border-[#E23744] ring-2 ring-red-100 bg-red-50/20' : 'border-neutral-100'
                }`}
              >
                <div className="h-20 w-full rounded-xl overflow-hidden bg-neutral-100 mb-2">
                  <img
                    src={mood.image}
                    alt={mood.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xs font-bold text-neutral-900 leading-tight">
                  {mood.title}
                </h3>
                <span className="text-[9px] text-neutral-500 mt-0.5">
                  {mood.tag}
                </span>
              </div>
            );
          })}
        </div>
      </section>
      {/* ── END: What's the mood? ── */}

      {/* ── BEGIN: Table Reservation System ── */}
      <section className="mt-6 px-4">
        {/* Toggle Bar: Reserve Table vs My Bookings */}
        <div className="flex bg-neutral-100 p-1 rounded-xl mb-4">
          <button
            onClick={() => setSubView('book')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              subView === 'book'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500'
            }`}
          >
            Book a Table
          </button>
          <button
            onClick={() => setSubView('history')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all relative ${
              subView === 'history'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500'
            }`}
          >
            My Bookings
            {reservations.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#E23744] text-white text-[9px] font-black">
                {reservations.length}
              </span>
            )}
          </button>
        </div>

        {subView === 'book' ? (
          /* ── Book Table Form ── */
          <div className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-neutral-900">
                  Persian Darbar Dining Room ({selectedBranch?.name || 'Bandra Flagship'})
                </h3>
                <p className="text-[11px] text-neutral-500">
                  {selectedBranch?.shortAddress || 'Linking Road, Bandra West'} · Instant Table Confirmation
                </p>
              </div>
              <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{availableTablesCount} Tables Open</span>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-sm text-emerald-900">
                  Table Confirmed!
                </h4>
                <p className="text-xs text-emerald-700">
                  Your table reservation for {bookingSuccess.guests || guestCount} guests on{' '}
                  {bookingSuccess.date || selectedDate} at {bookingSuccess.time || selectedTime} is confirmed.
                </p>
                <button
                  onClick={onResetBookingSuccess}
                  className="mt-2 inline-block bg-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg active:scale-95 transition-transform"
                >
                  Book Another Table
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                {/* 1. Date Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Select Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#E23744]"
                  />
                </div>

                {/* 2. Guest Count Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                      Number of Guests
                    </label>
                    <span className="text-xs font-black text-[#E23744]">
                      {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGuestCount(num)}
                        className={`w-9 h-9 rounded-xl font-bold text-xs shrink-0 transition-all ${
                          guestCount === num
                            ? 'bg-[#E23744] text-white shadow-xs'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Time Slots */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Select Time Slot
                  </label>
                  <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                          selectedTime === slot
                            ? 'bg-neutral-900 text-white shadow-xs'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Special Requests */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Special Requests (Optional)
                  </label>
                  <input
                    type="text"
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)}
                    placeholder="e.g. Birthday, Anniversary, Window seat..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#E23744]"
                  />
                </div>

                {/* Confirm Booking CTA */}
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full bg-[#E23744] hover:bg-[#CB202D] text-white font-extrabold text-sm py-3 rounded-xl shadow-xs active:scale-98 transition-all disabled:opacity-50"
                >
                  {bookingLoading ? 'Reserving Table...' : 'Confirm Table Reservation ›'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ── My Bookings List ── */
          <div className="space-y-3">
            {reservations.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-neutral-100 shadow-xs">
                <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-neutral-800">
                  No Table Reservations Yet
                </h4>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                  Reserve a table to enjoy royal hospitality at Persian Darbar without waiting in queue!
                </p>
                <button
                  onClick={() => setSubView('book')}
                  className="mt-4 bg-[#E23744] text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform"
                >
                  Book a Table Now
                </button>
              </div>
            ) : (
              reservations.map((res) => {
                const statusColor = {
                  confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  pending: 'bg-amber-50 text-amber-800 border-amber-200',
                  cancelled: 'bg-red-50 text-red-800 border-red-200',
                  completed: 'bg-neutral-100 text-neutral-800 border-neutral-200'
                }[res.status?.toLowerCase()] || 'bg-neutral-100 text-neutral-800 border-neutral-200';

                return (
                  <div
                    key={res.id || res._id}
                    className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${statusColor}`}>
                          {res.status || 'Pending'}
                        </span>
                        {res.table_number && (
                          <span className="text-xs font-bold text-neutral-700">
                            Table #{res.table_number}
                          </span>
                        )}
                      </div>
                      <p className="font-extrabold text-sm text-neutral-900 mt-1.5">
                        {res.date} at {res.time}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {res.guests} {res.guests === 1 ? 'Guest' : 'Guests'} · {res.customer_name || 'Valued Guest'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-bold text-neutral-400">
                        #{String(res.id || res._id).slice(-6)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>
      {/* ── END: Table Reservation System ── */}
    </div>
  );
};

export default CustomerDiningTab;
