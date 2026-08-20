import type { ApplicationStatus } from "@/constant/status";

export interface ApplicantResponse {
  name: string;
  nationalId: string;
}

/** One row of GET /api/applications */
export interface ApplicationResponse {
  id: string;
  type: string;
  typeName: string;
  applicant: ApplicantResponse;
  status: ApplicationStatus;
  submittedAt: string;
  updatedAt: string;
  assignedOfficer: string;
}

export interface TimelineEventResponse {
  id: string;
  title: string;
  actor: string;
  at: string;
  status: "COMPLETED" | "PENDING";
}

export interface AttachmentResponse {
  id: string;
  name: string;
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
  url: string;
}

/**
 * GET /api/applications/:id
 *
 * The 8 detail tabs in Figma (ข้อมูลผู้ยื่น-บริษัท, ข้อมูลโรงงาน,
 * บุคคลและผู้มีอำนาจ, อาคารและสถานที่, รายการที่ขออนุญาต, ข้อมูลโครงการ,
 * เอกสารแนบอื่นๆ, ประวัติการดำเนินการ) each carry their own field set.
 * `sections` stays generic until each frame is read in Phase 5.
 */
export interface ApplicationDetailResponse extends ApplicationResponse {
  sections: Record<string, ApplicationFieldResponse[]>;
  attachments: AttachmentResponse[];
  timeline: TimelineEventResponse[];
}

export interface ApplicationFieldResponse {
  label: string;
  value: string;
}

export interface ApproveRequest {
  notes: string;
  officerId: string;
}

export interface SignRequest {
  certificateId: string;
  certificateOwner: string;
  signature: string;
  timestamp: string;
  applicationId: string;
  officerId: string;
  notes: string;
}
