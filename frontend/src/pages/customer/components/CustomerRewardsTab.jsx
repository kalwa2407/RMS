import React, { useState } from 'react';
import {
  Crown,
  Sparkles,
  Gift,
  Coins,
  ChevronRight,
  CheckCircle2,
  Share2,
  Star,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Tag,
  MessageCircle,
  Bike,
  UtensilsCrossed,
  Users,
  X,
  Copy,
  Check,
  MessageSquare
} from 'lucide-react';
import { REWARD_TIERS, REWARD_VOUCHERS, ROYAL_MEMBERSHIP_PRIVILEGES } from '../customerAssets';

const CustomerRewardsTab = ({
  currentUser,
  customerProfile,
  pdCoins = 450,
  onGoToOrder,
  onGoToReserve,
  onApplyVoucher
}) => {
  // Scratch card / daily reward state
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [coinsBalance, setCoinsBalance] = useState(pdCoins);
  const [activeTab, setActiveTab] = useState('perks'); // 'perks' | 'vouchers' | 'passbook'
  const [redeemedCode, setRedeemedCode] = useState(null);

  // Interactive Earn Modals
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [inviteClaimed, setInviteClaimed] = useState(false);

  // Passbook history state
  const [passbookItems, setPassbookItems] = useState([
    {
      title: 'Mutton Biryani Order Cash Back',
      time: 'Yesterday, 8:45 PM · Order #PD-88214',
      amount: '+57 Coins'
    },
    {
      title: 'Welcome to Royalty Club Bonus',
      time: 'Persian Darbar Patron Sign-up',
      amount: '+100 Coins'
    },
    {
      title: 'Royal Table Dining at Camp Pune',
      time: '12 Oct 2026 · Dine-In Cashback',
      amount: '+45 Coins'
    }
  ]);

  // Real user display data without dummy email
  const patronName = currentUser?.displayName || customerProfile?.name || 'Valued Guest';
  const patronPhone = customerProfile?.phone || localStorage.getItem('customer_phone') || '';
  const patronEmail = customerProfile?.email || currentUser?.email || localStorage.getItem('customer_email');
  const patronInitial = (patronName?.[0] || 'A').toUpperCase();

  const handleClaimDailyCoins = () => {
    if (dailyClaimed) return;
    setDailyClaimed(true);
    setCoinsBalance((prev) => prev + 25);
    setPassbookItems((prev) => [
      {
        title: 'Daily Shahi Loyalty Check-In',
        time: 'Just now · Free Daily Bonus',
        amount: '+25 Coins'
      },
      ...prev
    ]);
  };

  const handleRedeemVoucher = (voucher) => {
    if (coinsBalance < voucher.requiredCoins) {
      alert(`You need ${voucher.requiredCoins} PD Coins to redeem this voucher. Place an order to earn more coins!`);
      return;
    }
    setCoinsBalance((prev) => prev - voucher.requiredCoins);
    setRedeemedCode(voucher.code);
    setPassbookItems((prev) => [
      {
        title: `Voucher Redeemed: ${voucher.title}`,
        time: 'Just now · Coupon Unlocked',
        amount: `-${voucher.requiredCoins} Coins`
      },
      ...prev
    ]);
    if (onApplyVoucher) onApplyVoucher(voucher.code);
  };

  const handleShareInvite = () => {
    const shareText = `Order royal Mughlai feasts on Persian Darbar with my exclusive invite code DARBAR-ROYAL-100 to get Flat ₹150 OFF & 100 PD Coins! https://persiandarbar.in?ref=ROYAL100`;
    if (navigator.share) {
      navigator.share({
        title: 'Persian Darbar Royalty Club',
        text: shareText,
        url: 'https://persiandarbar.in'
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
    }
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);

    if (!inviteClaimed) {
      setInviteClaimed(true);
      setCoinsBalance((prev) => prev + 100);
      setPassbookItems((prev) => [
        {
          title: 'Patron Referral Link Shared',
          time: 'Just now · Invite Bonus Credited',
          amount: '+100 Coins'
        },
        ...prev
      ]);
    }
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    setReviewSubmitted(true);
    setCoinsBalance((prev) => prev + 50);
    setPassbookItems((prev) => [
      {
        title: `Patron Review (${reviewRating} Stars)`,
        time: 'Just now · Review Feedback Reward',
        amount: '+50 Coins'
      },
      ...prev
    ]);
    setTimeout(() => {
      setIsReviewOpen(false);
      setReviewSubmitted(false);
      setReviewText('');
    }, 1500);
  };

  const renderPrivIcon = (name) => {
    switch (name) {
      case 'Coins':
        return <Coins className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'Bike':
        return <Bike className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-amber-600 shrink-0" />;
      case 'Gift':
        return <Gift className="w-5 h-5 text-rose-600 shrink-0" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />;
    }
  };

  return (
    <div className="flex-1 pb-32 pt-2 px-4 space-y-4">
      {/* ── 1. APPLE WALLET STYLE SOVEREIGN VIP PASS ── */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0B131B] via-[#141F2D] to-[#0A1017] border border-amber-400/35 shadow-[0_14px_44px_-10px_rgba(245,158,11,0.22)] p-6 text-white">
        {/* Subtle Gold Foil Radial Sheen & Crown Watermark */}
        <div className="absolute -top-16 -right-16 w-52 h-52 bg-gradient-to-bl from-amber-400/20 via-amber-300/10 to-transparent rounded-full pointer-events-none blur-2xl" />
        <Crown className="absolute -right-4 -bottom-6 w-40 h-40 text-amber-400/[0.06] pointer-events-none stroke-[1.2]" />

        {/* Top Header: App Brand + VIP Chip */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#E40000] to-[#B91C1C] text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-amber-400/60">
                {patronInitial}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-[#0B131B] flex items-center justify-center shadow-xs">
                <Crown className="w-2.5 h-2.5 text-neutral-950 fill-neutral-950" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <h2 className="text-base font-black tracking-tight text-white capitalize truncate leading-tight">
                  {patronName}
                </h2>
                <div className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[10px] font-black border border-amber-400/40" title="Royalty Member">
                  ★
                </div>
              </div>
              <p className="text-[11px] text-stone-300/80 font-medium truncate mt-0.5">
                +91 {patronPhone}{patronEmail ? ` · ${patronEmail}` : ' · Sovereign Patron'}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 flex flex-col items-end gap-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400/25 to-amber-300/15 text-amber-300 border border-amber-400/40 flex items-center gap-1.5 whitespace-nowrap shadow-xs backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-amber-300" />
              GOLD VIP
            </span>
            <span className="text-[8px] uppercase font-black tracking-widest text-amber-400/60 whitespace-nowrap">
              SOVEREIGN CLUB
            </span>
          </div>
        </div>

        {/* Coins Balance with Gold Glow */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-end justify-between relative z-10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/70 block">
              AVAILABLE ROYALTY BALANCE
            </span>
            <div className="flex items-baseline space-x-2.5 mt-1">
              <span className="text-4xl font-black text-amber-300 drop-shadow-[0_2px_12px_rgba(252,211,77,0.35)] tracking-tight">
                {coinsBalance.toLocaleString()}
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-stone-300">PD Coins</span>
            </div>
            <p className="text-[11px] text-stone-300 font-medium mt-1">
              Worth <strong className="text-amber-300 font-black">₹{coinsBalance}</strong> direct discount on your feast
            </p>
          </div>

          <button
            type="button"
            onClick={onGoToOrder}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-stone-950 text-xs font-black shadow-lg flex items-center space-x-1.5 active:scale-95 transition-all ios-press cursor-pointer border border-amber-200/60"
          >
            <span>Redeem Now</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Tier progress to Emperor Sovereign */}
        <div className="mt-5 pt-3.5 border-t border-white/10 relative z-10">
          <div className="flex justify-between text-[11px] text-stone-300/80 mb-1.5 font-semibold">
            <span>Tier Status: <strong className="text-amber-300 font-bold">Gold Patron</strong></span>
            <span className="text-amber-400 font-black">{Math.max(0, 750 - coinsBalance)} Coins to Emperor Elite</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(252,211,77,0.5)]"
              style={{ width: `${Math.min(100, (coinsBalance / 750) * 100)}%` }}
            />
          </div>
        </div>
      </section>

      {/* ── 2. DAILY ROYAL REWARD / CLAIM COINS (Apple Frosted Card) ── */}
      <section className="ios-card p-4 flex items-center justify-between border border-black/[0.06] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 border border-amber-400/30 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
            <Gift className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                Daily Check-in
              </span>
            </div>
            <h4 className="text-xs font-black text-neutral-900 mt-1">
              {dailyClaimed ? '25 Coins Added Today!' : 'Claim Free 25 PD Coins'}
            </h4>
            <p className="text-[10px] text-neutral-500 font-medium">
              {dailyClaimed ? 'Come back tomorrow for your next royal bonus' : 'Free daily loyalty reward for active patrons'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClaimDailyCoins}
          disabled={dailyClaimed}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all ios-press cursor-pointer shadow-xs ${
            dailyClaimed
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200/60'
              : 'bg-[#E40000] hover:bg-[#CC0000] text-white active:scale-95 shadow-[0_4px_14px_rgba(228,0,0,0.25)] border border-white/20'
          }`}
        >
          {dailyClaimed ? 'Claimed ✓' : 'Claim +25'}
        </button>
      </section>

      {/* ── 3. SEGMENTED VIEWS: Perks | Vouchers | Passbook (Apple iOS Segmented Control) ── */}
      <div className="bg-[#E5E5EA] p-1 rounded-2xl flex items-center justify-between gap-1 border border-black/[0.04]">
        {[
          { id: 'perks', label: 'VIP Privileges', icon: Crown },
          { id: 'vouchers', label: 'Redeem Vouchers', icon: Tag },
          { id: 'passbook', label: 'Coins Passbook', icon: Clock }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all ios-press flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer select-none ${
                isActive
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: VIP PRIVILEGES & TIERS ── */}
      {activeTab === 'perks' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500">
              YOUR ACTIVE VIP PERKS
            </h3>
            <div className="space-y-2.5">
              {ROYAL_MEMBERSHIP_PRIVILEGES.map((priv, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#FAF8F5] border border-amber-900/5 flex items-start space-x-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-amber-200/60 flex items-center justify-center shrink-0 shadow-xs">
                    {renderPrivIcon(priv.icon)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">{priv.title}</h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{priv.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tier Roadmap */}
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500">
              ROYALTY CLUB TIERS
            </h3>
            <div className="space-y-2">
              {REWARD_TIERS.map((tier) => {
                const isCurrent = tier.id === 'gold';
                return (
                  <div
                    key={tier.id}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      isCurrent
                        ? 'border-red-200 bg-red-50/40 shadow-xs'
                        : 'border-neutral-100 bg-neutral-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-neutral-900">{tier.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#E40000] text-white">
                            Current Tier
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">{tier.perk}</p>
                    </div>
                    <span className="text-xs font-bold text-neutral-600 font-mono">
                      {tier.minCoins}-{tier.maxCoins} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: REDEEM VOUCHERS ── */}
      {activeTab === 'vouchers' && (
        <div className="space-y-3">
          {redeemedCode && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between">
              <span>Code <strong>{redeemedCode}</strong> copied & ready to apply at checkout!</span>
              <button
                onClick={onGoToOrder}
                className="underline text-emerald-950 font-black ml-2"
              >
                Order Now
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {REWARD_VOUCHERS.map((vouch) => {
              const canRedeem = coinsBalance >= vouch.requiredCoins;
              return (
                <div
                  key={vouch.id}
                  className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs flex items-center justify-between space-x-3"
                >
                  <div>
                    <span className="text-[9px] font-black uppercase text-[#E40000] bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                      {vouch.category}
                    </span>
                    <h4 className="text-xs font-black text-neutral-900 mt-1">
                      {vouch.title}
                    </h4>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      {vouch.validity} · Code: <span className="font-mono font-bold text-neutral-800">{vouch.code}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleRedeemVoucher(vouch)}
                    disabled={!canRedeem}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                      canRedeem
                        ? 'bg-[#E40000] hover:bg-[#CC0000] text-white active:scale-95 shadow-sm cursor-pointer'
                        : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    {vouch.requiredCoins} Coins
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: COINS PASSBOOK / RECENT ACTIVITY ── */}
      {activeTab === 'passbook' && (
        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500">
            RECENT COIN TRANSACTIONS
          </h3>

          <div className="space-y-2.5 text-xs">
            {passbookItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center space-x-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${item.amount.startsWith('-') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {item.amount.startsWith('-') ? '-' : '+'}
                  </span>
                  <div>
                    <h5 className="font-bold text-neutral-900">{item.title}</h5>
                    <p className="text-[10px] text-neutral-500">{item.time}</p>
                  </div>
                </div>
                <span className={`font-black ${item.amount.startsWith('-') ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {item.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. ALL 4 FUNCTIONAL WAYS TO EARN MORE COINS (Interactive - No emojis) ── */}
      <section className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 flex items-center space-x-1.5">
          <Coins className="w-4 h-4 text-[#E40000]" />
          <span>Ways to Earn Royalty Coins</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          {/* Card 1: 10% on Delivery */}
          <div
            onClick={onGoToOrder}
            className="p-3.5 rounded-2xl bg-white border border-neutral-200/80 hover:border-red-300 hover:shadow-xs cursor-pointer active:scale-98 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E40000] flex items-center justify-center mb-2 border border-red-100">
                <Bike className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-neutral-900">10% On Delivery</h5>
              <p className="text-[10px] text-neutral-500 mt-0.5">Instant cashback on orders</p>
            </div>
            <span className="text-[10px] font-black text-[#E40000] mt-2 flex items-center gap-0.5">
              <span>Order Now</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          {/* Card 2: 10% on Dine-In */}
          <div
            onClick={onGoToReserve}
            className="p-3.5 rounded-2xl bg-white border border-neutral-200/80 hover:border-red-300 hover:shadow-xs cursor-pointer active:scale-98 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E40000] flex items-center justify-center mb-2 border border-red-100">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-neutral-900">10% On Dine-In</h5>
              <p className="text-[10px] text-neutral-500 mt-0.5">Pay bill at all 4 branches</p>
            </div>
            <span className="text-[10px] font-black text-[#E40000] mt-2 flex items-center gap-0.5">
              <span>Book Table</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          {/* Card 3: 100 Coins / Invite */}
          <div
            onClick={() => setIsInviteOpen(true)}
            className="p-3.5 rounded-2xl bg-white border border-neutral-200/80 hover:border-red-300 hover:shadow-xs cursor-pointer active:scale-98 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E40000] flex items-center justify-center mb-2 border border-red-100">
                <Users className="w-4 h-4" />
              </div>
              <h5 className="font-bold text-neutral-900">100 Coins / Invite</h5>
              <p className="text-[10px] text-neutral-500 mt-0.5">When friend signs up</p>
            </div>
            <span className="text-[10px] font-black text-[#E40000] mt-2 flex items-center gap-0.5">
              <span>Invite Friends</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          {/* Card 4: 50 Coins / Review */}
          <div
            onClick={() => setIsReviewOpen(true)}
            className="p-3.5 rounded-2xl bg-white border border-neutral-200/80 hover:border-red-300 hover:shadow-xs cursor-pointer active:scale-98 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E40000] flex items-center justify-center mb-2 border border-red-100">
                <Star className="w-4 h-4 fill-[#E40000] text-[#E40000]" />
              </div>
              <h5 className="font-bold text-neutral-900">50 Coins / Review</h5>
              <p className="text-[10px] text-neutral-500 mt-0.5">Share dining experience</p>
            </div>
            <span className="text-[10px] font-black text-[#E40000] mt-2 flex items-center gap-0.5">
              <span>Rate Now</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </section>

      {/* ── 5. WHATSAPP CONCIERGE BUTTON (No emojis) ── */}
      <a
        href="https://wa.me/917028033763?text=Hello%20Persian%20Darbar,%20I%20am%20a%20Royalty%20Member%20and%20would%20like%20assistance."
        target="_blank"
        rel="noreferrer"
        className="w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-black text-xs flex items-center justify-center space-x-2 shadow-md active:scale-98 transition-all"
      >
        <MessageCircle className="w-4 h-4 text-white" />
        <span>Contact Royal Concierge on WhatsApp</span>
      </a>

      {/* ── INVITE MODAL ── */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E40000] flex items-center justify-center border border-red-100">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-neutral-900">Invite & Earn 100 Coins</h3>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Share your royal referral link with your family and friends. When they place their first order, they get ₹150 OFF and you instantly receive 100 PD Coins!
            </p>

            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
              <span className="font-mono font-black text-neutral-800 text-sm">DARBAR-ROYAL-100</span>
              <button
                onClick={handleShareInvite}
                className="px-3 py-1.5 rounded-xl bg-[#E40000] text-white text-xs font-bold flex items-center gap-1 active:scale-95"
              >
                {copiedInvite ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleShareInvite}
              className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm active:scale-98"
            >
              <Share2 className="w-4 h-4" />
              <span>Share via WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* ── REVIEW MODAL ── */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#E40000] flex items-center justify-center border border-red-100">
                  <Star className="w-4 h-4 fill-[#E40000] text-[#E40000]" />
                </div>
                <h3 className="font-black text-sm text-neutral-900">Review & Earn 50 Coins</h3>
              </div>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reviewSubmitted ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-black text-sm text-neutral-900">Thank You, Patron!</h4>
                <p className="text-xs text-neutral-500">50 PD Coins have been credited to your royalty balance.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3">
                <p className="text-xs text-neutral-600">
                  Rate your latest Persian Darbar dining or delivery experience:
                </p>

                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer transition-transform active:scale-125"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating
                            ? 'fill-[#E40000] text-[#E40000]'
                            : 'text-neutral-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share what you loved about our Biryani, Barra Chop, or hospitality..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-2xl border border-neutral-200 focus:outline-none focus:border-[#E40000] resize-none"
                />

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-[#E40000] hover:bg-[#CC0000] text-white text-xs font-black shadow-md active:scale-98"
                >
                  Submit & Claim +50 Coins
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerRewardsTab;
