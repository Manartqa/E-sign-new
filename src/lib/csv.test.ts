import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("writes a BOM, a header and quotes what needs it", () => {
    const csv = toCsv(
      [{ name: 'บริษัท "ไทย", จำกัด', no: "40/2569" }],
      [
        { label: "ชื่อ", value: (row) => row.name },
        { label: "เลขที่", value: (row) => row.no },
      ],
    );
    expect(csv).toBe('﻿ชื่อ,เลขที่\r\n"บริษัท ""ไทย"", จำกัด",40/2569\r\n');
  });
});
