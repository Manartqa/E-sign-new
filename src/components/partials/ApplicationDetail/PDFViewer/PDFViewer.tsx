"use client";

import { useEffect, useState } from "react";
import {
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Menu,
  Minus,
  MoreVertical,
  PenTool,
  Plus,
  Printer,
  Save,
  X,
} from "lucide-react";
import { PdfIcon } from "@/components/common";

const ZOOM_STEPS = [50, 75, 100, 125, 150, 200];

export interface PDFViewerProps {
  open: boolean;
  fileName: string;
  /** Served to an <iframe>; the browser renders the PDF natively. */
  fileUrl?: string;
  onClose: () => void;
}

/** Tools the design draws but that have no behaviour defined anywhere yet. */
const INERT_TOOLS = [
  { key: "pen", Icon: PenTool, label: "เครื่องมือวาด" },
  { key: "bookmark", Icon: BookmarkCheck, label: "บุ๊กมาร์ก" },
  { key: "save", Icon: Save, label: "บันทึก" },
  { key: "print", Icon: Printer, label: "พิมพ์" },
  { key: "more", Icon: MoreVertical, label: "เพิ่มเติม" },
];

/** Figma: PDF Viewer/Fullscreen ใบอนุญาต (145:43) */
export function PDFViewer({
  open,
  fileName,
  fileUrl,
  onClose,
}: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const totalPages = 1;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const stepZoom = (direction: -1 | 1) => {
    const index = ZOOM_STEPS.indexOf(zoom);
    const next =
      ZOOM_STEPS[
        Math.min(Math.max(index + direction, 0), ZOOM_STEPS.length - 1)
      ];
    setZoom(next);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={fileName}
      className="fixed inset-0 z-50 flex flex-col bg-black/40"
    >
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <div className="flex h-10 shrink-0 items-center justify-between border-b bg-white px-4">
          <p className="truncate text-[13px] font-medium text-viewer-field">
            {fileName}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-viewer-field">
              ปิดหน้าต่าง
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดหน้าต่าง"
              className="flex size-6 items-center justify-center rounded-xl bg-destructive"
            >
              <X className="size-3.5 text-white" aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex h-12 shrink-0 items-center justify-between bg-viewer-toolbar px-4">
          <div className="flex items-center gap-4">
            <Menu className="size-5 text-white" aria-hidden />
            <div className="flex items-center gap-1">
              <input
                value={page}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (Number.isFinite(next)) {
                    setPage(Math.min(Math.max(next, 1), totalPages));
                  }
                }}
                aria-label="หน้าที่"
                className="w-12 rounded border border-viewer-border bg-viewer-field px-2 py-0.5 text-[13px] text-white"
              />
              <button
                type="button"
                aria-label="หน้าก่อนหน้า"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="disabled:opacity-40"
              >
                <ChevronLeft className="size-4 text-white" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="หน้าถัดไป"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="disabled:opacity-40"
              >
                <ChevronRight className="size-4 text-white" aria-hidden />
              </button>
              <span className="text-[13px] text-viewer-muted">
                {page} / {totalPages}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="ย่อ"
              onClick={() => stepZoom(-1)}
              disabled={zoom === ZOOM_STEPS[0]}
              className="disabled:opacity-40"
            >
              <Minus className="size-4 text-white" aria-hidden />
            </button>
            <span className="rounded border border-viewer-border bg-viewer-field px-2 py-0.5 text-[13px] text-white">
              {zoom}%
            </span>
            <button
              type="button"
              aria-label="ขยาย"
              onClick={() => stepZoom(1)}
              disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]}
              className="disabled:opacity-40"
            >
              <Plus className="size-4 text-white" aria-hidden />
            </button>

            <span className="h-5 w-px bg-viewer-border" />

            {/* Drawn in the design, no behaviour specified — disabled rather
                than wired to something that does nothing. */}
            <div className="flex items-center gap-3">
              {INERT_TOOLS.map(({ key, Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  disabled
                  aria-label={label}
                  title={label + " — ยังไม่รองรับ"}
                  className="opacity-40"
                >
                  <Icon className="size-[18px] text-white" aria-hidden />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-[#525659] p-10">
          <div
            style={{ width: 800 * (zoom / 100) }}
            className="aspect-[800/862] shrink-0 bg-white shadow-lg"
          >
            {fileUrl ? (
              <iframe
                src={fileUrl}
                title={fileName}
                className="size-full border-0"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <PdfIcon className="size-12 text-slate-300" />
                <p className="text-sm">ไม่พบไฟล์เอกสาร</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
