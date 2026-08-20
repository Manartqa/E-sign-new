export interface ReportKpi {
  key: string;
  label: string;
  value: number;
  deltaPercent: number;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface ReportSummary {
  kpis: ReportKpi[];
  byMonth: SeriesPoint[];
  byStatus: SeriesPoint[];
  byType: SeriesPoint[];
}

export interface ReportParams {
  year?: string;
  q?: string;
}
