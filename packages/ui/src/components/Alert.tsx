import type { ReactNode } from "react";

export type AlertVariant = "info" | "success" | "warning" | "danger";

export type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
};

const icons: Record<AlertVariant, string> = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  danger: "✕",
};

const variantClasses: Record<AlertVariant, { wrapper: string; icon: string; title: string; body: string }> = {
  info: {
    wrapper: "bg-chargedup-blue/8 border-chargedup-blue/25",
    icon: "text-chargedup-blue",
    title: "text-chargedup-blue",
    body: "text-chargedup-blue/80",
  },
  success: {
    wrapper: "bg-status-success/8 border-status-success/25",
    icon: "text-status-success",
    title: "text-status-success",
    body: "text-status-success/80",
  },
  warning: {
    wrapper: "bg-status-warning/8 border-status-warning/25",
    icon: "text-status-warning",
    title: "text-status-warning",
    body: "text-status-warning/80",
  },
  danger: {
    wrapper: "bg-status-danger/8 border-status-danger/25",
    icon: "text-status-danger",
    title: "text-status-danger",
    body: "text-status-danger/80",
  },
};

export function Alert({ variant = "info", title, children, onDismiss }: AlertProps) {
  const v = variantClasses[variant];

  return (
    <div
      role="alert"
      className={`flex gap-3 rounded-[6px] border px-4 py-3 ${v.wrapper}`}
    >
      <span className={`mt-0.5 shrink-0 text-base ${v.icon}`} aria-hidden="true">
        {icons[variant]}
      </span>
      <div className="min-w-0 flex-1">
        {title && (
          <p className={`mb-0.5 font-heading text-sm font-bold ${v.title}`}>{title}</p>
        )}
        <p className={`font-body text-sm leading-relaxed ${v.body}`}>{children}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className={`-mr-1 -mt-0.5 flex size-7 shrink-0 items-center justify-center rounded hover:opacity-70 ${v.icon}`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
