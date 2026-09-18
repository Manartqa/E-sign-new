"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
} from "@/components/common";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ROUTES } from "@/constant/routes";
import { useRoleActions, useRoleList } from "@/hooks/roles";
import { formatThaiDateTime } from "@/lib/format";
import { ALL_PERMISSIONS, type Role } from "@/types/app/roles";

const TH = "px-4 py-3 text-left text-sm font-bold whitespace-nowrap text-brand-navy-mid";
const TD = "px-4 py-3 align-top text-sm text-muted-foreground";
const PILL = "rounded-full px-2 py-0.5 text-xs whitespace-nowrap";

function Audit({ by, at }: { by: string; at: string }) {
  return (
    <div className="flex flex-col whitespace-nowrap">
      <span className="text-foreground">{by}</span>
      <span className="text-xs">{formatThaiDateTime(at)}</span>
    </div>
  );
}

/**
 * ตั้งค่าระบบ › บทบาทและสิทธิ์ — not in Figma; styled like ผู้มีอำนาจลงนาม.
 * The system role has no delete button (the service rejects it anyway).
 */
export default function RoleListContent() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleting, setDeleting] = useState<Role | null>(null);

  const { items, total, isLoading, isError } = useRoleList({
    keyword,
    page,
    limit,
  });
  const { remove } = useRoleActions();

  const search = (next: string) => {
    setKeyword(next);
    setPage(1);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      toast.success(`ลบบทบาท “${deleting.name}” แล้ว`);
      setDeleting(null);
      // stepping back keeps the user off an emptied last page
      if (items.length === 1 && page > 1) setPage(page - 1);
    } catch {
      toast.error("ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-foreground">บทบาทและสิทธิ์</h1>
          <p className="text-sm text-muted-foreground">
            กำหนดว่าแต่ละบทบาททำอะไรได้บ้างในระบบ
          </p>
        </div>
        <Link
          href={ROUTES.roleNew}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-navy-mid px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-hover"
        >
          <Plus className="size-4" aria-hidden />
          เพิ่มบทบาท
        </Link>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            search(draft);
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <div className="flex flex-1 items-center gap-2.5 rounded-lg border bg-white px-3 py-2.5 focus-within:border-brand-navy-mid sm:max-w-md">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="ค้นหาชื่อบทบาท หรือคำอธิบาย"
              aria-label="ค้นหาบทบาท"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {draft && (
              <button
                type="button"
                onClick={() => {
                  setDraft("");
                  search("");
                }}
                aria-label="ล้างคำค้นหา"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="rounded-lg border border-brand-navy-mid px-5 py-2.5 text-sm font-semibold text-brand-navy-mid hover:bg-secondary"
          >
            ค้นหา
          </button>
        </form>

        {isError ? (
          <ErrorState />
        ) : isLoading ? (
          <LoadingState rows={limit} />
        ) : items.length === 0 ? (
          <EmptyState
            title={keyword ? "ไม่พบบทบาทที่ค้นหา" : "ยังไม่มีบทบาท"}
            description={
              keyword
                ? "ลองเปลี่ยนคำค้นหาแล้วค้นหาอีกครั้ง"
                : "เพิ่มบทบาทเพื่อกำหนดสิทธิ์การใช้งานของผู้ใช้"
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full border-collapse">
                <thead className="border-b bg-[#f8fafc]">
                  <tr>
                    <th scope="col" className={TH}>
                      ชื่อบทบาท
                    </th>
                    <th scope="col" className={`${TH} min-w-[280px]`}>
                      คำอธิบาย
                    </th>
                    <th scope="col" className={TH}>
                      สิทธิ์ที่ได้รับ
                    </th>
                    <th scope="col" className={TH}>
                      สร้างโดย
                    </th>
                    <th scope="col" className={TH}>
                      ปรับปรุงล่าสุด
                    </th>
                    <th scope="col" className={`${TH} text-right`}>
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((role) => (
                    <tr
                      key={role.id}
                      onClick={() => router.push(ROUTES.roleEdit(role.id))}
                      className="cursor-pointer bg-white transition-colors hover:bg-[#f8fafc]"
                    >
                      <td className={TD}>
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-semibold whitespace-nowrap text-brand-navy-mid">
                            {role.name}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {role.isSystem && (
                              <span
                                className={`${PILL} bg-brand-navy-mid/10 text-brand-navy-mid`}
                              >
                                บทบาทระบบ
                              </span>
                            )}
                            {!role.isActive && (
                              <span
                                className={`${PILL} bg-secondary text-muted-foreground`}
                              >
                                ปิดใช้งาน
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={`${TD} text-foreground`}>
                        {role.description || "—"}
                      </td>
                      <td className={TD}>
                        <span className="whitespace-nowrap">
                          {role.permissions.length === ALL_PERMISSIONS.length
                            ? "ทุกสิทธิ์"
                            : `${role.permissions.length} สิทธิ์`}
                        </span>
                      </td>
                      <td className={TD}>
                        <Audit by={role.createdBy} at={role.createdAt} />
                      </td>
                      <td className={TD}>
                        <Audit by={role.updatedBy} at={role.updatedAt} />
                      </td>
                      <td className={TD}>
                        {/* stopPropagation: the row itself opens the editor */}
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={ROUTES.roleEdit(role.id)}
                            aria-label={`แก้ไข ${role.name}`}
                            title="แก้ไข"
                            className="rounded-md p-2 text-brand-navy-mid hover:bg-secondary"
                          >
                            <Pencil className="size-4" aria-hidden />
                          </Link>
                          {!role.isSystem && (
                            <button
                              type="button"
                              onClick={() => setDeleting(role)}
                              aria-label={`ลบ ${role.name}`}
                              title="ลบ"
                              className="rounded-md p-2 text-action-reject hover:bg-action-reject/10"
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              limit={limit}
              total={total}
              onPageChange={setPage}
              onLimitChange={(next) => {
                setLimit(next);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      <Dialog
        open={!!deleting}
        onOpenChange={(open) => !open && !remove.isPending && setDeleting(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="w-[440px] max-w-[calc(100vw-2rem)] gap-5 rounded-2xl p-6"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-action-reject/10">
              <Trash2 className="size-5 text-action-reject" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle className="text-base font-bold text-foreground">
                ลบบทบาท
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                ต้องการลบ “{deleting?.name}” ใช่หรือไม่ การลบไม่สามารถย้อนกลับได้
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              disabled={remove.isPending}
              className="rounded-lg border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              disabled={remove.isPending}
              className="rounded-lg bg-action-reject px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {remove.isPending ? "กำลังลบ..." : "ลบ"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
