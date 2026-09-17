"use client";

import { useState } from "react";
import { Search, UserPlus, Users, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useSignerList } from "@/hooks/signers";
import { cn } from "@/lib/utils";
import { approvalLevelRank, type Signer } from "@/types/app/signers";
import type { SigningWorkflowStep } from "@/types/app/signingWorkflows";
import { approvalLevelLabel } from "@/components/partials/Signer/Signer.config";

const LIST_LIMIT = 50;

export const newStepId = () =>
  `step-${crypto.randomUUID?.() ?? Date.now() + Math.random()}`;

const byLevel = (a: SigningWorkflowStep, b: SigningWorkflowStep) =>
  approvalLevelRank(a.approvalLevel) - approvalLevelRank(b.approvalLevel);

interface SignerChainEditorProps {
  /** kept sorted by approval level */
  steps: SigningWorkflowStep[];
  onChange: (steps: SigningWorkflowStep[]) => void;
  error?: string | false;
}

/**
 * ลำดับผู้ลงนาม, built for chains of 30+ people: tick signers in a searchable
 * checklist (side pane on desktop, dialog on mobile) and the chain on the right
 * groups them by ระดับการอนุมัติ — the order is never set by hand.
 */
export function SignerChainEditor({ steps, onChange, error }: SignerChainEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedIds = new Set(steps.map((step) => step.signerId));

  const toggle = (signer: Signer) =>
    onChange(
      selectedIds.has(signer.id)
        ? steps.filter((step) => step.signerId !== signer.id)
        : [
            ...steps,
            {
              id: newStepId(),
              signerId: signer.id,
              signerName: signer.name,
              position: signer.position,
              approvalLevel: signer.approvalLevel,
            },
          ].sort(byLevel),
    );

  const remove = (signerId: string) =>
    onChange(steps.filter((step) => step.signerId !== signerId));

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand-navy-mid/40 py-3 text-sm font-semibold text-brand-navy-mid hover:bg-brand-navy-mid/5 lg:hidden"
      >
        <UserPlus className="size-4" aria-hidden />
        เลือกผู้มีอำนาจลงนาม
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="hidden h-144 flex-col rounded-xl border bg-white lg:flex">
          <SignerChecklist selectedIds={selectedIds} onToggle={toggle} />
        </div>
        <SignerChain steps={steps} onRemove={remove} error={error} />
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[85dvh] w-[calc(100vw-2rem)] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0"
        >
          <DialogTitle className="border-b px-4 py-3 text-base font-bold">
            เลือกผู้มีอำนาจลงนาม
          </DialogTitle>
          <div className="flex min-h-0 flex-1 flex-col">
            <SignerChecklist selectedIds={selectedIds} onToggle={toggle} />
          </div>
          <div className="border-t p-3">
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="w-full rounded-lg bg-brand-navy-mid py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-hover"
            >
              เสร็จสิ้น ({steps.length} คน)
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SignerChecklist({
  selectedIds,
  onToggle,
}: {
  selectedIds: Set<string>;
  onToggle: (signer: Signer) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const { items, total, isLoading, isError } = useSignerList({
    keyword,
    activeOnly: true,
    page: 1,
    limit: LIST_LIMIT,
  });

  return (
    <>
      <div className="border-b p-3">
        <div className="flex items-center gap-2 rounded-lg border px-2.5 py-2 focus-within:border-brand-navy-mid">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ค้นหาชื่อ หรือตำแหน่ง"
            aria-label="ค้นหาผู้มีอำนาจลงนาม"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      <ul className="min-h-0 flex-1 divide-y overflow-y-auto [scrollbar-width:thin]">
        {isError ? (
          <li className="p-4 text-center text-sm text-destructive">โหลดรายชื่อไม่สำเร็จ</li>
        ) : isLoading ? (
          <li className="p-4 text-center text-sm text-muted-foreground">กำลังโหลด...</li>
        ) : items.length === 0 ? (
          <li className="p-4 text-center text-sm text-muted-foreground">ไม่พบผู้มีอำนาจลงนาม</li>
        ) : (
          items.map((signer) => {
            const checked = selectedIds.has(signer.id);
            // no level = nowhere to place them in the chain
            const disabled = !signer.approvalLevel && !checked;
            return (
              <li key={signer.id}>
                <label
                  className={cn(
                    "flex items-start gap-3 px-3 py-2.5",
                    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-secondary",
                    checked && "bg-brand-navy-mid/5",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => onToggle(signer)}
                    className="mt-0.5 size-4 shrink-0 accent-brand-navy-mid"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm text-foreground">{signer.name}</span>
                    {signer.position && (
                      <span className="truncate text-xs text-muted-foreground" title={signer.position}>
                        {signer.position}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] whitespace-nowrap",
                      signer.approvalLevel
                        ? "bg-secondary text-foreground"
                        : "bg-action-reject/10 text-action-reject",
                    )}
                  >
                    {approvalLevelLabel(signer.approvalLevel)}
                  </span>
                </label>
              </li>
            );
          })
        )}
      </ul>

      <p className="border-t px-3 py-2 text-xs text-muted-foreground">
        เลือกแล้ว {selectedIds.size} คน
        {total > items.length && ` · แสดง ${items.length} จาก ${total} คน พิมพ์ค้นหาเพื่อหาคนอื่น`}
      </p>
    </>
  );
}

function SignerChain({
  steps,
  onRemove,
  error,
}: {
  steps: SigningWorkflowStep[];
  onRemove: (signerId: string) => void;
  error?: string | false;
}) {
  const groups: SigningWorkflowStep[][] = [];
  steps.forEach((step) => {
    const group = groups.at(-1);
    if (group && group[0].approvalLevel === step.approvalLevel) group.push(step);
    else groups.push([step]);
  });

  return (
    <div className="flex flex-col gap-2 lg:h-144">
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-3 rounded-xl border bg-white p-3 lg:overflow-y-auto lg:[scrollbar-width:thin]",
          error && "border-destructive",
        )}
      >
        {groups.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
            <Users className="size-8" aria-hidden />
            <p className="text-sm">ยังไม่มีผู้ลงนาม</p>
            <p className="text-xs">เลือกผู้มีอำนาจลงนาม ระบบจะเรียงตามระดับการอนุมัติให้</p>
          </div>
        ) : (
          groups.map((group, index) => {
            const level = group[0].approvalLevel;
            const isLast = index === groups.length - 1;
            return (
              <section
                key={level || "none"}
                className={cn(
                  "rounded-xl border",
                  !level
                    ? "border-destructive/40 bg-action-reject/5"
                    : isLast && "border-action-approve/40 bg-action-approve/5",
                )}
              >
                <header className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pt-3 pb-2">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      isLast && level
                        ? "bg-action-approve text-white"
                        : "bg-brand-navy-mid/10 text-brand-navy-mid",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {approvalLevelLabel(level)}
                  </span>
                  <span className="text-xs text-muted-foreground">{group.length} คน</span>
                  {level && (group.length > 1 || isLast) && (
                    <span className="w-full pl-10 text-xs text-muted-foreground">
                      {[
                        group.length > 1 && "คนใดคนหนึ่งอนุมัติแล้วไประดับถัดไป",
                        isLast && "ระดับสุดท้าย",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                  {!level && (
                    <span className="w-full pl-10 text-xs text-destructive">
                      กำหนดระดับการอนุมัติให้คนเหล่านี้ หรือนำออกก่อนบันทึก
                    </span>
                  )}
                </header>
                <ul className="flex flex-col gap-1 px-2 pb-2 sm:pl-10">
                  {group.map((step) => (
                    <li
                      key={step.signerId}
                      className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-border"
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm text-foreground">{step.signerName}</span>
                        {step.position && (
                          <span className="truncate text-xs text-muted-foreground" title={step.position}>
                            {step.position}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemove(step.signerId)}
                        aria-label={`นำ ${step.signerName} ออก`}
                        title="นำออก"
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-action-reject/10 hover:text-action-reject"
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
