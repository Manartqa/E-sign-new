"use client";

import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** panel width from `sm` up; full width on a phone */
  className?: string;
  children: React.ReactNode;
}

/**
 * A panel that slides in from the right — not in Figma, and not something the
 * dialog primitive can be talked into: its Popup hardcodes the centred,
 * zooming variant. Built straight on the Base UI dialog instead, so the two
 * cannot fight over the same utilities.
 *
 * The body scrolls on its own, which is what lets a form keep its save bar
 * pinned to the bottom of the panel.
 */
export function SideDrawer({
  open,
  onClose,
  title,
  description,
  className,
  children,
}: SideDrawerProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 duration-200 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-background shadow-[-8px_0_24px_-8px_rgba(0,0,0,0.15)] outline-none duration-200",
            "data-closed:animate-out data-closed:slide-out-to-right data-open:animate-in data-open:slide-in-from-right motion-reduce:animate-none",
            "sm:w-[520px]",
            className,
          )}
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4">
            <div className="flex min-w-0 flex-col gap-1">
              <DialogPrimitive.Title className="text-lg font-bold text-foreground">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="ปิด"
              className="-mr-1 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </header>

          {/* no bottom padding: a form's sticky save bar has to reach the
              panel's own edge — `bottom-0` sticks to the scrollport's content
              box, so any padding here would leave a gap under it. Content
              that needs breathing room at the end adds its own. */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-secondary/40 px-5 pt-4">
            {children}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
