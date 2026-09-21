import { describe, expect, it } from "vitest";
import { nextSort, sortRows } from "./sort";

type Row = { no: string; amount?: number | null };
const valueOf = (row: Row, key: string) => row[key as keyof Row];

describe("sortRows", () => {
  const rows: Row[] = [
    { no: "40/2569", amount: 3 },
    { no: "9/2569", amount: null },
    { no: "100/2569", amount: 1 },
  ];

  it("returns the same array when nothing is sorted", () => {
    expect(sortRows(rows, {}, valueOf)).toBe(rows);
  });

  it("compares the numbers inside text as numbers", () => {
    const sorted = sortRows(rows, { sortBy: "no", sortOrder: "asc" }, valueOf);
    expect(sorted.map((r) => r.no)).toEqual(["9/2569", "40/2569", "100/2569"]);
  });

  it("reverses for desc without touching the input", () => {
    const sorted = sortRows(rows, { sortBy: "no", sortOrder: "desc" }, valueOf);
    expect(sorted.map((r) => r.no)).toEqual(["100/2569", "40/2569", "9/2569"]);
    expect(rows[0].no).toBe("40/2569");
  });

  it("keeps empty values last in both directions", () => {
    for (const sortOrder of ["asc", "desc"] as const) {
      const sorted = sortRows(rows, { sortBy: "amount", sortOrder }, valueOf);
      expect(sorted.at(-1)?.amount).toBeNull();
    }
  });

  it("orders Thai text by the Thai alphabet", () => {
    const names = [{ no: "ง" }, { no: "ก" }, { no: "ข" }];
    const sorted = sortRows(names, { sortBy: "no", sortOrder: "asc" }, valueOf);
    expect(sorted.map((r) => r.no)).toEqual(["ก", "ข", "ง"]);
  });
});

describe("nextSort", () => {
  it("cycles a column asc → desc → unsorted", () => {
    const asc = nextSort({}, "no");
    expect(asc).toEqual({ sortBy: "no", sortOrder: "asc" });
    const desc = nextSort(asc, "no");
    expect(desc).toEqual({ sortBy: "no", sortOrder: "desc" });
    expect(nextSort(desc, "no")).toEqual({ sortBy: undefined, sortOrder: undefined });
  });

  it("starts ascending when another column is clicked", () => {
    expect(nextSort({ sortBy: "no", sortOrder: "desc" }, "amount")).toEqual({
      sortBy: "amount",
      sortOrder: "asc",
    });
  });
});
