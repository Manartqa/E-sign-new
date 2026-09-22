import type { DetailTabKey } from "@/types/app/applications";

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

/**
 * Column widths for the data-table tabs, by tab then column key. The backend
 * only sends keys and labels; a column missing here sizes to its content.
 */
export const DETAIL_COLUMN_WIDTHS: Partial<
  Record<DetailTabKey, Record<string, string>>
> = {
  buildings: {
    no: "w-12",
    name: "min-w-[240px]",
    type: "min-w-[140px]",
    purpose: "min-w-[360px]",
    status: "min-w-[120px]",
  },
  permits: {
    no: "w-12",
    code: "min-w-[100px]",
    group: "min-w-[120px]",
    name: "min-w-[160px]",
    detail: "min-w-[220px]",
    capacityUnit: "min-w-[180px]",
    capacityWeight: "min-w-[180px]",
  },
};
