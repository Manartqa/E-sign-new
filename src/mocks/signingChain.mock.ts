import { APPLICATION_STATUS, type ApplicationStatus } from "@/constant/status";
import { MY_STEP_STATUS, type MyStep } from "@/types/app/applications";
import type { SigningWorkflow } from "@/types/app/signingWorkflows";
import { MOCK_FINAL_SIGNER_PROFILE } from "./profile.mock";
import { MOCK_SIGNING_WORKFLOWS } from "./signingWorkflows.mock";

/**
 * Where a mock request's signing chain stands — shared by the list (the
 * officer's `myStep`) and the detail history, so the two always agree.
 *
 * The real backend owns all of this. The mock derives it from the request's
 * position in MOCK_APPLICATIONS, so a given request always tells the same
 * story:
 * - the final signer's step is the last one; the mid-chain officer's is the
 *   second (or the only one, on a one-step chain)
 * - อนุมัติ: every step approved
 * - ไม่อนุมัติ / ส่งกลับแก้ไข: the officer's own step made that decision
 * - รอการอนุมัติ: by turns it is the officer's turn, an earlier step has not
 *   approved yet, or (mid-chain only) the officer already approved and a
 *   later step has not
 * - every fifth request is on its second round (ครั้งที่ 2): the first round
 *   was sent back at the first step and resubmitted
 */
export interface MockChain {
  workflow: SigningWorkflow;
  /** the officer's own step, 0-based */
  mine: number;
  /** steps approved in the current round */
  signed: number;
  /** what the step at `signed` did, when the round stopped there */
  decision?: "REJECTED" | "RETURNED";
  myStep: MyStep;
  /** ครั้งที่ of the current round */
  revisionNo: number;
}

interface ChainSource {
  id: string;
  status: ApplicationStatus;
  type: string;
  isFinalSigner: boolean;
  receivedAt: string;
}

const DAY = 24 * 3_600_000;

/** the request's place in MOCK_APPLICATIONS, read back from its id */
const indexOf = (id: string) => Number(id.replace(/\D/g, "").slice(-6)) - 1234;

/** when a step of the current round was decided */
export const stepDecidedAt = (receivedAt: string, index: number) =>
  new Date(Date.parse(receivedAt) + (6 + index) * DAY).toISOString();

export const MOCK_REMARKS = {
  REJECTED: "คุณสมบัติผู้ยื่นไม่เป็นไปตามหลักเกณฑ์",
  RETURNED: "เอกสารแนบไม่ชัดเจน / ไม่ครบถ้วน กรุณาแนบสำเนาใบอนุญาตฉบับล่าสุด",
} as const;

export function mockChain(item: ChainSource): MockChain {
  const i = indexOf(item.id);
  // a request in the final signer's queue runs on a chain that ends at them
  const workflow =
    (item.isFinalSigner
      ? MOCK_SIGNING_WORKFLOWS.find(
          (w) => w.steps.at(-1)?.signerName === MOCK_FINAL_SIGNER_PROFILE.name,
        )
      : MOCK_SIGNING_WORKFLOWS.find(
          (w) => w.licenseType === item.type || w.licenseType === "all",
        )) ?? MOCK_SIGNING_WORKFLOWS[0];
  const n = workflow.steps.length;
  const mine = item.isFinalSigner ? n - 1 : Math.min(1, n - 1);

  let signed = mine;
  let decision: MockChain["decision"];
  let status: MyStep["status"] = MY_STEP_STATUS.MY_TURN;

  switch (item.status) {
    case APPLICATION_STATUS.APPROVED:
      signed = n;
      status = MY_STEP_STATUS.APPROVED;
      break;
    case APPLICATION_STATUS.REJECTED:
      decision = "REJECTED";
      status = MY_STEP_STATUS.REJECTED;
      break;
    case APPLICATION_STATUS.RETURNED:
      decision = "RETURNED";
      status = MY_STEP_STATUS.RETURNED;
      break;
    case APPLICATION_STATUS.PENDING_APPROVAL: {
      const waiting = item.isFinalSigner ? i % 3 === 2 : i % 3 === 1;
      const alreadyApproved = !item.isFinalSigner && i % 3 === 2;
      if (waiting && mine > 0) {
        signed = mine - 1;
        status = MY_STEP_STATUS.WAITING_PREVIOUS;
      } else if (alreadyApproved && mine + 1 < n) {
        signed = mine + 1;
        status = MY_STEP_STATUS.APPROVED;
      }
      break;
    }
  }

  const decided = status !== MY_STEP_STATUS.MY_TURN && status !== MY_STEP_STATUS.WAITING_PREVIOUS;
  return {
    workflow,
    mine,
    signed,
    decision,
    revisionNo: i % 5 === 3 ? 2 : 1,
    myStep: {
      stepNo: mine + 1,
      status,
      decidedAt: decided ? stepDecidedAt(item.receivedAt, mine) : null,
      remark: decision ? MOCK_REMARKS[decision] : null,
    },
  };
}
