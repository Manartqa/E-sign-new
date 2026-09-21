"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  FileKey2,
  ImagePlus,
  Loader2,
  ShieldCheck,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  ErrorState,
  FormSection,
  LabeledSelect,
  LoadingState,
  SearchableSelect,
} from "@/components/common";
import { usePersonTypes, usePrefixes } from "@/hooks/master";
import { usePositions, useSigner, useSignerActions } from "@/hooks/signers";
import { formatThaiDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  SIGNING_METHOD,
  type CertificateCheckResult,
  type Signer,
  type SignerInput,
} from "@/types/app/signers";
import {
  APPROVAL_LEVEL_OPTIONS,
  SIGNING_METHOD_OPTIONS,
  isValidEmail,
  isValidNationalId,
} from "./Signer.config";

const FIELD =
  "h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-brand-navy-mid aria-invalid:border-destructive";
const TEXTAREA = `${FIELD} h-auto min-h-28 py-2.5`;
const SELECT_TRIGGER = "bg-white data-[size=default]:h-11";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

type Fields = Omit<SignerInput, "certificate" | "signatureImage">;

const EMPTY_FIELDS: Fields = {
  personType: "SIGNER",
  approvalLevel: "",
  isActive: true,
  prefix: "",
  firstName: "",
  lastName: "",
  nationalId: "",
  email: "",
  position: "",
  note: "",
  signingMethod: SIGNING_METHOD.USB_TOKEN,
};

function Field({
  id,
  label,
  required,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string | false;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/**
 * ตั้งค่าระบบ › เพิ่ม / แก้ไขผู้มีอำนาจลงนาม — not in Figma; the legacy
 * ผู้ตรวจสอบ form's fields regrouped into cards. Loads the signer first (edit),
 * then mounts the form with it as initial state.
 *
 * Lives inside the list's SideDrawer, which carries the title and the way
 * back: the form has no heading of its own and closes through `onDone`.
 */
export default function SignerFormContent({
  id,
  onDone,
}: {
  id?: string;
  onDone: () => void;
}) {
  const { signer, isLoading, isError } = useSigner(id ?? "");

  if (id && isError) return <ErrorState />;
  if (id && isLoading) return <LoadingState rows={6} />;
  if (id && !signer)
    return (
      <ErrorState
        title="ไม่พบผู้มีอำนาจลงนามนี้"
        description={`ไม่พบรหัส ${id} ในระบบ`}
      />
    );

  return (
    <SignerForm key={id ?? "new"} signer={signer ?? undefined} onDone={onDone} />
  );
}

function SignerForm({
  signer,
  onDone,
}: {
  signer?: Signer;
  onDone: () => void;
}) {
  const { create, update, checkCertificate } = useSignerActions();
  const { positions, isLoading: positionsLoading } = usePositions();
  const { options: personTypes } = usePersonTypes();
  const { options: prefixes } = usePrefixes();
  const [form, setForm] = useState<Fields>(() => {
    if (!signer) return EMPTY_FIELDS;
    const keys = Object.keys(EMPTY_FIELDS) as (keyof Fields)[];
    return Object.fromEntries(keys.map((key) => [key, signer[key]])) as Fields;
  });
  const [submitted, setSubmitted] = useState(false);

  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPin, setCertPin] = useState("");
  const [certCheck, setCertCheck] = useState<CertificateCheckResult | null>(null);
  const certInput = useRef<HTMLInputElement>(null);

  /** undefined = keep the saved image, null = remove it */
  const [signatureImage, setSignatureImage] = useState<File | null>();
  const [signaturePreview, setSignaturePreview] = useState(
    signer?.signatureImageUrl ?? null,
  );
  const imageInput = useRef<HTMLInputElement>(null);

  const isEdit = Boolean(signer);
  const saving = create.isPending || update.isPending;
  const set = <K extends keyof Fields>(key: K, value: Fields[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const usesCertFile = form.signingMethod === SIGNING_METHOD.CERTIFICATE_FILE;
  const errors = {
    prefix: !form.prefix && "กรุณาเลือกคำนำหน้าชื่อ",
    firstName: !form.firstName.trim() && "กรุณากรอกชื่อ",
    lastName: !form.lastName.trim() && "กรุณากรอกนามสกุล",
    nationalId:
      form.nationalId !== "" &&
      !isValidNationalId(form.nationalId) &&
      "เลขที่บัตรประชาชนไม่ถูกต้อง",
    email:
      form.email.trim() !== "" &&
      !isValidEmail(form.email.trim()) &&
      "รูปแบบอีเมลไม่ถูกต้อง",
    certificate:
      usesCertFile &&
      (certFile
        ? !certCheck?.valid && "กรุณาตรวจสอบ Certificate ให้ผ่านก่อนบันทึก"
        : !signer?.certificateFileName && "กรุณาเลือกไฟล์ Certificate"),
  };
  const show = (error: string | false) => submitted && error;

  // any change to the file or PIN voids an earlier check
  const changeCertificate = (file: File | null, pin: string) => {
    setCertFile(file);
    setCertPin(pin);
    setCertCheck(null);
  };

  const runCertificateCheck = async () => {
    if (!certFile || !certPin) return;
    try {
      setCertCheck(
        await checkCertificate.mutateAsync({ file: certFile, pin: certPin }),
      );
    } catch {
      toast.error("ตรวจสอบ Certificate ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์ PNG หรือ JPG");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("ไฟล์รูปต้องมีขนาดไม่เกิน 2 MB");
      return;
    }
    setSignatureImage(file);
    const reader = new FileReader();
    reader.onload = () => setSignaturePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) {
      toast.error("กรุณากรอกข้อมูลให้ครบและถูกต้อง");
      return;
    }
    const input: SignerInput = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      position: form.position.trim(),
      note: form.note.trim(),
      ...(usesCertFile && certFile && {
        certificate: { file: certFile, pin: certPin },
      }),
      ...(signatureImage !== undefined && { signatureImage }),
    };
    try {
      if (signer) await update.mutateAsync({ id: signer.id, input });
      else await create.mutateAsync(input);
      toast.success(isEdit ? "บันทึกการแก้ไขแล้ว" : "เพิ่มผู้มีอำนาจลงนามแล้ว");
      onDone();
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4" noValidate>
      <FormSection title="การใช้งาน">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <LabeledSelect
            label="ประเภทบุคคล"
            required
            value={form.personType}
            options={personTypes}
            onChange={(v) => set("personType", v)}
            triggerClassName={SELECT_TRIGGER}
          />
          <LabeledSelect
            label="ระดับการอนุมัติ"
            value={form.approvalLevel}
            options={APPROVAL_LEVEL_OPTIONS}
            onChange={(v) => set("approvalLevel", v)}
            triggerClassName={cn(SELECT_TRIGGER, !form.approvalLevel && "text-slate-400")}
            // 20 options: show 10 rows (28px each) and scroll the rest
            contentClassName="max-h-[min(var(--available-height),17.5rem)] [scrollbar-width:thin]"
          />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border bg-white p-4">
          <div className="flex flex-col gap-0.5">
            <span id="signer-active-label" className="text-sm font-medium">
              ใช้งาน
            </span>
            <span className="text-xs text-muted-foreground">
              ปิดไว้ถ้าไม่ต้องการให้เลือกใส่ในกระบวนการลงนามได้
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            aria-labelledby="signer-active-label"
            onClick={() => set("isActive", !form.isActive)}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors",
              form.isActive ? "bg-action-approve" : "bg-slate-300",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                form.isActive && "translate-x-5",
              )}
            />
          </button>
        </div>
      </FormSection>

      <FormSection title="ข้อมูลบุคคล">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr_1fr]">
          <Field id="signer-prefix" label="คำนำหน้าชื่อ" required error={show(errors.prefix)}>
            <SearchableSelect
              id="signer-prefix"
              value={form.prefix}
              options={prefixes}
              onChange={(v) => set("prefix", v)}
              placeholder="เลือกคำนำหน้า"
              searchPlaceholder="ค้นหาคำนำหน้าชื่อ"
              invalid={Boolean(show(errors.prefix))}
            />
          </Field>
          <Field id="signer-first-name" label="ชื่อ" required error={show(errors.firstName)}>
            <input
              id="signer-first-name"
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              aria-invalid={Boolean(show(errors.firstName)) || undefined}
              className={FIELD}
            />
          </Field>
          <Field id="signer-last-name" label="นามสกุล" required error={show(errors.lastName)}>
            <input
              id="signer-last-name"
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              aria-invalid={Boolean(show(errors.lastName)) || undefined}
              className={FIELD}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field id="signer-national-id" label="เลขที่บัตรประชาชน" error={show(errors.nationalId)}>
            <input
              id="signer-national-id"
              value={form.nationalId}
              onChange={(e) =>
                set("nationalId", e.target.value.replace(/\D/g, "").slice(0, 13))
              }
              inputMode="numeric"
              placeholder="13 หลัก"
              aria-invalid={Boolean(show(errors.nationalId)) || undefined}
              className={FIELD}
            />
          </Field>
          <Field id="signer-email" label="อีเมล" error={show(errors.email)}>
            <input
              id="signer-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@example.go.th"
              aria-invalid={Boolean(show(errors.email)) || undefined}
              className={FIELD}
            />
          </Field>
          <Field id="signer-position" label="ตำแหน่ง" className="md:col-span-2">
            <SearchableSelect
              id="signer-position"
              value={form.position}
              options={positions.map((p) => ({ value: p, label: p }))}
              onChange={(v) => set("position", v)}
              placeholder="เลือกตำแหน่ง"
              searchPlaceholder="ค้นหาตำแหน่ง"
              isLoading={positionsLoading}
            />
          </Field>
          <Field id="signer-note" label="หมายเหตุ" className="md:col-span-2">
            <textarea
              id="signer-note"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              className={TEXTAREA}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="การลงลายมือชื่อ">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm font-medium">
            วิธีลงลายเซ็นต์<span className="ml-1 text-destructive">*</span>
          </legend>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {SIGNING_METHOD_OPTIONS.map((option) => {
              const checked = form.signingMethod === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 transition-colors has-focus-visible:border-brand-navy-mid",
                    checked
                      ? "border-brand-navy-mid bg-brand-navy-mid/5"
                      : "hover:bg-secondary",
                  )}
                >
                  <input
                    type="radio"
                    name="signing-method"
                    value={option.value}
                    checked={checked}
                    onChange={() => set("signingMethod", option.value)}
                    className="mt-0.5 size-4 accent-brand-navy-mid"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {usesCertFile && (
          <div className="flex flex-col gap-4 rounded-xl border bg-secondary/40 p-4">
            {signer?.certificateFileName && !certFile && (
              <p className="flex items-center gap-2 text-sm text-foreground">
                <FileKey2 className="size-4 text-brand-navy-mid" aria-hidden />
                ใบรับรองปัจจุบัน: <span className="font-semibold">{signer.certificateFileName}</span>
                <span className="text-xs text-muted-foreground">(อัปโหลดไฟล์ใหม่เพื่อแทนที่)</span>
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px_auto] md:items-start">
              <Field id="signer-cert-file" label="Certificate File" required={!signer?.certificateFileName}>
                <input
                  ref={certInput}
                  id="signer-cert-file"
                  type="file"
                  accept=".p12,.pfx"
                  className="sr-only"
                  onChange={(e) => changeCertificate(e.target.files?.[0] ?? null, certPin)}
                />
                <button
                  type="button"
                  onClick={() => certInput.current?.click()}
                  aria-invalid={Boolean(show(errors.certificate)) && !certFile || undefined}
                  className={cn(FIELD, "flex items-center gap-2 text-left")}
                >
                  <Upload className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className={cn("truncate", !certFile && "text-slate-400")}>
                    {certFile?.name ?? "เลือกไฟล์ .p12 หรือ .pfx"}
                  </span>
                </button>
              </Field>
              <Field id="signer-cert-pin" label="Certificate PIN">
                <input
                  id="signer-cert-pin"
                  type="password"
                  autoComplete="new-password"
                  value={certPin}
                  onChange={(e) => changeCertificate(certFile, e.target.value)}
                  disabled={!certFile}
                  className={cn(FIELD, "disabled:bg-secondary")}
                />
              </Field>
              {/* the spacer label keeps this cell the same shape as the two
                  beside it, so the row stays on one line whatever grows */}
              <div className="flex flex-col gap-1.5">
                <span className="hidden text-sm font-medium md:block" aria-hidden>
                  &nbsp;
                </span>
                <button
                  type="button"
                  onClick={() => void runCertificateCheck()}
                  disabled={!certFile || !certPin || checkCertificate.isPending}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-brand-navy-mid px-4 text-sm font-semibold whitespace-nowrap text-brand-navy-mid hover:bg-white disabled:opacity-50"
                >
                  {checkCertificate.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <ShieldCheck className="size-4" aria-hidden />
                  )}
                  ตรวจสอบ Certificate
                </button>
              </div>
            </div>
            {certCheck && (
              <p
                role="status"
                className={cn(
                  "flex items-center gap-2 text-sm",
                  certCheck.valid ? "text-status-approved-fg" : "text-destructive",
                )}
              >
                {certCheck.valid ? (
                  <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                ) : (
                  <XCircle className="size-4 shrink-0" aria-hidden />
                )}
                {certCheck.valid
                  ? `ใบรับรองถูกต้อง — ${certCheck.subject} · หมดอายุ ${formatThaiDate(certCheck.validTo!)}`
                  : certCheck.reason === "PIN"
                    ? "PIN ไม่ถูกต้อง กรุณากรอกใหม่อีกครั้ง"
                    : certCheck.reason === "FILE"
                      ? "ไฟล์ใบรับรองไม่ถูกต้องหรือเสียหาย กรุณาเลือกไฟล์ใหม่"
                      : "ไม่สามารถเปิดใบรับรองได้ ตรวจสอบไฟล์หรือ PIN อีกครั้ง"}
              </p>
            )}
            {show(errors.certificate) && (
              <p className="text-xs text-destructive">{errors.certificate}</p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">รูปลายเซ็นต์</span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed bg-white sm:w-72">
              {signaturePreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- data / blob URL
                <img
                  src={signaturePreview}
                  alt="รูปลายเซ็นต์"
                  className="max-h-full max-w-full object-contain p-2"
                />
              ) : (
                <span className="text-xs text-muted-foreground">ยังไม่มีรูปลายเซ็นต์</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={imageInput}
                type="file"
                accept="image/png,image/jpeg"
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => {
                  pickImage(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => imageInput.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-brand-navy-mid px-4 py-2 text-sm font-semibold text-brand-navy-mid hover:bg-secondary"
                >
                  <ImagePlus className="size-4" aria-hidden />
                  {signaturePreview ? "เปลี่ยนรูป" : "เลือกรูปลายเซ็นต์"}
                </button>
                {signaturePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureImage(null);
                      setSignaturePreview(null);
                    }}
                    aria-label="ลบรูปลายเซ็นต์"
                    title="ลบรูป"
                    className="rounded-lg p-2 text-action-reject hover:bg-action-reject/10"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                PNG หรือ JPG ไม่เกิน 2 MB แนะนำพื้นหลังโปร่งใส
              </span>
            </div>
          </div>
        </div>
      </FormSection>

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
