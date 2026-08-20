export interface ReportKpiResponse {
  key: string;
  label: string;
  value: number;
  deltaPercent: number;
}

export interface ReportSeriesPointResponse {
  label: string;
  value: number;
}

export interface ReportSummaryResponse {
  kpis: ReportKpiResponse[];
  byMonth: ReportSeriesPointResponse[];
  byStatus: ReportSeriesPointResponse[];
  byType: ReportSeriesPointResponse[];
}
