// Rider UI: small presentational primitives for the delivery rider panel.
// Built on the Darbar UI `pd-*` tokens (tailwind.config.js / index.css).
import React from "react";
import { cx } from "../../customer/ui";

/* 44pt round icon button used in the header. */
export const IconButton = ({ label, onClick, children, tone = "default", className = "" }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={cx(
      "pd-press w-11 h-11 rounded-full flex items-center justify-center shrink-0",
      tone === "danger" ? "bg-[#FBEDEE] text-pd-action" : "bg-pd-surface text-pd-ink",
      className
    )}
  >
    {children}
  </button>
);

/* Small status capsule: dot + label. One tone per pill. */
const PILL_TONES = {
  warn: "bg-[#FDF3E3] text-pd-warn",
  teal: "bg-[#E7EEF0] text-pd-teal",
  success: "bg-[#E8F4EC] text-pd-success",
  neutral: "bg-pd-surface text-pd-ink-2",
};

export const StatusPill = ({ tone = "neutral", children, className = "" }) => (
  <span
    className={cx(
      "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[13px] font-semibold whitespace-nowrap",
      PILL_TONES[tone],
      className
    )}
  >
    <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
    {children}
  </span>
);

/* iOS-style segmented control. */
export const Segmented = ({ value, onChange, options }) => (
  <div role="tablist" className="flex p-[3px] rounded-[12px] bg-[#EBEAE6]">
    {options.map((opt) => {
      const active = opt.key === value;
      return (
        <button
          key={opt.key}
          role="tab"
          type="button"
          aria-selected={active}
          onClick={() => onChange(opt.key)}
          className={cx(
            "flex-1 h-10 rounded-[10px] text-[15px] font-semibold flex items-center justify-center gap-1.5 transition-colors",
            active ? "bg-white text-pd-ink shadow-pd-1" : "text-pd-ink-2"
          )}
        >
          {opt.label}
          {opt.count > 0 && (
            <span
              className={cx(
                "min-w-[22px] h-[22px] px-1.5 rounded-full text-[12px] font-semibold flex items-center justify-center pd-tabular",
                active ? "bg-pd-ink text-white" : "bg-[#DCDAD5] text-pd-ink-2"
              )}
            >
              {opt.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

/* Row inside a grouped card: leading icon, text, optional trailing element. */
export const ListRow = ({ icon: Icon, iconClassName = "bg-pd-surface text-pd-ink", title, subtitle, trailing, onClick, href, className = "" }) => {
  const body = (
    <>
      {Icon && (
        <span className={cx("w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0", iconClassName)}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </span>
      )}
      <span className="flex-1 min-w-0">
        {title}
        {subtitle}
      </span>
      {trailing}
    </>
  );
  const base = cx("w-full flex items-center gap-3 px-4 py-3 text-left min-h-[60px]", (onClick || href) && "pd-press active:bg-pd-surface", className);
  if (href) return <a href={href} className={base}>{body}</a>;
  if (onClick) return <button type="button" onClick={onClick} className={base}>{body}</button>;
  return <div className={base}>{body}</div>;
};

export const Hairline = ({ inset = 68 }) => (
  <div className="h-px bg-[var(--pd-line)]" style={{ marginLeft: inset }} />
);

/* Skeleton for an order card while the first load is running. */
export const OrderCardSkeleton = () => (
  <div className="rounded-[18px] bg-white shadow-pd-1 p-4 space-y-3" aria-hidden="true">
    <div className="flex justify-between">
      <div className="h-7 w-36 rounded-full bg-[#ECEAE6] animate-pulse" />
      <div className="h-5 w-16 rounded-[8px] bg-[#ECEAE6] animate-pulse" />
    </div>
    <div className="h-6 w-1/2 rounded-[8px] bg-[#ECEAE6] animate-pulse" />
    <div className="h-14 w-full rounded-[12px] bg-[#ECEAE6] animate-pulse" />
    <div className="h-4 w-3/4 rounded-[8px] bg-[#ECEAE6] animate-pulse" />
    <div className="h-4 w-2/3 rounded-[8px] bg-[#ECEAE6] animate-pulse" />
  </div>
);
