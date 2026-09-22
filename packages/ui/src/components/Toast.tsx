import { type ReactNode } from "react";

export type ToastTone = "info" | "success" | "warning" | "danger";

export type ToastProps = {
  /** Semantic tone controlling colour, icon, and ARIA politeness. */
  tone?: ToastTone;
  children: ReactNode;
  /** When provided, renders a dismiss button that calls this handler. */
  onDismiss?: () => void;
  /** Accessible label for the dismiss button. */
  dismissLabel?: string;
  className?: string;
};

const toneIcon: Record<ToastTone, string> = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  danger: "✕",
};

const toneClasses: Record<ToastTone, string> = {
  info: "border-chargedup-blue/30 bg-chargedup-blue/10 text-chargedup-blue",
  success: "border-status-success/30 bg-status-success/10 text-status-success",
  warning: "border-status-warning/30 bg-status-warning/10 text-status-warning",
  danger: "border-status-danger/30 bg-status-danger/10 text-status-danger",
};

/**
 * Toast — a transient, self-contained status message.
 *
 * This is the presentational surface only: it owns styling, the leading icon,
 * ARIA politeness, and an optional dismiss control. Positioning (fixed corner,
 * stacking) and auto-dismiss timing are left to a consumer-owned container so
 * the same toast can appear inline or floating. The danger tone announces
 * assertively (`role="alert"`); other tones announce politely (`role="status"`).
 */
export function Toast({ tone = "info", children, onDismiss, dismissLabel = "Dismiss", className }: ToastProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={[
        "flex items-center gap-2.5 rounded-[8px] border px-3.5 py-2.5 font-body text-sm shadow-md",
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden="true" className="shrink-0 text-base leading-none">
        {toneIcon[tone]}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      {onDismiss && (
        <button
          type="button"
          aria-label={dismissLabel}
          onClick={onDismiss}
          className="-mr-1 flex size-6 shrink-0 items-center justify-center rounded hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

export type ToastViewportPlacement =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center";

export type ToastViewportProps = {
  children: ReactNode;
  /** Corner or edge the stack is pinned to. */
  placement?: ToastViewportPlacement;
  className?: string;
};

const placementClasses: Record<ToastViewportPlacement, string> = {
  "top-right": "top-4 right-4 items-end",
  "top-left": "top-4 left-4 items-start",
  "bottom-right": "bottom-4 right-4 items-end",
  "bottom-left": "bottom-4 left-4 items-start",
  "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
};

/**
 * ToastViewport — a fixed-position stack container for `Toast`s.
 *
 * Pins toasts to a screen corner or edge above modals. Positioning only; the
 * toasts themselves carry the live-region roles.
 */
export function ToastViewport({ children, placement = "bottom-right", className }: ToastViewportProps) {
  return (
    <div
      className={[
        "pointer-events-none fixed z-[300] flex max-w-[calc(100vw-2rem)] flex-col gap-2",
        placementClasses[placement],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Re-enable pointer events on the toasts themselves so buttons stay clickable. */}
      <div className="pointer-events-auto flex flex-col gap-2">{children}</div>
    </div>
  );
}
