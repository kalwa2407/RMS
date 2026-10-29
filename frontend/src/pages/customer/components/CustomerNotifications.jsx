import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, X, CheckCircle2, Bike, ChefHat, Package, Clock,
  AlertCircle, Gift, Star, Sparkles, ChevronRight, Check, Volume2
} from 'lucide-react';

// ── Notification types and their styling ──────────────────────────────────
const NOTIF_STYLES = {
  order_placed:     { bg: 'bg-blue-50',    border: 'border-blue-200',    icon: Package,      iconColor: 'text-blue-600',    dot: 'bg-blue-500' },
  order_accepted:   { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: ChefHat,      iconColor: 'text-amber-600',   dot: 'bg-amber-500' },
  order_preparing:  { bg: 'bg-orange-50',  border: 'border-orange-200',  icon: ChefHat,      iconColor: 'text-orange-600',  dot: 'bg-orange-500' },
  order_ready:      { bg: 'bg-purple-50',  border: 'border-purple-200',  icon: CheckCircle2, iconColor: 'text-purple-600',  dot: 'bg-purple-500' },
  order_out:        { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Bike,         iconColor: 'text-emerald-600', dot: 'bg-emerald-500' },
  order_delivered:  { bg: 'bg-green-50',   border: 'border-green-200',   icon: CheckCircle2, iconColor: 'text-green-600',   dot: 'bg-green-600' },
  order_cancelled:  { bg: 'bg-red-50',     border: 'border-red-200',     icon: AlertCircle,  iconColor: 'text-red-600',     dot: 'bg-red-500' },
  reservation:      { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: Star,         iconColor: 'text-amber-600',   dot: 'bg-amber-500' },
  offer:            { bg: 'bg-rose-50',    border: 'border-rose-200',    icon: Gift,         iconColor: 'text-rose-600',    dot: 'bg-rose-500' },
  reward:           { bg: 'bg-yellow-50',  border: 'border-yellow-200',  icon: Sparkles,     iconColor: 'text-yellow-600',  dot: 'bg-yellow-500' },
  default:          { bg: 'bg-neutral-50', border: 'border-neutral-200', icon: Bell,         iconColor: 'text-neutral-600', dot: 'bg-neutral-500' },
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
  placed:          { title: 'Order Placed', body: 'Your royal feast has been received by Persian Darbar.' },
  accepted:        { title: 'Kitchen Accepted', body: 'Master chefs have accepted and begun preparing your order.' },
  preparing:       { title: 'Preparing Your Feast', body: 'Fresh Mughlai delicacies are being crafted with royal care.' },
  ready:           { title: 'Order Packed & Ready', body: 'Your order is packed hot and ready for rider dispatch.' },
  out_for_delivery:{ title: 'Out for Delivery', body: 'Rider is on the way to your doorstep. Track live on map.' },
  delivered:       { title: 'Order Delivered', body: 'Delivered to your doorstep! Enjoy your royal Persian meal.' },
  cancelled:       { title: 'Order Cancelled', body: 'Your order has been cancelled. Contact support for help.' },
  rejected:        { title: 'Order Rejected', body: 'Your order was declined. Contact restaurant for details.' },
};

// Play a pleasant double-tone notification chime (Web Audio API - no external file needed)
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

    // Subtle haptic vibration on mobile devices
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
    onClick={onClick}
    className="relative w-9 h-9 rounded-full bg-white/90 border border-neutral-200/90 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-xs"
    aria-label="Notifications"
  >
    <Bell className="w-4 h-4 text-neutral-800" />
    {count > 0 && (
      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#E40000] text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white animate-in zoom-in duration-200 shadow-xs">
        {count > 9 ? '9+' : count}
      </span>
    )}
  </button>
);

// ── Heads-Up Floating Banner (Zomato-style dropdown alert) ─────────────────
export const HeadsUpNotificationBanner = ({ alert, onClose, onTap }) => {
  if (!alert) return null;
  const style = NOTIF_STYLES[alert.type] || NOTIF_STYLES.default;
  const IconComp = style.icon;

  return (
    <div
      onClick={onTap}
      className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] md:max-w-md z-[999] pointer-events-auto cursor-pointer animate-in slide-in-from-top-4 duration-300 select-none"
    >
      <div className="bg-neutral-900/95 backdrop-blur-md text-white p-3.5 rounded-3xl shadow-2xl border border-white/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
            <IconComp className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-xs font-black text-white truncate">
                {alert.title}
              </h4>
            </div>
            <p className="text-[11px] text-neutral-300 truncate mt-0.5">
              {alert.body}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] font-black text-amber-300 bg-white/10 px-2 py-1 rounded-lg">
            Track
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-0 z-[91] flex flex-col items-center pointer-events-none">
        <div
          className="w-full max-w-[430px] md:max-w-lg lg:max-w-xl h-full flex flex-col pointer-events-auto"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 60px)' }}
        >
          <div className="flex-1 bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">

            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-black text-neutral-900">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-[11px] text-neutral-500">{unreadCount} unread updates</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-[11px] font-bold text-[#E40000] flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center active:scale-90 cursor-pointer"
                >
                  <X className="w-4 h-4 text-neutral-700" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-3">
                  <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center">
                    <Bell className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="font-bold text-neutral-600 text-sm">All Caught Up!</h3>
                  <p className="text-xs text-neutral-400 max-w-xs">
                    Your live order and reservation updates will appear here.
                  </p>
                </div>
              ) : (
                <div className="px-4 py-3 space-y-2">
                  {notifications.map((notif) => {
                    const style = NOTIF_STYLES[notif.type] || NOTIF_STYLES.default;
                    const IconComp = style.icon;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          onMarkRead(notif.id);
                          if (notif.onTap) notif.onTap();
                          else if (onTapNotification) onTapNotification(notif);
                        }}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer active:scale-[0.98] transition-all ${style.bg} ${style.border} ${!notif.read ? 'shadow-xs' : 'opacity-80'}`}
                      >
                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-xs ${style.iconColor}`}>
                          <IconComp className="w-4.5 h-4.5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-xs font-black text-neutral-900 leading-tight ${!notif.read ? '' : 'font-bold'}`}>
                              {notif.title}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              {!notif.read && (
                                <span className={`w-2 h-2 rounded-full ${style.dot} shrink-0`} />
                              )}
                              <span className="text-[9px] text-neutral-400 whitespace-nowrap">{notif.time}</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-neutral-600 mt-1 leading-relaxed">{notif.body}</p>
                          {notif.actionLabel && (
                            <div className="flex items-center gap-1 mt-2">
                              <span className={`text-[10px] font-black ${style.iconColor}`}>{notif.actionLabel}</span>
                              <ChevronRight className={`w-3 h-3 ${style.iconColor}`} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="h-6" />
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
            actionLabel: currStatus !== 'delivered' && currStatus !== 'cancelled' ? 'Track Live' : undefined,
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
              actionLabel: currStatus !== 'delivered' && currStatus !== 'cancelled' ? 'Track Live' : undefined,
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
