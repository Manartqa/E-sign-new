"use client";

import { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { EmptyState, Timeline } from "@/components/common";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type {
  DetailPanel,
  DetailSection,
  DetailTabKey,
  DocumentItem,
} from "@/types/app/applications";
import { DETAIL_COLUMN_WIDTHS } from "./ApplicationDetail.config";
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

const LATITUDE_LABEL = "ข้อมูลละติจูด";
const LONGITUDE_LABEL = "ข้อมูลลองจิจูด";

const isCoordinate = (value: string) =>
  value.trim() !== "" && Number.isFinite(Number(value));

/**
 * แสดงแผนที่ — opens the coordinates in a dialog. The map is OpenStreetMap's
 * own embed, which needs no API key; the ดูใน Google Maps link covers driving
 * directions and street view, which the embed can't do.
 */
function MapButton({ lat, lng }: { lat: string; lng: string }) {
  const [open, setOpen] = useState(false);

  // a ~1km box around the point, so the marker opens at street level
  const span = 0.01;
  const bbox = [
    Number(lng) - span,
    Number(lat) - span,
    Number(lng) + span,
    Number(lat) + span,
  ].join(",");
  const point = encodeURIComponent(`${lat},${lng}`);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-2 self-center rounded-lg border border-brand-navy-mid px-4 py-2 text-sm font-semibold whitespace-nowrap text-brand-navy-mid hover:bg-secondary"
      >
        <MapPin className="size-4" aria-hidden />
        แสดงแผนที่
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[900px] max-w-[calc(100vw-2rem)] gap-3 rounded-2xl p-5 sm:max-w-[900px]">
          <div className="flex flex-col gap-0.5 pr-8">
            <DialogTitle className="text-base font-bold text-foreground">
              แผนที่ที่ตั้ง
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              ละติจูด {lat} · ลองจิจูด {lng}
            </p>
          </div>

          <iframe
            title="แผนที่ที่ตั้ง"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${point}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-[60vh] w-full rounded-xl border"
          />

          <a
            href={`https://www.google.com/maps?q=${point}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-navy-mid hover:underline"
          >
            <ExternalLink className="size-4" aria-hidden />
            ดูใน Google Maps
          </a>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SectionBlock({ section }: { section: DetailSection }) {
  const lat = section.fields.find((f) => f.label === LATITUDE_LABEL);
  const lng = section.fields.find((f) => f.label === LONGITUDE_LABEL);
  const mapped =
    lat && lng && isCoordinate(lat.value) && isCoordinate(lng.value);

  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="text-base font-bold text-brand-navy-mid">
        {section.title}
      </h3>
      <div className="flex flex-col gap-2">
        {section.fields.map((field) => {
          // the two coordinates keep their own rows; the button sits beside
          // them, centred on the gap, so it costs no row of its own
          if (mapped && field.label === LATITUDE_LABEL)
            return (
              <div key={field.label} className="flex items-stretch gap-6">
                {/* no flex-1: the rows stay as wide as their values, which
                    keeps the button next to the coordinates instead of out
                    at the card's edge */}
                <div className="flex min-w-0 flex-col gap-2">
                  <FieldRow {...lat} />
                  <FieldRow {...lng} />
                </div>
                <MapButton lat={lat.value} lng={lng.value} />
              </div>
            );
          if (mapped && field.label === LONGITUDE_LABEL) return null;
          return <FieldRow key={field.label} {...field} />;
        })}
      </div>
    </div>
  );
}

interface DetailPanelViewProps {
  /** undefined when the backend sends no panel for this tab */
  panel: DetailPanel | undefined;
  /** picks the table's column widths */
  tab: DetailTabKey;
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
  tab,
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
        widths={DETAIL_COLUMN_WIDTHS[tab]}
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
