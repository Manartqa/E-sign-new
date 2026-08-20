/** Figma shows one option ("เอกสารแนบไม่ชัดเจน / ไม่ครบถ้วน"); the rest are
 *  placeholders until the real reason list comes from the backend. */
export const RETURN_REASONS = [
  "เอกสารแนบไม่ชัดเจน / ไม่ครบถ้วน",
  "ข้อมูลผู้ประกอบการไม่ตรงกับหลักฐาน",
  "รายการที่ขออนุญาตไม่ครบถ้วน",
  "เอกสารหมดอายุ",
  "อื่นๆ",
] as const;

export const REJECT_REASONS = [
  "คุณสมบัติผู้ยื่นไม่เป็นไปตามหลักเกณฑ์",
  "รายการที่ขออนุญาตไม่อยู่ในข่ายที่อนุญาตได้",
  "เอกสารหลักฐานเป็นเท็จ",
  "อื่นๆ",
] as const;

/**
 * Stand-in certificate shown in the signature modal. The real values come
 * from the PKI service (`PKI_SERVICE_URL` in the handoff env block).
 */
export const MOCK_CERTIFICATE = {
  id: "CERT-2024-0891",
  issuer: "สำนักงาน PKI รัฐบาล",
  validFrom: "2024-01-01T00:00:00Z",
  validTo: "2026-12-31T00:00:00Z",
};
