"use client";

import { Clock } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useIdleTimeout } from "@/hooks/auth/useIdleTimeout";
import { logoutEverywhere } from "@/lib/logout";

/** "1:05" */
export const formatCountdown = (ms: number) => {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

/**
 * Not in Figma: the idle sign-out warning (legacy signed out after 5 idle
 * minutes with no warning at all). ต่อเวลาใช้งาน keeps the session;
 * ออกจากระบบ is the same full logout as the header's.
 */
export function IdleTimeoutDialog() {
  const { remainingMs, isWarning, stayActive } = useIdleTimeout();

  return (
    <Dialog open={isWarning} onOpenChange={(next) => !next && stayActive()}>
      <DialogContent
        showCloseButton={false}
        className="w-[440px] max-w-[calc(100vw-2rem)] items-center gap-5 rounded-2xl p-8 text-center"
      >
        <Clock className="mx-auto size-10 text-action-return" aria-hidden />
        <DialogTitle className="text-lg font-bold text-brand-navy-mid">
          ใกล้หมดเวลาการใช้งาน
        </DialogTitle>
        <p className="text-sm text-muted-foreground">
          ไม่มีการใช้งานมาระยะหนึ่งแล้ว ระบบจะออกจากระบบอัตโนมัติใน{" "}
          <span className="font-bold text-foreground" aria-live="polite">
            {formatCountdown(remainingMs)}
          </span>{" "}
          นาที
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => void logoutEverywhere()}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary"
          >
            ออกจากระบบ
          </button>
          <button
            type="button"
            onClick={stayActive}
            className="rounded-lg bg-brand-navy-mid px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-hover"
          >
            ต่อเวลาใช้งาน
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
