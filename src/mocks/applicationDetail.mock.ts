import { APPLICATION_STATUS } from "@/constant/status";
import { formatThaiDate } from "@/lib/format";
import type {
  ApplicationDetail,
  ApplicationItem,
  DetailPanel,
  DetailSection,
  DetailTabKey,
  DocumentItem,
  TimelineEvent,
} from "@/types/app/applications";
import { MOCK_REMARKS, mockChain, stepDecidedAt } from "./signingChain.mock";

/** ตัวอย่างใบอนุญาต — a preview of the license, shown regardless of status. */
const LICENSE_PREVIEW_URL = "/mock/license-approved.pdf";

/** เอกสารแนบประกอบคำขอ — sample preview for every attached supporting document. */
const DOCUMENT_ATTACHMENT_URL = "/mock/document-attachment-sample.pdf";

/**
 * Which sections each request type has, so the detail page hides the rest.
 * Follows legacy SSPF (docs/legacy-sspf/02-request-detail-documents.md §4.3,
 * §10): อาคาร only on อ.1/อ.3; รายการอาวุธ/วัตถุดิบ on อ.1/อ.3, เปิดดำเนินกิจการ,
 * ขยายสายการผลิต and the item lists of อ.9/อ.4/อ.15/อ.14; โครงการ on อ.1/อ.3,
 * ขยายสายการผลิต and เปลี่ยนแปลงโรงงาน. ข้อมูลการขนย้าย/จำหน่าย on อ.9, อ.15 and
 * อ.14 (their Entry pages, §10). ผลการตรวจสอบ wherever legacy RequestInfo had
 * one of its checks (§4.4): every factory type, and กรรมการ changes (ประวัติ).
 * A type not listed keeps every panel.
 */
const COMMON_TABS: DetailTabKey[] = [
  "applicant",
  "factory",
  "people",
  "docs",
  "history",
];
const ITEM_LIST_TABS: DetailTabKey[] = [...COMMON_TABS, "permits"];
const TABS_BY_TYPE: Record<string, DetailTabKey[]> = {
  factory_license: [...COMMON_TABS, "buildings", "permits", "project", "checks"],
  transport_permit: [...ITEM_LIST_TABS, "transfer"],
  import_permit: ITEM_LIST_TABS,
  sell_in_kingdom: [...ITEM_LIST_TABS, "transfer"],
  sell_export: [...ITEM_LIST_TABS, "transfer"],
  factory_open: [...ITEM_LIST_TABS, "checks"],
  production_line_expand: [...ITEM_LIST_TABS, "project", "checks"],
  factory_change: [...COMMON_TABS, "project", "checks"],
  director_change: [...COMMON_TABS, "checks"],
};

const field = (label: string, value: string) => ({ label, value });

/**
 * ผลการตรวจสอบ — legacy RequestInfo tab 2, with its sections by form type:
 * ตรวจโรงงานโดยเจ้าหน้าที่ควบคุม (ขยายสายการผลิต, เปลี่ยนแปลงโรงงาน),
 * ตรวจสอบประวัติ (อ.1/อ.3, เปลี่ยนแปลงกรรมการ), ตรวจสถานที่ตั้งโรงงาน
 * (อ.1/อ.3, เปิดดำเนินกิจการ), and the three meetings (อ.1/อ.3 only).
 */
function buildChecks(item: ApplicationItem): DetailPanel {
  const day = 24 * 3_600_000;
  const on = (days: number) =>
    formatThaiDate(new Date(Date.parse(item.receivedAt) + days * day).toISOString());
  const t = item.type;
  const sections: DetailSection[] = [];

  if (t === "production_line_expand" || t === "factory_change") {
    sections.push({
      title: "ผลการตรวจสอบโรงงานโดยเจ้าหน้าที่ควบคุม",
      fields: [
        field("เลขที่อ้างอิง", `ตจ.${item.requestNo}`),
        field("วันที่สร้างคำขอ", on(1)),
        field("สถานะการตรวจสอบโรงงานโดยเจ้าหน้าที่", "ผลตรวจสอบ-ผ่านหมด"),
      ],
    });
  }
  if (t === "factory_license" || t === "director_change") {
    sections.push({
      title: "ผลการตรวจสอบประวัติ",
      fields: [
        field(item.applicantName, `ไม่พบประวัติต้องห้าม (เอกสารลงวันที่ ${on(2)})`),
        field("นายวิชัย รักชาติ", `ไม่พบประวัติต้องห้าม (เอกสารลงวันที่ ${on(2)})`),
      ],
    });
  }
  if (t === "factory_license" || t === "factory_open") {
    sections.push({
      title: "ผลการตรวจสอบสถานที่ตั้งโรงงาน",
      fields: [
        field("กำหนดวันที่นัดตรวจโรงงาน", on(3)),
        field("เลขที่คำสั่งเดินทาง", `กห 0206/${200 + Number(item.requestNo.split("/")[0])}`),
        field("วันที่คำสั่งเดินทาง", on(2)),
        field("สถานะการตรวจสอบโรงงาน", "รับผลตรวจ-ผ่าน"),
        field("ผลการตรวจสอบโรงงาน", "สถานที่ตั้งและระบบป้องกันเป็นไปตามเงื่อนไข"),
      ],
    });
  }
  if (t === "factory_license") {
    for (const [title, days] of [
      ["ผลการประชุม อท.ศอพท.", 4],
      ["ผลการประชุม กมย. กห.", 4],
      ["ผลการประชุม คพอท.", 5],
    ] as const) {
      sections.push({
        title,
        fields: [
          field("วันที่ประชุม", on(days)),
          field("ผลการประชุม", "เห็นชอบ"),
          field("รายละเอียดการประชุม", "ที่ประชุมเห็นชอบให้นำเรียนผู้มีอำนาจพิจารณา"),
        ],
      });
    }
  }
  return { kind: "fields", sections };
}

/**
 * ข้อมูลการขนย้าย/จำหน่าย — the type-specific sections of the legacy Entry
 * pages (02-request-detail-documents.md §10): where an อ.9 moves from and to;
 * who buys under อ.15 / อ.14, the linked อ.9 and the licences issued with it.
 * undefined for the other types.
 */
function buildTransfer(item: ApplicationItem): DetailPanel | undefined {
  const day = 24 * 3_600_000;
  const on = (days: number) =>
    formatThaiDate(new Date(Date.parse(item.receivedAt) + days * day).toISOString());
  const buyer = item.buyerName ?? "—";
  const issued = item.status === APPLICATION_STATUS.APPROVED;
  const linkedMove = {
    title: "คำขออนุญาตขนย้าย อ.9",
    fields: [
      field("เลขที่คำขอ", `${Number(item.requestNo.split("/")[0]) + 500}/2569`),
      field("วันที่คำขอ", on(0)),
    ],
  };

  switch (item.type) {
    case "transport_permit":
      return {
        kind: "fields",
        tabLabel: "ข้อมูลการขนย้าย",
        sections: [
          {
            title: "ขนย้ายจาก",
            fields: [
              field("สถานที่", item.operatorName),
              field("ที่อยู่", "111/11 หมู่ที่ 6 ตำบลโนนสะอาด อำเภอชนบท จังหวัดขอนแก่น 40180"),
            ],
          },
          { title: "ขนย้ายไปยัง", fields: [field("สถานที่", buyer)] },
          {
            title: "วันที่ขออนุญาตขนย้าย",
            fields: [field("ตั้งแต่วันที่", on(10)), field("ถึงวันที่", on(189))],
          },
          { title: "การขนส่ง", fields: [field("วิธีการขนส่ง", "ทางรถยนต์")] },
        ],
      };
    case "sell_in_kingdom":
      return {
        kind: "fields",
        tabLabel: "ข้อมูลการขายในราชอาณาจักร",
        sections: [
          { title: "ผู้ซื้อ", fields: [field("ชื่อผู้ซื้อ", buyer)] },
          linkedMove,
          {
            title: "หนังสืออนุญาต",
            fields: [
              field("หนังสืออนุญาต อ.17", issued ? `17/${item.requestNo}` : "ยังไม่ออก"),
              field("หนังสืออนุญาต อ.10", issued ? `10/${item.requestNo}` : "ยังไม่ออก"),
            ],
          },
          {
            title: "แจ้งนายทะเบียน",
            fields: [
              field("แจ้งผู้ว่าราชการจังหวัดท้องที่ปลายทาง", issued ? on(30) : "—"),
              field("แจ้งนายทะเบียนกรุงเทพมหานคร", issued ? on(31) : "—"),
            ],
          },
        ],
      };
    case "sell_export":
      return {
        kind: "fields",
        tabLabel: "ข้อมูลการส่งออก",
        sections: [
          { title: "ผู้ซื้อ", fields: [field("ชื่อผู้ซื้อ", buyer)] },
          {
            title: "การส่งออก",
            fields: [
              field("ส่งออกไปนอกราชอาณาจักร ณ", "ท่าเรือแหลมฉบัง จังหวัดชลบุรี"),
              field("ส่งออกโดย", "ทางเรือ"),
              field(
                "มีความประสงค์",
                "ขายอาวุธให้แก่บุคคลอื่นนอกจากหน่วยงานตามมาตรา 7 โดยการส่งออกไปนอกราชอาณาจักร",
              ),
            ],
          },
          linkedMove,
          {
            title: "แจ้งกระทรวงการต่างประเทศ (กต.) ตรวจสอบหลักฐานการขอซื้ออาวุธจากประเทศผู้ซื้อ",
            fields: [field("วันที่แจ้ง", on(2)), field("วันที่ได้รับแจ้งผล", on(9))],
          },
          {
            title: "หนังสืออนุญาต",
            fields: [
              field("หนังสืออนุญาต อ.16", issued ? `16/${item.requestNo}` : "ยังไม่ออก"),
              field("หนังสืออนุญาต อ.10", issued ? `10/${item.requestNo}` : "ยังไม่ออก"),
            ],
          },
        ],
      };
  }
}

function panelsForType(
  type: string,
  panels: ApplicationDetail["panels"],
): ApplicationDetail["panels"] {
  const keep = TABS_BY_TYPE[type];
  if (!keep) return panels;
  return Object.fromEntries(
    Object.entries(panels).filter(([key]) => keep.includes(key as DetailTabKey)),
  );
}

/** Figma 83:3204 — the attached-documents table shared by several panels. */
function buildDocuments(item: ApplicationItem): DocumentItem[] {
  const base = Date.parse(item.receivedAt);
  const year = 365 * 24 * 3_600_000;

  return [
    {
      id: "DOC-1",
      name: "สำเนาใบสำคัญแสดงการจดทะเบียนนิติบุคคลของ บริษัท จำกัด หรือ บริษัท มหาชน จำกัด",
      documentDate: new Date(base - 30 * 24 * 3_600_000).toISOString(),
      expiryDate: new Date(base + year).toISOString(),
      issuedPlace: "จังหวัดยโสธร ออกโดย: อำเภอไทยเจริญ",
      fileUrl: DOCUMENT_ATTACHMENT_URL,
    },
    {
      id: "DOC-2",
      name: "สำเนาหนังสือรับรองหรือหลักฐานการเป็นบริษัทจำกัดหรือบริษัทมหาชนจำกัด ซึ่งแสดงรายการเกี่ยวกับชื่อ ทุน วัตถุประสงค์ ที่ตั้งสำนักงาน รายชื่อผู้เป็นกรรมการผู้จัดการ และผู้มีอำนาจลงนามผูกพันนิติบุคคล",
      documentDate: new Date(base - 22 * 24 * 3_600_000).toISOString(),
      expiryDate: new Date(base + 2 * year).toISOString(),
      issuedPlace: "จังหวัดยโสธร ออกโดย: อำเภอคำเขื่อนแก้ว",
      // no file attached — the row's document icon greys out and is disabled
      fileUrl: "",
    },
    {
      id: "DOC-3",
      name: "สำเนาหนังสือบริคณห์สนธิ",
      documentDate: new Date(base - 60 * 24 * 3_600_000).toISOString(),
      expiryDate: new Date(base + year).toISOString(),
      issuedPlace: "จังหวัดยโสธร ออกโดย: อำเภอคำเขื่อนแก้ว",
      fileUrl: DOCUMENT_ATTACHMENT_URL,
    },
    {
      id: "DOC-4",
      name: "สำเนาบัตรประจำตัวผู้เสียภาษีอากรของนิติบุคคล",
      documentDate: new Date(base - 30 * 24 * 3_600_000).toISOString(),
      expiryDate: new Date(base + year).toISOString(),
      issuedPlace: "จังหวัดนครนายก ออกโดย: อำเภอเมืองนครนายก",
      // no file attached — the row's document icon greys out and is disabled
      fileUrl: "",
    },
  ];
}

/** Figma 49:2 — evidence documents shown under the ข้อมูลโรงงาน tab. */
function buildFactoryDocuments(): DocumentItem[] {
  return [
    {
      id: "FDOC-1",
      name: "สำเนาใบอนุญาตประกอบกิจการโรงงานตามกฎหมายว่าด้วยโรงงาน หรือเอกสารหรือหลักฐานแสดงการเป็นผู้รับใบอนุญาตให้ตั้งโรงงาน",
      documentDate: "2026-01-01",
      expiryDate: "2028-05-11",
      issuedPlace: "จังหวัดอุบลราชธานี ออกโดย: อำเภอเมืองอุบลราชธานี",
      fileUrl: DOCUMENT_ATTACHMENT_URL,
    },
    {
      id: "FDOC-2",
      name: "แผนที่แสดงสถานที่ตั้งโรงงาน รายการและแบบของสถานที่เก็บวัตถุระเบิดหรือใช้ในการผลิตอาวุธหรืออาวุธที่ผลิตขึ้น",
      documentDate: "2026-02-13",
      expiryDate: "2027-02-28",
      issuedPlace: "จังหวัดกรุงเทพมหานคร ออกโดย: เขตบางกอกน้อย",
      fileUrl: DOCUMENT_ATTACHMENT_URL,
    },
    {
      id: "FDOC-3",
      name: "สำเนาโฉนดที่ดิน หนังสือรับรองการทำประโยชน์ของที่ตั้งโรงงาน หรือเอกสารแสดงสิทธิในที่ดินอื่นๆ",
      documentDate: "2026-02-13",
      expiryDate: "2027-01-09",
      issuedPlace: "จังหวัดกรุงเทพมหานคร ออกโดย: เขตบางกอกน้อย",
      fileUrl: DOCUMENT_ATTACHMENT_URL,
    },
  ];
}

/** Figma 49:491 — the three evidence documents each authorised signer carries. */
function buildPersonDocuments(prefix: string): DocumentItem[] {
  return [
    {
      id: `${prefix}-1`,
      name: "หนังสือแต่งตั้งผู้แทนนิติบุคคล",
      documentDate: "2026-01-01",
      expiryDate: "2028-05-11",
      issuedPlace: "จังหวัดอุบลราชธานี ออกโดย: อำเภอเมืองอุบลราชธานี",
      fileUrl: DOCUMENT_ATTACHMENT_URL,
    },
    {
      id: `${prefix}-2`,
      name: "หนังสือมอบอำนาจ กรณีที่ผู้ยื่นคำขอได้รับมอบอำนาจให้ยื่นคำขอแทน",
      documentDate: "2026-02-13",
      expiryDate: "2027-02-28",
      issuedPlace: "จังหวัดกรุงเทพมหานคร ออกโดย: เขตบางกอกน้อย",
      fileUrl: DOCUMENT_ATTACHMENT_URL,
    },
    {
      id: `${prefix}-3`,
      name: "บัญชีรายชื่อผู้ถือหุ้นซึ่งแสดงรายละเอียดเกี่ยวกับชื่อ สัญชาติ จำนวนหุ้นที่ถือ",
      documentDate: "2026-02-13",
      expiryDate: "2027-01-09",
      issuedPlace: "จังหวัดกรุงเทพมหานคร ออกโดย: เขต",
      fileUrl: DOCUMENT_ATTACHMENT_URL,
    },
  ];
}

/** Figma 49:1958 — the project tab's document list (name + file only). */
function buildProjectDocuments(): DocumentItem[] {
  return [
    "สรุปโครงการ",
    "รายการลงทุน",
    "การจัดหาเงินทุนและโครงการสร้างเงินทุน",
    "การศึกษาความเป็นไปได้ที่สำคัญ",
    "ความสามารถในการดำเนินงาน",
    "มาตรการอื่นๆ",
  ].map((name, i) => ({
    id: `PRJDOC-${i + 1}`,
    name,
    // compact table hides these, so they stay blank
    documentDate: "",
    expiryDate: "",
    issuedPlace: "",
    fileUrl: DOCUMENT_ATTACHMENT_URL,
  }));
}

/** Figma 106:8900 — the เอกสารแนบอื่นๆ tab's evidence documents. */
function buildOtherDocuments(): DocumentItem[] {
  return [
    {
      id: "ODOC-1",
      name: "เอกสารแสดงว่ามีความรู้และความชำนาญเกี่ยวกับการประกอบกิจการผลิตอาวุธ กรณีที่ผู้ขออนุญาตจะผลิตอาวุธที่มีผู้ผลิตอยู่แล้วจะต้องมีหนังสือรับรองจากผู้ผลิตที่แท้จริง ซึ่งแสดงได้ว่ายินยอมอนุญาตให้ผลิตได้ หากเป็นเอกสารที่จัดทำขึ้นในต่างประเทศ จะต้องได้รับการรับรองเอกสารจากประเทศที่จัดทำเอกสารด้วย และจะต้องแปลเป็นภาษาไทย โดยผ่านการรับรองผู้เชี่ยวชาญในการแปลเป็นภาษาไทย",
      documentDate: "2026-01-01",
      expiryDate: "2028-05-11",
      issuedPlace: "จังหวัดอุบลราชธานี ออกโดย: อำเภอเมืองอุบลราชธานี",
      fileUrl: DOCUMENT_ATTACHMENT_URL,
    },
    {
      id: "ODOC-2",
      name: "เอกสารแสดงว่ามีทุน เครื่องมือ อุปกรณ์และผู้เชี่ยวชาญเพียงพอที่จะดำเนินการตามคำขอนี้ พร้อมด้วยหนังสือรับรองของผู้ซึ่งเกี่ยวข้อง",
      documentDate: "2026-02-13",
      expiryDate: "2027-02-28",
      issuedPlace: "จังหวัดกรุงเทพมหานคร ออกโดย: เขตบางกอกน้อย",
      fileUrl: DOCUMENT_ATTACHMENT_URL,
    },
    {
      id: "ODOC-3",
      name: "ทดสอบxx",
      documentDate: "2026-02-13",
      expiryDate: "2027-01-09",
      issuedPlace: "จังหวัดกรุงเทพมหานคร ออกโดย: เขต",
      fileUrl: DOCUMENT_ATTACHMENT_URL,
    },
  ];
}

/** the three intake events every round starts with */
function intakeEvents(
  item: ApplicationItem,
  revisionNo: number,
  shiftDays: number,
): TimelineEvent[] {
  const day = 24 * 3_600_000;
  const shift = (iso: string, days = 0) =>
    new Date(Date.parse(iso) + (days - shiftDays) * day).toISOString();
  return [
    {
      id: `R${revisionNo}-TL-1`,
      title: "ยื่นคำขอเข้าระบบ",
      actor: item.applicantName,
      at: shift(item.submittedAt),
      status: "COMPLETED",
      revisionNo,
    },
    {
      id: `R${revisionNo}-TL-2`,
      title: "เจ้าหน้าที่รับเรื่องและตรวจสอบเอกสาร",
      actor: item.assignedOfficer,
      at: shift(item.receivedAt),
      status: "COMPLETED",
      revisionNo,
    },
    {
      id: `R${revisionNo}-TL-3`,
      title: "นำเรียนผู้มีอำนาจพิจารณา",
      actor: item.assignedOfficer,
      at: shift(item.receivedAt, 5),
      status: "COMPLETED",
      revisionNo,
    },
  ];
}

/**
 * ประวัติการดำเนินการ — per round (ครั้งที่), the intake steps and then the
 * signing chain of the กระบวนการลงนาม that covers this request, in the
 * workflow's own order. Where the chain stands comes from mockChain, the same
 * source as the list's `myStep`, so the two never disagree. A chain that
 * stopped at a decision shows nothing after it.
 */
function buildHistory(item: ApplicationItem): {
  workflowName: string;
  events: TimelineEvent[];
} {
  const chain = mockChain(item);
  const { steps } = chain.workflow;

  const stepEvent = (
    index: number,
    status: TimelineEvent["status"],
    revisionNo: number,
    at: string | null,
  ): TimelineEvent => {
    const step = steps[index];
    const verb =
      status === "REJECTED"
        ? "ไม่อนุมัติโดย"
        : status === "RETURNED"
          ? "ส่งกลับแก้ไขโดย"
          : "ลงนามโดย";
    return {
      id: `R${revisionNo}-TL-SIGN-${step.id}`,
      title: `${verb} ${step.position}`,
      actor: step.signerName,
      at,
      status,
      revisionNo,
      stepNo: index + 1,
      approvalLevel: step.approvalLevel,
      ...(status === "REJECTED" || status === "RETURNED"
        ? { remark: MOCK_REMARKS[status] }
        : {}),
    };
  };

  const current = steps.map((_, index) => {
    const isDecision = chain.decision !== undefined && index === chain.signed;
    const status = isDecision
      ? chain.decision!
      : index < chain.signed
        ? "COMPLETED"
        : "PENDING";
    return stepEvent(
      index,
      status,
      chain.revisionNo,
      status === "PENDING" ? null : stepDecidedAt(item.receivedAt, index),
    );
  });

  // a second round follows a first one sent back at its first step a month earlier
  const earlier =
    chain.revisionNo > 1
      ? [
          ...intakeEvents(item, 1, 30),
          stepEvent(0, "RETURNED", 1, stepDecidedAt(item.receivedAt, -30)),
        ]
      : [];

  return {
    workflowName: chain.workflow.name,
    events: [
      ...earlier,
      ...intakeEvents(item, chain.revisionNo, 0),
      ...(chain.decision === undefined
        ? current
        : current.slice(0, chain.signed + 1)),
    ],
  };
}

/**
 * Builds the detail payload for one application.
 *
 * Panel content mirrors the shapes in Figma `tabs-content` (106:7034):
 * applicant/factory/project are label-value sections, people and permits are
 * tables, buildings is a card grid, docs and history are timelines.
 */
export function buildMockDetail(item: ApplicationItem): ApplicationDetail {
  const hour = 3_600_000;
  const received = Date.parse(item.receivedAt);
  const history = buildHistory(item);
  const transfer = buildTransfer(item);

  return {
    ...item,
    summary: {
      licenseType: item.typeName,
      requestNo: item.requestNo,
      submittedAt: item.submittedAt,
      receiptNo: item.receiptNo,
      receivedAt: item.receivedAt,
      submissionNo: "กห 0206(กคร.447)/2570",
      submissionDate: new Date(received + 5 * 24 * hour).toISOString(),
      operatorName: item.operatorName,
      status: item.status,
      licensePreviewUrl: LICENSE_PREVIEW_URL,
    },
    panels: panelsForType(item.type, {
      applicant: {
        kind: "fields",
        sections: [
          {
            title: "ข้อมูลสำนักงาน",
            fields: [
              { label: "ชื่อบริษัท", value: item.operatorName },
              {
                label: "เลขที่บัตรประจำตัวผู้เสียภาษีอากร",
                value: "0123456789012",
              },
              { label: "โทรศัพท์", value: "037-456-7109" },
              { label: "อีเมล", value: "support@smartalliance.co.th" },
              {
                label: "ที่อยู่",
                value:
                  "111/11 อาคารศรีอุตสาหกรรม หมู่ที่ 6 ซอย 5 ถนนศรีวัฒนา ตำบลโนนสะอาด อำเภอชนบท จังหวัดขอนแก่น 40180",
              },
            ],
          },
          {
            title: "ข้อมูลการจดทะเบียน",
            fields: [
              { label: "เลขที่ทะเบียนนิติบุคคล", value: "0123456789019" },
              { label: "ทุนจดทะเบียน", value: "75,300,000 บาท" },
              {
                label: "สถานที่จดทะเบียนนิติบุคคล",
                value: "สำนักงานพาณิชย์จังหวัดนครนายก",
              },
              { label: "วันที่จดทะเบียนนิติบุคคล", value: "1 ม.ค. 2564" },
              { label: "จังหวัดที่จดทะเบียนนิติบุคคล", value: "ขอนแก่น" },
            ],
          },
        ],
        documents: buildDocuments(item),
      },

      factory: {
        kind: "fields",
        sections: [
          {
            title: "ข้อมูลโรงงาน",
            fields: [
              { label: "ชื่อโรงงาน", value: "โรงงานศรีอุตสาหกรรมอาวุธ" },
              {
                label: "ขนาดพื้นที่",
                value: "20,000.11 ไร่ 10,000.22 งาน 40,000.33 ตารางวา",
              },
              { label: "ข้อมูลละติจูด", value: "14.1297308381" },
              { label: "ข้อมูลลองจิจูด", value: "101.0910070294" },
              {
                label: "ที่ตั้ง",
                value:
                  "88/12 หมู่ 4 อาคารโรงงานผลิต ซอยอุตสาหกรรม xx ถนนพัฒนาอุตสาหกรรม xx2 ต.ไร่ขิง อ.สามพราน จ.นครปฐม 73210",
              },
              { label: "โทรศัพท์", value: "037889900" },
              { label: "เลขทะเบียนโรงงาน", value: "4-26110-4587" },
              { label: "กำลังเครื่องจักรที่ได้รับอนุญาต", value: "1,111.124" },
              {
                label: "รายละเอียดเพิ่มเติมของสถานที่",
                value:
                  "แบ่งพื้นที่เป็นส่วนผลิต ส่วนประกอบ ส่วนเก็บวัตถุดิบ และส่วนสำนักงาน โดยมีรั้วรอบขอบชิดและระบบควบคุมการเข้าออก",
              },
            ],
          },
        ],
        documents: buildFactoryDocuments(),
      },

      people: {
        kind: "people",
        heading: "รายชื่อผู้มีอำนาจลงนามผูกพันนิติบุคคล",
        people: [
          {
            id: "P-1",
            name: "นายสมชาย ใจดี",
            role: "กรรมการผู้จัดการ",
            nationalId: "1-2345-67890-12-3",
            documents: buildPersonDocuments("PDOC-1"),
          },
          {
            id: "P-2",
            name: "นางสาวมาลี รักดี",
            role: "กรรมการผู้จัดการ",
            nationalId: "1-9876-54321-09-8",
            documents: buildPersonDocuments("PDOC-2"),
          },
          {
            id: "P-3",
            name: "นายวิชัย เก่งงาน",
            role: "ผู้ถือหุ้น",
            nationalId: "1-2345-67890-12-3",
            documents: buildPersonDocuments("PDOC-3"),
          },
        ],
      },

      buildings: {
        kind: "table",
        heading: "อาคารและสถานที่",
        columns: [
          { key: "no", label: "" },
          {
            key: "name",
            label: "ชื่ออาคาร",
            strong: true,
          },
          { key: "type", label: "ประเภทอาคาร" },
          {
            key: "purpose",
            label: "วัตถุประสงค์การใช้งาน",
          },
          { key: "status", label: "สถานะอาคาร" },
        ],
        rows: [
          {
            no: "1",
            name: "อาคารโรงงานผลิต",
            type: "อาคารการผลิต",
            purpose:
              "ใช้เป็นพื้นที่ผลิตและประกอบชิ้นส่วนอาวุธตามกระบวนการผลิตที่ได้รับอนุญาต",
            status: "ก่อสร้างใหม่",
          },
          {
            no: "2",
            name: "อาคารคลังเก็บวัตถุดิบ",
            type: "คลังเก็บวัตถุดิบ",
            purpose:
              "ใช้สำหรับจัดเก็บวัตถุดิบ ชิ้นส่วน และอุปกรณ์ที่เกี่ยวข้องกับการผลิต",
            status: "ใช้งานปกติ",
          },
          {
            no: "3",
            name: "อาคารคลังสินค้าสำเร็จรูป",
            type: "คลังสินค้า",
            purpose: "ใช้สำหรับจัดเก็บผลิตภัณฑ์สำเร็จรูปก่อนส่งมอบหรือจำหน่าย",
            status: "ใช้งานปกติ",
          },
        ],
      },

      permits: {
        kind: "table",
        heading: "รายการที่ขออนุญาต",
        columns: [
          { key: "no", label: "" },
          { key: "code", label: "รหัส", strong: true },
          { key: "group", label: "กลุ่ม" },
          { key: "name", label: "ชื่ออาวุธ&วัตถุดิบ" },
          { key: "detail", label: "รายละเอียด" },
          {
            key: "capacityUnit",
            label: "กำลังการผลิต/ปี (หน่วยนับ)",
          },
          {
            key: "capacityWeight",
            label: "กำลังการผลิต/ปี (น้ำหนัก)",
          },
        ],
        rows: [
          {
            no: "1",
            code: "P-0026",
            group: "กระสุนปืน",
            name: ".32 นิ้ว",
            detail: "กระสุนปืน .32 นิ้ว (จริง)",
            capacityUnit: "1,500 นัด",
            capacityWeight: "25,000",
          },
          {
            no: "2",
            code: "P-0032",
            group: "กระสุนปืน",
            name: ".44 นิ้ว",
            detail: "กระสุนปืน .44 นิ้ว (จริง)",
            capacityUnit: "1,000 นัด",
            capacityWeight: "2,000",
          },
          {
            no: "3",
            code: "P-0032",
            group: "กระสุนปืน",
            name: ".44 นิ้ว ซ้อม",
            detail: "กระสุนปืน .44 นิ้ว (ซ้อม)",
            capacityUnit: "2,000 นัด",
            capacityWeight: "3,000",
          },
        ],
      },

      project: {
        kind: "documents",
        heading: "เอกสารโครงการ",
        compact: true,
        documents: buildProjectDocuments(),
      },

      docs: {
        kind: "documents",
        heading: "ข้อมูลเอกสารหลักฐาน",
        documents: buildOtherDocuments(),
      },

      history: {
        kind: "timeline",
        heading: `กระบวนการลงนาม: ${history.workflowName}`,
        events: history.events,
      },

      checks: buildChecks(item),
      ...(transfer && { transfer }),
    }),
  };
}
