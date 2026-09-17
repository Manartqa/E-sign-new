import { MOCK_SIGNERS } from "@/mocks/signers.mock";
import {
  REPLACEMENT_USAGE,
  REQUEST_USAGE,
  type SigningWorkflow,
  type SigningWorkflowStep,
} from "@/types/app/signingWorkflows";

/** the nine rows of the legacy กระบวนการลงนาม screen; the steps are invented */
const steps = (...positions: string[]): SigningWorkflowStep[] =>
  positions.map((position, i) => {
    const signer = MOCK_SIGNERS.find((s) => s.position === position)!;
    return {
      id: `step-${i + 1}`,
      signerId: signer.id,
      signerName: signer.name,
      position,
      approvalLevel: signer.approvalLevel,
    };
  });

const row = (
  id: number,
  name: string,
  signers: SigningWorkflowStep[],
  created: [string, string],
  updated: [string, string],
): SigningWorkflow => ({
  id: `SW-${String(id).padStart(3, "0")}`,
  name,
  weaponCategory: "all",
  licenseType: "all",
  requestUsage: REQUEST_USAGE.NEW_AND_RENEW,
  replacementUsage: REPLACEMENT_USAGE.NORMAL_AND_REPLACEMENT,
  steps: signers,
  createdBy: created[0],
  createdAt: created[1],
  updatedBy: updated[0],
  updatedAt: updated[1],
});

export const MOCK_SIGNING_WORKFLOWS: SigningWorkflow[] = [
  row(
    1,
    "ส่งออก นำเรียน รอง ปล.กห. (พล.ร.อ.สุพพัต ฯ) (1 ตค.67) (ปรับปรุง 30 เม.ย.68)",
    steps("ผอ.กคร.", "จก.กอท.", "รอง ปล.กห."),
    ["Anan", "2025-04-30T07:06:00Z"],
    ["Anan", "2025-06-16T10:49:00Z"],
  ),
  row(
    2,
    "ใบอนุญาต ต่ออายุ (มี) (พล.ท.กานต์นาท ฯ) (1 ตค.67) (ปรับปรุง 30 เม.ย.68)",
    steps("ผอ.กคร.", "จก.กอท."),
    ["Anan", "2025-04-30T07:04:00Z"],
    ["Anan", "2025-04-30T09:17:00Z"],
  ),
  row(
    3,
    "ใบอนุญาต นำเรียน รอง ปล.กห. (พล.ร.อ.สุพพัต ฯ) (1 ตค.67) (ปรับปรุง 30 เม.ย.68)",
    steps("ผอ.กคร.", "จก.กอท.", "รอง ปล.กห."),
    ["Anan", "2025-04-30T07:05:00Z"],
    ["Anan", "2025-06-16T10:51:00Z"],
  ),
  row(
    4,
    "(ทดสอบ)ลงนามเจ้ากรมสุภาพ",
    steps("ผอ.กคร.", "จก.กอท."),
    ["neeracha", "2025-10-24T06:45:00Z"],
    ["neeracha", "2025-10-24T06:45:00Z"],
  ),
  row(
    5,
    "(ทดสอบ) ลงนาม Hokage",
    steps("ผอ.กคร."),
    ["bek", "2026-03-20T05:07:00Z"],
    ["bek", "2026-03-20T07:59:00Z"],
  ),
  row(
    6,
    "SMART 2 ท่าน",
    steps("ผอ.กคร.", "จก.กอท."),
    ["Anan", "2026-05-11T04:20:00Z"],
    ["kusuma", "2026-08-24T10:08:00Z"],
  ),
  row(
    7,
    "BEK",
    steps("ผอ.กคร.", "จก.กอท.", "รอง ปล.กห.", "ปล.กห."),
    ["worapob", "2026-08-03T07:34:00Z"],
    ["worapob", "2026-08-03T07:41:00Z"],
  ),
  row(
    8,
    "SMART จก",
    steps("จก.กอท."),
    ["Anan", "2026-05-29T10:23:00Z"],
    ["Anan", "2026-06-02T04:50:00Z"],
  ),
  row(
    9,
    "SMART",
    steps("ผอ.กคร.", "จก.กอท."),
    ["Anan", "2025-10-27T08:03:00Z"],
    ["Anan", "2026-05-29T07:51:00Z"],
  ),
];
