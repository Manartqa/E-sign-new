import { describe, expect, it } from "vitest";
import {
  formatFileSize,
  formatPhone,
  formatThaiDate,
  formatThaiDateTime,
  formatThaiLongDate,
  formatThaiShortDate,
  maskEmail,
  maskPhone,
} from "./format";

// no zone suffix: read as local time, so the result does not depend on the machine's TZ
const ISO = "2026-09-21T09:02:00";

describe("Thai dates use the Buddhist year", () => {
  it.each([
    [formatThaiDateTime, "21 ก.ย. 2569 09:02"],
    [formatThaiDate, "21 ก.ย. 2569"],
    [formatThaiShortDate, "21/09/2569"],
    [formatThaiLongDate, "21 กันยายน 2569"],
  ])("%o", (format, expected) => {
    expect(format(ISO)).toBe(expected);
  });
});

describe("formatFileSize", () => {
  it.each([
    [512, "512 B"],
    [2048, "2 KB"],
    [1.5 * 1024 * 1024, "1.5 MB"],
  ])("%d bytes → %s", (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });
});

describe("masking", () => {
  it("keeps the email up to the first dot", () => {
    expect(maskEmail("manart.pa@smartalliance.co.th")).toBe(
      "manart.xxxx@smartalliance.co.th",
    );
  });

  it("keeps three letters of an email with no dot", () => {
    expect(maskEmail("somchai@x.co.th")).toBe("somxxxx@x.co.th");
  });

  it("leaves text that is not an email alone", () => {
    expect(maskEmail("not-an-email")).toBe("not-an-email");
  });

  it("shows only the first three and last two phone digits", () => {
    expect(maskPhone("081-234-5678")).toBe("081-xxxx-xx78");
  });
});

describe("formatPhone", () => {
  it("groups a 10-digit number", () => {
    expect(formatPhone("0812345678")).toBe("081-234-5678");
  });

  it("leaves any other length alone", () => {
    expect(formatPhone("021234567")).toBe("021234567");
  });
});
