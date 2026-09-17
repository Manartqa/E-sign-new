"use client";

import { useId, useState } from "react";
import {
  AlertTriangle,
  FileSignature,
  Info,
  Loader2,
  RefreshCw,
  Usb,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSigningToken } from "@/hooks/signing";
import { formatThaiShortDate } from "@/lib/format";
import type { ApplicationItem } from "@/types/app/applications";
import type { TokenSignResult } from "@/types/app/signing";

interface SignatureModalProps {
  open: boolean;
  /** only the shared list/detail fields are read, so either fits */
  detail: ApplicationItem;
  isSubmitting: boolean;
  onClose: () => void;
  /** `token` is set when the final signer signed with a USB token */
  onConfirm: (token?: TokenSignResult) => void;
}

/** below this the confirm button stays disabled — token PINs are 4+ chars */
const MIN_PIN_LENGTH = 4;

/**
 * Figma: modals-overlays › 1. Digital Signature Confirmation (8:444).
 * The design's signature preview and certificate block are removed at the
 * user's request — the modal confirms the document and the legal notice only.
 *
 * Two ways to sign (not in Figma, per the user): earlier signers confirm with
 * the button; the LAST signer (`detail.isFinalSigner`) must sign with a USB
 * token — the modal detects the token, asks for its PIN, signs on the token,
 * then hands the result to `onConfirm`. Mount it only while open, so the PIN
 * and token state start fresh each time.
 */
export function SignatureModal({
  open,
  detail,
  isSubmitting,
  onClose,
  onConfirm,
}: SignatureModalProps) {
  const useToken = detail.isFinalSigner;
  const pinId = useId();
  const [pin, setPin] = useState("");
  const { token, isDetecting, detectError, redetect, sign } =
    useSigningToken(open && useToken);

  const busy = isSubmitting || sign.isPending;
  const canConfirm = useToken
    ? Boolean(token) && pin.length >= MIN_PIN_LENGTH && !busy
    : !busy;

  const confirm = async () => {
    if (!useToken) return onConfirm();
    try {
      onConfirm(await sign.mutateAsync({ applicationId: detail.id, pin }));
    } catch {
      // the message is rendered from sign.error below
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[560px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 shadow-[0_32px_64px_rgba(0,0,0,0.25)]"
      >
        <header className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-3">
            <FileSignature className="size-5 text-brand-navy-mid" aria-hidden />
            <DialogTitle className="text-lg font-bold text-brand-navy-mid">
              ยืนยันการลงนามดิจิทัล
            </DialogTitle>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="ปิด">
            <X className="size-5 text-muted-foreground" aria-hidden />
          </button>
        </header>

        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-2 rounded-lg bg-[#f8fafc] p-4">
            <p className="text-[13px] font-bold text-black">รายละเอียดเอกสาร</p>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm text-black">{detail.typeName}</p>
              <p className="text-[13px] text-muted-foreground">
                เลขรับคำขอ: ({detail.requestNo})
              </p>
            </div>
            <div className="flex flex-col gap-0.5 text-[13px] text-muted-foreground">
              <p>ผู้ยื่น: {detail.applicantName}</p>
              <p>ผู้ประกอบการ: {detail.operatorName}</p>
            </div>
          </div>

          {useToken && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-2.5 rounded-lg border border-info/40 bg-info/8 p-3">
                <Info className="size-4 shrink-0 text-info" aria-hidden />
                <p className="text-[13px] text-foreground">
                  คุณเป็นผู้ลงนามลำดับสุดท้าย กรุณาเสียบ USB Token
                  แล้วกรอกรหัส PIN เพื่อลงนาม
                </p>
              </div>

              {/* token status: detecting → found / not found */}
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  {isDetecting ? (
                    <Loader2
                      className="size-5 animate-spin text-muted-foreground"
                      aria-hidden
                    />
                  ) : (
                    <Usb
                      className={
                        token
                          ? "size-5 text-action-approve"
                          : "size-5 text-muted-foreground"
                      }
                      aria-hidden
                    />
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5" aria-live="polite">
                  {isDetecting ? (
                    <p className="text-sm text-muted-foreground">
                      กำลังตรวจหา USB Token...
                    </p>
                  ) : token ? (
                    <>
                      <p className="text-sm font-semibold text-foreground">
                        {token.label}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {token.certificateOwner} · หมดอายุ{" "}
                        {formatThaiShortDate(token.validTo)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-destructive">
                      {detectError?.message ?? "ไม่พบ USB Token"}
                    </p>
                  )}
                </div>
                {!isDetecting && !token && (
                  <button
                    type="button"
                    onClick={redetect}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-brand-navy-mid hover:bg-secondary"
                  >
                    <RefreshCw className="size-3.5" aria-hidden />
                    ตรวจหาอีกครั้ง
                  </button>
                )}
              </div>

              {token && (
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor={pinId}
                    className="text-sm font-semibold text-black"
                  >
                    รหัส PIN ของ USB Token
                  </label>
                  <input
                    id={pinId}
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      sign.reset();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canConfirm) void confirm();
                    }}
                    disabled={busy}
                    aria-invalid={Boolean(sign.error) || undefined}
                    className="h-11 rounded-lg border bg-[#f8fafc] px-3 text-sm tracking-widest outline-none focus:border-brand-navy-mid aria-invalid:border-destructive"
                  />
                  {sign.error && (
                    <p className="text-xs text-destructive" role="alert">
                      {sign.error.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-start gap-2.5 rounded-lg border border-action-return bg-action-return/8 p-3">
            <AlertTriangle
              className="size-4 shrink-0 text-action-return"
              aria-hidden
            />
            <p className="text-[13px] text-status-pending-approval-fg">
              การลงนามนี้มีผลผูกพันทางกฎหมายตาม พ.ร.บ.
              ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544
            </p>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-3 bg-[#f8fafc] p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={!canConfirm}
            className="flex items-center gap-2 rounded-lg bg-brand-navy-mid px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-navy-hover disabled:opacity-60"
          >
            {useToken && <Usb className="size-3.5" aria-hidden />}
            {sign.isPending
              ? "กำลังลงนามด้วย Token..."
              : isSubmitting
                ? "กำลังลงนาม..."
                : useToken
                  ? "ลงนามด้วย USB Token"
                  : "ยืนยันการลงนาม"}
          </button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
