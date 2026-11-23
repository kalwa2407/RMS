// Darbar UI for the admin panel: macOS / iPadOS style primitives.
// Colours come from the --a-* tokens defined for .admin-theme-light / .admin-theme-dark
// in src/index.css, so every primitive follows the light/dark switch automatically.
import React, { useEffect } from "react";
import { AlertTriangle, Inbox, Search, X } from "lucide-react";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

export const formatINR = (value, digits = 0) => {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: 0 })}`;
};

/* ── Tones ─────────────────────────────────────────────────────────────── */
const TONE = {
  neutral: "bg-[var(--a-fill-2)] text-[var(--a-text-2)]",
  accent: "bg-[var(--a-accent-tint)] text-[var(--a-accent)]",
  success: "bg-[var(--a-success-tint)] text-[var(--a-success)]",
  warn: "bg-[var(--a-warn-tint)] text-[var(--a-warn)]",
  error: "bg-[var(--a-error-tint)] text-[var(--a-error)]",
  info: "bg-[var(--a-info-tint)] text-[var(--a-info)]",
  gold: "bg-[var(--a-gold-tint)] text-[var(--a-gold)]",
};
const DOT = {
  neutral: "bg-[var(--a-text-3)]",
  accent: "bg-[var(--a-accent)]",
  success: "bg-[var(--a-success)]",
  warn: "bg-[var(--a-warn)]",
  error: "bg-[var(--a-error)]",
  info: "bg-[var(--a-info)]",
  gold: "bg-[var(--a-gold)]",
};
export const toneText = {
  neutral: "text-[var(--a-text-2)]",
  accent: "text-[var(--a-accent)]",
  success: "text-[var(--a-success)]",
  warn: "text-[var(--a-warn)]",
  error: "text-[var(--a-error)]",
  info: "text-[var(--a-info)]",
  gold: "text-[var(--a-gold)]",
};

/* ── Page structure ───────────────────────────────────────────────────── */
export const Page = ({ className = "", children }) => (
  <div className={cx("space-y-6 pb-4", className)}>{children}</div>
);

export const PageHeader = ({ title, subtitle, actions, children }) => (
  <header className="space-y-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-[34px] font-bold tracking-[-0.02em] text-[var(--a-text)] sm:text-[32px] sm:leading-[38px]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-[14px] leading-5 text-[var(--a-text-2)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </div>
    {children}
  </header>
);

export const Toolbar = ({ className = "", children }) => (
  <div className={cx("flex flex-wrap items-center gap-2", className)}>{children}</div>
);

export const SectionTitle = ({ title, subtitle, action, className = "" }) => (
  <div className={cx("flex items-end justify-between gap-3 px-1", className)}>
    <div className="min-w-0">
      <h2 className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-[var(--a-text)]">{title}</h2>
      {subtitle && <p className="text-[13px] leading-[18px] text-[var(--a-text-2)]">{subtitle}</p>}
    </div>
    {action}
  </div>
);

/* ── Surfaces ─────────────────────────────────────────────────────────── */
export const Card = ({ className = "", padded = true, as: Tag = "div", children, ...rest }) => (
  <Tag
    className={cx(
      "rounded-[14px] border border-[var(--a-line)] bg-[var(--a-card)] shadow-[var(--a-shadow)]",
      padded && "p-4 sm:p-5",
      className
    )}
    {...rest}
  >
    {children}
  </Tag>
);

export const CardHeader = ({ title, subtitle, action, className = "" }) => (
  <div className={cx("flex items-start justify-between gap-3 mb-4", className)}>
    <div className="min-w-0">
      <h3 className="text-[15px] leading-5 font-semibold text-[var(--a-text)]">{title}</h3>
      {subtitle && <p className="mt-0.5 text-[13px] leading-[18px] text-[var(--a-text-2)]">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const StatCard = ({ label, value, sub, icon: Icon, tone = "neutral", onClick, className = "" }) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cx(
        "text-left rounded-[14px] border border-[var(--a-line)] bg-[var(--a-card)] shadow-[var(--a-shadow)] p-4 sm:p-5 w-full",
        onClick && "pd-press cursor-pointer hover:bg-[var(--a-inset)] transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] leading-[18px] font-medium text-[var(--a-text-2)]">{label}</span>
        {Icon && <Icon className={cx("h-4 w-4", toneText[tone])} strokeWidth={2} />}
      </div>
      <div className="mt-2 text-[28px] leading-[34px] font-semibold tracking-[-0.02em] text-[var(--a-text)] pd-tabular">
        {value}
      </div>
      {sub && <div className="mt-1 text-[13px] leading-[18px] text-[var(--a-text-3)]">{sub}</div>}
    </Tag>
  );
};

/* ── Grouped list (macOS / iOS inset grouped) ─────────────────────────── */
export const List = ({ className = "", children }) => (
  <div
    className={cx(
      "rounded-[14px] border border-[var(--a-line)] bg-[var(--a-card)] shadow-[var(--a-shadow)] overflow-hidden",
      "divide-y divide-[var(--a-line)]",
      className
    )}
  >
    {children}
  </div>
);

export const ListRow = ({ leading, title, subtitle, trailing, onClick, className = "", children }) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cx(
        "w-full text-left flex items-center gap-3 px-4 py-3 min-h-[52px]",
        onClick && "cursor-pointer hover:bg-[var(--a-fill)] active:bg-[var(--a-fill-2)] transition-colors",
        className
      )}
    >
      {leading && <div className="shrink-0">{leading}</div>}
      <div className="min-w-0 flex-1">
        {title && <div className="text-[15px] leading-5 font-medium text-[var(--a-text)] truncate">{title}</div>}
        {subtitle && <div className="text-[13px] leading-[18px] text-[var(--a-text-2)] truncate">{subtitle}</div>}
        {children}
      </div>
      {trailing && <div className="shrink-0 flex items-center gap-2">{trailing}</div>}
    </Tag>
  );
};

/* Table for wide screens: hairline rows, tabular numbers */
export const Table = ({ className = "", children }) => (
  <div className={cx("rounded-[14px] border border-[var(--a-line)] bg-[var(--a-card)] shadow-[var(--a-shadow)] overflow-x-auto", className)}>
    <table className="w-full text-[14px] leading-5 pd-tabular">{children}</table>
  </div>
);
export const Th = ({ className = "", align = "left", children }) => (
  <th
    className={cx(
      "px-4 py-2.5 text-[12px] leading-4 font-medium text-[var(--a-text-3)] bg-[var(--a-inset)] border-b border-[var(--a-line)] whitespace-nowrap",
      align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
      className
    )}
  >
    {children}
  </th>
);
export const Td = ({ className = "", align = "left", children, ...rest }) => (
  <td
    className={cx(
      "px-4 py-3 text-[var(--a-text)] border-b border-[var(--a-line)] align-middle",
      align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left",
      className
    )}
    {...rest}
  >
    {children}
  </td>
);

/* ── Status pill ──────────────────────────────────────────────────────── */
export const StatusPill = ({ tone = "neutral", dot = false, icon: Icon, className = "", children }) => (
  <span
    className={cx(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[12px] leading-4 font-medium whitespace-nowrap",
      TONE[tone] || TONE.neutral,
      className
    )}
  >
    {dot && <span className={cx("h-1.5 w-1.5 rounded-full", DOT[tone] || DOT.neutral)} />}
    {Icon && <Icon className="h-3 w-3" strokeWidth={2.25} />}
    {children}
  </span>
);

/* Count badge (e.g. new orders) */
export const CountBadge = ({ children, tone = "accent", className = "" }) =>
  children ? (
    <span
      className={cx(
        "inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full px-1.5 text-[11px] leading-none font-semibold pd-tabular",
        tone === "accent" ? "bg-[var(--a-accent)] text-[#FFFFFF]" : "bg-[var(--a-fill-2)] text-[var(--a-text-2)]",
        className
      )}
    >
      {children}
    </span>
  ) : null;

/* ── Buttons ──────────────────────────────────────────────────────────── */
const BTN_VARIANT = {
  primary: "bg-[var(--a-accent)] text-[#FFFFFF] hover:bg-[var(--a-accent-press)] border border-transparent",
  secondary: "bg-[var(--a-card)] text-[var(--a-text)] border border-[var(--a-line-strong)] hover:bg-[var(--a-inset)]",
  tinted: "bg-[var(--a-fill)] text-[var(--a-text)] border border-transparent hover:bg-[var(--a-fill-2)]",
  plain: "bg-transparent text-[var(--a-accent)] border border-transparent hover:bg-[var(--a-fill)]",
  destructive: "bg-[var(--a-error-tint)] text-[var(--a-error)] border border-transparent hover:brightness-95",
  success: "bg-[var(--a-success)] text-[#FFFFFF] border border-transparent hover:brightness-95",
};
const BTN_SIZE = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-[10px]",
  md: "h-9 px-3.5 text-[14px] gap-2 rounded-[10px]",
  lg: "h-11 px-5 text-[15px] gap-2 rounded-[12px]",
};
export const Button = ({ variant = "secondary", size = "md", icon: Icon, className = "", children, type = "button", ...rest }) => (
  <button
    type={type}
    className={cx(
      "inline-flex items-center justify-center font-medium whitespace-nowrap pd-press cursor-pointer transition-colors",
      "disabled:opacity-45 disabled:cursor-not-allowed",
      BTN_VARIANT[variant] || BTN_VARIANT.secondary,
      BTN_SIZE[size] || BTN_SIZE.md,
      className
    )}
    {...rest}
  >
    {Icon && <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2} />}
    {children}
  </button>
);

export const IconButton = ({ icon: Icon, label, className = "", variant = "tinted", ...rest }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={cx(
      "inline-flex h-9 w-9 items-center justify-center rounded-[10px] pd-press cursor-pointer transition-colors",
      BTN_VARIANT[variant] || BTN_VARIANT.tinted,
      className
    )}
    {...rest}
  >
    <Icon className="h-4 w-4" strokeWidth={2} />
  </button>
);

/* ── Segmented control ───────────────────────────────────────────────── */
export const Segmented = ({ options, value, onChange, size = "md", className = "", stretch = false }) => (
  <div
    role="tablist"
    className={cx(
      "inline-flex max-w-full overflow-x-auto no-scrollbar rounded-[10px] bg-[var(--a-fill)] p-[3px] gap-[2px]",
      stretch && "flex w-full",
      className
    )}
  >
    {options.map((opt) => {
      const active = opt.value === value;
      const Icon = opt.icon;
      return (
        <button
          key={opt.value}
          role="tab"
          aria-selected={active}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cx(
            "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] font-medium transition-colors cursor-pointer",
            size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-8 px-3 text-[13px]",
            stretch && "flex-1",
            active
              ? "bg-[var(--a-card)] text-[var(--a-text)] shadow-[0_1px_2px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.04)]"
              : "text-[var(--a-text-2)] hover:text-[var(--a-text)]"
          )}
        >
          {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2} />}
          <span>{opt.label}</span>
          {opt.count ? <CountBadge>{opt.count}</CountBadge> : null}
        </button>
      );
    })}
  </div>
);

/* ── Form controls ───────────────────────────────────────────────────── */
const CONTROL =
  "w-full rounded-[10px] border border-[var(--a-line-strong)] bg-[var(--a-card)] px-3 text-[15px] text-[var(--a-text)] placeholder:text-[var(--a-text-3)] transition-colors";

export const Input = React.forwardRef(({ className = "", ...rest }, ref) => (
  <input ref={ref} className={cx(CONTROL, "h-10", className)} {...rest} />
));
Input.displayName = "AdminInput";

export const Textarea = React.forwardRef(({ className = "", rows = 3, ...rest }, ref) => (
  <textarea ref={ref} rows={rows} className={cx(CONTROL, "py-2.5 leading-5 resize-y", className)} {...rest} />
));
Textarea.displayName = "AdminTextarea";

export const Select = React.forwardRef(({ className = "", children, ...rest }, ref) => (
  <select ref={ref} className={cx(CONTROL, "h-10 pr-8 cursor-pointer", className)} {...rest}>
    {children}
  </select>
));
Select.displayName = "AdminSelect";

export const FormField = ({ label, hint, error, className = "", children }) => (
  <label className={cx("block space-y-1.5", className)}>
    {label && <span className="block text-[13px] leading-[18px] font-medium text-[var(--a-text-2)]">{label}</span>}
    {children}
    {error ? (
      <span className="block text-[12px] leading-4 text-[var(--a-error)]">{error}</span>
    ) : hint ? (
      <span className="block text-[12px] leading-4 text-[var(--a-text-3)]">{hint}</span>
    ) : null}
  </label>
);

/* iOS grouped form section */
export const FormGroup = ({ title, footer, className = "", children }) => (
  <section className={cx("space-y-1.5", className)}>
    {title && <h4 className="px-1 text-[12px] leading-4 font-medium uppercase tracking-[0.04em] text-[var(--a-text-3)]">{title}</h4>}
    <div className="rounded-[12px] border border-[var(--a-line)] bg-[var(--a-card)] divide-y divide-[var(--a-line)] overflow-hidden">
      {children}
    </div>
    {footer && <p className="px-1 text-[12px] leading-4 text-[var(--a-text-3)]">{footer}</p>}
  </section>
);
export const FormRow = ({ label, hint, className = "", children }) => (
  <div className={cx("flex items-center justify-between gap-4 px-4 py-3 min-h-[48px]", className)}>
    <div className="min-w-0">
      <div className="text-[15px] leading-5 text-[var(--a-text)]">{label}</div>
      {hint && <div className="text-[12px] leading-4 text-[var(--a-text-3)]">{hint}</div>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

export const Switch = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={!!checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange && onChange(!checked)}
    className={cx(
      "relative inline-flex h-[28px] w-[46px] shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-45",
      checked ? "bg-[var(--a-success)]" : "bg-[var(--a-fill-2)]"
    )}
  >
    <span
      className={cx(
        "inline-block h-[24px] w-[24px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-transform duration-200",
        checked ? "translate-x-[20px]" : "translate-x-[2px]"
      )}
    />
  </button>
);

export const SearchField = ({ value, onChange, placeholder = "Search", className = "" }) => (
  <div className={cx("relative", className)}>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--a-text-3)]" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-full rounded-[10px] bg-[var(--a-fill)] border border-transparent pl-9 pr-3 text-[14px] text-[var(--a-text)] placeholder:text-[var(--a-text-3)]"
    />
  </div>
);

/* ── Sheet: centred dialog on iPad / desktop, bottom sheet on phones ─── */
export const Sheet = ({ open, onClose, title, subtitle, footer, size = "md", children }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const width = size === "lg" ? "sm:max-w-3xl" : size === "sm" ? "sm:max-w-md" : "sm:max-w-xl";
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={cx(
          "relative w-full flex flex-col max-h-[92vh] bg-[var(--a-bg)] text-[var(--a-text)]",
          "rounded-t-[18px] sm:rounded-[18px] shadow-[var(--a-shadow-pop)] border border-[var(--a-line)]",
          width
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="sm:hidden flex justify-center pt-2">
          <span className="h-1 w-9 rounded-full bg-[var(--a-fill-2)]" />
        </div>
        <div className="flex items-start justify-between gap-3 px-5 pt-3 sm:pt-5 pb-3 border-b border-[var(--a-line)]">
          <div className="min-w-0">
            <h2 className="text-[17px] leading-6 font-semibold">{title}</h2>
            {subtitle && <p className="text-[13px] leading-[18px] text-[var(--a-text-2)]">{subtitle}</p>}
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--a-line)]">{footer}</div>}
      </div>
    </div>
  );
};

/* ── States ───────────────────────────────────────────────────────────── */
export const Skeleton = ({ className = "" }) => (
  <div className={cx("animate-pulse rounded-[10px] bg-[var(--a-fill-2)]", className)} />
);

export const LoadingState = ({ rows = 4, label = "Loading" }) => (
  <div className="space-y-6" aria-busy="true" aria-label={label}>
    <div className="space-y-2">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[104px] rounded-[14px]" />
      ))}
    </div>
    <div className="rounded-[14px] border border-[var(--a-line)] bg-[var(--a-card)] divide-y divide-[var(--a-line)]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export const EmptyState = ({ icon: Icon = Inbox, title, description, action, className = "" }) => (
  <div className={cx("flex flex-col items-center justify-center text-center py-14 px-6", className)}>
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--a-fill)]">
      <Icon className="h-5 w-5 text-[var(--a-text-3)]" strokeWidth={1.75} />
    </div>
    <h3 className="text-[15px] leading-5 font-semibold text-[var(--a-text)]">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-[13px] leading-[18px] text-[var(--a-text-2)]">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState = ({ title = "Couldn't load this", description, onRetry }) => (
  <EmptyState
    icon={AlertTriangle}
    title={title}
    description={description || "Check the connection and try again."}
    action={onRetry && <Button onClick={onRetry}>Try again</Button>}
  />
);

/* Small key/value line used in detail panes */
export const KeyValue = ({ label, value, strong, className = "" }) => (
  <div className={cx("flex items-center justify-between gap-3 text-[14px] leading-5", className)}>
    <span className="text-[var(--a-text-2)]">{label}</span>
    <span className={cx("pd-tabular text-right", strong ? "font-semibold text-[var(--a-text)]" : "text-[var(--a-text)]")}>{value}</span>
  </div>
);
