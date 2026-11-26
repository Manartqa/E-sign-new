"use client";

import { useState } from "react";
import { AlertTriangle, FileKey2, Usb, X } from "lucide-react";
import { SignIcon } from "@/components/common";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/profile";
import { useSigningToken } from "@/hooks/signing";
import { signMethodFor } from "@/lib/sign-method";
import type { ApplicationItem } from "@/types/app/applications";
import { TokenSignPanel } from "./TokenSignPanel";

interface SignatureModalProps {
  open: boolean;
  /**
   * what is being signed — one request from the detail page, or the selected
   * rows from the list. Only the shared list/detail fields are read.
   */
  details: ApplicationItem[];
  isSubmitting: boolean;
  /** the failed attempt's message, e.g. a wrong token PIN */
  error?: string;
  onClose: () => void;
  /** `pin` is set when the final signature is made with the USB token */
  onConfirm: (input: { pin?: string; notes: string }) => void;
}

/** below this the confirm button stays disabled — token PINs are 4+ chars */
const MIN_PIN_LENGTH = 4;
/** legacy APPROVAL_DESCRIPTION limit */
const NOTES_MAX = 512;

/**
 * Figma: modals-overlays › 1. Digital Signature Confirmation (8:444).
 * The design's signature preview and certificate block are removed at the
 * user's request — the modal confirms the document and the legal notice only.
 *
 * How the approval is made (not in Figma) follows signMethodFor: earlier
 * signers confirm with the button; where this officer is the LAST signer
 * (`isFinalSigner`) the signature is made by their own วิธีลงลายเซ็นต์ — the
 * USB token (detected here, PIN asked) or the certificate the server holds
 * (nothing to plug in). The batch is the same screen with the same rule — one
 * PIN covers every final-signer row in it. An optional หมายเหตุ goes with the
 * approval (legacy allowed one). The caller does the signing and reports a
 * failure back through `error`. Mount it only while open, so the PIN and
 * token state start fresh each time.
 */
export function SignatureModal({
  open,
  details,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: SignatureModalProps) {
  const [pin, setPin] = useState("");
  const [notes, setNotes] = useState("");
  /** the PIN the caller was given, so editing it drops a stale error */
  const [submittedPin, setSubmittedPin] = useState<string>();

  const { profile } = useProfile();
  // one officer holds one role, so they are the last signer on every request
  // here or on none of them — the batch never mixes the two
  const isFinal = details.some((item) => item.isFinalSigner);
  // unknown until the profile arrives — nothing is offered before then
  const method = profile ? signMethodFor(isFinal, profile.signingMethod) : undefined;
  const useToken = method === "USB_TOKEN";
  const single = details.length === 1 ? details[0] : null;

  const { agent, launchAgent, token, isDetecting, detectError, redetect } =
    useSigningToken(open && useToken);

  // the token's certificate must belong to the signed-in user: same email.
  // The backend must check it again — this only stops the officer early.
  const ownerMatches =
    Boolean(token && profile) &&
    token!.email.trim().toLowerCase() === profile!.email.trim().toLowerCase();

  const canConfirm =
    !isSubmitting &&
    (method === "CONFIRM" ||
      method === "CERTIFICATE_FILE" ||
      (useToken && ownerMatches && pin.length >= MIN_PIN_LENGTH));

  const confirm = () => {
    setSubmittedPin(pin);
    onConfirm({ pin: useToken ? pin : undefined, notes: notes.trim() });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && !isSubmitting && onClose()}
    >
      <DialogContent
        showCloseButton={false}
        className="w-[560px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 shadow-[0_32px_64px_rgba(0,0,0,0.25)]"
      >
        <header className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-3">
            <SignIcon className="size-5 text-brand-navy-mid" aria-hidden />
            <DialogTitle className="text-lg font-bold text-brand-navy-mid">
              ยืนยันการลงนามดิจิทัล
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="ปิด"
          >
            <X className="size-5 text-muted-foreground" aria-hidden />
          </button>
        </header>

        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-2 rounded-lg bg-[#f8fafc] p-4">
            <p className="text-[13px] font-bold text-black">รายละเอียดเอกสาร</p>

            {single ? (
              <>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm text-black">{single.typeName}</p>
                  <p className="text-[13px] text-muted-foreground">
                    เลขรับคำขอ: ({single.requestNo})
                  </p>
                </div>
                <div className="flex flex-col gap-0.5 text-[13px] text-muted-foreground">
                  <p>ผู้ยื่น: {single.applicantName}</p>
                  <p>ผู้ประกอบการ: {single.operatorName}</p>
                </div>
              </>
            ) : (
              // one officer holds one role, so the rows carry no detail worth
              // listing here — the count is what the batch is
              <p className="text-sm text-black">
                คำขอที่เลือกไว้ {details.length} รายการ
              </p>
            )}
          </div>

          {useToken && (
            <TokenSignPanel
              note="คุณเป็นผู้ลงนามลำดับสุดท้าย กรุณาเสียบ USB Token แล้วกรอกรหัส PIN เพื่อลงนาม"
              agent={agent}
              onLaunchAgent={launchAgent}
              token={token}
              ownerMismatch={
                token && profile && !ownerMatches
                  ? `ใบรับรองใน USB Token นี้เป็นของ ${token.email || "ผู้อื่น"} ไม่ตรงกับบัญชีที่เข้าสู่ระบบ (${profile.email}) กรุณาเสียบ USB Token ของคุณ`
                  : undefined
              }
              isDetecting={isDetecting}
              detectError={detectError}
              onRedetect={redetect}
              pin={pin}
              onPinChange={setPin}
              disabled={isSubmitting}
              error={pin === submittedPin ? error : undefined}
              onSubmit={() => {
                if (canConfirm) confirm();
              }}
            />
          )}

          {method === "CERTIFICATE_FILE" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2.5 rounded-lg border p-3">
                <FileKey2
                  className="size-4 shrink-0 text-brand-navy-mid"
                  aria-hidden
                />
                <p className="text-[13px] text-black">
                  คุณเป็นผู้ลงนามลำดับสุดท้าย ระบบจะลงนามด้วยใบรับรองอิเล็กทรอนิกส์ที่ลงทะเบียนไว้
                  {profile?.certificateFileName
                    ? ` (${profile.certificateFileName})`
                    : ""}{" "}
                  โดยไม่ต้องเสียบ USB Token
                </p>
              </div>
              {error && (
                <p role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>
          )}

          {method === null && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/5 p-3"
            >
              <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden />
              <p className="text-[13px] text-destructive">
                บัญชีนี้ยังไม่ได้กำหนดวิธีลงลายเซ็นต์ที่ใช้ลงนามได้ กรุณาติดต่อผู้ดูแลระบบ
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="sign-notes"
              className="flex items-center justify-between text-sm font-semibold text-black"
            >
              หมายเหตุ (ไม่บังคับ)
              <span className="text-xs font-normal text-muted-foreground">
                {notes.length}/{NOTES_MAX}
              </span>
            </label>
            <Textarea
              id="sign-notes"
              value={notes}
              maxLength={NOTES_MAX}
              disabled={isSubmitting}
              onChange={(e) => setNotes(e.target.value)}
              className="h-20 resize-none rounded-lg border bg-[#f8fafc] p-3 text-sm"
            />
          </div>

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
            disabled={isSubmitting}
            className="rounded-lg px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!canConfirm}
            className="flex items-center gap-2 rounded-lg bg-brand-navy-mid px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-navy-hover disabled:opacity-60"
          >
            {useToken && <Usb className="size-3.5" aria-hidden />}
            {isSubmitting
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
