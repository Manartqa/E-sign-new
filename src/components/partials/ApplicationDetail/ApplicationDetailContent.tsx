"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState, TabNav } from "@/components/common";
import { ROUTES } from "@/constant/routes";
import { useApplicationActions, useApplicationDetail } from "@/hooks/applications";
import { useProfile } from "@/hooks/profile";
import {
  DETAIL_TABS,
  type ActionMode,
  type DetailTabKey,
  type DocumentItem,
  type ReturnFormValues,
} from "@/types/app/applications";
import { ApplicationDetailSummary } from "./ApplicationDetailSummary";
import { DetailPanelView } from "./DetailPanelView";
import { MOCK_CERTIFICATE } from "./ApplicationDetail.config";
import {
  ReturnForEditModal,
  SignatureModal,
  SuccessModal,
} from "./Modal";
import { PDFViewer } from "./PDFViewer";

interface ApplicationDetailContentProps {
  id: string;
}

interface ViewerState {
  fileName: string;
  fileUrl?: string;
}

export default function ApplicationDetailContent({
  id,
}: ApplicationDetailContentProps) {
  const router = useRouter();
  const { detail, isLoading, isError } = useApplicationDetail(id);
  const { profile } = useProfile();
  const { sign, approve } = useApplicationActions(id);

  const [activeTab, setActiveTab] = useState<DetailTabKey>(DETAIL_TABS[0].key);
  const [action, setAction] = useState<ActionMode | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [viewer, setViewer] = useState<ViewerState | null>(null);

  if (isError) return <ErrorState />;
  if (isLoading) return <LoadingState rows={8} />;
  if (!detail)
    return (
      <ErrorState
        title="ไม่พบคำขอนี้"
        description={"ไม่พบคำขอหมายเลข " + id + " ในระบบ"}
      />
    );

  const handleSign = async () => {
    try {
      await sign.mutateAsync({
        certificateId: MOCK_CERTIFICATE.id,
        certificateOwner: profile?.name ?? "",
        signature: "base64_encoded_signature",
        timestamp: new Date().toISOString(),
        applicationId: detail.id,
        officerId: profile?.id ?? "",
        notes: "",
      });
      setAction(null);
      setShowSuccess(true);
    } catch {
      toast.error("ลงนามไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleReturnOrReject = async (values: ReturnFormValues) => {
    const isReject = action === "reject";
    try {
      await approve.mutateAsync({
        notes: values.reason + " — " + values.notes,
        officerId: profile?.id ?? "",
      });
      setAction(null);
      toast.success(isReject ? "ปฏิเสธคำขอแล้ว" : "ส่งคืนคำขอเพื่อแก้ไขแล้ว");
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const openDocument = (document: DocumentItem) =>
    setViewer({ fileName: document.name + ".pdf", fileUrl: document.fileUrl });

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
        onAction={setAction}
        onPreviewLicense={() =>
          setViewer({
            fileName: detail.typeName + ".pdf",
            fileUrl: detail.summary.licensePreviewUrl,
          })
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
            onOpenDocument={openDocument}
          />
        </div>
      </div>

      <SignatureModal
        open={action === "approve"}
        detail={detail}
        signer={profile}
        isSubmitting={sign.isPending}
        onClose={() => setAction(null)}
        onConfirm={() => void handleSign()}
      />

      <ReturnForEditModal
        open={action === "return" || action === "reject"}
        mode={action === "reject" ? "reject" : "return"}
        isSubmitting={approve.isPending}
        onClose={() => setAction(null)}
        onConfirm={(values) => void handleReturnOrReject(values)}
      />

      <SuccessModal
        open={showSuccess}
        requestNo={detail.requestNo}
        onBackToList={() => {
          setShowSuccess(false);
          router.push(ROUTES.applications);
        }}
        onDownload={() =>
          toast.info("ดาวน์โหลดเอกสาร — รอ endpoint จากฝั่ง backend")
        }
      />

      {viewer && (
        <PDFViewer
          open
          fileName={viewer.fileName}
          fileUrl={viewer.fileUrl}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}
