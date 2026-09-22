"use client";

import { Download, Loader2, MonitorCog, PlugZap, RefreshCw } from "lucide-react";
import {
  SIGNING_AGENT_INSTALLER_URL,
  SIGNING_AGENT_MIN_VERSION,
} from "@/constant/signingAgent";
import type { SigningAgentState } from "@/types/app/signing";

interface SigningAgentSetupProps {
  /** any state but `ready` */
  agent: Exclude<SigningAgentState, { status: "ready" }>;
  /** start an installed agent that isn't running */
  onLaunch: () => void;
}

const DOWNLOAD =
  "flex w-fit items-center gap-2 rounded-lg bg-brand-navy-mid px-4 py-2 text-xs font-semibold text-white hover:bg-brand-navy-hover";

/**
 * Not in Figma. Shown in place of the token and PIN while this PC has no
 * usable signing agent: install it (first time only), update it, or fix the
 * missing SafeNet driver. The hook keeps looking for the agent in the
 * background, so the dialog moves on by itself — no button to press after.
 */
export function SigningAgentSetup({ agent, onLaunch }: SigningAgentSetupProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4" aria-live="polite">
      {agent.status === "missing" && (
        <>
          <Heading
            icon={<MonitorCog className="size-5 text-brand-navy-mid" aria-hidden />}
            title="ติดตั้งโปรแกรมลงนาม"
            text="ติดตั้งครั้งแรกครั้งเดียวต่อเครื่อง เพื่อให้เว็บไซต์ใช้ USB Token ลงนามได้"
          />
          <ol className="flex flex-col gap-3 text-[13px] text-foreground">
            <Step n={1}>
              <span>ดาวน์โหลดตัวติดตั้ง</span>
              <a href={SIGNING_AGENT_INSTALLER_URL} download className={DOWNLOAD}>
                <Download className="size-3.5" aria-hidden />
                ดาวน์โหลดตัวติดตั้ง
              </a>
            </Step>
            <Step n={2}>
              เปิดไฟล์ที่ดาวน์โหลดแล้วทำตามขั้นตอน — ไม่ต้องใช้สิทธิ์ผู้ดูแลเครื่อง
            </Step>
            <Step n={3}>ติดตั้งเสร็จแล้ว หน้านี้จะไปขั้นลงนามต่อเอง</Step>
          </ol>
          <Waiting>
            ติดตั้งแล้วแต่ยังไม่พบ?{" "}
            <button
              type="button"
              onClick={onLaunch}
              className="font-semibold text-brand-navy-mid underline-offset-2 hover:underline"
            >
              เปิดโปรแกรมลงนาม
            </button>
          </Waiting>
        </>
      )}

      {agent.status === "outdated" && (
        <>
          <Heading
            icon={<RefreshCw className="size-5 text-brand-navy-mid" aria-hidden />}
            title="ต้องอัปเดตโปรแกรมลงนาม"
            text={`เวอร์ชันบนเครื่องนี้คือ ${agent.version} ต้องเป็น ${SIGNING_AGENT_MIN_VERSION} ขึ้นไป — ติดตั้งทับได้เลย`}
          />
          <a href={SIGNING_AGENT_INSTALLER_URL} download className={DOWNLOAD}>
            <Download className="size-3.5" aria-hidden />
            ดาวน์โหลดเวอร์ชันใหม่
          </a>
          <Waiting />
        </>
      )}

      {agent.status === "noDriver" && (
        <>
          <Heading
            icon={<PlugZap className="size-5 text-destructive" aria-hidden />}
            title="ไม่พบไดรเวอร์ SafeNet"
            text="เครื่องนี้ยังไม่มี SafeNet Authentication Client ซึ่งจำเป็นต่อการใช้ USB Token กรุณาติดต่อผู้ดูแลเครื่องให้ติดตั้ง"
          />
          <Waiting label="กำลังรอไดรเวอร์ SafeNet..." />
        </>
      )}
    </div>
  );
}

function Heading({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
        {icon}
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-[13px] text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-navy-mid/10 text-xs font-bold text-brand-navy-mid">
        {n}
      </span>
      <div className="flex min-w-0 flex-col gap-2 pt-0.5">{children}</div>
    </li>
  );
}

/** the background re-check, plus whatever hint the state has */
function Waiting({
  label = "กำลังรอโปรแกรมลงนาม...",
  children,
}: {
  label?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-t pt-3 text-xs text-muted-foreground">
      <p className="flex items-center gap-2">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        {label}
      </p>
      {children && <p>{children}</p>}
    </div>
  );
}
