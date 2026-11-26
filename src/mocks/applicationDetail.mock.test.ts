import { describe, expect, it } from "vitest";
import { buildMockDetail } from "./applicationDetail.mock";
import { MOCK_APPLICATIONS } from "./applications.mock";

const detailOf = (type: string) =>
  buildMockDetail(MOCK_APPLICATIONS.find((a) => a.type === type)!);
const tabsOf = (type: string) => Object.keys(detailOf(type).panels).sort();

describe("buildMockDetail panels per request type", () => {
  it("keeps every factory section and the checks for อ.1/อ.3", () => {
    expect(tabsOf("factory_license")).toEqual(
      ["applicant", "buildings", "checks", "docs", "factory", "history", "people", "permits", "project"],
    );
  });

  it("gives a move request (อ.9) its move details, no อาคาร or โครงการ", () => {
    expect(tabsOf("transport_permit")).toEqual(
      ["applicant", "docs", "factory", "history", "people", "permits", "transfer"],
    );
    expect(detailOf("transport_permit").panels.transfer?.tabLabel).toBe("ข้อมูลการขนย้าย");
  });

  it("labels the sale details by type", () => {
    expect(detailOf("sell_in_kingdom").panels.transfer?.tabLabel).toBe(
      "ข้อมูลการขายในราชอาณาจักร",
    );
    expect(detailOf("sell_export").panels.transfer?.tabLabel).toBe("ข้อมูลการส่งออก");
  });

  it("gives an import request (อ.4) no move or check sections", () => {
    expect(tabsOf("import_permit")).toEqual(
      ["applicant", "docs", "factory", "history", "people", "permits"],
    );
  });

  it("gives a director change the common sections and its background check", () => {
    expect(tabsOf("director_change")).toEqual(
      ["applicant", "checks", "docs", "factory", "history", "people"],
    );
    const checks = detailOf("director_change").panels.checks;
    expect(checks?.kind === "fields" && checks.sections.map((s) => s.title)).toEqual([
      "ผลการตรวจสอบประวัติ",
    ]);
  });
});
