import {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableHeaderCell,
  DataTableCell,
} from "@chargedup/ui";
import { PageHeading, ImportBanner, SectionHeading } from "../components/Headings";
import { ComponentSection } from "../components/ComponentSection";
import { LivePreview } from "../components/Preview";
import type { PropsRow } from "../components/PropsTable";

const props: PropsRow[] = [
  { name: "caption", type: "ReactNode", description: "Accessible caption, shown above the table unless hideCaption is set." },
  { name: "hideCaption", type: "boolean", default: "false", description: "Visually hide the caption while keeping it available to assistive tech." },
  { name: "numeric", type: "boolean", default: "false", description: "On a cell: right-align and use tabular figures for numeric columns." },
  { name: "highlighted", type: "boolean", default: "false", description: "On a cell: apply the selected-column highlight." },
  { name: "selected", type: "boolean", default: "false", description: "On a row: apply the selected-row highlight and aria-selected." },
];

const rows = [
  { year: 2026, diesel: "$8,400", electric: "$3,900" },
  { year: 2027, diesel: "$8,700", electric: "$3,950" },
  { year: 2028, diesel: "$9,050", electric: "$4,010" },
];

export function DataTablePage() {
  return (
    <div className="grid gap-10">
      <PageHeading
        title="Data Table"
        description="A composable, bordered, horizontally scrollable table. Compose the head, body, rows, and cells; flag numeric columns for right-aligned figures and highlight a selected column or row."
      />
      <ImportBanner importStr='import { DataTable, DataTableHead, DataTableBody, DataTableRow, DataTableHeaderCell, DataTableCell } from "@chargedup/ui";' />

      <SectionHeading>Examples</SectionHeading>

      <ComponentSection
        title="Year-by-year costs"
        description="A numeric table with a highlighted electric column and a selected row."
        preview={
          <LivePreview className="flex-col">
            <div className="w-full">
              <DataTable caption="Projected running costs by year">
                <DataTableHead>
                  <DataTableRow>
                    <DataTableHeaderCell>Year</DataTableHeaderCell>
                    <DataTableHeaderCell numeric>Diesel</DataTableHeaderCell>
                    <DataTableHeaderCell numeric highlighted>
                      Electric
                    </DataTableHeaderCell>
                  </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                  {rows.map((r) => (
                    <DataTableRow key={r.year} selected={r.year === 2027}>
                      <DataTableCell>{r.year}</DataTableCell>
                      <DataTableCell numeric>{r.diesel}</DataTableCell>
                      <DataTableCell numeric highlighted>
                        {r.electric}
                      </DataTableCell>
                    </DataTableRow>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          </LivePreview>
        }
        code={`<DataTable caption="Projected running costs by year">
  <DataTableHead>
    <DataTableRow>
      <DataTableHeaderCell>Year</DataTableHeaderCell>
      <DataTableHeaderCell numeric>Diesel</DataTableHeaderCell>
      <DataTableHeaderCell numeric highlighted>Electric</DataTableHeaderCell>
    </DataTableRow>
  </DataTableHead>
  <DataTableBody>
    <DataTableRow selected>
      <DataTableCell>2027</DataTableCell>
      <DataTableCell numeric>$8,700</DataTableCell>
      <DataTableCell numeric highlighted>$3,950</DataTableCell>
    </DataTableRow>
  </DataTableBody>
</DataTable>`}
        props={props}
      />
    </div>
  );
}
