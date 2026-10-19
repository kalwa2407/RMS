import { useToast } from "../../hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"
import { ShoppingBag, AlertCircle, MapPin } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isTable = title && (title.includes('Table') || title.includes('Reserved') || title.includes('Reservation') || title.includes('Booking'));
        const isOrder = title && (title.includes('Order') || title.includes('Cart') || title.includes('Coupon'));
        const isLoc = title && (title.includes('Location') || title.includes('GPS') || title.includes('Address') || title.includes('Branch'));
        const isDestructive = variant === 'destructive' || (title && (title.includes('Error') || title.includes('Invalid') || title.includes('Failed')));

        // Pick appropriate luxury icon
        let iconContent = (
          <img
            src="/persian_darbar_crown_logo.png"
            alt="Persian Darbar"
            className="w-8 h-8 rounded-xl object-contain drop-shadow"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        );

        if (isDestructive) {
          iconContent = (
            <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
              <AlertCircle className="w-4 h-4" />
            </div>
          );
        } else if (isOrder) {
          iconContent = (
            <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-[#E40000]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          );
        } else if (isLoc) {
          iconContent = (
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/25 flex items-center justify-center text-white">
              <MapPin className="w-4 h-4" />
            </div>
          );
        }

        const cleanTitle = title ? title.replace(/^[^\w\s]+/, '').trim() : '';

        return (
          <Toast key={id} variant={variant || (isTable ? 'royal' : 'default')} {...props}>
            <div className="shrink-0 mt-0.5">
              {iconContent}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              {cleanTitle && (
                <div className="flex items-center space-x-1.5">
                  <ToastTitle className="text-xs font-black text-white tracking-tight leading-snug">
                    {cleanTitle}
                  </ToastTitle>
                  {isTable && (
                    <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-400/20 border border-amber-400/40 px-1.5 py-0.2 rounded-full">
                      VIP PASS
                    </span>
                  )}
                </div>
              )}
              {description && (
                <ToastDescription className="text-[11px] font-medium text-neutral-300 leading-snug mt-0.5">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
