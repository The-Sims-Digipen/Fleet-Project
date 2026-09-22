import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DataTable,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableHeaderCell,
  DataTableCell,
} from "./components/DataTable";

function Example() {
  return (
    <DataTable caption="Yearly costs">
      <DataTableHead>
        <DataTableRow>
          <DataTableHeaderCell>Year</DataTableHeaderCell>
          <DataTableHeaderCell numeric highlighted>
            Diesel
          </DataTableHeaderCell>
        </DataTableRow>
      </DataTableHead>
      <DataTableBody>
        <DataTableRow selected>
          <DataTableCell>2026</DataTableCell>
          <DataTableCell numeric highlighted>
            $1,200
          </DataTableCell>
        </DataTableRow>
      </DataTableBody>
    </DataTable>
  );
}

describe("DataTable", () => {
  it("renders a table with an accessible caption name", () => {
    render(<Example />);

    expect(screen.getByRole("table", { name: "Yearly costs" })).toBeInTheDocument();
  });

  it("exposes column headers with scope=col", () => {
    render(<Example />);

    const diesel = screen.getByRole("columnheader", { name: "Diesel" });
    expect(diesel).toHaveAttribute("scope", "col");
  });

  it("marks the selected row via aria-selected", () => {
    render(<Example />);

    const cell = screen.getByRole("cell", { name: "2026" });
    const row = cell.closest("tr");
    expect(row).toHaveAttribute("aria-selected", "true");
  });

  it("applies the highlighted class to highlighted cells", () => {
    render(<Example />);

    expect(screen.getByRole("cell", { name: "$1,200" })).toHaveClass("bg-chargedup-blue/8");
  });

  it("hides the caption visually while keeping it accessible", () => {
    render(
      <DataTable caption="Hidden cap" hideCaption>
        <DataTableBody>
          <DataTableRow>
            <DataTableCell>x</DataTableCell>
          </DataTableRow>
        </DataTableBody>
      </DataTable>,
    );

    const table = screen.getByRole("table", { name: "Hidden cap" });
    const caption = within(table).getByText("Hidden cap");
    expect(caption).toHaveClass("sr-only");
  });
});
