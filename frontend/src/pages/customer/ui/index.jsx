// Darbar UI: small presentational primitives shared by the customer app.
// Colors, radii and shadows come from the `pd-*` tokens in tailwind.config.js.
import React from 'react';
import { Minus, Plus } from 'lucide-react';

export const cx = (...parts) => parts.filter(Boolean).join(' ');

export const formatINR = (value) => {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

/* Veg / non-veg mark (FSSAI style square with dot / triangle). */
export const VegMark = ({ veg, size = 14, className = '' }) => {
  const color = veg ? 'var(--pd-veg)' : 'var(--pd-nonveg)';
  return (
    <span
      role="img"
      aria-label={veg ? 'Vegetarian' : 'Non-vegetarian'}
      className={cx('inline-flex items-center justify-center shrink-0 rounded-[3px] bg-white', className)}
      style={{ width: size, height: size, border: `1.5px solid ${color}` }}
    >
      {veg ? (
        <span className="rounded-full" style={{ width: size * 0.42, height: size * 0.42, background: color }} />
      ) : (
        <span
          style={{
            width: 0,
            height: 0,
            borderLeft: `${size * 0.24}px solid transparent`,
            borderRight: `${size * 0.24}px solid transparent`,
            borderBottom: `${size * 0.4}px solid ${color}`,
          }}
        />
      )}
    </span>
  );
};

export const Price = ({ value, className = '' }) => (
  <span className={cx('pd-tabular', className)}>{formatINR(value)}</span>
);

/* ADD button that morphs into a quantity stepper once the dish is in the cart. */
export const AddStepper = ({ quantity = 0, onAdd, onIncrement, onDecrement, size = 'md', className = '', label = 'ADD' }) => {
  const h = size === 'sm' ? 'h-8' : 'h-9';
  const w = size === 'sm' ? 'w-[84px]' : 'w-[96px]';
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn?.();
  };

  if (quantity > 0) {
    return (
      <div
        className={cx(
          'flex items-center justify-between rounded-[10px] bg-pd-action text-white shadow-pd-2',
          h,
          w,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Remove one"
          onClick={stop(onDecrement)}
          className="h-full px-2.5 flex items-center justify-center pd-press"
        >
          <Minus className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <span className="text-[15px] font-semibold pd-tabular" aria-live="polite">
          {quantity}
        </span>
        <button
          type="button"
          aria-label="Add one more"
          onClick={stop(onIncrement)}
          className="h-full px-2.5 flex items-center justify-center pd-press"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={stop(onAdd)}
      className={cx(
        'rounded-[10px] bg-white text-pd-action border border-pd-action/25 shadow-pd-2',
        'text-[15px] font-bold tracking-wide pd-press hover:bg-pd-action-tint',
        h,
        w,
        className
      )}
    >
      {label}
    </button>
  );
};

export const SectionHeader = ({ title, subtitle, action, onAction, className = '' }) => (
  <div className={cx('flex items-end justify-between gap-3 px-4', className)}>
    <div className="min-w-0">
      <h2 className="text-[19px] leading-6 font-bold text-pd-ink tracking-[-0.01em] truncate">{title}</h2>
      {subtitle && <p className="text-[13px] leading-[18px] text-pd-ink-2 mt-0.5 truncate">{subtitle}</p>}
    </div>
    {action && (
      <button
        type="button"
        onClick={onAction}
        className="shrink-0 text-[14px] font-semibold text-pd-action pd-press py-1"
      >
        {action}
      </button>
    )}
  </div>
);

export const Chip = ({ active, onClick, children, className = '', ...rest }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={Boolean(active)}
    className={cx(
      'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-[14px] font-medium shrink-0 pd-press transition-colors',
      active
        ? 'bg-pd-ink text-white border-pd-ink'
        : 'bg-white text-pd-ink border-[color:var(--pd-line)] hover:bg-pd-surface',
      className
    )}
    {...rest}
  >
    {children}
  </button>
);

export const Skeleton = ({ className = '' }) => (
  <div className={cx('animate-pulse rounded-[10px] bg-[#ECEAE6]', className)} />
);

export const DishRowSkeleton = () => (
  <div className="flex gap-4 py-5 px-4">
    <div className="flex-1 space-y-2.5">
      <Skeleton className="w-3.5 h-3.5 rounded-[3px]" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
    <Skeleton className="w-[118px] h-[118px] rounded-[14px]" />
  </div>
);

export const EmptyState = ({ icon: Icon, title, message, actionLabel, onAction, className = '' }) => (
  <div className={cx('flex flex-col items-center text-center px-8 py-12', className)}>
    {Icon && (
      <div className="w-14 h-14 rounded-full bg-pd-surface flex items-center justify-center text-pd-ink-2 mb-4">
        <Icon className="w-6 h-6" strokeWidth={1.75} />
      </div>
    )}
    <h3 className="text-[17px] font-semibold text-pd-ink">{title}</h3>
    {message && <p className="text-[14px] text-pd-ink-2 mt-1 max-w-[280px]">{message}</p>}
    {actionLabel && (
      <button
        type="button"
        onClick={onAction}
        className="mt-5 h-11 px-5 rounded-[12px] bg-pd-action text-white text-[15px] font-semibold pd-press"
      >
        {actionLabel}
      </button>
    )}
  </div>
);
