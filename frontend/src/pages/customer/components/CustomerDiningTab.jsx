import React, { useState } from 'react';
import { Calendar, Clock, Users, CheckCircle2, ChevronRight, Search, MapPin, Sparkles, Building2, Phone } from 'lucide-react';
import { DINING_MOODS, PERSIAN_DARBAR_BRANCHES } from '../customerAssets';

const CustomerDiningTab = ({
  selectedBranch,
  onSelectBranch,
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
  ).length || 8;

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
      {/* ── BEGIN: Persian Darbar Royal Dining Outlets ── */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-neutral-400">
              PERSIAN DARBAR OUTLETS (4)
            </h2>
            <p className="text-sm font-extrabold text-neutral-900 mt-0.5">
              Select Dining Room
            </p>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            All 4 Open for Dining
          </span>
        </div>

        <div className="flex space-x-3 overflow-x-auto no-scrollbar py-1">
          {PERSIAN_DARBAR_BRANCHES.map((branch) => {
            const isSelected = selectedBranch?.id === branch.id;
            return (
              <div
                key={branch.id}
                onClick={() => onSelectBranch && onSelectBranch(branch)}
                className={`w-48 shrink-0 rounded-2xl border overflow-hidden cursor-pointer shadow-xs active:scale-95 transition-all flex flex-col justify-between ${
                  isSelected ? 'border-[#E23744] ring-2 ring-red-100 bg-red-50/20' : 'border-neutral-200/80 bg-white'
                }`}
              >
                <div className="h-24 w-full relative bg-neutral-900">
                  <img
                    src={branch.image}
                    alt={branch.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    {branch.city}
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#E23744] text-white flex items-center justify-center text-[10px] font-black">
                      ✓
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <h4 className="text-xs font-black text-neutral-900 truncate">
                    {branch.name}
                  </h4>
                  <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                    {branch.shortAddress}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {/* ── END: Persian Darbar Royal Dining Outlets ── */}

      {/* ── BEGIN: What's the mood? ── */}
      <section className="mt-5 px-4">
        <h2 className="text-sm font-black text-neutral-900 uppercase tracking-tight mb-2.5">
          What's the dining mood?
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          {DINING_MOODS.map((mood, idx) => {
            const isSelected = selectedMood === mood.title;
            return (
              <div
                key={idx}
                onClick={() => setSelectedMood(isSelected ? null : mood.title)}
                className={`bg-white rounded-2xl border p-2 shadow-xs cursor-pointer active:scale-95 transition-all flex flex-col justify-between ${
                  isSelected ? 'border-[#E23744] ring-2 ring-red-100 bg-red-50/20' : 'border-neutral-200/80'
                }`}
              >
                <div className="h-20 w-full rounded-xl overflow-hidden bg-neutral-100 mb-2">
                  <img
                    src={mood.image}
                    alt={mood.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-900 leading-tight">
                    {mood.title}
                  </h3>
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">
                    {mood.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {/* ── END: What's the mood? ── */}

      {/* ── BEGIN: Table Reservation System ── */}
      <section className="mt-5 px-4">
        {/* Toggle Bar: Reserve Table vs My Bookings */}
        <div className="flex bg-neutral-100 p-1 rounded-2xl mb-3">
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
          /* ── Book Table Form ── */
          <div className="bg-white rounded-3xl p-4 border border-neutral-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-neutral-900">
                  {selectedBranch?.name || 'Bandra (Flagship)'} Dining Room
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {selectedBranch?.shortAddress || 'Linking Road, Bandra West'} · Instant Table Confirmation
                </p>
              </div>
              <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{availableTablesCount} Open</span>
              </div>
            </div>

            {bookingSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-black text-sm text-emerald-900">
                  Table Reserved Successfully!
                </h4>
                <p className="text-xs text-emerald-700">
                  Your table reservation for {bookingSuccess.guests || guestCount} guests on{' '}
                  {bookingSuccess.date || selectedDate} at {bookingSuccess.time || selectedTime} is confirmed.
                </p>
                <button
                  onClick={onResetBookingSuccess}
                  className="mt-2 inline-block bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform"
                >
                  Book Another Table
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                {/* 1. Date Selector */}
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1.5">
                    Select Date
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
                    placeholder="e.g. Birthday celebration, window table, high chair..."
                    className="w-full bg-neutral-50 border border-neutral-200/80 rounded-2xl px-3.5 py-2.5 text-xs font-medium text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#E23744]"
                  />
                </div>

                {/* Confirm Booking CTA */}
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full bg-[#E23744] hover:bg-[#d02e3b] text-white font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-red-500/20 active:scale-98 transition-all disabled:opacity-50"
                >
                  {bookingLoading ? 'Reserving Table...' : 'Confirm Royal Table Reservation ›'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* ── My Bookings List ── */
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

                  {res.special_requests && (
                    <p className="text-[11px] text-neutral-500 bg-neutral-50 p-2 rounded-xl">
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
