import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

/**
 * ListPanel — a composable container for a toolbar + scrollable selectable list + footer.
 *
 * Rather than a single monolithic component, the family is a set of slot pieces so the
 * same frame can be reused for different content: vehicle presets, world/scenario browsers,
 * scene objects, and so on. Consumers drop whatever leading/trailing content they need into
 * each `ListPanelItem` (a status dot, an icon, a `Badge`, a count, an "ACTIVE" marker).
 *
 * Composition:
 *   <ListPanel>
 *     <ListPanelToolbar title="Worlds" trailing={<span>3</span>}>…buttons…</ListPanelToolbar>
 *     <ListPanelBody empty={items.length === 0} emptyMessage="No items yet.">
 *       <ListPanelItems label="Worlds">
 *         {items.map((it) => (
 *           <ListPanelItem key={it.id} selected leading={<Dot />} trailing={<Tag />} onSelect={…}>
 *             {it.name}
 *           </ListPanelItem>
 *         ))}
 *       </ListPanelItems>
 *     </ListPanelBody>
 *     <ListPanelFooter status="3 items">…actions…</ListPanelFooter>
 *   </ListPanel>
 */

export type ListPanelProps = ComponentPropsWithoutRef<"div">;

/** Bordered, rounded frame that holds the toolbar, body, and footer slots. */
export function ListPanel({ className, children, ...props }: ListPanelProps) {
  return (
    <div
      className={[
        "overflow-hidden rounded-[10px] border border-ink/15 bg-surface-raised",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export type ListPanelToolbarProps = ComponentPropsWithoutRef<"div"> & {
  /** Optional leading title/eyebrow (e.g. "Worlds"). */
  title?: ReactNode;
  /** Optional trailing content pinned to the right (e.g. a count). */
  trailing?: ReactNode;
};

/** Top bar: an optional title, a group of action controls, and optional trailing content. */
export function ListPanelToolbar({
  title,
  trailing,
  className,
  children,
  ...props
}: ListPanelToolbarProps) {
  return (
    <div
      className={[
        "flex flex-wrap items-center gap-1.5 border-b border-ink/10 px-3 py-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {title != null && (
        <span className="mr-auto font-body text-xs font-semibold uppercase tracking-[0.12em] text-ink/65">
          {title}
        </span>
      )}
      {children}
      {trailing != null && (
        <span className="ml-auto font-body text-xs text-ink/55">{trailing}</span>
      )}
    </div>
  );
}

export type ListPanelBodyProps = ComponentPropsWithoutRef<"div"> & {
  /** When true, renders the empty state instead of children. */
  empty?: boolean;
  /** Message shown when `empty` is true. */
  emptyMessage?: ReactNode;
};

/**
 * Scrollable region for the list. Height is controlled by the consumer via className
 * (e.g. `h-44`, `max-h-52`) so the same body can be short or tall.
 */
export function ListPanelBody({
  empty = false,
  emptyMessage = "Nothing here yet.",
  className,
  children,
  ...props
}: ListPanelBodyProps) {
  return (
    <div
      className={[
        "overflow-y-auto overscroll-contain p-1.5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {empty ? (
        <p className="px-2 py-4 font-body text-xs text-ink/55">{emptyMessage}</p>
      ) : (
        children
      )}
    </div>
  );
}

export type ListPanelItemsProps = ComponentPropsWithoutRef<"ul"> & {
  /** Accessible label for the list, applied as aria-label. */
  label?: string;
};

/** Semantic `<ul>` wrapper for `ListPanelItem` rows. */
export function ListPanelItems({ label, className, children, ...props }: ListPanelItemsProps) {
  return (
    <ul
      aria-label={label}
      className={["m-0 list-none p-0", className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </ul>
  );
}

export type ListPanelItemProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "type" | "children"
> & {
  /** Primary label content, rendered in the middle and truncated when long. */
  children: ReactNode;
  /** Whether this row is the current selection. Drives `aria-pressed` and selected styling. */
  selected?: boolean;
  /** Optional leading slot (icon, status dot). Marked aria-hidden. */
  leading?: ReactNode;
  /** Optional trailing slot (badge, count, status marker). Marked aria-hidden. */
  trailing?: ReactNode;
  /** Selection handler. */
  onSelect?: () => void;
};

/**
 * A selectable row rendered as an `<li><button></li>`. Uses `aria-pressed` to expose the
 * selected state, matching the toggle semantics used across the product panels.
 */
export const ListPanelItem = forwardRef<HTMLButtonElement, ListPanelItemProps>(
  function ListPanelItem(
    { children, selected = false, leading, trailing, onSelect, className, disabled, ...props },
    ref,
  ) {
    return (
      <li>
        <button
          ref={ref}
          type="button"
          aria-pressed={selected}
          disabled={disabled}
          onClick={onSelect}
          className={[
            "flex min-h-9 w-full items-center gap-2 rounded-[4px] px-2 py-1.5 text-left font-body text-sm transition-colors duration-150",
            "text-ink/70 hover:bg-ink/5 hover:text-ink",
            "aria-pressed:bg-accent/12 aria-pressed:text-ink",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "motion-reduce:transition-none",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          {leading != null && (
            <span
              aria-hidden="true"
              className={`flex shrink-0 items-center ${selected ? "text-accent" : "text-ink/45"}`}
            >
              {leading}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate">{children}</span>
          {trailing != null && (
            <span aria-hidden="true" className="shrink-0 text-ink/50">
              {trailing}
            </span>
          )}
        </button>
      </li>
    );
  },
);

export type ListPanelFooterProps = ComponentPropsWithoutRef<"div"> & {
  /** Left-aligned status text (e.g. "5 presets"). */
  status?: ReactNode;
};

/** Bottom bar: left status text and right-aligned actions. */
export function ListPanelFooter({
  status,
  className,
  children,
  ...props
}: ListPanelFooterProps) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-1.5 border-t border-ink/10 px-3 py-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {status != null ? (
        <span className="font-body text-xs text-ink/55">{status}</span>
      ) : (
        <span />
      )}
      {children != null && <span className="flex items-center gap-1.5">{children}</span>}
    </div>
  );
}
