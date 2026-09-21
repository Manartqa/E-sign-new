"use client";

import { useState, type FormEvent } from "react";
import { FileText, ListOrdered } from "lucide-react";
import { toast } from "sonner";
import {
  ErrorState,
  FormSection as Section,
  LabeledSelect,
  LoadingState,
} from "@/components/common";
import {
  useSigningWorkflow,
  useSigningWorkflowActions,
} from "@/hooks/signingWorkflows";
import { useApplicationTypes, useWeaponCategories } from "@/hooks/master";
import {
  type ReplacementUsage,
  type RequestUsage,
  type SigningWorkflowInput,
} from "@/types/app/signingWorkflows";
import {
  ALL_LICENSE_TYPES,
  ALL_WEAPON_CATEGORIES,
  REPLACEMENT_USAGE_OPTIONS,
  REQUEST_USAGE_OPTIONS,
} from "./SigningWorkflow.config";
import { SignerChainEditor, newStepId } from "./SignerChainEditor";

/** every select starts unpicked, so the form state holds "" until one is */
type Fields = Omit<
  SigningWorkflowInput,
  "requestUsage" | "replacementUsage"
> & {
  requestUsage: RequestUsage | "";
  replacementUsage: ReplacementUsage | "";
};

const EMPTY_INPUT: Fields = {
  name: "",
  weaponCategory: "",
  licenseType: "",
  requestUsage: "",
  replacementUsage: "",
  steps: [],
};

const FIELD =
  "h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-brand-navy-mid aria-invalid:border-destructive";
const SELECT_TRIGGER = "bg-white data-[size=default]:h-11";

interface SigningWorkflowFormContentProps {
  /** edit this workflow; omit to add a new one */
  id?: string;
  /** add mode only — prefill from an existing workflow (สำเนา) */
  copyFromId?: string;
  /** close the drawer — on save, and on ยกเลิก */
  onDone: () => void;
}

/**
 * ตั้งค่าระบบ › เพิ่ม / แก้ไขกระบวนการลงนาม — not in Figma. Loads the source
 * workflow (edit or copy) first, then mounts the form with it as initial state,
 * so the fields never need syncing from an effect.
 *
 * Lives inside the list's SideDrawer, which carries the title and the way
 * back: the form has no heading of its own and closes through `onDone`.
 */
export default function SigningWorkflowFormContent({
  id,
  copyFromId,
  onDone,
}: SigningWorkflowFormContentProps) {
  const sourceId = id ?? copyFromId ?? "";
  const { workflow, isLoading, isError } = useSigningWorkflow(sourceId);

  if (sourceId && isError) return <ErrorState />;
  if (sourceId && isLoading) return <LoadingState rows={6} />;
  if (sourceId && !workflow)
    return (
      <ErrorState
        title="ไม่พบกระบวนการลงนามนี้"
        description={`ไม่พบรหัส ${sourceId} ในระบบ`}
      />
    );

  const initial: Fields = workflow
    ? {
        name: id ? workflow.name : `${workflow.name} (สำเนา)`,
        weaponCategory: workflow.weaponCategory,
        licenseType: workflow.licenseType,
        requestUsage: workflow.requestUsage,
        replacementUsage: workflow.replacementUsage,
        // fresh step ids on a copy so the two workflows never share them
        steps: id
          ? workflow.steps
          : workflow.steps.map((s) => ({ ...s, id: newStepId() })),
      }
    : EMPTY_INPUT;

  return (
    <WorkflowForm
      key={sourceId || "new"}
      id={id}
      initial={initial}
      onDone={onDone}
    />
  );
}

function WorkflowForm({
  id,
  initial,
  onDone,
}: {
  id?: string;
  initial: Fields;
  onDone: () => void;
}) {
  const { create, update } = useSigningWorkflowActions();
  const { options: weaponCategories } = useWeaponCategories();
  const { options: applicationTypes } = useApplicationTypes();
  const weaponCategoryOptions = [ALL_WEAPON_CATEGORIES, ...weaponCategories];
  const licenseTypeOptions = [ALL_LICENSE_TYPES, ...applicationTypes];
  const [form, setForm] = useState(initial);
  const [submitted, setSubmitted] = useState(false);

  const isEdit = Boolean(id);
  const saving = create.isPending || update.isPending;
  const nameMissing = form.name.trim() === "";
  const missing = {
    weaponCategory: !form.weaponCategory,
    licenseType: !form.licenseType,
    requestUsage: !form.requestUsage,
    replacementUsage: !form.replacementUsage,
  };
  const stepsError =
    form.steps.length === 0
      ? "กรุณาเลือกผู้ลงนามอย่างน้อย 1 คน"
      : form.steps.some((step) => !step.approvalLevel) &&
        "มีผู้ลงนามที่ยังไม่กำหนดระดับการอนุมัติ";
  const invalid =
    nameMissing || Object.values(missing).some(Boolean) || Boolean(stepsError);

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (invalid) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบ");
      return;
    }
    const input: SigningWorkflowInput = {
      ...form,
      name: form.name.trim(),
      requestUsage: form.requestUsage as RequestUsage,
      replacementUsage: form.replacementUsage as ReplacementUsage,
    };
    try {
      if (id) await update.mutateAsync({ id, input });
      else await create.mutateAsync(input);
      toast.success(isEdit ? "บันทึกการแก้ไขแล้ว" : "เพิ่มกระบวนการลงนามแล้ว");
      onDone();
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4" noValidate>
      <Section
        icon={<FileText className="size-5" aria-hidden />}
        title="ข้อมูลกระบวนการ"
        description="กรอกข้อมูลรายละเอียดของกระบวนการลงนาม"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="workflow-name" className="text-sm font-medium">
            ชื่อกระบวนการอนุมัติ
            <span className="ml-1 text-destructive">*</span>
          </label>
          <input
            id="workflow-name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="เช่น ใบอนุญาต นำเรียน รอง ปล.กห."
            aria-invalid={(submitted && nameMissing) || undefined}
            className={FIELD}
          />
          {submitted && nameMissing && (
            <p className="text-xs text-destructive">กรุณากรอกชื่อกระบวนการ</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <LabeledSelect
            label="ประเภทยุทธภัณฑ์"
            required
            placeholder="กรุณาเลือกประเภทยุทธภัณฑ์"
            invalid={submitted && missing.weaponCategory}
            value={form.weaponCategory}
            options={weaponCategoryOptions}
            onChange={(v) => set("weaponCategory", v)}
            triggerClassName={SELECT_TRIGGER}
          />
          <LabeledSelect
            label="ประเภทใบอนุญาต"
            required
            placeholder="กรุณาเลือกประเภทใบอนุญาต"
            invalid={submitted && missing.licenseType}
            value={form.licenseType}
            options={licenseTypeOptions}
            onChange={(v) => set("licenseType", v)}
            triggerClassName={SELECT_TRIGGER}
          />
          <LabeledSelect
            label="การใช้กับคำขอใหม่หรือต่ออายุ"
            required
            placeholder="กรุณาเลือกการใช้กับคำขอใหม่หรือต่ออายุ"
            invalid={submitted && missing.requestUsage}
            value={form.requestUsage}
            options={REQUEST_USAGE_OPTIONS}
            onChange={(v) => set("requestUsage", v as RequestUsage)}
            triggerClassName={SELECT_TRIGGER}
          />
          <LabeledSelect
            label="การใช้กับคำขอใบแทน"
            required
            placeholder="กรุณาเลือกการใช้กับคำขอใบแทน"
            invalid={submitted && missing.replacementUsage}
            value={form.replacementUsage}
            options={REPLACEMENT_USAGE_OPTIONS}
            onChange={(v) => set("replacementUsage", v as ReplacementUsage)}
            triggerClassName={SELECT_TRIGGER}
          />
        </div>
      </Section>

      <Section
        icon={<ListOrdered className="size-5" aria-hidden />}
        title="ลำดับผู้ลงนาม"
        description="เลือกผู้มีอำนาจลงนามจากรายชื่อด้านซ้าย และจัดลำดับการลงนามด้านขวา ระบบจะจัดลำดับการอนุมัติโดยอัตโนมัติ หรือคุณสามารถจัดลำดับได้เอง"
      >
        <SignerChainEditor
          steps={form.steps}
          onChange={(steps) => set("steps", steps)}
          error={submitted && stepsError}
        />
      </Section>

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
