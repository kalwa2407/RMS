// Darbar UI primitives for the captain (waiter) panel.
// Built on the shared `pd-*` tokens; customer primitives are imported, not copied.
import React, { useEffect } from "react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cx } from "../customer/ui";

/* Table status → calm, distinct visual treatment.
   free: white card + green dot · occupied: teal · billing: amber · reserved: gold. */
export const TABLE_STATUS = {
  free: { label: "Free", dot: "bg-pd-success", text: "text-pd-success", tile: "bg-white border-[color:var(--pd-line)]", num: "text-pd-ink" },
  occupied: { label: "Occupied", dot: "bg-white", text: "text-white/80", tile: "bg-pd-teal border-pd-teal", num: "text-white" },
  reserved: { label: "Reserved", dot: "bg-pd-gold", text: "text-pd-gold", tile: "bg-pd-gold-tint border-pd-gold/30", num: "text-pd-ink" },
  billing: { label: "Billing", dot: "bg-pd-warn", text: "text-pd-warn", tile: "bg-[#FFF4E5] border-pd-warn/30", num: "text-pd-ink" },
};
export const tableStatus = (s) => TABLE_STATUS[s] || TABLE_STATUS.billing;

export const ORDER_STATUS = {
  accepted: { label: "Sent to kitchen", cls: "bg-pd-surface text-pd-ink-2" },
  preparing: { label: "Preparing", cls: "bg-[#FFF4E5] text-pd-warn" },
  ready: { label: "Ready to serve", cls: "bg-pd-action text-white" },
  delivered: { label: "Served", cls: "bg-[#E8F3EC] text-pd-success" },
};
export const orderStatus = (s) => ORDER_STATUS[s] || { label: s, cls: "bg-pd-surface text-pd-ink-2" };

export const IconButton = ({ label, onClick, children, tone = "plain", className = "" }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={cx(
      "w-11 h-11 rounded-full flex items-center justify-center pd-press shrink-0",
      tone === "plain" && "bg-white text-pd-ink border border-[color:var(--pd-line)] hover:bg-pd-surface",
      tone === "ghost" && "text-pd-ink-2 hover:bg-pd-surface",
      className
    )}
  >
    {children}
  </button>
);

/* iOS segmented control. */
export const Segmented = ({ value, onChange, options, className = "" }) => (
  <div role="tablist" className={cx("inline-flex p-[3px] rounded-[12px] bg-[#EBE9E4]", className)}>
    {options.map(({ key, label, badge }) => {
      const active = value === key;
      return (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(key)}
          className={cx(
            "flex-1 h-9 min-w-[96px] px-4 rounded-[10px] text-[14px] font-semibold flex items-center justify-center gap-1.5 transition-colors",
            active ? "bg-white text-pd-ink shadow-pd-1" : "text-pd-ink-2 hover:text-pd-ink"
          )}
        >
          {label}
          {badge > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-pd-action text-white text-[12px] font-semibold pd-tabular flex items-center justify-center">
              {badge}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export const StatusDot = ({ className = "" }) => <span className={cx("w-2 h-2 rounded-full shrink-0", className)} />;

export const Card = ({ className = "", children, ...rest }) => (
  <div className={cx("bg-white rounded-[16px] border border-[color:var(--pd-line)] shadow-pd-1", className)} {...rest}>
    {children}
  </div>
);

export const Label = ({ children, className = "" }) => (
  <p className={cx("text-[11px] font-semibold uppercase tracking-[0.08em] text-pd-ink-3", className)}>{children}</p>
);

/* While the sheet animates out it must not take taps: its content is a stale snapshot. */
const SheetFrame = ({ labelledBy, children }) => {
  const isPresent = useIsPresent();
  return (
    <div
      className={cx("fixed inset-0 z-50 flex items-end md:items-center md:justify-center md:p-6", !isPresent && "pointer-events-none")}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      {children}
    </div>
  );
};

/* iOS-style sheet. Bottom sheet on phones, centred page sheet on tablets. */
export const Sheet = ({ open, onClose, children, labelledBy }) => {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <SheetFrame key="sheet" labelledBy={labelledBy}>
          <motion.div
            className="absolute inset-0 bg-pd-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full md:max-w-[1080px] h-[94dvh] md:h-full md:max-h-[860px] bg-pd-surface rounded-t-[24px] md:rounded-[24px] shadow-pd-2 flex flex-col overflow-hidden"
            initial={reduce ? { opacity: 0 } : { y: 48, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 48, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="md:hidden flex justify-center pt-2 pb-1 shrink-0" aria-hidden="true">
              <span className="w-9 h-[5px] rounded-full bg-pd-ink/15" />
            </div>
            {children}
          </motion.div>
        </SheetFrame>
      )}
    </AnimatePresence>
  );
};

export const CloseButton = ({ onClick }) => (
  <button
    type="button"
    aria-label="Close"
    onClick={onClick}
    className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center pd-press shrink-0"
  >
    <span className="w-8 h-8 rounded-full bg-[#E9E7E2] text-pd-ink-2 flex items-center justify-center">
      <X className="w-4 h-4" strokeWidth={2.5} />
    </span>
  </button>
);

export const SearchField = ({ value, onChange, placeholder, icon: Icon, onClear }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-pd-ink-3 pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full h-11 rounded-[12px] bg-[#EBE9E4] pl-10 pr-10 text-[16px] text-pd-ink placeholder:text-pd-ink-3 outline-none focus:bg-white focus:ring-2 focus:ring-pd-ink/10 transition-colors"
    />
    {value && (
      <button
        type="button"
        aria-label="Clear search"
        onClick={onClear}
        className="absolute right-0 top-0 w-11 h-11 flex items-center justify-center text-pd-ink-3"
      >
        <span className="w-[18px] h-[18px] rounded-full bg-pd-ink-3 text-white flex items-center justify-center">
          <X className="w-3 h-3" strokeWidth={3} />
        </span>
      </button>
    )}
  </div>
);
