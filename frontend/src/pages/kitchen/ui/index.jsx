// Kitchen display (KDS) primitives — Darbar UI.
// Presentation only: no data fetching or status logic lives here.
import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle, Armchair, Bike, CheckCircle2, Clock, Flame, Loader2,
  Printer, ShoppingBag, WifiOff, Zap,
} from "lucide-react";
import { cx, Skeleton } from "../../customer/ui";

// ── Time helpers ─────────────────────────────────────────────
export const minutesSince = (ts) => Math.max(0, Math.floor((Date.now() - new Date(ts)) / 60000));

export const elapsedLabel = (ts) => {
  const mins = minutesSince(ts);
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

// Calm three-step escalation. Thresholds unchanged from the original panel (10 / 20 min).
export const urgencyLevel = (ts) => {
  const mins = minutesSince(ts);
  if (mins >= 20) return "late";
  if (mins >= 10) return "warn";
  return "ok";
};

const URGENCY = {
  ok: { label: "On time", pill: "bg-pd-surface text-pd-ink", card: "border-[var(--pd-line)]" },
  warn: { label: "Delayed", pill: "bg-[#FFF3E0] text-pd-warn", card: "border-[#E9C58A]" },
  late: { label: "Urgent", pill: "bg-[#FDECEC] text-pd-error", card: "border-pd-error border-2" },
};

export const sourceInfo = (order) => {
  if (order.order_type === "DELIVERY") return { label: "Delivery", icon: Bike };
  if (order.order_type === "DINE_IN") return { label: `Table ${order.table_number || "—"}`, icon: Armchair };
  return { label: "Takeaway", icon: ShoppingBag };
};

// ── Small pieces ─────────────────────────────────────────────
export const IconButton = ({ icon: Icon, label, onClick, active, tone = "default", children, className, ...rest }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className={cx(
      "pd-press h-12 min-w-[48px] px-3 rounded-[14px] inline-flex items-center justify-center gap-2 text-[15px] font-semibold border",
      active
        ? "bg-pd-ink text-white border-pd-ink"
        : tone === "danger"
          ? "bg-white text-pd-error border-[var(--pd-line)]"
          : "bg-white text-pd-ink border-[var(--pd-line)]",
      className
    )}
    {...rest}
  >
    {Icon && <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />}
    {children}
  </button>
);

export const Meta = ({ icon: Icon, children, className }) => (
  <span className={cx("inline-flex items-center gap-1.5 text-[15px] font-medium text-pd-ink-2", className)}>
    {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />}
    {children}
  </span>
);

const Note = ({ label, children, large }) => (
  <div className="flex items-start gap-2.5 rounded-[12px] bg-pd-gold-tint px-3 py-2.5 border-l-4 border-pd-gold">
    <AlertCircle className={cx("shrink-0 text-pd-gold mt-0.5", large ? "h-5 w-5" : "h-4 w-4")} strokeWidth={2.25} />
    <p className={cx("text-pd-ink font-semibold leading-snug", large ? "text-[17px]" : "text-[16px]")}>
      {label && <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-pd-ink-2 mb-0.5">{label}</span>}
      {children}
    </p>
  </div>
);

// ── Ticket card ──────────────────────────────────────────────
export const TicketCard = ({ order, isUpdating, isPrinting, onPrint, onAdvance, formatTime }) => {
  const reduce = useReducedMotion();
  const ts = order.accepted_at || order.created_at;
  const level = urgencyLevel(ts);
  const u = URGENCY[level];
  const src = sourceInfo(order);
  const isNew = order.status === "accepted";
  const isPreparing = order.status === "preparing";

  return (
    <motion.article
      layout={reduce ? false : "position"}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      className={cx("bg-white rounded-[18px] shadow-pd-1 border flex flex-col overflow-hidden", u.card)}
    >
      {/* Header */}
      <header className="px-5 pt-4 pb-3 flex items-start justify-between gap-3 border-b border-[var(--pd-line)]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cx("text-[11px] font-semibold uppercase tracking-[0.08em]", isNew ? "text-pd-action" : "text-pd-teal")}>
              {isNew ? "New" : isPreparing ? "Cooking" : order.status}
            </span>
          </div>
          <h3 className="text-[26px] leading-[1.15] font-bold text-pd-ink tracking-[-0.01em] pd-tabular truncate">
            {order.kot_number || `#${order.order_id?.slice(-6)}`}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Meta icon={src.icon} className="text-pd-ink font-semibold">{src.label}</Meta>
            {order.customer_name && <Meta>{order.customer_name}</Meta>}
          </div>
          {(order.auto_accepted || order.porter_order_id) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {order.auto_accepted && (
                <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-pd-surface text-[12px] font-semibold text-pd-ink-2">
                  <Zap className="h-3.5 w-3.5" strokeWidth={2.25} /> Auto-accepted
                </span>
              )}
              {order.porter_order_id && (
                <span
                  className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-pd-surface text-[12px] font-semibold text-pd-ink-2"
                  title={order.porter_rider_name ? `Rider: ${order.porter_rider_name}` : "Porter Courier"}
                >
                  <Bike className="h-3.5 w-3.5" strokeWidth={2.25} /> Porter
                </span>
              )}
            </div>
          )}
        </div>

        {/* Elapsed timer */}
        <div className="shrink-0 text-right">
          <div className={cx("inline-flex flex-col items-end rounded-[14px] px-3 py-2", u.pill)}>
            <span className="text-[30px] leading-none font-bold pd-tabular tracking-[-0.02em]">{elapsedLabel(ts)}</span>
            <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em]">{u.label}</span>
          </div>
          <p className="mt-1.5 text-[13px] text-pd-ink-3 pd-tabular">Placed {formatTime(order.created_at)}</p>
        </div>
      </header>

      {/* Items */}
      <ul className="flex-1 px-5 py-3 divide-y divide-[var(--pd-line)]">
        {(order.items || []).map((item, i) => (
          <li key={i} className="py-2.5 flex gap-3">
            <span className="w-11 shrink-0 text-[22px] leading-[1.2] font-bold text-pd-ink pd-tabular text-right">
              {item.quantity}×
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[20px] leading-[1.25] font-semibold text-pd-ink">{item.name}</p>
              {item.variant && <p className="text-[16px] text-pd-ink-2 font-medium">{item.variant}</p>}
              {item.addons?.length > 0 && (
                <p className="text-[16px] text-pd-ink-2 font-medium">+ {item.addons.join(", ")}</p>
              )}
              {item.special_instructions && <Note>{item.special_instructions}</Note>}
            </div>
          </li>
        ))}
      </ul>

      {order.special_instructions && (
        <div className="px-5 pb-3">
          <Note label="Order note" large>{order.special_instructions}</Note>
        </div>
      )}

      {/* Actions */}
      <footer className="px-4 pb-4 pt-1 flex items-stretch gap-2.5">
        <button
          type="button"
          onClick={onPrint}
          disabled={isPrinting}
          title="Print 80mm Thermal KOT Bill"
          className="pd-press h-14 px-4 rounded-[14px] border border-[var(--pd-line)] bg-white text-pd-ink text-[16px] font-semibold inline-flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
        >
          {isPrinting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" strokeWidth={2} />}
          <span>KOT</span>
        </button>
        {isNew && (
          <button
            type="button"
            onClick={() => onAdvance("preparing")}
            disabled={isUpdating}
            className="pd-press flex-1 h-14 rounded-[14px] bg-pd-action text-white text-[17px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isUpdating ? <><Loader2 className="h-5 w-5 animate-spin" /> Updating…</> : <><Flame className="h-5 w-5" strokeWidth={2} /> Start preparing</>}
          </button>
        )}
        {isPreparing && (
          <button
            type="button"
            onClick={() => onAdvance("ready")}
            disabled={isUpdating}
            className="pd-press flex-1 h-14 rounded-[14px] bg-pd-success text-white inline-flex items-center justify-center gap-2.5 disabled:opacity-60"
          >
            {isUpdating ? (
              <span className="inline-flex items-center gap-2 text-[17px] font-semibold"><Loader2 className="h-5 w-5 animate-spin" /> Updating…</span>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={2} />
                <span className="flex flex-col items-start leading-tight">
                  <span className="text-[17px] font-semibold">Mark ready</span>
                  <span className="text-[12px] font-medium opacity-85">Notifies captain</span>
                </span>
              </>
            )}
          </button>
        )}
      </footer>
    </motion.article>
  );
};

// ── States ───────────────────────────────────────────────────
export const TicketSkeleton = () => (
  <div className="bg-white rounded-[18px] border border-[var(--pd-line)] p-5 space-y-4">
    <div className="flex justify-between">
      <div className="space-y-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-16 w-20 rounded-[14px]" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-5 w-3/5" />
      <Skeleton className="h-5 w-2/3" />
    </div>
    <div className="flex gap-2.5">
      <Skeleton className="h-14 w-24 rounded-[14px]" />
      <Skeleton className="h-14 flex-1 rounded-[14px]" />
    </div>
  </div>
);

export const BoardMessage = ({ icon: Icon, tone = "neutral", title, message, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-20 px-6">
    <div
      className={cx(
        "w-16 h-16 rounded-[18px] flex items-center justify-center mb-5",
        tone === "error" ? "bg-[#FDECEC] text-pd-error" : tone === "success" ? "bg-[#E8F3EB] text-pd-success" : "bg-white text-pd-ink-2 border border-[var(--pd-line)]"
      )}
    >
      <Icon className="h-8 w-8" strokeWidth={1.75} />
    </div>
    <h2 className="text-[24px] font-semibold text-pd-ink tracking-[-0.01em]">{title}</h2>
    {message && <p className="mt-2 text-[16px] text-pd-ink-2 max-w-md">{message}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export const ColumnEmpty = ({ children }) => (
  <div className="rounded-[18px] border border-dashed border-[rgba(14,26,32,0.14)] py-12 px-6 text-center">
    <p className="text-[16px] text-pd-ink-3 font-medium">{children}</p>
  </div>
);

export const OfflineBanner = ({ lastRefresh, onRetry }) => (
  <div className="flex items-center gap-3 rounded-[14px] bg-[#FDECEC] px-4 py-2.5 mb-4">
    <WifiOff className="h-5 w-5 text-pd-error shrink-0" strokeWidth={2} />
    <p className="flex-1 text-[15px] font-medium text-pd-ink">
      Can't reach the server. Showing tickets from {lastRefresh}. Retrying automatically.
    </p>
    <button type="button" onClick={onRetry} className="pd-press h-12 px-4 rounded-[12px] bg-white text-pd-ink text-[15px] font-semibold border border-[var(--pd-line)]">
      Retry now
    </button>
  </div>
);
