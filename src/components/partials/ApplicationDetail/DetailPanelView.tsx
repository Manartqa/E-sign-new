"use client";

import { EmptyState, Timeline } from "@/components/common";
import type {
  DetailPanel,
  DetailSection,
  DocumentItem,
} from "@/types/app/applications";
import { AuthorizedPeoplePanel } from "./AuthorizedPeoplePanel";
import { DataTablePanel } from "./DataTablePanel";
import { DocumentTable } from "./DocumentTable";

/**
 * label : value row — Figma 43:98.
 *
 * Below `sm` there's no room for the 208px label column beside the value, so
 * the label stacks above it instead (colon dropped there — it only makes
 * sense inline). `break-words` keeps unbroken tokens like emails from
 * overflowing the row now that the value column can be quite narrow.
 */
function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 text-sm sm:flex-row sm:gap-1">
      <span className="text-muted-foreground sm:w-52 sm:shrink-0">
        {label}
      </span>
      <span className="hidden text-muted-foreground sm:inline sm:shrink-0">
        :
      </span>
      <span className="min-w-0 flex-1 font-bold break-words text-brand-navy-mid">
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
  /** undefined when the backend sends no panel for this tab */
  panel: DetailPanel | undefined;
  onOpenDocument?: (document: DocumentItem) => void;
}

const NoPanel = () => (
  <EmptyState
    title="ไม่มีข้อมูลในหัวข้อนี้"
    description="คำขอนี้ไม่มีข้อมูลส่วนนี้ หรือระบบยังไม่ได้รับข้อมูลจากต้นทาง"
  />
);

/** Renders one tab panel. Figma: tabs-content (106:7034) */
export function DetailPanelView({
  panel,
  onOpenDocument,
}: DetailPanelViewProps) {
  if (!panel) return <NoPanel />;

  if (panel.kind === "timeline") {
    return (
      <div className="flex flex-col gap-4 rounded-lg bg-card px-6 py-6">
        {panel.heading && (
          <h3 className="text-base font-bold text-brand-navy-mid">
            {panel.heading}
          </h3>
        )}
        <Timeline events={panel.events} />
      </div>
    );
  }

  if (panel.kind === "documents") {
    return (
      <div className="flex flex-col gap-4 rounded-lg bg-card px-6 pt-1 pb-6">
        <h3 className="text-base font-bold text-brand-navy-mid">
          {panel.heading}
        </h3>
        <DocumentTable
          documents={panel.documents}
          onOpen={onOpenDocument}
          compact={panel.compact}
        />
      </div>
    );
  }

  if (panel.kind === "people") {
    return (
      <AuthorizedPeoplePanel
        heading={panel.heading}
        people={panel.people}
        onOpenDocument={onOpenDocument}
      />
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
      <DataTablePanel
        heading={panel.heading}
        columns={panel.columns}
        rows={panel.rows}
      />
    );
  }

  // the union is closed, so `fields` is all that is left at compile time — but
  // a backend sending a kind this build doesn't know would land here too
  if (panel.kind !== "fields") return <NoPanel />;

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-card px-6 pt-1 pb-6">
      {panel.sections.map((section) => (
        <SectionBlock key={section.title} section={section} />
      ))}
      {panel.documents && (
        <div className="flex flex-col gap-2.5">
          <h3 className="text-base font-bold text-brand-navy-mid">
            ข้อมูลเอกสารหลักฐาน
          </h3>
          <DocumentTable documents={panel.documents} onOpen={onOpenDocument} />
        </div>
      )}
    </div>
  );
}
