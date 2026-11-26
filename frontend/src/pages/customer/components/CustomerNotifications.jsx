import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, X, CheckCircle2, Bike, ChefHat, Package,
  AlertCircle, Gift, Star, Sparkles, ChevronRight, Check
} from 'lucide-react';

// ── Notification types: icon + calm tone ──────────────────────────────────
const NOTIF_STYLES = {
  order_placed:     { icon: Package,      tone: 'text-pd-ink',     tint: 'bg-pd-surface' },
  order_accepted:   { icon: ChefHat,      tone: 'text-pd-warn',    tint: 'bg-[#FFF5E5]' },
  order_preparing:  { icon: ChefHat,      tone: 'text-pd-warn',    tint: 'bg-[#FFF5E5]' },
  order_ready:      { icon: CheckCircle2, tone: 'text-[#1A5FB4]',  tint: 'bg-[#EAF2FD]' },
  order_out:        { icon: Bike,         tone: 'text-[#1A5FB4]',  tint: 'bg-[#EAF2FD]' },
  order_delivered:  { icon: CheckCircle2, tone: 'text-pd-success', tint: 'bg-[#EAF6EE]' },
  order_cancelled:  { icon: AlertCircle,  tone: 'text-pd-error',   tint: 'bg-[#FDECEC]' },
  reservation:      { icon: Star,         tone: 'text-pd-gold',    tint: 'bg-pd-gold-tint' },
  offer:            { icon: Gift,         tone: 'text-pd-action',  tint: 'bg-pd-action-tint' },
  reward:           { icon: Sparkles,     tone: 'text-pd-gold',    tint: 'bg-pd-gold-tint' },
  default:          { icon: Bell,         tone: 'text-pd-ink',     tint: 'bg-pd-surface' },
};

// Map order statuses → notification type
const statusToNotifType = {
  placed: 'order_placed',
  accepted: 'order_accepted',
  preparing: 'order_preparing',
  ready: 'order_ready',
  out_for_delivery: 'order_out',
  delivered: 'order_delivered',
  cancelled: 'order_cancelled',
  rejected: 'order_cancelled',
};

// Human-readable status messages
const statusMessages = {
  placed:          { title: 'Order placed', body: 'Persian Darbar has received your order.' },
  accepted:        { title: 'Order accepted', body: 'The kitchen has started on your order.' },
  preparing:       { title: 'Being prepared', body: 'Your food is being cooked fresh.' },
  ready:           { title: 'Packed and ready', body: 'Your order is packed and waiting for the rider.' },
  out_for_delivery:{ title: 'On the way', body: 'Your rider is heading to you. Tap to track live.' },
  delivered:       { title: 'Delivered', body: 'Your order has arrived. Enjoy your meal!' },
  cancelled:       { title: 'Order cancelled', body: 'Your order was cancelled. Contact us if you need help.' },
  rejected:        { title: 'Order declined', body: 'The restaurant could not take this order. Contact us for details.' },
};

// Play a short double-tone chime (Web Audio API - no external file needed)
function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.setValueAtTime(880, now + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(587.33, now);
    osc2.frequency.setValueAtTime(880, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);

    if (navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

// ── Notification Bell Button ──────────────────────────────────────────────
export const NotificationBell = ({ count = 0, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="relative w-10 h-10 rounded-full flex items-center justify-center text-pd-ink pd-press"
    aria-label="Notifications"
  >
    <Bell className="w-[22px] h-[22px]" strokeWidth={1.75} />
    {count > 0 && (
      <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-pd-action text-white text-[11px] font-semibold leading-[17px] text-center border-2 border-white box-content">
        {count > 9 ? '9+' : count}
      </span>
    )}
  </button>
);

// ── Heads-up banner (iOS notification style) ──────────────────────────────
export const HeadsUpNotificationBanner = ({ alert, onClose, onTap }) => {
  if (!alert) return null;
  const style = NOTIF_STYLES[alert.type] || NOTIF_STYLES.default;
  const IconComp = style.icon;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-16px)] max-w-[414px] z-[999] animate-in slide-in-from-top-6 fade-in duration-300 ease-pd-out select-none"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
      role="status"
      aria-live="polite"
    >
      <div className="relative rounded-[22px] bg-white/90 backdrop-blur-2xl shadow-[0_10px_40px_rgba(14,26,32,0.18)] border border-black/[0.04]">
        <button
          type="button"
          onClick={onTap}
          className="w-full flex items-center gap-3 pl-3.5 pr-11 py-3 text-left"
        >
          <span className={`w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0 ${style.tint}`}>
            <IconComp className={`w-5 h-5 ${style.tone}`} strokeWidth={2} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-semibold text-pd-ink truncate">{alert.title}</span>
              <span className="text-[12px] text-pd-ink-3 shrink-0">now</span>
            </span>
            <span className="block text-[14px] leading-[19px] text-pd-ink-2 line-clamp-2">{alert.body}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Dismiss"
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/[0.06] flex items-center justify-center text-pd-ink-2"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

// ── Notification Drawer ───────────────────────────────────────────────────
export const CustomerNotificationDrawer = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkRead,
  onMarkAllRead,
  onTapNotification,
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/50 animate-in fade-in duration-200" onClick={onClose} />

      <div className="fixed inset-0 z-[91] flex flex-col items-center pointer-events-none">
        <div
          className="w-full max-w-[430px] md:max-w-xl h-full flex flex-col pointer-events-auto"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)' }}
        >
          <div className="flex-1 bg-white rounded-t-[24px] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 ease-pd-out">
            <div className="w-10 h-1.5 rounded-full bg-black/15 mx-auto mt-2" />

            {/* Header */}
            <div className="px-5 pt-3 pb-3 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-[24px] font-bold text-pd-ink tracking-[-0.015em]">Notifications</h2>
                {unreadCount > 0 && <p className="text-[13px] text-pd-ink-2">{unreadCount} unread</p>}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    className="h-9 px-3 rounded-full text-[14px] font-semibold text-pd-action flex items-center gap-1 pd-press"
                  >
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                    Read all
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full bg-pd-surface flex items-center justify-center pd-press"
                >
                  <X className="w-[18px] h-[18px] text-pd-ink-2" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                  <span className="w-14 h-14 rounded-full bg-pd-surface flex items-center justify-center">
                    <Bell className="w-6 h-6 text-pd-ink-2" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-4 text-[17px] font-semibold text-pd-ink">You're all caught up</h3>
                  <p className="mt-1 text-[14px] text-pd-ink-2 max-w-xs">Order and reservation updates will show up here.</p>
                </div>
              ) : (
                <ul className="divide-y divide-[color:var(--pd-line)]">
                  {notifications.map((notif) => {
                    const style = NOTIF_STYLES[notif.type] || NOTIF_STYLES.default;
                    const IconComp = style.icon;
                    return (
                      <li key={notif.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onMarkRead(notif.id);
                            if (notif.onTap) notif.onTap();
                            else if (onTapNotification) onTapNotification(notif);
                          }}
                          className="w-full flex items-start gap-3 px-5 py-4 text-left active:bg-pd-surface transition-colors"
                        >
                          <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.tint}`}>
                            <IconComp className={`w-5 h-5 ${style.tone}`} strokeWidth={2} />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="flex items-start justify-between gap-2">
                              <span className={`text-[15px] leading-5 text-pd-ink ${notif.read ? 'font-medium' : 'font-semibold'}`}>
                                {notif.title}
                              </span>
                              <span className="flex items-center gap-1.5 shrink-0 pt-0.5">
                                <span className="text-[12px] text-pd-ink-3 whitespace-nowrap">{notif.time}</span>
                                {!notif.read && <span className="w-2 h-2 rounded-full bg-pd-action" aria-label="Unread" />}
                              </span>
                            </span>
                            <span className="block mt-0.5 text-[14px] leading-[19px] text-pd-ink-2">{notif.body}</span>
                            {notif.actionLabel && (
                              <span className="mt-1.5 inline-flex items-center gap-0.5 text-[13px] font-semibold text-pd-action">
                                {notif.actionLabel}
                                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const STORAGE_KEY = 'pd_customer_notifications_v3';

// ── Custom Hook: useNotifications ─────────────────────────────────────────
export const useNotifications = ({
  currentUser,
  orders = [],
  reservations = [],
  onOrderStatusChange,
}) => {
  // Load initial notifications from localStorage
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [isOpen, setIsOpen] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const prevOrdersRef = useRef({});
  const alertTimerRef = useRef(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
    } catch (e) {}
  }, [notifications]);

  // Request browser Notification permission once
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Format relative time
  const formatTime = (timestamp) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Add notification with Heads-Up Banner and Chime
  const addNotification = useCallback((notif) => {
    const id = `${notif.type}_${notif.orderId || ''}_${Date.now()}`;
    const timestamp = Date.now();
    const newNotif = {
      id,
      ...notif,
      timestamp,
      time: 'Just now',
      read: false,
    };

    setNotifications(prev => {
      // Don't add duplicate notification for same type and order within 60s
      const isDuplicate = prev.some(n =>
        n.type === newNotif.type &&
        n.orderId === newNotif.orderId &&
        (timestamp - (n.timestamp || 0)) < 60000
      );
      if (isDuplicate) return prev;
      return [newNotif, ...prev].slice(0, 50);
    });

    // Play pleasant chime
    playChime();

    // Show heads-up alert banner
    setActiveAlert(newNotif);
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => {
      setActiveAlert(null);
    }, 6000);

    // Native OS Web Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Persian Darbar: ${notif.title}`, {
          body: notif.body,
          icon: '/favicon.ico',
        });
      } catch (e) {}
    }
  }, []);

  // Monitor order status changes and seed initial updates
  useEffect(() => {
    if (!orders || !orders.length) return;
    const prev = prevOrdersRef.current;

    orders.forEach(order => {
      const oid = order.order_id || order.id || order._id;
      if (!oid) return;
      const prevStatus = prev[oid];
      const currStatus = order.status;

      // Check if order was placed in the last 24h
      const createdTime = order.created_at ? new Date(order.created_at).getTime() : Date.now();
      const isRecent = (Date.now() - createdTime) < 24 * 60 * 60 * 1000;

      // Status changed!
      if (prevStatus && prevStatus !== currStatus) {
        const msg = statusMessages[currStatus];
        if (msg) {
          addNotification({
            type: statusToNotifType[currStatus] || 'default',
            title: msg.title,
            body: msg.body,
            orderId: String(oid),
            actionLabel: currStatus !== 'delivered' && currStatus !== 'cancelled' ? 'Track order' : undefined,
            onTap: onOrderStatusChange ? () => onOrderStatusChange(order) : undefined,
          });
        }
      } else if (!prevStatus && isRecent) {
        // Initial load: ensure notification exists in list if not already present
        const msg = statusMessages[currStatus] || statusMessages.placed;
        setNotifications(existing => {
          const alreadyHas = existing.some(n => n.orderId === String(oid) && n.title === msg.title);
          if (alreadyHas) return existing;
          return [
            {
              id: `init_${oid}_${currStatus}`,
              type: statusToNotifType[currStatus] || 'default',
              title: msg.title,
              body: msg.body,
              orderId: String(oid),
              timestamp: createdTime,
              time: formatTime(createdTime),
              read: false,
              actionLabel: currStatus !== 'delivered' && currStatus !== 'cancelled' ? 'Track order' : undefined,
            },
            ...existing,
          ].slice(0, 50);
        });
      }

      prev[oid] = currStatus;
    });

    prevOrdersRef.current = { ...prev };
  }, [orders, addNotification, onOrderStatusChange]);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isOpen,
    activeAlert,
    dismissAlert: () => setActiveAlert(null),
    openDrawer: () => setIsOpen(true),
    closeDrawer: () => setIsOpen(false),
    addNotification,
    markRead,
    markAllRead,
    clearAll,
  };
};

export default CustomerNotificationDrawer;
