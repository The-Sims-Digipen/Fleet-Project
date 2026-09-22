import type { ReactNode } from "react";

export type StatusBannerTone = "ok" | "warning" | "danger" | "info";

export type StatusBannerProps = {
  /** Semantic tone controlling colour, icon, and ARIA role. */
  tone?: StatusBannerTone;
  /** Optional bold lead-in shown before the message. */
  title?: ReactNode;
  children: ReactNode;
  /** Override the leading glyph. Defaults to a per-tone icon. */
  icon?: ReactNode;
  className?: string;
};

const toneIcon: Record<StatusBannerTone, string> = {
  ok: "✓",
  warning: "▲",
  danger: "✕",
  info: "ℹ",
};

const toneClasses: Record<StatusBannerTone, string> = {
  ok: "border-status-success/30 bg-status-success/10 text-status-success",
  warning: "border-status-warning/30 bg-status-warning/10 text-status-warning",
  danger: "border-status-danger/30 bg-status-danger/10 text-status-danger",
  info: "border-chargedup-blue/30 bg-chargedup-blue/10 text-chargedup-blue",
};

/**
 * StatusBanner — a full-width status strip with a leading glyph and a message.
 *
 * Unlike `Alert` (a dismissible notice), StatusBanner reflects a live computed
 * condition: it flips its ARIA role to `alert` for the danger tone so assistive
 * tech announces threshold breaches, and stays `status` (polite) otherwise.
 */
export function StatusBanner({
  tone = "info",
  title,
  children,
  icon,
  className,
}: StatusBannerProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={[
        "flex items-center gap-2.5 rounded-[6px] border px-3 py-2 font-body text-sm",
        toneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden="true" className="shrink-0 text-base leading-none">
        {icon ?? toneIcon[tone]}
      </span>
      <span className="min-w-0 flex-1">
        {title != null && <b className="font-semibold">{title} </b>}
        {children}
      </span>
    </div>
  );
}
