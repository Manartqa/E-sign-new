"use client";

import {
  AlertCircle,
  Calendar,
  Clock,
  Lock,
  Mail,
  Pencil,
  Phone,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ErrorState, LoadingState } from "@/components/common";
import { useProfile } from "@/hooks/profile";
import {
  formatPhone,
  formatThaiLongDate,
  formatThaiLongDateTime,
  maskEmail,
  maskPhone,
} from "@/lib/format";
import { ProfileField } from "./ProfileField";

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

  if (isError) return <ErrorState />;
  if (isLoading || !profile) return <LoadingState rows={6} />;

  const notImplemented = (what: string) =>
    toast.info(`${what} — ยังไม่มีแบบใน Figma`);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-foreground">โปรไฟล์ผู้ใช้งาน</h1>
        <p className="text-sm text-muted-foreground">แสดงโปรไฟล์ผู้ใช้งาน</p>
      </div>

      <section className="flex flex-wrap items-center gap-5 rounded-xl border bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.06)]">
        <Avatar className="size-20">
          <AvatarFallback className="bg-brand-navy-mid text-xl text-white">
            {profile.firstName.slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="text-lg font-bold text-foreground">{profile.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{profile.position}</span>
            <span className="size-1 rounded-[2px] bg-slate-300" />
            <span>{profile.department}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => notImplemented("แก้ไขข้อมูลโปรไฟล์")}
          className="flex items-center gap-2 rounded-lg bg-brand-navy-mid px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-hover"
        >
          <Pencil className="size-3.5" aria-hidden />
          แก้ไขข้อมูล
        </button>
      </section>

      <Card
        icon={<User className="size-4 text-foreground" aria-hidden />}
        title="ข้อมูลส่วนตัว"
      >
        <ProfileField label="ยศ/ตำแหน่ง" required value={profile.prefix} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ProfileField label="ชื่อ" required value={profile.firstName} />
          <ProfileField label="นามสกุล" required value={profile.lastName} />
        </div>

        <ProfileField label="ตำแหน่ง" value={profile.position} />

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
          value={formatPhone(profile.phone)}
          maskedValue={maskPhone(profile.phone)}
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
