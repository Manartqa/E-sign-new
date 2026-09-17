"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import {
  ErrorState,
  FormSection as Section,
  LabeledSelect,
  LoadingState,
} from "@/components/common";
import { ROUTES } from "@/constant/routes";
import {
  useSigningWorkflow,
  useSigningWorkflowActions,
} from "@/hooks/signingWorkflows";
import {
  REPLACEMENT_USAGE,
  REQUEST_USAGE,
  type ReplacementUsage,
  type RequestUsage,
  type SigningWorkflowInput,
} from "@/types/app/signingWorkflows";
import {
  LICENSE_TYPE_OPTIONS,
  REPLACEMENT_USAGE_OPTIONS,
  REQUEST_USAGE_OPTIONS,
  WEAPON_CATEGORY_OPTIONS,
} from "./SigningWorkflow.config";
import { SignerChainEditor, newStepId } from "./SignerChainEditor";

const EMPTY_INPUT: SigningWorkflowInput = {
  name: "",
  weaponCategory: "all",
  licenseType: "all",
  requestUsage: REQUEST_USAGE.NEW_AND_RENEW,
  replacementUsage: REPLACEMENT_USAGE.NORMAL_AND_REPLACEMENT,
  steps: [],
};

const FIELD =
  "h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-brand-navy-mid aria-invalid:border-destructive";

interface SigningWorkflowFormContentProps {
  /** edit this workflow; omit to add a new one */
  id?: string;
  /** add mode only — prefill from an existing workflow (สำเนา) */
  copyFromId?: string;
}

/**
 * ตั้งค่าระบบ › เพิ่ม / แก้ไขกระบวนการลงนาม — not in Figma. Loads the source
 * workflow (edit or copy) first, then mounts the form with it as initial state,
 * so the fields never need syncing from an effect.
 */
export default function SigningWorkflowFormContent({
  id,
  copyFromId,
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

  const initial: SigningWorkflowInput = workflow
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

  return <WorkflowForm key={sourceId || "new"} id={id} initial={initial} />;
}

function WorkflowForm({
  id,
  initial,
}: {
  id?: string;
  initial: SigningWorkflowInput;
}) {
  const router = useRouter();
  const { create, update } = useSigningWorkflowActions();
  const [form, setForm] = useState(initial);
  const [submitted, setSubmitted] = useState(false);

  const isEdit = Boolean(id);
  const saving = create.isPending || update.isPending;
  const nameMissing = form.name.trim() === "";
  const stepsError =
    form.steps.length === 0
      ? "กรุณาเลือกผู้ลงนามอย่างน้อย 1 คน"
      : form.steps.some((step) => !step.approvalLevel) &&
        "มีผู้ลงนามที่ยังไม่กำหนดระดับการอนุมัติ";
  const invalid = nameMissing || Boolean(stepsError);

  const set = <K extends keyof SigningWorkflowInput>(
    key: K,
    value: SigningWorkflowInput[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (invalid) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบ");
      return;
    }
    const input: SigningWorkflowInput = { ...form, name: form.name.trim() };
    try {
      if (id) await update.mutateAsync({ id, input });
      else await create.mutateAsync(input);
      toast.success(isEdit ? "บันทึกการแก้ไขแล้ว" : "เพิ่มกระบวนการลงนามแล้ว");
      router.push(ROUTES.signingWorkflows);
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4" noValidate>
      <Link
        href={ROUTES.signingWorkflows}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-brand-navy-mid"
      >
        <ChevronLeft className="size-4" aria-hidden />
        กลับไปรายการกระบวนการลงนาม
      </Link>

      <h1 className="text-xl font-bold text-foreground">
        {isEdit ? "แก้ไขกระบวนการลงนาม" : "เพิ่มกระบวนการลงนาม"}
      </h1>

      <Section title="ข้อมูลกระบวนการ">
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
            value={form.weaponCategory}
            options={WEAPON_CATEGORY_OPTIONS}
            onChange={(v) => set("weaponCategory", v)}
            triggerClassName="bg-white data-[size=default]:h-11"
          />
          <LabeledSelect
            label="ประเภทใบอนุญาต"
            required
            value={form.licenseType}
            options={LICENSE_TYPE_OPTIONS}
            onChange={(v) => set("licenseType", v)}
            triggerClassName="bg-white data-[size=default]:h-11"
          />
          <LabeledSelect
            label="การใช้กับคำขอใหม่หรือต่ออายุ"
            required
            value={form.requestUsage}
            options={REQUEST_USAGE_OPTIONS}
            onChange={(v) => set("requestUsage", v as RequestUsage)}
            triggerClassName="bg-white data-[size=default]:h-11"
          />
          <LabeledSelect
            label="การใช้กับคำขอใบแทน"
            required
            value={form.replacementUsage}
            options={REPLACEMENT_USAGE_OPTIONS}
            onChange={(v) => set("replacementUsage", v as ReplacementUsage)}
            triggerClassName="bg-white data-[size=default]:h-11"
          />
        </div>
      </Section>

      <Section
        title="ลำดับผู้ลงนาม"
        description="ลำดับเรียงตามระดับการอนุมัติของแต่ละคนโดยอัตโนมัติ ระดับที่มีหลายคน คนใดคนหนึ่งอนุมัติแล้วจะไประดับถัดไปทันที"
      >
        <SignerChainEditor
          steps={form.steps}
          onChange={(steps) => set("steps", steps)}
          error={submitted && stepsError}
        />
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <Link
          href={ROUTES.signingWorkflows}
          className="rounded-lg border px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary"
        >
          ยกเลิก
        </Link>
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
