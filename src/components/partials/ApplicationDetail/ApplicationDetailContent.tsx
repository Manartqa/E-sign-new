"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState, TabNav } from "@/components/common";
import { ROUTES } from "@/constant/routes";
import { useApplicationDetail } from "@/hooks/applications";
import {
  DETAIL_TABS,
  type ActionMode,
  type DetailTabKey,
} from "@/types/app/applications";
import { ApplicationDetailSummary } from "./ApplicationDetailSummary";
import { DetailPanelView } from "./DetailPanelView";

interface ApplicationDetailContentProps {
  id: string;
}

export default function ApplicationDetailContent({
  id,
}: ApplicationDetailContentProps) {
  const { detail, isLoading, isError } = useApplicationDetail(id);
  const [activeTab, setActiveTab] = useState<DetailTabKey>(DETAIL_TABS[0].key);

  if (isError) return <ErrorState />;
  if (isLoading) return <LoadingState rows={8} />;
  if (!detail)
    return (
      <ErrorState
        title="ไม่พบคำขอนี้"
        description={"ไม่พบคำขอหมายเลข " + id + " ในระบบ"}
      />
    );

  // Approve / reject / return open the signature modals — Phase 5B.
  const handleAction = (action: ActionMode) => {
    const label =
      action === "approve"
        ? "อนุมัติและลงนาม"
        : action === "reject"
          ? "ปฏิเสธคำขอ"
          : "ส่งคืนเพื่อแก้ไข";
    toast.info(label + " — หน้าต่างลงนามจะทำใน Phase 5B");
  };

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={ROUTES.applications}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-brand-navy-mid"
      >
        <ChevronLeft className="size-4" aria-hidden />
        กลับไปรายการคำขอ
      </Link>

      <ApplicationDetailSummary
        summary={detail.summary}
        onAction={handleAction}
        onPreviewLicense={() =>
          toast.info("ตัวอย่างใบอนุญาต — PDF Viewer จะทำใน Phase 5B")
        }
      />

      <div className="rounded-xl border bg-card">
        <TabNav
          items={DETAIL_TABS}
          value={activeTab}
          onChange={(key) => setActiveTab(key as DetailTabKey)}
          className="px-2"
        />
        <div className="p-2">
          <DetailPanelView
            panel={detail.panels[activeTab]}
            onOpenDocument={(document) =>
              toast.info("เปิดเอกสาร " + document.name + " — Phase 5B")
            }
          />
        </div>
      </div>
    </div>
  );
}
