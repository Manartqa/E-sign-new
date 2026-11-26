"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  TabNav,
} from "@/components/common";
import { ROUTES } from "@/constant/routes";
import { useApplicationActions, useApplicationDetail } from "@/hooks/applications";
import { useProfile } from "@/hooks/profile";
import { signMethodFor } from "@/lib/sign-method";
import { TokenSignError } from "@/services/application.service";
import {
  type ActionMode,
  type DetailTabKey,
  type DocumentItem,
  type ReturnFormValues,
} from "@/types/app/applications";
import { ApplicationDetailSummary } from "./ApplicationDetailSummary";
import { DetailPanelView } from "./DetailPanelView";
import { stepNotice, visibleDetailTabs } from "./ApplicationDetail.config";
import { ReturnForEditModal, SignatureModal } from "./Modal";
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
  const { approve, decide } = useApplicationActions(id);

  /** unset until the officer picks a tab — the first visible tab is shown */
  const [activeTab, setActiveTab] = useState<DetailTabKey>();
  const [action, setAction] = useState<ActionMode | null>(null);
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

  const tabs = visibleDetailTabs(detail.panels);
  const currentTab = tabs.some((tab) => tab.key === activeTab)
    ? activeTab!
    : tabs[0]?.key;
  const currentPanel = currentTab ? detail.panels[currentTab] : undefined;

  // earlier signers confirm; the final signer signs by their own method
  const handleSign = async (input: { pin?: string; notes: string }) => {
    const method = signMethodFor(detail.isFinalSigner, profile?.signingMethod);
    if (!method) return;
    try {
      await approve.mutateAsync({
        method,
        pin: input.pin,
        notes: input.notes,
        officerId: profile?.id ?? "",
      });
      // the list has the signed document's download, so no success dialog
      toast.success(`ลงนามสำเร็จ — คำขอ ${detail.requestNo}`);
      router.push(ROUTES.applications);
    } catch (error) {
      // a token failure is shown beside the PIN; anything else (already
      // signed, not this officer's turn …) is a toast, and the page refetches
      if (!(error instanceof TokenSignError)) {
        toast.error((error as Error).message);
        setAction(null);
      }
    }
  };

  const handleReturnOrReject = async (values: ReturnFormValues) => {
    const isReject = action === "reject";
    try {
      await decide.mutateAsync({
        action: isReject ? "REJECT" : "RETURN",
        reasonCode: values.reasonCode,
        notes: values.notes,
      });
      setAction(null);
      toast.success(isReject ? "ไม่อนุมัติคำขอแล้ว" : "ส่งคืนคำขอเพื่อแก้ไขแล้ว");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const openDocument = (document: DocumentItem) =>
    setViewer({ fileName: document.name + ".pdf", fileUrl: document.fileUrl });

  return (
    <div className="flex flex-col gap-4">
      <Link
        // a request waiting for this officer goes back to the รอการอนุมัติ
        // list, the only list that menu shows
        href={detail.canAct ? ROUTES.applicationsPending : ROUTES.applications}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-brand-navy-mid"
      >
        <ChevronLeft className="size-4" aria-hidden />
        กลับไปรายการคำขอ
      </Link>

      <ApplicationDetailSummary
        summary={detail.summary}
        canAct={detail.canAct}
        notice={stepNotice(detail)}
        onAction={setAction}
        onPreviewLicense={() =>
          setViewer({
            fileName: detail.typeName + ".pdf",
            fileUrl: detail.summary.licensePreviewUrl,
          })
        }
      />

      <div className="rounded-xl border bg-card">
        {currentPanel ? (
          <>
            <TabNav
              items={tabs}
              value={currentTab}
              onChange={(key) => setActiveTab(key as DetailTabKey)}
              className="px-2"
            />
            {/* not in Figma: keyed by tab so each switch remounts and fades in */}
            <div
              key={currentTab}
              className="animate-in p-2 duration-200 fade-in motion-reduce:animate-none"
            >
              <DetailPanelView
                panel={currentPanel}
                tab={currentTab}
                onOpenDocument={openDocument}
              />
            </div>
          </>
        ) : (
          <EmptyState
            title="ไม่มีรายละเอียดคำขอ"
            description="ระบบยังไม่ได้รับข้อมูลรายละเอียดของคำขอนี้จากต้นทาง"
          />
        )}
      </div>

      {/* mounted only while open so the token PIN never survives a close */}
      {action === "approve" && (
        <SignatureModal
          open
          details={[detail]}
          isSubmitting={approve.isPending}
          error={
            approve.error instanceof TokenSignError
              ? approve.error.message
              : undefined
          }
          onClose={() => setAction(null)}
          onConfirm={(input) => void handleSign(input)}
        />
      )}

      {/* mounted only while open, like SignatureModal above: the reason select
          seeds its state from the mode's own list, which a modal kept mounted
          across both modes would keep from the mode it first rendered in */}
      {(action === "return" || action === "reject") && (
        <ReturnForEditModal
          open
          mode={action}
          isSubmitting={decide.isPending}
          onClose={() => setAction(null)}
          onConfirm={(values) => void handleReturnOrReject(values)}
        />
      )}

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
