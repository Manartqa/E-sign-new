import type {
  ApplicationDetail,
  ApplicationItem,
  DocumentItem,
} from "@/types/app/applications";

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
      fileUrl: "/mock/doc-registration.pdf",
    },
    {
      id: "DOC-2",
      name: "สำเนาหนังสือรับรองหรือหลักฐานการเป็นบริษัทจำกัดหรือบริษัทมหาชนจำกัด ซึ่งแสดงรายการเกี่ยวกับชื่อ ทุน วัตถุประสงค์ ที่ตั้งสำนักงาน รายชื่อผู้เป็นกรรมการผู้จัดการ และผู้มีอำนาจลงนามผูกพันนิติบุคคล",
      documentDate: new Date(base - 22 * 24 * 3_600_000).toISOString(),
      expiryDate: new Date(base + 2 * year).toISOString(),
      issuedPlace: "จังหวัดยโสธร ออกโดย: อำเภอคำเขื่อนแก้ว",
      fileUrl: "/mock/doc-certificate.pdf",
    },
    {
      id: "DOC-3",
      name: "สำเนาหนังสือบริคณห์สนธิ",
      documentDate: new Date(base - 60 * 24 * 3_600_000).toISOString(),
      expiryDate: new Date(base + year).toISOString(),
      issuedPlace: "จังหวัดยโสธร ออกโดย: อำเภอคำเขื่อนแก้ว",
      fileUrl: "/mock/doc-moa.pdf",
    },
    {
      id: "DOC-4",
      name: "สำเนาบัตรประจำตัวผู้เสียภาษีอากรของนิติบุคคล",
      documentDate: new Date(base - 30 * 24 * 3_600_000).toISOString(),
      expiryDate: new Date(base + year).toISOString(),
      issuedPlace: "จังหวัดนครนายก ออกโดย: อำเภอเมืองนครนายก",
      fileUrl: "/mock/doc-tax-id.pdf",
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
      licensePreviewUrl: "/mock/license-preview.pdf",
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
              { label: "ชื่อโรงงาน", value: "โรงงานผลิตชิ้นส่วนยานยนต์ สาขา 1" },
              { label: "เลขทะเบียนโรงงาน", value: "3-64(1)-1/56" },
              { label: "จำพวกโรงงาน", value: "จำพวกที่ 3" },
              { label: "แรงม้าเครื่องจักรรวม", value: "1,250 แรงม้า" },
              { label: "จำนวนคนงาน", value: "184 คน" },
              {
                label: "ที่ตั้งโรงงาน",
                value: "นิคมอุตสาหกรรมอมตะซิตี้ จังหวัดชลบุรี",
              },
            ],
          },
        ],
      },

      people: {
        kind: "table",
        columns: [
          { key: "no", label: "ลำดับ", width: "w-16" },
          { key: "name", label: "ชื่อ-นามสกุล", width: "min-w-[240px]" },
          { key: "role", label: "ตำแหน่ง", width: "min-w-[180px]" },
          { key: "nationalId", label: "เลขประจำตัวประชาชน", width: "min-w-[160px]" },
          { key: "authority", label: "อำนาจลงนาม", width: "min-w-[140px]" },
        ],
        rows: [
          {
            no: "1",
            name: "นายวิชัย รักชาติ",
            role: "กรรมการผู้จัดการ",
            nationalId: "1509900234567",
            authority: "ลงนามผูกพันได้",
          },
          {
            no: "2",
            name: "นางสาวปรียา วงศ์สุวรรณ",
            role: "ผู้รับมอบอำนาจ",
            nationalId: "3101800123456",
            authority: "ลงนามร่วม",
          },
          {
            no: "3",
            name: "นายธนา สุขเกษม",
            role: "วิศวกรควบคุม (ภย. 12345)",
            nationalId: "1103700456789",
            authority: "-",
          },
        ],
      },

      buildings: {
        kind: "cards",
        cards: [
          {
            title: "อาคาร A — อาคารผลิต",
            fields: [
              { label: "พื้นที่ใช้สอย", value: "4,200 ตารางเมตร" },
              { label: "จำนวนชั้น", value: "2 ชั้น" },
              { label: "ปีที่ก่อสร้าง", value: "2562" },
            ],
          },
          {
            title: "อาคาร B — คลังสินค้า",
            fields: [
              { label: "พื้นที่ใช้สอย", value: "3,100 ตารางเมตร" },
              { label: "จำนวนชั้น", value: "1 ชั้น" },
              { label: "ปีที่ก่อสร้าง", value: "2564" },
            ],
          },
          {
            title: "อาคาร C — สำนักงาน",
            fields: [
              { label: "พื้นที่ใช้สอย", value: "1,100 ตารางเมตร" },
              { label: "จำนวนชั้น", value: "3 ชั้น" },
              { label: "ปีที่ก่อสร้าง", value: "2565" },
            ],
          },
        ],
      },

      permits: {
        kind: "table",
        columns: [
          { key: "no", label: "ลำดับ", width: "w-16" },
          { key: "name", label: "รายการ", width: "min-w-[320px]" },
          { key: "category", label: "ประเภท", width: "min-w-[160px]" },
          { key: "quantity", label: "จำนวน", width: "min-w-[120px]" },
          { key: "unit", label: "หน่วย", width: "min-w-[100px]" },
        ],
        rows: [
          {
            no: "1",
            name: "ชิ้นส่วนโลหะสำหรับประกอบ",
            category: "วัตถุดิบ",
            quantity: "12,000",
            unit: "ชิ้น/ปี",
          },
          {
            no: "2",
            name: "ดินขับเชื้อเพลิงแข็ง",
            category: "วัตถุอันตราย",
            quantity: "850",
            unit: "กิโลกรัม/ปี",
          },
          {
            no: "3",
            name: "เครื่องจักร CNC 5 แกน",
            category: "เครื่องจักร",
            quantity: "4",
            unit: "เครื่อง",
          },
        ],
      },

      project: {
        kind: "fields",
        sections: [
          {
            title: "ข้อมูลโครงการ",
            fields: [
              { label: "ชื่อโครงการ", value: "โครงการขยายกำลังการผลิต ระยะที่ 2" },
              { label: "มูลค่าการลงทุน", value: "125,000,000 บาท" },
              { label: "ระยะเวลาดำเนินการ", value: "18 เดือน" },
              { label: "แหล่งเงินทุน", value: "เงินทุนหมุนเวียนของบริษัท" },
            ],
          },
        ],
      },

      docs: {
        kind: "fields",
        sections: [
          {
            title: "เอกสารแนบอื่นๆ",
            fields: [
              { label: "จำนวนเอกสารแนบ", value: "4 รายการ" },
              { label: "อัปโหลดล่าสุด", value: "โดย " + item.applicantName },
            ],
          },
        ],
        documents: buildDocuments(item),
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
