import type { ReportSummary } from "@/types/app/reports";

/**
 * GET /api/reports/summary?year&q
 *
 * The handoff names the endpoint but not its body; this mirrors what the
 * dashboard renders (Figma reports-dashboard 8:222).
 */
export type ReportSummaryResponse = ReportSummary;
