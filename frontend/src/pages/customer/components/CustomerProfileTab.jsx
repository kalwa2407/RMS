import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, MapPin, Crown, ShoppingBag, Calendar, LogOut, Check, ChevronRight, ChevronLeft,
  Sparkles, X, MessageCircle, Plus, Trash2, Pencil, Coins, Store, Bike, Gift
} from 'lucide-react';
import { ROYAL_MEMBERSHIP_PRIVILEGES, PERSIAN_DARBAR_BRANCHES } from '../customerAssets';
import { cx, EmptyState, formatINR } from '../ui';

const PRIV_ICONS = { Coins, Bike, Crown, Gift };

const STATUS_STYLE = {
  placed: ['Placed', 'bg-pd-surface text-pd-ink'],
  accepted: ['Accepted', 'bg-[#FFF5E5] text-pd-warn'],
  preparing: ['Preparing', 'bg-[#FFF5E5] text-pd-warn'],
  ready: ['Ready', 'bg-[#EAF2FD] text-[#1A5FB4]'],
  out_for_delivery: ['On the way', 'bg-[#EAF2FD] text-[#1A5FB4]'],
  delivered: ['Delivered', 'bg-[#EAF6EE] text-pd-success'],
  cancelled: ['Cancelled', 'bg-[#FDECEC] text-pd-error'],
  rejected: ['Cancelled', 'bg-[#FDECEC] text-pd-error'],
};

/* Grouped list (iOS settings style) */
const Group = ({ title, children, className = '' }) => (
  <section className={cx('px-4 pt-6', className)}>
    {title && <h3 className="px-1 mb-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-pd-ink-3">{title}</h3>}
    <div className="rounded-[16px] border border-[color:var(--pd-line)] divide-y divide-[color:var(--pd-line)] overflow-hidden">
      {children}
    </div>
  </section>
);

const Row = ({ icon: Icon, label, detail, onClick, href, danger = false, id, trailing, external }) => {
  const inner = (
    <>
      {Icon && (
        <span className={cx('w-9 h-9 rounded-full flex items-center justify-center shrink-0', danger ? 'bg-[#FDECEC]' : 'bg-pd-surface')}>
          <Icon className={cx('w-[18px] h-[18px]', danger ? 'text-pd-error' : 'text-pd-ink')} strokeWidth={1.75} />
        </span>
      )}
      <span className={cx('flex-1 min-w-0 text-[16px]', danger ? 'text-pd-error font-medium' : 'text-pd-ink')}>{label}</span>
      {detail != null && <span className="text-[15px] text-pd-ink-3 pd-tabular shrink-0">{detail}</span>}
      {trailing !== undefined ? trailing : !danger && <ChevronRight className="w-5 h-5 text-pd-ink-3 shrink-0" />}
    </>
  );
  const cls = 'w-full min-h-[56px] flex items-center gap-3 px-4 py-2 text-left pd-press bg-white';
  if (href) {
    return <a href={href} id={id} className={cls} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>{inner}</a>;
  }
  return <button type="button" id={id} onClick={onClick} className={cls}>{inner}</button>;
};

/* Bottom sheet dialog */
const Sheet = ({ title, onClose, children, center = false }) => (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
    <button type="button" aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
    <div
      role="dialog"
      aria-modal="true"
      className={cx('relative w-full max-w-md bg-white rounded-t-[24px] sm:rounded-[24px] px-5 pt-5 animate-in slide-in-from-bottom duration-300 ease-pd-out', center && 'text-center')}
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
    >
      {title && (
        <div className={cx('flex items-center', center ? 'justify-center' : 'justify-between')}>
          <h3 className="text-[20px] font-bold text-pd-ink">{title}</h3>
          {!center && (
            <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-pd-surface flex items-center justify-center pd-press">
              <X className="w-[18px] h-[18px] text-pd-ink-2" />
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  </div>
);

const fieldCls = 'w-full bg-pd-surface rounded-[12px] px-3.5 text-[16px] text-pd-ink placeholder:text-pd-ink-3 focus:outline-none focus:ring-2 focus:ring-pd-action/30';

const CustomerProfileTab = ({
  currentUser,
  customerProfile,
  orders = [],
  reservations = [],
  onReorder,
  onTrackOrder,
  onSavePhone,
  onSaveAddress,
  onSignOut,
  onDeleteAccount,
  onGoToOrder,
  onGoToReserve,
  pdCoins = 100,
  initialSection = 'overview'
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const navigate = useNavigate();
  const [section, setSection] = useState(initialSection); // 'overview' | 'orders' | 'reservations' | 'addresses' | 'rewards'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [nameVal, setNameVal] = useState(currentUser?.displayName || customerProfile?.name || localStorage.getItem('customer_name') || '');
  const [phoneVal, setPhoneVal] = useState(customerProfile?.phone || currentUser?.phoneNumber || localStorage.getItem('customer_phone') || '');
  const [addressVal, setAddressVal] = useState(customerProfile?.address || localStorage.getItem('customer_address') || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentUser?.displayName || customerProfile?.name) {
      setNameVal(currentUser?.displayName || customerProfile?.name || '');
    }
    if (customerProfile?.phone || currentUser?.phoneNumber) {
      setPhoneVal(customerProfile?.phone || currentUser?.phoneNumber || '');
    }
    if (customerProfile?.address) {
      setAddressVal(customerProfile.address);
    }
  }, [currentUser, customerProfile]);

  // Address book management
  const [savedAddresses, setSavedAddresses] = useState(() => {
    if (customerProfile?.addresses && customerProfile.addresses.length > 0) {
      return customerProfile.addresses;
    }
    const curr = customerProfile?.address || localStorage.getItem('customer_address');
    if (curr) {
      return [{ id: 'addr_1', tag: 'Home', address: curr, isDefault: true }];
    }
    return [];
  });
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [newAddressTag, setNewAddressTag] = useState('Home');
  const [newAddressText, setNewAddressText] = useState('');

  const isLoggedIn = !!currentUser || !!customerProfile?.phone || !!localStorage.getItem('customer_phone') || !!localStorage.getItem('customer_jwt');
  const patronName = nameVal || (isLoggedIn ? 'Persian Darbar member' : 'Guest');
  const patronPhone = phoneVal;
  const patronEmail = customerProfile?.email || currentUser?.email || localStorage.getItem('customer_email') || '';
  const patronInitial = (patronName?.[0] || 'P').toUpperCase();

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (onSavePhone) await onSavePhone(phoneVal);
    if (onSaveAddress) await onSaveAddress(addressVal);
    localStorage.setItem('customer_phone', phoneVal);
    localStorage.setItem('customer_address', addressVal);
    localStorage.setItem('customer_name', nameVal);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsEditModalOpen(false);
    }, 1200);
  };

  const handleAddNewAddress = (e) => {
    e.preventDefault();
    if (!newAddressText.trim()) return;
    const newAddr = {
      id: `addr_${Date.now()}`,
      tag: newAddressTag,
      address: newAddressText.trim(),
      isDefault: savedAddresses.length === 0
    };
    setSavedAddresses(prev => [...prev, newAddr]);
    if (onSaveAddress) onSaveAddress(newAddressText.trim());
    setNewAddressText('');
    setIsAddAddressOpen(false);
  };

  const SubHeader = ({ title, action, onAction }) => (
    <div className="px-2 pt-2 flex items-center justify-between">
      <button type="button" onClick={() => setSection('overview')} className="h-11 pl-1 pr-3 flex items-center gap-0.5 text-[16px] text-pd-action pd-press">
        <ChevronLeft className="w-5 h-5" strokeWidth={2.25} />
        Account
      </button>
      {action && (
        <button type="button" onClick={onAction} className="h-11 px-3 text-[15px] font-semibold text-pd-action flex items-center gap-1 pd-press">
          {action}
        </button>
      )}
      <h2 className="sr-only">{title}</h2>
    </div>
  );

  return (
    <div className="flex-1 w-full max-w-full overflow-x-clip pb-44 bg-white min-h-screen">
      {section === 'overview' && (
        <>
          {/* ── Header ── */}
          {!isLoggedIn ? (
            <section className="px-6 pt-10 pb-4 text-center">
              <img src="/app-icon.png" alt="" className="w-16 h-16 rounded-[18px] object-contain mx-auto shadow-pd-1" />
              <h2 className="mt-4 text-[24px] font-bold text-pd-ink tracking-[-0.01em]">Welcome to Persian Darbar</h2>
              <p className="mt-1.5 text-[15px] text-pd-ink-2 max-w-xs mx-auto">
                Log in to track orders, use your PD Coins and save addresses.
              </p>
              <button
                type="button"
                onClick={() => navigate('/customer/login')}
                className="mt-6 w-full h-[52px] rounded-[14px] bg-pd-action text-white text-[16px] font-semibold pd-press"
              >
                Log in or sign up
              </button>
            </section>
          ) : (
            <section className="px-4 pt-6">
              <div className="flex items-center gap-4">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <span className="w-16 h-16 rounded-full bg-pd-teal text-white flex items-center justify-center text-[26px] font-semibold">
                    {patronInitial}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-[22px] leading-7 font-bold text-pd-ink truncate tracking-[-0.01em]">{patronName}</h2>
                  {patronPhone && <p className="text-[14px] text-pd-ink-2 pd-tabular">+91 {patronPhone}</p>}
                  {patronEmail && <p className="text-[13px] text-pd-ink-3 truncate">{patronEmail}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  aria-label="Edit profile"
                  className="w-10 h-10 rounded-full bg-pd-surface flex items-center justify-center text-pd-ink pd-press shrink-0"
                >
                  <Pencil className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </button>
              </div>

              {/* Stats */}
              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {[
                  { id: 'orders', label: 'Orders', value: orders.length },
                  { id: 'reservations', label: 'Bookings', value: reservations.length },
                  { id: 'rewards', label: 'PD Coins', value: pdCoins, gold: true },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSection(s.id)}
                    className={cx('rounded-[14px] py-3 text-center pd-press', s.gold ? 'bg-pd-gold-tint' : 'bg-pd-surface')}
                  >
                    <span className={cx('block text-[20px] font-bold pd-tabular', s.gold ? 'text-pd-gold' : 'text-pd-ink')}>{s.value}</span>
                    <span className="block text-[12px] text-pd-ink-2">{s.label}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Your activity ── */}
          <Group title="Your activity">
            <Row icon={ShoppingBag} label="Orders" detail={orders.length || null} onClick={() => setSection('orders')} />
            <Row icon={Calendar} label="Table reservations" detail={reservations.length || null} onClick={() => setSection('reservations')} />
            <Row icon={MapPin} label="Saved addresses" detail={savedAddresses.length || null} onClick={() => setSection('addresses')} />
            <Row icon={Crown} label="Royalty Club" detail={`${pdCoins} coins`} onClick={() => setSection('rewards')} />
          </Group>

          {/* ── Help ── */}
          <Group title="Help">
            <Row
              icon={MessageCircle}
              label="Chat on WhatsApp"
              href="https://wa.me/917028033763?text=Hello%20Persian%20Darbar%20Concierge,%20I%20need%20assistance%20with%20my%20order."
              external
            />
            {PERSIAN_DARBAR_BRANCHES.map((b) => (
              <Row
                key={b.id}
                icon={Store}
                label={
                  <span className="block">
                    <span className="block text-[16px] text-pd-ink">{b.name}</span>
                    <span className="block text-[13px] text-pd-ink-3 truncate">{b.shortAddress}</span>
                  </span>
                }
                href={`tel:${b.phones[0].replace(/\s/g, '')}`}
                trailing={
                  <span className="w-9 h-9 rounded-full bg-[#EAF6EE] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-pd-success" strokeWidth={2} />
                  </span>
                }
              />
            ))}
          </Group>

          {/* ── Account (sign out + delete: App Store 5.1.1(v)) ── */}
          {isLoggedIn && (
            <>
              <Group title="Account">
                <Row icon={LogOut} label="Sign out" onClick={() => setShowLogoutModal(true)} trailing={null} />
                <Row icon={Trash2} label="Delete account" danger id="delete-account-btn" onClick={() => setShowDeleteModal(true)} trailing={null} />
              </Group>
              <p className="px-6 pt-3 text-[12px] text-pd-ink-3">
                Deleting your account permanently removes your profile, saved addresses and PD Coins.
              </p>
              <p className="px-6 pt-4 text-[12px] text-pd-ink-3 text-center">
                Logged in as {patronName} {patronPhone ? `(+91 ${patronPhone})` : ''}
              </p>
            </>
          )}
        </>
      )}

      {/* ── Orders ── */}
      {section === 'orders' && (
        <>
          <SubHeader title="Orders" action="Order food" onAction={onGoToOrder} />
          <h2 className="px-4 pt-1 text-[28px] font-bold text-pd-ink tracking-[-0.015em]">Orders</h2>
          {orders.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No orders yet" message="Your past and live orders will appear here." actionLabel="Browse menu" onAction={onGoToOrder} />
          ) : (
            <div className="px-4 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {orders.map((ord) => {
                const orderId = ord.order_id || ord.id || ord._id;
                const dateStr = ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
                const itemsList = ord.items || [];
                const [statusLabel, statusCls] = STATUS_STYLE[ord.status] || [ord.status || 'Placed', 'bg-pd-surface text-pd-ink'];
                const isActive = !['delivered', 'cancelled', 'rejected'].includes(ord.status);
                return (
                  <article key={orderId} className="rounded-[16px] border border-[color:var(--pd-line)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-pd-ink pd-tabular">#{String(orderId).slice(-8).toUpperCase()}</p>
                        <p className="text-[12px] text-pd-ink-3">{dateStr} · {(ord.order_type || 'DELIVERY') === 'TAKEAWAY' ? 'Pickup' : 'Delivery'} · {(ord.payment_method || 'cod').toUpperCase()}</p>
                      </div>
                      <span className={cx('h-7 px-2.5 rounded-full text-[12px] font-semibold flex items-center shrink-0', statusCls)}>{statusLabel}</span>
                    </div>
                    <ul className="mt-3 space-y-1">
                      {itemsList.map((item, idx) => (
                        <li key={idx} className="flex justify-between gap-3 text-[14px]">
                          <span className="text-pd-ink-2 truncate"><span className="text-pd-ink pd-tabular">{item.quantity} ×</span> {item.name}</span>
                          <span className="text-pd-ink pd-tabular shrink-0">{formatINR((item.price || 0) * (item.quantity || 1))}</span>
                        </li>
                      ))}
                    </ul>
                    {(ord.cooking_instructions || ord.delivery_instructions) && (
                      <div className="mt-3 rounded-[10px] bg-pd-surface px-3 py-2 text-[13px] text-pd-ink-2 space-y-0.5">
                        {ord.cooking_instructions && <p>Kitchen: {ord.cooking_instructions}</p>}
                        {ord.delivery_instructions && <p>Rider: {ord.delivery_instructions}</p>}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-[color:var(--pd-line)] flex items-center justify-between gap-2">
                      <span className="text-[16px] font-bold text-pd-ink pd-tabular">{formatINR(ord.total || 0)}</span>
                      <div className="flex items-center gap-2">
                        {isActive && onTrackOrder && (
                          <button type="button" onClick={() => onTrackOrder(ord)} className="h-9 px-3.5 rounded-full bg-pd-ink text-white text-[14px] font-semibold flex items-center gap-1.5 pd-press">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7EE2A0]" /> Track
                          </button>
                        )}
                        <button type="button" onClick={() => onReorder && onReorder(ord)} className="h-9 px-3.5 rounded-full border border-[color:var(--pd-line)] text-pd-action text-[14px] font-semibold pd-press">
                          Reorder
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Reservations ── */}
      {section === 'reservations' && (
        <>
          <SubHeader title="Reservations" action="Book" onAction={onGoToReserve} />
          <h2 className="px-4 pt-1 text-[28px] font-bold text-pd-ink tracking-[-0.015em]">Reservations</h2>
          {reservations.length === 0 ? (
            <EmptyState icon={Calendar} title="No reservations yet" message="Book a table at any Persian Darbar outlet." actionLabel="Book a table" onAction={onGoToReserve} />
          ) : (
            <div className="px-4 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {reservations.map((res, idx) => {
                const mood = res.dining_mood || (res.special_requests && res.special_requests.match(/Mood:\s*([^|\]]+)/)?.[1]?.trim());
                return (
                  <article key={idx} className="rounded-[16px] border border-[color:var(--pd-line)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[16px] font-semibold text-pd-ink">{res.date} · {res.time}</p>
                        <p className="text-[13px] text-pd-ink-2">Table for {res.guests}</p>
                      </div>
                      <span className="h-7 px-2.5 rounded-full text-[12px] font-semibold flex items-center bg-[#EAF6EE] text-pd-success capitalize shrink-0">
                        {res.status || 'Confirmed'}
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
        </>
      )}

      {/* ── Addresses ── */}
      {section === 'addresses' && (
        <>
          <SubHeader title="Saved addresses" action={<><Plus className="w-4 h-4" strokeWidth={2.5} />Add</>} onAction={() => setIsAddAddressOpen(true)} />
          <h2 className="px-4 pt-1 text-[28px] font-bold text-pd-ink tracking-[-0.015em]">Saved addresses</h2>
          {savedAddresses.length === 0 ? (
            <EmptyState icon={MapPin} title="No saved addresses" message="Add your home or work address for faster checkout." actionLabel="Add address" onAction={() => setIsAddAddressOpen(true)} />
          ) : (
            <div className="px-4 pt-4 space-y-3">
              {savedAddresses.map((addr) => (
                <article key={addr.id} className="rounded-[16px] border border-[color:var(--pd-line)] p-4 flex items-start gap-3">
                  <span className="w-9 h-9 rounded-full bg-pd-surface flex items-center justify-center shrink-0">
                    <MapPin className="w-[18px] h-[18px] text-pd-ink" strokeWidth={1.75} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-semibold text-pd-ink flex items-center gap-2">
                      {addr.tag}
                      {addr.isDefault && <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-pd-success">Default</span>}
                    </p>
                    <p className="mt-0.5 text-[14px] text-pd-ink-2 leading-5">{addr.address}</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSaveAddress) onSaveAddress(addr.address);
                        localStorage.setItem('customer_address', addr.address);
                        alert(`Selected ${addr.tag} as your active delivery address.`);
                      }}
                      className="mt-2 text-[14px] font-semibold text-pd-action pd-press"
                    >
                      Deliver here
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Rewards ── */}
      {section === 'rewards' && (
        <>
          <SubHeader title="Royalty Club" />
          <h2 className="px-4 pt-1 text-[28px] font-bold text-pd-ink tracking-[-0.015em]">Royalty Club</h2>
          <section className="px-4 pt-4">
            <div className="rounded-[20px] bg-pd-teal text-white p-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-[13px] text-white/70">PD Coins balance</p>
                <p className="mt-0.5 text-[36px] leading-none font-bold pd-tabular">{pdCoins}</p>
                <p className="mt-1.5 text-[13px] text-white/70 pd-tabular">Worth ₹{pdCoins} at checkout</p>
              </div>
              <button type="button" onClick={onGoToOrder} className="h-10 px-4 rounded-full bg-[#E9C67A] text-pd-ink text-[14px] font-semibold pd-press">
                Use coins
              </button>
            </div>
          </section>
          <Group title="Member benefits">
            {ROYAL_MEMBERSHIP_PRIVILEGES.map((priv, idx) => {
              const Icon = PRIV_ICONS[priv.icon] || Sparkles;
              return (
                <div key={idx} className="flex items-start gap-3 px-4 py-3.5 bg-white">
                  <span className="w-9 h-9 rounded-full bg-pd-surface flex items-center justify-center shrink-0">
                    <Icon className="w-[18px] h-[18px] text-pd-ink" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-pd-ink">{priv.title}</p>
                    <p className="text-[13px] text-pd-ink-2">{priv.desc}</p>
                  </div>
                </div>
              );
            })}
          </Group>
        </>
      )}

      {/* ── Add address ── */}
      {isAddAddressOpen && (
        <Sheet title="Add address" onClose={() => setIsAddAddressOpen(false)}>
          <form onSubmit={handleAddNewAddress} className="mt-4 space-y-4">
            <div className="flex gap-2">
              {['Home', 'Work', 'Other'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={newAddressTag === tag}
                  onClick={() => setNewAddressTag(tag)}
                  className={cx(
                    'flex-1 h-10 rounded-[10px] text-[14px] font-semibold border transition-colors',
                    newAddressTag === tag ? 'bg-pd-ink text-white border-pd-ink' : 'bg-white text-pd-ink border-[color:var(--pd-line)]'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={newAddressText}
              onChange={(e) => setNewAddressText(e.target.value)}
              placeholder="Flat / house no., building, street, area, PIN code"
              className={cx(fieldCls, 'py-3 resize-none')}
              required
            />
            <button type="submit" className="w-full h-12 rounded-[14px] bg-pd-ink text-white text-[16px] font-semibold pd-press">
              Save address
            </button>
          </form>
        </Sheet>
      )}

      {/* ── Edit profile ── */}
      {isEditModalOpen && (
        <Sheet title="Edit profile" onClose={() => setIsEditModalOpen(false)}>
          {savedSuccess ? (
            <div className="py-10 text-center">
              <span className="w-12 h-12 rounded-full bg-[#EAF6EE] flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-pd-success" strokeWidth={2.5} />
              </span>
              <p className="mt-3 text-[16px] font-semibold text-pd-ink">Profile updated</p>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              <label className="block">
                <span className="block text-[13px] font-medium text-pd-ink-2 mb-1.5">Full name</span>
                <input type="text" value={nameVal} onChange={(e) => setNameVal(e.target.value)} autoComplete="name" className={cx(fieldCls, 'h-12')} required />
              </label>
              <label className="block">
                <span className="block text-[13px] font-medium text-pd-ink-2 mb-1.5">Phone number</span>
                <input type="tel" inputMode="tel" value={phoneVal} onChange={(e) => setPhoneVal(e.target.value)} autoComplete="tel-national" className={cx(fieldCls, 'h-12 pd-tabular')} required />
              </label>
              <label className="block">
                <span className="block text-[13px] font-medium text-pd-ink-2 mb-1.5">Default address</span>
                <textarea rows={2} value={addressVal} onChange={(e) => setAddressVal(e.target.value)} autoComplete="street-address" className={cx(fieldCls, 'py-3 resize-none')} required />
              </label>
              <button type="submit" className="w-full h-12 rounded-[14px] bg-pd-ink text-white text-[16px] font-semibold pd-press">
                Save changes
              </button>
            </form>
          )}
        </Sheet>
      )}

      {/* ── Sign out ── */}
      {showLogoutModal && (
        <Sheet onClose={() => setShowLogoutModal(false)} center>
          <span className="w-14 h-14 rounded-full bg-pd-surface flex items-center justify-center mx-auto">
            <LogOut className="w-6 h-6 text-pd-ink" strokeWidth={1.75} />
          </span>
          <h3 className="mt-4 text-[20px] font-bold text-pd-ink">Sign out?</h3>
          <p className="mt-1.5 text-[15px] text-pd-ink-2">You can sign back in any time to see your orders and coins.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setShowLogoutModal(false)} className="h-12 rounded-[12px] bg-pd-surface text-pd-ink text-[15px] font-semibold pd-press">
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                setShowLogoutModal(false);
                if (onSignOut) await onSignOut();
              }}
              className="h-12 rounded-[12px] bg-pd-ink text-white text-[15px] font-semibold pd-press"
            >
              Sign out
            </button>
          </div>
        </Sheet>
      )}

      {/* ── Delete account (Guideline 5.1.1(v)) ── */}
      {showDeleteModal && (
        <Sheet onClose={() => { if (!deletingAccount) setShowDeleteModal(false); }} center>
          <span className="w-14 h-14 rounded-full bg-[#FDECEC] flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6 text-pd-error" strokeWidth={1.75} />
          </span>
          <h3 className="mt-4 text-[20px] font-bold text-pd-ink">Delete account permanently?</h3>
          <p className="mt-1.5 text-[15px] text-pd-ink-2">
            Your profile and saved addresses will be deleted and your <span className="font-semibold text-pd-ink pd-tabular">{pdCoins} PD Coins</span> will be lost.
          </p>
          <p className="mt-2 text-[13px] text-pd-ink-3">This cannot be undone.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={deletingAccount}
              onClick={() => setShowDeleteModal(false)}
              className="h-12 rounded-[12px] bg-pd-surface text-pd-ink text-[15px] font-semibold pd-press disabled:opacity-50"
            >
              Keep account
            </button>
            <button
              type="button"
              id="confirm-delete-account-btn"
              disabled={deletingAccount}
              onClick={async () => {
                setDeletingAccount(true);
                try {
                  if (onDeleteAccount) await onDeleteAccount();
                } finally {
                  setDeletingAccount(false);
                  setShowDeleteModal(false);
                }
              }}
              className="h-12 rounded-[12px] bg-pd-error text-white text-[15px] font-semibold flex items-center justify-center pd-press disabled:opacity-60"
            >
              {deletingAccount ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Delete'}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
};

export default CustomerProfileTab;
