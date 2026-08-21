"use client";

import { useCallback, useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { PdfIcon } from "@/components/common";

// Served from /public — copied from node_modules/pdfjs-dist/build/pdf.worker.min.mjs.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const ZOOM_STEPS = [50, 75, 100, 125, 150, 200];

export interface PDFViewerProps {
  open: boolean;
  fileName: string;
  fileUrl?: string;
  onClose: () => void;
}

/**
 * Page/zoom/load state for one document. Keyed by fileUrl from the parent so
 * switching documents while the panel stays open remounts this with fresh
 * state, instead of needing an effect to reset it.
 */
function PDFDocumentView({ fileUrl }: { fileUrl?: string }) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [failed, setFailed] = useState(false);
  const [pageWidth, setPageWidth] = useState<number>();
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // a callback ref (not useEffect) so the observer attaches exactly when the
  // dialog's portalled content actually mounts, however late that happens
  const surfaceRef = useCallback((node: HTMLDivElement | null) => {
    resizeObserverRef.current?.disconnect();
    if (!node) return;
    // measure synchronously so the first paint already has the right size —
    // ResizeObserver's own first callback only fires after that paint
    setPageWidth(node.clientWidth - 80);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setPageWidth(entry.contentRect.width - 80);
    });
    observer.observe(node);
    resizeObserverRef.current = observer;
  }, []);

  const stepZoom = (direction: -1 | 1) => {
    const index = ZOOM_STEPS.indexOf(zoom);
    const next =
      ZOOM_STEPS[Math.min(Math.max(index + direction, 0), ZOOM_STEPS.length - 1)];
    setZoom(next);
  };

  const hasFile = Boolean(fileUrl) && !failed;

  return (
    <>
      {hasFile && (
        <div className="flex h-12 shrink-0 items-center justify-between bg-viewer-toolbar px-4">
          <div className="flex items-center gap-1">
            <input
              value={pageNumber}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isFinite(next)) {
                  setPageNumber(Math.min(Math.max(next, 1), numPages || 1));
                }
              }}
              aria-label="หน้าที่"
              className="w-12 rounded border border-viewer-border bg-viewer-field px-2 py-0.5 text-[13px] text-white"
            />
            <button
              type="button"
              aria-label="หน้าก่อนหน้า"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => p - 1)}
              className="disabled:opacity-40"
            >
              <ChevronLeft className="size-4 text-white" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="หน้าถัดไป"
              disabled={pageNumber >= numPages}
              onClick={() => setPageNumber((p) => p + 1)}
              className="disabled:opacity-40"
            >
              <ChevronRight className="size-4 text-white" aria-hidden />
            </button>
            <span className="text-[13px] text-viewer-muted">
              {pageNumber} / {numPages || 1}
            </span>
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
          </div>
        </div>
      )}

      <div
        ref={surfaceRef}
        className="flex min-h-0 flex-1 justify-center overflow-auto bg-[#525659] p-10"
      >
        {hasFile ? (
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages: total }) => setNumPages(total)}
            onLoadError={() => setFailed(true)}
            loading={
              <div className="flex h-full items-center justify-center text-sm text-white/70">
                กำลังโหลดเอกสาร...
              </div>
            }
            className="h-fit"
          >
            <Page
              pageNumber={pageNumber}
              width={pageWidth ? pageWidth * (zoom / 100) : undefined}
              className="shadow-lg"
            />
          </Document>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 text-white/70">
            <PdfIcon className="size-12" />
            <p className="text-sm">ไม่พบไฟล์เอกสาร</p>
          </div>
        )}
      </div>
    </>
  );
}

/** Figma: PDF Viewer/Fullscreen ใบอนุญาต (145:43) */
export function PDFViewer({ open, fileName, fileUrl, onClose }: PDFViewerProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          aria-label={fileName}
          className="fixed inset-x-0 bottom-0 top-auto z-50 flex h-[85vh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl outline-none data-open:animate-in data-open:slide-in-from-bottom data-open:slide-in-from-right-0 data-closed:animate-out data-closed:slide-out-to-bottom data-closed:slide-out-to-right-0 sm:inset-y-0 sm:top-0 sm:right-0 sm:left-auto sm:h-full sm:w-[90vw] sm:max-w-6xl sm:rounded-t-none sm:rounded-l-2xl sm:data-open:slide-in-from-right sm:data-open:slide-in-from-bottom-0 sm:data-closed:slide-out-to-right sm:data-closed:slide-out-to-bottom-0"
        >
          <div className="flex min-h-10 shrink-0 items-start justify-between gap-3 border-b bg-white px-4 py-2">
            <p className="min-w-0 flex-1 py-0.5 text-[13px] font-medium break-words text-viewer-field">
              {fileName}
            </p>
            <div className="flex shrink-0 items-center gap-3 py-0.5">
              <span className="text-[13px] font-medium text-viewer-field">
                ปิดหน้าต่าง
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="ปิดหน้าต่าง"
                className="flex size-6 shrink-0 items-center justify-center rounded-xl bg-destructive"
              >
                <X className="size-3.5 text-white" aria-hidden />
              </button>
            </div>
          </div>

          <PDFDocumentView key={fileUrl} fileUrl={fileUrl} />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
