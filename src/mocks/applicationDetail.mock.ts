import type {
  ApplicationDetail,
  ApplicationItem,
  DocumentItem,
} from "@/types/app/applications";

/** ตัวอย่างใบอนุญาต — a preview of the license, shown regardless of status. */
const LICENSE_PREVIEW_URL = "/mock/license-approved.pdf";

/** เอกสารแนบประกอบคำขอ — sample preview for every attached supporting document. */
const DOCUMENT_ATTACHMENT_URL = "/mock/document-attachment-sample.pdf";

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
    panels: {
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
          { key: "no", label: "", width: "w-12" },
          {
            key: "name",
            label: "ชื่ออาคาร",
            width: "min-w-[240px]",
            strong: true,
          },
          { key: "type", label: "ประเภทอาคาร", width: "min-w-[140px]" },
          {
            key: "purpose",
            label: "วัตถุประสงค์การใช้งาน",
            width: "min-w-[360px]",
          },
          { key: "status", label: "สถานะอาคาร", width: "min-w-[120px]" },
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
          { key: "no", label: "", width: "w-12" },
          { key: "code", label: "รหัส", width: "min-w-[100px]", strong: true },
          { key: "group", label: "กลุ่ม", width: "min-w-[120px]" },
          { key: "name", label: "ชื่ออาวุธ&วัตถุดิบ", width: "min-w-[160px]" },
          { key: "detail", label: "รายละเอียด", width: "min-w-[220px]" },
          {
            key: "capacityUnit",
            label: "กำลังการผลิต/ปี (หน่วยนับ)",
            width: "min-w-[180px]",
          },
          {
            key: "capacityWeight",
            label: "กำลังการผลิต/ปี (น้ำหนัก)",
            width: "min-w-[180px]",
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
        events: [
          {
            id: "TL-1",
            title: "ยื่นคำขอเข้าระบบ",
            actor: item.applicantName,
            at: item.submittedAt,
            status: "COMPLETED",
          },
          {
            id: "TL-2",
            title: "เจ้าหน้าที่รับเรื่องและตรวจสอบเอกสาร",
            actor: item.assignedOfficer,
            at: item.receivedAt,
            status: "COMPLETED",
          },
          {
            id: "TL-3",
            title: "นำเรียนผู้มีอำนาจพิจารณา",
            actor: item.assignedOfficer,
            at: new Date(received + 5 * 24 * hour).toISOString(),
            status: "COMPLETED",
          },
          {
            id: "TL-4",
            title: "รอการอนุมัติและลงนาม",
            actor: "ผู้ช่วยหัวหน้าส่วนงาน",
            at: item.updatedAt,
            status: "PENDING",
          },
        ],
      },
    },
  };
}
