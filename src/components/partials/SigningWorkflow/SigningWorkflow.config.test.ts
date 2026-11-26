import { describe, expect, it } from "vitest";
import { chainError } from "./SigningWorkflow.config";

const FINAL = "REVIEW_AND_SIGN";
const chain = (...levels: string[]) => levels.map((approvalLevel) => ({ approvalLevel }));
const FINAL_RULE = "ต้องมีผู้ตรวจสอบและลงนาม 1 คน และต้องอยู่ลำดับสุดท้าย";

describe("chainError", () => {
  it("accepts reviewers followed by one final signer", () => {
    expect(chainError(chain("1", "2", FINAL))).toBeUndefined();
    expect(chainError(chain(FINAL))).toBeUndefined();
  });

  it("needs at least one signer, each with a level", () => {
    expect(chainError([])).toBe("กรุณาเลือกผู้ลงนามอย่างน้อย 1 คน");
    expect(chainError(chain("1", ""))).toBe("มีผู้ลงนามที่ยังไม่กำหนดระดับการอนุมัติ");
  });

  it("needs exactly one final signer, at the end", () => {
    expect(chainError(chain("1", "2"))).toBe(FINAL_RULE);
    expect(chainError(chain(FINAL, "1"))).toBe(FINAL_RULE);
    expect(chainError(chain("1", FINAL, FINAL))).toBe(FINAL_RULE);
  });
});
