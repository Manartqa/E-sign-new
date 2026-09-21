import type { ReportOptions, ReportSummary } from "@/types/app/reports";

/**
 * GET /api/reports/summary?year&q
 *
 * The handoff names the endpoint but not its body; this mirrors what the
 * dashboard renders (Figma reports-dashboard 8:222).
 */
export type ReportSummaryResponse = ReportSummary;

/** GET /api/reports/options — not in the handoff; the filter bar's choices */
export type ReportOptionsResponse = ReportOptions;
