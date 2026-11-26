import { describe, expect, it } from "vitest";
import { APPLICATION_STATUS } from "@/constant/status";
import { MY_STEP_STATUS, type TimelineEvent } from "@/types/app/applications";
import { buildMockDetail } from "./applicationDetail.mock";
import { MOCK_APPLICATIONS } from "./applications.mock";

const historyOf = (id: string): TimelineEvent[] => {
  const item = MOCK_APPLICATIONS.find((a) => a.id === id)!;
  const panel = buildMockDetail(item).panels.history!;
  if (panel.kind !== "timeline") throw new Error("history is not a timeline");
  return panel.events;
};

describe("mock signing chain", () => {
  it("covers every state of the officer's own step", () => {
    const seen = new Set(MOCK_APPLICATIONS.map((a) => a.myStep?.status));
    expect([...seen].sort()).toEqual(Object.values(MY_STEP_STATUS).sort());
  });

  it("lets the officer act only on their turn of a pending request", () => {
    for (const a of MOCK_APPLICATIONS) {
      expect(a.canAct).toBe(
        a.status === APPLICATION_STATUS.PENDING_APPROVAL &&
          a.myStep?.status === MY_STEP_STATUS.MY_TURN,
      );
    }
  });

  it("keeps the e2e fixtures actionable", () => {
    for (const id of ["APP-2567-001234", "APP-2567-001238"]) {
      expect(MOCK_APPLICATIONS.find((a) => a.id === id)!.canAct).toBe(true);
    }
  });

  it("puts the officer's step in the history with the same outcome", () => {
    const outcome = {
      WAITING_PREVIOUS: "PENDING",
      MY_TURN: "PENDING",
      APPROVED: "COMPLETED",
      REJECTED: "REJECTED",
      RETURNED: "RETURNED",
    } as const;
    for (const a of MOCK_APPLICATIONS) {
      const events = historyOf(a.id);
      const round = Math.max(...events.map((e) => e.revisionNo));
      const mine = events.find(
        (e) => e.revisionNo === round && e.stepNo === a.myStep!.stepNo,
      )!;
      expect(mine.status).toBe(outcome[a.myStep!.status]);
    }
  });

  it("shows an earlier round that was sent back", () => {
    const resubmitted = MOCK_APPLICATIONS.find((a) =>
      historyOf(a.id).some((e) => e.revisionNo === 2),
    )!;
    const first = historyOf(resubmitted.id).filter((e) => e.revisionNo === 1);
    expect(first.at(-1)).toMatchObject({ status: "RETURNED", stepNo: 1 });
  });
});
