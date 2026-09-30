import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  type ThHTMLAttributes,
  type TdHTMLAttributes,
} from "react";

/**
 * DataTable — a composable, bordered, horizontally scrollable table.
 *
 * Rather than a single monolithic API, the family is a set of slot pieces so the
 * same frame can present year-by-year cost tables, transition roadmaps, and other
 * tabular data. A `highlighted` flag on cells drives the selected-column styling
 * used across the product comparison views.
 *
 * Composition:
 *   <DataTable caption="Yearly costs">
 *     <DataTableHead>
 *       <DataTableRow>
 *         <DataTableHeaderCell>Year</DataTableHeaderCell>
 *         <DataTableHeaderCell numeric>Diesel</DataTableHeaderCell>
 *       </DataTableRow>
 *     </DataTableHead>
 *     <DataTableBody>
 *       <DataTableRow>
 *         <DataTableCell>2026</DataTableCell>
 *         <DataTableCell numeric highlighted>$1,200</DataTableCell>
 *       </DataTableRow>
 *     </DataTableBody>
 *   </DataTable>
 */

export type DataTableProps = ComponentPropsWithoutRef<"table"> & {
  /** Accessible caption. Visually shown above the table unless `hideCaption`. */
  caption?: ReactNode;
  /** Visually hide the caption while keeping it available to assistive tech. */
  hideCaption?: boolean;
};

/** Bordered, scrollable frame wrapping a semantic `<table>`. */
export function DataTable({ caption, hideCaption = false, className, children, ...props }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-chargedup-night/15">
      <table
        className={[
          "w-full border-collapse text-left font-body text-sm",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {caption != null && (
          <caption
            className={
              hideCaption
                ? "sr-only"
                : "px-4 py-2.5 text-left font-body text-xs font-semibold uppercase tracking-[0.12em] text-chargedup-night/55"
            }
          >
            {caption}
          </caption>
        )}
        {children}
      </table>
    </div>
  );
}

export type DataTableHeadProps = ComponentPropsWithoutRef<"thead">;

export function DataTableHead({ className, ...props }: DataTableHeadProps) {
  return (
    <thead
      className={["bg-chargedup-night/5", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export type DataTableBodyProps = ComponentPropsWithoutRef<"tbody">;

export function DataTableBody(props: DataTableBodyProps) {
  return <tbody {...props} />;
}

export type DataTableRowProps = ComponentPropsWithoutRef<"tr"> & {
  /** Marks the row as the current selection. */
  selected?: boolean;
};

export function DataTableRow({ selected = false, className, ...props }: DataTableRowProps) {
  return (
    <tr
      aria-selected={selected || undefined}
      className={[
        "border-t border-chargedup-night/10 first:border-t-0",
        selected ? "bg-chargedup-blue/8" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export type DataTableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement> & {
  /** Right-align for numeric columns. */
  numeric?: boolean;
  /** Apply the selected-column highlight. */
  highlighted?: boolean;
};

export function DataTableHeaderCell({
  numeric = false,
  highlighted = false,
  scope = "col",
  className,
  ...props
}: DataTableHeaderCellProps) {
  return (
    <th
      scope={scope}
      className={[
        "px-4 py-3 font-heading text-xs font-bold uppercase tracking-[0.1em] text-chargedup-night/60",
        numeric ? "text-right tabular-nums" : "text-left",
        highlighted ? "bg-chargedup-blue/10 text-chargedup-night" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export type DataTableCellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  /** Right-align for numeric columns. */
  numeric?: boolean;
  /** Apply the selected-column highlight. */
  highlighted?: boolean;
};

export function DataTableCell({
  numeric = false,
  highlighted = false,
  className,
  ...props
}: DataTableCellProps) {
  return (
    <td
      className={[
        "px-4 py-3 text-chargedup-night/80",
        numeric ? "text-right tabular-nums" : "text-left",
        highlighted ? "bg-chargedup-blue/8 font-semibold text-chargedup-night" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
