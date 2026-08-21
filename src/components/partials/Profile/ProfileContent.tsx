"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Camera,
  Clock,
  Lock,
  Mail,
  Pencil,
  Phone,
  Shield,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ErrorState, LoadingState } from "@/components/common";
import { useProfile, useUpdateProfile } from "@/hooks/profile";
import {
  formatPhone,
  formatThaiLongDate,
  formatThaiLongDateTime,
  maskEmail,
  maskPhone,
} from "@/lib/format";
import { PREFIX_OPTIONS, type UserProfile } from "@/types/app/profile";
import { ProfileField } from "./ProfileField";

type EditableFields = Pick<
  UserProfile,
  "prefix" | "firstName" | "lastName" | "position" | "phone"
> & { avatarUrl?: string };

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      <div className="h-px w-full bg-secondary" />
      {children}
    </section>
  );
}

export default function ProfileContent() {
  const { profile, isLoading, isError } = useProfile();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState<EditableFields | null>(null);
  // saveEditing reads this instead of the closured `form` so it always acts
  // on the value from the render that's actually on screen when clicked
  const formRef = useRef(form);
  formRef.current = form;
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (isError) return <ErrorState />;
  if (isLoading || !profile) return <LoadingState rows={6} />;

  const isEditing = form !== null;

  const startEditing = () =>
    setForm({
      prefix: profile.prefix,
      firstName: profile.firstName,
      lastName: profile.lastName,
      position: profile.position,
      phone: profile.phone,
      avatarUrl: profile.avatarUrl,
    });

  const updateField =
    (field: keyof EditableFields) => (value: string | undefined) =>
      setForm((prev) => (prev ? { ...prev, [field]: value } : prev));

  const handleAvatarFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพ");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateField("avatarUrl")(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveEditing = async () => {
    const current = formRef.current;
    if (!current) return;
    try {
      await updateProfile.mutateAsync({
        ...current,
        name: `${current.prefix}${current.firstName} ${current.lastName}`,
      });
      setForm(null);
      toast.success("บันทึกข้อมูลโปรไฟล์แล้ว");
    } catch {
      toast.error("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const notImplemented = (what: string) =>
    toast.info(`${what} — ยังไม่มีแบบใน Figma`);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-foreground">โปรไฟล์ผู้ใช้งาน</h1>
        <p className="text-sm text-muted-foreground">แสดงโปรไฟล์ผู้ใช้งาน</p>
      </div>

      <section className="flex flex-wrap items-center gap-5 rounded-xl border bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
        <div className="relative shrink-0">
          <Avatar className="size-20">
            {(() => {
              // while editing, `form.avatarUrl` is the only source of truth
              // (it's seeded from profile.avatarUrl at startEditing) — an
              // explicit clear must not fall back to the still-saved value
              const avatarUrl = isEditing ? form?.avatarUrl : profile.avatarUrl;
              return (
                avatarUrl && <AvatarImage src={avatarUrl} alt={profile.name} />
              );
            })()}
            <AvatarFallback className="bg-brand-navy-mid text-xl text-white">
              {profile.firstName.slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          {isEditing && (
            <>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                aria-label="อัปโหลดรูปโปรไฟล์"
                className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border-2 border-white bg-brand-navy-mid text-white hover:bg-brand-navy-hover"
              >
                <Camera className="size-3.5" aria-hidden />
              </button>

              {form?.avatarUrl && (
                <button
                  type="button"
                  onClick={() => {
                    updateField("avatarUrl")(undefined);
                    if (avatarInputRef.current) avatarInputRef.current.value = "";
                  }}
                  aria-label="ลบรูปโปรไฟล์"
                  className="absolute top-0 right-0 flex size-6 items-center justify-center rounded-full border-2 border-white bg-destructive text-white hover:opacity-90"
                >
                  <X className="size-3" aria-hidden />
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="text-lg font-bold text-foreground">{profile.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{profile.position}</span>
            <span className="size-1 rounded-[2px] bg-slate-300" />
            <span>{profile.department}</span>
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setForm(null)}
              disabled={updateProfile.isPending}
              className="flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary disabled:opacity-50"
            >
              <X className="size-3.5" aria-hidden />
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => void saveEditing()}
              disabled={updateProfile.isPending}
              className="flex items-center gap-2 rounded-lg bg-brand-navy-mid px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-hover disabled:opacity-60"
            >
              {updateProfile.isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="flex items-center gap-2 rounded-lg bg-brand-navy-mid px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-hover"
          >
            <Pencil className="size-3.5" aria-hidden />
            แก้ไขข้อมูล
          </button>
        )}
      </section>

      <Card
        icon={<User className="size-4 text-foreground" aria-hidden />}
        title="ข้อมูลส่วนตัว"
      >
        <ProfileField
          label="ยศ/ตำแหน่ง"
          required
          value={form?.prefix ?? profile.prefix}
          editable={isEditing}
          onChange={updateField("prefix")}
          options={PREFIX_OPTIONS}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ProfileField
            label="ชื่อ"
            required
            value={form?.firstName ?? profile.firstName}
            editable={isEditing}
            onChange={updateField("firstName")}
          />
          <ProfileField
            label="นามสกุล"
            required
            value={form?.lastName ?? profile.lastName}
            editable={isEditing}
            onChange={updateField("lastName")}
          />
        </div>

        <ProfileField
          label="ตำแหน่ง"
          value={form?.position ?? profile.position}
          editable={isEditing}
          onChange={updateField("position")}
        />

        <ProfileField
          label="อีเมล"
          required
          icon={<Mail className="size-3.5 text-muted-foreground" aria-hidden />}
          value={profile.email}
          maskedValue={maskEmail(profile.email)}
        />

        <ProfileField
          label="เบอร์โทรศัพท์"
          required
          icon={<Phone className="size-3.5 text-muted-foreground" aria-hidden />}
          value={
            isEditing && form
              ? form.phone
              : formatPhone(profile.phone)
          }
          maskedValue={isEditing ? undefined : maskPhone(profile.phone)}
          editable={isEditing}
          onChange={updateField("phone")}
        />
      </Card>

      <Card
        icon={<Lock className="size-4 text-foreground" aria-hidden />}
        title="การตั้งค่าความปลอดภัย"
      >
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-foreground">รหัสผ่าน</p>
              <p className="text-xs text-muted-foreground">
                เปลี่ยนรหัสผ่านของบัญชีผู้ใช้งาน
              </p>
            </div>
            <button
              type="button"
              onClick={() => notImplemented("เปลี่ยนรหัสผ่าน")}
              className="rounded-lg border border-brand-navy-mid bg-white px-4 py-2 text-[13px] font-semibold text-brand-navy-mid hover:bg-secondary"
            >
              เปลี่ยนรหัสผ่าน
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-[#f8fafc] px-3 py-2.5">
            <Lock className="size-3.5 text-slate-400" aria-hidden />
            <span className="text-[13px] text-slate-400">••••••••</span>
          </div>
        </div>

        <div className="h-px w-full bg-[#f8fafc]" />

        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-foreground">2FA</p>
              <p className="text-xs text-muted-foreground">
                การยืนยันตัวตนแบบสองขั้นตอน
              </p>
            </div>
            <button
              type="button"
              onClick={() => notImplemented("การตั้งค่า 2FA")}
              className="flex items-center gap-2 rounded-lg border border-destructive px-4 py-2 text-[13px] font-semibold text-destructive hover:bg-destructive/5"
            >
              <Shield className="size-4" aria-hidden />
              {profile.twoFactorEnabled ? "จัดการ 2FA" : "เปิดใช้งาน 2FA"}
            </button>
          </div>

          {!profile.twoFactorEnabled && (
            <div className="flex items-center gap-2 rounded-lg bg-[#fef2f2] px-3 py-2">
              <AlertCircle className="size-3.5 text-destructive" aria-hidden />
              <span className="text-xs text-destructive">
                ยังไม่ได้เปิดใช้งาน 2FA กรุณาตั้งค่าเพื่อความปลอดภัย
              </span>
            </div>
          )}
        </div>
      </Card>

      <Card
        icon={<ShieldCheck className="size-4 text-foreground" aria-hidden />}
        title="ข้อมูลบัญชี"
      >
        <ProfileField label="ชื่อผู้ใช้งาน" value={profile.username} copyable />

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted-foreground">
            วันที่สร้างบัญชี
          </span>
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 text-muted-foreground" aria-hidden />
            <span className="text-sm text-foreground">
              {formatThaiLongDate(profile.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] text-muted-foreground">
            เข้าสู่ระบบครั้งล่าสุด
          </span>
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-muted-foreground" aria-hidden />
            <span className="text-sm text-foreground">
              {formatThaiLongDateTime(profile.lastLoginAt)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
