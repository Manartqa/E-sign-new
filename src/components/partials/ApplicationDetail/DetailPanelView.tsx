"use client";

import { Timeline } from "@/components/common";
import { cn } from "@/lib/utils";
import type {
  DetailPanel,
  DetailSection,
  DocumentItem,
} from "@/types/app/applications";
import { DocumentTable } from "./DocumentTable";

/** label : value row — Figma 43:98 */
function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1 text-sm">
      <span className="w-52 shrink-0 text-muted-foreground">{label}</span>
      <span className="shrink-0 text-muted-foreground">:</span>
      <span className="min-w-0 flex-1 font-bold text-brand-navy-mid">
        {value}
      </span>
    </div>
  );
}

function SectionBlock({ section }: { section: DetailSection }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-base font-bold text-brand-navy-mid">
        {section.title}
      </h3>
      <div className="flex flex-col gap-2">
        {section.fields.map((field) => (
          <FieldRow key={field.label} {...field} />
        ))}
      </div>
    </div>
  );
}

interface DetailPanelViewProps {
  panel: DetailPanel;
  onOpenDocument?: (document: DocumentItem) => void;
}

/** Renders one tab panel. Figma: tabs-content (106:7034) */
export function DetailPanelView({
  panel,
  onOpenDocument,
}: DetailPanelViewProps) {
  if (panel.kind === "timeline") {
    return (
      <div className="rounded-lg bg-card px-6 py-6">
        <Timeline events={panel.events} />
      </div>
    );
  }

  if (panel.kind === "cards") {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {panel.cards.map((card) => (
          <div key={card.title} className="rounded-lg border bg-card p-5">
            <SectionBlock section={card} />
          </div>
        ))}
      </div>
    );
  }

  if (panel.kind === "table") {
    return (
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full border-collapse text-left">
          <thead className="border-b bg-[#f8fafc]">
            <tr>
              {panel.columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "border-r px-3 py-3 text-[13px] font-bold whitespace-nowrap text-brand-navy-mid",
                    column.width,
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {panel.rows.map((row, index) => (
              <tr
                key={index}
                className={cn(
                  "border-b",
                  index % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]",
                )}
              >
                {panel.columns.map((column) => (
                  <td
                    key={column.key}
                    className="border-r px-3 py-3 text-sm text-muted-foreground"
                  >
                    {row[column.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-card px-6 pt-1 pb-6">
      {panel.sections.map((section) => (
        <SectionBlock key={section.title} section={section} />
      ))}
      {panel.documents && (
        <DocumentTable documents={panel.documents} onOpen={onOpenDocument} />
      )}
    </div>
  );
}
