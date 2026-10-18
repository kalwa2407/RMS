import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, X, CheckCircle2, Bike, ChefHat, Package, Clock,
  AlertCircle, Gift, Star, Sparkles, ChevronRight, Check
} from 'lucide-react';
import API_BASE from '../../../lib/config';

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
  placed:          { title: 'Order Placed', body: 'Your royal feast has been sent to the kitchen.' },
  accepted:        { title: 'Kitchen Accepted', body: 'Your order has been accepted by our master chefs.' },
  preparing:       { title: 'Preparing Your Feast', body: 'Your Mughlai delicacies are being crafted with love.' },
  ready:           { title: 'Order Ready', body: 'Your feast is ready. Rider being assigned.' },
  out_for_delivery:{ title: 'Out for Delivery', body: 'Your rider is on the way to your doorstep.' },
  delivered:       { title: 'Order Delivered', body: 'Enjoy your royal Persian feast. Rate your experience.' },
  cancelled:       { title: 'Order Cancelled', body: 'Your order has been cancelled. Contact us for help.' },
  rejected:        { title: 'Order Rejected', body: 'Your order was rejected. Contact restaurant for details.' },
};

// ── Notification Bell Button ──────────────────────────────────────────────
export const NotificationBell = ({ count = 0, onClick }) => (
  <button
    onClick={onClick}
    className="relative w-9 h-9 rounded-full bg-white/80 border border-neutral-200/80 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-xs"
    aria-label="Notifications"
  >
    <Bell className="w-4 h-4 text-neutral-700" />
    {count > 0 && (
      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#E40000] text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 border-2 border-white animate-in zoom-in duration-200">
        {count > 9 ? '9+' : count}
      </span>
    )}
  </button>
);

// ── Notification Drawer ───────────────────────────────────────────────────
const CustomerNotificationDrawer = ({
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
          className="w-full max-w-[430px] h-full flex flex-col pointer-events-auto"
          style={{ paddingTop: 'calc(max(env(safe-area-inset-top, 54px), 54px) + 60px)' }}
        >
          <div className="flex-1 bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">

            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-neutral-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-base font-black text-neutral-900">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-[11px] text-neutral-500">{unreadCount} unread</p>
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
                    No notifications yet. Place an order to get live updates!
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
                        className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer active:scale-[0.98] transition-all ${style.bg} ${style.border} ${!notif.read ? 'shadow-sm' : 'opacity-75'}`}
                      >
                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white/80 shadow-xs ${style.iconColor}`}>
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
                          <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">{notif.body}</p>
                          {notif.actionLabel && (
                            <div className="flex items-center gap-1 mt-1.5">
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

// ── Custom Hook: useNotifications ─────────────────────────────────────────
export const useNotifications = ({
  currentUser,
  fetchWithAuth,
  orders = [],
  reservations = [],
  onOrderStatusChange,
}) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const prevOrdersRef = useRef({});
  const prevReservationsRef = useRef({});

  // Format relative time
  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const addNotification = useCallback((notif) => {
    const id = `${notif.type}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newNotif = {
      id,
      ...notif,
      time: formatTime(new Date()),
      read: false,
      timestamp: Date.now(),
    };
    setNotifications(prev => {
      // Deduplicate: don't add same type+orderId within 30 seconds
      const isDuplicate = prev.some(n =>
        n.type === newNotif.type &&
        n.orderId === newNotif.orderId &&
        (Date.now() - n.timestamp) < 30000
      );
      if (isDuplicate) return prev;
      return [newNotif, ...prev].slice(0, 50); // Keep last 50
    });
  }, []);

  // Monitor order status changes
  useEffect(() => {
    if (!orders.length) return;
    const prev = prevOrdersRef.current;

    orders.forEach(order => {
      const oid = order.order_id || order.id || order._id;
      const prevStatus = prev[oid];
      const currStatus = order.status;

      if (prevStatus && prevStatus !== currStatus) {
        // Status changed!
        const msg = statusMessages[currStatus];
        if (msg) {
          addNotification({
            type: statusToNotifType[currStatus] || 'default',
            title: msg.title,
            body: msg.body,
            orderId: oid,
            actionLabel: currStatus === 'out_for_delivery' || currStatus === 'preparing' ? 'Track Order' : undefined,
            onTap: onOrderStatusChange ? () => onOrderStatusChange(order) : undefined,
          });
        }
      }
      prev[oid] = currStatus;
    });

    prevOrdersRef.current = { ...prev };
  }, [orders, addNotification, onOrderStatusChange]);

  // Monitor reservation status changes
  useEffect(() => {
    if (!reservations.length) return;
    const prev = prevReservationsRef.current;

    reservations.forEach(res => {
      const rid = res.id || res._id;
      const prevStatus = prev[rid];
      const currStatus = res.status;

      if (prevStatus && prevStatus !== currStatus && currStatus === 'confirmed') {
        addNotification({
          type: 'reservation',
          title: 'Table Confirmed',
          body: `Table for ${res.guests} guests on ${res.date} at ${res.time} is confirmed!`,
          orderId: rid,
          actionLabel: 'View Reservation',
        });
      }
      prev[rid] = currStatus;
    });

    prevReservationsRef.current = { ...prev };
  }, [reservations, addNotification]);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isOpen,
    openDrawer: () => setIsOpen(true),
    closeDrawer: () => setIsOpen(false),
    addNotification,
    markRead,
    markAllRead,
    clearAll,
  };
};

// ── Main Export ───────────────────────────────────────────────────────────
export default CustomerNotificationDrawer;
