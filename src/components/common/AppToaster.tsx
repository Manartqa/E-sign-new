"use client";

import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

/**
 * Figma: modals-overlays › Toast Notifications (8:514).
 * White card, 4px coloured left border, 320px wide — one accent per variant:
 * success #22c55e, error #ef4444, info #0ea5e9, warning #f59e0b.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      icons={{
        success: <CheckCircle2 className="size-5 text-action-approve" />,
        error: <XCircle className="size-5 text-destructive" />,
        info: <Info className="size-5 text-info" />,
        warning: <AlertCircle className="size-5 text-action-return" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "w-80 gap-3 rounded-xl border-0 border-l-4 bg-white p-4 shadow-[0_4px_6px_rgba(0,0,0,0.03)]",
          title: "text-sm font-medium text-black",
          success: "border-l-action-approve",
          error: "border-l-destructive",
          info: "border-l-info",
          warning: "border-l-action-return",
        },
      }}
    />
  );
}
