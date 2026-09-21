"use client";

import { useState } from "react";
import { Pencil, Search, UserCog, X } from "lucide-react";
import {
  DataTh,
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
  SideDrawer,
  useDataTable,
} from "@/components/common";
import { usePermission, useProfile } from "@/hooks/profile";
import { useUserList } from "@/hooks/users";
import { formatThaiDateTime } from "@/lib/format";
import { nextSort } from "@/lib/sort";
import { cn } from "@/lib/utils";
import type { SortParams } from "@/types/app/common";
import { ROLE_PILL } from "./User.config";
import UserRoleForm from "./UserRoleForm";

const TH = "px-4 py-3 text-left text-sm font-bold whitespace-nowrap text-brand-navy-mid";
const TD = "px-4 py-3 align-top text-sm text-muted-foreground";

/**
 * ตั้งค่าระบบ › ผู้ใช้งาน — not in Figma; styled like บทบาทและสิทธิ์. Lists
 * the accounts and lets USERS:UPDATE change which roles each one holds. Your
 * own row can't be edited, so nobody locks themselves out by accident.
 */
export default function UserListContent() {
  const { can } = usePermission();
  const canUpdate = can("USERS:UPDATE");
  const { profile } = useProfile();
  const [draft, setDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState<SortParams>({});
  const table = useDataTable(sort, (key) => {
    setSort(nextSort(sort, key));
    setPage(1);
  });
  /** the drawer's subject: null = closed, otherwise that user's id */
  const [editing, setEditing] = useState<string | null>(null);

  const { items, total, isLoading, isError } = useUserList({
    keyword,
    ...sort,
    page,
    limit,
  });

  const search = (next: string) => {
    setKeyword(next);
    setPage(1);
  };

  const editable = (id: string) => canUpdate && id !== profile?.id;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-foreground">ผู้ใช้งาน</h1>
        <p className="text-sm text-muted-foreground">
          กำหนดบทบาทให้ผู้ใช้แต่ละคน สิทธิ์ของผู้ใช้คือสิทธิ์รวมของทุกบทบาทที่ได้รับ
        </p>
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
              placeholder="ค้นหาชื่อ หรืออีเมล"
              aria-label="ค้นหาผู้ใช้งาน"
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
            title={keyword ? "ไม่พบผู้ใช้งานที่ค้นหา" : "ยังไม่มีผู้ใช้งาน"}
            description={
              keyword ? "ลองเปลี่ยนคำค้นหาแล้วค้นหาอีกครั้ง" : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border">
              <table
                className={cn("w-full border-collapse", table.tableClassName)}
                style={table.tableStyle}
              >
                <thead className="border-b bg-[#f8fafc]">
                  <tr>
                    <DataTh {...table.th(0, "name")} className={TH}>
                      ชื่อ-นามสกุล
                    </DataTh>
                    <DataTh {...table.th(1, "position")} className={TH}>
                      ตำแหน่ง / หน่วยงาน
                    </DataTh>
                    <DataTh {...table.th(2, "roles")} className={`${TH} min-w-[220px]`}>
                      บทบาท
                    </DataTh>
                    <DataTh {...table.th(3, "lastLoginAt")} className={TH}>
                      เข้าสู่ระบบล่าสุด
                    </DataTh>
                    <DataTh {...table.th(4)} className={`${TH} text-right`}>
                      การดำเนินการ
                    </DataTh>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((user) => (
                    <tr
                      key={user.id}
                      onClick={editable(user.id) ? () => setEditing(user.id) : undefined}
                      className={cn(
                        "bg-white transition-colors hover:bg-[#f8fafc]",
                        editable(user.id) && "cursor-pointer",
                      )}
                    >
                      <td className={TD}>
                        <div className="flex flex-col">
                          <span className="font-semibold whitespace-nowrap text-brand-navy-mid">
                            {user.name}
                            {user.id === profile?.id && (
                              <span className="ml-1.5 font-normal text-muted-foreground">
                                (คุณ)
                              </span>
                            )}
                          </span>
                          <span className="text-xs">{user.email}</span>
                        </div>
                      </td>
                      <td className={TD}>
                        <div className="flex flex-col">
                          <span className="text-foreground">{user.position || "—"}</span>
                          <span className="text-xs">{user.department}</span>
                        </div>
                      </td>
                      <td className={TD}>
                        {user.roles.length ? (
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <span key={role.id} className={ROLE_PILL}>
                                {role.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "ยังไม่ได้รับบทบาท"
                        )}
                      </td>
                      <td className={`${TD} whitespace-nowrap`}>
                        {formatThaiDateTime(user.lastLoginAt)}
                      </td>
                      <td className={TD}>
                        {/* stopPropagation: the row itself opens the editor */}
                        <div
                          className="flex items-center justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {editable(user.id) && (
                            <button
                              type="button"
                              onClick={() => setEditing(user.id)}
                              aria-label={`กำหนดบทบาท ${user.name}`}
                              title="กำหนดบทบาท"
                              className="rounded-md p-2 text-brand-navy-mid hover:bg-secondary"
                            >
                              <Pencil className="size-4" aria-hidden />
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

      {/* mounted only while open so every visit starts on a fresh form */}
      {editing !== null && (
        <SideDrawer
          open
          onClose={() => setEditing(null)}
          title="กำหนดบทบาท"
          icon={<UserCog className="size-5" aria-hidden />}
          description="เลือกบทบาทที่ผู้ใช้นี้ได้รับ"
        >
          <UserRoleForm id={editing} onDone={() => setEditing(null)} />
        </SideDrawer>
      )}
    </div>
  );
}
