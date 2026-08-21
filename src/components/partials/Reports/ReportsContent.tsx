"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  ErrorState,
  LoadingState,
  Pagination,
  StatusBadge,
} from "@/components/common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchPersist } from "@/hooks/common";
import { useReportSummary } from "@/hooks/reports";
import { formatNumber, formatThaiDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  BreakdownDimension,
  RecentSignature,
  ReportKpi,
  ReportParams,
} from "@/types/app/reports";
import { LicenseTypeDonut } from "./LicenseTypeDonut";
import { MonthlyBarChart } from "./MonthlyBarChart";
import { ReportsHeader } from "./ReportsHeader";
import { Sparkline } from "./Sparkline";
import { DEFAULT_REPORT_FILTERS, REPORTS_STORAGE_KEY } from "./Reports.config";

/**
 * icon + accent per KPI key, using the app's existing status tones. Class names
 * are written out in full (never interpolated) so Tailwind's JIT keeps them.
 */
const KPI_META: Record<
  string,
  { icon: LucideIcon; circle: string; spark: string }
> = {
  total: {
    icon: FileText,
    circle: "bg-brand-navy-mid",
    spark: "text-brand-navy-mid",
  },
  approved: {
    icon: CheckCircle2,
    circle: "bg-action-approve",
    spark: "text-action-approve",
  },
  pending: {
    icon: Clock,
    circle: "bg-action-return",
    spark: "text-action-return",
  },
  rejected: {
    icon: XCircle,
    circle: "bg-action-reject",
    spark: "text-action-reject",
  },
};

function KpiCard({ kpi }: { kpi: ReportKpi }) {
  const meta = KPI_META[kpi.key] ?? KPI_META.total;
  const Icon = meta.icon;
  const up = kpi.deltaPercent >= 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-[0_4px_6px_rgba(0,0,0,0.03)]">
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full",
            meta.circle,
          )}
        >
          <Icon className="size-6 text-white" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-sm text-muted-foreground">{kpi.label}</span>
          <span className="text-[28px] leading-tight font-bold text-brand-navy-mid">
            {formatNumber(kpi.value)}
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <span className="flex items-center gap-1 text-xs whitespace-nowrap">
          <span className="text-muted-foreground">
            {up ? "เพิ่มขึ้นจากเดือนก่อน" : "ลดลงจากเดือนก่อน"}
          </span>
          <span
            className={cn(
              "font-semibold",
              up ? "text-action-approve" : "text-destructive",
            )}
          >
            {up ? "▲" : "▼"} {Math.abs(kpi.deltaPercent)}%
          </span>
        </span>
        <div className="w-28 shrink-0 sm:w-36">
          <Sparkline data={kpi.spark} className={meta.spark} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card">
      <header className="flex items-center justify-between gap-3 rounded-t-2xl border-b bg-[#f8fafc] px-6 py-4">
        <h2 className="text-base font-bold text-brand-navy-mid">{title}</h2>
        {action}
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

/** the bar chart's metric picker — only "จำนวนคำขอ" has data for now */
const METRIC_LABEL: Record<string, string> = { count: "จำนวนคำขอ" };

/** the donut's dimension picker — switches how the requests are grouped */
const DIMENSION_LABEL: Record<BreakdownDimension, string> = {
  licenseType: "ตามประเภทใบอนุญาต",
  division: "ตามกอง",
  department: "ตามแผนก",
};

export default function ReportsContent() {
  const { filterValues, persist } = useSearchPersist(
    REPORTS_STORAGE_KEY,
    DEFAULT_REPORT_FILTERS as Record<string, unknown>,
  );
  const filters = filterValues as ReportParams;
  const { summary, isLoading, isFetching, isError, refetch } =
    useReportSummary(filters);
  const [metric, setMetric] = useState("count");
  const [dimension, setDimension] = useState<BreakdownDimension>("licenseType");

  const totalCount = summary?.kpis.find((k) => k.key === "total")?.value ?? 0;

  const chartMenu = (
    <Select value={metric} onValueChange={(v) => setMetric(v ?? metric)}>
      <SelectTrigger
        size="sm"
        aria-label="ตัวชี้วัดของกราฟ"
        className="w-[150px] bg-white"
      >
        <SelectValue>{METRIC_LABEL[metric]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(METRIC_LABEL).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const dimensionMenu = (
    <Select
      value={dimension}
      onValueChange={(v) =>
        setDimension((v as BreakdownDimension) ?? dimension)
      }
    >
      <SelectTrigger
        size="sm"
        aria-label="มิติการแบ่งสัดส่วน"
        className="w-[180px] bg-white"
      >
        <SelectValue>{DIMENSION_LABEL[dimension]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(
          Object.entries(DIMENSION_LABEL) as [BreakdownDimension, string][]
        ).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="flex flex-col gap-6">
      {summary && (
        <div className="flex items-center justify-end gap-2 text-[13px] text-muted-foreground">
          <span>
            ข้อมูลอัปเดตล่าสุด {formatThaiDateTime(summary.updatedAt)}
          </span>
          <button
            type="button"
            onClick={() => void refetch()}
            aria-label="รีเฟรชข้อมูล"
            className="rounded-full p-1 text-brand-navy-mid hover:bg-secondary"
          >
            <RefreshCw
              className={cn("size-4", isFetching && "animate-spin")}
              aria-hidden
            />
          </button>
        </div>
      )}

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
              <KpiCard key={kpi.key} kpi={kpi} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard title="ยอดคำขอรายเดือน" action={chartMenu}>
              <MonthlyBarChart points={summary.byMonth} />
            </ChartCard>
            <ChartCard title="สัดส่วนการขออนุญาต" action={dimensionMenu}>
              <LicenseTypeDonut
                items={summary.breakdowns[dimension]}
                total={totalCount}
              />
            </ChartCard>
          </div>

          <RecentSignaturesCard rows={summary.recentSignatures} />
        </>
      )}
    </div>
  );
}
