"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ErrorState,
  LoadingState,
  Pagination,
  StatusBadge,
} from "@/components/common";
import { useSearchPersist } from "@/hooks/common";
import { useReportSummary } from "@/hooks/reports";
import { formatNumber, formatThaiDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RecentSignature, ReportParams } from "@/types/app/reports";
import { LicenseTypeDonut } from "./LicenseTypeDonut";
import { MonthlyBarChart } from "./MonthlyBarChart";
import { ReportsHeader } from "./ReportsHeader";
import { DEFAULT_REPORT_FILTERS, REPORTS_STORAGE_KEY } from "./Reports.config";

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <header className="border-b bg-[#f8fafc] px-6 py-4">
        <h2 className="text-base font-bold text-brand-navy-mid">{title}</h2>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

/** header cells sit on the navy row, so their dividers are a faint white */
const RECENT_HEAD = "border-r border-white/15 p-4";

function RecentSignaturesCard({ rows }: { rows: RecentSignature[] }) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  // clamp so a filter change that shrinks the list never strands us past the end
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * limit;
  const pageRows = rows.slice(start, start + limit);

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <header className="border-b bg-[#f8fafc] px-6 py-4">
        <h2 className="text-base font-bold text-brand-navy-mid">
          รายการลงนามล่าสุด
        </h2>
      </header>

      <div className="flex flex-col gap-4 p-4">
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full border-collapse text-left">
            <thead className="bg-brand-navy-mid">
              <tr className="text-sm font-semibold text-white">
                <th scope="col" className={RECENT_HEAD}>
                  รายการใบอนุญาต
                </th>
                <th scope="col" className={cn("w-50", RECENT_HEAD)}>
                  เจ้าหน้าที่
                </th>
                <th scope="col" className={cn("w-35", RECENT_HEAD)}>
                  สถานะ
                </th>
                <th scope="col" className="w-40 p-4 text-right">
                  วันเวลา
                </th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="border-r p-4 text-sm text-foreground">
                    {row.licenseName}
                  </td>
                  <td className="border-r p-4 text-sm whitespace-nowrap text-muted-foreground">
                    {row.officer}
                  </td>
                  <td className="border-r p-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="p-4 text-right text-sm whitespace-nowrap text-muted-foreground">
                    {formatThaiDateTime(row.at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={currentPage}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={(next) => {
            setLimit(next);
            setPage(1);
          }}
        />
      </div>
    </section>
  );
}

export default function ReportsContent() {
  const { filterValues, persist } = useSearchPersist(
    REPORTS_STORAGE_KEY,
    DEFAULT_REPORT_FILTERS as Record<string, unknown>,
  );
  const filters = filterValues as ReportParams;
  const { summary, isLoading, isError } = useReportSummary(filters);

  return (
    <div className="flex flex-col gap-6">
      <ReportsHeader
        filters={filters}
        onApply={(next) => persist("", next as Record<string, unknown>)}
        onExport={() =>
          toast.info("ส่งออก Excel — รอ endpoint จากฝั่ง backend")
        }
      />

      {isError && <ErrorState />}
      {isLoading && <LoadingState rows={6} />}

      {summary && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {summary.kpis.map((kpi) => (
              <div
                key={kpi.key}
                className="flex flex-col gap-3 rounded-2xl bg-card p-6 shadow-[0_4px_6px_rgba(0,0,0,0.03)]"
              >
                <span className="text-sm text-muted-foreground">
                  {kpi.label}
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-[32px] font-bold text-brand-navy-mid">
                    {formatNumber(kpi.value)}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      kpi.deltaPercent >= 0
                        ? "text-action-approve"
                        : "text-destructive",
                    )}
                  >
                    {kpi.deltaPercent >= 0 ? "+" : ""}
                    {kpi.deltaPercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="ยอดคำขอรายเดือน">
              <MonthlyBarChart points={summary.byMonth} />
            </ChartCard>
            <ChartCard title="สัดส่วนตามประเภทใบอนุญาต">
              <LicenseTypeDonut shares={summary.byLicenseType} />
            </ChartCard>
          </div>

          <RecentSignaturesCard rows={summary.recentSignatures} />
        </>
      )}
    </div>
  );
}
