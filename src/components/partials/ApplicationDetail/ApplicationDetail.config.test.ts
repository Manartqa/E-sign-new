import { describe, expect, it } from "vitest";
import { APPLICATION_STATUS } from "@/constant/status";
import {
  DETAIL_TABS,
  MY_STEP_STATUS,
  type DetailPanel,
  type MyStep,
} from "@/types/app/applications";
import {
  revisionsOf,
  stepNotice,
  visibleDetailTabs,
} from "./ApplicationDetail.config";

describe("revisionsOf", () => {
  it("lists each ครั้งที่ once, oldest first", () => {
    expect(revisionsOf([{ revisionNo: 2 }, { revisionNo: 1 }, { revisionNo: 2 }])).toEqual([1, 2]);
  });
});

const step = (status: MyStep["status"]): MyStep => ({
  stepNo: 2,
  status,
  decidedAt: status === MY_STEP_STATUS.APPROVED ? "2026-03-10T03:00:00Z" : null,
  remark: null,
});
const pending = APPLICATION_STATUS.PENDING_APPROVAL;

describe("stepNotice", () => {
  it("explains a pending request that hasn't reached the officer", () => {
    expect(
      stepNotice({ status: pending, canAct: false, myStep: step("WAITING_PREVIOUS") }),
    ).toContain("ยังไม่ถึงลำดับการลงนามของคุณ");
  });

  it("explains a pending request the officer already approved", () => {
    expect(
      stepNotice({ status: pending, canAct: false, myStep: step("APPROVED") }),
    ).toMatch(/^คุณอนุมัติคำขอนี้แล้ว เมื่อ .+ — รอผู้ลงนามลำดับถัดไป$/);
  });

  it("says nothing when the officer can act, or the request is decided", () => {
    expect(stepNotice({ status: pending, canAct: true, myStep: step("MY_TURN") })).toBeUndefined();
    expect(
      stepNotice({ status: APPLICATION_STATUS.APPROVED, canAct: false, myStep: step("APPROVED") }),
    ).toBeUndefined();
    expect(stepNotice({ status: pending, canAct: false, myStep: null })).toBeUndefined();
  });
});

const panel: DetailPanel = { kind: "fields", sections: [] };

describe("visibleDetailTabs", () => {
  it("leaves out tabs the request has no panel for, keeping tab order", () => {
    const tabs = visibleDetailTabs({ history: panel, applicant: panel });
    expect(tabs.map((tab) => tab.key)).toEqual(["applicant", "history"]);
  });

  it("shows every tab when every panel is present", () => {
    const all = Object.fromEntries(DETAIL_TABS.map((tab) => [tab.key, panel]));
    expect(visibleDetailTabs(all)).toEqual([...DETAIL_TABS]);
  });

  it("takes a request type's own label for a tab", () => {
    const tabs = visibleDetailTabs({ transfer: { ...panel, tabLabel: "ข้อมูลการส่งออก" } });
    expect(tabs).toEqual([{ key: "transfer", label: "ข้อมูลการส่งออก" }]);
  });

  it("returns no tabs when the request has no panels", () => {
    expect(visibleDetailTabs({})).toEqual([]);
  });
});
