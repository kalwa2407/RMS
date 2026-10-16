import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva } from "class-variance-authority";
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 left-0 right-0 z-[100] flex w-full max-w-[430px] mx-auto flex-col pointer-events-none items-center px-3 space-y-2",
      className
    )}
    style={{
      paddingTop: "calc(max(env(safe-area-inset-top, 0px), 24px) + 12px)",
    }}
    {...props} />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start space-x-3 overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 pr-8 shadow-2xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-top-full data-[state=open]:slide-in-from-top-6 data-[state=open]:zoom-in-95 duration-300 backdrop-blur-2xl border",
  {
    variants: {
      variant: {
        default:
          "bg-[#18181B]/95 text-white border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.5)] ring-1 ring-black/40",
        royal:
          "bg-gradient-to-r from-[#1C1917] via-[#161412] to-[#0F0D0C] text-white border-amber-400/50 shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-1 ring-amber-400/30",
        destructive:
          "destructive group bg-[#E40000] text-white border-red-600 shadow-xl shadow-red-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props} />
  );
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-bold text-white transition-colors hover:bg-white/20 focus:outline-none disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props} />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-full p-1.5 text-white/50 opacity-80 transition-opacity hover:text-white hover:bg-white/15 focus:opacity-100 focus:outline-none active:scale-90",
      className
    )}
    toast-close=""
    {...props}>
    <X className="h-3.5 w-3.5" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold [&+div]:text-xs", className)}
    {...props} />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Description ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction };
