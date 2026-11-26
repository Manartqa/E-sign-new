import { describe, expect, it } from "vitest";
import type { SignatureReportRow } from "@/types/app/reports";
import {
  REPORT_MESSAGES,
  groupByDay,
  validateSignatureReport,
} from "./SignatureReport.config";

const valid = {
  dateFrom: "2026-11-01T00:00:00.000Z",
  dateTo: "2026-11-30T23:59:59.999Z",
  type: "all",
  officerId: "OFF-001",
};

describe("validateSignatureReport", () => {
  it("checks in legacy's order with legacy's words", () => {
    expect(validateSignatureReport({ ...valid, dateTo: "" })).toBe(REPORT_MESSAGES.DATES);
    expect(
      validateSignatureReport({ ...valid, dateFrom: valid.dateTo, dateTo: valid.dateFrom }),
    ).toBe(REPORT_MESSAGES.DATE_ORDER);
    expect(validateSignatureReport({ ...valid, officerId: "" })).toBe(REPORT_MESSAGES.OFFICER);
    expect(validateSignatureReport(valid)).toBeUndefined();
  });
});

const row = (id: string, decidedAt: string, decision: SignatureReportRow["decision"]) =>
  ({ id, decidedAt, decision }) as SignatureReportRow;

describe("groupByDay", () => {
  it("groups by day, oldest first, with day and grand totals", () => {
    const { days, totals } = groupByDay([
      row("b", "2026-11-03T04:00:00Z", "REJECTED"),
      row("a", "2026-11-02T04:00:00Z", "APPROVED"),
      row("c", "2026-11-03T02:00:00Z", "RETURNED"),
    ]);
    expect(days.map((d) => d.rows.map((r) => r.id))).toEqual([["a"], ["c", "b"]]);
    expect(days[1].totals).toEqual({ APPROVED: 0, REJECTED: 1, RETURNED: 1 });
    expect(totals).toEqual({ APPROVED: 1, REJECTED: 1, RETURNED: 1 });
  });
});
