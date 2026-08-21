"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { AuthorizedPerson, DocumentItem } from "@/types/app/applications";
import { DocumentTable } from "./DocumentTable";

interface AuthorizedPeoplePanelProps {
  heading: string;
  people: AuthorizedPerson[];
  onOpenDocument?: (document: DocumentItem) => void;
}

function PersonCard({
  person,
  index,
  onOpenDocument,
}: {
  person: AuthorizedPerson;
  index: number;
  onOpenDocument?: (document: DocumentItem) => void;
}) {
  const [open, setOpen] = useState(true);
  const panelId = `person-docs-${person.id}`;

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-navy-mid text-xs font-bold text-white">
          {index + 1}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-bold text-brand-navy-mid">{person.name}</span>
            <span className="text-sm text-muted-foreground">{person.role}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">
              เลขที่บัตรประจำตัวประชาชน
            </span>{" "}
            <span className="font-bold text-brand-navy-mid">
              {person.nationalId}
            </span>
          </div>
        </div>

        {open ? (
          <ChevronUp
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        ) : (
          <ChevronDown
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        )}
      </button>

      {open && (
        <div id={panelId} className="px-5 pb-5">
          <DocumentTable
            documents={person.documents}
            onOpen={onOpenDocument}
            showPagination={false}
          />
        </div>
      )}
    </div>
  );
}

/** Figma 49:491 — บุคคลและผู้มีอำนาจ tab: one collapsible card per signer. */
export function AuthorizedPeoplePanel({
  heading,
  people,
  onOpenDocument,
}: AuthorizedPeoplePanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-card px-6 pt-1 pb-6">
      <h3 className="text-base font-bold text-brand-navy-mid">{heading}</h3>

      <div className="flex flex-col gap-4">
        {people.map((person, index) => (
          <PersonCard
            key={person.id}
            person={person}
            index={index}
            onOpenDocument={onOpenDocument}
          />
        ))}
      </div>
    </div>
  );
}
