import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type SplitPaneOrientation = "horizontal" | "vertical";

export type SplitPaneProps = {
  /** First (primary) pane content. */
  children: [ReactNode, ReactNode];
  /**
   * Layout direction.
   * - `horizontal` (default): panes sit side by side; the divider resizes width.
   * - `vertical`: panes stack; the divider resizes height.
   */
  orientation?: SplitPaneOrientation;
  /** Size of the SECOND pane as a percentage of the container (0–100). */
  size?: number;
  /** Initial size of the second pane when uncontrolled. Defaults to 40. */
  defaultSize?: number;
  /** Called with the new second-pane percentage as the divider moves. */
  onSizeChange?: (size: number) => void;
  /** Minimum second-pane percentage. Defaults to 15. */
  min?: number;
  /** Maximum second-pane percentage. Defaults to 85. */
  max?: number;
  /** Keyboard step in percentage points. Defaults to 2. */
  step?: number;
  /** Accessible label for the divider. */
  label?: string;
  className?: string;
};

/**
 * SplitPane — two panes separated by a draggable divider.
 *
 * The divider is an accessible `separator` with full keyboard support (arrow
 * keys, Home, End) and the `aria-value*` attributes screen readers announce.
 * Sizing is controlled or uncontrolled: pass `size` + `onSizeChange` to control
 * it, or `defaultSize` to let the component manage it. The measured value is the
 * SECOND pane's percentage of the container.
 */
export function SplitPane({
  children,
  orientation = "horizontal",
  size,
  defaultSize = 40,
  onSizeChange,
  min = 15,
  max = 85,
  step = 2,
  label = "Resize panes",
  className,
}: SplitPaneProps) {
  const container = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [uncontrolled, setUncontrolled] = useState(defaultSize);
  const current = size ?? uncontrolled;
  const vertical = orientation === "vertical";
  const [first, second] = children;

  const clamp = useCallback((value: number) => Math.min(max, Math.max(min, value)), [min, max]);

  const commit = useCallback(
    (value: number) => {
      const next = clamp(value);
      if (size === undefined) setUncontrolled(next);
      onSizeChange?.(next);
    },
    [clamp, onSizeChange, size],
  );

  const measure = useCallback(
    (clientX: number, clientY: number) => {
      const rect = container.current?.getBoundingClientRect();
      if (!rect) return;
      // Second pane grows from the far edge, so measure from bottom/right.
      const pct = vertical
        ? ((rect.bottom - clientY) / rect.height) * 100
        : ((rect.right - clientX) / rect.width) * 100;
      commit(pct);
    },
    [commit, vertical],
  );

  return (
    <div
      ref={container}
      className={[
        "grid min-h-0 min-w-0 overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        vertical
          ? { gridTemplateRows: `minmax(0,1fr) 6px ${current}%` }
          : { gridTemplateColumns: `minmax(0,1fr) 6px ${current}%` }
      }
    >
      <div className="min-h-0 min-w-0 overflow-auto">{first}</div>

      <div
        role="separator"
        tabIndex={0}
        aria-label={label}
        aria-orientation={vertical ? "horizontal" : "vertical"}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Math.round(current)}
        aria-valuetext={`${Math.round(current)}%`}
        className={[
          "group relative touch-none select-none border-chargedup-night/10 bg-chargedup-night/5 focus-visible:outline-none",
          vertical ? "cursor-row-resize border-y" : "cursor-col-resize border-x",
        ].join(" ")}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.focus();
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;
          measure(event.clientX, event.clientY);
        }}
        onPointerUp={(event) => {
          dragging.current = false;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
        onLostPointerCapture={() => {
          dragging.current = false;
        }}
        onKeyDown={(event) => {
          const grow = vertical ? "ArrowUp" : "ArrowLeft";
          const shrink = vertical ? "ArrowDown" : "ArrowRight";
          if (![grow, shrink, "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          if (event.key === "Home") commit(min);
          else if (event.key === "End") commit(max);
          else commit(current + (event.key === grow ? step : -step));
        }}
      >
        <span
          aria-hidden="true"
          className={[
            "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-chargedup-night/25 transition-colors group-hover:bg-chargedup-blue group-focus-visible:bg-chargedup-blue",
            vertical ? "h-[2px] w-9" : "h-9 w-[2px]",
          ].join(" ")}
        />
      </div>

      <div className="min-h-0 min-w-0 overflow-auto">{second}</div>
    </div>
  );
}
