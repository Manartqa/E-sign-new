"use client";

import { useState, type FormEvent } from "react";
import { FileText, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, FormSection, LoadingState } from "@/components/common";
import { Checkbox } from "@/components/ui/checkbox";
import { useRole, useRoleActions } from "@/hooks/roles";
import { cn } from "@/lib/utils";
import {
  ALL_PERMISSIONS,
  PERMISSION_MATRIX,
  permissionKey,
  type PermissionKey,
  type Role,
  type RoleInput,
} from "@/types/app/roles";
import { ACTION_COLUMNS, ACTION_LABELS, MODULE_LABELS } from "./Role.config";

const FIELD =
  "h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-brand-navy-mid aria-invalid:border-destructive";
const TEXTAREA = `${FIELD} h-auto min-h-24 py-2.5`;
const TH = "px-4 py-3 text-sm font-bold whitespace-nowrap text-brand-navy-mid";

/**
 * ตั้งค่าระบบ › เพิ่ม / แก้ไขบทบาท — not in Figma. A system role can be edited
 * but not deleted; nothing enforces the permissions yet.
 *
 * Lives inside the list's SideDrawer, which carries the title and the way
 * back: the form has no heading of its own and closes through `onDone`.
 */
export default function RoleFormContent({
  id,
  onDone,
}: {
  id?: string;
  onDone: () => void;
}) {
  const { role, isLoading, isError } = useRole(id ?? "");

  if (id && isError) return <ErrorState />;
  if (id && isLoading) return <LoadingState rows={6} />;
  if (id && !role)
    return (
      <ErrorState title="ไม่พบบทบาทนี้" description={`ไม่พบรหัส ${id} ในระบบ`} />
    );

  return (
    <RoleForm key={id ?? "new"} role={role ?? undefined} onDone={onDone} />
  );
}

function RoleForm({ role, onDone }: { role?: Role; onDone: () => void }) {
  const { create, update } = useRoleActions();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [isActive, setIsActive] = useState(role?.isActive ?? true);
  const [permissions, setPermissions] = useState<PermissionKey[]>(
    role?.permissions ?? [],
  );
  const [submitted, setSubmitted] = useState(false);

  const isEdit = Boolean(role);
  const saving = create.isPending || update.isPending;
  const allSelected = permissions.length === ALL_PERMISSIONS.length;

  const errors = {
    name: !name.trim() && "กรุณากรอกชื่อบทบาท",
    permissions: permissions.length === 0 && "กรุณาเลือกสิทธิ์อย่างน้อย 1 รายการ",
  };
  const show = (error: string | false) => submitted && error;

  const toggle = (key: PermissionKey) =>
    setPermissions((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key],
    );

  /** a module's row header ticks or clears every action it offers */
  const toggleModule = (keys: PermissionKey[], checked: boolean) =>
    setPermissions((current) =>
      checked
        ? [...current, ...keys.filter((key) => !current.includes(key))]
        : current.filter((key) => !keys.includes(key)),
    );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) {
      toast.error("กรุณากรอกข้อมูลให้ครบและถูกต้อง");
      return;
    }
    const input: RoleInput = {
      name: name.trim(),
      description: description.trim(),
      isActive,
      permissions,
    };
    try {
      if (role) await update.mutateAsync({ id: role.id, input });
      else await create.mutateAsync(input);
      toast.success(isEdit ? "บันทึกการแก้ไขแล้ว" : "เพิ่มบทบาทแล้ว");
      onDone();
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4" noValidate>
      <FormSection
        icon={<FileText className="size-5" aria-hidden />}
        title="ข้อมูลบทบาท"
        description="ตั้งชื่อบทบาทและอธิบายว่าบทบาทนี้ใช้กับใคร"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role-name" className="text-sm font-medium">
            ชื่อบทบาท<span className="ml-1 text-destructive">*</span>
          </label>
          <input
            id="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น ผู้ตรวจสอบคำขอ"
            aria-invalid={Boolean(show(errors.name)) || undefined}
            className={FIELD}
          />
          {show(errors.name) && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="role-description" className="text-sm font-medium">
            คำอธิบาย
          </label>
          <textarea
            id="role-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="อธิบายสั้น ๆ ว่าบทบาทนี้ทำอะไรได้บ้าง"
            className={TEXTAREA}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border bg-white p-4">
          <div className="flex flex-col gap-0.5">
            <span id="role-active-label" className="text-sm font-medium">
              ใช้งาน
            </span>
            <span className="text-xs text-muted-foreground">
              ปิดไว้ถ้าไม่ต้องการให้กำหนดบทบาทนี้ให้ผู้ใช้รายใหม่
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            aria-labelledby="role-active-label"
            onClick={() => setIsActive((value) => !value)}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors",
              isActive ? "bg-action-approve" : "bg-slate-300",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                isActive && "translate-x-5",
              )}
            />
          </button>
        </div>
      </FormSection>

      <FormSection
        icon={<KeyRound className="size-5" aria-hidden />}
        title="สิทธิ์การใช้งาน"
        description="ติ๊กสิทธิ์ที่บทบาทนี้ทำได้ ช่องที่เป็นขีดคือเมนูนั้นไม่มีสิทธิ์ดังกล่าว"
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            เลือกแล้ว {permissions.length} จาก {ALL_PERMISSIONS.length} สิทธิ์
          </span>
          <button
            type="button"
            onClick={() => setPermissions(allSelected ? [] : ALL_PERMISSIONS)}
            className="rounded-lg border border-brand-navy-mid px-4 py-2 text-sm font-semibold whitespace-nowrap text-brand-navy-mid hover:bg-secondary"
          >
            {allSelected ? "ล้างทั้งหมด" : "เลือกทั้งหมด"}
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full border-collapse">
            <thead className="border-b bg-[#f8fafc]">
              <tr>
                <th scope="col" className={`${TH} text-left`}>
                  เมนู / ส่วนงาน
                </th>
                {ACTION_COLUMNS.map((action) => (
                  <th key={action} scope="col" className={`${TH} text-center`}>
                    {ACTION_LABELS[action]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {PERMISSION_MATRIX.map(({ module, actions }) => {
                const keys = actions.map((action) =>
                  permissionKey(module, action),
                );
                const moduleChecked = keys.every((key) =>
                  permissions.includes(key),
                );
                return (
                  <tr key={module} className="bg-white">
                    <td className="px-4 py-3 align-top">
                      <label className="flex cursor-pointer items-start gap-3">
                        <Checkbox
                          checked={moduleChecked}
                          onCheckedChange={(checked) =>
                            toggleModule(keys, checked === true)
                          }
                          aria-label={`เลือกทุกสิทธิ์ของ ${MODULE_LABELS[module].label}`}
                          className="mt-0.5 size-4 rounded-[3px]"
                        />
                        <span className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold whitespace-nowrap text-foreground">
                            {MODULE_LABELS[module].label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {MODULE_LABELS[module].description}
                          </span>
                        </span>
                      </label>
                    </td>
                    {ACTION_COLUMNS.map((action) => {
                      if (!actions.includes(action))
                        return (
                          <td
                            key={action}
                            className="px-4 py-3 text-center text-sm text-slate-300"
                          >
                            —
                          </td>
                        );
                      const key = permissionKey(module, action);
                      return (
                        <td key={action} className="px-4 py-3 text-center">
                          <Checkbox
                            checked={permissions.includes(key)}
                            onCheckedChange={() => toggle(key)}
                            aria-label={`${MODULE_LABELS[module].label} — ${ACTION_LABELS[action]}`}
                            className="mx-auto size-4 rounded-[3px]"
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {show(errors.permissions) && (
          <p className="text-xs text-destructive">{errors.permissions}</p>
        )}
      </FormSection>

      <div className="sticky bottom-0 z-10 -mx-5 flex justify-end gap-2 border-t bg-background/95 px-5 py-3 backdrop-blur">
        <button
          type="button"
          onClick={onDone}
          disabled={saving}
          className="rounded-lg border px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary disabled:opacity-60"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-navy-mid px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-hover disabled:opacity-60"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </form>
  );
}
