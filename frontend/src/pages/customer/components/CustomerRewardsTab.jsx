import React, { useState } from 'react';
import {
  Crown, Sparkles, Gift, Coins, ChevronRight, CheckCircle2, Share2, Star,
  MessageCircle, Bike, UtensilsCrossed, Users, X, Check, ReceiptText
} from 'lucide-react';
import { REWARD_TIERS, ROYAL_MEMBERSHIP_PRIVILEGES } from '../customerAssets';
import { cx, EmptyState } from '../ui';
import API_BASE from '../../../lib/config';

// Real PD Coins transactions from the server profile (coins_history), newest first.
// Coins are only credited/debited by the server (welcome bonus, 5% order cashback, checkout redemption).
const buildPassbook = (history) => {
  if (!Array.isArray(history)) return [];
  return history
    .map((entry) => {
      const coins = Number(entry?.coins ?? entry?.amount ?? 0);
      if (!coins) return null;
      const isDebit = entry?.type === 'redeemed' || entry?.type === 'expired';
      const ts = entry?.timestamp ? new Date(entry.timestamp) : null;
      const valid = ts && !Number.isNaN(ts.getTime());
      return {
        title: entry?.note || entry?.reason || (isDebit ? 'Coins used' : 'Coins earned'),
        time: valid ? ts.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '',
        sortKey: valid ? ts.getTime() : 0,
        amount: `${isDebit ? '-' : '+'}${Math.abs(coins)} Coins`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.sortKey - a.sortKey);
};

const PRIV_ICONS = { Coins, Bike, Crown, Gift };

/* Simple centered dialog used for invite / review */
const Dialog = ({ title, icon: Icon, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
    <button type="button" aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
    <div
      role="dialog"
      aria-modal="true"
      className="relative w-full max-w-md bg-white rounded-t-[24px] sm:rounded-[24px] px-5 pt-5 animate-in slide-in-from-bottom duration-300 ease-pd-out"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[19px] font-bold text-pd-ink">
          {Icon && <Icon className="w-5 h-5 text-pd-gold" strokeWidth={2} />}
          {title}
        </h3>
        <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-pd-surface flex items-center justify-center pd-press">
          <X className="w-[18px] h-[18px] text-pd-ink-2" />
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  </div>
);

const CustomerRewardsTab = ({
  currentUser,
  customerProfile,
  pdCoins = 0,
  onGoToOrder,
  onGoToReserve
}) => {
  // Balance always comes from the server profile - never changed locally
  const coinsBalance = Number(pdCoins) || 0;
  const [activeTab, setActiveTab] = useState('perks'); // 'perks' | 'passbook'

  // Invite / review dialogs (no coins are awarded for these)
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  const passbookItems = buildPassbook(customerProfile?.coins_history);

  const patronName = currentUser?.displayName || customerProfile?.name || 'Guest';

  // Tier from the actual balance
  const currentTier =
    REWARD_TIERS.find((t) => coinsBalance >= t.minCoins && coinsBalance <= t.maxCoins) ||
    REWARD_TIERS[REWARD_TIERS.length - 1];
  const tierIdx = REWARD_TIERS.indexOf(currentTier);
  const nextTier = REWARD_TIERS[tierIdx + 1];
  const tierProgress = nextTier
    ? Math.min(100, ((coinsBalance - currentTier.minCoins) / (nextTier.minCoins - currentTier.minCoins)) * 100)
    : 100;

  const handleShareInvite = () => {
    const shareText = 'Order royal Mughlai feasts from Persian Darbar - biryani, kebabs and more delivered to your door. https://persiandarbar.in';
    if (navigator.share) {
      navigator.share({ title: 'Persian Darbar', text: shareText, url: 'https://persiandarbar.in' }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  // Submits a real review to the backend (published after admin approval). No coins are credited.
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError(null);
    const text = reviewText.trim();
    if (text.length < 10) {
      setReviewError('Please write at least 10 characters.');
      return;
    }
    setReviewSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: patronName,
          text,
          rating: reviewRating,
          customer_uid: currentUser?.uid || customerProfile?.uid || ''
        })
      });
      if (!res.ok) {
        let detail = '';
        try { detail = (await res.json())?.detail || ''; } catch (err) { /* ignore */ }
        throw new Error(typeof detail === 'string' && detail ? detail : 'Could not submit your review. Please try again.');
      }
      setReviewSubmitted(true);
      setTimeout(() => {
        setIsReviewOpen(false);
        setReviewSubmitted(false);
        setReviewText('');
      }, 1800);
    } catch (err) {
      setReviewError(err?.message || 'Could not submit your review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const earnWays = [
    { icon: Bike, title: '5% back on delivery', desc: 'Coins on every order', cta: 'Order', onClick: onGoToOrder },
    { icon: UtensilsCrossed, title: '5% back on dine-in', desc: 'Pay your bill at any outlet', cta: 'Book', onClick: onGoToReserve },
    { icon: Users, title: 'Invite friends', desc: 'Share Persian Darbar', cta: 'Share', onClick: () => setIsInviteOpen(true) },
    { icon: Star, title: 'Rate us', desc: 'Tell us about your meal', cta: 'Rate', onClick: () => setIsReviewOpen(true) },
  ];

  return (
    <div className="flex-1 w-full max-w-full overflow-x-clip pb-44 bg-white min-h-screen">
      {/* ── Membership card ── */}
      <section className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-[22px] bg-pd-teal text-white p-5 shadow-pd-2">
          <div className="absolute -top-24 -right-20 w-64 h-64 rounded-full bg-[#E9C67A]/15" />
          <Crown className="absolute right-4 bottom-4 w-24 h-24 text-white/[0.05]" strokeWidth={1.25} />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#E9C67A]">Royalty Club</p>
              <p className="mt-1 text-[17px] font-semibold capitalize truncate">{patronName}</p>
            </div>
            <span className="h-7 px-2.5 rounded-full bg-white/10 text-[12px] font-semibold flex items-center gap-1 shrink-0">
              <Crown className="w-3.5 h-3.5 text-[#E9C67A]" />
              {currentTier.name}
            </span>
          </div>

          <div className="relative mt-6 flex items-end justify-between gap-3">
            <div>
              <p className="text-[13px] text-white/70">PD Coins balance</p>
              <p className="mt-0.5 text-[40px] leading-none font-bold tracking-[-0.02em] pd-tabular">{coinsBalance.toLocaleString('en-IN')}</p>
              <p className="mt-1.5 text-[13px] text-white/70 pd-tabular">Worth ₹{coinsBalance.toLocaleString('en-IN')} off</p>
            </div>
            <button
              type="button"
              onClick={onGoToOrder}
              className="h-10 px-4 rounded-full bg-[#E9C67A] text-pd-ink text-[14px] font-semibold flex items-center gap-1 pd-press shrink-0"
            >
              Use coins
              <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="relative mt-5">
            <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full rounded-full bg-[#E9C67A] transition-[width] duration-700 ease-pd-out" style={{ width: `${tierProgress}%` }} />
            </div>
            <p className="mt-2 text-[12px] text-white/70 pd-tabular">
              {nextTier
                ? `${Math.max(0, nextTier.minCoins - coinsBalance)} coins to ${nextTier.name}`
                : 'You are at the top tier'}
            </p>
          </div>
        </div>
      </section>

      {/* ── How coins work (real rules, applied by the server) ── */}
      <section className="px-4 pt-4">
        <div className="flex items-center gap-3 rounded-[16px] border border-[color:var(--pd-line)] p-4">
          <span className="w-11 h-11 rounded-full bg-pd-gold-tint flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 text-pd-gold" strokeWidth={1.75} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-pd-ink">5% back as PD Coins on every order</p>
            <p className="text-[13px] text-pd-ink-2">50 coins welcome bonus · 1 coin = ₹1 · use up to 50% of your bill · valid 45 days</p>
          </div>
        </div>
      </section>

      {/* ── Segmented control ── */}
      <div className="px-4 pt-6">
        <div className="flex bg-pd-surface p-1 rounded-[12px]" role="tablist">
          {[
            { id: 'perks', label: 'Perks' },
            { id: 'passbook', label: 'Activity' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cx(
                  'flex-1 h-9 rounded-[9px] text-[14px] font-semibold transition-colors',
                  isActive ? 'bg-white text-pd-ink shadow-pd-1' : 'text-pd-ink-2'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Perks ── */}
      {activeTab === 'perks' && (
        <section className="px-4 pt-4 space-y-4">
          <ul className="rounded-[16px] border border-[color:var(--pd-line)] divide-y divide-[color:var(--pd-line)]">
            {ROYAL_MEMBERSHIP_PRIVILEGES.map((priv, idx) => {
              const Icon = PRIV_ICONS[priv.icon] || Sparkles;
              return (
                <li key={idx} className="flex items-start gap-3 p-4">
                  <span className="w-10 h-10 rounded-full bg-pd-surface flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-pd-ink" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-pd-ink">{priv.title}</p>
                    <p className="text-[13px] text-pd-ink-2 mt-0.5">{priv.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div>
            <h3 className="text-[17px] font-semibold text-pd-ink">Tiers</h3>
            <ul className="mt-2 rounded-[16px] border border-[color:var(--pd-line)] divide-y divide-[color:var(--pd-line)]">
              {REWARD_TIERS.map((tier) => {
                const isCurrent = tier.id === currentTier.id;
                return (
                  <li key={tier.id} className="flex items-center gap-3 p-4">
                    <Crown className={cx('w-5 h-5 shrink-0', isCurrent ? 'text-pd-gold' : 'text-pd-ink-3')} strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-pd-ink flex items-center gap-2">
                        {tier.name}
                        {isCurrent && <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-pd-gold">Current</span>}
                      </p>
                      <p className="text-[13px] text-pd-ink-2">{tier.perk}</p>
                    </div>
                    <span className="text-[12px] text-pd-ink-3 pd-tabular shrink-0">{tier.minCoins}–{tier.maxCoins}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ── Activity ── */}
      {activeTab === 'passbook' && (
        <section className="px-4 pt-4">
          {passbookItems.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No coin activity yet"
              message="Coins you earn and spend will show up here."
              actionLabel="Order now"
              onAction={onGoToOrder}
              className="py-10"
            />
          ) : (
            <ul className="rounded-[16px] border border-[color:var(--pd-line)] divide-y divide-[color:var(--pd-line)]">
              {passbookItems.map((item, idx) => {
                const spent = item.amount.startsWith('-');
                return (
                  <li key={idx} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-pd-ink truncate">{item.title}</p>
                      <p className="text-[12px] text-pd-ink-3">{item.time}</p>
                    </div>
                    <span className={cx('text-[15px] font-semibold pd-tabular shrink-0', spent ? 'text-pd-ink' : 'text-pd-success')}>
                      {item.amount}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* ── Ways to earn ── */}
      <section className="px-4 pt-8">
        <h3 className="text-[19px] font-bold text-pd-ink tracking-[-0.01em]">Ways to earn</h3>
        <ul className="mt-3 rounded-[16px] border border-[color:var(--pd-line)] divide-y divide-[color:var(--pd-line)]">
          {earnWays.map(({ icon: Icon, title, desc, cta, onClick }) => (
            <li key={title}>
              <button type="button" onClick={onClick} className="w-full flex items-center gap-3 p-4 text-left pd-press">
                <span className="w-10 h-10 rounded-full bg-pd-surface flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-pd-ink" strokeWidth={1.75} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-pd-ink">{title}</span>
                  <span className="block text-[13px] text-pd-ink-2">{desc}</span>
                </span>
                <span className="flex items-center text-[14px] font-semibold text-pd-action shrink-0">
                  {cta}
                  <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Concierge ── */}
      <section className="px-4 pt-4">
        <a
          href="https://wa.me/917028033763?text=Hello%20Persian%20Darbar,%20I%20am%20a%20Royalty%20Member%20and%20would%20like%20assistance."
          target="_blank"
          rel="noreferrer"
          className="w-full h-12 rounded-[14px] border border-[color:var(--pd-line)] text-pd-ink text-[15px] font-semibold flex items-center justify-center gap-2 pd-press"
        >
          <MessageCircle className="w-5 h-5 text-[#25D366]" strokeWidth={2} />
          Chat with us on WhatsApp
        </a>
      </section>

      {/* ── Invite ── */}
      {isInviteOpen && (
        <Dialog title="Invite friends" icon={Users} onClose={() => setIsInviteOpen(false)}>
          <p className="text-[15px] leading-[22px] text-pd-ink-2">
            Love our biryani? Share Persian Darbar with your family and friends.
          </p>
          <button
            type="button"
            onClick={handleShareInvite}
            className="mt-4 w-full h-12 rounded-[14px] bg-pd-ink text-white text-[16px] font-semibold flex items-center justify-center gap-2 pd-press"
          >
            {copiedInvite ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
            {copiedInvite ? 'Shared' : 'Share Persian Darbar'}
          </button>
        </Dialog>
      )}

      {/* ── Review ── */}
      {isReviewOpen && (
        <Dialog title="Rate your meal" icon={Star} onClose={() => setIsReviewOpen(false)}>
          {reviewSubmitted ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-pd-success mx-auto" strokeWidth={1.75} />
              <p className="mt-3 text-[17px] font-semibold text-pd-ink">Thank you!</p>
              <p className="mt-1 text-[14px] text-pd-ink-2">Your review will appear after approval.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview}>
              <div className="flex items-center justify-center gap-1 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    onClick={() => setReviewRating(star)}
                    className="p-1.5 pd-press"
                  >
                    <Star className={cx('w-9 h-9', star <= reviewRating ? 'fill-pd-gold text-pd-gold' : 'text-black/15')} strokeWidth={1.5} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you like?"
                rows={3}
                className="mt-3 w-full text-[16px] p-3.5 rounded-[12px] bg-pd-surface text-pd-ink placeholder:text-pd-ink-3 focus:outline-none focus:ring-2 focus:ring-pd-action/30 resize-none"
              />
              {reviewError && <p className="mt-2 text-[13px] font-medium text-pd-error">{reviewError}</p>}
              <button type="submit" disabled={reviewSubmitting} className="mt-4 w-full h-12 rounded-[14px] bg-pd-action text-white text-[16px] font-semibold pd-press disabled:opacity-60">
                {reviewSubmitting ? 'Submitting…' : 'Submit review'}
              </button>
            </form>
          )}
        </Dialog>
      )}
    </div>
  );
};

export default CustomerRewardsTab;
