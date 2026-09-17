"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constant/routes";
import {
  useNotificationActions,
  useNotifications,
} from "@/hooks/notifications";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types/app/notifications";
import { NOTIFICATION_META } from "../AdminLayout.config";

/**
 * Not in Figma — the header bell had no panel design. Opens a list of recent
 * notifications; clicking one marks it read and, when it concerns an
 * application, opens that application's detail page.
 */
export function NotificationMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, isLoading, isError } = useNotifications();
  const { markRead, markAllRead } = useNotificationActions();

  const openItem = (item: NotificationItem) => {
    if (!item.read) markRead.mutate(item.id);
    if (item.applicationId) {
      setOpen(false);
      router.push(ROUTES.applicationDetail(item.applicationId));
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={
          unreadCount > 0
            ? `การแจ้งเตือน ยังไม่อ่าน ${unreadCount} รายการ`
            : "การแจ้งเตือน"
        }
        className="relative flex size-6 items-center justify-center"
      >
        <Bell className="size-6 text-muted-foreground" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 size-2 rounded border-2 border-white bg-destructive" />
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={12}
        className="flex w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] sm:w-96"
      >
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">การแจ้งเตือน</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={unreadCount === 0 || markAllRead.isPending}
            className="flex items-center gap-1 text-xs font-semibold text-brand-navy-mid hover:underline disabled:pointer-events-none disabled:text-slate-400"
          >
            <CheckCheck className="size-3.5" aria-hidden />
            อ่านทั้งหมด
          </button>
        </header>

        <div className="max-h-[min(28rem,70dvh)] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-4" aria-busy="true">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <p className="px-4 py-10 text-center text-sm text-destructive">
              โหลดการแจ้งเตือนไม่สำเร็จ
            </p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <BellOff className="size-8 text-slate-300" aria-hidden />
              <p className="text-sm text-muted-foreground">
                ยังไม่มีการแจ้งเตือน
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((item) => {
                const { icon: Icon, className } = NOTIFICATION_META[item.type];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary",
                        !item.read && "bg-brand-blue/5",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full",
                          className,
                        )}
                      >
                        <Icon className="size-[18px]" aria-hidden />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span
                          className={cn(
                            "text-sm text-foreground",
                            item.read ? "font-medium" : "font-bold",
                          )}
                        >
                          {item.title}
                        </span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {item.message}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatRelative(item.createdAt)}
                        </span>
                      </span>
                      {!item.read && (
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-blue"
                          aria-label="ยังไม่อ่าน"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
