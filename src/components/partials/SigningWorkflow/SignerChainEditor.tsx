"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  GripVertical,
  Info,
  Search,
  Users,
} from "lucide-react";
import { useSignerList } from "@/hooks/signers";
import { cn } from "@/lib/utils";
import { approvalLevelRank, type Signer } from "@/types/app/signers";
import type { SigningWorkflowStep } from "@/types/app/signingWorkflows";
import { approvalLevelLabel } from "@/components/partials/Signer/Signer.config";

const LIST_LIMIT = 50;
const PANE = "flex h-96 flex-col overflow-hidden rounded-xl border bg-white";
const PANE_HEAD =
  "flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5";
const COUNT_BADGE =
  "shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs whitespace-nowrap text-muted-foreground";
const LEVEL_BADGE =
  "shrink-0 rounded-full px-2 py-0.5 text-[11px] whitespace-nowrap";

export const newStepId = () =>
  `step-${crypto.randomUUID?.() ?? Date.now() + Math.random()}`;

interface SignerChainEditorProps {
  /** the signing order, as arranged here */
  steps: SigningWorkflowStep[];
  onChange: (steps: SigningWorkflowStep[]) => void;
  error?: string | false;
}

/**
 * ลำดับผู้ลงนาม — a transfer list: tick people in the searchable roster on the
 * left, เพิ่ม moves them into the chain on the right, นำออก takes the ones
 * marked there back out. The chain's order is the signing order: it follows the
 * order people were added, and is then rearranged by dragging, or reset to
 * ระดับการอนุมัติ order with จัดลำดับอัตโนมัติ.
 */
export function SignerChainEditor({
  steps,
  onChange,
  error,
}: SignerChainEditorProps) {
  const [keyword, setKeyword] = useState("");
  /** roster rows ticked for เพิ่ม — held as signers so a search can't drop one */
  const [picked, setPicked] = useState<Map<string, Signer>>(new Map());
  /** chain rows marked for นำออก */
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const { items, total, isLoading, isError } = useSignerList({
    keyword,
    activeOnly: true,
    page: 1,
    limit: LIST_LIMIT,
  });
  const inChain = new Set(steps.map((step) => step.signerId));

  const togglePick = (signer: Signer) =>
    setPicked((prev) => {
      const next = new Map(prev);
      if (!next.delete(signer.id)) next.set(signer.id, signer);
      return next;
    });

  const toggleMark = (signerId: string) =>
    setMarked((prev) => {
      const next = new Set(prev);
      if (!next.delete(signerId)) next.add(signerId);
      return next;
    });

  const add = () => {
    const added = [...picked.values()]
      .filter((signer) => !inChain.has(signer.id))
      .map((signer) => ({
        id: newStepId(),
        signerId: signer.id,
        signerName: signer.name,
        position: signer.position,
        approvalLevel: signer.approvalLevel,
      }));
    if (added.length) onChange([...steps, ...added]);
    setPicked(new Map());
  };

  const removeMarked = () => {
    onChange(steps.filter((step) => !marked.has(step.signerId)));
    setMarked(new Set());
  };

  const autoSort = () =>
    onChange(
      [...steps].sort(
        (a, b) =>
          approvalLevelRank(a.approvalLevel) - approvalLevelRank(b.approvalLevel),
      ),
    );

  const dropOn = (to: number) => {
    if (dragIndex === null || dragIndex === to) return;
    const next = [...steps];
    next.splice(to, 0, ...next.splice(dragIndex, 1));
    onChange(next);
    setDragIndex(null);
  };

  const addable = [...picked.keys()].some((id) => !inChain.has(id));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className={PANE}>
          <header className={PANE_HEAD}>
            <span className="text-sm font-bold text-foreground">
              รายชื่อผู้มีอำนาจลงนาม
            </span>
            <span className={COUNT_BADGE}>ทั้งหมด {total} คน</span>
          </header>

          <div className="p-3">
            <div className="flex items-center gap-2 rounded-lg border px-2.5 py-2 focus-within:border-brand-navy-mid">
              <Search
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
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
              <li className="p-4 text-center text-sm text-destructive">
                โหลดรายชื่อไม่สำเร็จ
              </li>
            ) : isLoading ? (
              <li className="p-4 text-center text-sm text-muted-foreground">
                กำลังโหลด...
              </li>
            ) : items.length === 0 ? (
              <li className="p-4 text-center text-sm text-muted-foreground">
                ไม่พบผู้มีอำนาจลงนาม
              </li>
            ) : (
              items.map((signer) => {
                const added = inChain.has(signer.id);
                // no level = nothing to show as this signer's ระดับการอนุมัติ
                const disabled = added || !signer.approvalLevel;
                return (
                  <li key={signer.id}>
                    <label
                      className={cn(
                        "flex items-start gap-3 px-3 py-2.5",
                        disabled
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:bg-secondary",
                        picked.has(signer.id) && "bg-brand-navy-mid/5",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={picked.has(signer.id)}
                        disabled={disabled}
                        onChange={() => togglePick(signer)}
                        className="mt-0.5 size-4 shrink-0 accent-brand-navy-mid"
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-sm font-semibold text-brand-navy-mid">
                          {signer.name}
                        </span>
                        {signer.position && (
                          <span
                            className="truncate text-xs text-muted-foreground"
                            title={signer.position}
                          >
                            {signer.position}
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          LEVEL_BADGE,
                          signer.approvalLevel
                            ? "bg-brand-navy-mid/10 text-brand-navy-mid"
                            : "bg-action-reject/10 text-action-reject",
                        )}
                      >
                        {added
                          ? "เพิ่มแล้ว"
                          : approvalLevelLabel(signer.approvalLevel)}
                      </span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>

          {total > items.length && (
            <p className="border-t px-3 py-2 text-xs text-muted-foreground">
              แสดง {items.length} จาก {total} คน · พิมพ์ค้นหาเพื่อหาคนอื่น
            </p>
          )}
        </div>

        <div className="flex flex-row items-center justify-center gap-2 lg:flex-col">
          <button
            type="button"
            onClick={add}
            disabled={!addable}
            className="flex items-center gap-2 rounded-lg bg-brand-navy-mid px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-hover disabled:bg-secondary disabled:text-muted-foreground"
          >
            เพิ่ม
            <ArrowRight className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={removeMarked}
            disabled={marked.size === 0}
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold text-brand-navy-mid hover:bg-secondary disabled:border-transparent disabled:bg-secondary disabled:text-muted-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            นำออก
          </button>
        </div>

        <div className={cn(PANE, error && "border-destructive")}>
          <header className={PANE_HEAD}>
            <span className="text-sm font-bold text-brand-navy-mid">
              ผู้ลงนามในกระบวนการ
            </span>
            <span className="flex items-center gap-2">
              <span className={COUNT_BADGE}>ทั้งหมด {steps.length} คน</span>
              <button
                type="button"
                onClick={autoSort}
                disabled={steps.length < 2}
                className="flex items-center gap-1.5 rounded-lg bg-brand-navy-mid/10 px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-brand-navy-mid hover:bg-brand-navy-mid/20 disabled:opacity-50"
              >
                <ArrowUpDown className="size-3.5" aria-hidden />
                จัดลำดับอัตโนมัติ
              </button>
            </span>
          </header>

          {steps.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
              <Users className="size-8" aria-hidden />
              <p className="text-sm">ยังไม่มีผู้ลงนามในกระบวนการ</p>
              <p className="text-xs">
                เลือกรายชื่อด้านซ้าย แล้วกด “เพิ่ม” เพื่อจัดลำดับการลงนาม
              </p>
            </div>
          ) : (
            <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 [scrollbar-width:thin]">
              {steps.map((step, index) => (
                <li
                  key={step.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragEnd={() => setDragIndex(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dropOn(index)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border bg-white px-2 py-2",
                    dragIndex === index && "opacity-50",
                    marked.has(step.signerId) &&
                      "border-brand-navy-mid bg-brand-navy-mid/5",
                  )}
                >
                  <GripVertical
                    className="size-4 shrink-0 cursor-grab text-slate-300"
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => toggleMark(step.signerId)}
                    aria-pressed={marked.has(step.signerId)}
                    aria-label={`เลือก ${step.signerName} เพื่อนำออก`}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-navy-mid/10 text-xs font-bold text-brand-navy-mid">
                      {index + 1}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-semibold text-brand-navy-mid">
                        {step.signerName}
                      </span>
                      {step.position && (
                        <span
                          className="truncate text-xs text-muted-foreground"
                          title={step.position}
                        >
                          {step.position}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        LEVEL_BADGE,
                        step.approvalLevel
                          ? "bg-brand-navy-mid/10 text-brand-navy-mid"
                          : "bg-action-reject/10 text-action-reject",
                      )}
                    >
                      {approvalLevelLabel(step.approvalLevel)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-brand-navy-mid/5 px-3 py-2.5 text-xs text-brand-navy-mid">
        <Info className="size-4 shrink-0" aria-hidden />
        <span>
          ระบบจะจัดเรียงลำดับการลงนามตามลำดับที่เลือก
          คุณสามารถลาก (Drag &amp; Drop) เพื่อปรับลำดับได้ภายหลัง
        </span>
      </p>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
