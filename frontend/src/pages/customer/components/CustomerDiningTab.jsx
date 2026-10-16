import React, { useState } from 'react';
import { Calendar, Clock, Users, CheckCircle2, ChevronRight, Search, MapPin, Sparkles, Building2, Phone } from 'lucide-react';
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
      {/* ── 1. SELECTED OUTLET HEADER (Synchronized with top bar, extra select dining room removed) ── */}
      <section className="bg-white rounded-3xl p-4 border border-amber-900/10 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
            SELECTED ROYAL OUTLET
          </span>
          <button
            type="button"
            onClick={onOpenLocationModal}
            className="text-xs font-black text-[#E23744] hover:underline flex items-center space-x-0.5"
          >
            <span>Change Outlet</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center space-x-3.5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-neutral-900 shrink-0 border border-neutral-200">
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
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800 shrink-0">
                {selectedBranch?.badge || 'Open'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 truncate mt-0.5">
              {selectedBranch?.fullAddress || selectedBranch?.shortAddress || 'Renaissance Centre, Wellesley Rd, Camp, Pune'}
            </p>
            <div className="flex items-center space-x-3 text-[10px] text-neutral-600 font-semibold mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-neutral-500 shrink-0" />
                <span>{selectedBranch?.timing || '11:00 AM - 1:00 AM'}</span>
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                ● {availableTablesCount} Tables Open
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. WHAT'S THE DINING MOOD? (Authentic Imagery) ── */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-neutral-500 uppercase tracking-wider">
            WHAT'S THE DINING MOOD?
          </h2>
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            Selected: {selectedMood}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {DINING_MOODS.map((mood, idx) => {
            const isSelected = selectedMood === mood.title;
            return (
              <div
                key={idx}
                onClick={() => setSelectedMood(mood.title)}
                className={`relative rounded-2xl border overflow-hidden p-2.5 cursor-pointer active:scale-98 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#E23744] bg-red-50/20 ring-2 ring-red-100 shadow-sm'
                    : 'border-neutral-200/80 bg-white hover:border-neutral-300'
                }`}
              >
                <div className="h-24 w-full rounded-xl overflow-hidden bg-neutral-900 mb-2 relative">
                  <img
                    src={mood.image}
                    alt={mood.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#E23744] text-white flex items-center justify-center text-[10px] font-black shadow-md">
                      ✓
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-black uppercase text-white bg-black/60 px-1.5 py-0.5 rounded-md backdrop-blur-xs">
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

      {/* ── 3. TABLE BOOKING FORM & MY BOOKINGS TOGGLE ── */}
      <section className="space-y-3">
        <div className="flex bg-neutral-100 p-1 rounded-2xl">
          <button
            onClick={() => setSubView('book')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
              subView === 'book'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Book a Table
          </button>
          <button
            onClick={() => setSubView('history')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all relative ${
              subView === 'history'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
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
          <div className="bg-white rounded-3xl p-5 border border-neutral-200/80 shadow-xs space-y-4">
            {bookingSuccess ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2.5">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-black text-base text-emerald-900">
                  Royal Table Reserved Successfully!
                </h4>
                <p className="text-xs text-emerald-700 max-w-xs mx-auto">
                  Your table reservation for {bookingSuccess.guests || guestCount} guests on{' '}
                  <strong>{bookingSuccess.date || selectedDate}</strong> at{' '}
                  <strong>{bookingSuccess.time || selectedTime}</strong> at Persian Darbar {selectedBranch?.name || 'Camp, Pune'} is confirmed.
                </p>
                <button
                  onClick={onResetBookingSuccess}
                  className="mt-2 inline-block bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl active:scale-95 transition-transform"
                >
                  Book Another Table
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className="space-y-4 text-left">
                {/* 1. Date Selector */}
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                    Select Dining Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#E23744]"
                  />
                </div>

                {/* 2. Guest Count Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">
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
                        className={`w-10 h-10 rounded-2xl font-black text-xs shrink-0 transition-all ${
                          guestCount === num
                            ? 'bg-[#E23744] text-white shadow-xs scale-105'
                            : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200/80'
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                          selectedTime === slot
                            ? 'bg-neutral-900 text-white shadow-xs font-black'
                            : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200/80'
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
                    className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl px-3.5 py-2.5 text-xs font-medium text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#E23744]"
                  />
                </div>

                {/* Confirm Booking CTA */}
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full bg-[#E23744] hover:bg-[#d02e3b] text-white font-black text-xs sm:text-sm py-3.5 rounded-2xl shadow-lg shadow-red-500/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {bookingLoading ? 'Reserving Table...' : 'Confirm Royal Table Reservation ›'}
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
                  className="bg-[#E23744] text-white text-xs font-black px-4 py-2 rounded-xl"
                >
                  Reserve a Table Now
                </button>
              </div>
            ) : (
              reservations.map((res) => (
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
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default CustomerDiningTab;
