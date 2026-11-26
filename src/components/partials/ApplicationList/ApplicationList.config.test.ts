import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, withMyDecision } from "./ApplicationList.config";

const now = dayjs("2026-11-26T10:00:00+07:00");

describe("withMyDecision", () => {
  it("opens the last two months when no range is set", () => {
    const next = withMyDecision(DEFAULT_FILTERS, "APPROVED", now);
    expect(next.myDecision).toBe("APPROVED");
    expect(next.dateFrom).toBe(now.subtract(2, "month").startOf("day").toISOString());
    expect(next.dateTo).toBe(now.endOf("day").toISOString());
  });

  it("keeps a range the officer already chose", () => {
    const chosen = { ...DEFAULT_FILTERS, dateFrom: "2026-01-01T00:00:00.000Z" };
    expect(withMyDecision(chosen, "REJECTED", now).dateFrom).toBe(chosen.dateFrom);
  });

  it("leaves the range alone when the filter is cleared", () => {
    const next = withMyDecision(DEFAULT_FILTERS, "all", now);
    expect(next).toEqual({ ...DEFAULT_FILTERS, myDecision: "all" });
  });
});
