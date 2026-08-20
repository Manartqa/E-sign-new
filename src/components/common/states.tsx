import { AlertCircle, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function LoadingState({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)} aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function EmptyState({
  title = "ไม่พบข้อมูล",
  description = "ลองปรับเงื่อนไขการค้นหาแล้วลองใหม่อีกครั้ง",
  action,
  className,
}: StateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-card px-6 py-16 text-center",
        className,
      )}
    >
      <Inbox className="size-10 text-muted-foreground" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title = "เกิดข้อผิดพลาด",
  description = "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
  action,
  className,
}: StateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-16 text-center",
        className,
      )}
      role="alert"
    >
      <AlertCircle className="size-10 text-destructive" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
