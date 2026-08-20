import { Settings } from "lucide-react";

export const metadata = { title: "ตั้งค่าระบบ" };

/**
 * Placeholder — the sidebar links here but the Figma file has no
 * `settings` frame. Replace once the screen is designed.
 */
export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-card px-6 py-24 text-center">
      <Settings className="size-10 text-muted-foreground" aria-hidden />
      <p className="text-sm font-bold">ตั้งค่าระบบ</p>
      <p className="text-xs text-muted-foreground">
        หน้านี้ยังไม่มีแบบใน Figma — รอแบบจากทีมออกแบบ
      </p>
    </div>
  );
}
