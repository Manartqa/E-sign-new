"use client";

import { useId } from "react";
import { Info, Loader2, RefreshCw, Usb } from "lucide-react";
import { formatThaiShortDate } from "@/lib/format";
import type { SigningAgentState, SigningToken } from "@/types/app/signing";
import { SigningAgentSetup } from "./SigningAgentSetup";

interface TokenSignPanelProps {
  /** why this signature needs the token, e.g. "คุณเป็นผู้ลงนามลำดับสุดท้าย…" */
  note: string;
  /** the local signing agent; null while the first look is running */
  agent: SigningAgentState | null;
  onLaunchAgent: () => void;
  token: SigningToken | null;
  /** set when the token's certificate isn't the signed-in user's: no PIN then */
  ownerMismatch?: string;
  isDetecting: boolean;
  detectError: Error | null;
  onRedetect: () => void;
  pin: string;
  onPinChange: (pin: string) => void;
  /** signing in progress — the PIN must not change under it */
  disabled?: boolean;
  /** the failed signing attempt's message */
  error?: string;
  /** Enter in the PIN field */
  onSubmit?: () => void;
}

/**
 * The USB-token half of a signing dialog: detection status, a retry, and the
 * PIN. Shared by the single-request SignatureModal and the list's
 * BulkConfirmModal, which ask for the same thing in different frames — one
 * document versus the final-signer rows of a batch.
 */
export function TokenSignPanel({
  note,
  agent,
  onLaunchAgent,
  token,
  ownerMismatch,
  isDetecting,
  detectError,
  onRedetect,
  pin,
  onPinChange,
  disabled,
  error,
  onSubmit,
}: TokenSignPanelProps) {
  const pinId = useId();

  return (
    <div className="flex w-full flex-col gap-4 text-left">
      <div className="flex items-start gap-2.5 rounded-lg border border-info/40 bg-info/8 p-3">
        <Info className="size-4 shrink-0 text-info" aria-hidden />
        <p className="text-[13px] text-foreground">{note}</p>
      </div>

      {/* no usable agent on this PC yet: install / update / driver first;
          otherwise the token status: detecting → found / not found */}
      {agent && agent.status !== "ready" ? (
        <SigningAgentSetup agent={agent} onLaunch={onLaunchAgent} />
      ) : (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
            {isDetecting || !agent ? (
              <Loader2
                className="size-5 animate-spin text-muted-foreground"
                aria-hidden
              />
            ) : (
              <Usb
                className={
                  token && !ownerMismatch
                    ? "size-5 text-action-approve"
                    : "size-5 text-muted-foreground"
                }
                aria-hidden
              />
            )}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5" aria-live="polite">
            {!agent ? (
              <p className="text-sm text-muted-foreground">
                กำลังตรวจหาโปรแกรมลงนาม...
              </p>
            ) : isDetecting ? (
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
                {ownerMismatch && (
                  <p className="text-xs text-destructive" role="alert">
                    {ownerMismatch}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-destructive">
                {detectError?.message ?? "ไม่พบ USB Token"}
              </p>
            )}
          </div>
          {agent && !isDetecting && (!token || ownerMismatch) && (
            <button
              type="button"
              onClick={onRedetect}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-brand-navy-mid hover:bg-secondary"
            >
              <RefreshCw className="size-3.5" aria-hidden />
              ตรวจหาอีกครั้ง
            </button>
          )}
        </div>
      )}

      {token && !ownerMismatch && (
        <div className="flex flex-col gap-2">
          <label htmlFor={pinId} className="text-sm font-semibold text-black">
            รหัส PIN ของ USB Token
          </label>
          <input
            id={pinId}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) => onPinChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit?.();
            }}
            disabled={disabled}
            aria-invalid={Boolean(error) || undefined}
            className="h-11 rounded-lg border bg-[#f8fafc] px-3 text-sm tracking-widest outline-none focus:border-brand-navy-mid aria-invalid:border-destructive"
          />
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
