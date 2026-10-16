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
  Tag
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

  // Real user display data without dummy email
  const patronName = customerProfile?.name || currentUser?.displayName || 'Aman Talukdar';
  const patronPhone = customerProfile?.phone || localStorage.getItem('customer_phone') || '7028033763';
  const patronEmail = customerProfile?.email || currentUser?.email || localStorage.getItem('customer_email');
  const patronInitial = (patronName?.[0] || 'A').toUpperCase();

  const handleClaimDailyCoins = () => {
    if (dailyClaimed) return;
    setDailyClaimed(true);
    setCoinsBalance((prev) => prev + 25);
  };

  const handleRedeemVoucher = (voucher) => {
    if (coinsBalance < voucher.requiredCoins) {
      alert(`You need ${voucher.requiredCoins} PD Coins to redeem this voucher. Place an order to earn more coins!`);
      return;
    }
    setCoinsBalance((prev) => prev - voucher.requiredCoins);
    setRedeemedCode(voucher.code);
    if (onApplyVoucher) onApplyVoucher(voucher.code);
  };

  return (
    <div className="flex-1 pb-32 pt-2 px-4 space-y-4">
      {/* ── 1. ZOMATO GOLD STYLE OBSIDIAN & GOLD METALLIC VIP PASS ── */}
      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#1C1917] via-[#26221F] to-[#0A0908] text-white p-6 shadow-2xl border border-amber-400/40">
        {/* Ambient Gold Radial Glows */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 text-neutral-950 flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white/40">
                {patronInitial}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-[#1C1917] flex items-center justify-center shadow-xs">
                <Crown className="w-3 h-3 text-neutral-950 fill-neutral-950" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight text-white">{patronName}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  GOLD VIP
                </span>
              </div>
              <p className="text-xs text-stone-300 font-medium mt-0.5">
                +91 {patronPhone} {patronEmail ? `· ${patronEmail}` : '· Verified Patron'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9px] uppercase font-bold tracking-widest text-amber-400/80 block">
              PERSIAN DARBAR
            </span>
            <span className="text-xs font-mono font-bold text-amber-300">ROYALTY CLUB</span>
          </div>
        </div>

        {/* Coins Counter Banner */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-end justify-between relative z-10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-200/90 block">
              Available Royalty Balance
            </span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400">
                {coinsBalance.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-amber-100">PD Coins</span>
            </div>
            <p className="text-[11px] text-stone-300 font-medium mt-1">
              Worth <strong className="text-amber-300 font-black">₹{coinsBalance}</strong> direct discount on your next order
            </p>
          </div>

          <button
            onClick={onGoToOrder}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-black shadow-lg flex items-center space-x-1 active:scale-95 transition-transform"
          >
            <span>Redeem</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tier Progress */}
        <div className="mt-4 pt-3 border-t border-white/10 relative z-10">
          <div className="flex justify-between text-[11px] text-stone-300 mb-1.5 font-semibold">
            <span>Current: <strong>Gold Patron</strong></span>
            <span className="text-amber-300 font-bold">{Math.max(0, 750 - coinsBalance)} Coins to Emperor Tier</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-rose-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (coinsBalance / 750) * 100)}%` }}
            />
          </div>
        </div>
      </section>

      {/* ── 2. DAILY ROYAL REWARD / CLAIM COINS ── */}
      <section className="bg-gradient-to-r from-amber-50 via-[#FFF9ED] to-rose-50 border border-amber-300/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/30 border border-amber-500/40 text-2xl flex items-center justify-center shrink-0 shadow-sm">
            🎁
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full">
              Daily Shahi Surprise
            </span>
            <h4 className="text-xs font-black text-neutral-900 mt-1">
              {dailyClaimed ? '25 Coins Added Today!' : 'Claim 25 Free PD Coins'}
            </h4>
            <p className="text-[10px] text-neutral-600">
              {dailyClaimed ? 'Come back tomorrow for your next royal bonus' : 'Free daily loyalty reward for active patrons'}
            </p>
          </div>
        </div>

        <button
          onClick={handleClaimDailyCoins}
          disabled={dailyClaimed}
          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
            dailyClaimed
              ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
              : 'bg-neutral-900 text-amber-300 hover:bg-neutral-800 shadow-md active:scale-95'
          }`}
        >
          {dailyClaimed ? 'Claimed ✓' : 'Claim +25'}
        </button>
      </section>

      {/* ── 3. SEGMENTED VIEWS: Perks | Vouchers | Passbook ── */}
      <div className="bg-white p-1 rounded-2xl border border-neutral-200/80 shadow-xs flex space-x-1">
        {[
          { id: 'perks', label: '👑 VIP Privileges' },
          { id: 'vouchers', label: '🏷️ Redeem Vouchers' },
          { id: 'passbook', label: '📜 Coins Passbook' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all text-center whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
              }`}
            >
              {tab.label}
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
                  <span className="text-xl leading-none">{priv.icon}</span>
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
                        ? 'border-amber-400/80 bg-amber-50/40 shadow-xs'
                        : 'border-neutral-100 bg-neutral-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-neutral-900">{tier.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950">
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

          <div className="grid grid-cols-1 gap-2.5">
            {REWARD_VOUCHERS.map((vouch) => {
              const canRedeem = coinsBalance >= vouch.requiredCoins;
              return (
                <div
                  key={vouch.id}
                  className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs flex items-center justify-between space-x-3"
                >
                  <div>
                    <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
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
                        ? 'bg-amber-400 hover:bg-amber-500 text-neutral-950 active:scale-95 shadow-sm'
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
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  +
                </span>
                <div>
                  <h5 className="font-bold text-neutral-900">Mutton Biryani Order Cash Back</h5>
                  <p className="text-[10px] text-neutral-500">Yesterday, 8:45 PM · Order #PD-88214</p>
                </div>
              </div>
              <span className="font-black text-emerald-600">+57 Coins</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  +
                </span>
                <div>
                  <h5 className="font-bold text-neutral-900">Welcome to Royalty Club Bonus</h5>
                  <p className="text-[10px] text-neutral-500">Persian Darbar Patron Sign-up</p>
                </div>
              </div>
              <span className="font-black text-emerald-600">+100 Coins</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  +
                </span>
                <div>
                  <h5 className="font-bold text-neutral-900">Royal Table Dining at Camp</h5>
                  <p className="text-[10px] text-neutral-500">12 Oct 2026 · Dine-In Cashback</p>
                </div>
              </div>
              <span className="font-black text-emerald-600">+45 Coins</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. HOW TO EARN MORE COINS ── */}
      <section className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 flex items-center space-x-1.5">
          <Coins className="w-4 h-4 text-amber-500" />
          <span>Ways to Earn Royalty Coins</span>
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <span className="text-lg">🛵</span>
            <h5 className="font-bold text-neutral-900 mt-1">10% On Delivery</h5>
            <p className="text-[10px] text-neutral-500">Every bite earns coins back</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <span className="text-lg">🍽️</span>
            <h5 className="font-bold text-neutral-900 mt-1">10% On Dine-In</h5>
            <p className="text-[10px] text-neutral-500">Pay bill at all 4 branches</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <span className="text-lg">👥</span>
            <h5 className="font-bold text-neutral-900 mt-1">100 Coins / Invite</h5>
            <p className="text-[10px] text-neutral-500">When friend orders biryani</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
            <span className="text-lg">⭐</span>
            <h5 className="font-bold text-neutral-900 mt-1">50 Coins / Review</h5>
            <p className="text-[10px] text-neutral-500">Share your dining story</p>
          </div>
        </div>
      </section>

      {/* ── 5. WHATSAPP CONCIERGE BUTTON ── */}
      <a
        href="https://wa.me/917028033763?text=Hello%20Persian%20Darbar,%20I%20am%20a%20Royalty%20Member%20and%20would%20like%20assistance."
        target="_blank"
        rel="noreferrer"
        className="w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-black text-xs flex items-center justify-center space-x-2 shadow-md active:scale-98 transition-all"
      >
        <span>💬</span>
        <span>Contact Royal Concierge on WhatsApp</span>
      </a>
    </div>
  );
};

export default CustomerRewardsTab;
