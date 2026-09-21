"use client";

import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, FormSection, LoadingState } from "@/components/common";
import { Checkbox } from "@/components/ui/checkbox";
import { useRoleList } from "@/hooks/roles";
import { useUpdateUserRoles, useUser } from "@/hooks/users";
import { cn } from "@/lib/utils";
import type { User } from "@/types/app/users";

/** every role on one list — there are only a handful */
const ALL_ROLES = { limit: 100 };

/**
 * ตั้งค่าระบบ › ผู้ใช้งาน › กำหนดบทบาท — not in Figma. Lives inside the list's
 * SideDrawer, which carries the title; closes through `onDone`.
 */
export default function UserRoleForm({
  id,
  onDone,
}: {
  id: string;
  onDone: () => void;
}) {
  const { user, isLoading, isError } = useUser(id);

  if (isError) return <ErrorState />;
  if (isLoading) return <LoadingState rows={6} />;
  if (!user)
    return (
      <ErrorState title="ไม่พบผู้ใช้งานนี้" description={`ไม่พบรหัส ${id} ในระบบ`} />
    );

  return <RoleChecklist key={user.id} user={user} onDone={onDone} />;
}

function RoleChecklist({ user, onDone }: { user: User; onDone: () => void }) {
  const { items: roles, isLoading, isError } = useRoleList(ALL_ROLES);
  const update = useUpdateUserRoles();
  const [roleIds, setRoleIds] = useState(user.roles.map((role) => role.id));
  const [submitted, setSubmitted] = useState(false);

  const error = roleIds.length === 0 && "กรุณาเลือกบทบาทอย่างน้อย 1 บทบาท";

  const toggle = (roleId: string) =>
    setRoleIds((current) =>
      current.includes(roleId)
        ? current.filter((item) => item !== roleId)
        : [...current, roleId],
    );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (error) return;
    try {
      await update.mutateAsync({ id: user.id, roleIds });
      toast.success(`บันทึกบทบาทของ ${user.name} แล้ว`);
      onDone();
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-0.5 rounded-xl border bg-white p-4">
        <span className="font-semibold text-brand-navy-mid">{user.name}</span>
        <span className="text-sm text-muted-foreground">{user.email}</span>
        <span className="text-sm text-muted-foreground">
          {[user.position, user.department].filter(Boolean).join(" · ")}
        </span>
      </div>

      <FormSection
        icon={<ShieldCheck className="size-5" aria-hidden />}
        title="บทบาท"
        description="เลือกได้มากกว่า 1 บทบาท ผู้ใช้จะได้สิทธิ์รวมของทุกบทบาทที่เลือก"
      >
        {isError ? (
          <ErrorState />
        ) : isLoading ? (
          <LoadingState rows={4} />
        ) : (
          <div className="flex flex-col divide-y rounded-xl border bg-white">
            {roles.map((role) => {
              const checked = roleIds.includes(role.id);
              // a disabled role can't be handed out, only taken away
              const locked = !role.isActive && !checked;
              return (
                <label
                  key={role.id}
                  className={cn(
                    "flex items-start gap-3 p-4",
                    locked ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    disabled={locked}
                    onCheckedChange={() => toggle(role.id)}
                    aria-label={role.name}
                    className="mt-0.5 size-4 rounded-[3px]"
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-foreground">
                      {role.name}
                      {!role.isActive && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
                          ปิดใช้งาน
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {role.description || "—"}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
        {submitted && error && <p className="text-xs text-destructive">{error}</p>}
      </FormSection>

      <div className="sticky bottom-0 z-10 -mx-5 flex justify-end gap-2 border-t bg-background/95 px-5 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onDone}
          disabled={update.isPending}
          className="rounded-lg border px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary disabled:opacity-60"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={update.isPending}
          className="rounded-lg bg-brand-navy-mid px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-hover disabled:opacity-60"
        >
          {update.isPending ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
